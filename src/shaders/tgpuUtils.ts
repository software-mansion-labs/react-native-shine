import tgpu from 'typegpu';
import * as std from 'typegpu/std';
import * as d from 'typegpu/data';

export const hueShift = tgpu.fn(
  [d.vec3f, d.f32],
  d.vec3f
)((rgb, angle) => {
  const yiqY = std.add(
    std.mul(rgb.x, 0.299),
    std.add(std.mul(rgb.y, 0.587), std.mul(rgb.z, 0.114))
  );
  const yiqI = std.add(
    std.mul(rgb.x, 0.596),
    std.sub(std.mul(rgb.y, -0.274), std.mul(rgb.z, 0.322))
  );
  const yiqQ = std.add(
    std.mul(rgb.x, 0.211),
    std.sub(std.mul(rgb.y, -0.523), std.mul(rgb.z, 0.311))
  );

  // Rotate hue
  const cosA = std.cos(angle);
  const sinA = std.sin(angle);
  const i = std.sub(std.mul(yiqI, cosA), std.mul(yiqQ, sinA));
  const q = std.add(std.mul(yiqI, sinA), std.mul(yiqQ, cosA));

  // Convert back to RGB
  const r = std.add(std.add(yiqY, std.mul(i, 0.956)), std.mul(q, 0.621));
  const g = std.add(std.add(yiqY, std.mul(i, -0.272)), std.mul(q, -0.647));
  const b = std.add(std.add(yiqY, std.mul(i, -1.105)), std.mul(q, 1.702));

  return d.vec3f(r, g, b);
});

export const rgbToHSV = tgpu.fn(
  [d.vec3f],
  d.vec3f
)((rgb) => {
  const cMax = std.max(std.max(rgb.x, rgb.y), rgb.z);
  const cMin = std.min(std.min(rgb.x, rgb.y), rgb.z);
  const delta = std.sub(cMax, cMin);

  const hueDeltaZero = d.f32(0.0);
  const hueRmax = d.f32(60.0) * fmod((rgb.y - rgb.z) / delta, d.f32(6.0));
  const hueGmax = d.f32(60.0) * ((rgb.z - rgb.x) / delta + d.f32(2.0));
  const hueBmax = d.f32(60.0) * ((rgb.x - rgb.y) / delta + d.f32(4.0));

  let hue = std.select(
    hueDeltaZero,
    hueRmax,
    cMax === rgb.x && delta !== d.f32(0.0)
  );
  hue = std.select(hue, hueGmax, cMax === rgb.y && delta !== d.f32(0.0));
  hue = std.select(hue, hueBmax, cMax === rgb.z && delta !== d.f32(0.0));
  hue = std.select(hue, d.f32(0.0), delta === d.f32(0.0));

  hue = std.mod(hue, d.f32(360.0));
  const saturation = std.select(delta / cMax, d.f32(0.0), cMax === d.f32(0.0));
  const value = cMax;

  return d.vec3f(hue, saturation, value);
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
