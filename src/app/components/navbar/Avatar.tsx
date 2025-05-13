import React from "react";
import { User } from "next-auth";

interface AvatarProps {
  user: User;
  onClick?: () => void;
}

const getRoleColor = (user: User) => {
  if (user.isSuperAdmin) return "bg-red-600";
  if (user.isRiderAdmin) return "bg-purple-600";
  if (user.isRestaurantAdmin) return "bg-blue-600";
  if (user.isRestaurantOwner) return "bg-orange-500";
  if (user.isRider) return "bg-green-600";
  if (user.isCustomer) return "bg-gray-600";
  return "bg-neutral";
};

const Avatar: React.FC<AvatarProps> = ({ user, onClick }) => {
  const firstLetter = user?.username?.charAt(0) || "?";
  const roleColorClass = getRoleColor(user);

  return (
    <button
      tabIndex={0}
      className={`btn btn-ghost btn-circle avatar w-10 h-10 flex items-center justify-center ${roleColorClass}`}
      onClick={onClick}
    >
      <span className="text-neutral-content text-xl font-semibold uppercase">
        {firstLetter}
      </span>
    </button>
  );
};

export default Avatar;
