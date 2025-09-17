// src/components/StlModel.jsx
import React, { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";

export default function StlModel({
  url,
  color = "#cccccc",
  scale = 1, // пользовательский слайдер
  baseScale = 1, // множитель из конфига модели
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  clippingPlanes = [],
  // НОВОЕ: ось «вверх» исходного STL: 'z' (по умолчанию) или 'y'
  upAxis = "z",
  // ширина, под которую ужимаем модель по XY (единицы сцены == мм)
  fitXY = 120,
}) {
  const raw = useLoader(STLLoader, url);

  // Готовим геометрию один раз
  const prepared = useMemo(() => {
    if (!raw) return null;
    const geom = raw.clone();

    // Приводим к Z-up, если исходник Y-up
    if (upAxis === "y") geom.rotateX(Math.PI / 2);

    // Центр по XY и «пяткой» на Z=0
    geom.computeBoundingBox();
    const box = geom.boundingBox.clone();
    const center = new THREE.Vector3();
    box.getCenter(center);
    geom.translate(-center.x, -center.y, -box.min.z);

    // Размеры после нормализации
    geom.computeBoundingBox();
    const size = new THREE.Vector3();
    geom.boundingBox.getSize(size);

    return { geom, size };
  }, [raw, upAxis]);

  // Авто-масштаб по XY под fitXY
  const autoK = useMemo(() => {
    if (!prepared) return 1;
    const maxXY = Math.max(prepared.size.x, prepared.size.y) || 1;
    return fitXY / maxXY;
  }, [prepared, fitXY]);

  const finalScale = scale * baseScale * autoK;

  if (!prepared) return null;

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={finalScale}
      castShadow
      receiveShadow
    >
      <primitive object={prepared.geom} attach="geometry" />
      <meshStandardMaterial
        color={new THREE.Color(color)}
        metalness={0.05}
        roughness={0.8}
        clippingPlanes={clippingPlanes}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
