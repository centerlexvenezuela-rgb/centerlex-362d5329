import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShieldCheck, UserPlus, Trash2, LogOut, Loader2, Sparkles, Calculator, Banknote } from "lucide-react";
import { BrandingSection } from "@/components/BrandingSection";
import { LandingContentSection } from "@/components/LandingContentSection";
import { ContactMessagesSection } from "@/components/ContactMessagesSection";
import { ChangePasswordSection } from "@/components/ChangePasswordSection";
import { FeesAdminSection } from "@/components/FeesAdminSection";
import { PrestacionesAdminSection } from "@/components/PrestacionesAdminSection";
import { BackupSection } from "@/components/BackupSection";
import { toast } from "sonner";

interface Lawyer {
  id: string;
  email: string;
  created_at: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  ai_enabled: boolean;
  fees_enabled: boolean;
  prestaciones_enabled: boolean;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "list" },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setLawyers(data?.users ?? []);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: {
        action: "create",
        email,
        password,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      },
    });
    setCreating(false);
    if (error || data?.error) {
      return toast.error(error?.message ?? data?.error ?? "Error");
    }
    toast.success(`Cuenta creada para ${email}`);
    setEmail(""); setPassword(""); setFirstName(""); setLastName("");
    load();
  };

  const handleDelete = async (id: string, email: string) => {
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "delete", user_id: id },
    });
    if (error || data?.error) {
      return toast.error(error?.message ?? data?.error ?? "Error");
    }
    toast.success(`Cuenta eliminada: ${email}`);
    load();
  };

  const handleToggleAI = async (id: string, next: boolean) => {
    setTogglingId(id);
    setLawyers((prev) => prev.map((l) => (l.id === id ? { ...l, ai_enabled: next } : l)));
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "toggle_ai", user_id: id, ai_enabled: next },
    });
    setTogglingId(null);
    if (error || data?.error) {
      setLawyers((prev) => prev.map((l) => (l.id === id ? { ...l, ai_enabled: !next } : l)));
      return toast.error(error?.message ?? data?.error ?? "Error");
    }
    toast.success(next ? "Asistente IA habilitado" : "Asistente IA deshabilitado");
  };

  const handleToggleFees = async (id: string, next: boolean) => {
    setTogglingId(id);
    setLawyers((prev) => prev.map((l) => (l.id === id ? { ...l, fees_enabled: next } : l)));
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "toggle_fees", user_id: id, fees_enabled: next },
    });
    setTogglingId(null);
    if (error || data?.error) {
      setLawyers((prev) => prev.map((l) => (l.id === id ? { ...l, fees_enabled: !next } : l)));
      return toast.error(error?.message ?? data?.error ?? "Error");
    }
    toast.success(next ? "Calculadora de Honorarios habilitada" : "Calculadora de Honorarios deshabilitada");
  };

  const handleTogglePrestaciones = async (id: string, next: boolean) => {
    setTogglingId(id);
    setLawyers((prev) => prev.map((l) => (l.id === id ? { ...l, prestaciones_enabled: next } : l)));
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "toggle_prestaciones", user_id: id, prestaciones_enabled: next },
    });
    setTogglingId(null);
    if (error || data?.error) {
      setLawyers((prev) => prev.map((l) => (l.id === id ? { ...l, prestaciones_enabled: !next } : l)));
      return toast.error(error?.message ?? data?.error ?? "Error");
    }
    toast.success(next ? "Calculadora de Prestaciones habilitada" : "Calculadora de Prestaciones deshabilitada");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-gradient-gold flex items-center justify-center shadow-gold">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-xl">Panel de Administración</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <ContactMessagesSection />
        <BrandingSection />
        <LandingContentSection />
        <ChangePasswordSection />
        {/* Crear nuevo abogado */}
        <Card className="p-6 shadow-elegant">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-xl">Crear cuenta de abogado</h2>
          </div>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nf">Nombre</Label>
              <Input
                id="nf" type="text"
                value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nl">Apellido</Label>
              <Input
                id="nl" type="text"
                value={lastName} onChange={(e) => setLastName(e.target.value)}
                placeholder="Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ne">Email</Label>
              <Input
                id="ne" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="abogado@despacho.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np">Contraseña inicial</Label>
              <Input
                id="np" type="text" required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={creating} className="bg-primary hover:bg-primary-glow">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
              </Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            Comparta estas credenciales de forma segura con el abogado. Podrá cambiar su contraseña posteriormente.
          </p>
        </Card>

        {/* Lista de abogados */}
        <Card className="p-6 shadow-elegant">
          <h2 className="font-serif text-xl mb-4">Abogados registrados ({lawyers.length})</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : lawyers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aún no hay abogados registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-center">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> Asistente IA
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="inline-flex items-center gap-1">
                        <Calculator className="h-3.5 w-3.5" /> Honorarios
                      </span>
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lawyers.map((l) => {
                    const fullName = [l.first_name, l.last_name].filter(Boolean).join(" ").trim();
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">
                          {fullName || <span className="text-muted-foreground italic">Sin nombre</span>}
                        </TableCell>
                        <TableCell>{l.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(l.created_at).toLocaleDateString("es-ES")}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-2">
                            <Switch
                              checked={l.ai_enabled}
                              disabled={togglingId === l.id}
                              onCheckedChange={(v) => handleToggleAI(l.id, v)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {l.ai_enabled ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-2">
                            <Switch
                              checked={l.fees_enabled}
                              disabled={togglingId === l.id}
                              onCheckedChange={(v) => handleToggleFees(l.id, v)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {l.fees_enabled ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar esta cuenta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará permanentemente la cuenta de <strong>{l.email}</strong> y
                                  todos sus datos asociados (clientes, expedientes, citas y escritos).
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(l.id, l.email)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <FeesAdminSection />

        <BackupSection />
      </main>
    </div>
  );
};

export default AdminPanel;
