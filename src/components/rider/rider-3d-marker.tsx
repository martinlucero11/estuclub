'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, Float, Trail } from '@react-three/drei';
import * as THREE from 'three';

interface Rider3DMarkerProps {
    lat: number;
    lng: number;
    heading: number | null;
    zoom: number;
    isDark?: boolean;
}

function ScooterModel({ heading, isDark, zoom }: { heading: number | null; isDark?: boolean; zoom: number }) {
    const { scene } = useGLTF('/assets/rider/models/vespa_scooter.gltf');
    const groupRef = useRef<THREE.Group>(null);
    const lastHeading = useRef(0);



    // Apply emissive if dark mode
    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                const material = mesh.material as THREE.MeshStandardMaterial;
                if (material) {
                    // Optimized for premium visibility
                    material.emissive = new THREE.Color(isDark ? '#ff4d6d' : '#cb465a');
                    material.emissiveIntensity = isDark ? 0.8 : 0.4;
                    material.roughness = 0.1;
                    material.metalness = 1.0;
                }
            }
        });
    }, [scene, isDark]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Smooth rotation for heading
        const targetHeading = heading !== null ? (heading * Math.PI) / 180 : lastHeading.current;
        
        // Normalize rotation
        let diff = targetHeading - groupRef.current.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        
        groupRef.current.rotation.y += diff * 0.1;
        lastHeading.current = groupRef.current.rotation.y;
    });

    // Professional Fixed Scale
    const constantScale = 1.5;

    return (
        <group ref={groupRef}>
            <Trail
                width={8}
                length={20}
                color={new THREE.Color('#cb465a')}
                attenuation={(t) => t}
            >
                <mesh position={[0, 0.4, -0.8]} visible={false}>
                    <sphereGeometry args={[0.1]} />
                </mesh>
            </Trail>
            <primitive 
                object={scene} 
                scale={constantScale} 
                // Position centered in canvas
                position={[0, 0, 0]} 
                rotation={[0, 0, 0]}
            />
        </group>
    );
}

export function Rider3DMarker({ lat, lng, heading, zoom, isDark }: Rider3DMarkerProps) {
    return (
        <div className="w-[200px] h-[200px] relative pointer-events-none flex items-center justify-center">
            <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-[#cb465a] rounded-full animate-pulse shadow-[0_0_15px_rgba(203,70,90,0.6)]" />
                </div>
            }>
                <Canvas
                    camera={{ position: [0, 5, 10], fov: 35, near: 0.1, far: 1000 }}
                    gl={{ antialias: true, alpha: true, logarithmicDepthBuffer: true }}
                    style={{ background: 'transparent', width: '100%', height: '100%' }}
                >
                    <ambientLight intensity={isDark ? 3.0 : 1.5} />
                    <pointLight position={[10, 10, 10]} intensity={2.5} />
                    <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={2.5} />
                    
                    <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.25}>
                        <ScooterModel heading={heading} isDark={isDark} zoom={zoom} />
                    </Float>

                    <ContactShadows 
                        position={[0, -0.1, 0]} 
                        opacity={0.5} 
                        scale={5} 
                        blur={2.5} 
                        far={0.8} 
                    />
                    <Environment preset="city" />
                </Canvas>
            </Suspense>
        </div>
    );
}
