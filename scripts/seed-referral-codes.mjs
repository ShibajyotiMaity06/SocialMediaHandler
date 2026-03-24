import dbConnect from "../app/api/lib/mongodb.js";
import ReferralCode from "../app/api/lib/models/ReferralCode.js";

const REFERRAL_CODES = [
  "ABCDE",
  "FGHIJ",
  "XQJRV",
  "PKWZM",
  "HYTNL",
  "BDFGU",
  "MSVCE",
  "RWQAO",
  "JLNXP",
  "TGKIB",
  "FYHZD",
  "UMVQS",
];

async function run() {
  await dbConnect();

  const operations = REFERRAL_CODES.map((code) => ({
    updateOne: {
      filter: { code },
      update: {
        $setOnInsert: {
          code,
          owner_label: "",
          discount_percent: 10,
          is_active: true,
          total_redemptions: 0,
          created_by_email: "seed-script",
        },
      },
      upsert: true,
    },
  }));

  const result = await ReferralCode.bulkWrite(operations, { ordered: false });

  console.log("Referral code seed completed");
  console.log(`Inserted: ${result.upsertedCount || 0}`);
  console.log(`Matched existing: ${result.matchedCount || 0}`);

  const total = await ReferralCode.countDocuments();
  console.log(`Total in rferralcodes: ${total}`);
}

run()
  .catch((error) => {
    console.error("Referral code seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      const mongoose = (await import("mongoose")).default;
      await mongoose.connection.close();
    } catch {
      // Ignore close errors.
    }
  });
