/**
 * Shared Turso (libSQL) client — imported by store.js and db.js.
 *
 * Set these two env vars (from `turso db show --url` and `turso db tokens create`):
 *   TURSO_DATABASE_URL   e.g. libsql://your-db-name-yourname.turso.io
 *   TURSO_AUTH_TOKEN     e.g. eyJhbGci...
 *
 * Runs CREATE TABLE IF NOT EXISTS migrations once on first import.
 */

const { createClient } = require("@libsql/client");

const client = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS installations (
      team_id      TEXT PRIMARY KEY,
      team_name    TEXT,
      bot_token    TEXT NOT NULL,
      bot_user_id  TEXT,
      installed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS requests (
      id                       TEXT NOT NULL,
      team_id                  TEXT NOT NULL,
      requester_id             TEXT NOT NULL,
      shift_details            TEXT NOT NULL,
      candidates               TEXT NOT NULL DEFAULT '[]',
      current_index            INTEGER NOT NULL DEFAULT 0,
      status                   TEXT NOT NULL DEFAULT 'awaiting_names',
      accepted_by              TEXT,
      current_asked_user_id    TEXT,
      current_asked_channel_id TEXT,
      conversation_history     TEXT NOT NULL DEFAULT '[]',
      created_at               TEXT NOT NULL,
      PRIMARY KEY (team_id, id)
    );
  `);
}

module.exports = { client, migrate };
