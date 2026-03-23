import { Worker } from "bullmq";

const { default: dbConnect } = await import("../app/api/lib/mongodb.js");
const { default: Post } = await import("../app/api/lib/models/Post.js");
const { postToPlatform } = await import("../app/api/lib/platform-poster.js");
const { getQueueConnection, getSocialQueueName } = await import("../app/api/lib/queue.js");

const queueName = getSocialQueueName();

const worker = new Worker(
  queueName,
  async (job) => {
    const { userId, postId, platform, content } = job.data || {};

    if (!userId || !postId || !platform || !content) {
      throw new Error("Missing required job payload fields");
    }

    await dbConnect();

    const post = await Post.findById(postId);
    if (!post) {
      throw new Error(`Post not found: ${postId}`);
    }

    if (post.status === "published") {
      return { skipped: true, reason: "already_published" };
    }

    post.status = "publishing";
    post.publish_attempts = (post.publish_attempts || 0) + 1;
    post.last_error = "";
    await post.save();

    const result = await postToPlatform(platform, { userId, content });

    post.status = "published";
    post.published_at = new Date();
    post.external_post_id = result?.data?.id || "";
    post.last_error = "";
    await post.save();

    return {
      postId,
      externalPostId: post.external_post_id,
      status: "published",
    };
  },
  {
    connection: getQueueConnection(),
    concurrency: Number(process.env.X_WORKER_CONCURRENCY || 3),
  }
);

worker.on("ready", () => {
  console.log(`[SOCIAL WORKER] ready on queue: ${queueName}`);
});

worker.on("completed", (job, result) => {
  console.log(`[SOCIAL WORKER] completed job ${job.id}`, result || {});
});

worker.on("failed", async (job, error) => {
  console.error(`[SOCIAL WORKER] failed job ${job?.id || "unknown"}`, error?.message || error);

  const postId = job?.data?.postId;
  if (!postId) return;

  try {
    await dbConnect();
    await Post.findByIdAndUpdate(postId, {
      status: "failed",
      last_error: String(error?.message || "Unknown publish error"),
      publish_attempts: Number(job?.attemptsMade || 0),
    });
  } catch (updateError) {
    console.error("[SOCIAL WORKER] failed to update failed post", updateError);
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    console.log(`[SOCIAL WORKER] shutting down (${signal})`);
    await worker.close();
    process.exit(0);
  });
}
