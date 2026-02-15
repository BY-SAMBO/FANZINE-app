import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/lab/notes?slug=fanzine-clasico
export async function GET(req: Request) {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const body = await req.json();
  const { slug, data } = body;
  if (!slug || !data) return NextResponse.json({ error: "slug and data required" }, { status: 400 });

  const { error } = await supabase
    .from("lab_recipe_notes")
    .upsert({ slug, data, updated_at: new Date().toISOString() }, { onConflict: "slug" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
