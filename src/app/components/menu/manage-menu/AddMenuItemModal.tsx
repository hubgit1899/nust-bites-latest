"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMenuItemSchema } from "@/schemas/addMenuItemSchema";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { MenuItem } from "@/models/MenuItem";
import { z } from "zod";
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  X,
  Camera,
  TriangleAlert,
  Info,
  Image,
  Clock,
  ListFilterPlus,
} from "lucide-react";

interface Category {
  name: string;
  count: number;
}

interface AddMenuItemModalProps {
  restaurantId: string;
  categories: Category[];
  onSuccess: (newMenuItem: MenuItem) => void;
  accentColor: string;
}

export const AddMenuItemModal = ({
  restaurantId,
  categories,
  onSuccess,
  accentColor,
}: AddMenuItemModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSizeMB, setFileSizeMB] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Initialize form with zodResolver
  const form = useForm({
    resolver: zodResolver(addMenuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      basePrice: 0,
      imageURL: "https://nustbites.vercel.app/",
      category: "",
      available: true,
      forceOnlineOverride: false,
      onlineTime: {
        start: 0,
        end: 0,
        startTimeString: "12:00",
        endTimeString: "00:00",
      },
      options: [] as {
        optionHeader: string;
        name: string[];
        additionalPrice: number[];
        required: boolean;
      }[],
    },
  });

  // Watch form values to update UI conditionally
  const forceOnlineOverride = form.watch("forceOnlineOverride");
  const options = form.watch("options");
  const available = form.watch("available");

  const resetForm = () => {
    form.reset();
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileSizeMB(null);
    setFileError(null);
    setShowTimeSettings(false);
    setActiveTab("basic");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Reset previous errors and preview
    setFileError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setFileError("Only JPG, JPEG or PNG files are allowed");
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setFileError("File must be less than 1.5 MB");
      return;
    }

    setSelectedFile(file);
    setFileSizeMB((file.size / (1024 * 1024)).toFixed(2));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const addOption = () => {
    const currentOptions = form.getValues("options") || [];
    form.setValue("options", [
      ...currentOptions,
      { optionHeader: "", name: [""], additionalPrice: [0], required: false },
    ]);
    // Trigger rerender by updating the form
    form.trigger("options");
  };

  const removeOption = (index: number) => {
    const currentOptions = form.getValues("options") || [];
    const updatedOptions = currentOptions.filter((_, i) => i !== index);
    form.setValue("options", updatedOptions);
    // Trigger rerender by updating the form
    form.trigger("options");
  };

  const addOptionItem = (optionIndex: number) => {
    const currentOptions = form.getValues("options");
    if (!currentOptions || !currentOptions[optionIndex]) return;

    const updatedOptions = [...currentOptions];

    // Ensure arrays exist
    if (!updatedOptions[optionIndex].name) {
      updatedOptions[optionIndex].name = [];
    }
    if (!updatedOptions[optionIndex].additionalPrice) {
      updatedOptions[optionIndex].additionalPrice = [];
    }

    updatedOptions[optionIndex].name.push("");
    updatedOptions[optionIndex].additionalPrice.push(0);

    form.setValue("options", updatedOptions);
    // Trigger rerender by updating the form
    form.trigger("options");
  };

  const removeOptionItem = (optionIndex: number, itemIndex: number) => {
    const currentOptions = form.getValues("options");
    if (!currentOptions || !currentOptions[optionIndex]) return;

    const updatedOptions = [...currentOptions];

    updatedOptions[optionIndex].name = updatedOptions[optionIndex].name.filter(
      (_, i) => i !== itemIndex
    );
    updatedOptions[optionIndex].additionalPrice = updatedOptions[
      optionIndex
    ].additionalPrice.filter((_, i) => i !== itemIndex);

    form.setValue("options", updatedOptions);
    // Trigger rerender by updating the form
    form.trigger("options");
  };

  const handleCancel = () => {
    resetForm();
    // Close the modal using the dialog API
    const modal = document.getElementById(
      "add_menu_item_modal"
    ) as HTMLDialogElement;
    if (modal) modal.close();
  };

  const onSubmit = async (data: z.infer<typeof addMenuItemSchema>) => {
    setIsSubmitting(true);

    try {
      if (!selectedFile) {
        toast.error("Please select an image for the menu item", {
          position: "top-right",
        });
        setIsSubmitting(false);
        return;
      }

      // Create a deep copy of the data to avoid mutation issues
      const submissionData = JSON.parse(JSON.stringify(data));

      // Only process time settings if forceOnlineOverride is true
      if (submissionData.forceOnlineOverride) {
        // Make sure we have values for time strings
        if (
          !submissionData.onlineTime.startTimeString ||
          !submissionData.onlineTime.endTimeString
        ) {
          toast.error(
            "Please set both start and end times for online availability",
            {
              position: "top-right",
            }
          );
          setIsSubmitting(false);
          return;
        }

        // Parse time strings to minutes
        const [startHours, startMinutes] =
          submissionData.onlineTime.startTimeString.split(":").map(Number);
        const [endHours, endMinutes] = submissionData.onlineTime.endTimeString
          .split(":")
          .map(Number);

        // Convert to minutes since midnight
        submissionData.onlineTime.start = startHours * 60 + startMinutes;
        submissionData.onlineTime.end = endHours * 60 + endMinutes;
      } else {
        // If not forcing override, set default values
        submissionData.onlineTime.start = 0;
        submissionData.onlineTime.end = 0;
      }

      // Clean up time strings before sending to API
      delete submissionData.onlineTime.startTimeString;
      delete submissionData.onlineTime.endTimeString;

      // 1. Get signed Cloudinary upload credentials
      let signatureRes;
      try {
        signatureRes = await axios.post("/api/sign-cloudinary-upload", {
          uploadPreset: "menu-items",
        });
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        toast.error("Unauthorized to upload", {
          description:
            axiosError.response?.data.message ??
            "Failed to get upload signature. Please login again.",
          position: "top-right",
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
        toast.success("Image uploaded successfully!");
      } catch (uploadError) {
        const axiosError = uploadError as AxiosError<{
          error?: { message?: string };
        }>;
        let errorMessage = "Failed to upload image.";
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
      submissionData.imageURL = cloudRes.data.secure_url;

      // 3. Save menu item to database
      const response = await axios.post(
        `/api/my-restaurants/${restaurantId}/manage-menu`,
        submissionData
      );

      toast.success("Menu item added successfully!");

      // Call success callback with the new menu item
      onSuccess(response.data.menuItem);

      // Reset form and close modal
      resetForm();

      // Close the modal using the dialog API
      const modal = document.getElementById(
        "add_menu_item_modal"
      ) as HTMLDialogElement;
      if (modal) modal.close();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Error adding menu item:", error);
      toast.error("Failed to add menu item", {
        description:
          axiosError.response?.data.message ?? "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      id="add_menu_item_modal"
      className="modal modal-bottom sm:modal-middle backdrop-blur-xs"
    >
      <div className="modal-box max-w-4xl bg-base-100 p-0 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[80vh]">
        {/* Modal Header */}
        <div className="bg-base-200 p-3 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold">Add New Menu Item</h2>
          <button
            onClick={handleCancel}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="tabs tabs-boxed bg-base-200 px-2 py-1 flex flex-nowrap overflow-x-auto justify-center items-center gap-12 shrink-0">
          <button
            className={`tab min-w-max whitespace-nowrap ${activeTab === "basic" ? "tab-active bg-neutral text-neutral-content rounded-t-field" : ""}`}
            onClick={() => setActiveTab("basic")}
            type="button"
          >
            <Info size={24} />
          </button>
          <button
            className={`tab min-w-max whitespace-nowrap ${activeTab === "image" ? "tab-active bg-neutral text-neutral-content rounded-t-field" : ""}`}
            onClick={() => setActiveTab("image")}
            type="button"
          >
            <Image size={24} />
          </button>
          <button
            className={`tab min-w-max whitespace-nowrap ${activeTab === "availability" ? "tab-active bg-neutral text-neutral-content rounded-t-field" : ""}`}
            onClick={() => setActiveTab("availability")}
            type="button"
          >
            <Clock size={24} />
          </button>
          <button
            className={`tab min-w-max whitespace-nowrap ${activeTab === "options" ? "tab-active bg-neutral text-neutral-content rounded-t-field" : ""}`}
            onClick={() => setActiveTab("options")}
            type="button"
          >
            <ListFilterPlus size={24} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 w-full"
          >
            {/* Basic Information Section */}
            <div className={activeTab === "basic" ? "block" : "hidden"}>
              <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
                <legend className="fieldset-legend text-lg font-bold">
                  Item <span className="text-primary">Details</span>
                </legend>

                <div className="form-control w-full mb-3">
                  <label className="label py-1">
                    <span className="label-text font-medium">Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Item Name"
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

                <div className="form-control w-full mb-3">
                  <label className="label py-1">
                    <span className="label-text font-medium">
                      Base Price (Rs.)
                    </span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="input input-bordered w-full"
                    {...form.register("basePrice", { valueAsNumber: true })}
                  />
                  {form.formState.errors.basePrice && (
                    <label className="label py-1">
                      <span className="label-text-alt text-error">
                        {form.formState.errors.basePrice.message?.toString()}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control w-full mb-3">
                  <label className="label py-1">
                    <span className="label-text font-medium">Description</span>
                  </label>
                  <textarea
                    placeholder="Describe your menu item"
                    className="textarea textarea-bordered w-full h-24"
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <label className="label py-1">
                      <span className="label-text-alt text-error">
                        {form.formState.errors.description.message?.toString()}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control w-full mb-3">
                  <label className="label py-1">
                    <span className="label-text font-medium">Category</span>
                  </label>
                  <input
                    type="text"
                    list="categories"
                    placeholder="e.g: Burgers, Drinks"
                    className="input input-bordered w-full"
                    {...form.register("category")}
                  />
                  <datalist id="categories">
                    {categories.map((cat, i) => (
                      <option key={i} value={cat.name} />
                    ))}
                  </datalist>
                  {form.formState.errors.category && (
                    <label className="label py-1">
                      <span className="label-text-alt text-error">
                        {form.formState.errors.category.message?.toString()}
                      </span>
                    </label>
                  )}
                </div>
              </fieldset>
            </div>

            {/* Image Upload Section */}
            <div className={activeTab === "image" ? "block" : "hidden"}>
              <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
                <legend className="fieldset-legend text-lg font-bold">
                  Item <span className="text-primary">Image</span>
                </legend>

                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-medium">Upload Image</span>
                    <span className="label-text-alt text-xs">
                      Max size: 1.5MB (JPG, PNG)
                    </span>
                  </label>

                  <input
                    type="file"
                    accept="image/*"
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

                  {previewUrl ? (
                    <div className="mt-4 flex flex-col items-center">
                      <div className="avatar">
                        <div className="w-40 rounded-lg shadow-md">
                          <img src={previewUrl} alt="Preview" />
                        </div>
                      </div>
                      <p className="text-sm mt-2">Size: {fileSizeMB} MB</p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-base-300 rounded-lg mt-4 p-6 flex flex-col items-center justify-center bg-base-100">
                      <div className="text-4xl text-base-300 mb-2">
                        <Camera size={48} />
                      </div>
                      <p className="text-center text-base-content/70">
                        Select an image to preview
                      </p>
                    </div>
                  )}
                </div>
              </fieldset>
            </div>

            {/* Availability Section */}
            <div className={activeTab === "availability" ? "block" : "hidden"}>
              <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
                <legend className="fieldset-legend text-lg font-bold">
                  Item <span className="text-primary">Availability</span>
                </legend>

                <div className="form-control w-full mb-4">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      {...form.register("available")}
                    />
                    <span className="label-text">
                      {available
                        ? "Item is available for ordering"
                        : "Item is not available for ordering"}
                    </span>
                  </label>
                </div>

                <div className="divider my-2">Online Availability</div>

                <div className="form-control w-full mb-4">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-warning"
                      {...form.register("forceOnlineOverride")}
                    />
                    <span className="label-text">
                      Set custom online hours for this item
                    </span>
                  </label>

                  <p className="label-text-alt mt-1 text-base-content italic text-xs">
                    If enabled, this item will only be available during the
                    specified hours if the restaurant is online, otherwise item
                    will follow the restaurant's online time.
                  </p>
                </div>

                {forceOnlineOverride && (
                  <div className="bg-base-300 rounded-lg p-3 w-full">
                    <div className="flex flex-col w-full">
                      <div className="form-control w-full mb-3">
                        <label className="label py-1">
                          <span className="label-text font-medium">
                            Start Time
                          </span>
                        </label>
                        <input
                          type="time"
                          className="input input-bordered w-full"
                          {...form.register("onlineTime.startTimeString")}
                        />
                      </div>

                      <div className="form-control w-full">
                        <label className="label py-1">
                          <span className="label-text font-medium">
                            End Time
                          </span>
                        </label>
                        <input
                          type="time"
                          className="input input-bordered w-full"
                          {...form.register("onlineTime.endTimeString")}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </fieldset>
            </div>

            {/* Options Section */}
            <div className={activeTab === "options" ? "block" : "hidden"}>
              <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
                <legend className="fieldset-legend text-lg font-bold">
                  Item <span className="text-primary">Options</span>
                </legend>

                <div className="flex justify-between items-center mb-3 gap-2">
                  <p className="text-sm text-base-content/70">
                    Add customizable options like size, toppings, etc.
                  </p>
                  <div
                    className="tooltip tooltip-left"
                    data-tip="Add an option group"
                  >
                    <button
                      type="button"
                      className="btn btn-sm btn-circle btn-outline"
                      onClick={addOption}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {options && options.length > 0 ? (
                  options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className="bg-base-300 p-3 rounded-lg mb-3 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-base">
                          Option Group {optionIndex + 1}
                        </h4>
                        <button
                          type="button"
                          className="btn btn-sm btn-error btn-outline"
                          onClick={() => removeOption(optionIndex)}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div className="form-control">
                          <label className="label py-1">
                            <span className="label-text">Header</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g: Size, Toppings"
                            className="input input-bordered w-full"
                            {...form.register(
                              `options.${optionIndex}.optionHeader`
                            )}
                          />
                        </div>

                        <div className="form-control h-full flex justify-end">
                          <label className="label cursor-pointer justify-end gap-2">
                            <span className="label-text">Required:</span>
                            <input
                              type="checkbox"
                              className="toggle toggle-primary"
                              {...form.register(
                                `options.${optionIndex}.required`
                              )}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="divider text-xs my-2">Option Items</div>

                      {option.name &&
                        option.name.map((_, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="bg-base-100 p-2 rounded mb-2 flex items-center gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                placeholder="Option name"
                                className="input input-bordered input-sm w-full"
                                {...form.register(
                                  `options.${optionIndex}.name.${itemIndex}`
                                )}
                              />
                            </div>
                            <div className="w-18 shrink-0">
                              <input
                                type="number"
                                placeholder="Extra Rs."
                                className="input input-bordered input-sm w-full"
                                {...form.register(
                                  `options.${optionIndex}.additionalPrice.${itemIndex}`,
                                  { valueAsNumber: true }
                                )}
                              />
                            </div>
                            <button
                              type="button"
                              className="btn btn-xs btn-circle btn-outline btn-error"
                              onClick={() =>
                                removeOptionItem(optionIndex, itemIndex)
                              }
                            >
                              <X size={12} strokeWidth={3} />
                            </button>
                          </div>
                        ))}

                      <button
                        type="button"
                        className="btn btn-sm btn-outline mt-2 w-full gap-2"
                        onClick={() => addOptionItem(optionIndex)}
                      >
                        <Plus size={16} /> Add Option Item
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="bg-base-300 p-4 rounded-lg text-center">
                    <p className="text-base-content/70 mb-3">
                      No option groups added yet.
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline gap-2"
                      onClick={addOption}
                    >
                      <Plus size={20} /> Add First Option Group
                    </button>
                  </div>
                )}
              </fieldset>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="bg-base-200 p-4 border-t border-base-300 shrink-0">
          <div className="flex justify-between">
            {activeTab === "basic" ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn gap-1"
                  onClick={() => setActiveTab("image")}
                  style={{
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                    color: "white",
                  }}
                >
                  Next <ArrowRight size={18} />
                </button>
              </>
            ) : activeTab === "image" ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary gap-1"
                  onClick={() => setActiveTab("basic")}
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  className="btn gap-1"
                  onClick={() => setActiveTab("availability")}
                  style={{
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                    color: "white",
                  }}
                >
                  Next <ArrowRight size={18} />
                </button>
              </>
            ) : activeTab === "availability" ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary gap-1"
                  onClick={() => setActiveTab("image")}
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  className="btn gap-1"
                  onClick={() => setActiveTab("options")}
                  style={{
                    backgroundColor: accentColor,
                    borderColor: accentColor,
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
                  onClick={() => setActiveTab("availability")}
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={isSubmitting}
                  onClick={() => {
                    // Check if form is valid before submitting
                    form.trigger().then((isValid) => {
                      if (isValid && selectedFile) {
                        form.handleSubmit(onSubmit)();
                      } else {
                        // Show error message if form is not valid
                        if (!selectedFile) {
                          toast.error(
                            "Please select an image for the menu item",
                            {
                              position: "top-right",
                            }
                          );
                        } else {
                          // Get the first error from form.formState.errors
                          const errorFields = Object.entries(
                            form.formState.errors
                          );
                          if (errorFields.length > 0) {
                            const [fieldName, error] = errorFields[0];
                            toast.error(
                              error.message?.toString() ||
                                `Invalid ${fieldName}`,
                              {
                                position: "top-right",
                              }
                            );
                          } else {
                            toast.error(
                              "Please fill out all required fields correctly",
                              {
                                position: "top-right",
                              }
                            );
                          }
                        }
                      }
                    });
                  }}
                  style={{
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                    color: "white",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Adding...
                    </>
                  ) : (
                    "Add Menu Item"
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default AddMenuItemModal;
