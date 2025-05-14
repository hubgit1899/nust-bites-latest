"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateRestaurantSchema } from "@/schemas/addRestaurantSchema";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { z } from "zod";
import ColorPicker from "@/app/components/ColorPicker";
import MapPopup from "@/app/components/MapPopup/MapPopup";
import { Restaurant } from "@/models/Restaurant";
import {
  Info,
  MapPin,
  Clock,
  TriangleAlert,
  ArrowLeft,
  ArrowRight,
  X,
  Settings,
  Rss,
  History,
  WifiOff,
  Wifi,
  WifiPen,
  SquarePen,
  Trash2,
} from "lucide-react";

interface RestaurantSettingsModalProps {
  restaurant: Restaurant;
  isOpen: boolean;
  onSuccess: (updatedRestaurant: Restaurant) => void;
  onClose: () => void;
}

const RestaurantSettingsModal = ({
  restaurant,
  isOpen,
  onSuccess,
  onClose,
}: RestaurantSettingsModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    restaurant.logoImageURL || null
  );
  const [fileSizeMB, setFileSizeMB] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("online");
  const [activeEditTab, setActiveEditTab] = useState("basic");
  const [hasChanges, setHasChanges] = useState(false);
  const [overrideValue, setOverrideValue] = useState<number>(
    restaurant.forceOnlineOverride || 0
  );
  const [previewAccentColor, setPreviewAccentColor] = useState(
    restaurant.accentColor || "#ff0000"
  );
  const [hasStatusChanged, setHasStatusChanged] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form with zodResolver and restaurant data
  const form = useForm<z.infer<typeof updateRestaurantSchema>>({
    resolver: zodResolver(updateRestaurantSchema),
    defaultValues: {
      name: restaurant.name || "",
      logoImageURL: restaurant.logoImageURL || "",
      accentColor: restaurant.accentColor || "#ff0000",
      location: {
        lat: restaurant.location?.lat || 0,
        lng: restaurant.location?.lng || 0,
        address: restaurant.location?.address || "",
        city: restaurant.location?.city || "",
      },
      onlineTime: {
        start: restaurant.onlineTime?.start || 0,
        end: restaurant.onlineTime?.end || 0,
        startTimeString: restaurant.onlineTime?.start
          ? `${Math.floor(restaurant.onlineTime.start / 60)
              .toString()
              .padStart(2, "0")}:${(restaurant.onlineTime.start % 60)
              .toString()
              .padStart(2, "0")}`
          : "12:00",
        endTimeString: restaurant.onlineTime?.end
          ? `${Math.floor(restaurant.onlineTime.end / 60)
              .toString()
              .padStart(2, "0")}:${(restaurant.onlineTime.end % 60)
              .toString()
              .padStart(2, "0")}`
          : "00:00",
      },
    },
  });

  // Watch form values to detect changes
  const formValues = form.watch();
  useEffect(() => {
    // Create a clean version of the current form data for comparison
    const currentData = {
      name: formValues.name,
      accentColor: formValues.accentColor,
      location: formValues.location,
      onlineTime: {
        start: formValues.onlineTime?.start || 0,
        end: formValues.onlineTime?.end || 0,
      },
      logoImageURL: selectedFile ? "changed" : restaurant.logoImageURL,
    };

    // Create a clean version of the original restaurant for comparison
    const originalData = {
      name: restaurant.name,
      accentColor: restaurant.accentColor,
      location: restaurant.location,
      onlineTime: {
        start: restaurant.onlineTime?.start || 0,
        end: restaurant.onlineTime?.end || 0,
      },
      logoImageURL: restaurant.logoImageURL,
    };

    // Compare the two objects
    const hasFormChanges =
      JSON.stringify(currentData) !== JSON.stringify(originalData);
    setHasChanges(hasFormChanges);
  }, [formValues, selectedFile, restaurant]);

  // Update preview accent color when form value changes
  useEffect(() => {
    const newColor = form.watch("accentColor");
    if (newColor) {
      setPreviewAccentColor(newColor);
    }
  }, [form.watch("accentColor")]);

  // Add effect to track status changes
  useEffect(() => {
    const hasChanged = overrideValue !== restaurant.forceOnlineOverride;
    setHasStatusChanged(hasChanged);
  }, [overrideValue, restaurant.forceOnlineOverride]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Reset previous errors and preview
    setFileError(null);
    if (previewUrl && previewUrl !== restaurant.logoImageURL) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setPreviewUrl(restaurant.logoImageURL);
      setSelectedFile(null);
      return;
    }

    const validTypes = ["image/png", "image/jpeg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setFileError("Only JPG, PNG or SVG files are allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFileError("File must be less than 2MB");
      return;
    }

    setSelectedFile(file);
    setFileSizeMB((file.size / (1024 * 1024)).toFixed(2));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleOverrideUpdate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/my-restaurants/${restaurant._id}/overrideDefaultOnline`,
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
        onSuccess(data.restaurant);
        toast.success(`Restaurant status override updated successfully`);
      } else {
        toast.error(data.message || "Failed to update status override");
      }
    } catch (err) {
      console.error("Error updating override:", err);
      toast.error("Something went wrong while updating status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof updateRestaurantSchema>) => {
    setIsSubmitting(true);

    try {
      // Create a deep copy of the data to avoid mutation issues
      const submissionData = JSON.parse(JSON.stringify(data));
      submissionData._id = restaurant._id; // Ensure we include the restaurant ID

      // Parse time strings to minutes
      if (submissionData.onlineTime?.startTimeString) {
        const [startHours, startMinutes] =
          submissionData.onlineTime.startTimeString.split(":").map(Number);
        submissionData.onlineTime.start = startHours * 60 + startMinutes;
      }

      if (submissionData.onlineTime?.endTimeString) {
        const [endHours, endMinutes] = submissionData.onlineTime.endTimeString
          .split(":")
          .map(Number);
        submissionData.onlineTime.end = endHours * 60 + endMinutes;
      }

      // Clean up time strings before sending to API
      delete submissionData.onlineTime?.startTimeString;
      delete submissionData.onlineTime?.endTimeString;

      // Only upload a new image if a file was selected
      if (selectedFile) {
        // 1. Get signed Cloudinary upload credentials
        let signatureRes;
        try {
          signatureRes = await axios.post("/api/sign-cloudinary-upload", {
            uploadPreset: "restaurants-logos",
          });
        } catch (error) {
          const axiosError = error as AxiosError<{ message?: string }>;
          toast.error("Unauthorized to upload", {
            description:
              axiosError.response?.data.message ??
              "Failed to get upload signature. Please login again.",
          });
          setIsSubmitting(false);
          return;
        }

        const { signature, timestamp, uploadPreset, cloudName, apiKey } =
          signatureRes.data;

        // 2. Upload file to Cloudinary
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("upload_preset", uploadPreset);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);

        let cloudRes;
        try {
          cloudRes = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            formData
          );
          toast.success("Logo uploaded successfully!");
        } catch (uploadError) {
          const axiosError = uploadError as AxiosError<{
            error?: { message?: string };
          }>;
          let errorMessage = "Failed to upload logo.";
          if (axiosError.response?.data?.error?.message) {
            errorMessage = axiosError.response.data.error.message;
          }

          toast.error("Upload Error", {
            description: errorMessage,
          });

          setIsSubmitting(false);
          return;
        }

        // Set the returned image URL
        submissionData.logoImageURL = cloudRes.data.secure_url;
      }

      // 3. Update restaurant in database
      const response = await axios.put(
        `/api/my-restaurants/edit-restaurant`,
        submissionData
      );

      // Call success callback with the updated restaurant
      if (onSuccess) {
        onSuccess(response.data.restaurant);
      }

      toast.success("Restaurant updated successfully!");
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Error updating restaurant:", error);
      toast.error("Failed to update restaurant", {
        description:
          axiosError.response?.data.message ?? "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRestaurant = async () => {
    if (deleteConfirmation !== `${restaurant.name} delete`) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/my-restaurants/${restaurant._id}/delete-restaurant`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Restaurant deleted successfully");
        onClose();
        // Refresh the page to update the UI
        window.location.reload();
      } else {
        toast.error(data.message || "Failed to delete restaurant");
      }
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      toast.error("Something went wrong while deleting the restaurant");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmModal(false);
    }
  };

  return (
    <dialog
      id="restaurant_settings_modal"
      className="modal modal-bottom sm:modal-middle backdrop-blur-xs"
      open={isOpen}
    >
      <div className="modal-box max-w-4xl bg-base-100 p-0 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[80vh]">
        {/* Modal Header */}
        <div className="bg-base-200 p-3 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings style={{ color: restaurant?.accentColor }} />
            Settings{" "}
            <span className="font-normal text-base-content/70">
              {restaurant?.name || ""}
            </span>
          </h2>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Main Tabs Navigation */}
        <div className="tabs tabs-boxed bg-base-200 px-2 py-1 flex flex-nowrap overflow-x-auto justify-center items-center gap-12 shrink-0">
          <button
            className={`tab min-w-max whitespace-nowrap ${
              activeTab === "online"
                ? "tab-active bg-neutral text-neutral-content rounded-t-field"
                : ""
            }`}
            onClick={() => setActiveTab("online")}
            type="button"
          >
            <WifiPen size={24} />
          </button>
          <button
            className={`tab min-w-max whitespace-nowrap ${
              activeTab === "edit"
                ? "tab-active bg-neutral text-neutral-content rounded-t-field"
                : ""
            }`}
            onClick={() => setActiveTab("edit")}
            type="button"
          >
            <SquarePen size={24} />
          </button>
          <button
            className={`tab min-w-max whitespace-nowrap ${
              activeTab === "delete"
                ? "tab-active bg-error text-error-content rounded-t-field"
                : ""
            }`}
            onClick={() => setActiveTab("delete")}
            type="button"
          >
            <Trash2 size={24} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Online Status Tab */}
          {activeTab === "online" && (
            <div>
              {restaurant.isVerified ? (
                <div className="py-4 text-sm">
                  <div className="mb-4 text-warning flex items-start gap-1">
                    <TriangleAlert
                      size={20}
                      className="text-warning shrink-0"
                    />
                    <p className="text-sm leading-snug">
                      <span className="font-semibold">Warning:</span> Overriding
                      the default behavior will prevent the restaurant from{" "}
                      <span className="font-semibold">
                        automatically switching online/offline
                      </span>{" "}
                      based on operating hours.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 bg-base-200">
                    <p className="mb-3 font-medium">Choose status override:</p>

                    {/* Three-state toggle */}
                    <div className="flex justify-center">
                      <div className="join w-full max-w-md">
                        <button
                          className={`join-item btn flex-1 btn-soft ${
                            overrideValue === -1 ? "btn-error" : ""
                          }`}
                          onClick={() => setOverrideValue(-1)}
                          type="button"
                        >
                          <WifiOff size={20} />
                          Force Offline
                        </button>

                        <button
                          className={`join-item btn flex-1 btn-soft gap-1 ${
                            overrideValue === 0 ? "btn-info" : ""
                          }`}
                          onClick={() => setOverrideValue(0)}
                          type="button"
                        >
                          <History size={20} /> Default
                        </button>

                        <button
                          className={`join-item btn flex-1 btn-soft ${
                            overrideValue === 1 ? "btn-success" : ""
                          }`}
                          onClick={() => setOverrideValue(1)}
                          type="button"
                        >
                          <Wifi size={20} />
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
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 text-warning">
                    <TriangleAlert size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Restaurant Not Verified
                  </h3>
                  <p className="text-base-content/70 max-w-md">
                    Your restaurant needs to be verified before you can manage
                    its online status. Please wait for the verification process
                    to complete.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Edit Restaurant Tab */}
          {activeTab === "edit" && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Edit Tabs Navigation */}
              <div className="tabs tabs-boxed bg-base-200 px-2 py-1 flex flex-nowrap overflow-x-auto justify-center items-center gap-10 rounded-xl">
                <button
                  className={`tab min-w-max whitespace-nowrap ${
                    activeEditTab === "basic"
                      ? "tab-active bg-neutral text-neutral-content rounded-t-field"
                      : ""
                  }`}
                  onClick={() => setActiveEditTab("basic")}
                  type="button"
                >
                  <Info size={24} />
                </button>
                <button
                  className={`tab min-w-max whitespace-nowrap ${
                    activeEditTab === "location"
                      ? "tab-active bg-neutral text-neutral-content rounded-t-field"
                      : ""
                  }`}
                  onClick={() => setActiveEditTab("location")}
                  type="button"
                >
                  <MapPin size={24} />
                </button>
                <button
                  className={`tab min-w-max whitespace-nowrap ${
                    activeEditTab === "hours"
                      ? "tab-active bg-neutral text-neutral-content rounded-t-field"
                      : ""
                  }`}
                  onClick={() => setActiveEditTab("hours")}
                  type="button"
                >
                  <Clock size={24} />
                </button>
              </div>

              {/* Tab Content */}
              {activeEditTab === "basic" && (
                <div>
                  <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
                    <legend className="fieldset-legend text-lg font-bold">
                      Basic <span className="text-primary">Information</span>
                    </legend>

                    <div className="form-control w-full mb-3">
                      <label className="label py-1">
                        <span className="label-text font-medium">Name</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Restaurant Name"
                        className="input input-bordered w-full"
                        {...form.register("name")}
                      />
                      {form.formState.errors.name && (
                        <label className="label py-1">
                          <span className="label-text-alt text-error">
                            {form.formState.errors.name.message?.toString()}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="relative z-10">
                      <label className="label py-1">
                        <span className="label-text font-medium">
                          Accent Color
                        </span>
                      </label>
                      <ColorPicker form={form} />
                      {form.formState.errors.accentColor && (
                        <label className="label py-1">
                          <span className="label-text-alt text-error">
                            {form.formState.errors.accentColor.message?.toString()}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="divider">Logo</div>

                    <div className="form-control w-full">
                      <label className="label py-1">
                        <span className="label-text font-medium">
                          Current Logo
                        </span>
                      </label>

                      {restaurant.logoImageURL && (
                        <div className="mt-4">
                          <ul className="flex justify-center items-center scale-115">
                            <li
                              className="rounded-lg cursor-default"
                              style={{
                                backgroundColor: restaurant.accentColor,
                                border: "none",
                                aspectRatio: "2.88 / 1",
                                height: "80px",
                                backgroundImage: "none",
                                marginBottom: "4%",
                              }}
                            >
                              <img
                                src={restaurant.logoImageURL}
                                alt="Preview"
                                className="h-full w-full object-contain transition-transform duration-300"
                                style={{
                                  backgroundColor: "transparent",
                                }}
                              />
                            </li>
                          </ul>
                          <p className="text-xs text-center mb-2 text-base-content/70">
                            Current logo
                          </p>
                        </div>
                      )}

                      <label className="label py-1">
                        <span className="label-text font-medium">
                          Upload New Logo
                        </span>
                        <span className="label-text-alt text-xs">
                          Max size: 2MB (JPG, PNG, SVG)
                        </span>
                      </label>

                      <input
                        type="file"
                        accept="image/*,image/svg+xml"
                        className="file-input file-input-bordered w-full"
                        onChange={handleFileSelect}
                      />

                      {/* File error message display */}
                      {fileError && (
                        <div className="mt-2 text-error text-sm bg-error/10 p-2 rounded-md flex items-center gap-2">
                          <span>
                            <TriangleAlert />
                          </span>
                          <span>{fileError}</span>
                        </div>
                      )}

                      {selectedFile && previewUrl && (
                        <div className="mt-4">
                          <ul className="flex justify-center items-center scale-115">
                            <li
                              className="rounded-lg cursor-default"
                              style={{
                                backgroundColor: previewAccentColor,
                                border: "none",
                                aspectRatio: "2.88 / 1",
                                height: "80px",
                                backgroundImage: "none",
                                marginBottom: "4%",
                              }}
                            >
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="h-full w-full object-contain transition-transform duration-300"
                                style={{
                                  backgroundColor: "transparent",
                                }}
                              />
                            </li>
                          </ul>
                          <p className="text-xs text-center mb-2 text-base-content/70">
                            New logo preview
                          </p>
                          <p className="text-sm text-center">
                            Size: {fileSizeMB} MB
                          </p>
                        </div>
                      )}

                      {!selectedFile && (
                        <p className="text-sm mt-2 text-base-content/70 text-center">
                          Select a new logo or keep the current one
                        </p>
                      )}
                    </div>
                  </fieldset>
                </div>
              )}

              {activeEditTab === "location" && (
                <div>
                  <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
                    <legend className="fieldset-legend text-lg font-bold">
                      Restaurant <span className="text-primary">Location</span>
                    </legend>

                    <div className="mb-4">
                      <MapPopup
                        setLocation={(loc) => {
                          form.setValue("location.lat", loc.lat);
                          form.setValue("location.lng", loc.lng);
                          form.setValue("location.city", loc.city);
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text font-medium">
                            Latitude
                          </span>
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="input input-bordered w-full"
                          {...form.register("location.lat", {
                            setValueAs: (v) => (v === "" ? 0 : parseFloat(v)),
                          })}
                        />
                        {form.formState.errors.location?.lat && (
                          <label className="label py-1">
                            <span className="label-text-alt text-error">
                              {form.formState.errors.location.lat.message?.toString()}
                            </span>
                          </label>
                        )}
                      </div>

                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text font-medium">
                            Longitude
                          </span>
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="input input-bordered w-full"
                          {...form.register("location.lng", {
                            setValueAs: (v) => (v === "" ? 0 : parseFloat(v)),
                          })}
                        />
                        {form.formState.errors.location?.lng && (
                          <label className="label py-1">
                            <span className="label-text-alt text-error">
                              {form.formState.errors.location.lng.message?.toString()}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="form-control mt-4">
                      <label className="label py-1">
                        <span className="label-text font-medium">Address</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        {...form.register("location.address")}
                      />
                      {form.formState.errors.location?.address && (
                        <label className="label py-1">
                          <span className="label-text-alt text-error">
                            {form.formState.errors.location.address.message?.toString()}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control mt-4">
                      <label className="label py-1">
                        <span className="label-text font-medium">City</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        {...form.register("location.city")}
                      />
                      {form.formState.errors.location?.city && (
                        <label className="label py-1">
                          <span className="label-text-alt text-error">
                            {form.formState.errors.location.city.message?.toString()}
                          </span>
                        </label>
                      )}
                    </div>
                  </fieldset>
                </div>
              )}

              {activeEditTab === "hours" && (
                <div>
                  <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
                    <legend className="fieldset-legend text-lg font-bold">
                      Operating <span className="text-primary">Hours</span>
                    </legend>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text font-medium">
                            Online Start Time
                          </span>
                        </label>
                        <input
                          type="time"
                          className="input input-bordered w-full"
                          {...form.register("onlineTime.startTimeString")}
                        />
                        {form.formState.errors.onlineTime?.startTimeString && (
                          <label className="label py-1">
                            <span className="label-text-alt text-error">
                              {form.formState.errors.onlineTime.startTimeString.message?.toString()}
                            </span>
                          </label>
                        )}
                      </div>

                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text font-medium">
                            Online End Time
                          </span>
                        </label>
                        <input
                          type="time"
                          className="input input-bordered w-full"
                          {...form.register("onlineTime.endTimeString")}
                        />
                        {form.formState.errors.onlineTime?.endTimeString && (
                          <label className="label py-1">
                            <span className="label-text-alt text-error">
                              {form.formState.errors.onlineTime.endTimeString.message?.toString()}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  </fieldset>
                </div>
              )}
            </form>
          )}

          {/* Delete Restaurant Tab */}
          {activeTab === "delete" && (
            <div className="space-y-4">
              <div className="bg-error/10 p-4 rounded-lg">
                <div className="flex items-start gap-1">
                  <TriangleAlert
                    className="text-error shrink-0 mt-1"
                    size={24}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-error mb-2">
                      Danger Zone
                    </h3>
                    <p className="text-base-content/80">
                      Once you delete a restaurant, there is no going back.
                      Please be certain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="bg-base-200 p-4 border-t border-base-300 shrink-0">
          <div className="flex justify-between">
            {activeTab === "delete" ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-error"
                  onClick={() => setShowDeleteConfirmModal(true)}
                >
                  Delete Restaurant
                </button>
              </>
            ) : activeTab === "edit" ? (
              <>
                {activeEditTab === "basic" ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn gap-1"
                      onClick={() => setActiveEditTab("location")}
                      style={{
                        backgroundColor: restaurant.accentColor,
                        borderColor: restaurant.accentColor,
                        color: "white",
                      }}
                    >
                      Next <ArrowRight size={18} />
                    </button>
                  </>
                ) : activeEditTab === "location" ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary gap-1"
                      onClick={() => setActiveEditTab("basic")}
                    >
                      <ArrowLeft size={18} /> Back
                    </button>
                    <button
                      type="button"
                      className="btn gap-1"
                      onClick={() => setActiveEditTab("hours")}
                      style={{
                        backgroundColor: restaurant.accentColor,
                        borderColor: restaurant.accentColor,
                        color: "white",
                      }}
                    >
                      Next <ArrowRight size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary gap-1"
                      onClick={() => setActiveEditTab("location")}
                    >
                      <ArrowLeft size={18} /> Back
                    </button>
                    <button
                      type="submit"
                      className={`btn ${hasChanges ? "" : "btn-disabled"}`}
                      disabled={isSubmitting || !hasChanges}
                      style={
                        hasChanges
                          ? {
                              backgroundColor: restaurant.accentColor,
                              borderColor: restaurant.accentColor,
                              color: "white",
                            }
                          : undefined
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Updating...
                        </>
                      ) : (
                        "Update Restaurant"
                      )}
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className={`btn gap-1 ${
                    !hasStatusChanged || !restaurant.isVerified
                      ? "btn-disabled"
                      : ""
                  }`}
                  style={
                    hasStatusChanged && restaurant.isVerified
                      ? {
                          backgroundColor: restaurant.accentColor,
                          borderColor: restaurant.accentColor,
                          color: "white",
                        }
                      : undefined
                  }
                  onClick={handleOverrideUpdate}
                  disabled={
                    isSubmitting || !hasStatusChanged || !restaurant.isVerified
                  }
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Rss size={18} />
                      {!restaurant.isVerified
                        ? "Not Verified"
                        : !hasStatusChanged
                          ? "No Changes"
                          : "Update Status"}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <dialog
          id="delete_confirm_modal"
          className="modal modal-bottom sm:modal-middle"
          open
        >
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Delete Restaurant</h3>
            <p className="text-base-content/80 mb-4">
              This action cannot be undone. This will permanently delete the
              restaurant
              <span className="font-semibold"> {restaurant.name}</span> and all
              its menu items.
            </p>
            <p className="text-base-content/80 mb-4">
              Please type{" "}
              <span className="font-semibold">{restaurant.name} delete</span> to
              confirm.
            </p>
            <input
              type="text"
              className="input input-bordered w-full mb-4"
              placeholder={`Type "${restaurant.name} delete" to confirm`}
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
            />
            <div className="modal-action">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setDeleteConfirmation("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                disabled={
                  deleteConfirmation !== `${restaurant.name} delete` ||
                  isDeleting
                }
                onClick={handleDeleteRestaurant}
              >
                {isDeleting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  "Delete Restaurant"
                )}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowDeleteConfirmModal(false)}>
              close
            </button>
          </form>
        </dialog>
      )}

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default RestaurantSettingsModal;
