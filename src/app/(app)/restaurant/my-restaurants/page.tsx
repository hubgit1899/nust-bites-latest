"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Restaurant } from "@/models/Restaurant";
import { formatTime } from "@/helpers/localTime";
import {
  Binary,
  CalendarArrowDown,
  Clock,
  MapPin,
  Settings,
  ShoppingBag,
  Star,
  Store,
  TriangleAlert,
  UtensilsCrossed,
} from "lucide-react";

export default function MyRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [overrideValue, setOverrideValue] = useState<number>(0);

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

  // Set override value when selecting a restaurant
  useEffect(() => {
    if (selectedRestaurant) {
      setOverrideValue(selectedRestaurant.forceOnlineOverride || 0);
    }
  }, [selectedRestaurant]);

  // Get color for online status button based on forceOnlineOverride
  const getStatusButtonColor = (restaurant: Restaurant) => {
    if (restaurant.forceOnlineOverride === 1) return "btn-success";
    if (restaurant.forceOnlineOverride === -1) return "btn-error";
    return restaurant.online ? "btn-success" : "btn-error";
  };

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

  // Handle update of forceOnlineOverride
  const handleOverrideUpdate = async () => {
    if (!selectedRestaurant) return;

    setUpdateLoading(true);
    try {
      const res = await fetch(
        `/api/my-restaurants/${selectedRestaurant._id}/overrideDefaultOnline`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            override: overrideValue,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        // Update the restaurants list with the updated restaurant
        setRestaurants((prevRestaurants) =>
          prevRestaurants.map((r) => {
            if (r._id === selectedRestaurant._id) {
              // Create a new object while preserving the Restaurant type
              return {
                ...r,
                forceOnlineOverride: overrideValue,
              } as Restaurant;
            }
            return r;
          })
        );
        toast.success(`Restaurant status override updated successfully`);
        (
          document.getElementById(
            "online_status_modal"
          ) as HTMLDialogElement | null
        )?.close();
      } else {
        toast.error(data.message || "Failed to update status override");
      }
    } catch (err) {
      console.error("Error updating override:", err);
      toast.error("Something went wrong while updating status");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-grow min-h-[calc(100vh-var(--navbar-height)-var(--footer-height,4rem))]">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Store size={24} />
        My Restaurants
      </h1>

      {loading ? (
        <div className="flex-grow flex justify-center items-center">
          <span className="loading loading-bars loading-lg"></span>
        </div>
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
                          data-tip="Edit Restaurant"
                        >
                          <Link
                            href={`/restaurants/${r._id}/edit`}
                            className="btn btn-circle btn-primary"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
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
                          data-tip={
                            !r.isVerified
                              ? "Please wait for verification"
                              : "Manage Online Status"
                          }
                        >
                          <button
                            disabled={!r.isVerified}
                            onClick={() => {
                              setSelectedRestaurant(r);
                              (
                                document.getElementById(
                                  "online_status_modal"
                                ) as HTMLDialogElement | null
                              )?.showModal();
                            }}
                            className={`btn btn-circle ${getStatusButtonColor(r)}`}
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

              <dialog
                id="online_status_modal"
                className="modal modal-bottom sm:modal-middle backdrop-blur-xs"
              >
                <div className="modal-box">
                  <h3 className="font-bold text-lg">
                    Manage Restaurant Online Status
                  </h3>

                  <div className="py-4 text-sm">
                    <div className="mb-4 text-warning flex items-start gap-1">
                      <TriangleAlert
                        size={20}
                        className="text-warning shrink-0"
                      />
                      <p className="text-sm leading-snug">
                        <span className="font-semibold">Warning:</span>{" "}
                        Overriding the default behavior will prevent the
                        restaurant from{" "}
                        <span className="font-semibold">
                          automatically switching online/offline
                        </span>{" "}
                        based on operating hours.
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 bg-base-200">
                      <p className="mb-3 font-medium">
                        Choose status override:
                      </p>

                      {/* Three-state toggle */}
                      <div className="flex justify-center">
                        <div className="join w-full max-w-md">
                          <button
                            className={`join-item btn flex-1 btn-soft ${overrideValue === -1 ? "btn-error" : ""}`}
                            onClick={() => setOverrideValue(-1)}
                            type="button"
                          >
                            Force Offline
                          </button>

                          <button
                            className={`join-item btn flex-1 btn-soft ${overrideValue === 0 ? "btn-info" : ""}`}
                            onClick={() => setOverrideValue(0)}
                            type="button"
                          >
                            Default
                          </button>

                          <button
                            className={`join-item btn flex-1 btn-soft ${overrideValue === 1 ? "btn-success" : ""}`}
                            onClick={() => setOverrideValue(1)}
                            type="button"
                          >
                            Force Online
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 text-center text-xs">
                        {overrideValue === -1 && (
                          <p className="text-error">
                            Restaurant will always be offline regardless of
                            operating hours
                          </p>
                        )}
                        {overrideValue === 0 && (
                          <p className="text-info">
                            Restaurant will follow normal operating hours
                          </p>
                        )}
                        {overrideValue === 1 && (
                          <p className="text-success">
                            Restaurant will always be online regardless of
                            operating hours
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <form method="dialog" className="flex justify-start">
                      <button className="btn">Cancel</button>
                    </form>

                    <div className="flex justify-end">
                      <button
                        className="btn btn-primary"
                        onClick={handleOverrideUpdate}
                        disabled={updateLoading}
                      >
                        {updateLoading ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Updating...
                          </>
                        ) : (
                          "Confirm"
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <form method="dialog" className="modal-backdrop">
                  <button>close</button>
                </form>
              </dialog>
            </>
          )}
        </>
      )}
    </div>
  );
}
