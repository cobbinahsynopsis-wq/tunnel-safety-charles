import { useState, useCallback } from "react";
import { useSystems } from "@/context/SystemsContext";
import { User, Shield, ArrowRight } from "lucide-react";

export function EngineerGate({ children }: { children: React.ReactNode }) {
  const { metadata, updateMetadata } = useSystems();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const hasEngineer = metadata.engineerName.trim().length > 0;

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (trimmed.length > 100) {
      setError("Name must be less than 100 characters.");
      return;
    }
    setError("");
    updateMetadata({ engineerName: trimmed });
  }, [name, updateMetadata]);

  if (hasEngineer) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Tunnel Vehicle System — Safety Analysis</h1>
          <p className="text-sm text-muted-foreground">
            ISO 12100 / ISO 13849 Risk Assessment Platform
          </p>
        </div>

        <div className="border border-border rounded-lg bg-card p-6 space-y-4 shadow-lg">
          <div className="space-y-1">
            <label
              htmlFor="engineer-name"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              Engineer Name
            </label>
            <p className="text-[11px] text-muted-foreground">
              Your name will be recorded on all analysis reports for traceability.
            </p>
          </div>

          <input
            id="engineer-name"
            type="text"
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={e => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="Enter your full name"
            maxLength={100}
            autoFocus
            className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          />

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Access Platform
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground">
          All modifications are logged with engineer identification per ISO compliance requirements.
        </p>
      </div>
    </div>
  );
}
