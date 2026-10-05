/**
 * Generate a scrypt hash for the super-admin password.
 *
 * Usage:
 *   npm run hash-password -- "your-long-password"
 *   node hash-password.js "your-long-password"
 *
 * Paste the printed line into the backend env as SUPER_ADMIN_PASSWORD_HASH.
 * Format: scrypt$N$r$p$saltHex$hashHex (memory-hard, timing-safe verified).
 */
const crypto = require("crypto");

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Use a password of at least 12 characters.");
  process.exit(1);
}

const N = 16384;
const r = 8;
const p = 1;
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 64, { N, r, p });

console.log(`SUPER_ADMIN_PASSWORD_HASH=scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`);
