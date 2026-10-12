"use client";

import { AudioLines, CalendarDays, MapPin, Palette, Plus, Search, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge, type BadgeColor } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { RecordingItem } from "@/components/voice/recording-item";
import { VoiceRecorder } from "@/components/voice/voice-recorder";
import { api } from "@/lib/client";
import type { MemoryDTO, TagDTO } from "@/lib/dto";
import { MEMORY_EMOTIONS, TAG_COLORS } from "@/lib/questionnaire";
import { cn, formatDate } from "@/lib/utils";
import { TagInput } from "./tag-input";

type Draft = Omit<MemoryDTO, "id" | "tags" | "voiceRecords" | "createdAt"> & { tags: string[] };

const EMPTY: Draft = { title: "", content: "", period: "", place: "", people: "", emotion: "", tags: [] };

export function MemoryBoard({ personId, initial }: { personId: string; initial: MemoryDTO[] }) {
  const router = useRouter();
  const [memories, setMemories] = useState(initial);
  const [editing, setEditing] = useState<MemoryDTO | "new" | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const tags = useMemo(() => {
    const map = new Map<string, TagDTO & { count: number }>();
    for (const m of memories) for (const t of m.tags) map.set(t.name, { ...t, count: (map.get(t.name)?.count ?? 0) + 1 });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [memories]);

  const visible = memories.filter(
    (m) =>
      activeTags.every((t) => m.tags.some((x) => x.name === t)) &&
      (!emotion || m.emotion === emotion) &&
      (!query || `${m.title} ${m.content} ${m.place} ${m.people}`.toLowerCase().includes(query.toLowerCase())),
  );

  const upsert = (m: MemoryDTO) => {
    setMemories((list) => (list.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : [m, ...list]));
    router.refresh();
  };

  async function cycleColor(tag: TagDTO) {
    const color = TAG_COLORS[(TAG_COLORS.indexOf(tag.color as (typeof TAG_COLORS)[number]) + 1) % TAG_COLORS.length];
    await api(`/api/persons/${personId}/tags/${tag.id}`, { method: "PATCH", json: { color } });
    setMemories((list) => list.map((m) => ({ ...m, tags: m.tags.map((t) => (t.id === tag.id ? { ...t, color } : t)) })));
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={() => setEditing("new")} size="lg">
          <Plus /> Новое воспоминание
        </Button>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по историям, местам, людям" className="pl-10" />
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Теги · нажмите, чтобы отфильтровать</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => {
              const on = activeTags.includes(t.name);
              return (
                <span key={t.id} className={cn("inline-flex items-center rounded-full transition-all", on && "ring-2 ring-primary ring-offset-2 ring-offset-background")}>
                  <button
                    type="button"
                    onClick={() => setActiveTags((a) => (on ? a.filter((x) => x !== t.name) : [...a, t.name]))}
                    className="rounded-full"
                  >
                    <Badge color={t.color as BadgeColor} className="py-1 pl-3 pr-2 text-sm">
                      #{t.name} <span className="opacity-60">{t.count}</span>
                    </Badge>
                  </button>
                  <button
                    type="button"
                    title="Сменить цвет"
                    onClick={() => cycleColor(t)}
                    className="ml-0.5 rounded-full p-1 text-muted-foreground opacity-40 transition-opacity hover:opacity-100"
                    aria-label={`Сменить цвет тега ${t.name}`}
                  >
                    <Palette className="size-3.5" />
                  </button>
                </span>
              );
            })}
            {(activeTags.length > 0 || emotion) && (
              <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={() => (setActiveTags([]), setEmotion(null))}>
                Сбросить
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {MEMORY_EMOTIONS.filter((e) => memories.some((m) => m.emotion === e)).map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmotion(emotion === e ? null : e)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold transition-colors",
              emotion === e ? "border-gold bg-gold text-white" : "text-muted-foreground hover:border-gold hover:text-foreground",
            )}
          >
            {e}
          </button>
        ))}
      </div>

      {memories.length === 0 ? (
        <div className="mt-10 rounded-3xl border-2 border-dashed p-10 text-center">
          <p className="font-serif text-2xl font-semibold">Здесь будет книга воспоминаний</p>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Запишите первую историю: свадьба родителей, первый школьный день, поездка к морю. Добавьте теги, чтобы потом легко находить.
          </p>
        </div>
      ) : (
        <div className="mt-8 columns-1 gap-5 md:columns-2 [&>*]:mb-5">
          {visible.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setEditing(m)}
              className={cn(
                "paper-card block w-full break-inside-avoid p-6 text-left transition-transform hover:-translate-y-1 hover:rotate-0",
                i % 3 === 0 ? "rotate-[-.6deg]" : i % 3 === 1 ? "rotate-[.5deg]" : "",
              )}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted-foreground">
                {m.period && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" /> {m.period}
                  </span>
                )}
                {m.place && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" /> {m.place}
                  </span>
                )}
                {m.emotion && <Badge color="gold">{m.emotion}</Badge>}
              </div>
              <h3 className="mt-2 text-2xl font-semibold">{m.title}</h3>
              <p className="mt-2 line-clamp-5 whitespace-pre-line leading-relaxed text-foreground/80">{m.content}</p>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {m.tags.map((t) => (
                  <Badge key={t.id} color={t.color as BadgeColor}>
                    #{t.name}
                  </Badge>
                ))}
                {m.voiceRecords.length > 0 && (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-primary">
                    <AudioLines className="size-4" /> {m.voiceRecords.length}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      {memories.length > 0 && visible.length === 0 && <p className="mt-8 text-center text-muted-foreground">Ничего не найдено по выбранным фильтрам.</p>}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <DialogContent title={editing === "new" ? "Новое воспоминание" : "Воспоминание"} description={editing === "new" ? undefined : `Добавлено ${formatDate(editing.createdAt)}`}>
            <MemoryForm
              key={editing === "new" ? "new" : editing.id}
              personId={personId}
              memory={editing === "new" ? null : editing}
              knownTags={tags.map((t) => t.name)}
              onSaved={(m) => {
                upsert(m);
                setEditing(m);
              }}
              onDeleted={(id) => {
                setMemories((l) => l.filter((x) => x.id !== id));
                setEditing(null);
                router.refresh();
              }}
            />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function MemoryForm({
  personId,
  memory,
  knownTags,
  onSaved,
  onDeleted,
}: {
  personId: string;
  memory: MemoryDTO | null;
  knownTags: string[];
  onSaved: (m: MemoryDTO) => void;
  onDeleted: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(memory ? { ...memory, tags: memory.tags.map((t) => t.name) } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  };

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const m = memory
        ? await api<MemoryDTO>(`/api/persons/${personId}/memories/${memory.id}`, { method: "PATCH", json: draft })
        : await api<MemoryDTO>(`/api/persons/${personId}/memories`, { method: "POST", json: draft });
      onSaved(m);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <Label htmlFor="m-title">Название</Label>
        <Input id="m-title" value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Лето у бабушки в деревне" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="m-period">Когда</Label>
          <Input id="m-period" value={draft.period} onChange={(e) => set("period", e.target.value)} placeholder="1961 или «в детстве»" />
        </div>
        <div>
          <Label htmlFor="m-place">Где</Label>
          <Input id="m-place" value={draft.place} onChange={(e) => set("place", e.target.value)} placeholder="Деревня Каменка" />
        </div>
        <div>
          <Label htmlFor="m-people">
            <Users className="mr-1 inline size-3.5" />
            Кто рядом
          </Label>
          <Input id="m-people" value={draft.people} onChange={(e) => set("people", e.target.value)} placeholder="Бабушка Нина" />
        </div>
      </div>
      <div>
        <Label htmlFor="m-content">История</Label>
        <Textarea id="m-content" value={draft.content} onChange={(e) => set("content", e.target.value)} placeholder="Расскажите, что произошло, что вы чувствовали, чем это запомнилось" className="min-h-[180px]" />
      </div>
      <div>
        <Label>Эмоция</Label>
        <div className="flex flex-wrap gap-2">
          {MEMORY_EMOTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => set("emotion", draft.emotion === e ? "" : e)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                draft.emotion === e ? "border-gold bg-gold text-white" : "hover:border-gold",
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Теги</Label>
        <TagInput value={draft.tags} onChange={(t) => set("tags", t)} known={knownTags} />
      </div>
      {error && <p className="text-sm font-semibold text-primary">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Сохраняю…" : memory ? "Сохранить изменения" : "Сохранить воспоминание"}
        </Button>
        {saved && <span className="text-sm font-semibold text-grass">Сохранено</span>}
        {memory && (
          <Button
            type="button"
            variant="danger"
            className="ml-auto"
            onClick={async () => {
              if (!confirm("Удалить воспоминание? Голосовые записи останутся в архиве.")) return;
              await api(`/api/persons/${personId}/memories/${memory.id}`, { method: "DELETE" });
              onDeleted(memory.id);
            }}
          >
            <Trash2 /> Удалить
          </Button>
        )}
      </div>

      {memory ? (
        <div className="space-y-3 rounded-2xl bg-mist/50 p-4">
          <p className="font-semibold">Расскажите эту историю голосом</p>
          <VoiceRecorder
            personId={personId}
            memoryId={memory.id}
            title={memory.title}
            topic="Воспоминание"
            label="Записать рассказ"
            onSaved={(r) => onSaved({ ...memory, voiceRecords: [...memory.voiceRecords, r] })}
          />
          {memory.voiceRecords.map((r) => (
            <RecordingItem
              key={r.id}
              personId={personId}
              record={r}
              showTitle={false}
              onDelete={(id) => onSaved({ ...memory, voiceRecords: memory.voiceRecords.filter((x) => x.id !== id) })}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">После сохранения можно добавить голосовую запись этой истории.</p>
      )}
    </form>
  );
}
