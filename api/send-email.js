// api/send-email.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // Разрешаем только POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const {
      customer = { name: "", phone: "", email: "", comment: "" },
      items = [],
      totals = { count: 0, sum: 0 },
      meta = { site: "", ts: "" },
    } = req.body || {};

    // Базовая валидация
    if (!customer?.name || !customer?.phone) {
      return res
        .status(400)
        .json({ ok: false, error: "Укажите имя и телефон" });
    }

    // Транспорт SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465, // 465 = SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const rowsHtml = items
      .map(
        (it, i) => `
          <tr>
            <td style="padding:6px 10px;border:1px solid #eee;">${i + 1}</td>
            <td style="padding:6px 10px;border:1px solid #eee;">${
              it.title || it.name
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
        <p><b>Имя:</b> ${customer.name}<br/>
           <b>Телефон:</b> ${customer.phone}<br/>
           <b>E-mail:</b> ${customer.email || "-"}</p>
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
          <tbody>${
            rowsHtml ||
            `<tr><td colspan="6" style="padding:8px 10px;border:1px solid #eee;">Пусто</td></tr>`
          }</tbody>
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

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.TO_EMAIL,
      subject: `Заявка: ${customer.name} (${totals.count} шт., ${totals.sum})`,
      html,
    });

    return res.status(200).json({ ok: true, id: info.messageId });
  } catch (err) {
    console.error("EMAIL_ERROR:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Не удалось отправить письмо" });
  }
}
