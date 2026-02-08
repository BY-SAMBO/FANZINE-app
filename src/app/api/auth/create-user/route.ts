import { NextResponse } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/utils/errors";
import { ForbiddenError } from "@/lib/utils/errors";

export async function POST(request: Request) {
  try {
    // Check requester is admin
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      throw new ForbiddenError("No autenticado");
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("rol")
      .eq("id", currentUser.id)
      .single();

    if (profile?.rol !== "administrador") {
      throw new ForbiddenError();
    }

    const { email, password, nombre, rol } = await request.json();

    // Create auth user with service role
    const serviceClient = await createServiceClient();
    const { data: newUser, error: authError } =
      await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) throw authError;

    // Create profile
    const { error: profileError } = await serviceClient
      .from("user_profiles")
      .insert({
        id: newUser.user.id,
        nombre,
        email,
        rol,
        activo: true,
      });

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, userId: newUser.user.id });
  } catch (error) {
    return handleApiError(error);
  }
}
