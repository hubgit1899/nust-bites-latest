// Helper to extract publicId
export default function extractPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?([^\.\/]+)/);
  return match ? match[1] : null;
}
