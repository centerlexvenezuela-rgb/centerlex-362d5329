import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShieldCheck, UserPlus, Trash2, LogOut, Loader2 } from "lucide-react";
import { BrandingSection } from "@/components/BrandingSection";
import { ChangePasswordSection } from "@/components/ChangePasswordSection";
import { toast } from "sonner";

interface Lawyer {
  id: string;
  email: string;
  created_at: string;
  role: string | null;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
      body: { action: "create", email, password },
    });
    setCreating(false);
    if (error || data?.error) {
      return toast.error(error?.message ?? data?.error ?? "Error");
    }
    toast.success(`Cuenta creada para ${email}`);
    setEmail(""); setPassword("");
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
        <BrandingSection />
        <ChangePasswordSection />
        {/* Crear nuevo abogado */}
        <Card className="p-6 shadow-elegant">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-xl">Crear cuenta de abogado</h2>
          </div>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
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
            <Button type="submit" disabled={creating} className="bg-primary hover:bg-primary-glow">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
            </Button>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lawyers.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(l.created_at).toLocaleDateString("es-ES")}
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
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </main>
    </div>
  );
};

export default AdminPanel;
