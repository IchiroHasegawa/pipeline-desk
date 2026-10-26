/**
 * Seeds MongoDB with the reference and demo data.
 *
 *   MONGODB_URI=mongodb://po_mongo:27017/productionos?replicaSet=rs0 \
 *     node --experimental-strip-types scripts/seed-mongo.ts
 *
 * Idempotent — safe to run on every deploy. Creates the indexes first, so a
 * fresh database gets its unique and partial indexes before any row lands.
 */
import { connectMongo, disconnectMongo } from "../lib/db/mongo";
import { syncAllIndexes } from "../lib/models";
import { seedMongo } from "../lib/seed";

async function main(): Promise<void> {
  await connectMongo();

  console.log(">> syncing indexes");
  await syncAllIndexes();

  console.log(">> seeding");
  const { counts, inserted } = await seedMongo();

  for (const [collection, count] of Object.entries(counts)) {
    console.log(`   ${collection.padEnd(22)} ${count}`);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`>> ${total} rows present (${inserted} created this run)`);

  await disconnectMongo();
}

main().catch(async (err) => {
  console.error("seed failed:", err instanceof Error ? err.message : err);
  await disconnectMongo().catch(() => {});
  process.exit(1);
});
