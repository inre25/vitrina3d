import { useState, useMemo } from "react";
import { useCart } from "./store/cart";
import Cart from "./components/Cart";
import LayerSlicer from "./components/LayerSlicer.jsx";
import CheckoutForm from "./components/CheckoutForm";
import config from "./config/admin.json";

// палитра (поддержка строк и {hex,name})
const palette = (config.colors || []).map((c) =>
  typeof c === "string" ? { hex: c, name: null } : c
);

export default function App() {
  const [currentProductId, setCurrentProductId] = useState(
    config.products?.[0]?.id || null
  );
  const currentProduct =
    config.products.find((p) => p.id === currentProductId) || null;

  const [layerHeight, setLayerHeight] = useState(0.2);
  const [layers, setLayers] = useState(100);
  const [currentLayer, setCurrentLayer] = useState(50);

  const maxHeightMM = useMemo(
    () => Number((layers * layerHeight).toFixed(2)),
    [layers, layerHeight]
  );
  const currentHeightMM = useMemo(
    () => Number((currentLayer * layerHeight).toFixed(2)),
    [currentLayer, layerHeight]
  );

  const { items, addItem, clearCart } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  const price = useMemo(() => {
    if (currentProduct?.price) return Number(currentProduct.price);
    return Number((currentHeightMM * 5).toFixed(2));
  }, [currentProduct, currentHeightMM]);

  const totalSum = useMemo(
    () => items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0),
    [items]
  );

  // масштаб и ЦВЕТА ДЛЯ ДВУХ МОДЕЛЕЙ
  const [scale, setScale] = useState(1);
  const [activeModel, setActiveModel] = useState("a");
  const [modelColors, setModelColors] = useState({
    a: palette[0] || { hex: "#ffffff", name: "белый" },
    b: palette[1] || { hex: "#000000", name: "черный" },
  });

  const applyColor = (c) =>
    setModelColors((prev) => ({ ...prev, [activeModel]: c }));

  const handleAdd = () => {
    const cA = modelColors.a || {};
    const cB = modelColors.b || {};
    addItem({
      title: currentProduct?.title || "3D-печать (демо)",
      productId: currentProduct?.id || null,
      layerHeight,
      layers,
      currentLayer,
      heightMM: currentHeightMM,
      scale,
      // записываем оба цвета
      colorA: cA.hex,
      colorAName: cA.name,
      colorB: cB.hex,
      colorBName: cB.name,
      price,
    });
    setCartOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6 flex items-baseline justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Витрина3D
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 py-2 font-semibold"
            >
              + В корзину ({price.toFixed(0)} руб.)
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-2"
            >
              Корзина {items.length ? `(${items.length})` : ""}
            </button>
          </div>
        </header>

        {/* каталог как был */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Каталог</h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {config.products.map((p) => (
              <button
                key={p.id}
                onClick={() => setCurrentProductId(p.id)}
                className={`text-left rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/10 p-3 transition ${
                  currentProductId === p.id
                    ? "outline outline-2 outline-emerald-500"
                    : ""
                }`}
                title={p.title}
              >
                <div className="aspect-[4/3] w-full rounded-lg bg-black/30 flex items-center justify-center overflow-hidden">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xs opacity-60">нет изображения</span>
                  )}
                </div>
                <div className="mt-2 text-sm font-medium">{p.title}</div>
                <div className="text-xs opacity-80">{p.price} руб.</div>
              </button>
            ))}
          </div>
        </section>

        {/* настройки */}
        <section className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-4 shadow-xl ring-1 ring-white/10">
            <label className="block text-sm mb-2">Текущий слой</label>
            <input
              type="range"
              min={0}
              max={layers}
              value={currentLayer}
              onChange={(e) => setCurrentLayer(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="mt-2 text-sm opacity-90">
              <div>
                Слой: <b>{currentLayer}</b> / {layers}
              </div>
              <div>
                Высота: <b>{currentHeightMM} мм</b> из {maxHeightMM} мм
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 shadow-xl ring-1 ring-white/10">
            <label className="block text-sm mb-2">Масштаб</label>
            <input
              type="range"
              min={config.scale.min}
              max={config.scale.max}
              step={config.scale.step}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-2 text-sm opacity-90">
              Текущее: <b>{scale.toFixed(1)}×</b>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 shadow-xl ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm">Цвет (палитра админа)</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setActiveModel("a")}
                  className={`px-2 py-1 rounded text-xs ${
                    activeModel === "a"
                      ? "bg-emerald-600"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                >
                  Фигура A
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModel("b")}
                  className={`px-2 py-1 rounded text-xs ${
                    activeModel === "b"
                      ? "bg-emerald-600"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                >
                  Фигура B
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {palette.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => applyColor(c)}
                  className={`w-7 h-7 rounded-full ring-2 transition ${
                    modelColors[activeModel]?.hex === c.hex
                      ? "ring-white"
                      : "ring-white/20"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name || c.hex}
                />
              ))}
            </div>

            <div className="mt-2 text-sm opacity-90 flex items-center gap-4">
              <span className="flex items-center gap-2">
                A:
                <span
                  className="w-4 h-4 rounded-full ring-1 ring-white/30"
                  style={{ backgroundColor: modelColors.a?.hex }}
                />
                <code className="text-xs opacity-70">
                  {modelColors.a?.name || modelColors.a?.hex}
                </code>
              </span>
              <span className="flex items-center gap-2">
                B:
                <span
                  className="w-4 h-4 rounded-full ring-1 ring-white/30"
                  style={{ backgroundColor: modelColors.b?.hex }}
                />
                <code className="text-xs opacity-70">
                  {modelColors.b?.name || modelColors.b?.hex}
                </code>
              </span>
            </div>
          </div>
        </section>

        {/* СЦЕНА с двумя STL */}
        <div className="rounded-3xl bg-black/40 ring-1 ring-white/10 shadow-2xl overflow-hidden">
          <LayerSlicer
            currentLayer={currentLayer}
            layerHeight={layerHeight}
            layers={layers}
            models={config.models}
            modelColors={{ a: modelColors.a?.hex, b: modelColors.b?.hex }}
            scale={scale}
          />
        </div>

        <footer className="mt-6 text-xs opacity-70">
          Ползунок поднимает клип-плоскость по оси Z и «отрезает» часть модели.
        </footer>
      </div>

      <Cart open={cartOpen} setOpen={setCartOpen} />

      {items.length > 0 && (
        <section id="checkout" className="max-w-5xl mx-auto my-8">
          <CheckoutForm
            cart={items}
            total={totalSum}
            onSuccess={() => {
              clearCart();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </section>
      )}
    </div>
  );
}
