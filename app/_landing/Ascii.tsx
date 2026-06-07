"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const CHARS = " .,:;i!|+*=oxXO%#@";

function makeAtlas(): { tex: THREE.Texture; cellW: number; cellH: number; count: number } {
  const cellW = 8;
  const cellH = 16;
  const count = CHARS.length;
  const canvas = document.createElement("canvas");
  canvas.width = cellW * count;
  canvas.height = cellH;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = `${cellH - 2}px "Menlo", "Consolas", monospace`;
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  for (let i = 0; i < count; i++) {
    ctx.fillText(CHARS[i], i * cellW + cellW / 2, 0);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return { tex, cellW, cellH, count };
}

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
  uniform vec2 uCell;
  uniform float uCount;
  uniform sampler2D uAtlas;

  vec3 hash3(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float gnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
              dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
          mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
              dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
      mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
              dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
          mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
              dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),
      u.z);
  }

  float fbm(vec3 p) {
    float a = 0.5, v = 0.0;
    for (int i = 0; i < 4; i++) { v += a * gnoise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 pixel = vUv * uResolution;
    vec2 cellIdx = floor(pixel / uCell);
    vec2 cellCenterPx = (cellIdx + 0.5) * uCell;
    vec2 cellCenterUv = cellCenterPx / uResolution;

    vec2 p = cellCenterUv;
    p.x *= uResolution.x / uResolution.y;

    float n = fbm(vec3(p * 2.4, uTime * 0.18));
    n = n * 0.5 + 0.5;

    // mouse glow
    vec2 m = uMouse;
    m.x *= uResolution.x / uResolution.y;
    float md = distance(p, m);
    float glow = exp(-md * 4.5);
    n = clamp(n + glow * 0.5, 0.0, 1.0);

    // map intensity to char index
    float idx = floor(n * (uCount - 0.001));

    // local UV within cell
    vec2 local = (pixel - cellIdx * uCell) / uCell;

    vec2 atlasUv = vec2((idx + local.x) / uCount, local.y);
    float c = texture2D(uAtlas, atlasUv).r;

    vec3 cool = vec3(0.20, 0.95, 0.78);
    vec3 warm = vec3(1.0, 0.85, 0.55);
    vec3 tint = mix(cool, warm, glow);

    vec3 bg = vec3(0.01, 0.025, 0.03);
    vec3 col = mix(bg, tint, c * (0.4 + 0.6 * n));

    // scanline
    col *= 0.92 + 0.08 * sin(pixel.y * 1.2);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function Ascii() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const atlas = makeAtlas();

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geom = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uCell: { value: new THREE.Vector2(atlas.cellW, atlas.cellH) },
        uCount: { value: atlas.count },
        uAtlas: { value: atlas.tex },
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

    const target = new THREE.Vector2(0.5, 0.5);
    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      target.x = (e.clientX - rect.left) / rect.width;
      target.y = 1 - (e.clientY - rect.top) / rect.height;
    };
    container.addEventListener("pointermove", onMove);

    const onResize = () => setSize();
    window.addEventListener("resize", onResize);

    let raf = 0;
    const start = performance.now();
    const tick = () => {
      material.uniforms.uTime.value = (performance.now() - start) / 1000;
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
      atlas.tex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <div ref={ref} className="absolute inset-0 cursor-crosshair" />
      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-1.5">
        <div className="rounded border border-emerald-300/20 bg-black/60 px-3 py-1 font-mono text-xs tracking-[0.5em] text-emerald-200/90 backdrop-blur-sm">
          WOOO.UK
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
          ascii / live field
        </div>
      </div>
    </div>
  );
}
