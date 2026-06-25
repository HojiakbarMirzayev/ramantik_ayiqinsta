// Vercel Serverless Function — mijoz buyurtmalarini Telegram botga yuboradi.
//
// XAVFSIZLIK: token va chat ID kodda EMAS, balki Vercel
// "Environment Variables" bo'limida saqlanadi. Shuning uchun repo
// public bo'lsa ham maxfiy ma'lumotlar ochilmaydi.
//
// Vercel → Project → Settings → Environment Variables:
//   TELEGRAM_BOT_TOKEN = <BotFather bergan yangi token>   (MAXFIY)
//
// Chat ID maxfiy emas (uni bilgan odam kanalga yoza olmaydi), shuning
// uchun u kodda qoladi. Xohlasangiz uni ham TELEGRAM_CHAT_ID env
// o'zgaruvchisi orqali almashtirishingiz mumkin.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID || "-1003770834725"; // Ramantik ayiq 2 kanali

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  // Sozlama tekshiruvi: env o'zgaruvchilari qo'yilmagan bo'lsa.
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars");
    return res.status(500).json({ ok: false, error: "not_configured" });
  }

  try {
    const { name, phone, region, website } = req.body || {};

    // Spam-tuzoq: "website" maydoni faqat botlar tomonidan to'ldiriladi.
    if (website) {
      return res.status(200).json({ ok: true }); // jim qabul qilamiz, lekin yubormaymiz
    }

    // Oddiy tekshiruv
    const phoneDigits = String(phone || "").replace(/\D/g, "");
    if (!name || phoneDigits.length < 12 || !region) {
      return res.status(400).json({ ok: false, error: "invalid_input" });
    }

    const text =
      "🐻📸 <b>AYIQCHA INSTAGRAMI</b>\n" +
      "#ayiqcha_instagrami\n" +
      "➖➖➖➖➖➖➖➖\n" +
      "🧸 <b>Yangi buyurtma — Sevgi Ayiqchasi</b>\n\n" +
      "👤 <b>Ism:</b> " + escapeHtml(name) + "\n" +
      "📞 <b>Telefon:</b> " + escapeHtml(phone) + "\n" +
      "📍 <b>Viloyat:</b> " + escapeHtml(region) + "\n" +
      "💰 <b>Narx:</b> 195 000 so'm\n" +
      "🕒 " + new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });

    const tgRes = await fetch(
      "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      console.error("Telegram error:", tgData);
      return res.status(502).json({ ok: false, error: "telegram_failed" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Order handler error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
