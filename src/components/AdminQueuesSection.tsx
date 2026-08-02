import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Banknote, Check, Loader2, Search, Trash2, Undo2, UserPlus, Inbox } from "lucide-react";
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

export interface QueueLawyer {
  id: string;
  email: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  banned: boolean;
  trial_ends_at: string | null;
  trial_expired: boolean;
  city: string | null;
  state: string | null;
  whatsapp: string | null;
}

const fmt = (v: string | null) =>
  v ? new Date(v).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" }) : "—";

interface Props {
  lawyers: QueueLawyer[];
  loadingLawyers: boolean;
  togglingId: string | null;
  onToggleActive: (id: string, active: boolean) => void;
}

export const AdminQueuesSection = ({
  lawyers, loadingLawyers, togglingId, onToggleActive,
}: Props) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [qr, setQr] = useState("");
  const [openPayments, setOpenPayments] = useState(false);
  const [openSignups, setOpenSignups] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("reported_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setPayments((data ?? []) as Payment[]);
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

  const pending = payments.filter((r) => r.status === "pending");
  const term = q.trim().toLowerCase();
  const filteredPayments = (term
    ? payments.filter((r) =>
        [r.reporter_name, r.reporter_email, r.month, r.reference]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term)))
    : pending);

  const termR = qr.trim().toLowerCase();
  const sortedLawyers = [...lawyers].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const filteredLawyers = termR
    ? sortedLawyers.filter((l) =>
        [l.first_name, l.last_name, l.email, l.city, l.state, l.whatsapp]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(termR)))
    : sortedLawyers;

  const paymentsOf = (l: QueueLawyer) =>
    payments.filter(
      (p) => p.user_id === l.id || (p.reporter_email ?? "").toLowerCase() === l.email.toLowerCase(),
    );

  return (
    <Card className="p-6 shadow-elegant">
      <div className="flex items-center gap-2 mb-1">
        <Inbox className="h-5 w-5 text-accent" />
        <h2 className="font-serif text-xl">Bandeja de verificación</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Revise los nuevos registros y los pagos pendientes uno por uno.
      </p>

      <div className="flex flex-wrap gap-3">
        {/* Nuevos registros */}
        <Dialog open={openSignups} onOpenChange={setOpenSignups}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" /> Nuevos registros
              <Badge variant="secondary">{lawyers.length}</Badge>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Nuevos registros</DialogTitle>
              <DialogDescription>
                Todos los abogados registrados. Verifique el pago y habilite o inhabilite cada cuenta.
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nombre, email o ciudad"
                value={qr}
                onChange={(e) => setQr(e.target.value)}
              />
            </div>

            {loadingLawyers ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : filteredLawyers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay registros.</p>
            ) : (
              <div className="space-y-3">
                {filteredLawyers.map((l) => {
                  const name = [l.first_name, l.last_name].filter(Boolean).join(" ").trim();
                  const own = paymentsOf(l);
                  const confirmed = own.filter((p) => p.status === "confirmed").length;
                  const pend = own.filter((p) => p.status === "pending").length;
                  return (
                    <div key={l.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium break-words">{name || "Sin nombre"}</div>
                          <div className="text-xs text-muted-foreground break-all">{l.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!l.banned}
                            disabled={togglingId === l.id}
                            onCheckedChange={(v) => onToggleActive(l.id, v)}
                          />
                          <span className={`text-xs ${l.banned ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            {l.banned ? "Inhabilitada" : "Habilitada"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">Registro: {fmt(l.created_at)}</Badge>
                        {l.trial_ends_at && (
                          <Badge variant={l.trial_expired ? "destructive" : "secondary"}>
                            {l.trial_expired ? "Prueba vencida" : `Prueba hasta ${fmt(l.trial_ends_at)}`}
                          </Badge>
                        )}
                        {[l.city, l.state].filter(Boolean).length > 0 && (
                          <Badge variant="outline">{[l.city, l.state].filter(Boolean).join(", ")}</Badge>
                        )}
                        <Badge variant="outline">Pagos confirmados: {confirmed}</Badge>
                        {pend > 0 && <Badge>Pagos pendientes: {pend}</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Pagos pendientes */}
        <Dialog open={openPayments} onOpenChange={setOpenPayments}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Banknote className="h-4 w-4" /> Pagos pendientes
              <Badge variant={pending.length > 0 ? "default" : "secondary"}>{pending.length}</Badge>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Pagos pendientes</DialogTitle>
              <DialogDescription>
                Verifique cada referencia y confirme el pago. Use el buscador para ver también los
                pagos ya confirmados.
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nombre, mes o referencia"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : filteredPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay pagos pendientes.</p>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((r) => (
                  <div key={r.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium break-words">{r.reporter_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground break-all">
                          {r.reporter_email ?? "—"}
                        </div>
                      </div>
                      {r.status === "confirmed" ? (
                        <Badge className="bg-primary">Confirmado</Badge>
                      ) : (
                        <Badge variant="outline">Pendiente</Badge>
                      )}
                    </div>
                    <div className="grid gap-1 text-xs sm:grid-cols-2">
                      <div><span className="text-muted-foreground">Mes: </span>{r.month}</div>
                      <div>
                        <span className="text-muted-foreground">Monto: </span>
                        Bs. {Number(r.amount).toLocaleString("es-VE")}
                      </div>
                      <div className="break-all">
                        <span className="text-muted-foreground">Referencia: </span>
                        <span className="font-mono">{r.reference}</span>
                      </div>
                      <div><span className="text-muted-foreground">Pago: </span>{fmt(r.paid_at)}</div>
                      <div><span className="text-muted-foreground">Reportado: </span>{fmt(r.reported_at)}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
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
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
};
