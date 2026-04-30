import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, IdCard } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  full_name: string;
  cedula: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

const empty = { full_name: "", cedula: "", phone: "", email: "", address: "", notes: "" };

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setClients(data || []);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ full_name: c.full_name, cedula: c.cedula, phone: c.phone || "", email: c.email || "", address: c.address || "", notes: c.notes || "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.full_name.trim() || !form.cedula.trim()) return toast.error("Nombre y cédula son obligatorios");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { ...form, user_id: user.id };
    const { error } = editing
      ? await supabase.from("clients").update(payload).eq("id", editing.id)
      : await supabase.from("clients").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Cliente actualizado" : "Cliente registrado");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este cliente? Se eliminarán también sus expedientes y escritos.")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Cliente eliminado");
    load();
  };

  const filtered = clients.filter(c =>
    !q || c.full_name.toLowerCase().includes(q.toLowerCase()) || c.cedula.includes(q)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-4xl mb-1">Clientes</h1>
          <p className="text-muted-foreground">Registro de personas que solicitan servicios jurídicos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary hover:bg-primary-glow">
              <Plus className="h-4 w-4 mr-2" /> Nuevo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-serif text-2xl">{editing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre completo *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>Número de cédula *</Label><Input value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>Dirección</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Notas</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} className="bg-primary hover:bg-primary-glow">Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre o cédula..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          {clients.length === 0 ? "Aún no hay clientes registrados." : "Sin resultados."}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="p-5 shadow-card hover:shadow-elegant transition border-l-4 border-l-accent">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-xl truncate">{c.full_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <IdCard className="h-3 w-3" /> {c.cedula}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {c.phone && <div>📞 {c.phone}</div>}
                {c.email && <div className="truncate">✉ {c.email}</div>}
                {c.address && <div className="truncate">📍 {c.address}</div>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clients;
