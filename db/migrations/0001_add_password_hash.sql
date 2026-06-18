-- Migration: add password_hash to users for the login system.
-- Apply to remote:  npx wrangler d1 execute marginalia-db --remote --file=./db/migrations/0001_add_password_hash.sql --yes
ALTER TABLE users ADD COLUMN password_hash TEXT;
