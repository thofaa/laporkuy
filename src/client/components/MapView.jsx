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

export default function MapView({ value, onChange }) {
  const mapRef = useRef(null);
  const abortRef = useRef(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
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

  function handleMapClick(event) {
    const { lng, lat } = event.lngLat;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    onChange({ lng, lat, label: "" });
    setPopupOpen(true);
    setLocating(true);
    setNotFound(false);
    setError("");

    reverseGeocode(lng, lat, controller.signal)
      .then((label) => {
        if (!controller.signal.aborted) onChange({ lng, lat, label });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(
          err.message === "not_configured"
            ? "Layanan alamat belum dikonfigurasi."
            : "Gagal mengambil alamat dari titik ini.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLocating(false);
      });
  }

  async function handleSearch(event) {
    event?.preventDefault?.();
    const q = query.trim();
    if (!q || searching) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSearching(true);
    setNotFound(false);
    setError("");

    try {
      const res = await fetch(
        `${NOMINATIM_PATH}/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=1&countrycodes=id&accept-language=id`,
        { signal: controller.signal },
      );
      if (res.status === 503) throw new Error("not_configured");
      if (!res.ok) throw new Error("search_failed");
      const json = await res.json();
      const hit = Array.isArray(json) ? json[0] : null;
      if (!hit) {
        setNotFound(true);
        return;
      }
      const point = {
        lng: Number(hit.lon),
        lat: Number(hit.lat),
        label: hit.display_name ?? "",
      };
      onChange(point);
      setPopupOpen(true);
      mapRef.current?.flyTo({ center: [point.lng, point.lat], zoom: 16 });
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(
        err.message === "not_configured"
          ? "Layanan alamat belum dikonfigurasi."
          : "Gagal mencari lokasi. Coba lagi.",
      );
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }

  const status = notFound
    ? "Lokasi tidak ditemukan."
    : error || (locating ? "Mengambil alamat..." : "");

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
        <GeolocateControl position="bottom-right" trackUserLocation />
      </Map>

      <div className="report-map__search">
        <div className="report-map__form">
          <input
            className="report-input report-map__input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearch(event);
            }}
            placeholder="Cari lokasi, mis. Jl. Ijen, Malang"
            aria-label="Cari lokasi"
          />
          <button
            className="btn btn--primary"
            type="button"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
          >
            {searching ? "Mencari..." : "Cari"}
          </button>
        </div>
        {status && (
          <p className="report-map__status" role="status" aria-live="polite">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
