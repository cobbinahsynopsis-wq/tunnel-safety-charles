import { PowerBIDashboard } from "@/components/PowerBIDashboard";
import { TunnelBackground } from "@/components/TunnelBackground";

export default function Dashboard() {
  return (
    <div className="relative">
      <TunnelBackground />
      <PowerBIDashboard />
    </div>
  );
}
