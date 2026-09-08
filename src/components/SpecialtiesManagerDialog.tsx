import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { useSpecialties } from "@/hooks/useSpecialties";

interface Props {
  onChanged?: () => void;
}

export const SpecialtiesManagerDialog = ({ onChanged }: Props) => {
  const [open, setOpen] = useState(false);
  const { specialties, loading, reload } = useSpecialties();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    await reload();
    onChanged?.();
  };

  const add = async () => {
    const value = name.trim();
    if (!value) return;
    setSaving(true);
    const { error } = await supabase
      .from("directory_specialties" as any)
      .insert({ name: value, display_order: specialties.length + 1 } as any);
    setSaving(false);
    if (error) return toast.error(error.message.includes("duplicate") ? "Esa especialidad ya existe" : error.message);
    setName("");
    toast.success("Especialidad agregada");
    refresh();
  };

  const remove = async (id: string, label: string) => {
    if (!window.confirm(`¿Eliminar la especialidad "${label}"?`)) return;
    const { error } = await supabase.from("directory_specialties" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Especialidad eliminada");
    refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ListChecks className="h-4 w-4 mr-2" /> Especialidades
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Especialidades jurídicas</DialogTitle>
          <DialogDescription>
            Estas opciones aparecerán en los formularios de los abogados y en el filtro de búsqueda
            del directorio público.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Derecho Migratorio"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          />
          <Button onClick={add} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary-glow">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2 pt-2">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>
          ) : specialties.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Aún no hay especialidades registradas.</p>
          ) : (
            specialties.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                <span className="text-sm truncate">{s.name}</span>
                <Button variant="ghost" size="sm" onClick={() => remove(s.id, s.name)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
