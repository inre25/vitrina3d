// /api/checkout.js  — только Telegram (почта отключена), даёт чёткий ответ
// CommonJS, Node 18+ (fetch доступен глобально)

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

// Быстрая проверка, что функция задеплоена
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, note: "checkout готов (TG only)" });
  }

  try {
    const { name, phone, email, comment, items, total } = req.body || {};

    const lines =
      Array.isArray(items) && items.length
        ? items
            .map((it, i) => {
              const title = it.title || it.name || "Товар";
              const qty = it.qty || it.quantity || 1;
              const price = it.price ?? 0;
              return `${i + 1}. ${title} — ${price} руб. × ${qty}`;
            })
            .join("\n")
        : "Товары не переданы.";

    const text = [
      "Новый заказ с Витрина3D",
      "------------------------",
      `Имя: ${name || "-"}`,
      `Телефон: ${phone || "-"}`,
      `Email: ${email || "-"}`,
      `Комментарий: ${comment || "-"}`,
      `Итого: ${total ?? 0} руб.`,
      "",
      "Состав:",
      lines,
    ].join("\n");

    // === Telegram ===
    if (!TG_TOKEN || !TG_CHAT) {
      return res.status(500).json({
        ok: false,
        channels: { telegram: false },
        errors: {
          telegram: "TELEGRAM_NOT_CONFIGURED (нет токена или chat_id)",
        },
      });
    }

    const r = await fetch(
      `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // disable web previews & notifications just in case
        body: JSON.stringify({
          chat_id: TG_CHAT,
          text,
          disable_web_page_preview: true,
        }),
      }
    );

    const data = await r.json();

    if (data && data.ok) {
      return res.status(200).json({
        ok: true,
        channels: { telegram: true },
        errors: null,
      });
    } else {
      return res.status(500).json({
        ok: false,
        channels: { telegram: false },
        errors: { telegram: data ? JSON.stringify(data) : "NO_RESPONSE" },
      });
    }
  } catch (e) {
    return res.status(500).json({
      ok: false,
      channels: { telegram: false },
      errors: { telegram: String(e) },
    });
  }
};
