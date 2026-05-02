import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Scale, Users, Calendar, FolderOpen, Search, MessageSquare, LogOut, Menu, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/hooks/useBranding";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const baseNav = [
  { to: "/app", label: "Inicio", icon: Scale, end: true },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/expedientes", label: "Expedientes", icon: FolderOpen },
  { to: "/buscar", label: "Búsqueda", icon: Search },
];
const aiNav = { to: "/asistente", label: "Asistente IA", icon: MessageSquare };

// Mobile: visible directly in the bar
const mobilePrimary = [
  { to: "/app", label: "Inicio", icon: Scale, end: true },
  { to: "/buscar", label: "Búsqueda", icon: Search },
];
const mobilePrimaryPaths = mobilePrimary.map((n) => n.to);

export const AppLayout = () => {
  const { user, signOut } = useAuth();
  const { branding } = useBranding();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const nav = profile?.ai_enabled ? [...baseNav, aiNav] : baseNav;
  const mobileSecondary = nav.filter((n) => !mobilePrimaryPaths.includes(n.to));

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-gradient-gold flex items-center justify-center shadow-gold overflow-hidden">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt={branding.app_title} className="h-full w-full object-cover" />
              ) : (
                <Scale className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold leading-tight">{branding.app_title}</h1>
              <p className="text-xs text-sidebar-foreground/60">{branding.app_subtitle}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-accent"
                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <p className="text-xs text-sidebar-foreground/60 px-3 mb-2 truncate">{user?.email}</p>
          <NavLink
            to="/cuenta"
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-accent"
                : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80"
            )}
          >
            <KeyRound className="h-4 w-4" />
            Mi cuenta
          </NavLink>
          <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt="" className="h-6 w-6 rounded object-cover shrink-0" />
            ) : (
              <Scale className="h-5 w-5 text-accent shrink-0" />
            )}
            <span className="font-serif text-base truncate">{branding.app_title}</span>
          </div>
          <nav className="flex items-center gap-1 shrink-0">
            {mobilePrimary.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </NavLink>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent/40">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {mobileSecondary.map(({ to, label, icon: Icon, end }) => (
                  <DropdownMenuItem key={to} asChild>
                    <NavLink to={to} end={end} className="flex items-center gap-2 cursor-pointer">
                      <Icon className="h-4 w-4" />
                      {label}
                    </NavLink>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <NavLink to="/cuenta" className="flex items-center gap-2 cursor-pointer">
                    <KeyRound className="h-4 w-4" />
                    Mi cuenta
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>

      <main className="flex-1 md:pt-0 pt-[68px] overflow-auto">
        <div className="container max-w-7xl py-6 md:py-8 mt-5 md:mt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
