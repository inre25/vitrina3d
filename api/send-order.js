// api/send-order.js
import nodemailer from "nodemailer";

// Помощник: безопасно читать JSON из req (на всякий случай для non-Next окружений)
async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const ch of req) chunks.push(ch);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const {
      customer = { name: "", phone: "", email: "", comment: "" },
      items = [],
      totals = { count: 0, sum: 0 },
      meta = { site: "", ts: "" },
    } = await readJson(req);

    if (!customer?.name?.trim() || !customer?.phone?.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "Укажите имя и телефон" });
    }

    // ====== MAIL.RU (SMTP через Nodemailer) ======
    const {
      SMTP_HOST = "smtp.mail.ru",
      SMTP_PORT = "465",
      SMTP_USER,
      SMTP_PASS,
      FROM_EMAIL,
      TO_EMAIL,
      TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID,
    } = process.env;

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // 465=SSL, 587=TLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const rowsHtml = items
      .map(
        (it, i) => `
          <tr>
            <td style="padding:6px 10px;border:1px solid #eee;">${i + 1}</td>
            <td style="padding:6px 10px;border:1px solid #eee;">${
              it.title || it.name || "-"
            }</td>
            <td style="padding:6px 10px;border:1px solid #eee;">${
              it.color || "-"
            }</td>
            <td style="padding:6px 10px;border:1px solid #eee;">${
              it.qty || 1
            }</td>
            <td style="padding:6px 10px;border:1px solid #eee;">${
              it.price ?? "-"
            }</td>
            <td style="padding:6px 10px;border:1px solid #eee;">${
              (it.qty || 1) * (it.price || 0)
            }</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#111;">
        <h2>Новая заявка из витрины 3D-печати</h2>
        <p>
          <b>Имя:</b> ${customer.name}<br/>
          <b>Телефон:</b> ${customer.phone}<br/>
          <b>E-mail:</b> ${customer.email || "-"}
        </p>
        ${
          customer.comment
            ? `<p><b>Комментарий:</b> ${customer.comment}</p>`
            : ""
        }

        <h3>Корзина</h3>
        <table style="border-collapse:collapse;border:1px solid #eee;">
          <thead>
            <tr>
              <th style="padding:6px 10px;border:1px solid #eee;">#</th>
              <th style="padding:6px 10px;border:1px solid #eee;">Товар</th>
              <th style="padding:6px 10px;border:1px solid #eee;">Цвет</th>
              <th style="padding:6px 10px;border:1px solid #eee;">Кол-во</th>
              <th style="padding:6px 10px;border:1px solid #eee;">Цена</th>
              <th style="padding:6px 10px;border:1px solid #eee;">Сумма</th>
            </tr>
          </thead>
          <tbody>
            ${
              rowsHtml ||
              `<tr><td colspan="6" style="padding:8px 10px;border:1px solid #eee;">Пусто</td></tr>`
            }
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="padding:8px 10px;border:1px solid #eee;text-align:right;"><b>Итого (${
                totals.count
              } шт.):</b></td>
              <td style="padding:8px 10px;border:1px solid #eee;"><b>${
                totals.sum
              }</b></td>
            </tr>
          </tfoot>
        </table>

        <p style="margin-top:16px;color:#666;">
          Источник: ${meta.site || "PWA"}<br/>
          Время: ${meta.ts || new Date().toISOString()}
        </p>
      </div>
    `;

    const mailPromise = transporter.sendMail({
      from: FROM_EMAIL || SMTP_USER,
      to: TO_EMAIL || SMTP_USER,
      subject: `Заявка: ${customer.name} (${totals.count} шт., ${totals.sum})`,
      html,
    });

    // ====== TELEGRAM ======
    const tgLines = [
      `<b>Новая заявка</b>`,
      `Имя: <b>${customer.name}</b>`,
      `Телефон: <b>${customer.phone}</b>`,
      customer.email ? `E-mail: <b>${customer.email}</b>` : null,
      customer.comment ? `Комментарий: ${customer.comment}` : null,
      `—`,
      `Итого: <b>${totals.count} шт.</b> на <b>${totals.sum} руб.</b>`,
      `Источник: ${meta.site || "PWA"}`,
      `Время: ${meta.ts || new Date().toISOString()}`,
      `—`,
      items.length
        ? items
            .map(
              (it, i) =>
                `${i + 1}) ${it.title || it.name || "Товар"} — ${
                  it.qty || 1
                } × ${it.price || 0}`
            )
            .join("\n")
        : "Корзина: пусто",
    ].filter(Boolean);

    async function sendTelegram() {
      if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        throw new Error("TELEGRAM env not set");
      }
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const resTg = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: tgLines.join("\n"),
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
      const j = await resTg.json();
      if (!j.ok) throw new Error("Telegram API error");
      return j.result?.message_id || true;
    }

    // Запускаем обе отправки параллельно; если одна упала — вернём частичный успех
    const [mailRes, tgRes] = await Promise.allSettled([
      mailPromise,
      sendTelegram(),
    ]);

    const result = {
      ok: mailRes.status === "fulfilled" && tgRes.status === "fulfilled",
      email_ok: mailRes.status === "fulfilled",
      telegram_ok: tgRes.status === "fulfilled",
      email_id:
        mailRes.status === "fulfilled" ? mailRes.value?.messageId : null,
      telegram_id: tgRes.status === "fulfilled" ? tgRes.value : null,
    };

    // Если обе упали — 500, иначе 200 с деталями
    if (!result.email_ok && !result.telegram_ok) {
      return res
        .status(500)
        .json({ ok: false, error: "Не удалось отправить ни по одному каналу" });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("SEND_ORDER_ERROR:", err);
    return res.status(500).json({ ok: false, error: "Внутренняя ошибка" });
  }
}
