"use client";

import dynamic from "next/dynamic";
import WorkforceTab from "../components/WorkforceTab";

const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
});

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", background: "#F5F6F8", fontFamily: "system-ui, sans-serif" }}>
      <header style={{
        background: "#1F3A5F",
        color: "white",
        padding: "20px 32px",
      }}>
        <h1 style={{ fontSize: "22px", fontWeight: 600, margin: 0 }}>
          Sahayak — Government Portal
        </h1>
        <p style={{ fontSize: "13px", color: "#B8C4D6", margin: "4px 0 0" }}>
          Panvel Sub-Division, Disaster Management
        </p>
      </header>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>

        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}>
          {[
            { label: "Active Incidents", value: "6", color: "#B91C1C" },
            { label: "Personnel Deployed", value: "18", color: "#1F3A5F" },
            { label: "Relief Camps Open", value: "4", color: "#2E7D32" },
            { label: "Flood Risk", value: "Level 3", color: "#D97706" },
            { label: "Medical Teams", value: "5", color: "#1565C0" },
            { label: "Comms Network", value: "99.4%", color: "#2E7D32" },
          ].map((stat, idx) => (
            <div key={idx} style={{
              background: "white",
              borderRadius: "10px",
              padding: "14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500, textTransform: "uppercase" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: stat.color, marginTop: "4px" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </section>

        <section style={{
          background: "white",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 12px", color: "#1F3A5F" }}>
            Live Incident Map
          </h2>
          <MapView />
        </section>

        <section style={{
          background: "white",
          borderRadius: "10px",
          padding: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}>
          <WorkforceTab />
        </section>

      </div>
    </main>
  );
}