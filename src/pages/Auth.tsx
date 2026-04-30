import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Scale } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Sesión iniciada");
    navigate("/");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Cuenta creada. Ya puedes ingresar.");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Hero panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, hsl(var(--accent)) 0%, transparent 50%)" }} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded bg-gradient-gold flex items-center justify-center shadow-gold">
              <Scale className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-3xl">Lex Office</h1>
              <p className="text-sm text-primary-foreground/70">Administración Jurídica</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <h2 className="font-serif text-5xl leading-tight mb-4">
            Excelencia<br/><span className="text-accent italic">y rigor</span> al servicio<br/>del derecho.
          </h2>
          <p className="text-primary-foreground/70 max-w-md">
            Gestione clientes, agende audiencias, redacte escritos y consulte un asistente jurídico con inteligencia artificial — todo en un solo lugar.
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/50">© {new Date().getFullYear()} Lex Office</p>
      </div>

      {/* Auth panel */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 shadow-elegant">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded bg-gradient-gold flex items-center justify-center shadow-gold">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-serif text-2xl">Lex Office</h1>
          </div>
          <h2 className="font-serif text-2xl mb-1">Bienvenido</h2>
          <p className="text-sm text-muted-foreground mb-6">Acceda a su despacho digital</p>

          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="le">Email</Label>
                  <Input id="le" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lp">Contraseña</Label>
                  <Input id="lp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-glow">
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="se">Email</Label>
                  <Input id="se" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sp">Contraseña</Label>
                  <Input id="sp" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-glow">
                  {loading ? "Creando..." : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
