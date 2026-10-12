"use client";

import { Camera, Loader2, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { SaveIndicator } from "@/components/questionnaire/save-indicator";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { api } from "@/lib/client";
import { useAutosave } from "@/lib/use-autosave";

export interface ProfileValues {
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  residence: string;
  education: string;
  profession: string;
  bio: string;
}

const FIELDS: { key: keyof ProfileValues; label: string; placeholder?: string; type?: string; wide?: boolean }[] = [
  { key: "lastName", label: "Фамилия", placeholder: "Соколова" },
  { key: "firstName", label: "Имя", placeholder: "Анна" },
  { key: "middleName", label: "Отчество", placeholder: "Петровна" },
  { key: "birthDate", label: "Дата рождения", type: "date" },
  { key: "birthPlace", label: "Город рождения", placeholder: "Казань" },
  { key: "residence", label: "Где живёте сейчас", placeholder: "Москва" },
  { key: "profession", label: "Профессия", placeholder: "Учитель литературы" },
  { key: "education", label: "Образование", placeholder: "КГУ, филологический факультет", wide: true },
];

export function ProfileForm({ personId, initial, hasPhoto }: { personId: string; initial: ProfileValues; hasPhoto: boolean }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [photo, setPhoto] = useState(hasPhoto ? `/api/persons/${personId}/photo?v=${Date.now()}` : null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { state, schedule, flush } = useAutosave<ProfileValues>(async (v) => {
    if (!v.firstName.trim()) return; // first name is required by the API
    await api(`/api/persons/${personId}`, { method: "PATCH", json: v });
  });

  const set = (key: keyof ProfileValues, v: string) => {
    const next = { ...values, [key]: v };
    setValues(next);
    schedule(next);
  };

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch(`/api/persons/${personId}/photo`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Не удалось загрузить фото");
      setPhoto(`/api/persons/${personId}/photo?v=${Date.now()}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="paper-card p-5 sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Анкета</h2>
          <p className="text-sm text-muted-foreground">Основные факты биографии</p>
        </div>
        <SaveIndicator state={state} />
      </div>
      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center gap-3">
          {/* Photo in a white "print" frame, like an album card. */}
          <div className="relative aspect-[4/5] w-40 rotate-[-2deg] rounded-xl bg-card p-2 shadow-device">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Фотография" className="size-full rounded-lg object-cover" />
            ) : (
              <div className="grid size-full place-items-center rounded-lg bg-mist text-forest/60">
                <UserRound className="size-14" />
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <div className="flex gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="animate-spin" /> : <Camera />} {photo ? "Заменить" : "Фото"}
            </Button>
            {photo && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Удалить фото"
                onClick={async () => {
                  await api(`/api/persons/${personId}/photo`, { method: "DELETE" });
                  setPhoto(null);
                }}
              >
                <Trash2 />
              </Button>
            )}
          </div>
          {error && <p className="text-center text-xs font-semibold text-primary">{error}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key}
                type={f.type ?? "text"}
                value={values[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => set(f.key, e.target.value)}
                onBlur={() => flush().then(() => router.refresh())}
                required={f.key === "firstName"}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Label htmlFor="bio">Краткая биография</Label>
            <Textarea
              id="bio"
              value={values.bio}
              onChange={(e) => set("bio", e.target.value)}
              onBlur={() => flush().then(() => router.refresh())}
              placeholder="Несколько предложений о жизненном пути"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
