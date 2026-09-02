import type { Db } from "mongodb";

export async function sumField(
  db: Db,
  collection: string,
  match: Record<string, unknown>,
  field: string
): Promise<number> {
  const result = await db
    .collection(collection)
    .aggregate<{ total: number }>([{ $match: match }, { $group: { _id: null, total: { $sum: `$${field}` } } }])
    .toArray();
  return result[0]?.total ?? 0;
}
