"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Search, UtensilsCrossed, Star, Clock, Navigation } from "lucide-react";
import { MenuItem } from "@/models/MenuItem";
import { Restaurant } from "@/models/Restaurant";
import PageLoading from "@/app/components/loading/PageLoading";
import PublicCategoryNavbar from "@/app/components/menu/public-menu/PublicCategoryNavbar";
import PublicMenuItemCard from "@/app/components/menu/public-menu/PublicMenuItemCard";
import hexToRGBA from "@/lib/hexToRGBA";
import axios from "axios";
import { toast } from "sonner";
import { formatTime } from "@/helpers/localTime";

export default function RestaurantMenu() {
  const params = useParams();
  const id = params.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<
    { name: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [groupedItems, setGroupedItems] = useState<Record<string, MenuItem[]>>(
    {}
  );

  useEffect(() => {
    if (!id) return;

    const fetchRestaurantMenu = async () => {
      try {
        const res = await axios.get(`/api/restaurant/${id}/menu`);

        const data = res.data;

        if (data.success) {
          if (data.message) {
            toast.success(data.message);
            setMessage(data.message);
          }

          setRestaurant(data.restaurant);

          const availableItems = data.restaurant.menu || [];
          setMenuItems(availableItems);
          setFilteredItems(availableItems);

          const categoryCounts = availableItems.reduce(
            (acc: { [key: string]: number }, item: MenuItem) => {
              acc[item.category] = (acc[item.category] || 0) + 1;
              return acc;
            },
            {}
          );

          const categoryList = Object.entries(categoryCounts).map(
            ([name, count]) => ({ name, count: Number(count) })
          );

          setCategories(categoryList);
          groupItemsByCategory(availableItems);
        } else {
          toast.error(data.message || "Failed to fetch restaurant menu");
          setError(data.message || "Failed to fetch restaurant menu");
        }
      } catch (err: any) {
        console.error("Menu fetch error:", err);
        toast.error(
          err?.response?.data?.message || "Error fetching restaurant menu"
        );
        setError("Something went wrong while fetching restaurant menu.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantMenu();
  }, [id]);

  // Group items by category
  const groupItemsByCategory = (items: MenuItem[]) => {
    const grouped = items.reduce((acc: Record<string, MenuItem[]>, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
    setGroupedItems(grouped);
  };

  // Filter items based on search and sort
  useEffect(() => {
    let result = [...menuItems];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sort
    if (sortOption !== "default") {
      result = sortItems(result, sortOption);
    }

    setFilteredItems(result);
    // Always group by category for filtered results
    groupItemsByCategory(result);
  }, [menuItems, searchTerm, sortOption]);

  const sortItems = (items: MenuItem[], option: string) => {
    const sorted = [...items];

    switch (option) {
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "price-asc":
        return sorted.sort((a, b) => a.basePrice - b.basePrice);
      case "price-desc":
        return sorted.sort((a, b) => b.basePrice - a.basePrice);
      default:
        return sorted;
    }
  };

  const handleCategorySelect = (category: string) => {
    // We're not using activeFilter for filtering anymore,
    // but keeping it for state consistency
    setActiveFilter(category);

    // Find the category heading and scroll to it
    const categoryHeading = document.getElementById(`category-${category}`);
    if (categoryHeading) {
      categoryHeading.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  if (error) return <div className="alert alert-error">{error}</div>;

  // Render category group
  const renderCategoryGroup = (categoryName: string, items: MenuItem[]) => (
    <div key={categoryName} className="mb-8">
      <h2
        id={`category-${categoryName}`}
        className="text-2xl font-extrabold mb-5 border-b-4 pb-1 inline-block"
        style={{ borderColor: restaurant?.accentColor }}
      >
        {categoryName.toUpperCase()}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] sm:gap-4 gap-2">
        {items.map((item) => (
          <PublicMenuItemCard
            key={String(item._id)}
            item={item}
            accentColor={restaurant?.accentColor!}
            restaurant={restaurant!}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-grow min-h-[calc(100vh-var(--navbar-height)-var(--footer-height,4rem))]">
      {loading ? (
        <PageLoading />
      ) : (
        <>
          {/* Category Navigation Bar with integrated search and filter */}
          {categories.length > 0 && (
            <PublicCategoryNavbar
              categories={categories}
              accentColor={restaurant?.accentColor}
              onSelectCategory={handleCategorySelect}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortOption={sortOption}
              setSortOption={setSortOption}
            />
          )}
          {/* Restaurant Header */}
          <div
            className="w-full h-20 flex justify-center items-center mt-4 p-1 rounded-md "
            style={{
              backgroundColor: restaurant?.accentColor,
              height: "5rem",
              backgroundImage: "none",
              marginBottom: "1rem",
            }}
          >
            <img
              src={restaurant?.logoImageURL}
              alt={restaurant?.name}
              className="h-full w-auto max-w-full object-contain"
            />
          </div>

          <div className="flex items-center justify-between mb-3">
            {/* Left: Icon and Title */}
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UtensilsCrossed
                size={24}
                style={{ color: restaurant?.accentColor }}
              />
              <span>Menu</span>
              <span className="font-normal text-base-content/70">
                {restaurant?.name || ""}
              </span>
            </h1>

            {/* Right: Badge */}
            {restaurant?.online ? (
              <div className="badge badge-soft badge-success">Open Now</div>
            ) : (
              <div className="badge badge-soft badge-error">
                Currently Closed
              </div>
            )}
          </div>

          {/* Restaurant Info Section */}
          <div className="bg-base-300 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Distance */}
              <div className="flex items-center gap-2 md:justify-center">
                <Navigation size={16} stroke={restaurant?.accentColor} />
                <span className="text-sm">
                  <strong>Distance:</strong>{" "}
                  <span className="text-base-content/70">TBD</span>
                </span>
              </div>

              {/* Operating Hours */}
              <div className="flex items-center gap-2 md:justify-center">
                <Clock size={16} stroke={restaurant?.accentColor} />
                <span className="text-sm">
                  <strong>Hours:</strong>{" "}
                  <span className="text-base-content/70">
                    {`${formatTime(restaurant?.onlineTime?.start || 0)} - ${formatTime(restaurant?.onlineTime?.end || 0)}`}
                  </span>
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 md:justify-center">
                <Star size={16} stroke={restaurant?.accentColor} />
                <span className="text-sm">
                  <strong>Rating:</strong>{" "}
                  <span className="text-base-content/70">
                    {restaurant?.rating || "N/A"}
                  </span>
                  {restaurant?.ratingCount && restaurant.ratingCount > 0 && (
                    <span className="ml-1 text-base-content/50">
                      ({restaurant.ratingCount})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items Display */}
          {menuItems.length === 0 ? (
            <div
              className="text-center p-8 bg-base-200 rounded-lg border border-base-200"
              style={{
                backgroundColor: hexToRGBA(restaurant?.accentColor!, 0.15),
              }}
            >
              <div className="flex flex-col items-center gap-4">
                <UtensilsCrossed size={48} className="opacity-30" />
                <p className="text-lg">No menu items available.</p>
                <p className="text-sm opacity-70 mt-2">{message}</p>{" "}
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div
              className="text-center p-8 bg-base-200 rounded-lg border border-base-200"
              style={{
                backgroundColor: hexToRGBA(restaurant?.accentColor!, 0.15),
              }}
            >
              <div className="flex flex-col items-center gap-4">
                <Search size={48} className="opacity-30" />
                <p className="text-lg">No items match your search.</p>
                <button
                  className="btn btn-ghost mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveFilter("");
                    setSortOption("default");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            // Always display items grouped by category with headings
            Object.entries(groupedItems).map(([category, items]) => {
              return renderCategoryGroup(category, items);
            })
          )}
        </>
      )}
    </div>
  );
}
