import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Trash2, ExternalLink, IdCard } from "lucide-react";
import { VENEZUELA_STATES } from "@/lib/venezuela";
import { toast } from "sonner";

const BUCKET = "branding";
const MAX_MB = 5;

/** Extrae la ruta interna del bucket desde una URL pública */
const pathFromPublicUrl = (url: string | null) => {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
};

const DirectoryProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bar, setBar] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, whatsapp, bar_association, city, state, photo_url, directory_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      setLoading(false);
      if (error) return toast.error("No se pudieron cargar sus datos");
      if (!data) return;
      setFirstName(data.first_name ?? "");
      setLastName(data.last_name ?? "");
      setWhatsapp(data.whatsapp ?? "");
      setBar(data.bar_association ?? "");
      setCity(data.city ?? "");
      setState(data.state ?? "");
      setPhotoUrl(data.photo_url ?? null);
      setEnabled(!!data.directory_enabled);
    })();
  }, [user]);

  const removeOldPhoto = async (currentUrl: string | null) => {
    const path = pathFromPublicUrl(currentUrl);
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  };

  const handleUpload = async (file: File) => {
    if (!user) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return toast.error("Formato no permitido (JPG, PNG o WebP)");
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return toast.error(`La imagen no puede superar ${MAX_MB} MB`);
    }
    setUploading(true);
    const previous = photoUrl;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `lawyer-photos/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ photo_url: data.publicUrl })
      .eq("user_id", user.id);
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    await removeOldPhoto(previous);
    setPhotoUrl(data.publicUrl);
    setUploading(false);
    toast.success("Imagen actualizada");
  };

  const handleRemovePhoto = async () => {
    if (!user || !photoUrl) return;
    setUploading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ photo_url: null })
      .eq("user_id", user.id);
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    await removeOldPhoto(photoUrl);
    setPhotoUrl(null);
    setUploading(false);
    toast.success("Imagen eliminada");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        whatsapp: whatsapp.replace(/\D/g, "") || null,
        bar_association: bar.trim() || null,
        city: city.trim() || null,
        state: state || null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Datos del directorio actualizados");
  };

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "AB";

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">Directorio público</p>
        <h1 className="font-serif text-3xl">Mis datos del directorio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Actualice su imagen y datos de contacto. Así lo verán los visitantes del directorio.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link to="/directorio" target="_blank" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
            Ver directorio <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <span className="text-xs rounded-full border border-accent/40 bg-accent/10 px-3 py-1">
            {enabled ? "Publicado en el directorio" : "Pendiente de aprobación del administrador"}
          </span>
        </div>
      </div>

      <Card className="p-6 shadow-elegant space-y-6">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="h-24 w-24">
                {photoUrl ? <AvatarImage src={photoUrl} alt={`Foto o logotipo de ${firstName} ${lastName}`} /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
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
                    {photoUrl ? "Cambiar imagen" : "Subir imagen"}
                  </Button>
                  {photoUrl && (
                    <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={handleRemovePhoto}>
                      <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Fotografía del abogado o logotipo del bufete · JPG, PNG o WebP · máx. {MAX_MB} MB.
                  La imagen anterior se elimina automáticamente.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>WhatsApp (con código de país)</Label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="584141234567"
                inputMode="numeric"
              />
              <p className="text-xs text-muted-foreground">A este número dirigirá el botón de WhatsApp del directorio.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Colegio de abogados</Label>
              <Input value={bar} onChange={(e) => setBar(e.target.value)} placeholder="Colegio de Abogados del Distrito Capital" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Ciudad</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                  <SelectContent>
                    {VENEZUELA_STATES.map((s) => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-glow">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><IdCard className="h-4 w-4 mr-2" /> Guardar cambios</>)}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default DirectoryProfile;
