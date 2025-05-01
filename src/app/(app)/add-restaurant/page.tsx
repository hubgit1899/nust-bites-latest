"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addRestaurantSchema } from "@/schemas/addRestaurantSchema";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { z } from "zod";
import ColorPicker from "@/app/components/ColorPicker";
import MapPopup from "@/app/components/MapPopup/MapPopup";

const AddRestaurantPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSizeMB, setFileSizeMB] = useState<string | null>(null);

  const form = useForm<z.infer<typeof addRestaurantSchema>>({
    resolver: zodResolver(addRestaurantSchema),
    defaultValues: {
      name: "",
      logoImageURL: "https://nustbites.vercel.app/",
      accentColor: "#ff0000",
      orderCode: "",
      location: {
        lat: 0,
        lng: 0,
        address: "",
        city: "",
      },
      onlineTime: {
        start: 0,
        end: 0,
        startTimeString: "12:00",
        endTimeString: "00:00",
      },
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG or SVG allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be less than 2MB");
      return;
    }

    setSelectedFile(file);
    setFileSizeMB((file.size / (1024 * 1024)).toFixed(2));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onSubmit = async (data: z.infer<typeof addRestaurantSchema>) => {
    setIsSubmitting(true);

    try {
      console.log("Form Data BEFORE conversion:", data);

      const [startHours, startMinutes] = data.onlineTime
        .startTimeString!.split(":")
        .map(Number);
      const [endHours, endMinutes] = data.onlineTime
        .endTimeString!.split(":")
        .map(Number);

      data.onlineTime.start = startHours * 60 + startMinutes;
      data.onlineTime.end = endHours * 60 + endMinutes;

      delete data.onlineTime.startTimeString;
      delete data.onlineTime.endTimeString;

      console.log("Form Data AFTER conversion:", data);

      if (!selectedFile) {
        toast.error("Please select a logo image");
        setIsSubmitting(false);
        return;
      }

      // 1. Get signed Cloudinary upload credentials from backend
      let signatureRes;
      try {
        signatureRes = await axios.post("/api/sign-cloudinary-upload", {
          uploadPreset: "restaurants-logos", // you send the preset
        });
        console.log("✅ Signature Response:", signatureRes.data);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        console.error("❌ Error getting Cloudinary signature:", axiosError);

        toast.error("Unauthorized to upload", {
          description:
            axiosError.response?.data.message ??
            "Failed to get upload signature. Please login again.",
        });
        setIsSubmitting(false);
        return;
      }

      if (signatureRes.status !== 200) {
        toast.error("Failed to authorize upload", {
          description: "Invalid server response.",
        });
        setIsSubmitting(false);
        return;
      }

      const { signature, timestamp, uploadPreset, cloudName, apiKey } =
        signatureRes.data;

      // 2. Upload file securely to Cloudinary
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
        console.log("✅ Cloudinary Upload Success:", cloudRes.data);
        toast.success("Logo image uploaded successfully!");
      } catch (uploadError) {
        console.error("❌ Cloudinary Upload Error:", uploadError);

        const axiosError = uploadError as AxiosError<{
          error?: { message?: string };
        }>;
        let errorMessage = "Failed to upload logo image.";
        if (axiosError.response?.data?.error?.message) {
          errorMessage = axiosError.response.data.error.message;
        }

        toast.error("Upload Error", {
          description: errorMessage,
        });

        setIsSubmitting(false);
        return;
      }

      // ✅ Set the returned logo URL
      data.logoImageURL = cloudRes.data.secure_url;

      // 3. Save restaurant to your own database
      const response = await axios.post("/api/add-restaurant", data);

      toast.success("Restaurant added successfully!", {
        description: response.data.message,
      });

      router.push("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("❌ Error adding restaurant:", axiosError);

      toast.error("Failed to add restaurant", {
        description:
          axiosError.response?.data.message ?? "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center mb-15 mt-5">
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-full max-w-2xl border p-6 overflow-auto">
        <legend className="fieldset-legend text-3xl font-bold">
          Add <span className="text-primary">Restaurant</span>
        </legend>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-0 space-y-4">
          {/* 1. Restaurant Information Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">
              1. <span className="text-primary">Basic Information</span>
            </h3>
            <div className="p-2">
              {/* Name */}
              <div>
                <label className="label font-semibold">Name</label>
                <input
                  type="text"
                  placeholder="Restaurant Name"
                  className="input input-bordered w-full"
                  {...form.register("name")}
                />
                <p className="text-xs text-error mt-1">
                  {form.formState.errors.name?.message}
                </p>
              </div>

              {/* Logo File Upload */}
              <div className="mt-4">
                <label className="label font-semibold">Logo Image</label>
                <input
                  type="file"
                  accept="image/*,image/svg+xml"
                  className="file-input file-input-bordered w-full"
                  onChange={handleFileSelect}
                />
                {previewUrl && (
                  <div className="mt-2">
                    <img src={previewUrl} alt="Preview" className="h-20" />
                    <p className="text-sm text-gray-500 mt-1">
                      Size: {fileSizeMB} MB
                    </p>
                  </div>
                )}
              </div>

              {/* Accent Color */}
              <div className="relative z-10 mt-4">
                <label className="label font-semibold">Accent Color</label>
                <ColorPicker form={form} />
                <p className="text-xs text-error mt-1 min-h-[1rem]">
                  {form.formState.errors.accentColor?.message}
                </p>
              </div>

              {/* Live Preview */}
              {previewUrl && (
                <div className="mt-4">
                  {/* <label className="label font-semibold text-sm">
                    Live Logo Preview
                  </label> */}
                  <ul className="flex justify-center items-center scale-115">
                    <li
                      className="rounded-lg cursor-default"
                      style={{
                        backgroundColor: form.watch("accentColor"),
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
                </div>
              )}

              {/* Order Code */}
              <div className="mt-4">
                <label className="label font-semibold">Order Code</label>
                <input
                  type="text"
                  placeholder="e.g. ss, k01"
                  className="input input-bordered w-full"
                  {...form.register("orderCode")}
                />
                <p className="text-xs text-error mt-1">
                  {form.formState.errors.orderCode?.message}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="my-6 border-neutral" />

          {/* 2. Location Section */}
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-4">
              2. <span className="text-primary">Restaurant Location</span>
            </h3>
            <div className="p-2">
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
                {/* Latitude */}
                <div>
                  <label className="label font-semibold">Latitude</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input input-bordered w-full"
                    {...form.register("location.lat", {
                      setValueAs: (v) => (v === "" ? 0 : parseFloat(v)),
                    })}
                  />
                  <p className="text-xs text-error mt-1">
                    {form.formState.errors.location?.lat?.message}
                  </p>
                </div>

                {/* Longitude */}
                <div>
                  <label className="label font-semibold">Longitude</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input input-bordered w-full"
                    {...form.register("location.lng", {
                      setValueAs: (v) => (v === "" ? 0 : parseFloat(v)),
                    })}
                  />
                  <p className="text-xs text-error mt-1">
                    {form.formState.errors.location?.lng?.message}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="mt-4">
                <label className="label font-semibold">Address</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...form.register("location.address")}
                />
                <p className="text-xs text-error mt-1">
                  {form.formState.errors.location?.address?.message}
                </p>
              </div>

              {/* City */}
              <div className="mt-4">
                <label className="label font-semibold">City</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...form.register("location.city")}
                />
                <p className="text-xs text-error mt-1">
                  {form.formState.errors.location?.city?.message}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="my-6 border-neutral" />

          {/* 3. Online Time Section */}
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-4">
              3. <span className="text-primary">Online Duration</span>
            </h3>
            <div className="p-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Online Start Time */}
                <div>
                  <label className="label font-semibold">
                    Online Start Time
                  </label>
                  <input
                    type="time"
                    className="input input-bordered w-full"
                    {...form.register("onlineTime.startTimeString", {
                      required: true,
                    })}
                  />
                  <p className="text-xs text-error mt-1">
                    {form.formState.errors.onlineTime?.startTimeString?.message}
                  </p>
                </div>

                {/* Online End Time */}
                <div>
                  <label className="label font-semibold">Online End Time</label>
                  <input
                    type="time"
                    className="input input-bordered w-full"
                    {...form.register("onlineTime.endTimeString", {
                      required: true,
                    })}
                  />
                  <p className="text-xs text-error mt-1">
                    {form.formState.errors.onlineTime?.endTimeString?.message}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-neutral w-full mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              "Add Restaurant"
            )}
          </button>
        </form>
      </fieldset>
    </div>
  );
};

export default AddRestaurantPage;
