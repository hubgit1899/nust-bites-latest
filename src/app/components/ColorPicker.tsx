"use client";

import { HexColorPicker } from "react-colorful";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { addRestaurantSchema } from "@/schemas/addRestaurantSchema";

type FormType = z.infer<typeof addRestaurantSchema>;

export default function ColorPicker({
  form,
}: {
  form: UseFormReturn<FormType>;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const openEyeDropper = async () => {
    if (!("EyeDropper" in window)) {
      toast.error("Eyedropper not supported in this browser.");
      return;
    }
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      form.setValue("accentColor", result.sRGBHex);
      setShowPicker(false);
    } catch (error) {
      console.log("Eyedropper cancelled.", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="relative" ref={pickerRef}>
      {/* Color input and text input */}
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-sm border border-base-300 cursor-pointer"
          style={{ backgroundColor: form.watch("accentColor") }}
          onClick={() => setShowPicker((prev) => !prev)}
        />
        <input
          type="text"
          className="input input-bordered w-full"
          value={form.watch("accentColor")}
          onChange={(e) => {
            form.setValue("accentColor", e.target.value);
            form.clearErrors("accentColor");
          }}
        />
      </div>

      {/* Color Picker Popup */}
      {showPicker && (
        <div className="absolute z-50 mt-2 p-3 rounded-lg bg-base-100 border border-base-300 shadow-xl">
          <HexColorPicker
            color={form.watch("accentColor")}
            onChange={(color) => form.setValue("accentColor", color)}
          />
          <button
            type="button"
            className="btn btn-sm btn-primary mt-2 w-full"
            onClick={openEyeDropper}
          >
            Pick from screen 🎯
          </button>
        </div>
      )}
    </div>
  );
}
