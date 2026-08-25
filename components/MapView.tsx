// @ts-nocheck
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dummyIncidents = [
  { id: "INC-101", lat: 18.9894, lng: 73.1175, title: "Waterlogging at Station Road", severity: "High", ward: "Ward 3" },
  { id: "INC-102", lat: 18.9950, lng: 73.1120, title: "Stranded Citizens near Old Panvel", severity: "Critical", ward: "Ward 1" },
  { id: "INC-103", lat: 18.9820, lng: 73.1250, title: "Submerged Road near Khandeshwar", severity: "Medium", ward: "Ward 5" },
  { id: "INC-104", lat: 18.9910, lng: 73.1050, title: "Medical Emergency - Kalamboli", severity: "High", ward: "Ward 4" },
  { id: "INC-105", lat: 19.0020, lng: 73.1200, title: "Tree Fallen blocking Access Road", severity: "Low", ward: "Ward 2" },
  { id: "INC-106", lat: 18.9750, lng: 73.1310, title: "Shelter Request - Kamothe Ward 4", severity: "Medium", ward: "Ward 6" },
];

export default function MapView() {
  const panvelCenter: [number, number] = [18.9894, 73.1175];

  return (
    <div className="w-full h-140 relative rounded overflow-hidden">
      <MapContainer
        center={panvelCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {dummyIncidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.lat, incident.lng]}
            icon={defaultIcon}
          >
            <Popup>
              <div className="p-2 min-w-45 text-slate-900 font-sans">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300">
                    {incident.id}
                  </span>
                  <span className="text-[10px] text-slate-600 font-semibold">{incident.ward}</span>
                </div>
                <h3 className="font-bold text-xs text-slate-900 mt-1 leading-snug">{incident.title}</h3>
                <div className="mt-2 pt-1 border-t border-slate-200 flex items-center justify-between text-[10px]">
                  <span className="text-slate-600">Priority: <strong className="text-[#B91C1C]">{incident.severity}</strong></span>
                  <span className="text-[#1565C0] font-bold hover:underline cursor-pointer">Incident Details</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}