import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useBranding } from "@/hooks/useBranding";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Scale, LogIn, Send, Loader2, BookOpen, ShieldCheck,
  Clock, Users, FileText, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const contactSchema = z.object({
  first_name: z.string().trim().min(1, "Nombre requerido").max(100),
  last_name: z.string().trim().min(1, "Apellido requerido").max(100),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Mensaje muy corto").max(5000),
});

const Landing = () => {
  const { branding } = useBranding();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const scrollToContact = () => {
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0].message);
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email || null,
      message: parsed.data.message,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Mensaje enviado. Nos pondremos en contacto pronto.");
    setForm({ first_name: "", last_name: "", email: "", message: "" });
  };

  const features = [
    { icon: Users, title: "Gestión de clientes", desc: "Toda la información de sus clientes centralizada y accesible." },
    { icon: FileText, title: "Expedientes digitales", desc: "Organice cada caso con escritos, plazos y documentos." },
    { icon: Clock, title: "Agenda inteligente", desc: "No vuelva a perder una audiencia o cita importante." },
    { icon: Sparkles, title: "Asistente con IA", desc: "Redacte escritos y consulte normativa con apoyo de inteligencia artificial." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded flex items-center justify-center overflow-hidden ${branding.logo_url ? "" : "bg-gradient-gold shadow-gold"}`}>
              {branding.logo_url ? (
                <img src={branding.logo_url} alt={branding.app_title} className="h-full w-full object-contain" />
              ) : (
                <Scale className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h1 className="font-serif text-base sm:text-lg leading-tight">{branding.app_title}</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{branding.app_subtitle}</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">
              <LogIn className="h-4 w-4 mr-1.5" /> Ingresar
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className={`mx-auto mb-6 h-20 w-20 sm:h-24 sm:w-24 rounded-2xl flex items-center justify-center overflow-hidden ${branding.logo_url ? "" : "bg-gradient-gold shadow-gold"}`}>
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={branding.app_title} className="h-full w-full object-contain" />
            ) : (
              <Scale className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            )}
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl leading-tight mb-4">
            {branding.app_title}
          </h2>
          <p className="text-lg sm:text-xl text-accent font-medium mb-6">
            {branding.app_subtitle}
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
            La plataforma todo-en-uno diseñada para abogados modernos. Centralice
            clientes, expedientes, agenda y escritos en un solo lugar — con la
            ayuda de un asistente jurídico de inteligencia artificial. Ahorre
            horas de trabajo administrativo y dedique más tiempo a lo que
            realmente importa: <strong className="text-foreground">defender a sus clientes</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary-glow">
              <Link to="/auth">
                <LogIn className="h-5 w-5 mr-2" /> Ingresar a la aplicación
              </Link>
            </Button>
            <Button onClick={scrollToContact} size="lg" variant="outline">
              <Send className="h-5 w-5 mr-2" /> Solicitar la aplicación
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h3 className="font-serif text-2xl sm:text-3xl text-center mb-10">
            Todo lo que su despacho necesita
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <Card key={f.title} className="p-5 text-center hover:shadow-elegant transition-shadow">
                <div className="mx-auto mb-3 h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-accent" />
                </div>
                <h4 className="font-serif text-lg mb-1">{f.title}</h4>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded bg-gradient-gold flex items-center justify-center shadow-gold flex-shrink-0">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-serif text-2xl mb-3">
              Por qué los abogados eligen {branding.app_title}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              En la práctica jurídica, cada minuto cuenta y cada documento importa.
              Perder un plazo, traspapelar un expediente o no encontrar a tiempo la
              información de un cliente puede tener consecuencias graves.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {branding.app_title} le ofrece <strong className="text-foreground">
              orden, seguridad y eficiencia</strong>: sus datos protegidos en la
              nube, accesibles desde cualquier dispositivo, con búsqueda inmediata
              por número de cédula y un asistente con IA que le ayuda a redactar
              y consultar más rápido.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contacto" className="bg-muted/30 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <BookOpen className="h-10 w-10 text-accent mx-auto mb-3" />
            <h3 className="font-serif text-2xl sm:text-3xl mb-2">
              Solicite acceso a la aplicación
            </h3>
            <p className="text-muted-foreground">
              Déjenos sus datos y nos pondremos en contacto para crearle su cuenta.
            </p>
          </div>
          <Card className="p-6 sm:p-8 shadow-elegant">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fn">Nombre *</Label>
                  <Input
                    id="fn" required maxLength={100}
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ln">Apellido *</Label>
                  <Input
                    id="ln" required maxLength={100}
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="em">Email (opcional)</Label>
                <Input
                  id="em" type="email" maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="msg">Mensaje *</Label>
                <Textarea
                  id="msg" required rows={5} maxLength={5000}
                  placeholder="Cuéntenos sobre su despacho y cómo podemos ayudarle…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={sending} className="w-full bg-primary hover:bg-primary-glow">
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar solicitud
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {branding.app_title} — {branding.app_subtitle}
        </div>
      </footer>
    </div>
  );
};

export default Landing;
