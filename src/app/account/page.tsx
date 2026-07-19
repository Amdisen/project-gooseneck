import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { signout } from "@/app/login/actions";
import { updateDisplayName } from "./actions";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { List, ListRow } from "@/components/list-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function AccountPage() {
  const user = await requireUser();

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return (
    <Container width="prose" className="flex flex-col gap-8 py-10">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Manage your profile and session."
      />

      <List>
        <ListRow label="Email" description={user.email} />
        <ListRow label="Display name">
          <form action={updateDisplayName} className="flex items-center gap-2">
            <Input
              type="text"
              name="displayName"
              required
              maxLength={80}
              defaultValue={profile?.displayName ?? ""}
              placeholder="Your name"
              aria-label="Display name"
              className="h-9 w-44"
            />
            <Button size="sm" type="submit">
              Save
            </Button>
          </form>
        </ListRow>
        <ListRow
          label="Sign out"
          description="End your session on this device."
        >
          <form action={signout}>
            <Button variant="secondary" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </ListRow>
      </List>
    </Container>
  );
}
