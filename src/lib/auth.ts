import type { Session } from "next-auth";
import type { Types } from "mongoose";

export function hasRestaurantAccess(
  user: Session["user"],
  restaurantOwnerId: Types.ObjectId | string
) {
  if (!user?._id) return false;

  const isOwner = restaurantOwnerId.toString() === user._id;
  const isSuperAdmin = user.isSuperAdmin === true;

  return isOwner || isSuperAdmin;
}
