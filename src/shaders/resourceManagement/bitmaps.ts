import { Asset } from 'expo-asset';
import { debug } from '../../config/debugMode';

const getBitmapFromURI = async (uri: string): Promise<ImageBitmap> => {
  if (uriToBitmapMap.has(uri)) return uriToBitmapMap.get(uri)!;
  if (debug) console.log('bitmap not found in cache, fetching from URI');

  const ast = Asset.fromURI(uri);
  await ast.downloadAsync();
  const fileURI = ast.localUri || ast.uri;

  if (debug) console.log('fetch completed, creating ImageBitmap');
  const response = await fetch(fileURI);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  if (debug) console.log('bitmap size: ', imageBitmap);
  uriToBitmapMap.set(uri, imageBitmap);
  return imageBitmap;
};

const uriToBitmapMap = new Map<string, ImageBitmap>();

export default getBitmapFromURI;
