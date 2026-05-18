import { Header } from "@/components/layout/Header";
import { FormVenta } from "@/components/ventas/FormVenta";
import { createClient } from "@/lib/supabase/server";

export default async function VentasPage() {
  const supabase = await createClient();
  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order('nombre')
    .order('onzas');

  return (
    <>
      <Header title="Nueva venta" />
      <div className="p-6">
        <FormVenta productos={productos ?? []} />
      </div>
    </>
  );
}
