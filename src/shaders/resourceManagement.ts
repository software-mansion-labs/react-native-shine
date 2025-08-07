import { Asset } from 'expo-asset';

const getBitmapFromURI = async (uri: string): Promise<ImageBitmap> => {
  if (uriToBitmapMap.has(uri)) return uriToBitmapMap.get(uri)!;
  console.log('bitmap not found in cache, fetching from URI');

  const ast = Asset.fromURI(uri);
  await ast.downloadAsync();
  const fileURI = ast.localUri || ast.uri;

  console.log('fetch completed, creating ImageBitmap');
  const response = await fetch(fileURI);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  uriToBitmapMap.set(uri, imageBitmap);
  return imageBitmap;
};

const uriToBitmapMap = new Map<string, ImageBitmap>();

export default getBitmapFromURI;
