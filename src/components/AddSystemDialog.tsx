import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSystems } from "@/context/SystemsContext";
import type { SystemData } from "@/data/systems";
import { Plus } from "lucide-react";

const ICON_OPTIONS = ["Disc3", "TriangleAlert", "Navigation", "Flame", "Zap"];

export function AddSystemDialog() {
  const { addSystem } = useSystems();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Zap");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const systemId = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const newSystem: SystemData = {
      id: `custom-${systemId}-${Date.now()}`,
      name: name.trim(),
      nameFr: nameFr.trim() || name.trim(),
      icon,
      topEvent: `${name.trim()} - Top Event`,
      description: description.trim() || `Analysis for ${name.trim()} subsystem`,
      faultTree: {
        id: `ft-${systemId}-root`,
        label: `${name.trim()} Failure`,
        type: "top",
        children: [],
      },
      fmea: [],
      risks: [],
      safetyFunctions: [],
      consequences: [],
      safetyMeasures: [],
    };

    addSystem(newSystem);
    setOpen(false);
    setName("");
    setNameFr("");
    setDescription("");
    setIcon("Zap");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary hover:bg-primary/10 rounded transition-colors border border-dashed border-primary/30">
          <Plus className="h-3.5 w-3.5" />
          Add Subsystem
        </button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary">Add New Subsystem</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">System Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="e.g. Hydraulic System"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">French Name</label>
            <input
              value={nameFr}
              onChange={e => setNameFr(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="e.g. Système Hydraulique"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary h-20 resize-none"
              placeholder="Brief description of this subsystem"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Icon</label>
            <select
              value={icon}
              onChange={e => setIcon(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {ICON_OPTIONS.map(ic => (
                <option key={ic} value={ic}>{ic}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground rounded py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Create Subsystem
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
