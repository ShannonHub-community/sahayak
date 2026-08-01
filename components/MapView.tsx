"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Panvel emergency dummy markers
const dummyIncidents = [
  { id: "SOS-01", lat: 18.9894, lng: 73.1175, title: "Waterlogging at Station Road", severity: "High" },
  { id: "SOS-02", lat: 18.9950, lng: 73.1120, title: "Stranded Citizens near Old Panvel", severity: "Critical" },
  { id: "SOS-03", lat: 18.9820, lng: 73.1250, title: "Submerged Road near Khandeshwar", severity: "Medium" },
  { id: "SOS-04", lat: 18.9910, lng: 73.1050, title: "Medical Emergency - Kalamboli", severity: "High" },
  { id: "SOS-05", lat: 19.0020, lng: 73.1200, title: "Tree Fallen blocking Access Road", severity: "Low" },
  { id: "SOS-06", lat: 18.9750, lng: 73.1310, title: "Shelter Request - Kamothe Ward 4", severity: "Medium" },
];

export default function MapView() {
  const panvelCenter: [number, number] = [18.9894, 73.1175];

  return (
    <div className="w-full h-150 rounded-xl overflow-hidden border border-slate-200 shadow-lg mt-4">
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
              <div className="p-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">
                  {incident.id} • {incident.severity}
                </span>
                <h3 className="font-bold text-sm mt-1">{incident.title}</h3>
                <p className="text-xs text-gray-500">Lat: {incident.lat}, Lng: {incident.lng}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}