import { adminClient, corsHeaders, json, sendTelegram } from "../_shared/telegram.ts";

const TRIAL_DAYS = 7;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const first_name = String(body.first_name ?? "").trim();
    const last_name = String(body.last_name ?? "").trim();
    const cedula = String(body.cedula ?? "").trim();
    const inpreabogado = String(body.inpreabogado ?? "").trim();
    const bar_number = String(body.bar_number ?? "").trim();
    const phone = String(body.phone ?? "").replace(/\D/g, "");
    const state = String(body.state ?? "").trim();
    const city = String(body.city ?? "").trim();

    if (!email || password.length < 6 || !first_name || !last_name || !cedula) {
      return json(
        { error: "Nombre, apellido, cédula, email y contraseña (mín. 6) son obligatorios" },
        400,
      );
    }

    const admin = adminClient();

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      const msg = /already/i.test(error.message)
        ? "Ya existe una cuenta registrada con este correo"
        : error.message;
      return json({ error: msg }, 400);
    }

    const trialEnds = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "lawyer" });
    if (roleErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw roleErr;
    }

    const { error: profErr } = await admin.from("profiles").insert({
      user_id: created.user.id,
      email,
      first_name,
      last_name,
      cedula,
      inpreabogado: inpreabogado || null,
      bar_number: bar_number || null,
      phone: phone || null,
      whatsapp: phone || null,
      state: state || null,
      city: city || null,
      account_active: true,
      trial_ends_at: trialEnds,
      ai_enabled: false,
    });
    if (profErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw profErr;
    }

    const text =
      `🆕 <b>Nuevo registro (prueba ${TRIAL_DAYS} días)</b>\n` +
      `Abogado: ${first_name} ${last_name}\n` +
      `Cédula: ${cedula}\n` +
      `Inpreabogado: ${inpreabogado || "—"}\n` +
      `Colegio: ${bar_number || "—"}\n` +
      `Teléfono: ${phone || "—"}\n` +
      `Email: ${email}\n` +
      `Ubicación: ${[city, state].filter(Boolean).join(", ") || "—"}\n` +
      `Prueba vence: ${new Date(trialEnds).toLocaleString("es-VE")}`;
    const notified = await sendTelegram("signups", text);

    return json({ ok: true, trial_ends_at: trialEnds, notified });
  } catch (e) {
    console.error("signup-lawyer error", e);
    return json({ error: (e as Error).message ?? "Error" }, 500);
  }
});
