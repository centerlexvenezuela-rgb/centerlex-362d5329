import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBranding } from "@/hooks/useBranding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { KeyRound, Loader2, Scale } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) { setValid(true); setReady(true); }
    });
    supabase.auth.getSession().then(({ data }) => {
      setValid(!!data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("La contraseña debe tener al menos 6 caracteres");
    if (password !== confirm) return toast.error("Las contraseñas no coinciden");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Contraseña actualizada. Inicie sesión con su nueva contraseña.");
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <div className="flex items-center gap-3 mb-6">
          <div className={`h-10 w-10 rounded flex items-center justify-center overflow-hidden ${branding.logo_url ? "" : "bg-gradient-gold shadow-gold"}`}>
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={branding.app_title} className="h-full w-full object-contain" />
            ) : (
              <Scale className="h-5 w-5 text-primary" />
            )}
          </div>
          <h1 className="font-serif text-2xl">{branding.app_title}</h1>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl">Nueva contraseña</h2>
        </div>

        {!ready ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : !valid ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El enlace de recuperación no es válido o ya expiró. Solicite un nuevo enlace desde la
              página de acceso.
            </p>
            <Link to="/auth">
              <Button className="w-full bg-primary hover:bg-primary-glow">Ir al acceso</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rp1">Nueva contraseña</Label>
              <Input
                id="rp1" type="password" required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp2">Confirmar contraseña</Label>
              <Input
                id="rp2" type="password" required minLength={6}
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita la contraseña" autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full bg-primary hover:bg-primary-glow">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar contraseña"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
