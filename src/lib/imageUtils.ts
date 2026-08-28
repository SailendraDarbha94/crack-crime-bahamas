// Client-side image downscaling for banner uploads.
// Resizes so the long edge is <= maxEdge, then encodes trying to stay under
// targetBytes. PNG sources are kept as PNG when small enough, otherwise
// re-encoded as JPEG (banner artwork tolerates this and the mobile app renders
// by content type, not extension).

export interface ProcessedImage {
  blob: Blob;
  contentType: string;
}

// Detect an image's real type from its leading bytes (the stored object is
// always named .png regardless of the actual encoding, so we can't trust the
// extension when backing it up).
export function sniffImageType(bytes: ArrayBuffer): string {
  const v = new Uint8Array(bytes);
  if (v[0] === 0xff && v[1] === 0xd8 && v[2] === 0xff) return "image/jpeg";
  if (v[0] === 0x89 && v[1] === 0x50 && v[2] === 0x4e && v[3] === 0x47) return "image/png";
  if (v[0] === 0x47 && v[1] === 0x49 && v[2] === 0x46) return "image/gif";
  return "application/octet-stream";
}

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the selected image"));
    };
    img.src = url;
  });

export async function downscaleImage(
  file: File,
  maxEdge = 1600,
  targetBytes = 800 * 1024
): Promise<ProcessedImage> {
  const img = await loadImage(file);

  const longEdge = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longEdge > maxEdge ? maxEdge / longEdge : 1;
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // Canvas unavailable — fall back to the original bytes untouched
    return { blob: file, contentType: file.type || "image/png" };
  }
  ctx.drawImage(img, 0, 0, width, height);

  // Keep PNG if the source is PNG and the result fits the budget
  if (file.type === "image/png") {
    const pngBlob = await canvasToBlob(canvas, "image/png");
    if (pngBlob && pngBlob.size <= targetBytes) {
      return { blob: pngBlob, contentType: "image/png" };
    }
  }

  // Otherwise encode JPEG, stepping quality down until it fits (or we bottom out)
  for (const quality of [0.85, 0.75, 0.65, 0.55]) {
    const jpeg = await canvasToBlob(canvas, "image/jpeg", quality);
    if (jpeg && (jpeg.size <= targetBytes || quality === 0.55)) {
      return { blob: jpeg, contentType: "image/jpeg" };
    }
  }

  // Last resort: whatever PNG we can produce
  const fallback = await canvasToBlob(canvas, "image/png");
  return { blob: fallback ?? file, contentType: fallback ? "image/png" : file.type || "image/png" };
}
