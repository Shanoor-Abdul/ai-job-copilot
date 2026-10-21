import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error || !user ? null : user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("profiles").select("tech_stack").eq("id", user.id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ techStack: Array.isArray(data?.tech_stack) ? data.tech_stack : [] });
  } catch {
    return NextResponse.json({ error: "Could not load preferences. Apply the profile tech stack migration." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  let body: { techStack?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Array.isArray(body.techStack) || body.techStack.length > 50 || body.techStack.some((item) => typeof item !== "string")) {
    return NextResponse.json({ error: "Provide up to 50 technology names." }, { status: 400 });
  }

  const techStack = [...new Set(
    body.techStack
      .map((item) => item.trim().replace(/\\s+/g, " ").slice(0, 50))
      .filter(Boolean),
  )].slice(0, 50);

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").upsert(
      { id: user.id, tech_stack: techStack },
      { onConflict: "id" },
    );
    if (error) throw error;
    return NextResponse.json({ techStack });
  } catch {
    return NextResponse.json({ error: "Could not save preferences. Apply the profile tech stack migration." }, { status: 503 });
  }
}
