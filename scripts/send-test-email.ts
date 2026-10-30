/**
 * Sends ONE real email through Resend, to prove the key, the verified sender
 * domain and the HTTP API path all work before the password-reset flow depends
 * on them.
 *
 *   RESEND_API_KEY=... RESEND_FROM=... APP_URL=... \
 *     npx tsx scripts/send-test-email.ts <recipient>
 *
 * It deliberately goes through `sendPasswordResetEmail`, the same function the
 * reset flow calls, rather than a hand-rolled request — testing the code path
 * rather than something adjacent to it. The link it contains is a dummy token
 * and resolves to nothing.
 */
import { sendPasswordResetEmail } from "../lib/email/resend";

async function main(): Promise<void> {
  const to = process.argv[2]?.trim();
  if (!to) {
    console.error("usage: send-test-email.ts <recipient>");
    process.exit(2);
  }

  for (const name of ["RESEND_API_KEY", "RESEND_FROM"]) {
    if (!process.env[name]) {
      console.error(`missing ${name}`);
      process.exit(2);
    }
  }

  const appUrl = process.env.APP_URL ?? "https://productionos.tneuserver.online";
  console.log(`from: ${process.env.RESEND_FROM}`);
  console.log(`to:   ${to}`);
  console.log(`key:  re_… (${process.env.RESEND_API_KEY!.length} chars)`);

  await sendPasswordResetEmail(to, `${appUrl}/reset-password?token=THIS-IS-A-TEST-TOKEN`);

  console.log("\nResend accepted the message.");
}

main().catch((err) => {
  console.error("\nsend FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
