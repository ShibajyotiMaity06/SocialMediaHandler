import { Queue } from "bullmq";
import IORedis from "ioredis";

const QUEUE_NAME = process.env.X_QUEUE_NAME || "x-post-queue";

function getRedisConfig() {
  const host = process.env.UPSTASH_REDIS_HOST;
  const port = Number(process.env.UPSTASH_REDIS_PORT);
  const password = process.env.UPSTASH_REDIS_PASSWORD;

  if (host && port && password) {
    return {
      mode: "host",
      host,
      port,
      password,
    };
  }

  const redisUrl = String(process.env.UPSTASH_REDIS_URL || "").trim();
  const hasValidRedisUrl =
    redisUrl.startsWith("redis://") || redisUrl.startsWith("rediss://");

  if (hasValidRedisUrl) {
    return { mode: "url", redisUrl };
  }

  throw new Error(
    "Missing Upstash Redis configuration. Use UPSTASH_REDIS_URL or all of: UPSTASH_REDIS_HOST, UPSTASH_REDIS_PORT, UPSTASH_REDIS_PASSWORD"
  );
}

export function getQueueConnection() {
  if (!globalThis.__xQueueRedis) {
    const config = getRedisConfig();
    if (config.mode === "url") {
      globalThis.__xQueueRedis = new IORedis(config.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });
    } else {
      const redisUrl = `rediss://:${encodeURIComponent(config.password)}@${config.host}:${config.port}`;
      globalThis.__xQueueRedis = new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });
    }
  }
  return globalThis.__xQueueRedis;
}

export function getXPostQueue() {
  if (!globalThis.__xPostQueue) {
    globalThis.__xPostQueue = new Queue(QUEUE_NAME, {
      connection: getQueueConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }

  return globalThis.__xPostQueue;
}

export async function enqueueXPost(jobData, delayMs = 0) {
  const queue = getXPostQueue();
  return queue.add("publish", jobData, {
    delay: Math.max(0, Number(delayMs) || 0),
  });
}

export async function cancelXPostJob(jobId) {
  if (!jobId) return;
  const queue = getXPostQueue();
  const job = await queue.getJob(String(jobId));
  if (job) {
    await job.remove();
  }
}

export function getXQueueName() {
  return QUEUE_NAME;
}