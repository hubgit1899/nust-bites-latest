"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  GraduationCap,
  Home,
  Edit2,
  Save,
  X,
  Package,
} from "lucide-react";
import Link from "next/link";

interface UserProfile {
  username: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  isUniStudent?: boolean;
  university?: string;
  studentId?: string;
  isHostelite?: boolean;
  hostelName?: string;
  roomNumber?: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    username: "",
    email: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/user/profile");
          const data = await response.json();

          if (data.success) {
            setProfile(data.user);
          } else {
            toast.error(data.message || "Failed to fetch profile");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          toast.error("Failed to fetch profile data");
        } finally {
          setIsFetching(false);
        }
      }
    };

    fetchProfile();
  }, [session]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Profile updated successfully");
        setProfile(data.user); // Update local state with the response data
        setIsEditing(false);
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--navbar-height)-var(--footer-height,4rem))]">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="bg-base-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Profile</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-ghost gap-2"
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2 lg:gap-4">
              <button
                onClick={() => setIsEditing(false)}
                className="btn btn-soft btn-error gap-2 btn-sm lg:btn-md"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn btn-primary gap-2 btn-sm lg:btn-md"
              >
                {isLoading ? (
                  <div className="loading loading-spinner loading-sm"></div>
                ) : (
                  <Save size={18} />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="bg-base-300 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <User size={16} />
                    Username
                  </span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={profile.username}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <Mail size={16} />
                    Email
                  </span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <User size={16} />
                    Full Name
                  </span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={profile.fullName || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <Phone size={16} />
                    Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={profile.phoneNumber || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="input input-bordered w-full"
                />
              </div>
            </div>
          </div>

          {/* University Information */}
          <div className="bg-base-300 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">
              University Information
            </h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    name="isUniStudent"
                    checked={profile.isUniStudent || false}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="checkbox"
                  />
                  <span className="label-text flex items-center gap-2">
                    <GraduationCap size={16} />
                    Are you a university student?
                  </span>
                </label>
              </div>

              {profile.isUniStudent && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <Building2 size={16} />
                        University
                      </span>
                    </label>
                    <input
                      type="text"
                      name="university"
                      value={profile.university || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <User size={16} />
                        Student ID
                      </span>
                    </label>
                    <input
                      type="text"
                      name="studentId"
                      value={profile.studentId || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hostel Information */}
          <div className="bg-base-300 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Hostel Information</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    name="isHostelite"
                    checked={profile.isHostelite || false}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="checkbox"
                  />
                  <span className="label-text flex items-center gap-2">
                    <Home size={16} />
                    Are you a hostelite?
                  </span>
                </label>
              </div>

              {profile.isHostelite && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <Building2 size={16} />
                        Hostel Name
                      </span>
                    </label>
                    <input
                      type="text"
                      name="hostelName"
                      value={profile.hostelName || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <MapPin size={16} />
                        Room Number
                      </span>
                    </label>
                    <input
                      type="text"
                      name="roomNumber"
                      value={profile.roomNumber || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Quick Links */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/profile/my-orders"
            className="btn btn-outline w-full justify-start gap-2"
          >
            <Package size={20} />
            My Orders
          </Link>

          <Link
            href="/profile/addresses"
            className="btn btn-outline w-full justify-start gap-2"
          >
            <MapPin size={20} />
            Saved Addresses
          </Link>
        </div>
      </div>
    </div>
  );
}
