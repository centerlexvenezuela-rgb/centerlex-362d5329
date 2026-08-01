import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Loader2 } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { toast } from "sonner";

const KEYS = [
  { key: "telegram_payments_token", label: "Bot de pagos — Token" },
  { key: "telegram_payments_chat_id", label: "Bot de pagos — Chat ID" },
  { key: "telegram_signups_token", label: "Bot de registros — Token" },
  { key: "telegram_signups_chat_id", label: "Bot de registros — Chat ID" },
  { key: "telegram_inactive_token", label: "Bot de cuentas inactivas — Token" },
  { key: "telegram_inactive_chat_id", label: "Bot de cuentas inactivas — Chat ID" },
] as const;

export const NotificationSettingsSection = () => {
  const { branding, refresh } = useBranding();
  const [values, setValues] = useState<Record<string, string>>({});
  const [disabledText, setDisabledText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("notification_settings").select("key, value");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r) => { map[r.key] = r.value ?? ""; });
      setValues(map);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    setDisabledText(branding.disabled_account_text ?? "");
  }, [branding.disabled_account_text]);

  const save = async () => {
    setSaving(true);
    for (const { key } of KEYS) {
      const { error } = await supabase
        .from("notification_settings")
        .upsert({ key, value: values[key] ?? "" }, { onConflict: "key" });
      if (error) {
        setSaving(false);
        return toast.error(error.message);
      }
    }
    const { data: row } = await supabase.from("app_settings").select("id").limit(1).maybeSingle();
    if (row) {
      const { error } = await supabase
        .from("app_settings")
        .update({ disabled_account_text: disabledText || null })
        .eq("id", row.id);
      if (error) {
        setSaving(false);
        return toast.error(error.message);
      }
      await refresh();
    }
    setSaving(false);
    toast.success("Configuración de notificaciones guardada");
  };

  return (
    <Card className="p-6 shadow-elegant">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="h-5 w-5 text-accent" />
        <h2 className="font-serif text-xl">Notificaciones y avisos</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Configure los bots de Telegram que reciben los avisos de pagos, registros nuevos y
        contactos de cuentas inactivas.
      </p>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {KEYS.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={values[key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  placeholder={key.endsWith("chat_id") ? "-1001234567890" : "123456:ABC-DEF..."}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="disabled-text">Mensaje para cuentas desactivadas</Label>
            <Textarea
              id="disabled-text"
              rows={4}
              value={disabledText}
              onChange={(e) => setDisabledText(e.target.value)}
              placeholder="Su cuenta se encuentra temporalmente inactiva. Reporte su pago o contáctenos para reactivarla."
            />
          </div>

          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Guardar
          </Button>
        </div>
      )}
    </Card>
  );
};
