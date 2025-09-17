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
  // нормализация
  zUp = true,
  fitXY = 3.0, // ширина в единицах сцены, под которую ужать модель по X/Y
}) {
  const raw = useLoader(STLLoader, url);

  // Готовим геометрию ОДИН РАЗ (клонируем, чтобы не мутировать исходную)
  const prepared = React.useMemo(() => {
    if (!raw) return null;
    const geom = raw.clone();

    // 1) ориентация: Z вверх
    if (zUp) geom.rotateX(Math.PI / 2);

    // 2) центр по XY и «пяткой» на Z=0 (ставим на стол)
    geom.computeBoundingBox();
    const box = geom.boundingBox.clone();
    const center = new THREE.Vector3();
    box.getCenter(center);
    geom.translate(-center.x, -center.y, -box.min.z);

    // 3) размеры после нормализации
    geom.computeBoundingBox();
    const size = new THREE.Vector3();
    geom.boundingBox.getSize(size);

    return { geom, size };
  }, [raw, zUp]);

  if (!prepared) {
    return (
      <mesh position={position} rotation={rotation} scale={scale * baseScale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} clippingPlanes={clippingPlanes} />
      </mesh>
    );
  }

  // Авто-масштаб под ширину fitXY (по самой большой из X/Y)
  const autoK = React.useMemo(() => {
    const maxXY = Math.max(prepared.size.x, prepared.size.y) || 1;
    return fitXY / maxXY;
  }, [prepared.size, fitXY]);

  const finalScale = scale * baseScale * autoK;

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
