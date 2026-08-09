ALTER TABLE "users"
    ADD COLUMN "email_verified_at" TIMESTAMPTZ(6),
    ADD COLUMN "email_verify_token_hash" TEXT;

CREATE UNIQUE INDEX "users_email_verify_token_hash_key" ON "users" ("email_verify_token_hash");
