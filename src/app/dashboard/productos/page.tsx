import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { TablaProductos } from "@/components/productos/TablaProductos";
import { getMiUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ProductosPage() {
  const usuario = await getMiUsuario();
  if (!usuario || usuario.rol !== "dueno") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .order("nombre");

  return (
    <>
      <Header title="Productos" subtitle="Solo el dueño puede gestionar productos" />
      <div className="p-6">
        <TablaProductos productos={productos ?? []} />
      </div>
    </>
  );
}
