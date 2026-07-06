import type { Company } from "@/lib/types/domain";

/**
 * Lightweight fuzzy company suggestion for unmatched transactions (bonus).
 * Uses the Sørensen–Dice bigram coefficient on names with legal-form prefixes
 * and parenthetical qualifiers stripped — so e.g. "გეოტრანსი (ფილიალი)" scores
 * highly against "შპს გეოტრანსი".
 */

const LEGAL_PREFIXES = ["შპს", "სს", "ი/მ", "ი.მ", "იმ"];

function normalize(name: string): string {
  let result = name.toLowerCase().trim();
  for (const prefix of LEGAL_PREFIXES) {
    if (result.startsWith(prefix)) {
      result = result.slice(prefix.length).trim();
      break;
    }
  }
  return result.replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim();
}

function bigrams(value: string): Set<string> {
  const grams = new Set<string>();
  for (let i = 0; i < value.length - 1; i += 1) {
    grams.add(value.slice(i, i + 2));
  }
  return grams;
}

function diceCoefficient(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0;
  if (a === b) return 1;
  const first = bigrams(a);
  const second = bigrams(b);
  if (first.size === 0 || second.size === 0) return 0;
  let overlap = 0;
  for (const gram of first) {
    if (second.has(gram)) overlap += 1;
  }
  return (2 * overlap) / (first.size + second.size);
}

export interface CompanySuggestion {
  company: Company;
  score: number;
}

/** Best-matching company for a sender name, or null if none clears `threshold`. */
export function suggestCompany(
  senderName: string | null,
  companies: readonly Company[],
  threshold = 0.4,
): CompanySuggestion | null {
  if (!senderName) return null;
  const target = normalize(senderName);
  if (target.length === 0) return null;

  let best: CompanySuggestion | null = null;
  for (const company of companies) {
    const score = diceCoefficient(target, normalize(company.name));
    if (!best || score > best.score) best = { company, score };
  }

  return best && best.score >= threshold ? best : null;
}
