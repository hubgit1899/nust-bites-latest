"use client";

import React, { useContext } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, ChevronRight, Star, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { ThemeContext } from "@/app/context/ThemeProvider";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Restaurant } from "@/models/Restaurant";
import PageLoading from "@/app/components/loading/PageLoading";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme } = useContext(ThemeContext);

  // Fetch restaurants for featured section
  const fetcher = async (url: string): Promise<Restaurant[]> => {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch");
    }
    return data.restaurants;
  };

  const { data: restaurants, error } = useSWR("/api/get-restaurants", fetcher, {
    revalidateOnFocus: false,
  });

  return (
    <div 
      className="relative w-full overflow-hidden flex flex-col"
      style={{
        minHeight: "calc(100vh - var(--navbar-height) - var(--footer-height, 4rem))"
      }}
    >
      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center py-12 px-6 text-center">
        <div 
          className="max-w-3xl mx-auto bg-base-200/60 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-primary/30"
          style={{
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
          }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Delicious Food, <span className="text-primary">Delivered Fast</span>
          </h2>
          <p className="text-base md:text-lg mb-8 max-w-2xl mx-auto text-base-content/80">
            Order from your favorite campus restaurants with fast delivery and exclusive deals for NUST students.
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                <Clock className="text-primary" size={20} />
              </div>
              <span className="text-base-content/90 text-sm">Fast Delivery</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                <Star className="text-primary" size={20} />
              </div>
              <span className="text-base-content/90 text-sm">Top Rated</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                <UtensilsCrossed className="text-primary" size={20} />
              </div>
              <span className="text-base-content/90 text-sm">Quality Food</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <button
              onClick={() => document.getElementById("my-drawer")?.click()}
              className="btn btn-primary btn-md md:btn-lg gap-2 px-4 md:px-8 shadow-md text-sm md:text-base"
            >
              Explore Restaurants
              <ChevronRight size={20} className="hidden sm:inline" />
              <ChevronRight size={16} className="sm:hidden" />
            </button>
          </div>
        </div>
      </div>

      {/* Featured Restaurants Section */}
      <div className="relative z-10 py-10 px-6">
        <h3 className="text-2xl font-bold mb-8 text-center">
          <span className="inline-block pb-2 border-b-2 border-primary">Featured Restaurants</span>
        </h3>
        
        {!restaurants ? (
          <div className="flex justify-center min-h-[200px] items-center">
            <PageLoading />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {restaurants.slice(0, 6).map((restaurant) => (
              <Link
                key={String(restaurant._id)}
                href={`/restaurant/menu/${restaurant._id}`}
                className="card bg-base-200 hover:shadow-lg transition-all hover:-translate-y-1 border border-base-300 overflow-hidden"
              >
                <div className="relative">
                  <div 
                    className="h-36 flex justify-center items-center"
                    style={{ backgroundColor: restaurant.accentColor }}
                  >
                    <img
                      src={restaurant.logoImageURL}
                      alt={restaurant.name}
                      className="h-28 max-w-full object-contain p-2"
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="badge badge-sm" style={{ backgroundColor: restaurant.accentColor, color: 'white' }}>
                      {restaurant.online ? "Open Now" : "Closed"}
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <h4 className="card-title text-lg">{restaurant.name}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="inline-grid *:[grid-area:1/1]">
                      <div
                        className={`status status-xs animate-ping ${
                          restaurant.online ? "status-success" : "status-error"
                        }`}
                      ></div>
                      <div
                        className={`status status-xs ${
                          restaurant.online ? "status-success" : "status-error"
                        }`}
                      ></div>
                    </div>
                    <span className="text-xs text-base-content/70">
                      {restaurant.online ? "Currently accepting orders" : "Not accepting orders"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {restaurants && restaurants.length > 6 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => document.getElementById("my-drawer")?.click()}
              className="btn btn-outline btn-primary"
            >
              See All Restaurants
            </button>
          </div>
        )}
      </div>

      {/* How It Works Section */}
      <div className="relative z-10 py-12 px-6 bg-base-200/50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-10 text-center">How It Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <div className="text-primary font-bold text-xl">1</div>
              </div>
              <h4 className="text-lg font-semibold mb-2">Browse Restaurants</h4>
              <p className="text-base-content/70">Explore our selection of restaurants</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <div className="text-primary font-bold text-xl">2</div>
              </div>
              <h4 className="text-lg font-semibold mb-2">Place Your Order</h4>
              <p className="text-base-content/70">Choose your favorite meals and checkout securely</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <div className="text-primary font-bold text-xl">3</div>
              </div>
              <h4 className="text-lg font-semibold mb-2">Enjoy Your Food</h4>
              <p className="text-base-content/70">Our riders deliver your order right to your location</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
