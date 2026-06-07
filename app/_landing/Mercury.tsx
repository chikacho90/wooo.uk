"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
    return mix(b, a, h) - k*h*(1.0-h);
  }

  float scene(vec3 p) {
    vec3 m = vec3(uMouse * 1.8, 0.0);
    float d = length(p - m) - 0.75;

    vec3 b1 = vec3(cos(uTime*0.61)*1.3, sin(uTime*0.47)*0.7, sin(uTime*0.35)*0.5);
    d = smin(d, length(p - b1) - 0.55, 0.65);

    vec3 b2 = vec3(sin(uTime*0.38+1.0)*1.5, cos(uTime*0.55)*0.5, cos(uTime*0.28)*0.6);
    d = smin(d, length(p - b2) - 0.48, 0.65);

    vec3 b3 = vec3(cos(uTime*0.45+2.5)*0.95, sin(uTime*0.68+1.5)*0.95, sin(uTime*0.5)*0.4);
    d = smin(d, length(p - b3) - 0.42, 0.65);

    return d;
  }

  vec3 normal(vec3 p) {
    vec2 e = vec2(0.0015, 0.0);
    return normalize(vec3(
      scene(p + e.xyy) - scene(p - e.xyy),
      scene(p + e.yxy) - scene(p - e.yxy),
      scene(p + e.yyx) - scene(p - e.yyx)
    ));
  }

  vec3 sky(vec3 d) {
    float h = d.y * 0.5 + 0.5;
    vec3 c = mix(vec3(0.04, 0.02, 0.10), vec3(0.42, 0.18, 0.38), smoothstep(0.0, 0.55, h));
    c = mix(c, vec3(0.92, 0.58, 0.62), smoothstep(0.7, 1.0, h));
    return c;
  }

  void main() {
    vec2 uv = (vUv - 0.5);
    uv.x *= uResolution.x / uResolution.y;
    uv *= 2.4;

    vec3 ro = vec3(0.0, 0.0, -4.5);
    vec3 rd = normalize(vec3(uv, 2.0));

    float t = 0.0;
    bool hit = false;
    vec3 pos = ro;

    for (int i = 0; i < 96; i++) {
      pos = ro + rd * t;
      float d = scene(pos);
      if (d < 0.001) { hit = true; break; }
      if (t > 18.0) break;
      t += d * 0.85;
    }

    vec3 bg = sky(rd);
    vec3 col = bg;

    if (hit) {
      vec3 n = normal(pos);
      vec3 view = -rd;
      vec3 ref = reflect(rd, n);
      float fres = pow(1.0 - max(0.0, dot(n, view)), 4.0);
      vec3 refSky = sky(ref);
      vec3 base = mix(vec3(0.08, 0.04, 0.12), refSky, fres * 1.4);

      vec3 ld = normalize(vec3(0.6, 0.8, -0.5));
      float lambert = max(0.0, dot(n, ld));
      base += lambert * vec3(0.18, 0.10, 0.20) * 0.4;

      vec3 hVec = normalize(view + ld);
      float spec = pow(max(0.0, dot(n, hVec)), 90.0);
      base += spec * vec3(1.0, 0.85, 0.95) * 0.9;

      col = base;
    }

    float g = fract(sin(dot(vUv, vec2(12.9898, 78.233)) + uTime) * 43758.5453);
    col += (g - 0.5) * 0.022;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function Mercury() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geom = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
    });
    const mesh = new THREE.Mesh(geom, material);
    scene.add(mesh);

    const setSize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      material.uniforms.uResolution.value.set(w, h);
    };
    setSize();

    const target = new THREE.Vector2(0, 0);
    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const aspect = rect.width / rect.height;
      target.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2 * aspect;
      target.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener("pointermove", onMove);

    const onResize = () => setSize();
    window.addEventListener("resize", onResize);

    let raf = 0;
    const start = performance.now();
    const tick = () => {
      material.uniforms.uTime.value = (performance.now() - start) / 1000;
      // ease mouse
      const m = material.uniforms.uMouse.value as THREE.Vector2;
      m.x += (target.x - m.x) * 0.08;
      m.y += (target.y - m.y) * 0.08;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("pointermove", onMove);
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
      <div ref={ref} className="absolute inset-0 cursor-crosshair" />
      <div className="pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center gap-1.5">
        <div
          className="font-mono text-2xl font-light tracking-[0.4em] text-white/85"
          style={{ textShadow: "0 0 24px rgba(255,180,200,0.25)" }}
        >
          wooo.uk
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
          push the mercury
        </div>
      </div>
    </div>
  );
}
