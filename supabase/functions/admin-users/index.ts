import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Acceso solo administrador" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action as string;

    if (action === "list") {
      const { data: list, error } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (error) throw error;
      const { data: roles } = await admin.from("user_roles").select("user_id, role");
      const { data: profiles } = await admin
        .from("profiles")
        .select("user_id, first_name, last_name, ai_enabled, fees_enabled, prestaciones_enabled, islr_enabled, directory_enabled, whatsapp, bar_association, city, state, photo_url");
      const lawyers = list.users
        .map((u) => {
          const r = roles?.find((x) => x.user_id === u.id);
          const p = profiles?.find((x) => x.user_id === u.id) as any;
          const bannedUntil = (u as any).banned_until as string | null | undefined;
          const isBanned = !!bannedUntil && new Date(bannedUntil).getTime() > Date.now();
          return {
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            banned: isBanned,
            role: r?.role ?? null,
            first_name: p?.first_name ?? null,
            last_name: p?.last_name ?? null,
            ai_enabled: p?.ai_enabled ?? false,
            fees_enabled: p?.fees_enabled ?? false,
            prestaciones_enabled: p?.prestaciones_enabled ?? false,
            islr_enabled: p?.islr_enabled ?? false,
            directory_enabled: p?.directory_enabled ?? false,
            whatsapp: p?.whatsapp ?? null,
            bar_association: p?.bar_association ?? null,
            city: p?.city ?? null,
            state: p?.state ?? null,
            photo_url: p?.photo_url ?? null,
          };
        })
        .filter((u) => u.role === "lawyer");
      return new Response(JSON.stringify({ users: lawyers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { email, password, first_name, last_name, whatsapp, bar_association, city, state, photo_url } = body;
      if (!email || !password || password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Email y contraseña (mín. 6) requeridos" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      const { error: roleErr } = await admin
        .from("user_roles")
        .insert({ user_id: created.user.id, role: "lawyer" });
      if (roleErr) {
        await admin.auth.admin.deleteUser(created.user.id);
        throw roleErr;
      }
      const { error: profErr } = await admin.from("profiles").insert({
        user_id: created.user.id,
        first_name: first_name ?? null,
        last_name: last_name ?? null,
        email,
        whatsapp: whatsapp ?? null,
        bar_association: bar_association ?? null,
        city: city ?? null,
        state: state ?? null,
        photo_url: photo_url ?? null,
        ai_enabled: false,
      });
      if (profErr) {
        await admin.auth.admin.deleteUser(created.user.id);
        throw profErr;
      }
      return new Response(JSON.stringify({ user: created.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_profile") {
      const { user_id, first_name, last_name, whatsapp, bar_association, city, state, photo_url } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id requerido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const patch: Record<string, any> = {};
      if (first_name !== undefined) patch.first_name = first_name || null;
      if (last_name !== undefined) patch.last_name = last_name || null;
      if (whatsapp !== undefined) patch.whatsapp = whatsapp || null;
      if (bar_association !== undefined) patch.bar_association = bar_association || null;
      if (city !== undefined) patch.city = city || null;
      if (state !== undefined) patch.state = state || null;
      if (photo_url !== undefined) patch.photo_url = photo_url || null;
      const { error } = await admin.from("profiles").update(patch).eq("user_id", user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (
      action === "toggle_ai" ||
      action === "toggle_fees" ||
      action === "toggle_prestaciones" ||
      action === "toggle_islr" ||
      action === "toggle_directory"
    ) {
      const { user_id } = body;
      const fieldMap = {
        toggle_ai: "ai_enabled",
        toggle_fees: "fees_enabled",
        toggle_prestaciones: "prestaciones_enabled",
        toggle_islr: "islr_enabled",
        toggle_directory: "directory_enabled",
      } as const;
      const field = fieldMap[action as keyof typeof fieldMap];
      const value =
        action === "toggle_ai" ? body.ai_enabled
        : action === "toggle_fees" ? body.fees_enabled
        : action === "toggle_prestaciones" ? body.prestaciones_enabled
        : action === "toggle_islr" ? body.islr_enabled
        : body.directory_enabled;
      if (!user_id || typeof value !== "boolean") {
        return new Response(JSON.stringify({ error: "Parámetros inválidos" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("user_id", user_id)
        .maybeSingle();
      if (existing) {
        const { error } = await admin
          .from("profiles")
          .update({ [field]: value })
          .eq("user_id", user_id);
        if (error) throw error;
      } else {
        const { error } = await admin
          .from("profiles")
          .insert({ user_id, [field]: value });
        if (error) throw error;
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "toggle_active") {
      const { user_id, active } = body;
      if (!user_id || typeof active !== "boolean") {
        return new Response(JSON.stringify({ error: "Parámetros inválidos" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const ban_duration = active ? "none" : "876000h";
      // Use GoTrue admin REST directly to guarantee ban_duration is honored
      const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
        method: "PUT",
        headers: {
          apikey: SERVICE_ROLE,
          Authorization: `Bearer ${SERVICE_ROLE}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ban_duration }),
      });
      const text = await resp.text();
      if (!resp.ok) {
        console.error("toggle_active failed", resp.status, text);
        return new Response(
          JSON.stringify({ error: `No se pudo actualizar la cuenta: ${text}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id requerido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Acción desconocida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("admin-users error:", e);
    return new Response(JSON.stringify({ error: e.message ?? "Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
