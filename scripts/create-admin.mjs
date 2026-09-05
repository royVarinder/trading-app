// Seeds (or promotes) an admin account directly in MongoDB — there is no
// admin signup flow by design (admin accounts shouldn't be self-service).
//
// Usage:
//   node --env-file=.env.local scripts/create-admin.mjs <username> <email> <password> [role]
//
// role defaults to "super_admin" for the very first admin account created;
// pass "admin" explicitly for a support/finance-tier account.
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const [, , username, email, password, roleArg] = process.argv;

if (!username || !email || !password) {
  console.error(
    "Usage: node --env-file=.env.local scripts/create-admin.mjs <username> <email> <password> [role]"
  );
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "primefx";
if (!uri) {
  console.error("Missing MONGODB_URI — run with `node --env-file=.env.local scripts/create-admin.mjs ...`");
  process.exit(1);
}

const role = roleArg === "admin" ? "admin" : "super_admin";

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(dbName);
  const admins = db.collection("admins");

  const existing = await admins.findOne({ $or: [{ username }, { email: email.toLowerCase() }] });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    await admins.updateOne({ _id: existing._id }, { $set: { passwordHash, role } });
    console.log(`Updated existing admin "${username}" (role: ${role}).`);
  } else {
    await admins.insertOne({
      username,
      email: email.toLowerCase(),
      passwordHash,
      role,
      createdAt: new Date(),
    });
    console.log(`Created admin "${username}" (role: ${role}).`);
  }

  console.log(`Log in at /admin/login with username "${username}".`);
} finally {
  await client.close();
}
