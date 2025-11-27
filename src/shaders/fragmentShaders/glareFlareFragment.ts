import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  glareFlareBindGroupLayout,
  sharedBindGroupLayout,
} from '../bindGroupLayouts';
import { getPixelColorFromVector } from '../tgpuUtils';
import { HSLToRGB, RGBToHSL } from '../colorConversions';

export const glareFlareFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const uv = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const centeredCoords = std.sub(std.mul(uv, 2.0), 1.0);

  let color = getPixelColorFromVector(uv);

  const rot = sharedBindGroupLayout.$.rot;
  const center = std.add(d.vec2f(0.0), d.vec2f(rot.x, rot.y)); // do not change
  let dist = std.distance(center, centeredCoords);

  // Normalize UV coordinates to be between -1 and 1
  let uv_norm = std.sub(std.mul(input.uv, 2.0), 1.0);

  // Calculate distance from center and ensure it does not exceed 1
  let angle = std.atan2(std.add(rot.y, uv_norm.y), std.sub(rot.x, uv_norm.x));

  dist = std.clamp(dist, 0.0, 1.0);
  // Parameters for flare components
  let flare_intensity = glareFlareBindGroupLayout.$.glareFlare.flareIntensity;
  let spot_intensity = glareFlareBindGroupLayout.$.glareFlare.flareIntensity;
  let ring_intensity = glareFlareBindGroupLayout.$.glareFlare.ringIntensity;
  let ray_intensity = glareFlareBindGroupLayout.$.glareFlare.rayIntensity;
  let falloff = glareFlareBindGroupLayout.$.glareFlare.falloff;
  let ray_count = glareFlareBindGroupLayout.$.glareFlare.rayCount;

  // Central bright spot with distance-based falloff
  let spot = spot_intensity / (dist * falloff + 0.1);

  // Rings calculation, also respecting the texture boundary
  let ring1 = (std.sin(dist * 10.0) * ring_intensity) / (dist * falloff + 0.5);
  let ring2 = (std.sin(dist * 20.0) * ring_intensity) / (dist * falloff + 0.3);

  const noise = std.abs(std.sin(rot.x)) + std.abs(std.cos(rot.y));
  // Ray calculation: create a series of sharp radial spikes
  let ray_angle = angle * ray_count + noise;

  // Enhanced variability in ray length and size
  let ray_length_factor =
    0.25 + 0.95 * std.abs(std.sin(angle * 3.0 * noise)) * noise;
  let ray_size_factor =
    0.05 + 1.15 * std.abs(std.cos(angle * 13.0 * noise)) + noise;

  // Apply variability to rays
  let ray =
    std.pow(std.abs(std.sin(ray_angle)), 15.0 * ray_size_factor) *
    ray_intensity *
    (1.0 - dist * ray_length_factor) *
    noise;

  // Combine all flare components
  let flare = spot + ring1 + ring2 + ray;

  // Calculate fade factor to black based on distance to the edge
  let edge_fade = 1.0 - dist;

  // Apply edge fade
  const flareFaded = flare * edge_fade;
  const flareFinal = std.clamp(flareFaded * flare_intensity, 0.0, 1.0);

  const hslColor = RGBToHSL(color.xyz);
  const lightness = std.clamp(hslColor.z + flareFinal, 0.0, 1.0);
  const combined = HSLToRGB(d.vec3f(hslColor.xy, lightness));
  // Final color with flare intensity, clamped to prevent oversaturation
  // color = d.vec4f(std.mix(color.xyz, combined, glow), color.w);
  return d.vec4f(combined, color.w);
});
