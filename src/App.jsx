import { useState, useMemo } from "react";
import { useCart } from "./store/cart";
import Cart from "./components/Cart";
import LayerSlicer from "./components/LayerSlicer.jsx";
import CheckoutForm from "./components/CheckoutForm";

export default function App() {
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

  // === корзина ===
  const { items, addItem } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  const price = useMemo(
    () => Number((currentHeightMM * 5).toFixed(2)),
    [currentHeightMM]
  );

  const handleAdd = () => {
    addItem({
      title: "3D-печать (демо)",
      layerHeight,
      layers,
      currentLayer,
      heightMM: currentHeightMM,
      price,
    });
    setCartOpen(true);
  };
  // =================

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6 flex items-baseline justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            3днаконецто
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 py-2 font-semibold"
              title="Добавить текущую конфигурацию в корзину"
            >
              + В корзину ({price.toFixed(2)})
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-2"
            >
              Корзина {items.length ? `(${items.length})` : ""}
            </button>
          </div>
        </header>

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
            <label className="block text-sm mb-2">Высота слоя (мм)</label>
            <input
              type="range"
              min={0.05}
              max={0.4}
              step={0.05}
              value={layerHeight}
              onChange={(e) => setLayerHeight(Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-2 text-sm opacity-90">
              <div>
                Текущее: <b>{layerHeight} мм</b>
              </div>
              <div className="opacity-70">Обычно 0.08–0.28 мм</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 shadow-xl ring-1 ring-white/10">
            <label className="block text-sm mb-2">Количество слоёв</label>
            <input
              type="range"
              min={20}
              max={300}
              step={1}
              value={layers}
              onChange={(e) => setLayers(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="mt-2 text-sm opacity-90">
              <div>
                Всего слоёв: <b>{layers}</b>
              </div>
              <div>
                Макс. высота: <b>{maxHeightMM} мм</b>
              </div>
            </div>
          </div>
        </section>

        <div className="rounded-3xl bg-black/40 ring-1 ring-white/10 shadow-2xl overflow-hidden">
          <LayerSlicer
            currentLayer={currentLayer}
            layerHeight={layerHeight}
            layers={layers}
          />
        </div>

        <footer className="mt-6 text-xs opacity-70">
          Ползунок поднимает клип-плоскость по оси Z и «отрезает» часть модели.
        </footer>
      </div>

      {/* модалка корзины */}
      <Cart open={cartOpen} setOpen={setCartOpen} />

      {/* форма оформления */}
      {items.length > 0 && (
        <section id="checkout" className="max-w-5xl mx-auto my-8">
          <CheckoutForm />
        </section>
      )}
    </div>
  );
}
