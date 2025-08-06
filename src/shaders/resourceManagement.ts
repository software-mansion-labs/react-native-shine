const getBitmapFromURI = async (uri: string): Promise<ImageBitmap> => {
  if (uriToBitmapMap.has(uri)) return uriToBitmapMap.get(uri)!;

  const response = await fetch(uri);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  uriToBitmapMap.set(uri, imageBitmap);
  return imageBitmap;
};

const uriToBitmapMap = new Map<string, ImageBitmap>();

export default getBitmapFromURI;
