import { NextResponse } from "next/server";
import { getMiUsuario, getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getSession();

  if (!user) {
    return NextResponse.json({ user: null, usuario: null });
  }

  const usuario = await getMiUsuario();

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    usuario,
  });
}

export async function DELETE() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
