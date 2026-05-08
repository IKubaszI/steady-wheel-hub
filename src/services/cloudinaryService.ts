const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

export interface CloudinaryResult {
  secureUrl: string;
  publicId: string;
}

export async function uploadImage(file: File): Promise<CloudinaryResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const errorPayload = await response.json();
    throw new Error(errorPayload?.error?.message ?? "Cloudinary upload failed");
  }

  const data = await response.json();
  return {
    secureUrl: data.secure_url as string,
    publicId: data.public_id as string,
  };
}

export function getOptimizedUrl(secureUrl: string, width = 800): string {
  return secureUrl.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}
