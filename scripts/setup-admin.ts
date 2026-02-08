/**
 * Script to create the initial admin user in Supabase
 * Run with: npx tsx scripts/setup-admin.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Make sure .env.local is loaded");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = "josegarciago27@gmail.com";
  const password = "Sambo5290";
  const nombre = "Jose Garcia";

  console.log(`Creating admin user: ${email}`);

  // Create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.log("User already exists in auth, fetching...");
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find((u) => u.email === email);
      if (existingUser) {
        console.log(`Found existing user: ${existingUser.id}`);
        // Ensure profile exists
        const { error: profileError } = await supabase
          .from("user_profiles")
          .upsert({
            id: existingUser.id,
            nombre,
            email,
            rol: "administrador",
            activo: true,
          });

        if (profileError) {
          console.error("Error creating/updating profile:", profileError.message);
        } else {
          console.log("Admin profile created/updated successfully");
        }
      }
    } else {
      console.error("Error creating user:", authError.message);
    }
    return;
  }

  console.log(`Auth user created: ${authData.user.id}`);

  // Create profile
  const { error: profileError } = await supabase
    .from("user_profiles")
    .insert({
      id: authData.user.id,
      nombre,
      email,
      rol: "administrador",
      activo: true,
    });

  if (profileError) {
    console.error("Error creating profile:", profileError.message);
    return;
  }

  console.log("Admin user created successfully!");
  console.log(`  Email: ${email}`);
  console.log(`  Role: administrador`);
}

main().catch(console.error);
