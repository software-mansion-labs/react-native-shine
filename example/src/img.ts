import { Image } from 'react-native';

const sourceCharmander = require('../assets/charmander.png.webp');
const charmander = Image.resolveAssetSource(sourceCharmander).uri;

const sourcePokemon = require('../assets/pokemon.png');
const pokemon = Image.resolveAssetSource(sourcePokemon).uri;

const sourcePokemonCardMask = require('../assets/pokemonCardMask.png');
const pokemonCardMask = Image.resolveAssetSource(sourcePokemonCardMask).uri;

const sourcePokemonCardMaskGrad = require('../assets/pokemonCardMaskGrad.png');
const pokemonCardMaskGrad = Image.resolveAssetSource(
  sourcePokemonCardMaskGrad
).uri;

const sourceWildCharge = require('../assets/wild_charge.png');
const wildCharge = Image.resolveAssetSource(sourceWildCharge).uri;

const sourceWildChargeMask = require('../assets/masked_wild_charge.png');
const wildChargeMask = Image.resolveAssetSource(sourceWildChargeMask).uri;

export {
  charmander,
  pokemon,
  pokemonCardMask,
  pokemonCardMaskGrad,
  wildCharge,
  wildChargeMask,
};
