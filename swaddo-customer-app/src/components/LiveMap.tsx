"use client";

import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    mappls: any;
  }
}

export default function LiveMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const initializeMap = () => {
      if (!window.mappls || !mapContainerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = new window.mappls.Map(mapContainerRef.current, {
          center: [25.5941, 85.1376],
          zoom: 14,
        });
      }
    };

    if (document.getElementById("mappls-script-livemap")) {
      initializeMap();
    } else {
      const script = document.createElement("script");
      script.id = "mappls-script-livemap";
      script.src = `https://apis.mappls.com/advancedmaps/api/${process.env.NEXT_PUBLIC_MAPPLS_API_KEY}/map_sdk?layer=vector&v=3.0`;
      script.async = true;
      script.onload = initializeMap;
      document.body.appendChild(script);
    }

    return () => {
      // Optional cleanup
    };
  }, []);

  return (
    <div className="w-full h-full bg-neutral-950">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
