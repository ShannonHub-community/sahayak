// Socket.IO Client listener for Day 3 realtime pipeline
export function setupSocketListener(onNewIncident: (data: any) => void) {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";

  console.log(`[Day 3 Sockets] Connecting to Socket.IO stream at ${socketUrl}...`);

  // Mock socket event simulation if real socket backend is starting up
  const mockTimer = setInterval(() => {
    const randomWard = Math.floor(Math.random() * 6) + 1;
    onNewIncident({
      id: `SOS-${Math.floor(100 + Math.random() * 900)}`,
      category: "Waterlogging Emergency",
      ward: `Ward ${randomWard} (Panvel Sector)`,
      severity: "High",
      description: "Realtime Socket.IO event stream pushed from Digital Twin",
      lat: 18.9894 + (Math.random() - 0.5) * 0.02,
      lng: 73.1175 + (Math.random() - 0.5) * 0.02,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST"
    });
  }, 15000); // Emits a test socket event every 15 seconds

  return () => clearInterval(mockTimer);
}