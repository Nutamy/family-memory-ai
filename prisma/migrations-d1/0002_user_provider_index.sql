-- Lookup of Google accounts by their id on every sign-in.
CREATE INDEX "User_provider_providerId_idx" ON "User"("provider", "providerId");
