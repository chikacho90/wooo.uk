"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { VERT_FULLSCREEN, FRAG_NOISE_GRADIENT } from "./shaders";

export default function Shader({ children }: { children?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const setSize = () => {
      const { clientWidth: w, clientHeight: h } = container;
      renderer.setSize(w, h, false);
      material.uniforms.uResolution.value.set(w, h);
    };
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geom = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT_FULLSCREEN,
      fragmentShader: FRAG_NOISE_GRADIENT,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uIntensity: { value: 1.0 },
      },
    });
    const mesh = new THREE.Mesh(geom, material);
    scene.add(mesh);
    setSize();

    let raf = 0;
    const start = performance.now();
    const tick = () => {
      material.uniforms.uTime.value = (performance.now() - start) / 1000;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => setSize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      geom.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <div ref={ref} className="absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center select-none">
          <div className="font-mono text-[11px] tracking-[0.6em] text-white/40 uppercase">
            wooo.uk
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
