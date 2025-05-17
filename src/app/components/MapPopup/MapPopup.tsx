"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { SearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
// CSS file to position the search bar (create this file)
import "leaflet-geosearch/dist/geosearch.css"; // Import the default CSS first
import "./map-styles.css"; // Then our overrides
import { toast } from "sonner";
import { Locate } from "lucide-react";

// Fix default marker icons
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function fetchCity(lat: number, lng: number, setLocation: any) {
  fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  )
    .then((res) => res.json())
    .then((data) => {
      const city =
        data.address.city ||
        data.address.subdistrict ||
        data.address.town ||
        data.address.village ||
        data.address.county ||
        "";
      setLocation({ lat, lng, city });
    })
    .catch((err) => {
      console.error("Failed to get city:", err);
      setLocation({ lat, lng, city: "" });
    });
}

function LocationMarker({
  markerPosition,
  setMarkerPosition,
  setLocation,
}: {
  markerPosition: [number, number] | null;
  setMarkerPosition: (pos: [number, number] | null) => void;
  setLocation: (loc: any) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const newPosition: [number, number] = [lat, lng];
      setMarkerPosition(newPosition);
      fetchCity(lat, lng, setLocation);
    },
  });

  useEffect(() => {
    if (markerPosition) {
      map.flyTo(markerPosition, 15, { animate: true, duration: 1.5 });
    }
  }, [markerPosition, map]);

  return markerPosition ? <Marker position={markerPosition} /> : null;
}

export default function MapPopup({
  setLocation,
}: {
  setLocation: (loc: { lat: number; lng: number; city: string }) => void;
}) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    null
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    33.6844, 73.0479,
  ]);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Function to handle getting current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location Error", {
        description: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Update map center and marker
        setMapCenter([lat, lng]);
        setMarkerPosition([lat, lng]);

        // Fetch city information
        fetchCity(lat, lng, setLocation);

        // Update map view if instance exists
        if (mapInstance) {
          mapInstance.setView([lat, lng], 15, {
            animate: true,
            duration: 1.5,
          });
        }

        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Failed to get current location:", error);
        toast.error("Location Error", {
          description:
            "Failed to get your location. Please allow location access and try again.",
        });
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Initialize map with current location
  useEffect(() => {
    getCurrentLocation();
  }, [mapInstance]);

  const goToCurrentLocation = () => {
    getCurrentLocation();
  };

  return (
    <div className="h-[300px] w-full relative rounded-xl overflow-hidden border border-base-300 mt-4">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        ref={(mapRef) => {
          if (mapRef) {
            setMapInstance(mapRef);
          }
        }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <LocationMarker
          markerPosition={markerPosition}
          setMarkerPosition={setMarkerPosition}
          setLocation={setLocation}
        />
      </MapContainer>

      <button
        type="button"
        onClick={goToCurrentLocation}
        className="absolute bottom-4 right-4 bg-base-100 hover:bg-base-200 p-2.5 btn-circle shadow-lg border border-base-300 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        aria-label="Go to my location"
        disabled={isLoadingLocation}
      >
        {isLoadingLocation ? (
          <div className="loading loading-spinner loading-sm text-primary"></div>
        ) : (
          <Locate />
        )}
      </button>
    </div>
  );
}
