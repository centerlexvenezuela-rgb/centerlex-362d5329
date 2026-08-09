import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Role = "admin" | "lawyer" | null;

interface AuthCtx {
  session: Session | null;
  user: User | null;
  role: Role;
  loading: boolean;
  roleLoading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  role: null,
  loading: true,
  roleLoading: true,
  signOut: async () => {},
});

/** Consulta el rol con un reintento: evita falsos negativos por carreras de red/token */
export const fetchUserRole = async (userId: string): Promise<Role> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (!error && data?.role) return data.role as Role;
    if (!error && !data) return null;
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const resolveRole = async (userId: string) => {
      setRoleLoading(true);
      const r = await fetchUserRole(userId);
      if (!active) return;
      setRole(r);
      setRoleLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.user) {
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED") {
          // diferido para evitar bloqueos dentro del callback
          setTimeout(() => resolveRole(s.user.id), 0);
        }
      } else {
        setRole(null);
        setRoleLoading(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        resolveRole(data.session.user.id);
      } else {
        setRoleLoading(false);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        loading,
        roleLoading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
