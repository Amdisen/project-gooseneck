import Link from "next/link";
import { login, signup } from "./actions";

type SearchParams = Promise<{
  error?: string;
  message?: string;
  redirect?: string;
}>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, message, redirect } = await searchParams;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Project Gooseneck</h1>
        <p className="text-sm text-gray-500">
          Sign in, or create an account to start saving recipes.
        </p>
      </div>

      {message === "check-email" && (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          Almost there — check your email for a confirmation link to finish
          creating your account.
        </p>
      )}
      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <form className="flex flex-col gap-4">
        {redirect && <input type="hidden" name="redirect" value={redirect} />}

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <div className="flex flex-col gap-2">
          <button
            formAction={login}
            className="rounded bg-gray-900 px-4 py-2 font-medium text-white"
          >
            Sign in
          </button>
          <button
            formAction={signup}
            className="rounded border border-gray-300 px-4 py-2 font-medium"
          >
            Create account
          </button>
        </div>
      </form>

      <Link href="/" className="text-sm text-gray-500 underline">
        ← Back home
      </Link>
    </main>
  );
}
