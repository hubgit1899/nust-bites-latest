"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Restaurant } from "@/models/Restaurant";
import { formatTime } from "@/helpers/localTime";
import RestaurantSettingsModal from "@/app/components/restaurant/RestaurantSettingsModal";
import {
  Binary,
  CalendarArrowDown,
  Clock,
  MapPin,
  Settings,
  Star,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import PageLoading from "@/app/components/loading/PageLoading";

export default function MyRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRestaurantSettingsModalOpen, setIsRestaurantSettingsModalOpen] =
    useState(false);

  useEffect(() => {
    const fetchUserRestaurants = async () => {
      try {
        const res = await fetch("/api/my-restaurants");
        const data = await res.json();
        if (data.success) {
          setRestaurants(data.restaurants);
        } else {
          toast.error("Failed to load your restaurants.");
        }
      } catch (err) {
        console.error("Error fetching my restaurants:", err);
        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRestaurants();
  }, []);

  // Get status text based on forceOnlineOverride and online status
  const getStatusText = (restaurant: Restaurant) => {
    if (restaurant.forceOnlineOverride === 1) return "FORCED ONLINE";
    if (restaurant.forceOnlineOverride === -1) return "FORCED OFFLINE";
    return restaurant.online ? "ONLINE" : "OFFLINE";
  };

  // Get badge color based on forceOnlineOverride and online status
  const getStatusBadgeColor = (restaurant: Restaurant) => {
    if (restaurant.forceOnlineOverride === 1) return "badge-success";
    if (restaurant.forceOnlineOverride === -1) return "badge-error";
    return restaurant.online ? "badge-success" : "badge-error";
  };

  return (
    <div className="flex flex-col flex-grow min-h-[calc(100vh-var(--navbar-height)-var(--footer-height,4rem))]">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Store size={24} />
        My Restaurants
      </h1>

      {loading ? (
        <PageLoading />
      ) : (
        <>
          {!restaurants.length ? (
            <p className="text-gray-500 text-center">No restaurants found.</p>
          ) : (
            <>
              <div className="space-y-6">
                {restaurants.map((r) => (
                  <div
                    key={String(r._id)}
                    className="flex flex-col md:flex-row items-stretch bg-base-200 rounded-xl shadow-md overflow-hidden md:h-48"
                  >
                    {/* Restaurant header - always visible */}
                    <div className="w-full p-4 flex flex-col md:hidden">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold">{r.name}</h3>
                        <div className="flex gap-2">
                          <span
                            className={`badge badge-soft badge-sm font-semibold ${
                              r.isVerified ? "badge-success" : "badge-warning"
                            }`}
                          >
                            {r.isVerified ? "VERIFIED" : "UNVERIFIED"}
                          </span>
                          <span
                            className={`badge badge-soft badge-sm font-semibold ${getStatusBadgeColor(r)}`}
                          >
                            {getStatusText(r)}
                          </span>
                        </div>
                      </div>

                      {/* Mobile logo - reduced bottom margin */}
                      <div
                        className="w-full h-32 flex justify-center items-center rounded-lg"
                        style={{ backgroundColor: r.accentColor }}
                      >
                        <img
                          src={r.logoImageURL}
                          alt={`${r.name} Logo`}
                          className="h-24 max-w-full object-contain"
                          style={{ backgroundColor: "transparent" }}
                        />
                      </div>
                    </div>

                    {/* Left section: restaurant info */}
                    <div className="flex-1 p-4 pt-0 md:p-5">
                      {/* Desktop header - hidden on mobile */}
                      <div className="hidden md:flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold">{r.name}</h3>
                        <div className="flex gap-2">
                          <span
                            className={`badge badge-soft badge-sm font-semibold ${
                              r.isVerified ? "badge-success" : "badge-warning"
                            }`}
                          >
                            {r.isVerified ? "VERIFIED" : "UNVERIFIED"}
                          </span>
                          <span
                            className={`badge badge-soft badge-sm font-semibold ${getStatusBadgeColor(r)}`}
                          >
                            {getStatusText(r)}
                          </span>
                        </div>
                      </div>

                      {/* Info grid - adaptive for mobile/desktop */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span className="text-sm">
                              <strong>City:</strong> {r.location.city}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Binary size={16} />
                            <span className="text-sm">
                              <strong>Order Code:</strong> {r.orderCode}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span className="text-sm">
                              <strong>Hours:</strong>{" "}
                              {`${formatTime(r.onlineTime.start)} - ${formatTime(r.onlineTime.end)}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2">
                            <UtensilsCrossed size={16} />

                            <span className="text-sm">
                              <strong>Menu Items:</strong> {r.menu?.length || 0}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <CalendarArrowDown size={16} />
                            <span className="text-sm">
                              <strong>Orders:</strong> {r.orders?.length || 0}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Star size={16} />
                            <span className="text-sm">
                              <strong>Rating:</strong> {r.rating || "N/A"}
                              {r.ratingCount > 0 && (
                                <span className="ml-1">({r.ratingCount})</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action bar - evenly distributed in thirds for both mobile and desktop */}
                    <div className="w-full md:w-16 bg-base-300 grid grid-cols-3 md:grid-cols-1 md:grid-rows-3 items-center p-3 md:p-2">
                      <div className="flex justify-center items-center">
                        <div
                          className="tooltip md:tooltip-right tooltip-top"
                          data-tip="Orders"
                        >
                          <Link
                            href={`/restaurants/${r._id}/orders`}
                            className="btn btn-circle btn-primary"
                          >
                            <CalendarArrowDown />
                          </Link>
                        </div>
                      </div>

                      <div className="flex justify-center items-center">
                        <div
                          className="tooltip md:tooltip-right tooltip-top"
                          data-tip="Manage Menu"
                        >
                          <Link
                            href={`/restaurant/my-restaurants/${r._id}/manage-menu`}
                            className="btn btn-circle btn-secondary"
                          >
                            <UtensilsCrossed />
                          </Link>
                        </div>
                      </div>

                      <div className="flex justify-center items-center">
                        <div
                          className="tooltip md:tooltip-right tooltip-top z-1"
                          data-tip={"Settings"}
                        >
                          <button
                            onClick={() => {
                              setSelectedRestaurant(r);
                              setIsRestaurantSettingsModalOpen(true);
                            }}
                            className={`btn btn-circle bg-gray-300 hover:bg-gray-400 border-none text-gray-600 hover:text-gray-800`}
                          >
                            <Settings />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right section: logo - hidden on mobile */}
                    <div
                      className="hidden md:flex w-1/4 min-w-[150px] justify-center items-center"
                      style={{ backgroundColor: r.accentColor }}
                    >
                      <div className="w-full h-full p-4 flex justify-center items-center">
                        <img
                          src={r.logoImageURL}
                          alt={`${r.name} Logo`}
                          className="h-24 max-w-full object-contain rounded"
                          style={{ backgroundColor: "transparent" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedRestaurant && (
                <RestaurantSettingsModal
                  restaurant={selectedRestaurant}
                  isOpen={isRestaurantSettingsModalOpen}
                  onSuccess={(updatedRestaurant) => {
                    setRestaurants((prevRestaurants) =>
                      prevRestaurants.map((r) =>
                        r._id === updatedRestaurant._id ? updatedRestaurant : r
                      )
                    );
                    setIsRestaurantSettingsModalOpen(false);
                    setSelectedRestaurant(null);
                  }}
                  onClose={() => {
                    setIsRestaurantSettingsModalOpen(false);
                    setSelectedRestaurant(null);
                  }}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
