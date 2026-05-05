import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBranding } from "@/hooks/useBranding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Scale, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    // Verificar rol
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();
    setLoading(false);

    if (roleData?.role === "lawyer") {
      toast.success("Sesión iniciada");
      navigate("/app");
    } else {
      await supabase.auth.signOut();
      toast.error("Esta cuenta no tiene acceso de abogado. Contacte al administrador.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-hero text-primary-foreground relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, hsl(var(--accent)) 0%, transparent 50%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded flex items-center justify-center overflow-hidden ${branding.logo_url ? "" : "bg-gradient-gold shadow-gold"}`}>
              {branding.logo_url ? (
                <img src={branding.logo_url} alt={branding.app_title} className="h-full w-full object-contain" />
              ) : (
                <Scale className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <h1 className="font-serif text-3xl">{branding.app_title}</h1>
              <p className="text-sm text-primary-foreground/70">{branding.app_subtitle}</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <h2 className="font-serif text-5xl leading-tight mb-4">
            Excelencia
            <br />
            <span className="text-accent italic">y rigor</span> al servicio
            <br />
            del derecho.
          </h2>
          <p className="text-primary-foreground/70 max-w-md">
            Acceso exclusivo para abogados autorizados por la administración del despacho.
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} {branding.app_title}
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 shadow-elegant">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className={`h-10 w-10 rounded flex items-center justify-center overflow-hidden ${branding.logo_url ? "" : "bg-gradient-gold shadow-gold"}`}>
              {branding.logo_url ? (
                <img src={branding.logo_url} alt={branding.app_title} className="h-full w-full object-contain" />
              ) : (
                <Scale className="h-5 w-5 text-primary" />
              )}
            </div>
            <h1 className="font-serif text-2xl">{branding.app_title}</h1>
          </div>
          <h2 className="font-serif text-2xl mb-1">Acceso de abogados</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Ingrese con las credenciales asignadas por su administrador.
          </p>

          <form onSubmit={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="le">Email</Label>
              <Input
                id="le"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lp">Contraseña</Label>
              <Input
                id="lp"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-glow"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-accent transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Acceso de administrador
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
