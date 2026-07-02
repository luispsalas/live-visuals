// Generative shader sources. Each defines `vec3 render(vec2 p)` returning RGB (0..1),
// where p is aspect-corrected centered coords. The shared prelude (shaderCommon.js)
// supplies uniforms, noise helpers, and the global hue/sat post-processing.

export const GENERATIVE = [
  {
    id: 'plasma',
    name: 'Plasma',
    body: /* glsl */ `
      vec3 render(vec2 p) {
        float t = uTime * 0.6;
        float v = sin(p.x * 6.0 + t);
        v += sin((p.y * 6.0 + t) * 1.3);
        v += sin((p.x + p.y) * 5.0 + t * 0.8);
        float r = length(p);
        v += sin(r * (8.0 + uBass * 30.0) - t * 2.0); // bass = ripple density
        v *= 0.25;

        float hue = 0.6 + 0.2 * v + uMid * 0.3;
        float val = 0.5 + 0.5 * sin(v * 3.14159);
        val *= 0.5 + uRms * 1.5 + uOnset * 0.5;     // loudness/onset = brightness
        return hsv2rgb(vec3(fract(hue), 0.7, clamp(val, 0.0, 1.0)));
      }
    `,
  },
  {
    id: 'flow',
    name: 'Flow field',
    body: /* glsl */ `
      vec3 render(vec2 p) {
        vec2 q = p * 2.0;
        float t = uTime * 0.15;
        vec2 warp = vec2(fbm(q + t), fbm(q + vec2(5.2, 1.3) - t));
        float f = fbm(q + warp * (1.5 + uBass * 3.0));  // bass deepens the warp

        float hue = 0.55 + 0.4 * f + uTreble * 0.2;
        float val = smoothstep(0.2, 0.9, f) * (0.6 + uRms * 1.5) + uOnset * 0.4;
        float sat = 0.6 + 0.3 * uMid;
        return hsv2rgb(vec3(fract(hue), sat, clamp(val, 0.0, 1.0)));
      }
    `,
  },
  {
    id: 'kaleido',
    name: 'Kaleidoscope',
    body: /* glsl */ `
      vec3 render(vec2 p) {
        float a = atan(p.y, p.x);
        float r = length(p);
        float seg = floor(6.0 + uTreble * 10.0);       // treble = number of mirrors
        a = mod(a, 6.2831853 / seg);
        a = abs(a - 3.14159265 / seg);
        vec2 q = vec2(cos(a), sin(a)) * r;

        float pattern = sin(q.x * 20.0 - uTime * 2.0) * sin(q.y * 20.0 + uTime * 1.5);
        float ring = sin(r * (15.0 + uBass * 40.0) - uTime * 3.0);
        float v = 0.5 + 0.5 * pattern * ring;
        v *= 0.4 + uRms * 1.8 + uOnset * 0.6;

        float hue = r * 0.5 + uMid * 0.4;
        return hsv2rgb(vec3(fract(hue), 0.8, clamp(v, 0.0, 1.0)));
      }
    `,
  },
  {
    id: 'tunnel',
    name: 'Tunnel',
    body: /* glsl */ `
      vec3 render(vec2 p) {
        float r = length(p) + 0.0001;
        float a = atan(p.y, p.x);
        float depth = 0.3 / r + uTime * (0.4 + uBass * 1.6);   // bass = rush speed
        float rings = 0.5 + 0.5 * sin(depth * 18.0);
        float stripes = 0.5 + 0.5 * sin(a * (6.0 + floor(uTreble * 12.0)));
        float v = mix(rings, rings * stripes, 0.6);
        v *= smoothstep(0.0, 0.14, r);                          // dark vanishing point
        v *= 0.4 + uRms * 1.5 + uOnset * 0.4;
        float hue = fract(depth * 0.12 + a * 0.08 + uMid * 0.2);
        return hsv2rgb(vec3(hue, 0.7, clamp(v, 0.0, 1.0)));
      }
    `,
  },
  {
    id: 'metaballs',
    name: 'Metaballs',
    body: /* glsl */ `
      vec3 render(vec2 p) {
        float t = uTime * 0.5;
        float field = 0.0;
        for (int i = 0; i < 5; i++) {
          float fi = float(i);
          vec2 c = 0.32 * vec2(sin(t * (0.7 + fi * 0.13) + fi), cos(t * (0.6 + fi * 0.11) + fi * 1.7));
          float rad = 0.06 + 0.03 * (1.0 + sin(t + fi)) + uBass * 0.05;  // bass swells blobs
          field += rad * rad / (dot(p - c, p - c) + 0.0002);
        }
        float body = smoothstep(0.85, 1.15, field);
        float edge = smoothstep(0.92, 1.0, field) - smoothstep(1.0, 1.12, field);
        float fh = field / (1.0 + field);              // saturates -> no core aliasing
        float hue = fract(0.55 + fh * 0.4 + uMid * 0.3);
        float v = body * (0.5 + uRms * 1.2) + edge * (0.6 + uOnset);
        return hsv2rgb(vec3(hue, 0.7, clamp(v, 0.0, 1.0)));
      }
    `,
  },
  {
    id: 'voronoi',
    name: 'Voronoi cells',
    body: /* glsl */ `
      vec3 render(vec2 p) {
        float scale = 3.0 + floor(uTreble * 8.0);   // treble = cell density
        vec2 g = p * scale;
        vec2 ip = floor(g);
        vec2 fp = fract(g);
        float d1 = 8.0, d2 = 8.0;
        vec2 cellId = vec2(0.0);
        for (int j = -1; j <= 1; j++)
        for (int i = -1; i <= 1; i++) {
          vec2 o = vec2(float(i), float(j));
          vec2 h = vec2(hash(ip + o), hash(ip + o + 3.7));
          vec2 pt = o + 0.5 + 0.4 * sin(uTime + 6.2831853 * h);
          float d = length(fp - pt);
          if (d < d1) { d2 = d1; d1 = d; cellId = ip + o; }
          else if (d < d2) { d2 = d; }
        }
        float edge = smoothstep(0.0, 0.06, d2 - d1);  // ~0 on cell borders
        float cid = hash(cellId * 0.7);
        float hue = fract(0.12 + cid + uMid * 0.2);
        float v = mix(1.0, cid * 0.5 + 0.4, edge) * (0.5 + uRms * 1.0);
        v += (1.0 - edge) * uOnset * 0.9;             // borders flash on onset
        return hsv2rgb(vec3(hue, 0.6, clamp(v, 0.0, 1.0)));
      }
    `,
  },
  {
    id: 'julia',
    name: 'Julia fractal',
    body: /* glsl */ `
      vec3 render(vec2 p) {
        vec2 z = p * 2.2;
        float t = uTime * 0.15;
        vec2 c = 0.7 * vec2(cos(t), sin(t * 1.3)) + uBass * 0.12 * vec2(cos(t * 3.0), sin(t * 2.0));
        float it = 0.0;
        for (int i = 0; i < 48; i++) {
          z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
          if (dot(z, z) > 4.0) break;
          it += 1.0;
        }
        float m = it / 48.0;
        float hue = fract(0.6 + m * 0.8 + uMid * 0.2);
        float v = (m < 1.0 ? 0.3 + 0.7 * sqrt(m) : 0.0) * (0.6 + uRms * 0.8) + uOnset * 0.2;
        return hsv2rgb(vec3(hue, 0.7, clamp(v, 0.0, 1.0)));
      }
    `,
  },
  {
    id: 'interference',
    name: 'Interference',
    body: /* glsl */ `
      vec3 render(vec2 p) {
        float t = uTime * 0.2;
        float ang1 = t + uMid * 3.14159;             // mid = grating angle
        float ang2 = -t * 0.7 + uMid * 1.5;
        float freq = 30.0 + uTreble * 60.0;
        float g1 = sin(dot(p, vec2(cos(ang1), sin(ang1))) * freq);
        float g2 = sin(dot(p, vec2(cos(ang2), sin(ang2))) * freq * (1.0 + 0.1 * sin(t)));
        float m = g1 * g2;                            // moiré
        float v = pow(0.5 + 0.5 * m, 1.5);
        v *= 0.5 + uRms * 1.2 + uOnset * 0.3;
        float hue = fract(0.55 + 0.2 * m + uBass * 0.2);
        return hsv2rgb(vec3(hue, 0.55, clamp(v, 0.0, 1.0)));
      }
    `,
  },
];
