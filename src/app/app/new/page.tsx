import { DecorScatter } from "@/components/decor";
import { NewPersonForm } from "./new-person-form";

export const metadata = { title: "Новый профиль" };

export default function NewPersonPage() {
  return (
    <main className="container relative flex min-h-[calc(100dvh-4rem)] items-center justify-center py-12">
      <DecorScatter />
      <div className="paper-card relative w-full max-w-lg p-7 sm:p-9">
        <p className="eyebrow">Новый профиль</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Чью историю сохраним?</h1>
        <p className="mb-6 mt-2 text-muted-foreground">Остальное заполните позже — всё сохраняется автоматически.</p>
        <NewPersonForm />
      </div>
    </main>
  );
}
