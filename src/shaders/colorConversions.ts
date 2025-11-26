import tgpu from 'typegpu';
import * as std from 'typegpu/std';
import * as d from 'typegpu/data';
// branchless implementation
export const RGBToHSL = tgpu.fn(
  [d.vec3f],
  d.vec3f
)((rgb) => {
  const chroma_max = std.max(rgb.x, std.max(rgb.y, rgb.z));
  const chroma_min = std.min(rgb.x, std.min(rgb.y, rgb.z));
  const chroma = chroma_max - chroma_min;
  const lightness = (chroma_max + chroma_min) / 2.0;

  const safe_chroma = chroma + d.f32(chroma === 0.0);
  const saturation_denomitator = 1.0 - std.abs(2.0 * lightness - 1.0);
  const safe_saturation_denominator =
    saturation_denomitator + d.f32(saturation_denomitator === 0.0);

  const safe_saturation = chroma / safe_saturation_denominator;

  const hue_red = ((rgb.y - rgb.z) / safe_chroma) % 6;
  const hue_green = (rgb.z - rgb.x) / safe_chroma + 2.0;
  const hue_blue = (rgb.x - rgb.y) / safe_chroma + 4.0;

  let hue_prime = hue_red;
  hue_prime = std.select(hue_prime, hue_green, chroma_max === rgb.y);
  hue_prime = std.select(hue_prime, hue_blue, chroma_max === rgb.z);

  hue_prime = std.select(hue_prime, hue_prime + 6, hue_prime < 0);

  const safe_hue = hue_prime * 60;
  const hue = std.select(0.0, safe_hue, chroma !== 0);
  return d.vec3f(hue, safe_saturation, lightness);
});

export const HSLToRGB = tgpu.fn(
  [d.vec3f],
  d.vec3f
)((rgb) => {
  // Your HSL values
  const h = rgb.x;
  const s = rgb.y;
  const l = rgb.z;
  // 1. Calculate Chroma (c)
  let c = (1.0 - std.abs(2.0 * l - 1.0)) * s;

  // 2. Calculate H_prime (H') and the intermediate value (x)
  // H' is H mapped to a 0.0-6.0 range
  let h_prime = (h / 60.0) % 6.0;
  let x = c * (1.0 - std.abs((h_prime % 2.0) - 1.0));

  // 3. Get the integer "sector" (0-5)
  let i = std.floor(h_prime);

  // 4. Find the (r', g', b') triplet using a branchless switch.
  // We multiply each possible triplet by 1.0 if it's the right
  // sector, or 0.0 if not, then add them all together.
  let rgb_prime = d.vec3f(0.0);

  rgb_prime = std.add(
    rgb_prime,
    std.mix(d.vec3f(), d.vec3f(c, x, 0.0), d.f32(i === 0.0))
  );
  rgb_prime = std.add(
    rgb_prime,
    std.mix(d.vec3f(), d.vec3f(x, c, 0.0), d.f32(i === 1.0))
  );
  rgb_prime = std.add(
    rgb_prime,
    std.mix(d.vec3f(), d.vec3f(0, c, x), d.f32(i === 2.0))
  );
  rgb_prime = std.add(
    rgb_prime,
    std.mix(d.vec3f(), d.vec3f(0, x, c), d.f32(i === 3.0))
  );
  rgb_prime = std.add(
    rgb_prime,
    std.mix(d.vec3f(), d.vec3f(x, 0, c), d.f32(i === 4.0))
  );
  rgb_prime = std.add(
    rgb_prime,
    std.mix(d.vec3f(), d.vec3f(c, 0, x), d.f32(i === 5.0))
  );

  // 5. Calculate the lightness offset (m) and add it to all components
  let m = l - c / 2.0;
  return std.add(rgb_prime, d.vec3f(m));
});
