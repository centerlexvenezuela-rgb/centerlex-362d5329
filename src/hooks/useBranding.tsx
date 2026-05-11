import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LandingContent {
  header_login_button: string;
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  features_title: string;
  feature_1_title: string;
  feature_1_desc: string;
  feature_2_title: string;
  feature_2_desc: string;
  feature_3_title: string;
  feature_3_desc: string;
  feature_4_title: string;
  feature_4_desc: string;
  why_title: string;
  why_paragraph_1: string;
  why_paragraph_2: string;
  contact_title: string;
  contact_subtitle: string;
  contact_first_name_label: string;
  contact_last_name_label: string;
  contact_email_label: string;
  contact_message_label: string;
  contact_message_placeholder: string;
  contact_submit_label: string;
  contact_success_message: string;
  footer_text: string;
}

export const defaultLandingContent: LandingContent = {
  header_login_button: "Ingresar",
  hero_title: "",
  hero_subtitle: "",
  hero_description:
    "La plataforma todo-en-uno diseñada para abogados modernos. Centralice clientes, expedientes, agenda y escritos en un solo lugar — con la ayuda de un asistente jurídico de inteligencia artificial. Ahorre horas de trabajo administrativo y dedique más tiempo a lo que realmente importa: defender a sus clientes.",
  hero_cta_primary: "Ingresar a la aplicación",
  hero_cta_secondary: "Solicitar la aplicación",
  features_title: "Todo lo que su despacho necesita",
  feature_1_title: "Gestión de clientes",
  feature_1_desc: "Toda la información de sus clientes centralizada y accesible.",
  feature_2_title: "Expedientes digitales",
  feature_2_desc: "Organice cada caso con escritos, plazos y documentos.",
  feature_3_title: "Agenda inteligente",
  feature_3_desc: "No vuelva a perder una audiencia o cita importante.",
  feature_4_title: "Asistente con IA",
  feature_4_desc: "Redacte escritos y consulte normativa con apoyo de inteligencia artificial.",
  why_title: "Por qué los abogados eligen {app_title}",
  why_paragraph_1:
    "En la práctica jurídica, cada minuto cuenta y cada documento importa. Perder un plazo, traspapelar un expediente o no encontrar a tiempo la información de un cliente puede tener consecuencias graves.",
  why_paragraph_2:
    "{app_title} le ofrece orden, seguridad y eficiencia: sus datos protegidos en la nube, accesibles desde cualquier dispositivo, con búsqueda inmediata por número de cédula y un asistente con IA que le ayuda a redactar y consultar más rápido.",
  contact_title: "Solicite acceso a la aplicación",
  contact_subtitle: "Déjenos sus datos y nos pondremos en contacto para crearle su cuenta.",
  contact_first_name_label: "Nombre",
  contact_last_name_label: "Apellido",
  contact_email_label: "Email (opcional)",
  contact_message_label: "Mensaje",
  contact_message_placeholder: "Cuéntenos sobre su despacho y cómo podemos ayudarle…",
  contact_submit_label: "Enviar solicitud",
  contact_success_message: "Mensaje enviado. Nos pondremos en contacto pronto.",
  footer_text: "© {year} {app_title} — {app_subtitle}",
};

export interface Branding {
  app_title: string;
  app_subtitle: string;
  meta_description: string;
  meta_author: string;
  og_title: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  landing_content: LandingContent;
}

const defaults: Branding = {
  app_title: "Lex Office",
  app_subtitle: "Servicios Jurídicos",
  meta_description: "Plataforma de administración para oficinas de servicios jurídicos.",
  meta_author: "Lex Office",
  og_title: null,
  logo_url: null,
  favicon_url: null,
  landing_content: defaultLandingContent,
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
    if (data) {
      const merged: Branding = {
        ...defaults,
        ...data,
        landing_content: {
          ...defaultLandingContent,
          ...((data as any).landing_content ?? {}),
        },
      } as Branding;
      setBranding(merged);
    }
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

/** Replace tokens like {app_title}, {app_subtitle}, {year} in landing texts. */
export const interpolate = (
  text: string,
  vars: Record<string, string | number>,
): string =>
  text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
