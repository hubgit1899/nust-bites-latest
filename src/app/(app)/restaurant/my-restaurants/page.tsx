"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Restaurant } from "@/models/Restaurant";
import { formatTime } from "@/helpers/formatTime";

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
              return Object.assign({}, r, {
                forceOnlineOverride: overrideValue,
              }) as Restaurant;
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
    <div className={loading ? "" : "mb-15 mt-5"}>
      <h2 className="text-2xl font-bold mb-6">My Restaurants</h2>

      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
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
                            className={`badge badge-soft badge-sm font-semibold ${
                              r.forceOnlineOverride === 1
                                ? "badge-success"
                                : r.forceOnlineOverride === -1
                                  ? "badge-error"
                                  : r.online
                                    ? "badge-success"
                                    : "badge-error"
                            }`}
                          >
                            {r.forceOnlineOverride === 1
                              ? "FORCED ONLINE"
                              : r.forceOnlineOverride === -1
                                ? "FORCED OFFLINE"
                                : r.online
                                  ? "ONLINE"
                                  : "OFFLINE"}
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
                            className={`badge badge-soft badge-sm font-semibold ${
                              r.forceOnlineOverride === 1
                                ? "badge-success"
                                : r.forceOnlineOverride === -1
                                  ? "badge-error"
                                  : r.online
                                    ? "badge-success"
                                    : "badge-error"
                            }`}
                          >
                            {r.forceOnlineOverride === 1
                              ? "FORCED ONLINE"
                              : r.forceOnlineOverride === -1
                                ? "FORCED OFFLINE"
                                : r.online
                                  ? "ONLINE"
                                  : "OFFLINE"}
                          </span>
                        </div>
                      </div>

                      {/* Info grid - adaptive for mobile/desktop */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span className="text-sm">
                              <strong>City:</strong> {r.location.city}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            <span className="text-sm">
                              <strong>Order Code:</strong> {r.orderCode}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-sm">
                              <strong>Hours:</strong>{" "}
                              {`${formatTime(r.onlineTime.start)} - ${formatTime(r.onlineTime.end)}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            <span className="text-sm">
                              <strong>Menu Items:</strong> {r.menu?.length || 0}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                              />
                            </svg>
                            <span className="text-sm">
                              <strong>Orders:</strong> {r.orders?.length || 0}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
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
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
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
                                d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"
                              />
                            </svg>
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
                className="modal modal-bottom sm:modal-middle"
              >
                <div className="modal-box">
                  <h3 className="font-bold text-lg">
                    Manage Restaurant Online Status
                  </h3>

                  <div className="py-4 text-sm">
                    <p className="mb-4 text-warning">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 inline-block mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span className="font-semibold">Warning:</span> Overriding
                      the default behavior will prevent the restaurant from{" "}
                      <span className="font-semibold">
                        automatically switching online/offline
                      </span>{" "}
                      based on operating hours.
                    </p>

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
