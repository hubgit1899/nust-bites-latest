import { Restaurant } from "@/models/Restaurant";
import { TriangleAlert, Info, MapPin, Clock, Image } from "lucide-react";
import { useState } from "react";

interface RestaurantUpdateData {
  name?: string;
  accentColor?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
  };
  onlineTime?: {
    start: number;
    end: number;
  };
  logoImageURL?: string;
}

interface ConfirmRestaurantUpdateModalProps {
  originalItem: RestaurantUpdateData;
  updatedItem: RestaurantUpdateData;
  onConfirm: () => void;
  onCancel: () => void;
  accentColor: string;
}

export const ConfirmRestaurantUpdateModal = ({
  originalItem,
  updatedItem,
  onConfirm,
  onCancel,
  accentColor,
}: ConfirmRestaurantUpdateModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to check if online time has changed
  const hasOnlineTimeChanged = () => {
    const original = originalItem.onlineTime;
    const updated = updatedItem.onlineTime;

    if (!original && !updated) return false;
    if (!original || !updated) return true;

    // Compare start and end times directly
    const startChanged = original.start !== updated.start;
    const endChanged = original.end !== updated.end;

    return startChanged || endChanged;
  };

  // Helper function to format time
  const formatTime = (minutes: number | undefined) => {
    if (minutes === undefined || minutes === null) return "Not set";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    return `${displayHours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${period}`;
  };

  // Helper function to check if a value has changed
  const hasChanged = (original: any, updated: any) => {
    if (original === undefined && updated === undefined) return false;
    if (original === undefined || updated === undefined) return true;
    return JSON.stringify(original) !== JSON.stringify(updated);
  };

  // Helper function to check if location has changed
  const hasLocationChanged = () => {
    const original = originalItem.location;
    const updated = updatedItem.location;

    if (!original && !updated) return false;
    if (!original || !updated) return true;

    return (
      original.lat !== updated.lat ||
      original.lng !== updated.lng ||
      original.address !== updated.address ||
      original.city !== updated.city
    );
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      id="confirm_update_modal"
      className="modal modal-bottom sm:modal-middle"
      open
    >
      <div className="modal-box p-0 flex flex-col max-h-[90vh] sm:max-h-[80vh]">
        {/* Fixed Header */}
        <div className="p-4 border-b border-base-300">
          <h3 className="font-bold text-lg">Confirm Restaurant Update</h3>
          <div className="flex items-center gap-2 mt-2">
            <TriangleAlert className="text-warning" size={20} />
            <p className="text-sm text-base-content/80">
              Please review the changes before updating your restaurant.
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-base-300">
          <div className="p-6 space-y-6">
            {/* Basic Information Section */}
            {(hasChanged(originalItem.name, updatedItem.name) ||
              hasChanged(originalItem.accentColor, updatedItem.accentColor) ||
              hasChanged(
                originalItem.logoImageURL,
                updatedItem.logoImageURL
              )) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info size={20} style={{ color: accentColor }} />
                  <h4 className="font-medium">Basic Information</h4>
                </div>

                {/* Name Changes */}
                {hasChanged(originalItem.name, updatedItem.name) && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Name</span>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="line-through text-base-content/60">
                        {originalItem.name}
                      </span>
                      <span className="text-base-content/60">→</span>
                      <span className="text-success">{updatedItem.name}</span>
                    </div>
                  </div>
                )}

                {/* Accent Color Changes */}
                {hasChanged(
                  originalItem.accentColor,
                  updatedItem.accentColor
                ) && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Accent Color</span>
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: originalItem.accentColor }}
                      />
                      <span className="text-base-content/60">→</span>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: updatedItem.accentColor }}
                      />
                    </div>
                  </div>
                )}

                {/* Logo Changes */}
                {hasChanged(
                  originalItem.logoImageURL,
                  updatedItem.logoImageURL
                ) && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Logo</span>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 mt-2">
                      {/* Original Logo with strikethrough */}
                      <div className="relative">
                        <div
                          className="rounded-lg overflow-hidden opacity-50 relative"
                          style={{
                            backgroundColor: accentColor,
                            border: "none",
                            aspectRatio: "2.88 / 1",
                            width: "100%",
                            backgroundImage: "none",
                          }}
                        >
                          {originalItem.logoImageURL ? (
                            <img
                              src={originalItem.logoImageURL}
                              alt="Original logo"
                              className="h-full w-full object-contain"
                              style={{ backgroundColor: "transparent" }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-base-content/40">
                              No logo
                            </div>
                          )}
                          <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-[100%] h-[2px] bg-base-content/60 transform rotate-45 origin-center"></div>
                              <div className="w-[100%] h-[2px] bg-base-content/60 transform -rotate-45 origin-center"></div>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-base-content/60 mt-1 block text-center">
                          Current
                        </span>
                      </div>

                      {/* Arrow - vertical for mobile, horizontal for desktop */}
                      <div className="flex items-center justify-center h-full">
                        <div className="flex items-center h-[2.88rem]">
                          <span className="text-base-content/60 sm:rotate-0 rotate-90 text-lg">
                            →
                          </span>
                        </div>
                      </div>

                      {/* New Logo */}
                      <div className="relative">
                        <div
                          className="rounded-lg overflow-hidden"
                          style={{
                            backgroundColor: accentColor,
                            border: "none",
                            aspectRatio: "2.88 / 1",
                            width: "100%",
                            backgroundImage: "none",
                          }}
                        >
                          {updatedItem.logoImageURL ? (
                            <img
                              src={updatedItem.logoImageURL}
                              alt="Updated logo"
                              className="h-full w-full object-contain"
                              style={{ backgroundColor: "transparent" }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-base-content/40">
                              No logo
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-success mt-1 block text-center">
                          Updated
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Location Section */}
            {hasLocationChanged() && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin size={20} style={{ color: accentColor }} />
                  <h4 className="font-medium">Location</h4>
                </div>

                {/* Address Changes */}
                {hasChanged(
                  originalItem.location?.address,
                  updatedItem.location?.address
                ) && (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-base-content/70">
                      Address
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="line-through text-base-content/60">
                        {originalItem.location?.address || "Not set"}
                      </span>
                      <span className="text-base-content/60">→</span>
                      <span className="text-success">
                        {updatedItem.location?.address || "Not set"}
                      </span>
                    </div>
                  </div>
                )}

                {/* City Changes */}
                {hasChanged(
                  originalItem.location?.city,
                  updatedItem.location?.city
                ) && (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-base-content/70">
                      City
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="line-through text-base-content/60">
                        {originalItem.location?.city || "Not set"}
                      </span>
                      <span className="text-base-content/60">→</span>
                      <span className="text-success">
                        {updatedItem.location?.city || "Not set"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Coordinates Changes */}
                {(hasChanged(
                  originalItem.location?.lat,
                  updatedItem.location?.lat
                ) ||
                  hasChanged(
                    originalItem.location?.lng,
                    updatedItem.location?.lng
                  )) && (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-base-content/70">
                      Coordinates
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="line-through text-base-content/60">
                        {originalItem.location?.lat &&
                        originalItem.location?.lng
                          ? `${originalItem.location.lat.toFixed(6)}, ${originalItem.location.lng.toFixed(6)}`
                          : "Not set"}
                      </span>
                      <span className="text-base-content/60">→</span>
                      <span className="text-success">
                        {updatedItem.location?.lat && updatedItem.location?.lng
                          ? `${updatedItem.location.lat.toFixed(6)}, ${updatedItem.location.lng.toFixed(6)}`
                          : "Not set"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Online Hours Section */}
            {hasOnlineTimeChanged() && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={20} style={{ color: accentColor }} />
                  <h4 className="font-medium">Online Hours</h4>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="line-through text-base-content/60">
                    {formatTime(originalItem.onlineTime?.start)} -{" "}
                    {formatTime(originalItem.onlineTime?.end)}
                  </span>
                  <span className="text-base-content/60">→</span>
                  <span className="text-success">
                    {formatTime(updatedItem.onlineTime?.start)} -{" "}
                    {formatTime(updatedItem.onlineTime?.end)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 border-t border-base-300">
          <div className="flex justify-between w-full">
            <button
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn"
              onClick={handleConfirm}
              disabled={isSubmitting}
              style={{
                backgroundColor: accentColor,
                borderColor: accentColor,
                color: "white",
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Updating...
                </>
              ) : (
                "Confirm Update"
              )}
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel}>close</button>
      </form>
    </dialog>
  );
};
