"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Settings, Save, DollarSign, Palette } from "lucide-react";

interface AdminSettings {
  baseDeliveryFee: number;
  deliveryFeePerKm: number;
  darkTheme: string;
  lightTheme: string;
}

// Extract themes from globals.css
const availableThemes = [
  "default",
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
  "caramellatte",
  "abyss",
  "silk",
];

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<AdminSettings>({
    baseDeliveryFee: 75,
    deliveryFeePerKm: 25,
    darkTheme: "default",
    lightTheme: "default",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings");
        const data = await response.json();
        if (data.success) {
          setSettings(data.settings);
        } else {
          toast.error("Failed to fetch admin settings");
        }
      } catch (error) {
        console.error("Error fetching admin settings:", error);
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.isSuperAdmin) {
      fetchSettings();
    }
  }, [session]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: name.includes("Fee") ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Settings updated successfully");
      } else {
        toast.error(data.message || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (!session?.user?.isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-base-content/70">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Delivery Fee Settings */}
        <div className="bg-base-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-full bg-primary/10">
              <DollarSign size={24} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Delivery Fee Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Base Delivery Fee
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/70">
                  Rs.
                </span>
                <input
                  type="number"
                  name="baseDeliveryFee"
                  value={settings.baseDeliveryFee}
                  onChange={handleInputChange}
                  className="input input-bordered w-full pl-12"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Delivery Fee Per Kilometer
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/70">
                  Rs.
                </span>
                <input
                  type="number"
                  name="deliveryFeePerKm"
                  value={settings.deliveryFeePerKm}
                  onChange={handleInputChange}
                  className="input input-bordered w-full pl-12"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-base-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-full bg-primary/10">
              <Palette size={24} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Theme Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Light Theme</span>
              </label>
              <select
                name="lightTheme"
                value={settings.lightTheme}
                onChange={handleInputChange}
                className="select select-bordered w-full"
                required
              >
                {availableThemes.map((theme) => (
                  <option key={`light-${theme}`} value={theme}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Dark Theme</span>
              </label>
              <select
                name="darkTheme"
                value={settings.darkTheme}
                onChange={handleInputChange}
                className="select select-bordered w-full"
                required
              >
                {availableThemes.map((theme) => (
                  <option key={`dark-${theme}`} value={theme}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary gap-2"
            disabled={saving}
          >
            {saving ? (
              <div className="loading loading-spinner loading-sm"></div>
            ) : (
              <Save size={20} />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
