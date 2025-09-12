import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Plane } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";

function ClippingScene({ currentLayer, layerHeight, layers }) {
  const { gl } = useThree();
  gl.localClippingEnabled = true;

  const clipZ = useMemo(
    () => currentLayer * layerHeight,
    [currentLayer, layerHeight]
  );
  const clippingPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, -1), clipZ),
    [clipZ]
  );

  const markerRef = useRef();
  useFrame(() => {
    if (markerRef.current) markerRef.current.position.z = clipZ + 0.001;
  });

  const materialProps = useMemo(
    () => ({
      color: "#9ae6b4",
      clippingPlanes: [clippingPlane],
      clipShadows: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      transparent: true,
      opacity: 0.98,
    }),
    [clippingPlane]
  );

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

      <group ref={markerRef}>
        <Plane args={[6, 6]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.18} />
        </Plane>
      </group>

      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[0, 0, 1.6]} scale={[1, 1, 3]}>
          <torusKnotGeometry args={[0.4, 0.12, 180, 32]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>

        <mesh castShadow receiveShadow position={[1.2, -0.6, 1.2]}>
          <boxGeometry args={[0.6, 0.6, 2.4]} />
          <meshStandardMaterial
            color="#fca5a5"
            clippingPlanes={[clippingPlane]}
            clipShadows
          />
        </mesh>
      </group>

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </>
  );
}

export default function LayerSlicer({ currentLayer, layerHeight, layers }) {
  const cameraProps = { position: [4, 4, 4], fov: 45 };

  return (
    <Canvas
      shadows
      camera={cameraProps}
      style={{ height: "70vh", minHeight: 440 }}
    >
      <ClippingScene
        currentLayer={currentLayer}
        layerHeight={layerHeight}
        layers={layers}
      />
    </Canvas>
  );
}
