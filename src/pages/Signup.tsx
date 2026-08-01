import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBranding } from "@/hooks/useBranding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { VENEZUELA_STATES } from "@/lib/venezuela";
import { Scale, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Signup = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    first_name: "", last_name: "", cedula: "", inpreabogado: "",
    bar_number: "", phone: "", state: "", city: "", email: "", password: "",
  });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("signup-lawyer", { body: f });
    if (error || data?.error) {
      setLoading(false);
      return toast.error(data?.error ?? error?.message ?? "No se pudo completar el registro");
    }
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: f.email.trim().toLowerCase(),
      password: f.password,
    });
    setLoading(false);
    if (signInErr) {
      toast.success("Cuenta creada. Ya puede iniciar sesión.");
      return navigate("/auth");
    }
    toast.success("¡Bienvenido! Tiene 7 días de prueba gratuita.");
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 shadow-elegant">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-accent mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className={`h-11 w-11 rounded flex items-center justify-center overflow-hidden ${branding.logo_url ? "" : "bg-gradient-gold shadow-gold"}`}>
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={branding.app_title} className="h-full w-full object-contain" />
            ) : (
              <Scale className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h1 className="font-serif text-2xl">Registro de abogados</h1>
            <p className="text-sm text-muted-foreground">7 días de prueba gratuita en {branding.app_title}</p>
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fn">Nombre</Label>
            <Input id="fn" required value={f.first_name} onChange={set("first_name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ln">Apellido</Label>
            <Input id="ln" required value={f.last_name} onChange={set("last_name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci">Cédula de identidad</Label>
            <Input id="ci" required value={f.cedula} onChange={set("cedula")} placeholder="V-12345678" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inpre">Inpreabogado</Label>
            <Input id="inpre" value={f.inpreabogado} onChange={set("inpreabogado")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bar">N° de inscripción en el Colegio de Abogados</Label>
            <Input id="bar" value={f.bar_number} onChange={set("bar_number")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ph">Teléfono / WhatsApp</Label>
            <Input id="ph" value={f.phone} onChange={set("phone")} placeholder="04141234567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st">Estado</Label>
            <Select value={f.state} onValueChange={(v) => setF((p) => ({ ...p, state: v }))}>
              <SelectTrigger id="st"><SelectValue placeholder="Seleccione" /></SelectTrigger>
              <SelectContent>
                {VENEZUELA_STATES.map((s) => (
                  <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci2">Ciudad</Label>
            <Input id="ci2" value={f.city} onChange={set("city")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="em">Email</Label>
            <Input id="em" type="email" required value={f.email} onChange={set("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw">Contraseña (mín. 6)</Label>
            <Input id="pw" type="password" required minLength={6} value={f.password} onChange={set("password")} />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-glow">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Crear cuenta y comenzar prueba
            </Button>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Al registrarse acepta los{" "}
              <Link to="/terminos" className="underline hover:text-accent">términos y condiciones</Link> y la{" "}
              <Link to="/privacidad" className="underline hover:text-accent">política de privacidad</Link>.
            </p>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              ¿Ya tiene cuenta?{" "}
              <Link to="/auth" className="underline hover:text-accent">Iniciar sesión</Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
