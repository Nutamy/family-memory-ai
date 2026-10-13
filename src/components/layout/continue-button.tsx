"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { listLocalPersons } from "@/lib/local/bundle";
import { moduleHref, personBase } from "@/lib/questionnaire";

/** "Продолжить заполнение": the account's last section, else the newest on-device archive, else sign-in. */
export function ContinueButton({ loggedIn, ...props }: { loggedIn: boolean } & React.ComponentProps<typeof Button>) {
  const router = useRouter();
  async function go() {
    if (loggedIn) return router.push("/continue");
    const person = await listLocalPersons()
      .then((list) => list[0])
      .catch(() => undefined);
    if (!person) return router.push("/start");
    router.push(person.lastSection ? moduleHref(person.id, person.lastSection) : personBase(person.id));
  }
  return <Button type="button" onClick={go} {...props} />;
}
