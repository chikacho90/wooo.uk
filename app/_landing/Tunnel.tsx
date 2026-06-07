"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const COUNT = 320;
const SPAWN_Z = -120;
const KILL_Z = 6;
const RING_RADIUS = 7;

export default function Tunnel() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x05030a, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x05030a, 30, 90);

    const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 200);
    camera.position.set(0, 0, 0);

    // Instanced cubes arranged in rings down the tunnel
    const cubeGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.4,
      roughness: 0.45,
      emissive: 0x130319,
      emissiveIntensity: 0.6,
    });
    const inst = new THREE.InstancedMesh(cubeGeom, cubeMat, COUNT);

    type Datum = { angle: number; rOffset: number; spin: THREE.Vector3 };
    const data: Datum[] = [];
    const positions: THREE.Vector3[] = [];
    const rotations: THREE.Euler[] = [];

    const respawn = (i: number, z?: number) => {
      const angle = Math.random() * Math.PI * 2;
      const rOffset = RING_RADIUS + (Math.random() - 0.5) * 4;
      const pz = z ?? SPAWN_Z + Math.random() * (KILL_Z - SPAWN_Z);
      data[i] = {
        angle,
        rOffset,
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04,
        ),
      };
      positions[i] = new THREE.Vector3(
        Math.cos(angle) * rOffset,
        Math.sin(angle) * rOffset,
        pz,
      );
      rotations[i] = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
    };

    for (let i = 0; i < COUNT; i++) respawn(i);

    const tmpMat = new THREE.Matrix4();
    const tmpQuat = new THREE.Quaternion();
    const tmpScale = new THREE.Vector3(1, 1, 1);

    const colorA = new THREE.Color(0x9a4dff);
    const colorB = new THREE.Color(0xff5d8f);
    const colorC = new THREE.Color(0x4dd4ff);
    const tmpColor = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      const t = i / COUNT;
      tmpColor.copy(colorA).lerp(colorB, Math.sin(t * Math.PI));
      if (i % 3 === 0) tmpColor.lerp(colorC, 0.4);
      inst.setColorAt(i, tmpColor);
    }

    scene.add(inst);

    // lights
    const ambient = new THREE.AmbientLight(0x4030a0, 0.6);
    scene.add(ambient);
    const point = new THREE.PointLight(0xff6f9a, 3, 30);
    point.position.set(0, 0, -8);
    scene.add(point);
    const point2 = new THREE.PointLight(0x6fa8ff, 2, 30);
    point2.position.set(0, 0, -22);
    scene.add(point2);

    const setSize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    setSize();

    const pointer = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener("pointermove", onMove);

    const onResize = () => setSize();
    window.addEventListener("resize", onResize);

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const speed = 18;

      // camera sway
      camera.position.x += (pointer.x * 1.6 - camera.position.x) * 0.06;
      camera.position.y += (pointer.y * 1.0 - camera.position.y) * 0.06;
      camera.lookAt(camera.position.x * 0.3, camera.position.y * 0.3, -10);

      for (let i = 0; i < COUNT; i++) {
        const d = data[i];
        const p = positions[i];
        p.z += speed * dt;
        if (p.z > KILL_Z) {
          respawn(i, SPAWN_Z);
          continue;
        }
        // wobble ring radius
        const rWobble = d.rOffset + Math.sin(t * 0.4 + d.angle * 3) * 0.4;
        p.x = Math.cos(d.angle + t * 0.04) * rWobble;
        p.y = Math.sin(d.angle + t * 0.04) * rWobble;

        const r = rotations[i];
        r.x += d.spin.x;
        r.y += d.spin.y;
        r.z += d.spin.z;

        tmpQuat.setFromEuler(r);
        const scaleAt = Math.max(0.5, 1.0 - Math.abs(p.z + 50) / 70);
        tmpScale.set(scaleAt, scaleAt, scaleAt);
        tmpMat.compose(p, tmpQuat, tmpScale);
        inst.setMatrixAt(i, tmpMat);
      }
      inst.instanceMatrix.needsUpdate = true;

      point.position.z = -8 + Math.sin(t * 0.6) * 5;
      point2.position.z = -22 + Math.cos(t * 0.4) * 5;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("pointermove", onMove);
      cubeGeom.dispose();
      cubeMat.dispose();
      inst.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <div ref={ref} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
        <div
          className="font-mono text-3xl font-light tracking-[0.35em] text-white sm:text-5xl"
          style={{
            textShadow: "0 0 30px rgba(154,77,255,0.6), 0 0 8px rgba(255,93,143,0.4)",
            mixBlendMode: "screen",
          }}
        >
          wooo.uk
        </div>
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.5em] text-white/40">
          forward / forever
        </div>
      </div>
    </div>
  );
}
