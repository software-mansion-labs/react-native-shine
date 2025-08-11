import { Image } from 'react-native';

const sourceCharmander = require('../assets/charmander.png.webp');
const charmander = Image.resolveAssetSource(sourceCharmander).uri;

const sourcePokemon = require('../assets/pokemon.png');
const pokemon = Image.resolveAssetSource(sourcePokemon).uri;

export { charmander, pokemon };
