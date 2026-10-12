import type { AvatarProvider } from "./types";

// Extension point for animated avatars. Pick a vendor (HeyGen, D-ID) or a
// self-hosted model (SadTalker, LivePortrait) and implement AvatarProvider:
// input is Person.photoKey + a synthesized or recorded voice clip.
export function getAvatarProvider(): AvatarProvider | null {
  return null;
}
