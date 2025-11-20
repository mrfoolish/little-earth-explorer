import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

interface GlobeProps {
  onLocationSelect: (lat: number, lng: number) => void;
  isInteracting: boolean;
}

function Earth({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const earthRef = useRef<THREE.Mesh>(null);
  // Using a high-quality public domain earth texture
  const colorMap = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
  
  useFrame(() => {
    if (earthRef.current) {
      // Slow rotation
      earthRef.current.rotation.y += 0.0005;
    }
  });

  const handleClick = (event: any) => {
    event.stopPropagation();
    const point = event.point; // Vector3 in world space
    if (!earthRef.current) return;

    // Transform local point to lat/lng
    // Assuming the sphere is at (0,0,0) and not rotated drastically by parent
    // We need to account for the mesh rotation to get accurate geographic click
    const localPoint = earthRef.current.worldToLocal(point.clone());
    const normalized = localPoint.normalize();

    // Calculate Lat/Lon from normalized vector
    // y is up in Three.js
    const lat = 90 - (Math.acos(normalized.y) * 180 / Math.PI);
    const lng = ((Math.atan2(normalized.x, normalized.z) * 180 / Math.PI) + 270) % 360 - 180; // Offset might be needed depending on texture UV

    onSelect(lat, -lng); // Negate lng to match standard map projection often used in textures
  };

  return (
    <mesh ref={earthRef} onClick={handleClick} scale={2.5}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial 
        map={colorMap} 
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
}

const Globe: React.FC<GlobeProps> = ({ onLocationSelect, isInteracting }) => {
  return (
    <div className="w-full h-screen cursor-pointer">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Earth onSelect={onLocationSelect} />
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          minDistance={3.5} 
          maxDistance={10}
          autoRotate={!isInteracting}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default Globe;
