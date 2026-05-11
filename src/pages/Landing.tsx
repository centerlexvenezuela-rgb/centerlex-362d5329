import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useBranding, interpolate } from "@/hooks/useBranding";
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
  const c = branding.landing_content;
  const vars = {
    app_title: branding.app_title,
    app_subtitle: branding.app_subtitle,
    year: new Date().getFullYear(),
  };
  const t = (s: string) => interpolate(s, vars);

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
    toast.success(c.contact_success_message);
    setForm({ first_name: "", last_name: "", email: "", message: "" });
  };

  const features = [
    { icon: Users, title: c.feature_1_title, desc: c.feature_1_desc },
    { icon: FileText, title: c.feature_2_title, desc: c.feature_2_desc },
    { icon: Clock, title: c.feature_3_title, desc: c.feature_3_desc },
    { icon: Sparkles, title: c.feature_4_title, desc: c.feature_4_desc },
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
              <LogIn className="h-4 w-4 mr-1.5" /> {c.header_login_button}
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
            {c.hero_title?.trim() ? t(c.hero_title) : branding.app_title}
          </h2>
          <p className="text-lg sm:text-xl text-accent font-medium mb-6">
            {c.hero_subtitle?.trim() ? t(c.hero_subtitle) : branding.app_subtitle}
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 whitespace-pre-line">
            {t(c.hero_description)}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary-glow">
              <Link to="/auth">
                <LogIn className="h-5 w-5 mr-2" /> {c.hero_cta_primary}
              </Link>
            </Button>
            <Button onClick={scrollToContact} size="lg" variant="outline">
              <Send className="h-5 w-5 mr-2" /> {c.hero_cta_secondary}
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h3 className="font-serif text-2xl sm:text-3xl text-center mb-10">
            {t(c.features_title)}
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
              {t(c.why_title)}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-3 whitespace-pre-line">
              {t(c.why_paragraph_1)}
            </p>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {t(c.why_paragraph_2)}
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
              {t(c.contact_title)}
            </h3>
            <p className="text-muted-foreground">
              {t(c.contact_subtitle)}
            </p>
          </div>
          <Card className="p-6 sm:p-8 shadow-elegant">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fn">{c.contact_first_name_label} *</Label>
                  <Input
                    id="fn" required maxLength={100}
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ln">{c.contact_last_name_label} *</Label>
                  <Input
                    id="ln" required maxLength={100}
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="em">{c.contact_email_label}</Label>
                <Input
                  id="em" type="email" maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="msg">{c.contact_message_label} *</Label>
                <Textarea
                  id="msg" required rows={5} maxLength={5000}
                  placeholder={c.contact_message_placeholder}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={sending} className="w-full bg-primary hover:bg-primary-glow">
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {c.contact_submit_label}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-muted-foreground">
          {t(c.footer_text)}
        </div>
      </footer>
    </div>
  );
};

export default Landing;
