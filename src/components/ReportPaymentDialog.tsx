import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const monthOptions = () => {
  const now = new Date();
  const out: string[] = [];
  for (let i = -1; i < 11; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
  }
  return out;
};

interface Props {
  /** true cuando el usuario no está autenticado (landing / login / cuenta inactiva) */
  publicMode?: boolean;
  trigger?: React.ReactNode;
}

export const ReportPaymentDialog = ({ publicMode = false, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [month, setMonth] = useState(monthOptions()[1]);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (publicMode && (!name.trim() || !email.trim())) {
      return toast.error("Indique su nombre y su correo");
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("report-payment", {
      body: {
        month,
        amount: Number(amount),
        reference: reference.trim(),
        paid_at: paidAt || null,
        reporter_name: name.trim() || null,
        reporter_email: email.trim() || null,
      },
    });
    setSaving(false);
    const errMsg = (error as any)?.context?.body
      ? undefined
      : error?.message;
    if (error || data?.error) {
      return toast.error(data?.error ?? errMsg ?? "No se pudo enviar el reporte");
    }
    toast.success("Reporte de pago enviado. Será verificado por la administración.");
    setAmount(""); setReference(""); setPaidAt("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Banknote className="h-4 w-4 mr-2" /> Reportar pago
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Reportar pago</DialogTitle>
          <DialogDescription>
            Informe el pago móvil realizado para mantener su suscripción activa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {publicMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="rp-name">Nombre y apellido</Label>
                <Input id="rp-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rp-email">Correo de su cuenta</Label>
                <Input id="rp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="rp-month">Mes reportado</Label>
            <select
              id="rp-month"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {monthOptions().map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rp-amount">Monto pagado (Bs.)</Label>
            <Input
              id="rp-amount" type="number" step="0.01" min="0.01" required
              value={amount} onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rp-ref">Número de referencia</Label>
            <Input
              id="rp-ref" required value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej. 004512378"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rp-date">Fecha y hora del pago</Label>
            <Input
              id="rp-date" type="datetime-local"
              value={paidAt} onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Enviar reporte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
