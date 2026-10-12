import {
  AudioLines,
  Baby,
  Bookmark,
  BookHeart,
  Brain,
  Briefcase,
  Coffee,
  Compass,
  Gem,
  Heart,
  House,
  MailOpen,
  MessagesSquare,
  Mic,
  Mountain,
  Signpost,
  Sun,
  UserRound,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "user-round": UserRound,
  brain: Brain,
  "messages-square": MessagesSquare,
  coffee: Coffee,
  signpost: Signpost,
  house: House,
  heart: Heart,
  baby: Baby,
  sun: Sun,
  "book-heart": BookHeart,
  mic: Mic,
  gem: Gem,
  compass: Compass,
  bookmark: Bookmark,
  mountain: Mountain,
  briefcase: Briefcase,
  "mail-open": MailOpen,
  "audio-lines": AudioLines,
};

export function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? UserRound;
  return <Icon className={className} aria-hidden />;
}
