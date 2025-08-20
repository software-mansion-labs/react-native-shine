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

export { charmander, pokemon, pokemonCardMask, pokemonCardMaskGrad };
