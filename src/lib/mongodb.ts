import { MongoClient, type Db } from "mongodb";

let clientPromise: Promise<MongoClient> | null = null;
let indexesEnsured = false;

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");

  if (process.env.NODE_ENV === "development") {
    const globalWithMongo = globalThis as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };
    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = new MongoClient(uri).connect();
    }
    return globalWithMongo._mongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db(process.env.MONGODB_DB || "primefx");

  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      db
        .collection("users")
        .createIndexes([
          { key: { username: 1 }, unique: true },
          { key: { email: 1 }, unique: true },
          { key: { mobile: 1 }, unique: true },
          { key: { memberId: 1 }, unique: true },
        ]),
      db.collection("users").createIndex({ sponsorId: 1 }),
      db.collection("deposits").createIndex({ memberId: 1, createdAt: -1 }),
      db.collection("investments").createIndex({ memberId: 1, createdAt: -1 }),
      db.collection("tickets").createIndex({ memberId: 1, createdAt: -1 }),
      db.collection("withdrawals").createIndex({ memberId: 1, type: 1, createdAt: -1 }),
      db.collection("passwordResets").createIndex({ token: 1 }, { unique: true }),
      db.collection("passwordResets").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection("stakes").createIndex({ memberId: 1, createdAt: -1 }),
      db.collection("bonusLedger").createIndex({ memberId: 1, date: -1 }),
      db.collection("bonusLedger").createIndex({ positionId: 1, date: 1 }, { unique: true }),
      db.collection("leadershipLedger").createIndex({ beneficiaryMemberId: 1, date: -1 }),
      db.collection("rewardLedger").createIndex({ memberId: 1, month: 1 }, { unique: true }),
    ]).catch(() => {
      indexesEnsured = false;
    });
  }

  return db;
}
