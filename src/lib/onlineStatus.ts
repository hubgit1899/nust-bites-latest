import { getCurrentMinutesInPakistan } from "@/helpers/localTime";
import { MenuItem } from "@/models/MenuItem";
import { Restaurant } from "@/models/Restaurant";

// Define plain object types without Document methods for easier handling
export type PlainRestaurant = Omit<Restaurant, keyof Document | "menu"> & {
  online?: boolean;
  menu?: PlainMenuItem[];
};
export type PlainMenuItem = Omit<MenuItem, keyof Document> & {
  online?: boolean;
};

/**
 * Calculates online status for a restaurant or an array of restaurants
 * @param restaurantData - Single restaurant object or array of restaurant objects
 * @returns The input with added online property, or just the online status if single item
 */
export function calculateRestaurantOnlineStatus<T extends PlainRestaurant>(
  restaurantData: T | T[]
): T | T[] | boolean {
  const currentMinutesInPakistan = getCurrentMinutesInPakistan();

  // Handle array of restaurants
  if (Array.isArray(restaurantData)) {
    return restaurantData.map((restaurant) => {
      const online = determineRestaurantOnlineStatus(
        restaurant,
        currentMinutesInPakistan
      );
      return { ...restaurant, online } as T;
    });
  }

  // Handle single restaurant
  const restaurant = restaurantData;
  const online = determineRestaurantOnlineStatus(
    restaurant,
    currentMinutesInPakistan
  );

  // If it's a single restaurant, we add the online property and return the restaurant
  if (arguments.length > 1 || restaurant._id) {
    return { ...restaurant, online } as T;
  }

  // If function was called directly for status check, just return the boolean
  return online;
}

/**
 * Helper function to calculate a single restaurant's online status
 */
function determineRestaurantOnlineStatus(
  restaurant: PlainRestaurant,
  currentMinutesInPakistan: number
): boolean {
  // Force override takes precedence
  if (
    restaurant.forceOnlineOverride !== undefined &&
    restaurant.forceOnlineOverride !== 0
  ) {
    return restaurant.forceOnlineOverride === 1;
  }

  // Not verified restaurants are never online
  if (restaurant.isVerified === false) return false;
  if (!restaurant.onlineTime) return false;

  const { start, end } = restaurant.onlineTime;

  // Handle cases where start/end aren't defined
  if (start === undefined || end === undefined) return false;

  // Check if current time is within online hours
  return start > end
    ? currentMinutesInPakistan >= start || currentMinutesInPakistan < end
    : currentMinutesInPakistan >= start && currentMinutesInPakistan < end;
}

/**
 * Calculates online status for a menu item or an array of menu items
 * @param menuItemData - Single menu item or array of menu items
 * @param restaurant - The restaurant the menu items belong to
 * @returns The input with added online property, or just the online status if single item
 */
export function calculateMenuItemOnlineStatus<
  T extends PlainMenuItem,
  R extends PlainRestaurant,
>(menuItemData: T | T[], restaurant: R): T | T[] | boolean {
  // First ensure restaurant has online status calculated
  if (restaurant && !("online" in restaurant)) {
    restaurant = calculateRestaurantOnlineStatus(restaurant) as R;
  }

  const currentMinutesInPakistan = getCurrentMinutesInPakistan();

  // Handle array of menu items
  if (Array.isArray(menuItemData)) {
    return menuItemData.map((menuItem) => {
      const online = determineMenuItemOnlineStatus(
        menuItem,
        restaurant,
        currentMinutesInPakistan
      );
      return { ...menuItem, online } as T;
    });
  }

  // Handle single menu item
  const menuItem = menuItemData;
  const online = determineMenuItemOnlineStatus(
    menuItem,
    restaurant,
    currentMinutesInPakistan
  );

  // If it's a single menu item object, we add the online property and return the menu item
  if (arguments.length > 1 || menuItem._id) {
    return { ...menuItem, online } as T;
  }

  // If function was called directly for status check, just return the boolean
  return online;
}

/**
 * Helper function to calculate a single menu item's online status
 */
function determineMenuItemOnlineStatus(
  menuItem: PlainMenuItem,
  restaurant: PlainRestaurant,
  currentMinutesInPakistan: number
): boolean {
  // If the item is not available, it's not online
  if (!menuItem.available) return false;

  // If the restaurant is not online, the menu item is not online
  if (!restaurant.online) return false;

  // If there's no force override, follow the restaurant's online status
  if (!menuItem.forceOnlineOverride) {
    return true;
  }

  // Check if there are valid online time settings
  if (
    !menuItem.onlineTime ||
    menuItem.onlineTime.start === undefined ||
    menuItem.onlineTime.end === undefined
  ) {
    return true;
  }

  // Check if the current time is within the specified online window
  const { start, end } = menuItem.onlineTime;

  return start > end
    ? currentMinutesInPakistan >= start || currentMinutesInPakistan < end
    : currentMinutesInPakistan >= start && currentMinutesInPakistan < end;
}

/**
 * Example usage in a GET function:
 */
export function processRestaurantData(restaurant: Restaurant) {
  // Convert Mongoose document to plain object
  const plainRestaurant = JSON.parse(
    JSON.stringify(restaurant)
  ) as PlainRestaurant;

  // Ensure restaurant has online status
  const restaurantWithOnline = calculateRestaurantOnlineStatus(
    plainRestaurant
  ) as PlainRestaurant;

  // Calculate online status for all menu items
  if (restaurantWithOnline.menu) {
    restaurantWithOnline.menu = calculateMenuItemOnlineStatus(
      restaurantWithOnline.menu,
      restaurantWithOnline
    ) as PlainMenuItem[];
  }

  return restaurantWithOnline;
}
