// src/components/LayerSlicer.jsx
import React, { useMemo, Suspense } from "react"; // ← ДОБАВИЛИ Suspense
import StlModel from "./StlModel.jsx";
import config from "../config/admin.json";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";

/** Внутренняя сцена: включаем локальный клиппинг + свет, сетка, контролы */
function ClippingScene() {
  const { gl } = useThree();
  gl.localClippingEnabled = true;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 5, 6]} intensity={0.8} castShadow />
      <Grid
        args={[20, 20]}
        sectionColor="#2dd4bf"
        cellColor="#334155"
        position={[0, 0, -0.001]}
      />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </>
  );
}

/** Главный компонент сцены */
export default function LayerSlicer({
  currentLayer,
  layerHeight,
  layers,
  models = config.models || [],
  modelColors = {},
  scale = 1,
}) {
  const cameraProps = { position: [4, 4, 4], fov: 45 };

  // плоскость среза (сверху вниз по Z)
  const clipZ = useMemo(
    () => currentLayer * layerHeight,
    [currentLayer, layerHeight]
  );
  const slicingPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, -1), clipZ),
    [clipZ]
  );

  return (
    <Canvas
      shadows
      camera={cameraProps}
      style={{ height: "70vh", minHeight: 440 }}
    >
      <ClippingScene />
      {/* ВАЖНО: оборачиваем модели в Suspense, чтобы не падать при загрузке */}
      <Suspense fallback={null}>
        {models.map((m) => (
          <StlModel
            key={m.id}
            url={m.file}
            color={modelColors[m.id] || "#cccccc"}
            baseScale={m.scale || 1}
            scale={scale}
            position={m.position || [0, 0, 0]}
            clippingPlanes={[slicingPlane]}
            upAxis={m.upAxis || "z"} // ← из admin.json
            fitXY={m.fitXY ?? 120} // ← из admin.json (мм по XY)
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
