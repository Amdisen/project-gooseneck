import Link from "next/link";
import { login, signup } from "./actions";
import { Container } from "@/components/container";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/alert";

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
    <Container
      width="card"
      className="flex min-h-full flex-col justify-center gap-6 py-16"
    >
      <div className="text-center">
        <p className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Project Gooseneck
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Sign in, or create an account to start saving recipes.
        </p>
      </div>

      {message === "check-email" && (
        <Alert variant="success">
          Almost there — check your email for a confirmation link to finish
          creating your account.
        </Alert>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="p-6">
        <form className="flex flex-col gap-4">
          {redirect && <input type="hidden" name="redirect" value={redirect} />}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              required
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="current-password"
            />
          </div>

          <div className="mt-1 flex flex-col gap-2">
            <Button formAction={login} type="submit">
              Sign in
            </Button>
            <Button formAction={signup} type="submit" variant="secondary">
              Create account
            </Button>
          </div>
        </form>
      </Card>

      <Link
        href="/"
        className="text-center text-sm text-text-secondary hover:text-foreground"
      >
        ← Back home
      </Link>
    </Container>
  );
}
