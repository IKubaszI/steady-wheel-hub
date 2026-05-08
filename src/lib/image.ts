const MAX_DIMENSION = 1800;
const TARGET_MAX_BYTES = 4 * 1024 * 1024;
const START_QUALITY = 0.86;
const MIN_QUALITY = 0.55;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image for compression."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image compression failed."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const image = await loadImage(file);
  const largestSide = Math.max(image.width, image.height);
  const scale = largestSide > MAX_DIMENSION ? MAX_DIMENSION / largestSide : 1;
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return file;
  }
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  let quality = START_QUALITY;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > TARGET_MAX_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.08);
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size >= file.size && largestSide <= MAX_DIMENSION) {
    return file;
  }

  const compressedName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], compressedName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
