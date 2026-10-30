/**
 * Promotes an account to owner.
 *
 *   MONGODB_URI=... npx tsx scripts/grant-owner.ts <email>
 *
 * This is the Mongo equivalent of the raw SQL UPDATE that bootstraps the first
 * owner, and it exists for the same reason: `systemRole` is deliberately
 * unwritable through the app. Under Postgres a trigger reverted client
 * attempts; here the repository layer refuses them. Either way the first owner
 * has to be created out-of-band.
 *
 * Subsequent owners can be promoted in-app by an existing owner, through
 * lib/auth/roles.ts. This script bypasses that check, so it is the one thing
 * here that must stay shell-only.
 */
import { connectMongo, disconnectMongo } from "../lib/db/mongo";
import { Profile } from "../lib/models/Profile";

async function main(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("usage: grant-owner.ts <email>");
    process.exit(2);
  }

  await connectMongo();

  const result = await Profile.updateOne({ email }, { $set: { systemRole: "owner" } });

  if (result.matchedCount === 0) {
    console.error(`no account found for ${email}`);
    await disconnectMongo();
    process.exit(1);
  }

  const profile = await Profile.findOne({ email }).lean();
  console.log(`>> ${email} is now ${profile?.systemRole} (account ${profile?.accountStatus})`);

  await disconnectMongo();
}

main().catch(async (err) => {
  console.error("grant-owner failed:", err instanceof Error ? err.message : err);
  await disconnectMongo().catch(() => {});
  process.exit(1);
});
