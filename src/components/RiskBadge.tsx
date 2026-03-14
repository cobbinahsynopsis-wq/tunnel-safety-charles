import type { RiskLevel } from "@/data/systems";

const styles: Record<RiskLevel, string> = {
  critical: "bg-risk-critical text-primary-foreground",
  high: "bg-risk-high text-primary-foreground",
  medium: "bg-risk-medium text-foreground",
  low: "bg-risk-low text-primary-foreground",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-sm ${styles[level]}`}>
      {level}
    </span>
  );
}
