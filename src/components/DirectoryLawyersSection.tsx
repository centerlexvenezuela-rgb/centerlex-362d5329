import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Trash2, Plus, Pencil, X, UserSquare2 } from "lucide-react";
import { VENEZUELA_STATES } from "@/lib/venezuela";
import { toast } from "sonner";

const BUCKET = "branding";
const MAX_MB = 5;

interface DirectoryLawyer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  bar_association: string | null;
  city: string | null;
  state: string | null;
  whatsapp: string | null;
  photo_url: string | null;
  published: boolean;
}

const emptyForm = {
  first_name: "",
  last_name: "",
  bar_association: "",
  city: "",
  state: "",
  whatsapp: "",
  photo_url: null as string | null,
  published: true,
};

const pathFromPublicUrl = (url: string | null) => {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
};

export const DirectoryLawyersSection = () => {
  const [list, setList] = useState<DirectoryLawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("directory_lawyers")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error("No se pudo cargar la lista");
    setList((data as DirectoryLawyer[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (l: DirectoryLawyer) => {
    setForm({
      first_name: l.first_name ?? "",
      last_name: l.last_name ?? "",
      bar_association: l.bar_association ?? "",
      city: l.city ?? "",
      state: l.state ?? "",
      whatsapp: l.whatsapp ?? "",
      photo_url: l.photo_url,
      published: l.published,
    });
    setEditingId(l.id);
    setShowForm(true);
  };

  const handleUpload = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return toast.error("Formato no permitido (JPG, PNG o WebP)");
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return toast.error(`La imagen no puede superar ${MAX_MB} MB`);
    }
    setUploading(true);
    const previous = form.photo_url;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `lawyer-photos/directorio/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const prevPath = pathFromPublicUrl(previous);
    if (prevPath) await supabase.storage.from(BUCKET).remove([prevPath]);
    setForm((f) => ({ ...f, photo_url: data.publicUrl }));
    setUploading(false);
    toast.success("Imagen cargada");
  };

  const handleSave = async () => {
    if (!form.first_name.trim() && !form.last_name.trim()) {
      return toast.error("Indique al menos el nombre del abogado");
    }
    setSaving(true);
    const payload = {
      first_name: form.first_name.trim() || null,
      last_name: form.last_name.trim() || null,
      bar_association: form.bar_association.trim() || null,
      city: form.city.trim() || null,
      state: form.state || null,
      whatsapp: form.whatsapp.replace(/\D/g, "") || null,
      photo_url: form.photo_url,
      published: form.published,
    };
    const { error } = editingId
      ? await supabase.from("directory_lawyers").update(payload).eq("id", editingId)
      : await supabase.from("directory_lawyers").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Abogado actualizado" : "Abogado agregado al directorio");
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    load();
  };

  const togglePublished = async (l: DirectoryLawyer, next: boolean) => {
    setList((prev) => prev.map((x) => (x.id === l.id ? { ...x, published: next } : x)));
    const { error } = await supabase
      .from("directory_lawyers")
      .update({ published: next })
      .eq("id", l.id);
    if (error) {
      setList((prev) => prev.map((x) => (x.id === l.id ? { ...x, published: !next } : x)));
      toast.error(error.message);
    }
  };

  const handleDelete = async (l: DirectoryLawyer) => {
    if (!window.confirm("¿Eliminar este abogado del directorio?")) return;
    const { error } = await supabase.from("directory_lawyers").delete().eq("id", l.id);
    if (error) return toast.error(error.message);
    const p = pathFromPublicUrl(l.photo_url);
    if (p) await supabase.storage.from(BUCKET).remove([p]);
    toast.success("Eliminado");
    load();
  };

  const initialsOf = (a: string | null, b: string | null) =>
    `${a?.[0] ?? ""}${b?.[0] ?? ""}`.toUpperCase() || "AB";

  return (
    <Card className="p-4 sm:p-6 shadow-elegant space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-serif text-xl flex items-center gap-2">
            <UserSquare2 className="h-5 w-5 text-accent" /> Abogados del directorio
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cree y edite fichas de abogados que aparecerán en el directorio público sin tener cuenta
            en el sistema de gestión jurídica. Se muestran igual que los abogados usuarios.
          </p>
        </div>
        {!showForm && (
          <Button onClick={openNew} size="sm" className="bg-primary hover:bg-primary-glow">
            <Plus className="h-4 w-4 mr-2" /> Nuevo abogado
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              {editingId ? "Editar ficha del directorio" : "Nueva ficha del directorio"}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="h-20 w-20">
              {form.photo_url ? (
                <AvatarImage src={form.photo_url} alt={`Foto de ${form.first_name} ${form.last_name}`} />
              ) : null}
              <AvatarFallback>{initialsOf(form.first_name, form.last_name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {form.photo_url ? "Cambiar imagen" : "Subir imagen"}
                </Button>
                {form.photo_url && (
                  <Button
                    type="button" variant="ghost" size="sm"
                    onClick={async () => {
                      const p = pathFromPublicUrl(form.photo_url);
                      if (p) await supabase.storage.from(BUCKET).remove([p]);
                      setForm((f) => ({ ...f, photo_url: null }));
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Quitar
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Fotografía del abogado o logotipo del bufete · JPG, PNG o WebP · máx. {MAX_MB} MB.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Apellido</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Colegio de abogados</Label>
            <Input
              value={form.bar_association}
              onChange={(e) => setForm({ ...form, bar_association: e.target.value })}
              placeholder="Colegio de Abogados del Distrito Capital"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado (zona de ejercicio)</Label>
              <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>
                  {VENEZUELA_STATES.map((s) => (
                    <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>WhatsApp (con código de país)</Label>
            <Input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="584141234567"
              inputMode="numeric"
            />
            <p className="text-xs text-muted-foreground">A este número dirigirá el botón de WhatsApp del directorio.</p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Publicado en el directorio</p>
              <p className="text-xs text-muted-foreground">Si lo desactiva, la ficha no será visible al público.</p>
            </div>
            <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-glow">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Guardar cambios" : "Agregar al directorio"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          Aún no ha agregado abogados al directorio desde el panel.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((l) => (
            <div key={l.id} className="rounded-lg border border-border p-3 flex flex-wrap items-center gap-3">
              <Avatar className="h-12 w-12">
                {l.photo_url ? (
                  <AvatarImage src={l.photo_url} alt={`Foto de ${l.first_name ?? ""} ${l.last_name ?? ""}`} />
                ) : null}
                <AvatarFallback>{initialsOf(l.first_name, l.last_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">
                  {[l.first_name, l.last_name].filter(Boolean).join(" ") || "Sin nombre"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {[l.bar_association, [l.city, l.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "—"}
                </p>
                {l.whatsapp && <p className="text-xs text-muted-foreground">WhatsApp: {l.whatsapp}</p>}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <Switch checked={l.published} onCheckedChange={(v) => togglePublished(l, v)} />
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {l.published ? "Visible" : "Oculto"}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEdit(l)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(l)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
