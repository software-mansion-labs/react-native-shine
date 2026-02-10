import tgpu from 'typegpu';
import * as std from 'typegpu/std';
import * as d from 'typegpu/data';
import { sharedBindGroupLayout } from './bindGroupLayouts';

export const hueShift = tgpu.fn(
  [d.vec3f, d.f32],
  d.vec3f
)((rgb, angle) => {
  const hsv = rgbToHSV(rgb);
  const shiftedH = std.fract(std.add(hsv.x, angle / 360.0));
  const shiftedRGB = hsvToRGB(d.vec3f(shiftedH, hsv.y, hsv.z));
  return shiftedRGB;
});

export const rgbToHSV = tgpu.fn(
  [d.vec3f],
  d.vec3f
)((rgb) => {
  const K = d.vec4f(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  const p = std.mix(
    d.vec4f(rgb.z, rgb.y, K.w, K.z),
    d.vec4f(rgb.y, rgb.z, K.x, K.y),
    std.step(rgb.z, rgb.y)
  );
  const q = std.mix(
    d.vec4f(p.x, p.y, p.w, rgb.x),
    d.vec4f(rgb.x, p.y, p.z, p.x),
    std.step(p.x, rgb.x)
  );

  const v = std.max(q.x, q.y);
  const d_val = std.sub(v, std.min(q.y, q.w));
  const epsilon = d.f32(1.0e-10);

  const h_temp = std.add(
    q.z,
    std.div(std.sub(q.w, q.y), std.add(std.mul(6.0, d_val), epsilon))
  );
  const h = std.fract(h_temp);
  const s = std.div(d_val, std.add(v, epsilon));

  return d.vec3f(h, s, v);
});

export const hsvToRGB = tgpu.fn(
  [d.vec3f],
  d.vec3f
)((hsv) => {
  const h = hsv.x;
  const s = hsv.y;
  const v = hsv.z;

  // Multiply by 6.0 to convert [0,1] hue range to [0,6] sector range
  const h2 = h * d.f32(6.0);

  const i = std.floor(h2);
  const f = h2 - i;

  const p = v * (d.f32(1) - s);
  const q = v * (d.f32(1) - s * f);
  const t = v * (d.f32(1) - s * (d.f32(1) - f));

  // GPU-compatible sector selection using step functions
  const i0 = std.step(0.0, i) - std.step(1.0, i);
  const i1 = std.step(1.0, i) - std.step(2.0, i);
  const i2 = std.step(2.0, i) - std.step(3.0, i);
  const i3 = std.step(3.0, i) - std.step(4.0, i);
  const i4 = std.step(4.0, i) - std.step(5.0, i);
  const i5 = std.step(5.0, i) - std.step(6.0, i);

  const r = i0 * v + i1 * q + i2 * p + i3 * p + i4 * t + i5 * v;
  const g = i0 * t + i1 * v + i2 * v + i3 * q + i4 * p + i5 * p;
  const b = i0 * p + i1 * p + i2 * t + i3 * v + i4 * v + i5 * q;

  return d.vec3f(r, g, b);
});

export const fmod = tgpu.fn(
  [d.f32, d.f32],
  d.f32
)((number, md) => {
  const dv = std.div(number, md);
  const val = std.mul(md, std.floor(dv));
  const c = std.sub(number, val);

  return c;
});

export const glareColorShift = tgpu.fn(
  [d.vec3f, d.f32],
  d.vec3f
)((color, power) => {
  const maxValue = std.max(std.max(color.x, color.y), color.z);
  const scale = std.mix(
    d.f32(1.0),
    d.f32(1.0) / std.max(maxValue, d.f32(0.001)),
    power
  );
  const boosted = std.mul(color, scale);
  const saturated = std.mix(color, boosted, power);

  return saturated;
});

export const overlayChannel = tgpu.fn(
  [d.f32, d.f32],
  d.f32
)((base, blend) => {
  const mult = std.mul(2.0, std.mul(base, blend));

  const screen = std.sub(
    1.0,
    std.mul(2.0, std.mul(std.sub(1.0, base), std.sub(1.0, blend)))
  );

  return std.select(screen, mult, base < d.f32(0.5));
});

export const overlayChannels = tgpu.fn(
  [d.vec3f, d.vec3f],
  d.vec3f
)((base, blend) => {
  return d.vec3f(
    overlayChannel(base.x, blend.x),
    overlayChannel(base.y, blend.y),
    overlayChannel(base.z, blend.z)
  );
});

/** Rec.601 luma */
export const luma601 = tgpu.fn(
  [d.vec3f],
  d.f32
)((rgb) => {
  return std.add(
    std.mul(rgb.x, 0.299),
    std.add(std.mul(rgb.y, 0.587), std.mul(rgb.z, 0.114))
  );
});

export const tiltTowardsLighterNeighbor = tgpu.fn(
  [d.vec3f, d.f32],
  d.vec3f
)((rgb, t) => {
  const toYellow = d.vec3f(std.max(rgb.x, rgb.y), std.max(rgb.x, rgb.y), rgb.z);
  const toCyan = d.vec3f(rgb.x, std.max(rgb.y, rgb.z), std.max(rgb.y, rgb.z));

  const yYellow = luma601(toYellow);
  const yCyan = luma601(toCyan);

  const toColor = std.select(toCyan, toYellow, yYellow >= yCyan);

  const tClamped = std.clamp(t, 0.0, 1.0);
  return std.mix(rgb, toColor, tClamped);
});

export const linearstep = tgpu.fn(
  [d.f32, d.f32, d.f32],
  d.f32
)((num1, num2, x) => {
  const t = (x - num1) / (num2 - num1);
  return std.clamp(t, 0, 1);
});

export const getPixelColorFromVector = tgpu.fn(
  [d.vec2f],
  d.vec4f
)((coords) => {
  return std.textureSample(
    sharedBindGroupLayout.$.texture,
    sharedBindGroupLayout.$.sampler,
    coords
  );
});

export const getPixelColorFromNonReversedVector = tgpu.fn(
  [d.vec2f],
  d.vec4f
)((input) => {
  const coords = d.vec2f(input.x, 1.0 - input.y);
  return getPixelColorFromVector(coords);
});

export const random = tgpu.fn(
  [d.vec2f],
  d.f32
)((st) => {
  return std.fract(
    std.sin(std.dot(st, d.vec2f(12.9898, 78.233))) * 437358.845701
  );
});
