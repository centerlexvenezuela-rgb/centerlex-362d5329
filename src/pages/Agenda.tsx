import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Clock, User } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface Appt {
  id: string; client_id: string | null; title: string; description: string | null;
  appointment_date: string; duration_minutes: number; status: string;
  clients?: { full_name: string; cedula: string } | null;
}

const Agenda = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [appts, setAppts] = useState<Appt[]>([]);
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", title: "", description: "", time: "09:00", duration_minutes: 60 });

  const load = async () => {
    const { data } = await supabase.from("appointments").select("*, clients(full_name, cedula)").order("appointment_date");
    setAppts((data as any) || []);
    const { data: cs } = await supabase.from("clients").select("id, full_name").order("full_name");
    setClients(cs || []);
  };
  useEffect(() => { load(); }, []);

  const dayAppts = appts.filter(a => isSameDay(parseISO(a.appointment_date), date)).sort((a,b) => a.appointment_date.localeCompare(b.appointment_date));
  const datesWithAppts = appts.map(a => parseISO(a.appointment_date));

  const save = async () => {
    if (!form.title.trim()) return toast.error("Título obligatorio");
    const [h, m] = form.time.split(":").map(Number);
    const dt = new Date(date); dt.setHours(h, m, 0, 0);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      client_id: form.client_id || null,
      title: form.title,
      description: form.description || null,
      appointment_date: dt.toISOString(),
      duration_minutes: form.duration_minutes,
    });
    if (error) return toast.error(error.message);
    toast.success("Cita reservada");
    setOpen(false);
    setForm({ client_id: "", title: "", description: "", time: "09:00", duration_minutes: 60 });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Cancelar esta cita?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Cita cancelada");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <h1 className="font-serif text-4xl mb-1">Agenda</h1>
        <p className="text-muted-foreground">Reservación de citas y audiencias</p>
      </div>

      <div className="grid lg:grid-cols-[auto_1fr] gap-6">
        <Card className="p-4 shadow-card h-fit">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            locale={es}
            modifiers={{ hasAppts: datesWithAppts }}
            modifiersClassNames={{ hasAppts: "bg-accent/20 font-bold text-accent-foreground" }}
            className="pointer-events-auto"
          />
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl capitalize">{format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}</h2>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary-glow"><Plus className="h-4 w-4 mr-2" /> Reservar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-serif text-2xl">Nueva cita</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Título / motivo *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div><Label>Cliente</Label>
                    <Select value={form.client_id || undefined} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccione un cliente (opcional)" /></SelectTrigger>
                      <SelectContent>
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fecha</Label><Input value={format(date, "dd/MM/yyyy")} disabled /></div>
                    <div><Label>Hora</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
                  </div>
                  <div><Label>Duración (minutos)</Label><Input type="number" min={15} step={15} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
                  <div><Label>Notas</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={save} className="bg-primary hover:bg-primary-glow">Reservar cita</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {dayAppts.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">No hay citas para este día.</Card>
          ) : (
            <div className="space-y-3">
              {dayAppts.map(a => (
                <Card key={a.id} className="p-4 shadow-card border-l-4 border-l-accent">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-4 flex-1 min-w-0">
                      <div className="text-center">
                        <div className="font-serif text-2xl text-primary">{format(parseISO(a.appointment_date), "HH:mm")}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center"><Clock className="h-3 w-3" />{a.duration_minutes}min</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{a.title}</h3>
                        {a.clients && <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><User className="h-3 w-3" />{a.clients.full_name}</p>}
                        {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(a.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Agenda;
