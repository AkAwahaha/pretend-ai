import { BatteryFull, Signal, Wifi } from "lucide-react";

export function StatusBar() {
  return (
    <div className="status-bar">
      <span>9:41</span>
      <span className="status-bar__icons">
        <Signal size={14} strokeWidth={2.4} />
        <Wifi size={14} strokeWidth={2.4} />
        <BatteryFull size={16} strokeWidth={2.4} />
      </span>
    </div>
  );
}
