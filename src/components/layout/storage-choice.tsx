import { Cloud, HardDrive } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    icon: HardDrive,
    title: "На этом устройстве",
    lead: "Без регистрации",
    pros: ["Ничего не нужно вводить — начните сразу", "Ответы и голос не покидают ваш браузер", "Позже можно перенести всё в аккаунт"],
    cons: "Данные видны только в этом браузере: при очистке данных сайта они пропадут. Автоматическая расшифровка и Telegram недоступны.",
  },
  {
    icon: Cloud,
    title: "В аккаунте",
    lead: "Email или Google",
    pros: ["Доступ с телефона, планшета и компьютера", "Хранение в защищённой базе с резервными копиями", "Расшифровка записей и отправка в Telegram"],
    cons: "Нужна регистрация: email и пароль или вход через Google в один клик.",
  },
];

/** The two storage modes side by side; used on the landing page and on /start. */
export function StorageChoice({ loggedIn, className }: { loggedIn: boolean; className?: string }) {
  const ctas = [
    { href: "/local/new", label: "Начать без регистрации", variant: "secondary" as const },
    loggedIn ? { href: "/app/new", label: "Создать в аккаунте", variant: "primary" as const } : { href: "/register", label: "Создать аккаунт", variant: "primary" as const },
  ];
  return (
    <div className={cn("grid gap-5 md:grid-cols-2", className)}>
      {OPTIONS.map((o, i) => (
        <div key={o.title} className="paper-card flex flex-col p-6 text-left sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-mist text-forest">
            <o.icon className="size-6" />
          </span>
          <p className="eyebrow mt-5">{o.lead}</p>
          <h3 className="mt-1 text-2xl font-semibold">{o.title}</h3>
          <ul className="mt-4 space-y-2">
            {o.pros.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="mb-6 mt-4 flex-1 text-sm text-muted-foreground">{o.cons}</p>
          <Button asChild variant={ctas[i].variant} arrow>
            <Link href={ctas[i].href}>{ctas[i].label}</Link>
          </Button>
          {i === 1 && !loggedIn && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="font-bold text-primary hover:underline">
                Войти
              </Link>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
