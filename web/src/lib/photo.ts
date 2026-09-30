const MAX_SIDE = 1600; // px, longest side
const QUALITY = 0.8;

/**
 * Shrinks a picked image and re-encodes it as JPEG before upload, as the mobile
 * picker does. Falls back to the original file if the browser can't decode it.
 */
export async function preparePhoto(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    return blob ?? file;
  } catch {
    return file;
  }
}
