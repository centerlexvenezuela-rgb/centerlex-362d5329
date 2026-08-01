import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface LawyerProfile {
  first_name: string | null;
  last_name: string | null;
  ai_enabled: boolean;
  fees_enabled: boolean;
  prestaciones_enabled: boolean;
  islr_enabled: boolean;
  account_active: boolean;
  trial_ends_at: string | null;
}

const empty: LawyerProfile = {
  first_name: null,
  last_name: null,
  ai_enabled: false,
  fees_enabled: false,
  prestaciones_enabled: false,
  islr_enabled: false,
  account_active: true,
  trial_ends_at: null,
};

/** true cuando la cuenta está inhabilitada o el período de prueba venció */
export const isAccountBlocked = (p: LawyerProfile | null) => {
  if (!p) return false;
  if (!p.account_active) return true;
  if (p.trial_ends_at && new Date(p.trial_ends_at).getTime() <= Date.now()) return true;
  return false;
};

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<LawyerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select(
          "first_name, last_name, ai_enabled, fees_enabled, prestaciones_enabled, islr_enabled, account_active, trial_ends_at",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile((data as LawyerProfile) ?? empty);
      setLoading(false);
    };
    load();
  }, [user]);

  return { profile, loading };
};
