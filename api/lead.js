// api/lead.js
// Vercel serverless function — forwards a lead submission to Meta's
// Conversions API (server-side), so it registers even when the browser
// Pixel is blocked (ad blockers, iOS privacy settings, etc).
//
// Requires an environment variable set in Vercel:
//   FB_ACCESS_TOKEN  -> the Conversions API access token you generate in
//                        Events Manager > Datasets > Settings > direct
//                        integration > "Generate access token"

const crypto = require("crypto");

const PIXEL_ID = "1101731379100300";

function hash(value) {
  if (!value) return undefined;
  return crypto
    .createHash("sha256")
    .update(String(value).trim().toLowerCase())
    .digest("hex");
}

// Keeps digits only and makes sure the Spanish country code is present,
// since Meta expects phone numbers in E.164-ish digit form before hashing.
function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("34")) return digits;
  if (digits.length === 9) return "34" + digits;
  return digits;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const token = process.env.FB_ACCESS_TOKEN;
  if (!token) {
    console.error("Missing FB_ACCESS_TOKEN env var");
    res.status(500).json({ error: "missing_access_token" });
    return;
  }

  try {
    const { nombre, telefono, eventId } = req.body || {};

    const clientIp =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      "";
    const userAgent = req.headers["user-agent"] || "";

    const payload = {
      data: [
        {
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId, // must match the eventID sent by fbq() client-side, for dedup
          action_source: "website",
          event_source_url: "https://debuenatintastudio.com/",
          user_data: {
            ph: [hash(normalizePhone(telefono))],
            fn: [hash(nombre)],
            client_ip_address: clientIp,
            client_user_agent: userAgent,
          },
        },
      ],
    };

    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      console.error("Meta CAPI error:", metaData);
      res.status(502).json({ error: "meta_capi_failed", details: metaData });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Lead endpoint error:", err);
    res.status(500).json({ error: "server_error" });
  }
};
