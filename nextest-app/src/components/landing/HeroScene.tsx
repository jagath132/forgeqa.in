import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Line } from "@react-three/drei";
import * as THREE from "three";

function FloatingCube({ position, color, size = 0.4, speed = 1 }: { position: [number, number, number]; color: string; size?: number; speed?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.x = clock.getElapsedTime() * 0.3 * speed;
      ref.current.rotation.y = clock.getElapsedTime() * 0.5 * speed;
      ref.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 0.5 * speed) * 0.15;
    }
  });
  return (
    <Float speed={1.5 * speed} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={ref} position={position}>
        <boxGeometry args={[size, size, size]} />
        <MeshDistortMaterial color={color} emissive={color} emissiveIntensity={0.15} roughness={0.2} metalness={0.8} distort={0.05} />
      </mesh>
    </Float>
  );
}

function FloatingTorus({ position, color, args = [0.5, 0.12, 16, 32], speed = 1 }: { position: [number, number, number]; color: string; args?: [number, number, number, number]; speed?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.x = clock.getElapsedTime() * 0.2 * speed;
      ref.current.rotation.z = clock.getElapsedTime() * 0.3 * speed;
    }
  });
  return (
    <Float speed={1.2 * speed} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={ref} position={position}>
        <torusGeometry args={args} />
        <MeshDistortMaterial color={color} emissive={color} emissiveIntensity={0.1} roughness={0.3} metalness={0.6} transparent opacity={0.7} />
      </mesh>
    </Float>
  );
}

function FloatingIcosahedron({ position, color, size = 0.35 }: { position: [number, number, number]; color: string; size?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.x = clock.getElapsedTime() * 0.4;
      ref.current.rotation.y = clock.getElapsedTime() * 0.6;
    }
  });
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={ref} position={position}>
        <icosahedronGeometry args={[size, 0]} />
        <MeshDistortMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.1} metalness={0.9} wireframe />
      </mesh>
    </Float>
  );
}

function CentralEngine() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(t * 0.15) * 0.1;
      meshRef.current.rotation.y = t * 0.2;
      meshRef.current.rotation.z = Math.cos(t * 0.1) * 0.05;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.05);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.06} />
      </mesh>
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[0.7, 0]} />
        <MeshDistortMaterial
          color="#3B82F6"
          emissive="#06B6D4"
          emissiveIntensity={0.4}
          roughness={0.1}
          metalness={0.9}
          distort={0.1}
          speed={2}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 0.9, Math.sin((i / 8) * Math.PI * 2) * 0.9, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#06B6D4" />
        </mesh>
      ))}
    </group>
  );
}

function OrbitingRing({ radius = 2, color = "#3B82F6", speed = 0.3, offset = 0 }: { radius?: number; color?: string; speed?: number; offset?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * speed + offset;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1 + offset) * 0.1;
    }
  });

  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push([Math.cos(angle) * radius, Math.sin(angle) * radius * 0.3, 0]);
    }
    return pts;
  }, [radius]);

  return (
    <group ref={ref}>
      <Line points={points} color={color} opacity={0.15} transparent lineWidth={1} />
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[
          Math.cos((i / 6) * Math.PI * 2) * radius,
          Math.sin((i / 6) * Math.PI * 2) * radius * 0.3,
          0
        ]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function DataParticles({ count = 80 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.03} color="#3B82F6" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

function ConnectionLines() {
  const geometry = useMemo(() => {
    const nodes: [number, number, number][] = [
      [-2.5, 1.2, -1], [2.8, -0.8, -0.5], [-2, -1.5, 0.5], [3, 1.5, 0],
      [-3, 0.5, 1], [1.5, -2, -1], [-1, 2, 0.8], [2, -1, 1.5]
    ];
    const positions: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.65) {
          positions.push(...nodes[i], ...nodes[j]);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#3B82F6" transparent opacity={0.06} />
    </lineSegments>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#3B82F6" />
      <pointLight position={[-5, -3, 2]} intensity={0.3} color="#8B5CF6" />
      <directionalLight position={[0, 5, 0]} intensity={0.2} />

      <CentralEngine />
      <OrbitingRing radius={2.2} color="#3B82F6" speed={0.2} />
      <OrbitingRing radius={3} color="#8B5CF6" speed={-0.15} offset={1} />
      <OrbitingRing radius={3.8} color="#06B6D4" speed={0.12} offset={2} />

      <FloatingCube position={[-2.5, 1.2, -0.5]} color="#3B82F6" size={0.35} speed={0.8} />
      <FloatingCube position={[2.8, -0.8, 0.3]} color="#06B6D4" size={0.3} speed={1.1} />
      <FloatingCube position={[-2, -1.5, 0.8]} color="#8B5CF6" size={0.25} speed={0.6} />
      <FloatingCube position={[3, 1.5, -0.3]} color="#22C55E" size={0.3} speed={0.9} />
      <FloatingCube position={[-3, 0.5, 1.2]} color="#F43F5E" size={0.2} speed={1.3} />
      <FloatingCube position={[1.5, -2, -0.8]} color="#F59E0B" size={0.25} speed={0.7} />
      <FloatingCube position={[-1, 2, 1]} color="#3B82F6" size={0.3} speed={0.5} />
      <FloatingCube position={[2, -1, 1.5]} color="#06B6D4" size={0.2} speed={1.0} />

      <FloatingTorus position={[-1.8, 1.8, -1]} color="#3B82F6" args={[0.4, 0.08, 16, 32]} speed={0.7} />
      <FloatingTorus position={[2.2, -1.5, 1]} color="#8B5CF6" args={[0.35, 0.06, 16, 32]} speed={0.9} />
      <FloatingTorus position={[1.2, 2, 0.5]} color="#06B6D4" args={[0.3, 0.05, 16, 32]} speed={1.2} />

      <FloatingIcosahedron position={[-2, -1, 1.8]} color="#3B82F6" size={0.3} />
      <FloatingIcosahedron position={[2.5, 0.5, -1.5]} color="#8B5CF6" size={0.25} />
      <FloatingIcosahedron position={[-0.5, -2, 2]} color="#06B6D4" size={0.2} />

      <DataParticles count={120} />
      <ConnectionLines />
    </>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <SceneContent />
    </Canvas>
  );
}
