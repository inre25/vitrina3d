export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const { items = [], total = 0, meta = {} } = req.body || {};

    const lines = items.map(
      (i) =>
        `• ${i.title} × ${i.qty} = ${
          Number(i.price || 0) * Number(i.qty || 1)
        } ₽`
    );

    const text =
      `🛒 Новый заказ\n` +
      lines.join("\n") +
      `\n—\nИтого: ${total} ₽` +
      (Object.keys(meta).length
        ? `\n\n${Object.entries(meta)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")}`
        : "");

    const tgRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }
    );

    const tgJson = await tgRes.json().catch(() => ({}));
    if (!tgRes.ok || tgJson?.ok === false) {
      throw new Error(tgJson?.description || `Telegram HTTP ${tgRes.status}`);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[order] error:", err);
    return res
      .status(500)
      .json({ ok: false, error: String(err?.message || err) });
  }
}
