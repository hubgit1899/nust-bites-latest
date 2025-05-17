/**
 * Calculate the actual street distance between two coordinates using OSRM API
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Promise with distance in kilometers
 */
export async function calculateStreetDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number> {
  try {
    // OSRM API endpoint for route calculation
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== "Ok") {
      throw new Error("Failed to calculate route");
    }

    // Distance is returned in meters, convert to kilometers
    const distanceInKm = data.routes[0].distance / 1000;
    return Number(distanceInKm.toFixed(1));
  } catch (error) {
    console.error("Error calculating street distance:", error);
    // Fallback to straight-line distance if API fails
    return calculateStraightLineDistance(lat1, lon1, lat2, lon2);
  }
}

/**
 * Calculate straight-line distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateStraightLineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return Number(distance.toFixed(1));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance}km`;
}
