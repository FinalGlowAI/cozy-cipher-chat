import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsMobile } from '@/hooks/use-mobile';

function Particles({ isMobile }: { isMobile: boolean }) {
  const particlesRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const sparksRef = useRef<THREE.Points>(null);
  
  const particleCount = isMobile ? 30 : 100;
  const connectionDistance = 2;

  // Create particles
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return { positions, velocities };
  }, []);

  // Animate particles and connections
  useFrame((state) => {
    if (!particlesRef.current || !linesRef.current || !sparksRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const linePositions: number[] = [];
    const sparkPositions: number[] = [];
    
    // Update particle positions
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += particles.velocities[i * 3];
      positions[i * 3 + 1] += particles.velocities[i * 3 + 1];
      positions[i * 3 + 2] += particles.velocities[i * 3 + 2];
      
      // Bounce off boundaries
      if (Math.abs(positions[i * 3]) > 10) particles.velocities[i * 3] *= -1;
      if (Math.abs(positions[i * 3 + 1]) > 10) particles.velocities[i * 3 + 1] *= -1;
      if (Math.abs(positions[i * 3 + 2]) > 5) particles.velocities[i * 3 + 2] *= -1;
    }
    
    // Create connections and sparks
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < connectionDistance) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
          
          // Add spark effect in the middle of connection
          if (Math.random() > 0.95) {
            sparkPositions.push(
              (positions[i * 3] + positions[j * 3]) / 2,
              (positions[i * 3 + 1] + positions[j * 3 + 1]) / 2,
              (positions[i * 3 + 2] + positions[j * 3 + 2]) / 2
            );
          }
        }
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Update lines
    linesRef.current.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3)
    );
    
    // Update sparks
    sparksRef.current.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(sparkPositions, 3)
    );
    
    // Rotate camera slowly
    state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.5;
    state.camera.position.y = Math.cos(state.clock.elapsedTime * 0.15) * 0.5;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {/* Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particles.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color="#a855f7"
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      {/* Neural connections */}
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.3}
        />
      </lineSegments>

      {/* Sparks */}
      <points ref={sparksRef}>
        <bufferGeometry />
        <pointsMaterial
          size={0.2}
          color="#60a5fa"
          transparent
          opacity={0.9}
          sizeAttenuation
        />
      </points>
    </>
  );
}

export function NeuralBackground() {
  const isMobile = useIsMobile();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check if WebGL is available
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setHasError(true);
    }
  }, []);

  if (hasError) {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10 opacity-40 pointer-events-none">
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 75 }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setHasError(true);
          });
        }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <Particles isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
