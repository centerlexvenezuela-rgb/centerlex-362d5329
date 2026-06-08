import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react";
import { VENEZUELA_STATES } from "@/lib/venezuela";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lawyer: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    whatsapp: string | null;
    bar_association: string | null;
    city: string | null;
    state: string | null;
    photo_url: string | null;
  };
  onSaved: () => void;
}

export const EditLawyerDialog = ({ open, onOpenChange, lawyer, onSaved }: Props) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bar, setBar] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFirstName(lawyer.first_name ?? "");
      setLastName(lawyer.last_name ?? "");
      setWhatsapp(lawyer.whatsapp ?? "");
      setBar(lawyer.bar_association ?? "");
      setCity(lawyer.city ?? "");
      setState(lawyer.state ?? "");
      setPhotoUrl(lawyer.photo_url ?? null);
    }
  }, [open, lawyer]);

  const handleUpload = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return toast.error("Formato no permitido (JPG, PNG o WebP)");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("La imagen no puede superar 5 MB");
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `lawyer-photos/${lawyer.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("branding")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("branding").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
    setUploading(false);
    toast.success("Foto cargada");
  };

  const handleSave = async () => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: {
        action: "update_profile",
        user_id: lawyer.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        whatsapp: whatsapp.replace(/\D/g, "") || null,
        bar_association: bar.trim() || null,
        city: city.trim() || null,
        state: state || null,
        photo_url: photoUrl,
      },
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      return toast.error(error?.message ?? (data as any)?.error ?? "Error");
    }
    toast.success("Perfil actualizado");
    onSaved();
    onOpenChange(false);
  };

  const initials =
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "AB";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar abogado</DialogTitle>
          <DialogDescription>{lawyer.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {photoUrl ? <AvatarImage src={photoUrl} alt="Foto" /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
              <Button
                type="button" variant="outline" size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Cambiar foto
              </Button>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG o WebP · máx. 5 MB</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
            <Label>WhatsApp (con código país)</Label>
            <Input
              value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="584141234567"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Colegio de abogados</Label>
            <Input value={bar} onChange={(e) => setBar(e.target.value)} placeholder="Colegio de Abogados del Distrito Capital" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-glow">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
