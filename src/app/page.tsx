import Link from "next/link";
import { getUser } from "@/lib/auth";

export default async function Home() {
  const user = await getUser();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">Project Gooseneck ☕</h1>
        <p className="mt-2 text-gray-500">
          Record your V60 pour-over recipes, re-brew them exactly, tweak them,
          and share with friends.
        </p>
      </div>

      {user ? (
        <div className="flex flex-col gap-2 text-sm">
          <p>
            Signed in as <span className="font-medium">{user.email}</span>.
          </p>
          <Link
            href="/account"
            className="self-start rounded bg-gray-900 px-4 py-2 font-medium text-white"
          >
            Go to your account
          </Link>
        </div>
      ) : (
        <Link
          href="/login"
          className="self-start rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Sign in / Create account
        </Link>
      )}
    </main>
  );
}
