// src/components/CheckoutForm.jsx
import { useState } from "react";
import { useCart } from "../store/cart";

export default function CheckoutForm() {
  const { items, total, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok'|'warn'|'err', text: string }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const resp = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, comment, items, total }),
      });
      const data = await resp.json();

      if (data.ok) {
        // Успех по крайней мере в одном канале
        if (data.channels?.telegram && !data.channels?.email) {
          setMsg({
            type: "warn",
            text: "Заявка отправлена в Telegram. Письмо не доставлено (позже можно настроить SMTP).",
          });
        } else {
          setMsg({ type: "ok", text: "Заявка отправлена. Спасибо!" });
        }
        clear();
        setName("");
        setPhone("");
        setEmail("");
        setComment("");
      } else {
        setMsg({
          type: "err",
          text: "Не удалось отправить. Попробуйте ещё раз.",
        });
      }
    } catch (err) {
      setMsg({
        type: "err",
        text: "Сбой сети. Проверьте интернет и повторите.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        className="w-full rounded-md px-3 py-2"
        placeholder="Ваше имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full rounded-md px-3 py-2"
        placeholder="Телефон"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        className="w-full rounded-md px-3 py-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <textarea
        className="w-full rounded-md px-3 py-2 min-h-[90px]"
        placeholder="Комментарий"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button
        disabled={loading}
        className="w-full rounded-md px-4 py-3 bg-black text-white disabled:opacity-60"
      >
        {loading ? "Отправляю..." : "Отправить заявку"}
      </button>

      {msg && (
        <p
          className={
            msg.type === "ok"
              ? "text-green-300"
              : msg.type === "warn"
              ? "text-yellow-300"
              : "text-red-300"
          }
        >
          {msg.text}
        </p>
      )}
    </form>
  );
}
