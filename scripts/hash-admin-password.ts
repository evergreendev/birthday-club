import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run admin:hash-password -- <password>");
  process.exit(1);
}

async function main() {
  const hash = await bcrypt.hash(password, 12);
  const escapedForNextEnv = hash.replaceAll("$", "\\$");
  console.log(`Raw hash for hosting env vars:\n${hash}\n`);
  console.log(`Escaped .env value for Next.js:\nADMIN_PASSWORD_HASH="${escapedForNextEnv}"`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
