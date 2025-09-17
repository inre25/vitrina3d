// src/components/StlModel.jsx
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";

export default function StlModel({
  url,
  color = "#cccccc",
  // пользовательский слайдер
  scale = 1,
  // множитель из конфига модели
  baseScale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  clippingPlanes = [],
  // НОВОЕ: приводим STL к Z-up и автоподгоняем по XY
  zUp = true,
  fitXY = 3.0, // ширина в единицах сцены, под которую ужать модель по X/Y (под стол)
}) {
  let geometry;
  try {
    geometry = useLoader(STLLoader, url);
  } catch {
    geometry = null;
  }

  if (!geometry) {
    return (
      <mesh position={position} rotation={rotation} scale={scale * baseScale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} clippingPlanes={clippingPlanes} />
      </mesh>
    );
  }

  // --- ориентация: делаем Z-вверх (многие STL идут Y-up) ---
  if (zUp) {
    // повернули геометрию, не меш
    geometry.rotateX(Math.PI / 2);
  }

  // считаем бокс ПОСЛЕ поворота
  geometry.computeBoundingBox();
  const box = geometry.boundingBox.clone();
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // центр по X/Y и "пяткой" на Z=0 (стоит на столе)
  geometry.translate(-center.x, -center.y, -box.min.z);

  // пересчитать после трансформаций
  geometry.computeBoundingBox();
  const sizeAfter = new THREE.Vector3();
  geometry.boundingBox.getSize(sizeAfter);

  // --- авто-масштаб по XY под fitXY ---
  const maxXY = Math.max(sizeAfter.x, sizeAfter.y) || 1;
  const autoK = fitXY / maxXY; // чем больше fitXY — тем крупнее на столе
  const finalScale = scale * baseScale * autoK;

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={finalScale}
      castShadow
      receiveShadow
    >
      <primitive object={geometry} attach="geometry" />
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
