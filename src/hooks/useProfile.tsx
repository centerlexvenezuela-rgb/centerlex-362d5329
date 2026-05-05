import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface LawyerProfile {
  first_name: string | null;
  last_name: string | null;
  ai_enabled: boolean;
  fees_enabled: boolean;
}

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
        .select("first_name, last_name, ai_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(
        data ?? { first_name: null, last_name: null, ai_enabled: false }
      );
      setLoading(false);
    };
    load();
  }, [user]);

  return { profile, loading };
};
