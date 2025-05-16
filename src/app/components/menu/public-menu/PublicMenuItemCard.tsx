"use client";

import { MenuItem } from "@/models/MenuItem";
import hexToRGBA from "@/lib/hexToRGBA";
import Image from "next/image";
import PublicViewMenuItem from "./PublicViewMenuItem";
import { Restaurant } from "@/models/Restaurant";

interface PublicMenuItemCardProps {
  item: MenuItem;
  accentColor: string;
  restaurant: Restaurant;
}

export default function PublicMenuItemCard({
  item,
  accentColor,
  restaurant,
}: PublicMenuItemCardProps) {
  return (
    <div className="card card-border bg-base-200 border-base-300 card-sm overflow-hidden">
      <figure className="px-2.5 pt-2.5">
        <div className="relative inline-block">
          <Image
            src={item.imageURL}
            alt={item.name}
            width={300}
            height={200}
            className="rounded-xl bg-base-300"
          />
          <div
            className="absolute top-2 right-2 tooltip tooltip-bottom"
            data-tip={item.online ? "Available" : "Currently Unavailable"}
          ></div>
        </div>
      </figure>

      <div className="card-body">
        <h2 className="card-title text-sm md:text-md truncate pr-2 overflow-hidden">
          {item.name}
        </h2>

        <div
          className="badge badge-xs sm:badge-sm truncate max-w-full overflow-hidden text-xs border-none"
          style={{
            backgroundColor: hexToRGBA(accentColor, 0.3),
            color: "white",
          }}
        >
          {item.category}
        </div>

        <p className="line-clamp-2 min-h-[2rem]">{item.description}</p>

        <div className="card-actions flex justify-between items-center gap-x-2 md:gap-x-4 mt-2 flex-nowrap min-w-0">
          <span className="text-sm md:text-md lg:text-lg font-bold truncate">
            Rs. {item.basePrice}
          </span>
          <PublicViewMenuItem
            menuItem={item}
            accentColor={accentColor}
            restaurant={restaurant}
          />
        </div>
      </div>
    </div>
  );
}
