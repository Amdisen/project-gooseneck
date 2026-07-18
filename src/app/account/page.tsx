import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { signout } from "@/app/login/actions";
import { updateDisplayName } from "./actions";

export default async function AccountPage() {
  const user = await requireUser();

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
      <Link href="/recipes" className="text-sm text-gray-500 underline">
        ← My recipes
      </Link>
      <h1 className="text-2xl font-semibold">Your account</h1>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="font-medium text-gray-500">Email</dt>
        <dd>{user.email}</dd>
        <dt className="font-medium text-gray-500">Display name</dt>
        <dd>{profile?.displayName ?? "—"}</dd>
      </dl>

      <form action={updateDisplayName} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Update display name</span>
          <input
            type="text"
            name="displayName"
            required
            maxLength={80}
            defaultValue={profile?.displayName ?? ""}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <button className="self-start rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white">
          Save
        </button>
      </form>

      <form action={signout}>
        <button className="rounded border border-gray-300 px-4 py-2 text-sm font-medium">
          Sign out
        </button>
      </form>
    </main>
  );
}
