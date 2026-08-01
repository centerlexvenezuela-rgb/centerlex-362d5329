import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Banknote, Check, Loader2, Search, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

interface Payment {
  id: string;
  user_id: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  month: string;
  amount: number;
  reference: string;
  paid_at: string | null;
  reported_at: string;
  status: string;
  confirmed_at: string | null;
}

export const PaymentsAdminSection = () => {
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("reported_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Payment[]);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: "pending" | "confirmed") => {
    const { error } = await supabase
      .from("payments")
      .update({ status, confirmed_at: status === "confirmed" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "confirmed" ? "Pago confirmado" : "Pago marcado como pendiente");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Reporte eliminado");
    load();
  };

  const filtered = rows.filter((r) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return [r.reporter_name, r.reporter_email, r.month, r.reference]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(t));
  });

  const fmt = (v: string | null) =>
    v ? new Date(v).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" }) : "—";

  return (
    <Card className="p-6 shadow-elegant">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl">Reportes de pago</h2>
          <Badge variant="secondary">
            {rows.filter((r) => r.status === "pending").length} pendientes
          </Badge>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre, mes o referencia"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay reportes de pago.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Abogado</TableHead>
                <TableHead>Mes</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Reportado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.reporter_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.reporter_email ?? "—"}</div>
                  </TableCell>
                  <TableCell>{r.month}</TableCell>
                  <TableCell>Bs. {Number(r.amount).toLocaleString("es-VE")}</TableCell>
                  <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                  <TableCell className="text-xs">{fmt(r.paid_at)}</TableCell>
                  <TableCell className="text-xs">{fmt(r.reported_at)}</TableCell>
                  <TableCell>
                    {r.status === "confirmed" ? (
                      <Badge className="bg-primary">Confirmado</Badge>
                    ) : (
                      <Badge variant="outline">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap gap-2 justify-end">
                      {r.status === "pending" ? (
                        <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "confirmed")}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Confirmar
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "pending")}>
                          <Undo2 className="h-3.5 w-3.5 mr-1" /> Revertir
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};
