// src/components/StlModel.jsx
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";

export default function StlModel({
  url,
  color = "#cccccc",
  scale = 1, // пользовательский слайдер
  baseScale = 1, // из конфига модели (множитель)
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  clippingPlanes = [],
  // НОВОЕ: автоподгон по XY под ширину fitXY (в «мм» единицах сцены)
  autoFit = true,
  fitXY = 140, // во сколько «мм» уложить модель по XY (подгони под свой стол)
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
        <boxGeometry args={[20, 20, 20]} />
        <meshStandardMaterial color={color} clippingPlanes={clippingPlanes} />
      </mesh>
    );
  }

  // === Выравнивание: центр по XY, "пяткой" на Z=0 ===
  geometry.computeBoundingBox();
  const box = geometry.boundingBox.clone();
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // переносим геометрию так, чтобы:
  // - центр по X/Y в (0,0)
  // - низ модели (min.z) в 0 -> стоит на столе
  geometry.translate(-center.x, -center.y, -box.min.z);

  // === Авто-масштаб по XY под fitXY (например 140 мм) ===
  const maxXY = Math.max(size.x, size.y) || 1;
  const autoK = autoFit ? fitXY / maxXY : 1;
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
