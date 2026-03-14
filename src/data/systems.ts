export type RiskLevel = "critical" | "high" | "medium" | "low";

export interface FaultTreeNode {
  id: string;
  label: string;
  type: "top" | "gate" | "event" | "basic";
  gateType?: "AND" | "OR";
  children?: FaultTreeNode[];
}

export interface FMEARow {
  id: string;
  component: string;
  failureMode: string;
  cause: string;
  effect: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  mitigation: string;
}

export interface RiskEntry {
  id: string;
  hazard: string;
  severity: number;
  probability: number;
  riskLevel: RiskLevel;
}

export interface SafetyFunction {
  id: string;
  function: string;
  plr: string;
  category: string;
  description: string;
}

export interface SystemData {
  id: string;
  name: string;
  nameFr: string;
  icon: string;
  topEvent: string;
  description: string;
  faultTree: FaultTreeNode;
  fmea: FMEARow[];
  risks: RiskEntry[];
  safetyFunctions: SafetyFunction[];
  consequences: string[];
  safetyMeasures: string[];
}

function getRiskLevel(s: number, p: number): RiskLevel {
  const score = s * p;
  if (score >= 16) return "critical";
  if (score >= 9) return "high";
  if (score >= 4) return "medium";
  return "low";
}

export const systems: SystemData[] = [
  {
    id: "braking",
    name: "Braking System",
    nameFr: "Freinage",
    icon: "Disc3",
    topEvent: "Uncontrolled machine movement",
    description: "Three redundant braking systems: hydrostatic, dynamic drum, and spring-applied parking brake with hydraulic release.",
    consequences: ["Vehicle runaway", "Tunnel collision", "Operator injury", "Equipment damage"],
    safetyMeasures: ["Redundant braking systems", "Hydraulic pressure monitoring", "Emergency spring brake", "Deadman pedal"],
    faultTree: {
      id: "bt",
      label: "Uncontrolled Machine Movement",
      type: "top",
      children: [
        {
          id: "b1", label: "Hydrostatic Braking Failure", type: "gate", gateType: "OR",
          children: [
            { id: "b1a", label: "Variable Displacement Pump Malfunction", type: "gate", gateType: "OR",
              children: [
                { id: "b1a1", label: "Hydraulic Hose Rupture", type: "basic" },
                { id: "b1a2", label: "Mechanical Wear", type: "basic" },
              ]
            },
            { id: "b1b", label: "Hydraulic Motor Control Failure", type: "gate", gateType: "OR",
              children: [
                { id: "b1b1", label: "ECU Failure", type: "basic" },
                { id: "b1b2", label: "Electrical Signal Loss", type: "basic" },
              ]
            },
            { id: "b1c", label: "Hydraulic Leakage", type: "basic" },
          ]
        },
        {
          id: "b2", label: "Dynamic Braking Failure", type: "gate", gateType: "OR",
          children: [
            { id: "b2a", label: "Brake Pedal Sensor Failure", type: "basic" },
            { id: "b2b", label: "Drum Brake Wear", type: "basic" },
            { id: "b2c", label: "Brake Actuator Malfunction", type: "gate", gateType: "OR",
              children: [
                { id: "b2c1", label: "Accumulator Pressure Drop", type: "basic" },
                { id: "b2c2", label: "Operator Misuse", type: "basic" },
              ]
            },
          ]
        },
        {
          id: "b3", label: "Parking Brake Failure", type: "gate", gateType: "OR",
          children: [
            { id: "b3a", label: "Spring Brake Malfunction", type: "basic" },
            { id: "b3b", label: "Brake Disc Wear", type: "basic" },
            { id: "b3c", label: "Hydraulic Release Pressure Loss", type: "basic" },
          ]
        },
        { id: "b4", label: "Hydraulic Pressure Loss", type: "basic" },
      ]
    },
    fmea: [
      { id: "bf1", component: "Variable Displacement Pump", failureMode: "Loss of pressure", cause: "Mechanical wear", effect: "Hydrostatic braking loss", severity: 5, occurrence: 3, detection: 3, rpn: 45, mitigation: "Scheduled pump replacement at 5000h" },
      { id: "bf2", component: "Hydraulic Motor", failureMode: "Control signal loss", cause: "ECU failure", effect: "No hydraulic retardation", severity: 5, occurrence: 2, detection: 2, rpn: 20, mitigation: "Redundant ECU with diagnostics" },
      { id: "bf3", component: "Brake Pedal Sensor", failureMode: "No signal output", cause: "Sensor failure", effect: "No dynamic braking command", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Dual-channel sensor with plausibility check" },
      { id: "bf4", component: "Drum Brake", failureMode: "Reduced braking force", cause: "Brake pad wear", effect: "Extended stopping distance", severity: 4, occurrence: 3, detection: 2, rpn: 24, mitigation: "Wear indicator and periodic inspection" },
      { id: "bf5", component: "Brake Actuator", failureMode: "Stuck open", cause: "Hydraulic seal failure", effect: "No dynamic braking on one axle", severity: 4, occurrence: 2, detection: 3, rpn: 24, mitigation: "Pressure monitoring per circuit" },
      { id: "bf6", component: "Spring Brake", failureMode: "Fails to engage", cause: "Spring fatigue", effect: "No parking brake", severity: 5, occurrence: 2, detection: 2, rpn: 20, mitigation: "Spring force testing at service intervals" },
      { id: "bf7", component: "Brake Disc", failureMode: "Cracking", cause: "Thermal stress", effect: "Reduced parking brake holding", severity: 4, occurrence: 2, detection: 3, rpn: 24, mitigation: "Disc thickness measurement" },
      { id: "bf8", component: "Hydraulic Hose", failureMode: "Rupture", cause: "Abrasion / aging", effect: "Complete hydraulic pressure loss", severity: 5, occurrence: 3, detection: 3, rpn: 45, mitigation: "Hose guards and replacement schedule" },
      { id: "bf9", component: "Accumulator", failureMode: "Pressure drop", cause: "Bladder failure", effect: "Insufficient emergency braking energy", severity: 5, occurrence: 2, detection: 2, rpn: 20, mitigation: "Pre-charge pressure monitoring" },
      { id: "bf10", component: "Deadman Pedal", failureMode: "Fails to detect release", cause: "Switch failure", effect: "No automatic emergency stop", severity: 5, occurrence: 2, detection: 2, rpn: 20, mitigation: "Dual-contact switch with monitoring" },
    ],
    risks: [
      { id: "br1", hazard: "Vehicle runaway on slope", severity: 5, probability: 3, riskLevel: "critical" },
      { id: "br2", hazard: "Extended stopping distance", severity: 4, probability: 3, riskLevel: "high" },
      { id: "br3", hazard: "Parking brake rollback", severity: 4, probability: 2, riskLevel: "medium" },
      { id: "br4", hazard: "Single brake circuit loss", severity: 3, probability: 3, riskLevel: "high" },
    ],
    safetyFunctions: [
      { id: "bs1", function: "Emergency braking via spring brake", plr: "d", category: "3", description: "Automatic application of spring brakes on hydraulic pressure loss" },
      { id: "bs2", function: "Deadman pedal monitoring", plr: "c", category: "2", description: "Automatic stop when operator releases deadman pedal" },
      { id: "bs3", function: "Brake pressure monitoring", plr: "d", category: "3", description: "Continuous monitoring of all brake circuit pressures" },
    ],
  },
  {
    id: "tilt",
    name: "Tilt Monitoring",
    nameFr: "Dévers",
    icon: "TriangleAlert",
    topEvent: "Machine rollover",
    description: "Inclinometer-based tilt monitoring with automatic shutdown and progressive warning system.",
    consequences: ["Machine rollover", "Tunnel infrastructure damage", "Load displacement", "Operator injury"],
    safetyMeasures: ["Automatic shutdown above 5.5° tilt", "Warning alarm above 4.5°", "Controlled recovery mode", "Speed limitation"],
    faultTree: {
      id: "tt",
      label: "Machine Rollover",
      type: "top",
      children: [
        {
          id: "t1", label: "Tilt Sensor Failure", type: "gate", gateType: "OR",
          children: [
            { id: "t1a", label: "Inclinometer Malfunction", type: "gate", gateType: "OR",
              children: [
                { id: "t1a1", label: "Sensor Calibration Error", type: "basic" },
                { id: "t1a2", label: "Electrical Wiring Failure", type: "basic" },
              ]
            },
            { id: "t1b", label: "CAN Communication Failure", type: "basic" },
          ]
        },
        {
          id: "t2", label: "Control Logic Failure", type: "gate", gateType: "OR",
          children: [
            { id: "t2a", label: "PLC Logic Failure", type: "basic" },
            { id: "t2b", label: "Software Error", type: "basic" },
          ]
        },
        { id: "t3", label: "Operator Misuse", type: "basic" },
        {
          id: "t4", label: "Excessive Slope", type: "gate", gateType: "OR",
          children: [
            { id: "t4a", label: "Uneven Tunnel Ground", type: "basic" },
            { id: "t4b", label: "Machine Overload", type: "basic" },
          ]
        },
      ]
    },
    fmea: [
      { id: "tf1", component: "Inclinometer", failureMode: "Incorrect reading", cause: "Calibration drift", effect: "False tilt assessment", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Periodic calibration verification" },
      { id: "tf2", component: "CAN Bus", failureMode: "Communication loss", cause: "Wiring damage", effect: "No tilt data to PLC", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Redundant CAN channels" },
      { id: "tf3", component: "PLC Controller", failureMode: "Logic failure", cause: "Software bug", effect: "No automatic shutdown", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "Validated safety PLC (SIL 2)" },
      { id: "tf4", component: "Warning Alarm", failureMode: "No alarm output", cause: "Speaker/wiring fault", effect: "Operator not warned", severity: 3, occurrence: 2, detection: 2, rpn: 12, mitigation: "Alarm self-test at startup" },
      { id: "tf5", component: "Speed Limiter", failureMode: "Fails to reduce speed", cause: "Valve stuck open", effect: "No speed reduction on slope", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Speed feedback monitoring" },
    ],
    risks: [
      { id: "tr1", hazard: "Rollover on uneven ground", severity: 5, probability: 2, riskLevel: "high" },
      { id: "tr2", hazard: "Load shift due to tilt", severity: 4, probability: 3, riskLevel: "high" },
      { id: "tr3", hazard: "False alarm causing operational delay", severity: 2, probability: 3, riskLevel: "medium" },
    ],
    safetyFunctions: [
      { id: "ts1", function: "Automatic shutdown at 5.5°", plr: "d", category: "3", description: "Machine stops all motion when tilt exceeds 5.5°" },
      { id: "ts2", function: "Warning alarm at 4.5°", plr: "c", category: "2", description: "Audible and visual alarm at 4.5° tilt angle" },
      { id: "ts3", function: "Speed limitation on slope", plr: "c", category: "2", description: "Automatic speed reduction when tilt detected" },
    ],
  },
  {
    id: "steering",
    name: "Steering System",
    nameFr: "Direction",
    icon: "Navigation",
    topEvent: "Loss of directional control",
    description: "Hydraulic steering with Orbitrol unit and Automatic Guidance System (AGS) using laser sensors.",
    consequences: ["Vehicle collision", "Tunnel wall impact", "Load damage", "Operator injury"],
    safetyMeasures: ["Redundant hydraulic circuits", "AGS laser monitoring", "Emergency stop system", "Steering feedback sensors"],
    faultTree: {
      id: "st",
      label: "Loss of Directional Control",
      type: "top",
      children: [
        {
          id: "s1", label: "Hydraulic Steering Failure", type: "gate", gateType: "OR",
          children: [
            { id: "s1a", label: "Hydraulic Pump Malfunction", type: "gate", gateType: "OR",
              children: [
                { id: "s1a1", label: "Hydraulic Hose Rupture", type: "basic" },
                { id: "s1a2", label: "Pump Wear", type: "basic" },
              ]
            },
            { id: "s1b", label: "Directional Valve Failure", type: "basic" },
          ]
        },
        {
          id: "s2", label: "Orbitrol Steering Failure", type: "gate", gateType: "OR",
          children: [
            { id: "s2a", label: "Orbitrol Unit Malfunction", type: "basic" },
            { id: "s2b", label: "Steering Column Damage", type: "basic" },
          ]
        },
        {
          id: "s3", label: "Steering Cylinder Failure", type: "gate", gateType: "OR",
          children: [
            { id: "s3a", label: "Cylinder Seal Leakage", type: "basic" },
            { id: "s3b", label: "Cylinder Rod Damage", type: "basic" },
          ]
        },
        {
          id: "s4", label: "AGS Guidance Failure", type: "gate", gateType: "OR",
          children: [
            { id: "s4a", label: "Laser Sensor Failure", type: "gate", gateType: "OR",
              children: [
                { id: "s4a1", label: "Sensor Malfunction", type: "basic" },
                { id: "s4a2", label: "Sensor Contamination", type: "basic" },
              ]
            },
            { id: "s4b", label: "Software Control Error", type: "basic" },
          ]
        },
      ]
    },
    fmea: [
      { id: "sf1", component: "Hydraulic Pump", failureMode: "Low flow output", cause: "Internal wear", effect: "Sluggish steering response", severity: 4, occurrence: 3, detection: 2, rpn: 24, mitigation: "Flow rate monitoring" },
      { id: "sf2", component: "Directional Valve", failureMode: "Stuck in position", cause: "Contamination", effect: "Steering locked", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Hydraulic filtration and oil analysis" },
      { id: "sf3", component: "Orbitrol Unit", failureMode: "No steering output", cause: "Internal failure", effect: "Complete steering loss", severity: 5, occurrence: 1, detection: 3, rpn: 15, mitigation: "Emergency steering circuit" },
      { id: "sf4", component: "Steering Cylinder", failureMode: "External leakage", cause: "Seal wear", effect: "Reduced steering force", severity: 3, occurrence: 3, detection: 2, rpn: 18, mitigation: "Seal replacement schedule" },
      { id: "sf5", component: "AGS Laser Sensor", failureMode: "No signal", cause: "Contamination / failure", effect: "Loss of auto-guidance", severity: 3, occurrence: 3, detection: 2, rpn: 18, mitigation: "Sensor cleaning and redundancy" },
      { id: "sf6", component: "AGS Controller", failureMode: "Incorrect guidance command", cause: "Software error", effect: "Deviation from tunnel path", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Software validation and manual override" },
    ],
    risks: [
      { id: "sr1", hazard: "Tunnel wall collision", severity: 5, probability: 2, riskLevel: "high" },
      { id: "sr2", hazard: "Steering lock during operation", severity: 5, probability: 1, riskLevel: "medium" },
      { id: "sr3", hazard: "AGS deviation from path", severity: 3, probability: 3, riskLevel: "high" },
    ],
    safetyFunctions: [
      { id: "ss1", function: "Emergency steering circuit", plr: "d", category: "3", description: "Backup hydraulic circuit for emergency steering" },
      { id: "ss2", function: "AGS deviation alarm", plr: "c", category: "2", description: "Alarm when AGS detects path deviation beyond threshold" },
      { id: "ss3", function: "Steering feedback monitoring", plr: "c", category: "2", description: "Continuous position feedback from steering cylinders" },
    ],
  },
  {
    id: "fire",
    name: "Fire System",
    nameFr: "Incendie",
    icon: "Flame",
    topEvent: "Fire in machine casing",
    description: "Fire detection and suppression system with automatic and manual activation for underground operation.",
    consequences: ["Machine destruction", "Tunnel fire hazard", "Operator injury", "Explosion risk"],
    safetyMeasures: ["Automatic fire suppression system", "Manual fire trigger", "Fire detection tube", "Alarm system"],
    faultTree: {
      id: "ft",
      label: "Fire in Machine Casing",
      type: "top",
      children: [
        {
          id: "f1", label: "Fuel Leakage", type: "gate", gateType: "OR",
          children: [
            { id: "f1a", label: "Fuel Hose Rupture", type: "basic" },
            { id: "f1b", label: "Fuel Fitting Failure", type: "basic" },
          ]
        },
        {
          id: "f2", label: "Electrical Short Circuit", type: "gate", gateType: "OR",
          children: [
            { id: "f2a", label: "Battery Overheating", type: "basic" },
            { id: "f2b", label: "Electrical Insulation Failure", type: "gate", gateType: "OR",
              children: [
                { id: "f2b1", label: "Wiring Damage", type: "basic" },
                { id: "f2b2", label: "Component Overheating", type: "basic" },
              ]
            },
          ]
        },
        {
          id: "f3", label: "Hydraulic Oil Ignition", type: "gate", gateType: "AND",
          children: [
            { id: "f3a", label: "Hydraulic Leak onto Hot Surface", type: "basic" },
            { id: "f3b", label: "Surface Above Auto-Ignition Temperature", type: "basic" },
          ]
        },
        {
          id: "f4", label: "Engine Overheating", type: "gate", gateType: "OR",
          children: [
            { id: "f4a", label: "Cooling System Failure", type: "basic" },
            { id: "f4b", label: "External Ignition Source", type: "basic" },
          ]
        },
      ]
    },
    fmea: [
      { id: "ff1", component: "Fuel Hose", failureMode: "Rupture", cause: "Abrasion / aging", effect: "Fuel leakage near hot components", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Fire-resistant hoses and routing inspection" },
      { id: "ff2", component: "Battery Pack", failureMode: "Thermal runaway", cause: "Cell damage / overcharge", effect: "Fire / explosion", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "BMS with thermal monitoring" },
      { id: "ff3", component: "Electrical Wiring", failureMode: "Short circuit", cause: "Insulation damage", effect: "Electrical fire", severity: 4, occurrence: 2, detection: 3, rpn: 24, mitigation: "Circuit breakers and fire-rated cables" },
      { id: "ff4", component: "Hydraulic System", failureMode: "Oil spray on exhaust", cause: "Hose failure near engine", effect: "Hydraulic oil fire", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Hose guards and fire-resistant fluid" },
      { id: "ff5", component: "Fire Detection Tube", failureMode: "No detection", cause: "Tube damage / aging", effect: "Delayed fire response", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "Annual detection tube test" },
      { id: "ff6", component: "Fire Suppression", failureMode: "Fails to discharge", cause: "Nozzle blockage", effect: "Fire not suppressed", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "Semi-annual suppression system test" },
    ],
    risks: [
      { id: "fr1", hazard: "Tunnel fire with trapped personnel", severity: 5, probability: 2, riskLevel: "high" },
      { id: "fr2", hazard: "Battery thermal runaway", severity: 5, probability: 1, riskLevel: "medium" },
      { id: "fr3", hazard: "Hydraulic oil fire", severity: 5, probability: 2, riskLevel: "high" },
      { id: "fr4", hazard: "Explosion from fuel vapor", severity: 5, probability: 1, riskLevel: "medium" },
    ],
    risks: [
      { id: "fr1", hazard: "Tunnel fire with trapped personnel", severity: 5, probability: 2, riskLevel: "high" },
      { id: "fr2", hazard: "Battery thermal runaway", severity: 5, probability: 1, riskLevel: "medium" },
      { id: "fr3", hazard: "Hydraulic oil fire", severity: 5, probability: 2, riskLevel: "high" },
    ],
    safetyFunctions: [
      { id: "fs1", function: "Automatic fire suppression", plr: "d", category: "3", description: "Automatic discharge of extinguishing agent on fire detection" },
      { id: "fs2", function: "Manual fire trigger", plr: "c", category: "1", description: "Manual activation of fire suppression from operator cabin" },
      { id: "fs3", function: "Fire alarm system", plr: "c", category: "2", description: "Audible and visual fire alarm with auto-shutdown" },
    ],
  },
  {
    id: "propulsion",
    name: "Propulsion System",
    nameFr: "Translation",
    icon: "Zap",
    topEvent: "Uncontrolled machine motion",
    description: "Dual propulsion: diesel-hydraulic hydrostatic drive and electric battery propulsion with inverter control.",
    consequences: ["Sudden acceleration", "Loss of control", "Collision risk", "Equipment damage"],
    safetyMeasures: ["Deadman pedal", "Speed limitation", "Emergency stop system", "ECU diagnostics"],
    faultTree: {
      id: "pt",
      label: "Uncontrolled Machine Motion",
      type: "top",
      children: [
        {
          id: "p1", label: "Hydrostatic Propulsion Failure", type: "gate", gateType: "OR",
          children: [
            { id: "p1a", label: "Pump Failure", type: "gate", gateType: "OR",
              children: [
                { id: "p1a1", label: "Pump Wear", type: "basic" },
                { id: "p1a2", label: "Control Valve Failure", type: "basic" },
              ]
            },
            { id: "p1b", label: "Hydraulic Motor Failure", type: "basic" },
          ]
        },
        {
          id: "p2", label: "Electric Propulsion Failure", type: "gate", gateType: "OR",
          children: [
            { id: "p2a", label: "Inverter Malfunction", type: "basic" },
            { id: "p2b", label: "Battery Failure", type: "basic" },
            { id: "p2c", label: "Electric Motor Overheating", type: "basic" },
          ]
        },
        {
          id: "p3", label: "Control System Malfunction", type: "gate", gateType: "OR",
          children: [
            { id: "p3a", label: "ECU Malfunction", type: "basic" },
            { id: "p3b", label: "Electrical Connection Loss", type: "basic" },
            { id: "p3c", label: "Software Error", type: "basic" },
          ]
        },
        { id: "p4", label: "Operator Command Error", type: "basic" },
      ]
    },
    fmea: [
      { id: "pf1", component: "Hydraulic Pump", failureMode: "Loss of displacement", cause: "Internal wear", effect: "Loss of hydrostatic drive", severity: 4, occurrence: 3, detection: 2, rpn: 24, mitigation: "Oil analysis and pump monitoring" },
      { id: "pf2", component: "Hydraulic Motor", failureMode: "Seizure", cause: "Contamination", effect: "Sudden loss of traction", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Filtration and temperature monitoring" },
      { id: "pf3", component: "Inverter", failureMode: "Output failure", cause: "IGBT failure", effect: "Loss of electric drive", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Inverter diagnostics and thermal protection" },
      { id: "pf4", component: "Battery Pack", failureMode: "Capacity loss", cause: "Cell degradation", effect: "Reduced range / power", severity: 3, occurrence: 3, detection: 2, rpn: 18, mitigation: "BMS monitoring and SOH tracking" },
      { id: "pf5", component: "Electric Motor", failureMode: "Overheating", cause: "Overload / cooling failure", effect: "Motor shutdown", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Temperature sensors with derating" },
      { id: "pf6", component: "ECU", failureMode: "Incorrect command", cause: "Software error", effect: "Unintended acceleration", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "Dual-channel ECU with watchdog" },
      { id: "pf7", component: "Deadman Pedal", failureMode: "Stuck engaged", cause: "Mechanical jam", effect: "No emergency stop on release", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "Pedal self-test and dual contact" },
    ],
    risks: [
      { id: "pr1", hazard: "Unintended acceleration", severity: 5, probability: 1, riskLevel: "medium" },
      { id: "pr2", hazard: "Loss of traction on slope", severity: 4, probability: 2, riskLevel: "medium" },
      { id: "pr3", hazard: "Collision from control failure", severity: 5, probability: 2, riskLevel: "high" },
    ],
    safetyFunctions: [
      { id: "ps1", function: "Deadman pedal monitoring", plr: "d", category: "3", description: "Immediate stop when operator releases pedal" },
      { id: "ps2", function: "Speed limitation system", plr: "c", category: "2", description: "Electronic speed limiter based on operating mode" },
      { id: "ps3", function: "Emergency stop circuit", plr: "e", category: "4", description: "Hardwired emergency stop with redundant contacts" },
    ],
  },
];

export const machineInfo = {
  name: "TSP Tunnel Transport Vehicle",
  application: "Underground tunnel construction transport",
  loadCapacity: "20–130 tons",
  propulsion: "Diesel-hydraulic / Electric battery",
  axles: "4 axles, 16 wheels",
  cabins: "2 operator cabins",
  tractionSystem: "Hydrostatic",
  brakingSystems: "3 redundant systems",
  steering: "Hydraulic with AGS",
  guidance: "Automatic Guidance System (laser)",
  fireProtection: "Detection & suppression system",
  standards: ["ISO 12100", "ISO 13849"],
};
