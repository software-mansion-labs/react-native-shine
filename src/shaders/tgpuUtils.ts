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

export const bloomColorShift = tgpu.fn(
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
