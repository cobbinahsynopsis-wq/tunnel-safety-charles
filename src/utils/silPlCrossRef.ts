/**
 * SIL/PL Cross-Reference Table — IEC 62061 SIL equivalence alongside PLr.
 * Per ISO 13849-1:2023 and IEC 62061:2021 mapping.
 */

export interface SILPLMapping {
  plr: string;
  sil: string;
  category: string;
  pfhRange: string;
  description: string;
  architectureRequirement: string;
}

export const silPlMappings: SILPLMapping[] = [
  {
    plr: "a",
    sil: "No SIL",
    category: "B",
    pfhRange: ">= 10^-5 to < 10^-4",
    description: "Basic safety measures, no specific SIL mapping",
    architectureRequirement: "Single channel, basic components",
  },
  {
    plr: "b",
    sil: "SIL 1",
    category: "1",
    pfhRange: ">= 3x10^-6 to < 10^-5",
    description: "Low probability of dangerous failure per hour",
    architectureRequirement: "Single channel with well-tried components",
  },
  {
    plr: "c",
    sil: "SIL 1",
    category: "2",
    pfhRange: ">= 10^-6 to < 3x10^-6",
    description: "SIL 1 upper range, periodic testing required",
    architectureRequirement: "Single channel with periodic testing",
  },
  {
    plr: "d",
    sil: "SIL 2",
    category: "3",
    pfhRange: ">= 10^-7 to < 10^-6",
    description: "Medium probability of dangerous failure per hour",
    architectureRequirement: "Dual channel with diagnostic coverage",
  },
  {
    plr: "e",
    sil: "SIL 3",
    category: "4",
    pfhRange: ">= 10^-8 to < 10^-7",
    description: "Very low probability of dangerous failure per hour",
    architectureRequirement: "Dual channel with high diagnostic coverage and fault tolerance",
  },
];
