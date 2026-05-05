import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Users, Calendar, FolderOpen, MessageSquare, ArrowRight, Calculator } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({ clients: 0, cases: 0, today: 0 });
  const { profile } = useProfile();
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const [c, ca, ap] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("cases").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .gte("appointment_date", today.toISOString())
          .lt("appointment_date", tomorrow.toISOString()),
      ]);
      setStats({ clients: c.count || 0, cases: ca.count || 0, today: ap.count || 0 });
    };
    load();
  }, []);

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  const greeting = fullName || user?.email || "Bienvenido";

  const baseCards = [
    { to: "/clientes", title: "Clientes", icon: Users, desc: "Registro y gestión", value: stats.clients },
    { to: "/agenda", title: "Citas hoy", icon: Calendar, desc: "Calendario de audiencias", value: stats.today },
    { to: "/expedientes", title: "Expedientes", icon: FolderOpen, desc: "Casos y escritos", value: stats.cases },
  ];
  const cards = [
    ...baseCards,
    ...(profile?.fees_enabled
      ? [{ to: "/honorarios", title: "Honorarios", icon: Calculator, desc: "Tarifas mínimas FCAV", value: "—" as any }]
      : []),
    ...(profile?.ai_enabled
      ? [{ to: "/asistente", title: "Asistente IA", icon: MessageSquare, desc: "Consulta jurídica", value: "—" as any }]
      : []),
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">Bienvenido</p>
        <h1 className="font-serif text-4xl mb-2">{greeting}</h1>
        <p className="text-muted-foreground">Vista general de su oficina jurídica</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ to, title, icon: Icon, desc, value }) => (
          <Link key={to} to={to} className="group">
            <Card className="p-6 h-full shadow-card hover:shadow-elegant transition-all border-l-4 border-l-accent">
              <div className="flex items-start justify-between mb-4">
                <Icon className="h-6 w-6 text-primary" />
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </div>
              <div className="font-serif text-3xl mb-1">{value}</div>
              <div className="text-sm font-medium">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </Card>
          </Link>
        ))}
      </div>

      {profile?.ai_enabled && (
        <Card className="p-8 bg-gradient-hero text-primary-foreground shadow-elegant">
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl mb-3">Asistente jurídico inteligente</h2>
            <p className="text-primary-foreground/80 mb-6">
              Redacte escritos, consulte doctrina y resuelva dudas legales con la ayuda de inteligencia artificial integrada.
            </p>
            <Link to="/asistente" className="inline-flex items-center gap-2 bg-gradient-gold text-primary px-6 py-3 rounded font-medium shadow-gold hover:opacity-90 transition">
              Abrir asistente <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
