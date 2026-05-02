import { useEffect, useRef } from "react";

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
  }
}

export default function MapplsMap({ 
  center, 
  zoom = 15, 
  onLocationSelect, 
  interactive = true,
  tilt = 0,
  heading = 0
}: MapplsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 20;

    const initMap = () => {
      if (!mapRef.current) return;

      if (!window.mappls || !window.mappls.Map) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initMap, 500);
        } else {
          console.error("Mappls SDK failed to load after multiple retries.");
        }
        return;
      }

      // Prevent double initialization
      if (mapInstance.current) return;

      try {
        // Initialize Mappls Map
        mapInstance.current = new window.mappls.Map(mapRef.current, {
          center: [center.lat, center.lng],
          zoom: zoom,
          tilt: tilt,
          heading: heading,
        });

        mapInstance.current.on('load', () => {
          if (interactive) {
            // Add a simple pin marker
            markerInstance.current = new window.mappls.Marker({
              map: mapInstance.current,
              position: { lat: center.lat, lng: center.lng },
              draggable: true,
            });

            // Update location when marker is dragged
            markerInstance.current.addListener("dragend", () => {
              const position = markerInstance.current.getPosition();
              if (onLocationSelect) {
                onLocationSelect(position.lat, position.lng);
              }
            });

            // Update location when map is clicked
            mapInstance.current.addListener("click", (e: any) => {
              const position = e.lngLat;
              markerInstance.current.setPosition(position);
              if (onLocationSelect) {
                onLocationSelect(position.lat, position.lng);
              }
            });
          } else {
            // Static pin
            new window.mappls.Marker({
              map: mapInstance.current,
              position: { lat: center.lat, lng: center.lng },
            });
          }
        });
      } catch (err) {
        console.error("Error initializing Mappls Map:", err);
      }
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        try {
          if (typeof mapInstance.current.remove === 'function') {
            mapInstance.current.remove();
          }
        } catch (err) {
          console.error("Error removing Mappls map instance:", err);
        }
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-2xl overflow-hidden border-2 border-[#E8DCC8] shadow-inner bg-[#F4E8D8]"
      style={{ minHeight: "300px" }}
    />
  );
}
