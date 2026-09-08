import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Specialty {
  id: string;
  name: string;
  display_order: number;
}

export const useSpecialties = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("directory_specialties" as any)
      .select("id, name, display_order")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });
    setSpecialties(((data as unknown) as Specialty[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { specialties, loading, reload };
};
