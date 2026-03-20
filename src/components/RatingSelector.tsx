import { useState, useCallback, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface RatingScale {
  value: number;
  label: string;
  description: string;
}

const SEVERITY_SCALE: RatingScale[] = [
  { value: 1, label: "None", description: "No effect on system or operator safety" },
  { value: 2, label: "Very Minor", description: "Slight inconvenience, no safety impact" },
  { value: 3, label: "Minor", description: "Minor performance degradation, operator aware" },
  { value: 4, label: "Very Low", description: "Reduced performance, operator slightly affected" },
  { value: 5, label: "Low", description: "Reduced function, operator uncomfortable" },
  { value: 6, label: "Moderate", description: "System inoperable but safe, operator dissatisfied" },
  { value: 7, label: "High", description: "System performance severely affected" },
  { value: 8, label: "Very High", description: "System inoperable, safety risk present" },
  { value: 9, label: "Hazardous with Warning", description: "Potential safety hazard with prior warning" },
  { value: 10, label: "Hazardous without Warning", description: "Safety hazard without warning, regulatory non-compliance" },
];

const OCCURRENCE_SCALE: RatingScale[] = [
  { value: 1, label: "Almost Impossible", description: "Failure unlikely: < 1 in 1,000,000" },
  { value: 2, label: "Remote", description: "Very few failures: 1 in 500,000" },
  { value: 3, label: "Very Low", description: "Isolated failures: 1 in 100,000" },
  { value: 4, label: "Low", description: "Relatively few failures: 1 in 10,000" },
  { value: 5, label: "Moderate Low", description: "Occasional failures: 1 in 2,000" },
  { value: 6, label: "Moderate", description: "Medium frequency: 1 in 500" },
  { value: 7, label: "Moderate High", description: "Frequent failures: 1 in 100" },
  { value: 8, label: "High", description: "Repeated failures: 1 in 50" },
  { value: 9, label: "Very High", description: "Almost certain: 1 in 10" },
  { value: 10, label: "Certain", description: "Failure is inevitable: > 1 in 5" },
];

const DETECTION_SCALE: RatingScale[] = [
  { value: 1, label: "Almost Certain", description: "Defect will be caught by automated controls" },
  { value: 2, label: "Very High", description: "Very high chance of detection via multiple methods" },
  { value: 3, label: "High", description: "High chance of detection through testing" },
  { value: 4, label: "Moderately High", description: "Good chance of detection via inspection" },
  { value: 5, label: "Moderate", description: "Moderate detection through standard checks" },
  { value: 6, label: "Low", description: "Low detection, manual inspection only" },
  { value: 7, label: "Very Low", description: "Very low detection capability" },
  { value: 8, label: "Remote", description: "Unlikely to be detected before failure" },
  { value: 9, label: "Very Remote", description: "Almost no detection mechanism available" },
  { value: 10, label: "Undetectable", description: "No known detection method exists" },
];

const SCALES: Record<string, { title: string; items: RatingScale[]; color: string }> = {
  severity: { title: "Severity (S)", items: SEVERITY_SCALE, color: "hsl(var(--risk-critical))" },
  occurrence: { title: "Occurrence (O)", items: OCCURRENCE_SCALE, color: "hsl(var(--risk-high))" },
  detection: { title: "Detection (D)", items: DETECTION_SCALE, color: "hsl(var(--primary))" },
};

interface RatingSelectorProps {
  type: "severity" | "occurrence" | "detection";
  value: number;
  onSelect: (value: number) => void;
}

export function RatingSelector({ type, value, onSelect }: RatingSelectorProps) {
  const [open, setOpen] = useState(false);
  const scale = SCALES[type];

  const handleSelect = useCallback((rating: number) => {
    onSelect(rating);
    setOpen(false);
  }, [onSelect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="font-mono text-xs px-1.5 py-0.5 rounded-sm border border-transparent hover:border-primary/40 hover:bg-primary/10 transition-colors cursor-pointer min-w-[28px] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${scale.title}: ${value}. Click to change.`}
        >
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 max-h-[360px] overflow-y-auto"
        align="start"
        side="bottom"
      >
        <div className="px-3 py-2 border-b bg-muted/50 sticky top-0 z-10">
          <p className="text-xs font-semibold">{scale.title} — Rating Scale</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Select a value from 1 (lowest) to 10 (highest)</p>
        </div>
        <div className="p-1">
          {scale.items.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleSelect(item.value)}
              className={`w-full flex items-start gap-2 px-2 py-1.5 rounded-sm text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                item.value === value ? "bg-primary/15 border-l-2 border-primary" : ""
              }`}
            >
              <span className="font-mono font-bold text-xs min-w-[20px] text-center mt-0.5 shrink-0">
                {item.value}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-tight">{item.label}</p>
                <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
