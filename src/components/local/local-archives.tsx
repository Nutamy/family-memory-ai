"use client";

import { CloudUpload, HardDrive, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DecorScatter } from "@/components/decor";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArchiveCard, NewArchiveCard } from "@/components/views/archive-card";
import { listLocalPersons, loadLocalBundle, progressInputOf } from "@/lib/local/bundle";
import { useLocalData } from "@/lib/local/client";
import { deleteLocalPerson } from "@/lib/local/db";
import { uploadLocalPerson, type UploadProgress } from "@/lib/local/upload";
import { computeProgress } from "@/lib/progress";
import { LocalLoading } from "./local-gate";

async function loadArchives() {
  const persons = await listLocalPersons();
  const progress = await Promise.all(persons.map(async (p) => computeProgress(progressInputOf((await loadLocalBundle(p.id))!))));
  return persons.map((p, i) => ({ person: p, progress: progress[i] }));
}

export function LocalArchives({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [version, setVersion] = useState(0);
  const archives = useLocalData(`archives:${version}`, loadArchives);
  const [upload, setUpload] = useState<{ id: string; progress: UploadProgress } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ask the browser not to evict this site's storage under disk pressure (it is the only copy).
  useEffect(() => {
    if (archives?.length) void navigator.storage?.persist?.().catch(() => {});
  }, [archives?.length]);

  async function moveToAccount(id: string, name: string) {
    if (!confirm(`Перенести архив «${name}» в аккаунт? Копия на устройстве останется, пока вы её не удалите.`)) return;
    setError(null);
    setUpload({ id, progress: { step: "Подготовка", done: 0, total: 1 } });
    try {
      const res = await uploadLocalPerson(id, (progress) => setUpload({ id, progress }));
      if (res.failed.length) alert(`Архив перенесён, кроме:\n${res.failed.join("\n")}\n\nКопия на устройстве сохранена.`);
      else if (confirm("Архив перенесён в аккаунт. Удалить копию с этого устройства?")) await deleteLocalPerson(id);
      router.push(`/app/p/${res.personId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка переноса");
      setUpload(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Удалить архив «${name}» с этого устройства? Записи и ответы будут потеряны безвозвратно.`)) return;
    await deleteLocalPerson(id);
    setVersion((v) => v + 1);
  }

  if (!archives) return <LocalLoading />;

  return (
    <main className="container relative py-12">
      <DecorScatter variant="quiet" />
      <div className="relative">
        <p className="eyebrow">Без регистрации</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Архивы на этом устройстве</h1>
        <div className="mt-4 flex max-w-2xl gap-3 rounded-2xl bg-mist/70 p-4 text-sm text-forest">
          <HardDrive className="mt-0.5 size-5 shrink-0" />
          <p>
            Ответы, записи и фото хранятся только в этом браузере и никуда не отправляются. Очистка данных сайта, другой браузер или
            другое устройство их не увидят — скачивайте полный архив на экране «Экспорт» или перенесите его в аккаунт.
          </p>
        </div>

        {error && <p className="mt-6 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">{error}</p>}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {archives.map(({ person: p, progress }) => {
            const name = `${p.firstName} ${p.lastName}`.trim();
            const busy = upload?.id === p.id;
            return (
              <ArchiveCard
                key={p.id}
                person={p}
                progress={progress}
                actions={
                  busy ? (
                    <div className="w-full space-y-2 py-1">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Loader2 className="size-4 animate-spin" /> {upload.progress.step}: {upload.progress.done} из {upload.progress.total}
                      </p>
                      <Progress value={(upload.progress.done / upload.progress.total) * 100} />
                    </div>
                  ) : (
                    <>
                      {loggedIn ? (
                        <Button size="sm" variant="secondary" disabled={!!upload} onClick={() => moveToAccount(p.id, name)}>
                          <CloudUpload /> В аккаунт
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" asChild>
                          <Link href="/register?next=/local">
                            <CloudUpload /> Сохранить в аккаунт
                          </Link>
                        </Button>
                      )}
                      <Button size="sm" variant="danger" className="ml-auto" disabled={!!upload} onClick={() => remove(p.id, name)}>
                        <Trash2 /> Удалить
                      </Button>
                    </>
                  )
                }
              />
            );
          })}
          <NewArchiveCard href="/local/new" />
        </div>
      </div>
    </main>
  );
}
