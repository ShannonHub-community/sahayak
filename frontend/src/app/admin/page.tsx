import DigitalTwinMap from "@/components/digital_twin/DigitalTwinMap";

export default function AdminDashboard() {
    return (
        <main className="flex h-screen w-full bg-gray-900">
            {/* Left Side: Digital Twin Map (70% width) */}
            <div className="w-[70%] h-full relative">
                <DigitalTwinMap />
            </div>

            {/* Right Side: Sidebar (Placeholder) */}
            <div className="w-[30%] h-full bg-slate-800 border-l border-slate-700 p-6 flex flex-col justify-center items-center">
                <h2 className="text-white text-xl font-bold">Command Center</h2>
                <p className="text-slate-400 mt-2">AI Decision System loading...</p>
            </div>
        </main>
    );
}