"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const COUNT = 1800;

export default function Particles() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x06060f, 1);
    const setSize = () => {
      const { clientWidth: w, clientHeight: h } = container;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 4;

    // points layout — anchor positions in a soft sphere
    const positions = new Float32Array(COUNT * 3);
    const anchors = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const r = Math.pow(Math.random(), 0.7) * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      const z = r * Math.cos(phi) * 0.6;
      anchors[i * 3] = x;
      anchors[i * 3 + 1] = y;
      anchors[i * 3 + 2] = z;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      // color gradient based on radius
      const t = r / 2.2;
      colors[i * 3] = 0.6 + t * 0.4;
      colors[i * 3 + 1] = 0.2 + (1 - t) * 0.3;
      colors[i * 3 + 2] = 0.5 + t * 0.4;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geom, material);
    scene.add(points);
    setSize();

    // mouse projected into world plane (z=0)
    const mouseWorld = new THREE.Vector3(0, 0, 0);
    const pointer = { x: 0, y: 0, active: false };
    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointer.active = true;
    };
    const onLeave = () => (pointer.active = false);
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);

    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.033);
      const t = clock.elapsedTime;

      // mouse world position
      const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5).unproject(camera);
      vec.sub(camera.position).normalize();
      const dist = -camera.position.z / vec.z;
      mouseWorld.copy(camera.position).add(vec.multiplyScalar(dist));

      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        const ax = anchors[ix];
        const ay = anchors[ix + 1];
        const az = anchors[ix + 2];
        let px = positions[ix];
        let py = positions[ix + 1];
        let pz = positions[ix + 2];

        // spring back to anchor
        velocities[ix] += (ax - px) * 4 * dt;
        velocities[ix + 1] += (ay - py) * 4 * dt;
        velocities[ix + 2] += (az - pz) * 4 * dt;

        // repulsion from mouse
        if (pointer.active) {
          const dx = px - mouseWorld.x;
          const dy = py - mouseWorld.y;
          const d2 = dx * dx + dy * dy + 0.05;
          if (d2 < 1.2) {
            const f = (0.7 / d2) * dt * 2.5;
            velocities[ix] += dx * f;
            velocities[ix + 1] += dy * f;
          }
        }

        // damping
        velocities[ix] *= 0.92;
        velocities[ix + 1] *= 0.92;
        velocities[ix + 2] *= 0.92;

        positions[ix] = px + velocities[ix];
        positions[ix + 1] = py + velocities[ix + 1];
        positions[ix + 2] = pz + velocities[ix + 2];
      }

      posAttr.needsUpdate = true;
      points.rotation.y = t * 0.04;
      points.rotation.x = Math.sin(t * 0.2) * 0.08;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => setSize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
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
      <div className="pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center gap-2">
        <div className="font-mono text-base tracking-[0.4em] text-white/70">wooo.uk</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
          interact with the swarm
        </div>
      </div>
    </div>
  );
}
