import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET /api/lab/notes?slug=fanzine-clasico
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const { data, error } = await supabase
    .from("lab_recipe_notes")
    .select("data, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? { data: {}, updated_at: null });
}

// POST /api/lab/notes  { slug, data }
export async function POST(req: Request) {
  const body = await req.json();
  const { slug, data } = body;
  if (!slug || !data) return NextResponse.json({ error: "slug and data required" }, { status: 400 });

  const { error } = await supabase
    .from("lab_recipe_notes")
    .upsert({ slug, data, updated_at: new Date().toISOString() }, { onConflict: "slug" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
