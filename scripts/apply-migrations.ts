/**
 * Apply SQL migrations to Supabase using the REST API
 * Run with: npx tsx --env-file=.env.local scripts/apply-migrations.ts
 */

import { readFileSync } from "fs";
import { join } from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing env vars");
  process.exit(1);
}

async function runSQL(sql: string, name: string) {
  console.log(`Applying migration: ${name}...`);

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    // Try alternative: use the Supabase management API
    // Fall back to direct postgres REST
    const text = await response.text();
    console.log(`RPC not available (${response.status}), trying direct SQL...`);

    // Use supabase-js to execute SQL via the pg_net extension or management API
    // For now, output the SQL to be run manually
    console.log(`\n--- Please run this SQL in Supabase SQL Editor ---`);
    console.log(`Migration: ${name}`);
    console.log(`URL: ${supabaseUrl.replace('.supabase.co', '.supabase.co')}/project/default/sql`);
    console.log(`---\n`);
    return false;
  }

  console.log(`  ✓ ${name} applied successfully`);
  return true;
}

async function main() {
  const migrationsDir = join(process.cwd(), "supabase", "migrations");

  const migrations = [
    "001_initial_schema.sql",
    "002_seed_data.sql",
  ];

  for (const file of migrations) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    const success = await runSQL(sql, file);

    if (!success) {
      console.log(`\nTo apply migrations manually:`);
      console.log(`1. Go to your Supabase Dashboard → SQL Editor`);
      console.log(`2. Copy and paste the contents of supabase/migrations/${file}`);
      console.log(`3. Click "Run"`);
      console.log(`\nMigration files are at: ${migrationsDir}/`);
      break;
    }
  }
}

main().catch(console.error);
