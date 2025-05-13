"use client";
// SearchAndFilterBar.tsx
// This component provides a collapsible search and filter interface for menu items

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  X,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowDown01,
  ArrowUp01,
  ListFilter,
} from "lucide-react";

interface SearchAndFilterBarProps {
  accentColor?: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
}

const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  accentColor,
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleSearchBar = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setIsFilterOpen(false);
    }
  };

  const toggleFilterDropdown = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleSortOptionSelect = (option: string) => {
    setSortOption(option);
    setIsFilterOpen(false);
  };

  return (
    <div className="flex items-center justify-end pr-2">
      <div className="flex items-center gap-2">
        {/* Search Button to toggle search bar */}
        <button
          className={`btn btn-sm btn-circle ${isExpanded ? "btn-error" : ""}`}
          onClick={toggleSearchBar}
          aria-label={isExpanded ? "Close search" : "Open search"}
          style={
            isExpanded
              ? {}
              : {
                  backgroundColor: accentColor || "#4b5563",
                  color: "white",
                  borderColor: accentColor || "#4b5563",
                }
          }
        >
          {isExpanded ? <X size={16} /> : <Search size={16} />}
        </button>

        {/* Conditionally render the search bar */}
        <div
          className={`transition-all duration-300 overflow-hidden flex items-center gap-2 ${
            isExpanded
              ? "w-64 md:w-96 opacity-100"
              : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search menu items..."
              className="input input-sm w-full pl-9 bg-base-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50"
            />
          </div>

          {/* Filter Button */}
          <button
            ref={filterButtonRef}
            className="btn btn-sm btn-circle"
            onClick={toggleFilterDropdown}
            style={{
              backgroundColor: accentColor || "#4b5563",
              color: "white",
              borderColor: accentColor || "#4b5563",
            }}
          >
            <Filter size={14} />
          </button>

          {/* Custom Dropdown Menu for filtering */}
          {isFilterOpen && (
            <div
              ref={filterRef}
              className="absolute right-6 top-14 z-50 bg-base-100 shadow-lg rounded-xl border border-base-300 w-48 py-2"
            >
              <div className="flex justify-center px-3 py-1 text-sm font-medium text-base-content/70">
                Sort By
              </div>
              <hr />
              <div className="mt-1">
                <button
                  className={`w-full text-left px-4 py-1.5 text-sm hover:bg-base-200 flex items-center gap-2 ${
                    sortOption === "default" ? "font-medium text-primary" : ""
                  }`}
                  onClick={() => handleSortOptionSelect("default")}
                  style={
                    sortOption === "default"
                      ? { color: accentColor || "#4b5563" }
                      : {}
                  }
                >
                  <ListFilter size={20} />
                  Default
                </button>
                <button
                  className={`w-full text-left px-4 py-1.5 text-sm hover:bg-base-200 flex items-center gap-2 ${
                    sortOption === "name-asc" ? "font-medium text-primary" : ""
                  }`}
                  onClick={() => handleSortOptionSelect("name-asc")}
                  style={
                    sortOption === "name-asc"
                      ? { color: accentColor || "#4b5563" }
                      : {}
                  }
                >
                  <ArrowDownAZ size={20} />
                  <span>Name (A-Z)</span>
                </button>
                <button
                  className={`w-full text-left px-4 py-1.5 text-sm hover:bg-base-200 flex items-center gap-2 ${
                    sortOption === "name-desc" ? "font-medium text-primary" : ""
                  }`}
                  onClick={() => handleSortOptionSelect("name-desc")}
                  style={
                    sortOption === "name-desc"
                      ? { color: accentColor || "#4b5563" }
                      : {}
                  }
                >
                  {" "}
                  <ArrowUpAZ size={20} />
                  Name (Z-A)
                </button>
                <button
                  className={`w-full text-left px-4 py-1.5 text-sm hover:bg-base-200 flex items-center gap-2 ${
                    sortOption === "price-asc" ? "font-medium text-primary" : ""
                  }`}
                  onClick={() => handleSortOptionSelect("price-asc")}
                  style={
                    sortOption === "price-asc"
                      ? { color: accentColor || "#4b5563" }
                      : {}
                  }
                >
                  <ArrowDown01 size={20} />
                  Price (Low to High)
                </button>
                <button
                  className={`w-full text-left px-4 py-1.5 text-sm hover:bg-base-200 flex items-center gap-2  ${
                    sortOption === "price-desc"
                      ? "font-medium text-primary"
                      : ""
                  }`}
                  onClick={() => handleSortOptionSelect("price-desc")}
                  style={
                    sortOption === "price-desc"
                      ? { color: accentColor || "#4b5563" }
                      : {}
                  }
                >
                  <ArrowUp01 size={20} />
                  Price (High to Low)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilterBar;
