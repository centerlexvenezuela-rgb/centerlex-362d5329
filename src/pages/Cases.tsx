import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface CaseRow {
  id: string; case_number: string; title: string; matter: string | null; status: string;
  client_id: string;
  clients: { full_name: string; cedula: string };
}

const Cases = () => {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ client_id: "", case_number: "", title: "", matter: "", description: "", status: "open" });

  const load = async () => {
    const { data, error } = await supabase.from("cases").select("*, clients(full_name, cedula)").order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setCases((data as any) || []);
    const { data: cs } = await supabase.from("clients").select("id, full_name").order("full_name");
    setClients(cs || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.client_id || !form.case_number || !form.title) return toast.error("Cliente, número y título son obligatorios");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("cases").insert({ ...form, user_id: user.id });
    if (error) return toast.error(error.message);
    toast.success("Expediente creado");
    setOpen(false);
    setForm({ client_id: "", case_number: "", title: "", matter: "", description: "", status: "open" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar expediente y todos sus escritos?")) return;
    const { error } = await supabase.from("cases").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Expediente eliminado");
    load();
  };

  const filtered = cases.filter(c =>
    !q || c.case_number.toLowerCase().includes(q.toLowerCase()) || c.title.toLowerCase().includes(q.toLowerCase()) || c.clients?.full_name.toLowerCase().includes(q.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    open: "bg-accent/20 text-accent-foreground border-accent/30",
    closed: "bg-muted text-muted-foreground",
    archived: "bg-secondary text-secondary-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-4xl mb-1">Expedientes</h1>
          <p className="text-muted-foreground">Casos y escritos jurídicos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-glow"><Plus className="h-4 w-4 mr-2" />Nuevo expediente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif text-2xl">Nuevo expediente</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Cliente *</Label>
                <Select value={form.client_id || undefined} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccione un cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Número de expediente *</Label><Input value={form.case_number} onChange={(e) => setForm({ ...form, case_number: e.target.value })} /></div>
                <div><Label>Estado</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Activo</SelectItem>
                      <SelectItem value="closed">Cerrado</SelectItem>
                      <SelectItem value="archived">Archivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Materia</Label><Input placeholder="Civil, Penal, Laboral..." value={form.matter} onChange={(e) => setForm({ ...form, matter: e.target.value })} /></div>
              <div><Label>Descripción</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} className="bg-primary hover:bg-primary-glow">Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por número, título o cliente..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{cases.length === 0 ? "Aún no hay expedientes." : "Sin resultados."}</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className="p-5 shadow-card hover:shadow-elegant transition border-l-4 border-l-accent flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <FolderOpen className="h-6 w-6 text-accent" />
                <Badge className={statusColor[c.status] || ""} variant="outline">
                  {c.status === "open" ? "Activo" : c.status === "closed" ? "Cerrado" : "Archivado"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground font-mono mb-1">{c.case_number}</div>
              <h3 className="font-serif text-xl mb-1">{c.title}</h3>
              {c.matter && <p className="text-sm text-muted-foreground mb-2">{c.matter}</p>}
              <div className="text-sm text-foreground/80 mb-4">
                <div className="font-medium">{c.clients?.full_name}</div>
                <div className="text-xs text-muted-foreground">Cédula: {c.clients?.cedula}</div>
              </div>
              <div className="flex gap-2 mt-auto">
                <Button asChild className="flex-1 bg-primary hover:bg-primary-glow" size="sm">
                  <Link to={`/expedientes/${c.id}`}>Abrir</Link>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Cases;
