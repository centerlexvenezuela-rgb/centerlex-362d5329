import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/hooks/useBranding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReportPaymentDialog } from "@/components/ReportPaymentDialog";
import { AlertTriangle, Loader2, LogOut, Scale } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_TEXT =
  "Su cuenta se encuentra temporalmente inactiva. Si ya realizó su pago, repórtelo aquí para que la administración lo verifique y reactive su acceso. También puede escribirnos si necesita ayuda.";

const AccountDisabled = () => {
  const { branding } = useBranding();
  const { signOut, user } = useAuth();
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { data, error } = await supabase.functions.invoke("inactive-contact", {
      body: { ...form, email: user?.email ?? "" },
    });
    setSending(false);
    if (error || data?.error) {
      return toast.error(data?.error ?? error?.message ?? "No se pudo enviar el mensaje");
    }
    toast.success("Mensaje enviado. Le responderemos a la brevedad.");
    setForm({ name: "", phone: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-lg p-8 shadow-elegant">
        <div className="flex items-center gap-3 mb-6">
          <div className={`h-11 w-11 rounded flex items-center justify-center overflow-hidden ${branding.logo_url ? "" : "bg-gradient-gold shadow-gold"}`}>
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={branding.app_title} className="h-full w-full object-contain" />
            ) : (
              <Scale className="h-5 w-5 text-primary" />
            )}
          </div>
          <h1 className="font-serif text-2xl">{branding.app_title}</h1>
        </div>

        <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 mb-6">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h2 className="font-medium mb-1">Cuenta inactiva</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {branding.disabled_account_text?.trim() || DEFAULT_TEXT}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <ReportPaymentDialog trigger={<Button className="bg-primary hover:bg-primary-glow">Reportar mi pago</Button>} />
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
          </Button>
        </div>

        <form onSubmit={send} className="space-y-4 pt-6 border-t">
          <h3 className="font-serif text-lg">¿Necesita ayuda? Escríbanos</h3>
          <div className="space-y-2">
            <Label htmlFor="ad-name">Nombre y apellido</Label>
            <Input id="ad-name" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ad-phone">Teléfono / WhatsApp</Label>
            <Input id="ad-phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ad-msg">Mensaje</Label>
            <Textarea id="ad-msg" rows={4} required value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
          </div>
          <Button type="submit" variant="outline" disabled={sending} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Enviar mensaje
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-accent">Volver al inicio</Link>
        </div>
      </Card>
    </div>
  );
};

export default AccountDisabled;
