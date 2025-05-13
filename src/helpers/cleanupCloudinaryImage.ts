import { deleteCloudinaryImage } from "@/lib/cloudinary";
import extractPublicId from "./extractPublicId";

/**
 * Deletes a Cloudinary image given its URL.
 * Safely extracts publicId and handles cleanup.
 *
 * @param imageURL - The full Cloudinary image URL
 */
export async function cleanupCloudinaryImage(
  imageURL: string | null | undefined
) {
  if (!imageURL) return;

  const publicId = extractPublicId(imageURL);
  if (!publicId) return;

  try {
    await deleteCloudinaryImage(publicId);
    console.log(`✅ Deleted Cloudinary image: ${publicId}`);
  } catch (error) {
    console.error(`❌ Failed to delete Cloudinary image: ${publicId}`, error);
  }
}
