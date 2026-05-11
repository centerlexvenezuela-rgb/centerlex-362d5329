import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranding, LandingContent, defaultLandingContent } from "@/hooks/useBranding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Home, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type FieldDef = {
  key: keyof LandingContent;
  label: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
};

type Group = { title: string; description?: string; fields: FieldDef[] };

const groups: Group[] = [
  {
    title: "Encabezado",
    fields: [
      { key: "header_login_button", label: "Botón de inicio de sesión" },
    ],
  },
  {
    title: "Sección principal (Hero)",
    description:
      "El título y subtítulo principales se toman automáticamente del título de la aplicación. Puede personalizar la descripción y los botones aquí.",
    fields: [
      { key: "hero_description", label: "Descripción", multiline: true, rows: 5 },
      { key: "hero_cta_primary", label: "Botón principal (Ingresar)" },
      { key: "hero_cta_secondary", label: "Botón secundario (Solicitar)" },
    ],
  },
  {
    title: "Sección de características",
    fields: [
      { key: "features_title", label: "Título de la sección" },
      { key: "feature_1_title", label: "Característica 1 — título" },
      { key: "feature_1_desc", label: "Característica 1 — descripción", multiline: true, rows: 2 },
      { key: "feature_2_title", label: "Característica 2 — título" },
      { key: "feature_2_desc", label: "Característica 2 — descripción", multiline: true, rows: 2 },
      { key: "feature_3_title", label: "Característica 3 — título" },
      { key: "feature_3_desc", label: "Característica 3 — descripción", multiline: true, rows: 2 },
      { key: "feature_4_title", label: "Característica 4 — título" },
      { key: "feature_4_desc", label: "Característica 4 — descripción", multiline: true, rows: 2 },
    ],
  },
  {
    title: 'Sección "Por qué elegirnos"',
    description:
      "Use {app_title} en el texto y se reemplazará automáticamente por el título de su aplicación.",
    fields: [
      { key: "why_title", label: "Título", hint: "Soporta {app_title}" },
      { key: "why_paragraph_1", label: "Párrafo 1", multiline: true, rows: 4 },
      { key: "why_paragraph_2", label: "Párrafo 2", multiline: true, rows: 4, hint: "Soporta {app_title}" },
    ],
  },
  {
    title: "Formulario de contacto",
    fields: [
      { key: "contact_title", label: "Título" },
      { key: "contact_subtitle", label: "Subtítulo", multiline: true, rows: 2 },
      { key: "contact_first_name_label", label: "Etiqueta — Nombre" },
      { key: "contact_last_name_label", label: "Etiqueta — Apellido" },
      { key: "contact_email_label", label: "Etiqueta — Email" },
      { key: "contact_message_label", label: "Etiqueta — Mensaje" },
      { key: "contact_message_placeholder", label: "Texto guía del mensaje", multiline: true, rows: 2 },
      { key: "contact_submit_label", label: "Botón de envío" },
      { key: "contact_success_message", label: "Mensaje al enviar con éxito" },
    ],
  },
  {
    title: "Pie de página",
    description: "Soporta {year}, {app_title} y {app_subtitle}.",
    fields: [{ key: "footer_text", label: "Texto del pie de página" }],
  },
];

export const LandingContentSection = () => {
  const { branding, refresh } = useBranding();
  const [form, setForm] = useState<LandingContent>(branding.landing_content);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(branding.landing_content); }, [branding.landing_content]);

  const update = (k: keyof LandingContent, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from("app_settings").select("id").limit(1).maybeSingle();
    const payload = { landing_content: form as any, updated_at: new Date().toISOString() };
    let error;
    if (existing) {
      ({ error } = await supabase.from("app_settings")
        .update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("app_settings").insert(payload as any));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Página de inicio actualizada");
    refresh();
  };

  const handleReset = () => {
    setForm(defaultLandingContent);
    toast.info("Valores predeterminados cargados. Recuerde guardar para aplicarlos.");
  };

  return (
    <Card className="p-6 shadow-elegant">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl">Página de inicio</h2>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" /> Restaurar predeterminados
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Edite todos los títulos y textos visibles en la página pública.
      </p>

      <div className="space-y-8">
        {groups.map((g, i) => (
          <div key={g.title}>
            {i > 0 && <Separator className="mb-6" />}
            <h3 className="font-serif text-lg mb-1">{g.title}</h3>
            {g.description && (
              <p className="text-xs text-muted-foreground mb-4">{g.description}</p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {g.fields.map((f) => (
                <div
                  key={f.key}
                  className={`space-y-2 ${f.multiline ? "md:col-span-2" : ""}`}
                >
                  <Label htmlFor={f.key}>{f.label}</Label>
                  {f.multiline ? (
                    <Textarea
                      id={f.key}
                      rows={f.rows ?? 3}
                      value={form[f.key] ?? ""}
                      onChange={(e) => update(f.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      id={f.key}
                      value={form[f.key] ?? ""}
                      onChange={(e) => update(f.key, e.target.value)}
                    />
                  )}
                  {f.hint && (
                    <p className="text-[11px] text-muted-foreground">{f.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-glow">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Guardar cambios
        </Button>
      </div>
    </Card>
  );
};
