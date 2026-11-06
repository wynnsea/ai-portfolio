// Verifikasi Turnstile dan notifikasi email untuk form kontak (server saja).

let warnedTurnstile = false;

/**
 * Cek token Cloudflare Turnstile. Kalau TURNSTILE_SECRET_KEY belum diisi, verifikasi dilewati
 * (mis. saat development) supaya form tetap bisa dipakai.
 */
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (!warnedTurnstile) {
      warnedTurnstile = true;
      console.warn("[contact] TURNSTILE_SECRET_KEY belum diatur, verifikasi bot dilewati.");
    }
    return true;
  }
  if (!token) return false;

  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    if (ip && ip !== "unknown") form.append("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(8_000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[contact] Verifikasi Turnstile gagal:", err);
    return false;
  }
}

/**
 * Kirim email pemberitahuan ke pemilik website lewat Resend (https://resend.com).
 * Opsional: dilewati kalau RESEND_API_KEY atau CONTACT_NOTIFY_EMAIL kosong.
 */
export async function sendOwnerEmail(email: { subject: string; text: string; replyTo?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  // Tanpa domain terverifikasi, Resend hanya mengizinkan pengirim onboarding@resend.dev
  // dan hanya ke email pemilik akun Resend.
  const from = process.env.CONTACT_FROM_EMAIL || "WYNNSEA <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
        subject: email.subject.slice(0, 200),
        text: email.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error("[notify] Resend menolak email:", res.status, await res.text());
  } catch (err) {
    console.error("[notify] Gagal mengirim email:", err);
  }
}

/** Email pemberitahuan pesan kontak baru. */
export async function notifyNewMessage(record: { name: string; email: string; subject: string; message: string }) {
  await sendOwnerEmail({
    subject: `[Portfolio] ${record.subject}`,
    replyTo: record.email,
    text: `Pesan baru dari form kontak website.\n\nNama: ${record.name}\nEmail: ${record.email}\nSubjek: ${record.subject}\n\n${record.message}\n\n— Balas email ini untuk langsung menjawab pengirim.`,
  });
}
