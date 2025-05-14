"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MenuItem } from "@/models/MenuItem";
import { Restaurant } from "@/models/Restaurant";
import {
  Plus,
  Settings2,
  ShoppingBag,
  CheckCircle,
  Tags as Category,
  UtensilsCrossed,
  Search,
  Wifi,
} from "lucide-react";
import PageLoading from "@/app/components/loading/PageLoading";
import { AddMenuItemModal } from "@/app/components/menu/manage-menu/AddMenuItemModal";
import hexToRGBA from "@/lib/hexToRGBA";
import CategoryNavbar from "@/app/components/menu/manage-menu/CategoryNavbar";
import MenuItemCard from "@/app/components/menu/manage-menu/MenuItemCard";

// Main Component
export default function ManageMenu() {
  const params = useParams();
  const id = params.id as string;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<
    { name: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [groupedItems, setGroupedItems] = useState<Record<string, MenuItem[]>>(
    {}
  );

  // Stats
  const [totalMenuItems, setTotalMenuItems] = useState(0);
  const [availableItems, setAvailableItems] = useState(0);
  const [onlineItems, setOnlineItems] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);

  // Calculate stats based on menu items
  const calculateStats = (items: MenuItem[]) => {
    const total = items.length;
    const available = items.filter((item) => item.available).length;
    const online = items.filter((item) => item.available && item.online).length;
    const uniqueCategories = new Set(items.map((item) => item.category)).size;

    setTotalMenuItems(total);
    setAvailableItems(available);
    setOnlineItems(online);
    setTotalCategories(uniqueCategories);
  };

  useEffect(() => {
    if (!id) return;

    const fetchMenuItems = async () => {
      try {
        const res = await fetch(`/api/my-restaurants/${id}/manage-menu`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (data.success) {
          setMenuItems(data.menuItems);
          setFilteredItems(data.menuItems);
          setRestaurant(data.restaurant);

          if (data.restaurant?.updatedAt) {
            setLastUpdated(new Date(data.restaurant.updatedAt));
          }

          // Calculate stats on initial load
          calculateStats(data.menuItems);

          // Extract unique categories
          const categoryCounts = data.menuItems.reduce(
            (acc: { [key: string]: number }, item: MenuItem) => {
              acc[item.category] = (acc[item.category] || 0) + 1;
              return acc;
            },
            {}
          );

          const categoryList = Object.entries(categoryCounts).map(
            ([name, count]) => ({
              name,
              count: Number(count),
            })
          );

          setCategories(categoryList);

          // Group items by category initially
          groupItemsByCategory(data.menuItems);
        } else {
          setError(data.message || "Failed to fetch menu items");
        }
      } catch (err) {
        setError("Something went wrong while fetching menu items.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
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

  const handleMenuItemAdded = (newMenuItem: MenuItem) => {
    // Add the new menu item to the list
    const updatedMenuItems = [...menuItems, newMenuItem];
    setMenuItems(updatedMenuItems);

    // Update categories if needed
    const categoryExists = categories.find(
      (cat) => cat.name === newMenuItem.category
    );
    if (categoryExists) {
      setCategories(
        categories.map((cat) =>
          cat.name === newMenuItem.category
            ? { ...cat, count: cat.count + 1 }
            : cat
        )
      );
    } else {
      setCategories([...categories, { name: newMenuItem.category, count: 1 }]);
    }

    // Update grouped items
    const newGroupedItems = { ...groupedItems };
    if (!newGroupedItems[newMenuItem.category]) {
      newGroupedItems[newMenuItem.category] = [];
    }
    newGroupedItems[newMenuItem.category].push(newMenuItem);
    setGroupedItems(newGroupedItems);

    // Update last updated timestamp
    const now = new Date();
    setLastUpdated(now);

    // Recalculate stats with the updated menu items
    calculateStats(updatedMenuItems);

    // Show success toast
    toast.success("Menu item added successfully!");
  };

  const handleMenuItemUpdated = (updatedMenuItem: MenuItem) => {
    // Check if there are actual changes by comparing with the original item
    const originalItem = menuItems.find(
      (item) => item._id === updatedMenuItem._id
    );
    if (!originalItem) return;

    // Update the menu items array
    const updatedMenuItems = menuItems.map((item) =>
      item._id === updatedMenuItem._id ? updatedMenuItem : item
    );
    setMenuItems(updatedMenuItems);
    setFilteredItems(updatedMenuItems);

    // Update categories based on the new menu items
    const categoryCounts = updatedMenuItems.reduce(
      (acc: { [key: string]: number }, item: MenuItem) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      {}
    );

    const categoryList = Object.entries(categoryCounts).map(
      ([name, count]) => ({
        name,
        count: Number(count),
      })
    );

    setCategories(categoryList);

    // Update grouped items
    const newGroupedItems = updatedMenuItems.reduce(
      (acc: Record<string, MenuItem[]>, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      },
      {}
    );
    setGroupedItems(newGroupedItems);

    // Update last updated timestamp
    const now = new Date();
    setLastUpdated(now);

    // Recalculate stats with the updated menu items
    calculateStats(updatedMenuItems);

    // Show success toast only if there are actual changes
    if (JSON.stringify(originalItem) !== JSON.stringify(updatedMenuItem)) {
      toast.success("Menu item updated successfully!");
    }
  };

  const handleMenuItemDeleted = (deletedItem: MenuItem) => {
    // Remove the deleted item from menuItems
    const updatedMenuItems = menuItems.filter(
      (item) => item._id !== deletedItem._id
    );
    setMenuItems(updatedMenuItems);
    setFilteredItems(updatedMenuItems);

    // Update categories
    const categoryCounts = updatedMenuItems.reduce(
      (acc: { [key: string]: number }, item: MenuItem) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      {}
    );

    // Convert to array and filter out categories with 0 items
    const categoryList = Object.entries(categoryCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        count: Number(count),
      }));

    setCategories(categoryList);

    // Update grouped items
    const newGroupedItems = updatedMenuItems.reduce(
      (acc: Record<string, MenuItem[]>, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      },
      {}
    );
    setGroupedItems(newGroupedItems);

    // Update last updated timestamp
    const now = new Date();
    setLastUpdated(now);

    // Recalculate stats with the updated menu items
    calculateStats(updatedMenuItems);

    // If we were viewing the deleted item's category and it's now empty,
    // reset the active filter
    if (
      activeFilter === deletedItem.category &&
      categoryCounts[deletedItem.category] === 0
    ) {
      setActiveFilter("");
    }
  };

  const openAddMenuItemModal = () => {
    const modal = document.getElementById(
      "add_menu_item_modal"
    ) as HTMLDialogElement;
    if (modal) modal.showModal();
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

  // Calculate percentages for stats
  const availablePercentage =
    totalMenuItems > 0
      ? Math.round((availableItems / totalMenuItems) * 100)
      : 0;

  const onlinePercentage =
    availableItems > 0 ? Math.round((onlineItems / availableItems) * 100) : 0;

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
          <MenuItemCard
            key={String(item._id)}
            item={item}
            accentColor={restaurant?.accentColor!}
            categories={categories}
            onUpdate={handleMenuItemUpdated}
            onDelete={handleMenuItemDeleted}
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
          {/* Header with restaurant name */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 w-full">
            {/* Left side - Heading */}
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-3 md:mb-0">
              <UtensilsCrossed
                size={24}
                style={{ color: restaurant?.accentColor }}
              />
              <span>Manage Menu</span>
              <span className="font-normal text-base-content/70">
                {restaurant?.name || ""}
              </span>
            </h1>

            {/* Right side - Buttons */}

            {menuItems.length > 0 && (
              <div className="flex gap-2 w-full md:w-auto">
                {/* Add Menu Item Button */}
                <button
                  className="btn btn-sm md:btn-md gap-2 flex-1 md:flex-none"
                  style={{
                    backgroundColor: restaurant?.accentColor,
                    color: "white",
                    borderColor: restaurant?.accentColor,
                  }}
                  onClick={openAddMenuItemModal}
                >
                  <Plus size={16} />
                  Add Menu Item
                </button>

                {/* Batch Operations Button */}
                <button
                  className="btn btn-sm md:btn-md btn-outline gap-2 flex-1 md:flex-none"
                  style={{
                    color: restaurant?.accentColor,
                    borderColor: restaurant?.accentColor,
                  }}
                >
                  <Settings2 size={16} />
                  Batch Operations
                </button>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className=" bg-base-200/50 rounded-lg shadow-sm p-4 flex flex-col">
              <div className="stat-title flex items-center gap-2 text-sm text-base-content/70">
                <ShoppingBag size={14} />
                Total Menu Items
              </div>
              <div className="stat-value mt-1 text-2xl">{totalMenuItems}</div>
              <div className="stat-desc mt-1 text-xs">
                Updated {lastUpdated.toLocaleDateString()}
              </div>
            </div>

            <div className=" bg-base-200/50 rounded-lg shadow-sm p-4 flex flex-col">
              <div className="stat-title flex items-center gap-2 text-sm text-base-content/70">
                <CheckCircle size={14} />
                Available Items
              </div>
              <div className="stat-value mt-1 text-2xl">{availableItems}</div>
              <div className="stat-desc mt-1 text-xs">
                <div className="w-full bg-base-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${availablePercentage}%`,
                      backgroundColor: restaurant?.accentColor,
                    }}
                  ></div>
                </div>
                <span className="font-semibold">{availablePercentage}% </span>
                of total items
              </div>
            </div>

            <div className=" bg-base-200/50 rounded-lg shadow-sm p-4 flex flex-col">
              <div className="stat-title flex items-center gap-2 text-sm text-base-content/70">
                <Wifi size={14} />
                Online Items
              </div>
              <div className="stat-value mt-1 text-2xl">{onlineItems}</div>
              <div className="stat-desc mt-1 text-xs">
                <div className="w-full bg-base-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${onlinePercentage}%`,
                      backgroundColor: restaurant?.accentColor,
                    }}
                  ></div>
                </div>
                <span className="font-semibold">{onlinePercentage}% </span>
                of available items
              </div>
            </div>

            <div className=" bg-base-200/50 rounded-lg shadow-sm p-4 flex flex-col">
              <div className="stat-title flex items-center gap-2 text-sm text-base-content/70">
                <Category size={14} />
                Categories
              </div>
              <div className="stat-value mt-1 text-2xl">{totalCategories}</div>
              <div className="stat-desc mt-1 text-xs">
                Across {totalMenuItems} menu items
              </div>
            </div>
          </div>

          {/* Category Navigation Bar with integrated search and filter */}
          {categories.length > 0 && (
            <CategoryNavbar
              categories={categories}
              accentColor={restaurant?.accentColor}
              onSelectCategory={handleCategorySelect}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortOption={sortOption}
              setSortOption={setSortOption}
            />
          )}

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
                <p className="text-lg">No menu items found.</p>
                <p className="text-sm opacity-70 mt-2">
                  Add your first menu item to get started!
                </p>
                <button
                  className="btn mt-4"
                  style={{
                    backgroundColor: restaurant?.accentColor,
                    color: "white",
                  }}
                  onClick={openAddMenuItemModal}
                >
                  <Plus size={16} />
                  Add Menu Item
                </button>
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

          {/* Add Menu Item Modal */}
          <AddMenuItemModal
            restaurantId={id}
            categories={categories}
            accentColor={restaurant!.accentColor}
            onSuccess={handleMenuItemAdded}
          />
        </>
      )}
    </div>
  );
}
