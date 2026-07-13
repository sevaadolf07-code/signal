// Server-only Web Push (VAPID, no-payload) using Web Crypto — compatible with Cloudflare Workers.

function b64url(bytes: Uint8Array | ArrayBuffer): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

let cachedKey: CryptoKey | null = null;
async function getSigningKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const jwk = JSON.parse(process.env.VAPID_PRIVATE_JWK!) as JsonWebKey;
  cachedKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  return cachedKey;
}

async function signVapidJwt(aud: string): Promise<string> {
  const enc = new TextEncoder();
  const header = b64url(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64url(
    enc.encode(
      JSON.stringify({
        aud,
        exp: Math.floor(Date.now() / 1000) + 12 * 3600,
        sub: process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
      }),
    ),
  );
  const key = await getSigningKey();
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(`${header}.${payload}`),
  );
  return `${header}.${payload}.${b64url(sig)}`;
}

type Sub = { id: string; endpoint: string };

/** Fire a no-payload push to every stored subscription. Removes dead endpoints. */
export async function sendPushToAll(): Promise<{ sent: number; removed: number }> {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_JWK;
  if (!pub || !priv) return { sent: 0, removed: 0 };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint");
  const list = (subs ?? []) as Sub[];
  if (list.length === 0) return { sent: 0, removed: 0 };

  let sent = 0;
  const deadIds: string[] = [];

  await Promise.allSettled(
    list.map(async (s) => {
      try {
        const u = new URL(s.endpoint);
        const jwt = await signVapidJwt(`${u.protocol}//${u.host}`);
        const res = await fetch(s.endpoint, {
          method: "POST",
          headers: {
            TTL: "60",
            Urgency: "high",
            Authorization: `vapid t=${jwt}, k=${pub}`,
            "Content-Length": "0",
          },
        });
        if (res.status === 404 || res.status === 410) {
          deadIds.push(s.id);
        } else if (res.ok || res.status === 201) {
          sent++;
        }
      } catch {
        // ignore individual failures
      }
    }),
  );

  if (deadIds.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("id", deadIds);
  }
  return { sent, removed: deadIds.length };
}