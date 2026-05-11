import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranding } from "@/hooks/useBranding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Palette, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const BrandingSection = () => {
  const { branding, refresh } = useBranding();
  const [form, setForm] = useState(branding);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "favicon" | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const faviconInput = useRef<HTMLInputElement>(null);

  useEffect(() => { setForm(branding); }, [branding]);

  const upload = async (file: File, kind: "logo" | "favicon") => {
    setUploading(kind);
    const ext = file.name.split(".").pop() || "png";
    const path = `${kind}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("branding")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (upErr) {
      setUploading(null);
      return toast.error(upErr.message);
    }
    const { data } = supabase.storage.from("branding").getPublicUrl(path);
    setForm((f) => ({ ...f, [kind === "logo" ? "logo_url" : "favicon_url"]: data.publicUrl }));
    setUploading(null);
    toast.success(`${kind === "logo" ? "Logo" : "Favicon"} subido`);
  };

  const handleSave = async () => {
    setSaving(true);
    const { landing_content: _omit, ...brandingOnly } = form as any;
    const { data: existing } = await supabase
      .from("app_settings").select("id").limit(1).maybeSingle();
    let error;
    if (existing) {
      ({ error } = await supabase.from("app_settings")
        .update({ ...brandingOnly, updated_at: new Date().toISOString() })
        .eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("app_settings").insert(brandingOnly));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configuración guardada");
    refresh();
  };

  return (
    <Card className="p-6 shadow-elegant">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="h-5 w-5 text-accent" />
        <h2 className="font-serif text-xl">Identidad de la aplicación</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo */}
        <div className="space-y-2">
          <Label>Logotipo</Label>
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center overflow-hidden">
              {form.logo_url ? (
                <img src={form.logo_url} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <input
              ref={logoInput} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "logo")}
            />
            <Button type="button" variant="outline" size="sm"
              onClick={() => logoInput.current?.click()} disabled={uploading === "logo"}>
              {uploading === "logo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Subir logo
            </Button>
            {form.logo_url && (
              <Button type="button" variant="ghost" size="sm"
                onClick={() => setForm((f) => ({ ...f, logo_url: null }))}>
                Quitar
              </Button>
            )}
          </div>
        </div>

        {/* Favicon */}
        <div className="space-y-2">
          <Label>Icono del navegador (favicon)</Label>
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center overflow-hidden">
              {form.favicon_url ? (
                <img src={form.favicon_url} alt="favicon" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <input
              ref={faviconInput} type="file" accept="image/png,image/x-icon,image/svg+xml,image/jpeg"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "favicon")}
            />
            <Button type="button" variant="outline" size="sm"
              onClick={() => faviconInput.current?.click()} disabled={uploading === "favicon"}>
              {uploading === "favicon" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Subir favicon
            </Button>
            {form.favicon_url && (
              <Button type="button" variant="ghost" size="sm"
                onClick={() => setForm((f) => ({ ...f, favicon_url: null }))}>
                Quitar
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Título de la aplicación</Label>
          <Input id="title" value={form.app_title}
            onChange={(e) => setForm({ ...form, app_title: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sub">Subtítulo</Label>
          <Input id="sub" value={form.app_subtitle}
            onChange={(e) => setForm({ ...form, app_subtitle: e.target.value })} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="desc">Meta descripción (SEO)</Label>
          <Textarea id="desc" rows={2} value={form.meta_description}
            onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="author">Autor / Organización</Label>
          <Input id="author" value={form.meta_author}
            onChange={(e) => setForm({ ...form, meta_author: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="og">Título para redes sociales (opcional)</Label>
          <Input id="og" value={form.og_title ?? ""}
            placeholder="Si vacío, se usa el título principal"
            onChange={(e) => setForm({ ...form, og_title: e.target.value || null })} />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-glow">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Guardar cambios
        </Button>
      </div>
    </Card>
  );
};
