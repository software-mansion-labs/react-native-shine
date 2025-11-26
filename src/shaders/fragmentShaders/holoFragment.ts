import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  holoBindGroupLayout,
  sharedBindGroupLayout,
} from '../bindGroupLayouts';
import {
  getPixelColorFromVector,
  hsvToRGB,
  hueShift,
  overlayChannels,
  random,
} from '../tgpuUtils';
import { waveCallbackSlot } from '../../enums/waveCallback';

export const holo = tgpu.fn(
  [d.vec2f, d.f32, d.f32, d.f32],
  d.vec4f
)((uv, directionDegreeModifier, shiftModifier, rotationShiftPowerModifier) => {
  const rot = sharedBindGroupLayout.$.rot;

  const textureColor = getPixelColorFromVector(uv);

  const directionDegree = std.add(
    holoBindGroupLayout.$.holoOptions.directionDegree,
    directionDegreeModifier
  );
  const shift = std.add(holoBindGroupLayout.$.holoOptions.shift, shiftModifier);
  const rotationShiftPower = std.mul(
    holoBindGroupLayout.$.holoOptions.rotationShiftPower,
    rotationShiftPowerModifier
  );
  const holoSize = holoBindGroupLayout.$.holoOptions.holoSize;
  const holoMultiplier = holoBindGroupLayout.$.holoOptions.holoMultiplier;

  //todo: need to redo logic of this, it should base on the calcualted diff size not add additional width
  const holoEaseSize = holoBindGroupLayout.$.holoOptions.holoEaseSize;
  const holoVisibility = holoBindGroupLayout.$.holoOptions.holoVisibility;
  const holoSaturation = holoBindGroupLayout.$.holoOptions.holoSaturation;

  const angelDegrees = std.radians(
    std.add(
      holoBindGroupLayout.$.holoOptions.directionDegree,
      directionDegreeModifier
    )
  );

  const yMultiplier = std.abs(std.cos(angelDegrees));
  const xMultiplier = std.abs(std.sin(angelDegrees));
  const range = std.add(xMultiplier, yMultiplier);

  const intervalSize = std.div(range, holoMultiplier);
  const x =
    std.add(std.mul(uv.x, xMultiplier), std.mul(uv.y, yMultiplier)) + shift + 1; //scale to [0,2)

  const rotationShift = std.add(
    std.mul(rot.x, xMultiplier),
    std.mul(rot.y, yMultiplier)
  );
  const shiftMultiplied = std.mul(rotationShift, rotationShiftPower);
  const offset = shiftMultiplied + shift; //why is shitft here?

  const xOffseted = (x + offset) % intervalSize;
  const diffractionSizeCalculated = std.mul(holoSize, intervalSize);
  const diffractionNoiseSizeCalcualted = std.mul(
    diffractionSizeCalculated,
    holoEaseSize
  );
  const diffractionStart = diffractionNoiseSizeCalcualted;
  const diffractionEnd = std.add(diffractionSizeCalculated, diffractionStart);

  const t =
    (xOffseted - diffractionStart) / (diffractionEnd - diffractionStart);
  const holoRotated = std.select(0, Math.PI, directionDegree > 179);
  const ft = (1 - std.cos(Math.PI * t - holoRotated)) / 2;
  const hue = -0.06 + ft * 0.85;
  const hueWithNoise = std.add(std.div(random(uv.xy) - 0.5, 180) * 40, hue); //check with normal distribution
  const missingRedHue = hueWithNoise + 1.0; // maps negative values to red from the end of hue
  const rainbowAccurateHue = std.select(
    missingRedHue,
    hueWithNoise,
    hueWithNoise > 0
  );

  const boundaryCheck = std.any(
    d.vec2b(xOffseted < diffractionStart, xOffseted > diffractionEnd)
  );
  const xBoundary = std.select(
    diffractionStart - xOffseted,
    xOffseted - diffractionEnd,
    xOffseted > diffractionStart
  );
  const xBoundaryScalled = std.div(xBoundary, diffractionNoiseSizeCalcualted);
  const boundaryVisibilityScalled = std.pow(xBoundaryScalled, 2);
  const calculatedVisibility = std.clamp(
    std.mix(
      holoVisibility,
      1,
      boundaryVisibilityScalled * d.f32(boundaryCheck)
    ),
    0,
    1
  );

  const shiftedRGB = hsvToRGB(d.vec3f(rainbowAccurateHue, holoSaturation, 1));
  const vsibilityAdjustsed = std.mul(calculatedVisibility, textureColor.w);
  return d.vec4f(shiftedRGB, vsibilityAdjustsed);
});

export const doubleHoloFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const uv = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const firstHolo = holo(uv, 0, 0, 1);
  const secondHolo = holo(uv, 178, 0.59, -1);
  const aa = std.add(firstHolo.w, secondHolo.w);
  const vis = std.sub(2.0, aa);
  const test = std.sub(1, vis);
  const visibility = std.clamp(test, 0.9, 1);
  const singleColor = std.select(firstHolo, secondHolo, secondHolo.w !== 1);
  const addedColor = d.vec4f(
    overlayChannels(firstHolo.xyz, secondHolo.xyz),
    visibility
  );
  const finalColor = std.select(
    singleColor,
    addedColor,
    std.all(d.vec2b(secondHolo.w !== 1, firstHolo.w !== 1))
  );

  return finalColor;
});

export const holoFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const uv = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  return holo(uv, 0, 0, 1);
});

export const oldHoloFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const uv = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const textureColor = getPixelColorFromVector(uv);
  const rot = sharedBindGroupLayout.$.rot;

  const wave = waveCallbackSlot.$(rot.xy);
  const waveX = wave.x;
  const waveY = wave.y;

  const band = std.add(waveX * uv.x, waveY * uv.y * 2.0);
  // const band = waveX * uv.x;

  //TODO: fix holo
  const frequency = d.f32(1.0);
  const hueAngle = d.f32(180) * std.mul(band, frequency * Math.PI * rot.x);
  const rainbowColor = hueShift(d.vec3f(uv.x, 0.0, 0.0), hueAngle);
  const finalColor = std.mul(rainbowColor, 1.0);

  // console.log('\ncurrentColor = (', rainbowColor.xyz, ')');
  // console.log('hueAngle = ', hueAngle);
  // console.clear();
  return d.vec4f(finalColor, 0.9 * textureColor.w);
});
