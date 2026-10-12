"use client";

import { BookOpen, Clapperboard, Music, Plus, Quote, Sparkles, Trash2, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/client";
import type { FavoriteDTO } from "@/lib/dto";
import { FAVORITE_KINDS, type FavoriteKind } from "@/lib/questionnaire";

const ICONS: Record<FavoriteKind, typeof BookOpen> = {
  books: BookOpen,
  films: Clapperboard,
  music: Music,
  quotes: Quote,
  recipes: UtensilsCrossed,
  traditions: Sparkles,
};

const NOTE_HINT: Record<FavoriteKind, string> = {
  books: "Почему эта книга важна",
  films: "Чем запомнился",
  music: "С чем связана песня",
  quotes: "Автор или откуда она",
  recipes: "Ингредиенты и как готовить",
  traditions: "Как и когда это происходит",
};

export function FavoritesBoard({ personId, initial }: { personId: string; initial: FavoriteDTO[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {FAVORITE_KINDS.map((k) => (
        <FavoriteList
          key={k.kind}
          personId={personId}
          kind={k.kind}
          title={k.title}
          placeholder={k.placeholder}
          items={items.filter((i) => i.kind === k.kind)}
          onAdd={(item) => {
            setItems((l) => [...l, item]);
            router.refresh();
          }}
          onRemove={(id) => {
            setItems((l) => l.filter((x) => x.id !== id));
            router.refresh();
          }}
        />
      ))}
    </div>
  );
}

function FavoriteList({
  personId,
  kind,
  title,
  placeholder,
  items,
  onAdd,
  onRemove,
}: {
  personId: string;
  kind: FavoriteKind;
  title: string;
  placeholder: string;
  items: FavoriteDTO[];
  onAdd: (i: FavoriteDTO) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const Icon = ICONS[kind];

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      onAdd(await api<FavoriteDTO>(`/api/persons/${personId}/favorites`, { method: "POST", json: { kind, title: name, note } }));
      setName("");
      setNote("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="paper-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-gold/15 text-gold">
          <Icon className="size-5" />
        </span>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <span className="ml-auto text-sm font-bold text-muted-foreground">{items.length}</span>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((i) => (
          <li key={i.id} className="group flex items-start gap-3 rounded-2xl bg-background/60 p-3">
            <div className="min-w-0 flex-1">
              <p className={kind === "quotes" ? "font-serif italic" : "font-semibold"}>{kind === "quotes" ? `«${i.title}»` : i.title}</p>
              {i.note && <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">{i.note}</p>}
            </div>
            <button
              type="button"
              aria-label="Удалить"
              onClick={async () => {
                await api(`/api/persons/${personId}/favorites/${i.id}`, { method: "DELETE" });
                onRemove(i.id);
              }}
              className="rounded-full p-1.5 text-muted-foreground opacity-60 hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 space-y-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} className="h-11" />
        {name && <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={NOTE_HINT[kind]} className="min-h-[70px] text-sm" />}
        <Button type="submit" variant="outline" size="sm" disabled={busy || !name.trim()}>
          <Plus /> Добавить
        </Button>
      </form>
    </section>
  );
}
