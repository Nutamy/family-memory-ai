"use client";

import { Coffee, Heart, HelpCircle, Mic, PauseCircle, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const SEEN_KEY = "fm_filling_guide_seen";

const TIPS = [
  { icon: Coffee, title: "Выберите спокойный момент", text: "Отвечайте в хорошем настроении, когда никуда не спешите. Налейте чай и устройтесь поудобнее." },
  { icon: PauseCircle, title: "Устали — отдохните", text: "Каждый ответ сохраняется сразу. Продолжить можно в любой день с того же места — ничего не потеряется." },
  { icon: Heart, title: "Неправильных ответов не бывает", text: "Любой ответ хороший, потому что он ваш. Пишите так, как говорите, — коротко или подробно." },
  { icon: SkipForward, title: "Не обязательно по порядку", text: "Пропускайте вопросы, к которым пока не готовы, и возвращайтесь к ним позже." },
  { icon: Mic, title: "Можно голосом", text: "Не хочется печатать — расскажите. Живой голос сохранит интонации, которые не передаст текст." },
];

/** Short "how to fill in" guide: opens once before the first section, then stays available from the header. */
export function FillingGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch {
      // Storage is unavailable (private mode, blocked site data): the button still works.
    }
  }, []);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {}
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className="focus-ring inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-muted-foreground hover:text-primary">
          <HelpCircle className="size-4" /> Как заполнять
        </button>
      </DialogTrigger>
      <DialogContent title="Перед тем как начать" description="Несколько слов о том, как отвечать легко и с удовольствием.">
        <ul className="space-y-4">
          {TIPS.map((t) => (
            <li key={t.title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-mist text-forest">
                <t.icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{t.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <DialogClose asChild>
          <Button className="mt-7 w-full sm:w-auto" size="lg">
            Понятно, начнём
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
