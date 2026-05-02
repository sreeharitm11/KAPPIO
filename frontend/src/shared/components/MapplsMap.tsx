import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

interface MapplsMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  interactive?: boolean;
  tilt?: number;
  heading?: number;
}

declare global {
  interface Window {
    mappls: any;
    mapplsReady: Promise<void>;
    __mapplsReadyCallback: () => void;
  }
}

export default function MapplsMap({
  center,
  zoom = 15,
  onLocationSelect,
  interactive = true,
  tilt = 0,
  heading = 0,
}: MapplsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      try {
        // Wait for the SDK to be ready via the callback promise
        if (window.mapplsReady) {
          await window.mapplsReady;
        } else {
          // Fallback: poll for a max of 10 seconds
          let waited = 0;
          while ((!window.mappls || !window.mappls.Map) && waited < 10000) {
            await new Promise((r) => setTimeout(r, 300));
            waited += 300;
          }
        }

        if (destroyed || !mapRef.current) return;

        if (!window.mappls || !window.mappls.Map) {
          setMapError("Map API failed to load. Check your API key.");
          setMapLoading(false);
          return;
        }

        // Prevent double initialization
        if (mapInstance.current) return;

        mapInstance.current = new window.mappls.Map(mapRef.current, {
          center: [center.lng, center.lat], // Mappls uses [lng, lat]
          zoom,
          tilt,
          heading,
          search: false,
        });

        mapInstance.current.on("load", () => {
          if (destroyed) return;
          setMapLoading(false);

          if (interactive) {
            // Draggable pin marker
            markerInstance.current = new window.mappls.Marker({
              map: mapInstance.current,
              position: { lat: center.lat, lng: center.lng },
              draggable: true,
              fitbounds: false,
            });

            markerInstance.current.on("dragend", () => {
              const pos = markerInstance.current.getPosition();
              if (onLocationSelect) onLocationSelect(pos.lat, pos.lng);
            });

            mapInstance.current.on("click", (e: any) => {
              const { lngLat } = e;
              markerInstance.current.setPosition({ lat: lngLat.lat, lng: lngLat.lng });
              if (onLocationSelect) onLocationSelect(lngLat.lat, lngLat.lng);
            });
          } else {
            // Static pin
            new window.mappls.Marker({
              map: mapInstance.current,
              position: { lat: center.lat, lng: center.lng },
              fitbounds: false,
            });
          }
        });

        // Error on map load failure
        mapInstance.current.on("error", () => {
          if (!destroyed) setMapError("Map rendering error. Check API key permissions.");
          setMapLoading(false);
        });
      } catch (err) {
        console.error("MapplsMap init error:", err);
        if (!destroyed) {
          setMapError("Map initialization failed.");
          setMapLoading(false);
        }
      }
    };

    void init();

    return () => {
      destroyed = true;
      if (mapInstance.current) {
        try {
          if (typeof mapInstance.current.remove === "function") {
            mapInstance.current.remove();
          }
        } catch (_) {
          // ignore
        }
        mapInstance.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (mapError) {
    return (
      <div className="w-full h-full rounded-2xl border-2 border-red-200 bg-red-50 flex flex-col items-center justify-center gap-2 text-red-600 p-4">
        <MapPin className="w-8 h-8 text-red-400" />
        <p className="text-sm font-medium text-center">{mapError}</p>
        <p className="text-xs text-red-400 text-center">
          Verify Mappls API key at maps.mappls.com
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {mapLoading && (
        <div className="absolute inset-0 z-10 rounded-2xl bg-[#F4E8D8] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-[#D4A574] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#6B5D52]">Loading map…</p>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-full rounded-2xl overflow-hidden"
        style={{ minHeight: "220px" }}
      />
    </div>
  );
}
