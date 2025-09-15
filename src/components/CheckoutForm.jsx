import { useState } from "react";
import { useCart } from "../store/cart";

export default function CheckoutForm() {
  const { items, total, clear } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // {type:'ok'|'warn'|'err', text:string}

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

      const ct = resp.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await resp.json() : null;

      if (resp.ok && data?.ok) {
        if (data.channels?.telegram && !data.channels?.email) {
          setMsg({
            type: "warn",
            text: "Отправлено в Telegram. Почта пока не настроена.",
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
        setMsg({ type: "err", text: "Не удалось отправить. Повторите." });
      }
    } catch {
      setMsg({
        type: "err",
        text: "Сбой сети. Проверьте интернет и повторите.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex justify-center">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl rounded-2xl p-4 md:p-6 bg-white/5 backdrop-blur border border-white/10 space-y-3"
      >
        <div className="text-white/80 text-lg font-semibold">
          Оформление заказа
        </div>
        <div className="text-white/60 text-sm">
          Товаров: {items?.length || 0} • Итого: {total ?? 0} руб.
        </div>

        <input
          className="w-full rounded-md px-3 py-2 bg-white/10 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/30"
          placeholder="Ваше имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full rounded-md px-3 py-2 bg-white/10 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/30"
          placeholder="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          className="w-full rounded-md px-3 py-2 bg-white/10 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/30"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <textarea
          className="w-full min-h-[90px] rounded-md px-3 py-2 bg-white/10 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/30"
          placeholder="Комментарий"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button
          disabled={loading}
          className="w-full rounded-md px-4 py-3 bg-black text-white font-semibold disabled:opacity-60"
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
    </div>
  );
}
