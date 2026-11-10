import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl/maplibre";
import { addProtocol, removeProtocol, setWorkerUrl } from "maplibre-gl";
import { Protocol } from "pmtiles";
import { layers, namedFlavor } from "@protomaps/basemaps";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs" with { type: "file" };
import "maplibre-gl/dist/maplibre-gl.css";

// Bun meng-inline process.env.TILES_URL saat bundling (bunfig.toml).
const TILES_URL = process.env.TILES_URL ?? "";
const NOMINATIM_PATH = "/api/nominatim";

setWorkerUrl(workerUrl);

const protocol = new Protocol();
let activeMaps = 0;

const MAP_STYLE = {
  version: 8,
  glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
  sprite: "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
  sources: {
    protomaps: {
      type: "vector",
      url: `pmtiles://${TILES_URL}`,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: layers("protomaps", namedFlavor("light"), { lang: "id" }),
};

const INITIAL_VIEW = { longitude: 112.63, latitude: -7.98, zoom: 11 };

async function reverseGeocode(lng, lat, signal) {
  const res = await fetch(
    `${NOMINATIM_PATH}/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=id`,
    { signal },
  );
  if (res.status === 503) throw new Error("not_configured");
  if (!res.ok) throw new Error("reverse_failed");
  const json = await res.json();
  if (json?.error) throw new Error(json.error);
  return json?.display_name ?? "";
}

export function MapPin({ longitude, latitude, zoom = 15 }) {
  const mapRef = useRef(null);

  useLayoutEffect(() => {
    if (activeMaps++ === 0) addProtocol("pmtiles", protocol.tile);
  }, []);

  useEffect(() => {
    return () => {
      const map = mapRef.current?.getMap?.();
      if (map && !map._removed) map.remove();
      if (--activeMaps === 0) removeProtocol("pmtiles");
    };
  }, []);

  return (
    <Map
      ref={mapRef}
      mapStyle={MAP_STYLE}
      initialViewState={{ longitude, latitude, zoom }}
      interactive={false}
      style={{ width: "100%", height: "100%" }}
    >
      <Marker longitude={longitude} latitude={latitude} anchor="bottom">
        <span className="report-map__pin" aria-label="Lokasi laporan" />
      </Marker>
    </Map>
  );
}

export default function MapView({ value, onChange }) {
  const mapRef = useRef(null);
  const abortRef = useRef(null);
  const [locating, setLocating] = useState(false);
  const [popupOpen, setPopupOpen] = useState(true);

  useLayoutEffect(() => {
    if (activeMaps++ === 0) addProtocol("pmtiles", protocol.tile);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      const map = mapRef.current?.getMap?.();
      // react-map-gl juga memanggil map.remove() saat unmount; _removed menjaga agar tidak dobel
      if (map && !map._removed) map.remove();
      if (--activeMaps === 0) removeProtocol("pmtiles");
    };
  }, []);

  function selectPoint(lng, lat) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    onChange({ lng, lat, label: "" });
    setPopupOpen(true);
    setLocating(true);

    reverseGeocode(lng, lat, controller.signal)
      .then((label) => {
        if (!controller.signal.aborted) onChange({ lng, lat, label });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.warn("[reverse-geocode] gagal:", err?.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLocating(false);
      });
  }

  function handleMapClick(event) {
    selectPoint(event.lngLat.lng, event.lngLat.lat);
  }

  // Allow location: ambil koordinat saja (tanpa reverse-geocode alamat).
  function handleGeolocate(event) {
    const { longitude, latitude } = event.coords;
    abortRef.current?.abort();
    onChange({ lng: longitude, lat: latitude, label: "" });
    setPopupOpen(true);
    setLocating(false);
  }

  function handleGeolocateError(event) {
    const err = event?.error ?? event;
    console.warn("[geolocate] gagal:", {
      code: err?.code,
      message: err?.message,
      secureContext: typeof window !== "undefined" ? window.isSecureContext : undefined,
      hasGeolocation: typeof navigator !== "undefined" && !!navigator.geolocation,
    });
  }

  const status = locating ? "Mengambil alamat..." : "";

  return (
    <div className="report-map">
      <Map
        ref={mapRef}
        mapStyle={MAP_STYLE}
        initialViewState={INITIAL_VIEW}
        onClick={handleMapClick}
        style={{ width: "100%", height: "100%" }}
      >
        {value && (
          <Marker longitude={value.lng} latitude={value.lat} anchor="bottom">
            <span className="report-map__pin" aria-label="Titik lokasi terpilih" />
          </Marker>
        )}

        {value && popupOpen && (
          <Popup
            longitude={value.lng}
            latitude={value.lat}
            anchor="top"
            maxWidth="280px"
            closeOnClick={false}
            onClose={() => setPopupOpen(false)}
          >
            <span className="report-map__popup">
              {value.label || (locating ? "Mengambil alamat..." : "Lokasi dipilih")}
            </span>
          </Popup>
        )}

        <NavigationControl position="bottom-right" />
        <GeolocateControl
          position="bottom-right"
          onGeolocate={handleGeolocate}
          onError={handleGeolocateError}
        />
      </Map>

      <div className="report-map__search">
        {status && (
          <p className="report-map__status" role="status" aria-live="polite">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
