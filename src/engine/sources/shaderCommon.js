// Shared GLSL for every generative source.
// Each source only writes `vec3 render(vec2 p)` (see generative.js); this prelude
// declares the reactive uniforms, provides noise/colour helpers, and applies the
// global hue/saturation controls in main(). Keeps each shader focused on its look.

export const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Hue/saturation helpers, shared by generative shaders and the texture source.
export const COLOR_GLSL = /* glsl */ `
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }
`;

export const PRELUDE = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  // Audio-reactive uniforms (set every frame from features).
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uRms;
  uniform float uOnset;   // decaying onset envelope 1->0

  // Camera movement 0..1 (0 whenever motion analysis is off), plus its own
  // transient envelope — the visual counterpart to uRms / uOnset.
  uniform float uMotion;
  uniform float uMotionEnv;

  // Global colour controls.
  uniform float uHue;     // additive hue rotation 0..1
  uniform float uSat;     // saturation multiplier 0..~1.5

  uniform vec2 uRes;
` + COLOR_GLSL + /* glsl */ `
  // Cheap value noise + fbm for the flow-field source.
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1, 0));
    float c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  // Provided by each source, appended after this prelude.
  vec3 render(vec2 p);

  void main() {
    // Aspect-correct, centered coordinates.
    vec2 p = vUv - 0.5;
    p.x *= uRes.x / uRes.y;

    vec3 col = render(p);

    // Global hue rotation + saturation scaling on whatever the source produced.
    vec3 hsv = rgb2hsv(col);
    hsv.x = fract(hsv.x + uHue);
    hsv.y = clamp(hsv.y * uSat, 0.0, 1.0);
    col = hsv2rgb(hsv);

    gl_FragColor = vec4(col, 1.0);
  }
`;
