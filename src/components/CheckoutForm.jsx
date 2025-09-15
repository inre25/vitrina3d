// src/components/CheckoutForm.jsx
import { useState } from "react";

export default function CheckoutForm({ cart = [], total = 0, onSuccess }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const url = `${window.location.origin}/api/checkout`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, comment, cart, total }),
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(
          `HTTP ${res.status} ${res.statusText} — ${txt.slice(0, 200)}`
        );
        // сюда упадём, если функция вернула 400/500
      }

      const data = await res.json();
      if (data.ok) {
        setMsg("Заявка отправлена.");
        onSuccess?.();
      } else {
        setMsg("Ошибка: " + (data.errors?.join(", ") || "UNKNOWN"));
      }
    } catch (err) {
      setMsg(
        err?.name === "AbortError"
          ? "Таймаут запроса (15 сек.)"
          : "Сеть/запрос: " + (err?.message || "ошибка")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <input
        className="border p-2 rounded"
        placeholder="Имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="border p-2 rounded"
        placeholder="Телефон"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      <input
        className="border p-2 rounded"
        placeholder="E-mail (необязательно)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />
      <textarea
        className="border p-2 rounded"
        placeholder="Комментарий"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button
        type="submit"
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Отправка..." : "Отправить заявку"}
      </button>
      {msg && <div className="text-sm">{msg}</div>}
    </form>
  );
}
