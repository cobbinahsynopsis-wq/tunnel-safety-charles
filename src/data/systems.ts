import type { HazardContext } from "@/utils/plrCalculation";

export type RiskLevel = "critical" | "high" | "medium" | "low";

export interface FaultTreeNode {
  id: string;
  label: string;
  type: "top" | "gate" | "event" | "basic";
  gateType?: "AND" | "OR";
  code?: string;
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
  // ═══════════════════════════════════════════════════════════
  // BRAKING SYSTEM (Freinage) - From Excel Page 1
  // ═══════════════════════════════════════════════════════════
  {
    id: "braking",
    name: "Braking System",
    nameFr: "Freinage",
    icon: "Disc3",
    topEvent: "Mouvement incontrôlé du TSP / Uncontrolled TSP Movement",
    description: "Three redundant braking systems: hydrostatic, dynamic drum, and spring-applied parking brake with hydraulic release. The system includes accumulator backup and deadman pedal monitoring.",
    consequences: [
      "Vehicle runaway on slope",
      "Tunnel collision with TBM or infrastructure",
      "Operator injury or fatality",
      "Equipment and tunnel damage",
    ],
    safetyMeasures: [
      "Surveillance et alarme de la pression hydraulique",
      "Détection des fuites et inspection du circuit hydraulique",
      "Vitesse de fonctionnement contrôlée à proximité de la TBM",
      "Entretien préventif de l'accumulateur et du mécanisme de pédale",
      "Surveillance des défauts du système de contrôle",
    ],
    faultTree: {
      id: "bt",
      label: "Mouvement incontrôlé du TSP",
      type: "top",
      children: [
        {
          id: "bA", label: "Défaillance du freinage hydrostatique", type: "gate", gateType: "OR", code: "A",
          children: [
            { id: "bA1", label: "Défaillance du moteur à cylindrée variable", type: "basic", code: "A1" },
            { id: "bA2", label: "Défaillance de la pompe", type: "basic", code: "A2" },
            { id: "bA3", label: "Perte de pression hydraulique", type: "basic", code: "A3" },
            { id: "bA4", label: "Fuite hydraulique", type: "basic", code: "A4" },
          ],
        },
        {
          id: "bB", label: "Défaillance du freinage dynamique", type: "gate", gateType: "OR", code: "B",
          children: [
            { id: "bB1", label: "Double et LS défaillance de la pompe", type: "basic", code: "B1" },
            { id: "bB2", label: "Défaillance de l'unité de maintien de pression", type: "basic", code: "B2" },
            { id: "bB3", label: "Perte de pression hydraulique", type: "basic", code: "B3" },
            { id: "bB4", label: "Fuite hydraulique", type: "basic", code: "B4" },
            { id: "bB5", label: "Usure des garnitures de frein", type: "basic", code: "B5" },
            { id: "bB6", label: "Défaillance de la tringlerie de pédale", type: "basic", code: "B6" },
          ],
        },
        {
          id: "bC", label: "Défaillance du freinage d'urgence", type: "gate", gateType: "OR", code: "C",
          children: [
            { id: "bC1", label: "Rupture du ressort", type: "basic", code: "C1" },
            { id: "bC2", label: "Obstruction de la conduite hydraulique", type: "basic", code: "C2" },
            { id: "bC3", label: "Blocage mécanique", type: "basic", code: "C3" },
            { id: "bC4", label: "Défaillance de la logique de commande", type: "basic", code: "C4" },
          ],
        },
        {
          id: "bD", label: "Le système de commande empêche le freinage", type: "gate", gateType: "OR", code: "D",
          children: [
            { id: "bD1", label: "Défaillance de la communication CAN", type: "basic", code: "D1" },
            { id: "bD3", label: "Défaillance de l'alimentation électrique", type: "basic", code: "D3" },
            { id: "bD4", label: "Dysfonctionnement de la logique de réinitialisation", type: "basic", code: "D4" },
          ],
        },
        {
          id: "bE", label: "La commande de l'opérateur n'est pas transmise", type: "gate", gateType: "OR", code: "E",
          children: [
            { id: "bE1", label: "Défaillance de la tringlerie de pédale", type: "basic", code: "E1" },
            { id: "bE3", label: "Erreur de l'opérateur", type: "basic", code: "E3" },
          ],
        },
        {
          id: "bF", label: "Défaillance de l'accumulateur", type: "gate", gateType: "OR", code: "F",
          children: [
            { id: "bF1", label: "Rupture de la vessie", type: "basic", code: "F1" },
            { id: "bF2", label: "Fuite d'azote", type: "basic", code: "F2" },
            { id: "bF3", label: "Clapet usé", type: "basic", code: "F3" },
            { id: "bF4", label: "Ressort faible", type: "basic", code: "F4" },
          ],
        },
      ],
    },
    fmea: [
      { id: "bf1", component: "Moteur à cylindrée variable", failureMode: "Perte de pression", cause: "Usure mécanique", effect: "Perte du freinage hydrostatique", severity: 5, occurrence: 3, detection: 3, rpn: 45, mitigation: "Remplacement programmé de la pompe à 5000h" },
      { id: "bf2", component: "Pompe hydraulique", failureMode: "Défaillance de la pompe", cause: "Double et LS défaillance", effect: "Perte du freinage dynamique", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Pompe redondante avec surveillance" },
      { id: "bf3", component: "Unité de maintien de pression", failureMode: "Perte de maintien", cause: "Défaillance interne", effect: "Frein dynamique inopérant", severity: 4, occurrence: 2, detection: 3, rpn: 24, mitigation: "Surveillance de la pression de maintien" },
      { id: "bf4", component: "Garnitures de frein", failureMode: "Usure excessive", cause: "Usure normale / surcharge", effect: "Distance d'arrêt prolongée", severity: 4, occurrence: 3, detection: 2, rpn: 24, mitigation: "Indicateur d'usure et inspection périodique" },
      { id: "bf5", component: "Tringlerie de pédale", failureMode: "Blocage / rupture", cause: "Usure mécanique", effect: "Commande de frein non transmise", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Inspection régulière de la tringlerie" },
      { id: "bf6", component: "Ressort de frein de stationnement", failureMode: "Rupture du ressort", cause: "Fatigue du ressort", effect: "Frein de stationnement inopérant", severity: 5, occurrence: 2, detection: 2, rpn: 20, mitigation: "Test de force du ressort aux intervalles" },
      { id: "bf7", component: "Conduite hydraulique", failureMode: "Obstruction", cause: "Contamination", effect: "Frein d'urgence bloqué", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Filtration et rinçage du circuit" },
      { id: "bf8", component: "Communication CAN", failureMode: "Perte de communication", cause: "Défaillance bus CAN", effect: "Système de commande inopérant", severity: 5, occurrence: 2, detection: 2, rpn: 20, mitigation: "Bus CAN redondant" },
      { id: "bf9", component: "Alimentation électrique", failureMode: "Perte d'alimentation", cause: "Défaillance électrique", effect: "Système de commande hors tension", severity: 5, occurrence: 2, detection: 2, rpn: 20, mitigation: "Alimentation de secours" },
      { id: "bf10", component: "Accumulateur (Vessie)", failureMode: "Rupture de la vessie", cause: "Fatigue / vieillissement", effect: "Énergie de freinage d'urgence insuffisante", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Surveillance de la pré-charge" },
      { id: "bf11", component: "Accumulateur (Azote)", failureMode: "Fuite d'azote", cause: "Joint défectueux", effect: "Pression accumulateur réduite", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Vérification pression pré-charge" },
      { id: "bf12", component: "Accumulateur (Clapet)", failureMode: "Clapet usé", cause: "Usure", effect: "Fuite interne de l'accumulateur", severity: 4, occurrence: 2, detection: 3, rpn: 24, mitigation: "Remplacement préventif du clapet" },
      { id: "bf13", component: "Circuit hydraulique", failureMode: "Fuite hydraulique", cause: "Abrasion / vieillissement", effect: "Perte de pression complète", severity: 5, occurrence: 3, detection: 3, rpn: 45, mitigation: "Protections de flexible et planning de remplacement" },
    ],
    risks: [
      { id: "br1", hazard: "Emballement du véhicule en pente", severity: 5, probability: 3, riskLevel: "critical" },
      { id: "br2", hazard: "Distance d'arrêt prolongée", severity: 4, probability: 3, riskLevel: "high" },
      { id: "br3", hazard: "Recul frein de stationnement", severity: 4, probability: 2, riskLevel: "medium" },
      { id: "br4", hazard: "Perte d'un circuit de frein", severity: 3, probability: 3, riskLevel: "high" },
      { id: "br5", hazard: "Défaillance accumulateur en urgence", severity: 5, probability: 2, riskLevel: "high" },
    ],
    safetyFunctions: [
      { id: "bs1", function: "Freinage d'urgence par ressort", plr: "d", category: "3", description: "Application automatique des freins à ressort sur perte de pression hydraulique" },
      { id: "bs2", function: "Surveillance pédale homme-mort", plr: "c", category: "2", description: "Arrêt automatique lorsque l'opérateur relâche la pédale" },
      { id: "bs3", function: "Surveillance pression de frein", plr: "d", category: "3", description: "Surveillance continue de toutes les pressions des circuits de frein" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // TILT MONITORING (Dévers) - From Excel Page 2
  // ═══════════════════════════════════════════════════════════
  {
    id: "tilt",
    name: "Tilt Monitoring",
    nameFr: "Dévers",
    icon: "TriangleAlert",
    topEvent: "Mouvement latéral incontrôlé du TSP",
    description: "Inclinometer-based tilt monitoring with automatic shutdown and progressive warning. TOP Event occurs if (Angle > 5.5° for > 5s) AND Safety function failure.",
    consequences: [
      "Renversement de la machine",
      "Dommages à l'infrastructure du tunnel",
      "Déplacement de la charge",
      "Blessure de l'opérateur",
    ],
    safetyMeasures: [
      "Arrêt automatique au-dessus de 5.5° d'inclinaison",
      "Alarme d'avertissement au-dessus de 4.5°",
      "Mode de récupération contrôlé",
      "Limitation de vitesse",
    ],
    faultTree: {
      id: "tt",
      label: "Mouvement latéral incontrôlé du TSP",
      type: "top",
      children: [
        {
          id: "tA", label: "Angle > 5,5° pendant > 5 s", type: "gate", gateType: "AND", code: "A",
          children: [
            {
              id: "tB", label: "Défaillance de fonction de sécurité", type: "gate", gateType: "OR", code: "B",
              children: [
                {
                  id: "tA1", label: "Échec de détection", type: "gate", gateType: "OR", code: "A1",
                  children: [
                    { id: "tA11", label: "Les deux capteurs donnent des valeurs incorrectes", type: "basic", code: "A1,1" },
                    { id: "tA12", label: "Un capteur donne des valeurs incorrectes", type: "basic", code: "A1,2" },
                  ],
                },
                {
                  id: "tA2", label: "Échec de la logique PLC", type: "gate", gateType: "OR", code: "A2",
                  children: [
                    { id: "tA21", label: "Bogue logiciel", type: "basic", code: "A2,1" },
                    { id: "tA22", label: "Surcharge du CPU", type: "basic", code: "A2,2" },
                    { id: "tA23", label: "Interférence électromagnétique", type: "basic", code: "A2,3" },
                  ],
                },
                {
                  id: "tA3", label: "Échec du CAN", type: "gate", gateType: "OR", code: "A3",
                  children: [
                    { id: "tA31", label: "Court-circuit de la ligne CAN", type: "basic", code: "A3,1" },
                    { id: "tA32", label: "Circuit ouvert de la ligne CAN", type: "basic", code: "A3,2" },
                    { id: "tA33", label: "Interférence électromagnétique", type: "basic", code: "A3,3" },
                    { id: "tA34", label: "Corrosion du connecteur", type: "basic", code: "A3,4" },
                  ],
                },
                {
                  id: "tA4", label: "Échec de sortie", type: "gate", gateType: "OR", code: "A4",
                  children: [
                    { id: "tA41", label: "Défaillance du relais", type: "basic", code: "A4,1" },
                    { id: "tA42", label: "Défaillance de l'actionnement hydraulique", type: "basic", code: "A4,2" },
                    { id: "tA43", label: "Défaillance du frein", type: "basic", code: "A4,3" },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "tB_cond", label: "Conditions d'angle > 5,5°", type: "gate", gateType: "OR",
          children: [
            { id: "tB1", label: "Déformation mécanique", type: "basic", code: "B1" },
            { id: "tB2", label: "Pente et instabilité", type: "basic", code: "B2" },
            { id: "tB3", label: "Perte de pression des pneus", type: "basic", code: "B3" },
          ],
        },
      ],
    },
    fmea: [
      { id: "tf1", component: "Inclinomètre (2 capteurs)", failureMode: "Lecture incorrecte", cause: "Dérive de calibration", effect: "Évaluation d'inclinaison fausse", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Vérification de calibration périodique" },
      { id: "tf2", component: "Bus CAN (ligne)", failureMode: "Court-circuit", cause: "Dommage câblage", effect: "Perte données inclinaison vers PLC", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Canaux CAN redondants" },
      { id: "tf3", component: "Bus CAN (connecteur)", failureMode: "Corrosion", cause: "Humidité tunnel", effect: "Communication intermittente", severity: 3, occurrence: 3, detection: 2, rpn: 18, mitigation: "Connecteurs étanches IP67" },
      { id: "tf4", component: "PLC de sécurité", failureMode: "Bogue logiciel", cause: "Erreur de programmation", effect: "Pas d'arrêt automatique", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "PLC de sécurité validé (SIL 2)" },
      { id: "tf5", component: "PLC (CPU)", failureMode: "Surcharge CPU", cause: "Charge excessive", effect: "Retard de traitement", severity: 4, occurrence: 1, detection: 2, rpn: 8, mitigation: "Monitoring de charge CPU" },
      { id: "tf6", component: "Relais de sortie", failureMode: "Défaillance du relais", cause: "Usure contacts", effect: "Pas d'action de sécurité", severity: 5, occurrence: 2, detection: 2, rpn: 20, mitigation: "Relais doublés avec diagnostic" },
      { id: "tf7", component: "Actionnement hydraulique", failureMode: "Défaillance hydraulique", cause: "Fuite / blocage", effect: "Pas de freinage sur dévers", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Circuit hydraulique redondant" },
      { id: "tf8", component: "Alarme d'avertissement", failureMode: "Pas de sortie alarme", cause: "Panne haut-parleur/câblage", effect: "Opérateur non averti", severity: 3, occurrence: 2, detection: 2, rpn: 12, mitigation: "Auto-test alarme au démarrage" },
      { id: "tf9", component: "Limiteur de vitesse", failureMode: "Pas de réduction", cause: "Vanne bloquée ouverte", effect: "Pas de réduction en pente", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Surveillance retour vitesse" },
    ],
    risks: [
      { id: "tr1", hazard: "Renversement sur terrain inégal", severity: 5, probability: 2, riskLevel: "high" },
      { id: "tr2", hazard: "Déplacement de charge dû à l'inclinaison", severity: 4, probability: 3, riskLevel: "high" },
      { id: "tr3", hazard: "Fausse alarme causant retard opérationnel", severity: 2, probability: 3, riskLevel: "medium" },
      { id: "tr4", hazard: "Perte de pression pneus en pente", severity: 4, probability: 2, riskLevel: "medium" },
    ],
    safetyFunctions: [
      { id: "ts1", function: "Arrêt automatique à 5,5°", plr: "d", category: "3", description: "Machine arrête tout mouvement quand inclinaison > 5,5°" },
      { id: "ts2", function: "Alarme à 4,5°", plr: "c", category: "2", description: "Alarme sonore et visuelle à 4,5° d'inclinaison" },
      { id: "ts3", function: "Limitation de vitesse en pente", plr: "c", category: "2", description: "Réduction automatique de la vitesse en cas d'inclinaison" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // STEERING SYSTEM (Direction) - From Excel Page 3
  // ═══════════════════════════════════════════════════════════
  {
    id: "steering",
    name: "Steering System",
    nameFr: "Direction",
    icon: "Navigation",
    topEvent: "Perte de contrôle de la direction du TSP",
    description: "Hydraulic steering with Orbitrol unit and Automatic Guidance System (AGS) using laser sensors. Supports Normal, Crab, and Short modes.",
    consequences: [
      "Collision avec paroi du tunnel",
      "Dommages à la charge",
      "Blessure de l'opérateur",
      "Déviation du trajet AGS",
    ],
    safetyMeasures: [
      "Circuit hydraulique de direction de secours",
      "Surveillance de déviation AGS",
      "Capteurs de retour de direction",
      "Système d'arrêt d'urgence",
    ],
    faultTree: {
      id: "st",
      label: "Perte de contrôle de la direction du TSP",
      type: "top",
      children: [
        {
          id: "sA", label: "Absence de réponse de la direction (N-C-S)", type: "gate", gateType: "OR", code: "A",
          children: [
            {
              id: "sA1", label: "Panne de la direction hydraulique (Normal)", type: "gate", gateType: "OR", code: "A1",
              children: [
                { id: "sA11", label: "Défaillance de la pompe double", type: "basic", code: "A1,1" },
                { id: "sA12", label: "Défaillance de la pompe de direction", type: "basic", code: "A1,2" },
                { id: "sA13", label: "Niveau d'huile hydraulique bas", type: "basic", code: "A1,3" },
                { id: "sA14", label: "Défaillance de la vanne de distribution", type: "basic", code: "A1,4" },
                { id: "sA15", label: "Rupture du flexible hydraulique", type: "basic", code: "A1,5" },
              ],
            },
            {
              id: "sA2", label: "Panne de la direction hydraulique (Crabe et Court)", type: "gate", gateType: "OR", code: "A2",
              children: [
                { id: "sA21", label: "Défaillance de la pompe double", type: "basic", code: "A2,1" },
                { id: "sA22", label: "Défaillance de la pompe de direction", type: "basic", code: "A2,2" },
                { id: "sA23", label: "Niveau d'huile hydraulique bas", type: "basic", code: "A2,3" },
                { id: "sA24", label: "Défaillance de la vanne de distribution", type: "basic", code: "A2,4" },
                { id: "sA25", label: "Rupture du flexible hydraulique", type: "basic", code: "A2,5" },
              ],
            },
            {
              id: "sA3", label: "Défaillance de l'actionnement (Mode Normal)", type: "gate", gateType: "OR", code: "A3",
              children: [
                { id: "sA31", label: "Valve DPX / PVG bloquée", type: "basic", code: "A3,1" },
                { id: "sA32", label: "Défaillance du solénoïde de la valve", type: "basic", code: "A3,2" },
                { id: "sA33", label: "Défaillance de l'Orbitrol", type: "basic", code: "A3,3" },
                { id: "sA34", label: "Défaillance du joint du vérin de direction", type: "basic", code: "A3,4" },
              ],
            },
            {
              id: "sA4", label: "Défaillance de l'actionnement (Crabe et Court)", type: "gate", gateType: "OR", code: "A4",
              children: [
                { id: "sA41", label: "Valve DPX / PVG bloquée", type: "basic", code: "A4,1" },
                { id: "sA42", label: "Défaillance du solénoïde de la valve", type: "basic", code: "A4,2" },
                { id: "sA43", label: "Défaillance de l'Orbitrol", type: "basic", code: "A4,3" },
                { id: "sA44", label: "Défaillance du joint du vérin", type: "basic", code: "A4,4" },
                { id: "sA45", label: "Défaillance de la tringlerie mécanique", type: "basic", code: "A4,5" },
              ],
            },
            {
              id: "sA5", label: "Défaillance du système de commande électrique (Normal)", type: "gate", gateType: "OR", code: "A5",
              children: [
                { id: "sA51", label: "Défaillance du processeur PLC", type: "basic", code: "A5,1" },
                { id: "sA52", label: "Défaillance de la sélection de cabine", type: "basic", code: "A5,2" },
                { id: "sA53", label: "Défaillance du relais ou du fusible", type: "basic", code: "A5,3" },
                { id: "sA54", label: "Perte d'alimentation", type: "basic", code: "A5,4" },
                { id: "sA55", label: "Défaillance de la communication bus CAN", type: "basic", code: "A5,5" },
              ],
            },
            {
              id: "sA6", label: "Défaillance du système de commande électrique (Crabe et Court)", type: "gate", gateType: "OR", code: "A6",
              children: [
                { id: "sA61", label: "Défaillance du processeur PLC", type: "basic", code: "A6,1" },
                { id: "sA62", label: "Défaillance de la sélection de cabine", type: "basic", code: "A6,2" },
                { id: "sA63", label: "Défaillance du relais ou du fusible", type: "basic", code: "A6,3" },
                { id: "sA64", label: "Perte d'alimentation", type: "basic", code: "A6,4" },
                { id: "sA65", label: "Défaillance de la communication bus CAN", type: "basic", code: "A6,5" },
                { id: "sA66", label: "Capteur d'angle défaillant", type: "basic", code: "A6,6" },
              ],
            },
          ],
        },
        {
          id: "sB", label: "Commande de direction incorrecte (AGS Mode)", type: "gate", gateType: "AND", code: "B",
          children: [
            {
              id: "sB1", label: "Erreur de guidage laser", type: "gate", gateType: "OR", code: "B1",
              children: [
                { id: "sB11", label: "Capteur laser encrassé", type: "basic", code: "B1,1" },
                { id: "sB12", label: "Erreur logique du logiciel", type: "basic", code: "B1,2" },
                { id: "sB13", label: "AGS non activé par le conducteur", type: "basic", code: "B1,3" },
                { id: "sB14", label: "Dérive capteur position", type: "basic", code: "B1,4" },
                { id: "sB15", label: "Capteur pression défectueux", type: "basic", code: "B1,5" },
              ],
            },
            {
              id: "sB2", label: "Système hydraulique fonctionnel", type: "gate", gateType: "AND", code: "B2",
              children: [
                { id: "sB21", label: "Pression disponible", type: "basic", code: "B2,1" },
                { id: "sB22", label: "Vannes actives", type: "basic", code: "B2,2" },
                { id: "sB23", label: "Vérins opérationnels", type: "basic", code: "B2,3" },
                { id: "sB24", label: "Orbitrol actif", type: "basic", code: "B2,4" },
                { id: "sB25", label: "Pompe double active", type: "basic", code: "B2,5" },
              ],
            },
            {
              id: "sB3", label: "AGS actif", type: "gate", gateType: "AND", code: "B3",
              children: [
                { id: "sB31", label: "Mode AGS sélectionné", type: "basic", code: "B3,1" },
                { id: "sB32", label: "Cabine correcte", type: "basic", code: "B3,2" },
                { id: "sB33", label: "Vitesse < 3 km/h", type: "basic", code: "B3,3" },
              ],
            },
          ],
        },
      ],
    },
    fmea: [
      { id: "sf1", component: "Pompe double", failureMode: "Défaillance", cause: "Usure interne", effect: "Perte de direction hydraulique", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Surveillance du débit de pompe" },
      { id: "sf2", component: "Pompe de direction", failureMode: "Débit faible", cause: "Usure interne", effect: "Réponse direction lente", severity: 4, occurrence: 3, detection: 2, rpn: 24, mitigation: "Analyse d'huile périodique" },
      { id: "sf3", component: "Valve DPX / PVG", failureMode: "Bloquée", cause: "Contamination", effect: "Direction verrouillée", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Filtration hydraulique et analyse d'huile" },
      { id: "sf4", component: "Solénoïde de valve", failureMode: "Défaillance", cause: "Bobine grillée", effect: "Pas de commutation de direction", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Diagnostic électrique embarqué" },
      { id: "sf5", component: "Orbitrol", failureMode: "Défaillance interne", cause: "Usure / contamination", effect: "Perte totale de direction", severity: 5, occurrence: 1, detection: 3, rpn: 15, mitigation: "Circuit de direction de secours" },
      { id: "sf6", component: "Vérin de direction (joint)", failureMode: "Fuite", cause: "Usure du joint", effect: "Force de direction réduite", severity: 3, occurrence: 3, detection: 2, rpn: 18, mitigation: "Planning de remplacement des joints" },
      { id: "sf7", component: "Flexible hydraulique", failureMode: "Rupture", cause: "Abrasion / vieillissement", effect: "Perte pression direction", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Protections et planning de remplacement" },
      { id: "sf8", component: "Processeur PLC", failureMode: "Défaillance processeur", cause: "Surchauffe / composant", effect: "Pas de commande électrique", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "PLC redondant" },
      { id: "sf9", component: "Capteur laser AGS", failureMode: "Encrassement", cause: "Poussière tunnel", effect: "Perte du guidage auto", severity: 3, occurrence: 3, detection: 2, rpn: 18, mitigation: "Nettoyage capteur et redondance" },
      { id: "sf10", component: "Capteur d'angle", failureMode: "Dérive", cause: "Usure / calibration", effect: "Direction incorrecte en mode Crabe", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Calibration périodique" },
      { id: "sf11", component: "Bus CAN direction", failureMode: "Défaillance communication", cause: "Câblage endommagé", effect: "Commande direction perdue", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "CAN redondant" },
    ],
    risks: [
      { id: "sr1", hazard: "Collision avec paroi du tunnel", severity: 5, probability: 2, riskLevel: "high" },
      { id: "sr2", hazard: "Direction verrouillée en opération", severity: 5, probability: 1, riskLevel: "medium" },
      { id: "sr3", hazard: "Déviation AGS du trajet", severity: 3, probability: 3, riskLevel: "high" },
      { id: "sr4", hazard: "Perte direction mode Crabe", severity: 4, probability: 2, riskLevel: "medium" },
    ],
    safetyFunctions: [
      { id: "ss1", function: "Circuit de direction de secours", plr: "d", category: "3", description: "Circuit hydraulique de secours pour direction d'urgence" },
      { id: "ss2", function: "Alarme déviation AGS", plr: "c", category: "2", description: "Alarme quand AGS détecte déviation au-delà du seuil" },
      { id: "ss3", function: "Surveillance retour direction", plr: "c", category: "2", description: "Retour de position continu des vérins de direction" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FIRE SYSTEM (Incendie) - From Excel Page 4
  // ═══════════════════════════════════════════════════════════
  {
    id: "fire",
    name: "Fire System",
    nameFr: "Incendie",
    icon: "Flame",
    topEvent: "Incendie incontrôlé dans le compartiment moteur",
    description: "Fire detection and suppression system with automatic, electrical, and manual activation. Worst case: fire starts AND automatic fails AND electrical fails AND manual fails.",
    consequences: [
      "Destruction de la machine",
      "Danger d'incendie dans le tunnel",
      "Blessure de l'opérateur",
      "Risque d'explosion",
    ],
    safetyMeasures: [
      "Système de suppression automatique",
      "Déclenchement électrique",
      "Déclenchement manuel",
      "Système d'alarme incendie",
    ],
    faultTree: {
      id: "ft",
      label: "Incendie incontrôlé dans le compartiment moteur",
      type: "top",
      children: [
        {
          id: "fA", label: "Incendie (Danger)", type: "gate", gateType: "OR", code: "A",
          children: [
            { id: "fA1", label: "Fuite hydraulique sur surface chaude", type: "basic", code: "A1" },
            { id: "fA2", label: "Défaut électrique", type: "basic", code: "A2" },
            { id: "fA3", label: "Surchauffe d'un composant", type: "basic", code: "A3" },
            { id: "fA4", label: "Allumage externe", type: "basic", code: "A4" },
          ],
        },
        {
          id: "fB", label: "Échec de la lutte contre l'incendie", type: "gate", gateType: "OR", code: "B",
          children: [
            {
              id: "fB1", label: "Défaillance de l'activation automatique", type: "gate", gateType: "OR", code: "B1",
              children: [
                { id: "fB11", label: "Défaillance de la vanne", type: "basic", code: "B1,1" },
              ],
            },
            {
              id: "fB2", label: "Défaillance électrique", type: "gate", gateType: "OR", code: "B2",
              children: [
                { id: "fB21", label: "Défaillance CAN ou Ethernet", type: "basic", code: "B2,1" },
                { id: "fB22", label: "Défaillance du PLC et du logiciel", type: "basic", code: "B2,2" },
                { id: "fB23", label: "Relais ou fusible grillé", type: "basic", code: "B2,3" },
                { id: "fB24", label: "Perte d'alimentation", type: "basic", code: "B2,4" },
              ],
            },
            {
              id: "fB3", label: "Défaillance de l'activation manuelle", type: "gate", gateType: "OR", code: "B3",
              children: [
                { id: "fB31", label: "Bouton manuel défectueux", type: "basic", code: "B3,1" },
                { id: "fB32", label: "Broche de connexion bloquée", type: "basic", code: "B3,2" },
                { id: "fB33", label: "Accès bloqué par un incendie", type: "basic", code: "B3,3" },
              ],
            },
            {
              id: "fB4", label: "Défaillance de la décharge d'extinction", type: "gate", gateType: "OR", code: "B4",
              children: [
                { id: "fB41", label: "Buse bloquée", type: "basic", code: "B4,1" },
                { id: "fB42", label: "Vanne bloquée en position fermée", type: "basic", code: "B4,2" },
                { id: "fB43", label: "Agent insuffisant (mousse + eau)", type: "basic", code: "B4,3" },
              ],
            },
          ],
        },
      ],
    },
    fmea: [
      { id: "ff1", component: "Circuit hydraulique (fuite)", failureMode: "Fuite sur surface chaude", cause: "Rupture flexible", effect: "Inflammation d'huile hydraulique", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Flexibles résistants au feu et inspection" },
      { id: "ff2", component: "Installation électrique", failureMode: "Court-circuit", cause: "Dommage d'isolation", effect: "Incendie électrique", severity: 4, occurrence: 2, detection: 3, rpn: 24, mitigation: "Disjoncteurs et câbles résistants au feu" },
      { id: "ff3", component: "Composant moteur", failureMode: "Surchauffe", cause: "Défaillance refroidissement", effect: "Source d'inflammation", severity: 5, occurrence: 2, detection: 2, rpn: 20, mitigation: "Surveillance thermique" },
      { id: "ff4", component: "Vanne activation automatique", failureMode: "Défaillance vanne", cause: "Blocage / corrosion", effect: "Pas de suppression automatique", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Test semestriel de la vanne" },
      { id: "ff5", component: "Communication CAN/Ethernet", failureMode: "Défaillance", cause: "Câblage / interférence", effect: "Pas de détection électrique", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Réseau redondant" },
      { id: "ff6", component: "PLC incendie", failureMode: "Défaillance logiciel", cause: "Bug / crash", effect: "Pas d'activation automatique", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "PLC de sécurité validé" },
      { id: "ff7", component: "Bouton manuel", failureMode: "Bouton défectueux", cause: "Usure / corrosion", effect: "Pas d'activation manuelle", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Test mensuel du bouton" },
      { id: "ff8", component: "Buse d'extinction", failureMode: "Buse bloquée", cause: "Obstruction", effect: "Agent non distribué", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "Inspection et nettoyage semestriel" },
      { id: "ff9", component: "Agent d'extinction", failureMode: "Quantité insuffisante", cause: "Fuite / non-rechargement", effect: "Extinction incomplète", severity: 5, occurrence: 1, detection: 1, rpn: 5, mitigation: "Vérification du niveau à chaque quart" },
      { id: "ff10", component: "Relais / fusible", failureMode: "Grillé", cause: "Surtension", effect: "Pas d'activation électrique", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Fusibles de rechange et monitoring" },
    ],
    risks: [
      { id: "fr1", hazard: "Incendie tunnel avec personnel piégé", severity: 5, probability: 2, riskLevel: "high" },
      { id: "fr2", hazard: "Emballement thermique batterie", severity: 5, probability: 1, riskLevel: "medium" },
      { id: "fr3", hazard: "Incendie d'huile hydraulique", severity: 5, probability: 2, riskLevel: "high" },
      { id: "fr4", hazard: "Explosion vapeur de carburant", severity: 5, probability: 1, riskLevel: "medium" },
    ],
    safetyFunctions: [
      { id: "fs1", function: "Suppression automatique incendie", plr: "d", category: "3", description: "Décharge automatique de l'agent extincteur sur détection" },
      { id: "fs2", function: "Activation manuelle incendie", plr: "c", category: "1", description: "Activation manuelle depuis la cabine opérateur" },
      { id: "fs3", function: "Système d'alarme incendie", plr: "c", category: "2", description: "Alarme sonore et visuelle avec arrêt automatique" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // PROPULSION SYSTEM (Translation) - From Excel Page 5
  // ═══════════════════════════════════════════════════════════
  {
    id: "propulsion",
    name: "Propulsion System",
    nameFr: "Translation",
    icon: "Zap",
    topEvent: "Mouvement translationnel incontrôlé de la machine",
    description: "Dual propulsion: diesel-hydraulic hydrostatic drive (A) and electric battery propulsion (B). Uncontrolled motion means involuntary movement OR inability to regulate speed.",
    consequences: [
      "Accélération soudaine",
      "Perte de contrôle",
      "Risque de collision",
      "Dommages à l'équipement",
    ],
    safetyMeasures: [
      "Pédale homme-mort",
      "Limitation de vitesse",
      "Système d'arrêt d'urgence",
      "Diagnostics ECU",
    ],
    faultTree: {
      id: "pt",
      label: "Mouvement translationnel incontrôlé de la machine",
      type: "top",
      children: [
        {
          id: "pA", label: "Défaillance de la propulsion électrique", type: "gate", gateType: "OR", code: "A",
          children: [
            {
              id: "pA1", label: "Défaillance du système de batterie", type: "gate", gateType: "OR", code: "A1",
              children: [
                { id: "pA11", label: "Instabilité de la tension de la batterie", type: "basic", code: "A1,1" },
                { id: "pA12", label: "Défaillance du contacteur", type: "basic", code: "A1,2" },
                { id: "pA13", label: "Panne du système de gestion de la batterie", type: "basic", code: "A1,3" },
                { id: "pA14", label: "Défaillance d'isolation", type: "basic", code: "A1,4" },
                { id: "pA15", label: "Défaillance du connecteur", type: "basic", code: "A1,5" },
              ],
            },
            {
              id: "pA2", label: "Défaillance de l'inverseur", type: "gate", gateType: "OR", code: "A2",
              children: [
                { id: "pA21", label: "Défaut électrique", type: "basic", code: "A2,1" },
                { id: "pA22", label: "Défaillance du connecteur", type: "basic", code: "A2,2" },
                { id: "pA23", label: "Défaillance CAN", type: "basic", code: "A2,3" },
                { id: "pA24", label: "Surchauffe inverseur", type: "basic", code: "A2,4" },
                { id: "pA25", label: "Perte d'alimentation", type: "basic", code: "A2,5" },
              ],
            },
            {
              id: "pA3", label: "Défaillance du moteur électrique et pompes", type: "gate", gateType: "OR", code: "A3",
              children: [
                { id: "pA31", label: "Défaillance du stator", type: "basic", code: "A3,1" },
                { id: "pA32", label: "Panne du rotor", type: "basic", code: "A3,2" },
                { id: "pA33", label: "Défaillance du réducteur", type: "basic", code: "A3,3" },
                { id: "pA34", label: "Court-circuit", type: "basic", code: "A3,4" },
                { id: "pA35", label: "Puissance insuffisante", type: "basic", code: "A3,5" },
                { id: "pA36", label: "Haute température de moteur", type: "basic", code: "A3,6" },
              ],
            },
            {
              id: "pA4", label: "Défaillance du système de refroidissement", type: "gate", gateType: "OR", code: "A4",
              children: [
                { id: "pA41", label: "Niveau de liquide de refroidissement bas", type: "basic", code: "A4,1" },
                { id: "pA42", label: "Ventilateur cassé", type: "basic", code: "A4,2" },
                { id: "pA43", label: "Défaillance du moteur du ventilateur", type: "basic", code: "A4,3" },
                { id: "pA44", label: "Défaillance de la pompe", type: "basic", code: "A4,4" },
                { id: "pA45", label: "Défaillance du fusible", type: "basic", code: "A4,5" },
              ],
            },
          ],
        },
        {
          id: "pB", label: "Défaillance de la propulsion thermique", type: "gate", gateType: "OR", code: "B",
          children: [
            {
              id: "pB1", label: "Défaillance du moteur diesel", type: "gate", gateType: "OR", code: "B1",
              children: [
                { id: "pB11", label: "Défaillance de l'ECU moteur", type: "basic", code: "B1,1" },
                { id: "pB12", label: "Panne de moteur", type: "basic", code: "B1,2" },
                { id: "pB13", label: "Défaillance du système de carburant", type: "basic", code: "B1,3" },
                { id: "pB14", label: "Défaillance du démarreur", type: "basic", code: "B1,4" },
                { id: "pB15", label: "Haute température lubrification/refroidissement", type: "basic", code: "B1,5" },
              ],
            },
            {
              id: "pB2", label: "Défaillance de la pompe hydrostatique", type: "gate", gateType: "OR", code: "B2",
              children: [
                { id: "pB21", label: "Défaillance du contrôle de déplacement", type: "basic", code: "B2,1" },
                { id: "pB22", label: "Plateau oscillant bloqué", type: "basic", code: "B2,2" },
                { id: "pB23", label: "Piston bloqué", type: "basic", code: "B2,3" },
                { id: "pB24", label: "Fuite de la pompe", type: "basic", code: "B2,4" },
                { id: "pB25", label: "Problème de gavage", type: "basic", code: "B2,5" },
              ],
            },
            {
              id: "pB3", label: "Défaillance du moteur de traction hydraulique", type: "gate", gateType: "OR", code: "B3",
              children: [
                { id: "pB31", label: "Fuite du moteur", type: "basic", code: "B3,1" },
                { id: "pB32", label: "Blocage du moteur", type: "basic", code: "B3,2" },
                { id: "pB33", label: "Basse pression hydraulique", type: "basic", code: "B3,3" },
                { id: "pB34", label: "Défaillance du joint", type: "basic", code: "B3,4" },
                { id: "pB35", label: "Surchauffe", type: "basic", code: "B3,5" },
              ],
            },
            {
              id: "pB4", label: "Défaillance de la distribution", type: "gate", gateType: "OR", code: "B4",
              children: [
                { id: "pB41", label: "Rupture de flexible", type: "basic", code: "B4,1" },
                { id: "pB42", label: "Contamination d'huile", type: "basic", code: "B4,2" },
                { id: "pB43", label: "Défaillance de solénoïde", type: "basic", code: "B4,3" },
              ],
            },
            { id: "pB5", label: "Défaillance du PLC", type: "basic", code: "B5" },
          ],
        },
      ],
    },
    fmea: [
      { id: "pf1", component: "Batterie (tension)", failureMode: "Instabilité tension", cause: "Cellule dégradée", effect: "Perte propulsion électrique", severity: 4, occurrence: 3, detection: 2, rpn: 24, mitigation: "BMS avec monitoring SOH" },
      { id: "pf2", component: "Batterie (contacteur)", failureMode: "Défaillance contacteur", cause: "Usure contacts", effect: "Pas d'alimentation", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Contacteur redondant" },
      { id: "pf3", component: "BMS", failureMode: "Panne BMS", cause: "Défaillance logiciel/matériel", effect: "Pas de protection batterie", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "BMS redondant" },
      { id: "pf4", component: "Inverseur", failureMode: "Défaut électrique", cause: "Défaillance IGBT", effect: "Perte propulsion électrique", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Diagnostics inverseur et protection thermique" },
      { id: "pf5", component: "Inverseur (CAN)", failureMode: "Défaillance CAN", cause: "Câblage endommagé", effect: "Pas de commande inverseur", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Bus CAN redondant" },
      { id: "pf6", component: "Moteur électrique (stator)", failureMode: "Défaillance stator", cause: "Court-circuit bobinage", effect: "Moteur inopérant", severity: 5, occurrence: 1, detection: 3, rpn: 15, mitigation: "Monitoring isolation" },
      { id: "pf7", component: "Moteur électrique (rotor)", failureMode: "Panne rotor", cause: "Roulement / équilibrage", effect: "Vibrations / arrêt moteur", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Analyse vibratoire" },
      { id: "pf8", component: "Réducteur", failureMode: "Défaillance réducteur", cause: "Usure engrenages", effect: "Pas de transmission", severity: 4, occurrence: 2, detection: 3, rpn: 24, mitigation: "Analyse d'huile et inspection" },
      { id: "pf9", component: "Système de refroidissement", failureMode: "Niveau liquide bas", cause: "Fuite", effect: "Surchauffe moteur", severity: 4, occurrence: 2, detection: 1, rpn: 8, mitigation: "Capteur de niveau" },
      { id: "pf10", component: "Ventilateur", failureMode: "Ventilateur cassé", cause: "Fatigue mécanique", effect: "Refroidissement insuffisant", severity: 3, occurrence: 2, detection: 2, rpn: 12, mitigation: "Inspection visuelle régulière" },
      { id: "pf11", component: "ECU moteur diesel", failureMode: "Défaillance ECU", cause: "Composant électronique", effect: "Moteur diesel inopérant", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "ECU double canal avec watchdog" },
      { id: "pf12", component: "Système de carburant", failureMode: "Défaillance alimentation", cause: "Filtre colmaté / pompe", effect: "Arrêt moteur diesel", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Filtre et maintenance préventive" },
      { id: "pf13", component: "Pompe hydrostatique", failureMode: "Plateau bloqué", cause: "Usure / contamination", effect: "Perte propulsion thermique", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Analyse d'huile et monitoring" },
      { id: "pf14", component: "Pompe hydrostatique (piston)", failureMode: "Piston bloqué", cause: "Contamination", effect: "Pompe inopérante", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Filtration haute performance" },
      { id: "pf15", component: "Moteur traction hydraulique", failureMode: "Fuite moteur", cause: "Joint défectueux", effect: "Perte de traction", severity: 4, occurrence: 3, detection: 2, rpn: 24, mitigation: "Surveillance pression et inspection" },
      { id: "pf16", component: "Moteur traction (blocage)", failureMode: "Blocage moteur", cause: "Contamination interne", effect: "Arrêt soudain", severity: 5, occurrence: 1, detection: 3, rpn: 15, mitigation: "Analyse d'huile régulière" },
      { id: "pf17", component: "Distribution (flexible)", failureMode: "Rupture flexible", cause: "Abrasion / vieillissement", effect: "Perte pression hydraulique", severity: 5, occurrence: 2, detection: 3, rpn: 30, mitigation: "Protection et remplacement planifié" },
      { id: "pf18", component: "Distribution (solénoïde)", failureMode: "Défaillance solénoïde", cause: "Bobine grillée", effect: "Pas de commutation", severity: 4, occurrence: 2, detection: 2, rpn: 16, mitigation: "Diagnostic électrique" },
      { id: "pf19", component: "PLC propulsion", failureMode: "Défaillance PLC", cause: "Bug / matériel", effect: "Perte commande propulsion", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "PLC de sécurité validé" },
      { id: "pf20", component: "Pédale homme-mort", failureMode: "Bloquée engagée", cause: "Coincement mécanique", effect: "Pas d'arrêt d'urgence", severity: 5, occurrence: 1, detection: 2, rpn: 10, mitigation: "Auto-test pédale et double contact" },
    ],
    risks: [
      { id: "pr1", hazard: "Accélération non intentionnelle", severity: 5, probability: 1, riskLevel: "medium" },
      { id: "pr2", hazard: "Perte de traction en pente", severity: 4, probability: 2, riskLevel: "medium" },
      { id: "pr3", hazard: "Collision par défaillance de commande", severity: 5, probability: 2, riskLevel: "high" },
      { id: "pr4", hazard: "Surchauffe moteur en tunnel", severity: 4, probability: 2, riskLevel: "medium" },
    ],
    safetyFunctions: [
      { id: "ps1", function: "Surveillance pédale homme-mort", plr: "d", category: "3", description: "Arrêt immédiat quand opérateur relâche la pédale" },
      { id: "ps2", function: "Système de limitation de vitesse", plr: "c", category: "2", description: "Limiteur de vitesse électronique selon mode d'opération" },
      { id: "ps3", function: "Circuit d'arrêt d'urgence", plr: "e", category: "4", description: "Arrêt d'urgence câblé avec contacts redondants" },
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
