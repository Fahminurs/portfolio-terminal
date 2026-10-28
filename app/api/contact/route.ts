// send --to fahmi (§5.9). Resend over plain fetch — no SDK needed.
// env: RESEND_API_KEY, CONTACT_TO, CONTACT_FROM (verified Resend sender). Missing → 503 + client fallback.

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 5;
const hits = new Map<string, number[]>(); // per-instance; good enough for a portfolio

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad payload" }, { status: 400 });
  }

  // honeypot: bots fill every field; humans never see this one
  if (typeof body.website === "string" && body.website) return Response.json({ ok: true });

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  if (!name || name.length > 80) return Response.json({ error: "--name: required, ≤ 80 chars" }, { status: 422 });
  if (!EMAIL.test(email) || email.length > 120) return Response.json({ error: "--email: invalid address" }, { status: 422 });
  if (message.length < 10 || message.length > 4000)
    return Response.json({ error: "--message: 10–4000 chars" }, { status: 422 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return Response.json({ error: "rate limited — try again in an hour" }, { status: 429 });

  const { RESEND_API_KEY: key, CONTACT_TO: to, CONTACT_FROM: from } = process.env;
  if (!key || !to || !from) return Response.json({ error: "mailer not configured" }, { status: 503 });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject: `[fahmi.dev] ${name}`,
      text: `${message}\n\n— ${name} <${email}>`,
    }),
  });
  if (!res.ok) return Response.json({ error: `upstream ${res.status}` }, { status: 502 });
  return Response.json({ ok: true });
}
