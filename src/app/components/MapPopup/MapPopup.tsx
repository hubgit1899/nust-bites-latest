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

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter([lat, lng]);
        setMarkerPosition([lat, lng]);
        fetchCity(lat, lng, setLocation);
        if (mapInstance) {
          mapInstance.setView([lat, lng], 15);
        }
      },
      (error) => {
        console.error("Failed to fetch current location:", error);
      }
    );
  }, [mapInstance]); // depends on map being ready

  const goToCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMarkerPosition([lat, lng]);
        fetchCity(lat, lng, setLocation);

        if (mapInstance) {
          mapInstance.flyTo([lat, lng], 15, {
            animate: true,
            duration: 1.5,
          });
        }
      },
      (error) => {
        console.error("Failed to get current location:", error);
        alert("Failed to get your location. Please allow location access.");
      }
    );
  };

  return (
    <div className="h-[300px] w-full relative rounded-xl overflow-hidden border border-base-300 mt-4">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }} // <- important
        ref={(mapRef) => {
          if (mapRef) {
            setMapInstance(mapRef);
          }
        }}
        className="z-0" // <- important
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
        className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-md hover:bg-gray-100"
        aria-label="Go to my location"
      >
        {/* Google style center location icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 905.505 905.504"
          className="h-6 w-6 text-primary"
          fill="currentColor"
        >
          <circle cx="452.752" cy="451.994" r="61.001" />
          <path d="M432.752 905.504h40c16.568 0 30-13.432 30-30V824.33c32.977-4.387 65.089-13.137 95.934-26.182 44.646-18.886 84.732-45.908 119.146-80.318 34.411-34.412 61.435-74.498 80.317-119.146 13.046-30.844 21.797-62.957 26.183-95.934h51.174c16.568 0 30-13.432 30-30v-40c0-16.568-13.432-30-30-30H824.33c-4.386-32.976-13.137-65.089-26.183-95.934-18.885-44.646-45.906-84.731-80.317-119.143-34.412-34.412-74.497-61.435-119.146-80.318-30.845-13.046-62.958-21.797-95.934-26.183V30c0-16.569-13.432-30-30-30h-40c-16.568 0-30 13.431-30 30v51.173c-32.976 4.386-65.089 13.137-95.934 26.183-44.645 18.884-84.73 45.906-119.142 80.318-34.412 34.412-61.435 74.497-80.318 119.143-13.046 30.844-21.797 62.958-26.183 95.934H30c-16.568 0-30 13.432-30 30v40c0 16.57 13.432 30 30 30h51.173c4.386 32.977 13.137 65.09 26.183 95.936 18.884 44.646 45.906 84.73 80.318 119.144 34.412 34.413 74.497 61.436 119.144 80.318 30.845 13.045 62.958 21.797 95.934 26.182v51.174c0 16.568 13.432 29.999 30 29.999zM258.386 647.118c-39.929-39.928-66.042-89.98-75.981-144.365h43.348c16.568 0 30-13.432 30-30v-40c0-16.568-13.432-30-30-30h-43.349c9.94-54.384 36.053-104.438 75.981-144.366 39.928-39.929 89.981-66.042 144.366-75.98v43.349c0 16.569 13.432 30 30 30h40c16.568 0 30-13.431 30-30v-43.349c54.385 9.94 104.438 36.053 144.366 75.98 39.928 39.928 66.041 89.982 75.979 144.366H679.75c-16.568 0-30 13.432-30 30v40c0 16.568 13.432 30 30 30h43.348c-9.938 54.385-36.052 104.438-75.979 144.365s-89.981 66.041-144.366 75.981v-43.35c0-16.568-13.432-30-30-30h-40c-16.568 0-30 13.432-30 30v43.35c-54.386-9.94-104.44-36.052-144.367-75.981z" />
        </svg>
      </button>
    </div>
  );
}
