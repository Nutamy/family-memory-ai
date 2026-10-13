import Link from "next/link";
import { Logo } from "@/components/decor";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/** Contact for data requests; CONTACT_EMAIL in wrangler.jsonc vars. */
export const contactEmail = () => process.env.CONTACT_EMAIL?.trim() || null;

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="min-h-dvh">
      <header className="container flex h-20 items-center justify-between">
        <Link href="/" aria-label="На главную">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <article className="container max-w-3xl pb-20 pt-6 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:mt-1.5 [&_p]:mt-4 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
        <h1 className="text-4xl font-semibold sm:text-5xl">{title}</h1>
        <p className="text-sm text-muted-foreground">Редакция от {updated}</p>
        {children}
      </article>
    </main>
  );
}

export function Contact() {
  const email = contactEmail();
  return email ? (
    <a href={`mailto:${email}`} className="font-semibold text-primary hover:underline">
      {email}
    </a>
  ) : (
    <>владельцу сайта</>
  );
}
