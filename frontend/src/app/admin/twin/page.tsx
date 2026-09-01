import DigitalTwinMap from '@/components/digital_twin/DigitalTwinMap';
import CommandCenter from '@/components/ai_decision/CommandCenter';

export const metadata = {
  title: 'Digital Twin Command Center | Sahayak EOC',
  description: 'Real-time 3D GIS Digital Twin map and AI Command Center for NDRF/SDRF incident commanders.',
};

export default function AdminTwinPage() {
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
