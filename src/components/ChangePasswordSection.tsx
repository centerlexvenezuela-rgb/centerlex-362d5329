import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const ChangePasswordSection = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      return toast.error("La contraseña debe tener al menos 6 caracteres");
    }
    if (password !== confirm) {
      return toast.error("Las contraseñas no coinciden");
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Contraseña actualizada correctamente");
    setPassword("");
    setConfirm("");
  };

  return (
    <Card className="p-6 shadow-elegant">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="h-5 w-5 text-accent" />
        <h2 className="font-serif text-xl">Cambiar contraseña</h2>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
        <div className="space-y-2">
          <Label htmlFor="np1">Nueva contraseña</Label>
          <Input
            id="np1"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="np2">Confirmar contraseña</Label>
          <Input
            id="np2"
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repita la contraseña"
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary-glow">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-3">
        Tras actualizar, su sesión actual continúa activa. Use la nueva contraseña en su próximo inicio de sesión.
      </p>
    </Card>
  );
};
