import { NewPersonScreen } from "@/components/profile/new-person-screen";

export const metadata = { title: "Новый профиль" };

export default function LocalNewPersonPage() {
  return (
    <NewPersonScreen
      endpoint="/api/local/persons"
      note={<p className="mt-4 text-center text-xs text-muted-foreground">Профиль сохранится только в этом браузере. В аккаунт его можно перенести позже.</p>}
    />
  );
}
