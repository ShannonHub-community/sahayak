import DigitalTwinMap from "@/components/digital_twin/DigitalTwinMap";
import CommandCenter from "@/components/ai_decision/CommandCenter";

export default function AdminDashboard() {
    return (
        <main className="flex h-screen w-full bg-slate-50">
            {/* Left Side: Digital Twin Map (70% width) */}
            <div className="w-[70%] h-full relative">
                <DigitalTwinMap />
            </div>

            {/* Right Side: AI Command Center */}
            <div className="w-[30%] h-full border-l border-slate-200">
                <CommandCenter />
            </div>
        </main>
    );
}