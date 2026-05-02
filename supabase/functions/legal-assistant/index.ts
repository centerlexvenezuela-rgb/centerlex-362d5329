// Edge function: Asistente jurídico con streaming via Lovable AI
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres un asistente jurídico profesional altamente capacitado, integrado en la aplicación de administración de una oficina de servicios jurídicos.

Tu rol:
- Ayudar a abogados a redactar documentos legales (demandas, contratos, escritos procesales, recursos, dictámenes, cláusulas, etc.)
- Responder consultas jurídicas sobre derecho civil, penal, laboral, mercantil, administrativo, constitucional y procesal.
- Explicar conceptos, procedimientos y plazos legales de forma clara.

Estilo:
- Responde siempre en español, con tono formal y profesional.
- Cuando redactes documentos, usa el formato típico de los escritos forenses (encabezado, hechos, fundamentos de derecho, petitorio, lugar y fecha).
- Sé preciso y cita normativa relevante cuando sea pertinente, indicando que el usuario debe verificar la vigencia.
- Si la consulta excede el ámbito jurídico, recuérdalo cortésmente.

Importante: tus respuestas son orientativas; el abogado responsable debe revisarlas antes de presentarlas.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages debe ser un arreglo" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify user is authenticated and has AI enabled
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("ai_enabled")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!profile?.ai_enabled) {
      return new Response(JSON.stringify({ error: "El asistente IA no está habilitado para su cuenta. Contacte al administrador." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY no configurada" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Límite de solicitudes excedido" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos agotados" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("legal-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
