"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import SearchAndFilterBar from "../manage-menu/SearchAndFilterBar";

// Category Navbar Component
interface Category {
  name: string;
  count: number;
}

interface PublicCategoryNavbarProps {
  categories: Category[];
  accentColor?: string;
  onSelectCategory: (category: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
}

function PublicCategoryNavbar({
  categories,
  accentColor,
  onSelectCategory,
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
}: PublicCategoryNavbarProps) {
  const [activeCategory, setActiveCategory] = useState("");
  const categoryRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const navRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        const container = navRef.current;
        const contentWidth = container.scrollWidth;
        const containerWidth = container.clientWidth;

        if (contentWidth > containerWidth) {
          container.style.justifyContent = "flex-start";
        } else {
          container.style.justifyContent = "center";
        }
      }
    };

    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, [categories]);

  // Add scroll event listener to highlight active category based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Get all category headings
      const categoryHeadings = categories.map((cat) =>
        document.getElementById(`category-${cat.name}`)
      );

      // Find the category heading that's currently in view
      const visibleCategory = categoryHeadings.find((heading) => {
        if (!heading) return false;
        const rect = heading.getBoundingClientRect();
        // Consider the heading visible if its top is between the top of the viewport and halfway down
        return rect.top <= 150 && rect.bottom > 0;
      });

      if (visibleCategory) {
        const categoryName = visibleCategory.id.replace("category-", "");
        if (categoryName !== activeCategory) {
          setActiveCategory(categoryName);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories, activeCategory]);

  // Scroll active category into view when it changes
  useEffect(() => {
    if (activeCategory && categoryRefs.current[activeCategory]) {
      categoryRefs.current[activeCategory]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategory]);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    onSelectCategory(category);

    const categoryHeading = document.getElementById(`category-${category}`);
    if (categoryHeading) {
      setTimeout(() => {
        const yOffset = -120; // Adjust based on your navbar height
        const y =
          categoryHeading.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;

        window.scrollTo({ top: y, behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <div
      className="fixed left-0 right-0 w-full z-40 flex flex-col mb-6"
      style={{
        top: "var(--navbar-height)",
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-60vw + 40%)",
        width: "100vw",
      }}
    >
      {/* Navigation bar */}
      <nav className="py-0.5 bg-base-200/70 backdrop-blur-md w-full">
        <ul
          ref={navRef}
          className="flex whitespace-nowrap gap-4 overflow-x-auto scroll-smooth hide-scrollbar px-4 md:px-8 lg:px-16"
        >
          {categories.map((category) => (
            <li key={category.name}>
              <button
                ref={(el) => {
                  if (el) categoryRefs.current[category.name] = el;
                }}
                className={`px-3  rounded-md text-md font-semibold transition-all duration-200 ease-in-out
                ${activeCategory === category.name ? "text-white" : "text-gray-400"} 
                cursor-pointer hover:scale-105`}
                style={{
                  backgroundColor:
                    activeCategory === category.name
                      ? accentColor || "#000"
                      : "transparent",
                }}
                onClick={() => handleCategoryClick(category.name)}
              >
                {category.name.toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Search and Filter Component below navbar on right side */}
      <div className="flex justify-end mt-2 pr-2">
        <SearchAndFilterBar
          accentColor={accentColor}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortOption={sortOption}
          setSortOption={setSortOption}
        />
      </div>
    </div>
  );
}

export default PublicCategoryNavbar;
