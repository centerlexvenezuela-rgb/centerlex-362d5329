import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Branding {
  app_title: string;
  app_subtitle: string;
  meta_description: string;
  meta_author: string;
  og_title: string | null;
  logo_url: string | null;
  favicon_url: string | null;
}

const defaults: Branding = {
  app_title: "Lex Office",
  app_subtitle: "Servicios Jurídicos",
  meta_description: "Plataforma de administración para oficinas de servicios jurídicos.",
  meta_author: "Lex Office",
  og_title: null,
  logo_url: null,
  favicon_url: null,
};

interface Ctx {
  branding: Branding;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<Ctx>({ branding: defaults, loading: true, refresh: async () => {} });

const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setFavicon = (url: string | null) => {
  const href = url || "/favicon.ico";
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = href;
};

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  const [branding, setBranding] = useState<Branding>(defaults);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) setBranding({ ...defaults, ...data } as Branding);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    document.title = branding.app_title;
    setMeta("description", branding.meta_description);
    setMeta("author", branding.meta_author);
    setMeta("og:title", branding.og_title || branding.app_title, "property");
    setMeta("og:description", branding.meta_description, "property");
    setFavicon(branding.favicon_url);
  }, [branding]);

  return (
    <BrandingContext.Provider value={{ branding, loading, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
