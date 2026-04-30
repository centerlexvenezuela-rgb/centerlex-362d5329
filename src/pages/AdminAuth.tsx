import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AdminAuth = () => {
  const navigate = useNavigate();
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
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();
    setLoading(false);

    if (roleData?.role === "admin") {
      toast.success("Bienvenido, administrador");
      navigate("/admin");
    } else {
      await supabase.auth.signOut();
      toast.error("Esta cuenta no tiene privilegios de administrador.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-6">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded bg-gradient-gold flex items-center justify-center shadow-gold">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl">Panel de Administración</h1>
            <p className="text-xs text-muted-foreground">Acceso restringido</p>
          </div>
        </div>

        <form onSubmit={signIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ae">Email del administrador</Label>
            <Input
              id="ae"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ap">Contraseña</Label>
            <Input
              id="ap"
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
            {loading ? "Verificando..." : "Ingresar al panel"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t text-center">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al acceso de abogados
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AdminAuth;
