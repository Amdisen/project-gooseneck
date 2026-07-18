import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { RecipeForm } from "../recipe-form";

export default async function NewRecipePage() {
  await requireUser();
  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <Link href="/recipes" className="text-sm text-gray-500 underline">
        ← My recipes
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">New V60 recipe</h1>
      <RecipeForm mode="create" />
    </main>
  );
}
