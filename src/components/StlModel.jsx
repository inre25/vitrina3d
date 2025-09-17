// src/components/StlModel.jsx
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";

export default function StlModel({
  url,
  color = "#cccccc",
  scale = 1,
  baseScale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  clippingPlanes = [],
}) {
  let geometry;
  try {
    geometry = useLoader(STLLoader, url);
  } catch (e) {
    geometry = null;
  }

  if (!geometry) {
    // fallback, если файла нет — тихо рисуем кубик
    return (
      <mesh position={position} rotation={rotation} scale={scale * baseScale}>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial color={color} clippingPlanes={clippingPlanes} />
      </mesh>
    );
  }

  // нормализуем геометрию по центру
  geometry.center();

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale * baseScale}
      castShadow
      receiveShadow
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        color={new THREE.Color(color)}
        metalness={0.05}
        roughness={0.8}
        clippingPlanes={clippingPlanes}
      />
    </mesh>
  );
}
