export const VERT_FULLSCREEN = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Slowly evolving gradient noise — purple/violet/teal palette
export const FRAG_NOISE_GRADIENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uIntensity;

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
      mix(
        mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
            dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
        mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
            dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x),
        u.y),
      mix(
        mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
            dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
        mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
            dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x),
        u.y),
      u.z);
  }

  float fbm(vec3 p) {
    float a = 0.5;
    float v = 0.0;
    for (int i = 0; i < 5; i++) {
      v += a * gnoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
    float t = uTime * 0.06;

    float n = fbm(vec3(p * 1.8, t));
    n = n * 0.5 + 0.5;

    float n2 = fbm(vec3(p * 0.6 + n, t * 1.3));
    n2 = n2 * 0.5 + 0.5;

    vec3 c1 = vec3(0.02, 0.01, 0.06);
    vec3 c2 = vec3(0.10, 0.04, 0.22);
    vec3 c3 = vec3(0.36, 0.10, 0.42);
    vec3 c4 = vec3(0.85, 0.42, 0.50);

    vec3 col = mix(c1, c2, smoothstep(0.2, 0.6, n));
    col = mix(col, c3, smoothstep(0.55, 0.85, n));
    col = mix(col, c4, smoothstep(0.85, 0.98, n2) * uIntensity);

    // vignette
    float v = 1.0 - dot(p, p) * 0.45;
    col *= v;

    // subtle film grain
    float grain = fract(sin(dot(uv, vec2(12.9898, 78.233)) + uTime) * 43758.5453);
    col += (grain - 0.5) * 0.025;

    gl_FragColor = vec4(col, 1.0);
  }
`;
