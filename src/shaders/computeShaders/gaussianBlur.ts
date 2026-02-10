import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  gaussianBlurBindGroupLayout,
  gaussianBlurInputTextureLayout,
} from '../bindGroupLayouts';

// Maximum blur radius supported
const MAX_BLUR_RADIUS = 32;

/**
 * Gaussian blur compute shader.
 * Implements a separable Gaussian blur - run this twice with different directions
 * (horizontal then vertical) for a full 2D blur.
 *
 * Uses gaussianBlurInputTextureLayout for input and gaussianBlurBindGroupLayout for output.
 * For ping-pong: rebind input/output textures between passes.
 */
export const gaussianBlur = tgpu['~unstable'].computeFn({
  in: { gid: d.builtin.globalInvocationId },
  workgroupSize: [8, 8, 1],
})((input) => {
  const x = input.gid.x;
  const y = input.gid.y;
  const size = std.textureDimensions(
    gaussianBlurBindGroupLayout.$.outputTexture
  );

  if (x >= size.x || y >= size.y) return;

  const direction = gaussianBlurBindGroupLayout.$.blurParams.direction;
  const radius = gaussianBlurBindGroupLayout.$.blurParams.radius;
  const sigma = gaussianBlurBindGroupLayout.$.blurParams.sigma;

  const centerUV = d.vec2f(
    (d.f32(x) + 0.5) / d.f32(size.x),
    (d.f32(y) + 0.5) / d.f32(size.y)
  );

  const pixelSize = d.vec2f(1.0 / d.f32(size.x), 1.0 / d.f32(size.y));

  let colorSum = d.vec4f(0.0, 0.0, 0.0, 0.0);
  let weightSum = d.f32(0.0);

  const twoSigmaSq = 2.0 * sigma * sigma;

  for (let i = 0; i < MAX_BLUR_RADIUS * 2 + 1; i++) {
    const offset = d.f32(i) - radius;
    if (std.abs(offset) > radius) continue;

    const weight = std.exp(-(offset * offset) / twoSigmaSq);
    const sampleUV = std.add(
      centerUV,
      std.mul(std.mul(direction, offset), pixelSize)
    );

    // Always read from the input texture bind group
    const sampledColor = std.textureSampleLevel(
      gaussianBlurInputTextureLayout.$.inputTexture,
      gaussianBlurInputTextureLayout.$.inputSampler,
      sampleUV,
      0
    );

    colorSum = std.add(colorSum, std.mul(sampledColor, weight));
    weightSum = weightSum + weight;
  }

  const finalColor = std.div(colorSum, weightSum);

  std.textureStore(
    gaussianBlurBindGroupLayout.$.outputTexture,
    d.vec2u(x, y),
    finalColor
  );
});
