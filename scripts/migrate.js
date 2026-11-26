// Applies prisma/migrations/*/migration.sql in order using the pg driver.
// Works without Prisma's schema engine, so it runs offline.
require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Set DIRECT_URL or DATABASE_URL");
  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query(
    'CREATE TABLE IF NOT EXISTS "_applied_migrations" (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())'
  );
  const dir = path.join(__dirname, "..", "prisma", "migrations");
  const names = fs
    .readdirSync(dir)
    .filter((n) => fs.existsSync(path.join(dir, n, "migration.sql")))
    .sort();
  for (const name of names) {
    const done = await client.query(
      'SELECT 1 FROM "_applied_migrations" WHERE name = $1',
      [name]
    );
    if (done.rowCount) continue;
    const sql = fs.readFileSync(path.join(dir, name, "migration.sql"), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query('INSERT INTO "_applied_migrations"(name) VALUES ($1)', [name]);
      await client.query("COMMIT");
      console.log("applied", name);
    } catch (e) {
      await client.query("ROLLBACK");
      throw new Error(`${name}: ${e.message}`);
    }
  }
  await client.end();
  console.log("migrations up to date");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
