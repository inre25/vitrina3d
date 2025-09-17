// src/components/StlModel.jsx
import React, { useEffect, useMemo, useState } from "react";
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
  upAxis = "z", // 'z' (по умолчанию) или 'y' — как приходит STL
  fitXY = 120, // «ширина» на столе в условных мм
}) {
  const [geom, setGeom] = useState(null);
  const [errored, setErrored] = useState(false);

  // Грузим STL вручную, ловим ошибки, ничего не бросаем в React
  useEffect(() => {
    let mounted = true;
    setGeom(null);
    setErrored(false);

    const loader = new STLLoader();
    loader.load(
      url,
      (g) => {
        if (!mounted) return;

        // Ориентация: приводим к Z-up, если исходник Y-up
        const geom = g.clone();
        if (upAxis === "y") geom.rotateX(Math.PI / 2);

        // Центр по XY и «пяткой» на Z=0
        geom.computeBoundingBox();
        const box = geom.boundingBox.clone();
        const center = new THREE.Vector3();
        box.getCenter(center);
        geom.translate(-center.x, -center.y, -box.min.z);

        geom.computeBoundingBox();
        setGeom(geom);
      },
      undefined,
      (err) => {
        console.error("STL load failed:", url, err);
        if (mounted) setErrored(true);
      }
    );

    return () => {
      mounted = false;
    };
  }, [url, upAxis]);

  // Авто-масштаб под fitXY (после нормализации геометрии)
  const finalScale = useMemo(() => {
    if (!geom) return 0; // пока грузится — не рисуем
    const size = new THREE.Vector3();
    geom.boundingBox.getSize(size);
    const maxXY = Math.max(size.x, size.y) || 1;
    const autoK = fitXY / maxXY;
    return scale * baseScale * autoK;
  }, [geom, scale, baseScale, fitXY]);

  if (errored) return null;
  if (!geom) return null;

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={finalScale}
      castShadow
      receiveShadow
    >
      <primitive object={geom} attach="geometry" />
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
