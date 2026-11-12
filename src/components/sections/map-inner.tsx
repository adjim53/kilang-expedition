"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import {
  AIRPORT_LINK,
  DRIVE_ROUTE,
  LOCATIONS,
  TRAIL_APPROACH,
  googleMapsLink,
  type MapLocation,
} from "@/data/locations";

const PIN: Record<MapLocation["kind"], { color: string; glyph: string; size: number }> = {
  venue: { color: "#F59E0B", glyph: "★", size: 34 },
  peak: { color: "#B4532A", glyph: "▲", size: 38 },
  airport: { color: "#134E4A", glyph: "✈", size: 34 },
  town: { color: "#134E4A", glyph: "●", size: 26 },
};

function icon(kind: MapLocation["kind"]) {
  const { color, glyph, size } = PIN[kind];
  return L.divIcon({
    className: "kil-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<span style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:999px;background:${color};color:#fff;font-size:${Math.round(size * 0.45)}px;border:3px solid #fff;box-shadow:0 4px 12px rgba(10,43,41,.45);">${glyph}</span>`,
  });
}

const bounds = L.latLngBounds(LOCATIONS.map((l) => l.position)).pad(0.12);

export default function MapInner() {
  return (
    <MapContainer bounds={bounds} scrollWheelZoom={false} className="h-full w-full" aria-label="Route map to Kaltungo">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Polyline positions={AIRPORT_LINK} pathOptions={{ color: "#134E4A", weight: 3, dashArray: "4 10", opacity: 0.8 }} />
      <Polyline positions={DRIVE_ROUTE} pathOptions={{ color: "#134E4A", weight: 5, opacity: 0.9 }} />
      <Polyline positions={TRAIL_APPROACH} pathOptions={{ color: "#B4532A", weight: 4, dashArray: "2 9", opacity: 0.95 }} />

      {LOCATIONS.map((l) => (
        <Marker key={l.id} position={l.position} icon={icon(l.kind)} title={l.name}>
          <Popup>
            <strong style={{ color: "#134E4A", fontSize: 15 }}>{l.name}</strong>
            <br />
            <span style={{ color: "#33423f" }}>{l.description}</span>
            {!l.verified && (
              <>
                <br />
                <em style={{ color: "#96411F", fontSize: 12 }}>Approximate pin — confirm with organisers</em>
              </>
            )}
            <br />
            <a href={googleMapsLink(l)} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700 }}>
              Open in Google Maps
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
