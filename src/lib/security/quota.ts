import "server-only";
import { HttpError } from "../auth";
import { db } from "../db";

// Hard caps far above real family use: they only bound storage abuse by a single account.
export const QUOTA = { persons: 30, memories: 3000, favorites: 3000, voiceRecords: 2000 } as const;

export async function assertPersonQuota(userId: string) {
  if ((await db.person.count({ where: { userId } })) >= QUOTA.persons) throw new HttpError(403, `Можно создать не больше ${QUOTA.persons} архивов`);
}

export async function assertItemQuota(kind: "memories" | "favorites" | "voiceRecords", personId: string) {
  const count =
    kind === "memories"
      ? await db.memory.count({ where: { personId } })
      : kind === "favorites"
        ? await db.favoriteItem.count({ where: { personId } })
        : await db.voiceRecord.count({ where: { personId } });
  if (count >= QUOTA[kind]) throw new HttpError(403, "Достигнут предел записей в этом архиве");
}
