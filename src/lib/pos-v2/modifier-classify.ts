import type { ModifierGroup } from "@/types/pos-v2";

/**
 * Premium group: has priced options and is NOT a combo.
 * Example: "Adición Tocineta" ($3,000)
 */
export function isPremiumGroup(g: ModifierGroup): boolean {
  return !g.name.startsWith("Combo") && g.options.some((o) => o.price > 0);
}

/**
 * Combo toggle group: starts with "Combo" and is the main toggle
 * (not a sub-selection like "Combo Acompañamiento" or "Combo Bebida").
 */
export function isComboToggleGroup(g: ModifierGroup): boolean {
  if (!g.name.startsWith("Combo")) return false;
  if (g.options.some((o) => o.price > 0)) return true;
  const lower = g.name.toLowerCase();
  return !lower.includes("acompañamiento") && !lower.includes("bebida");
}

/**
 * Combo sub-group: starts with "Combo" and contains sub-selection keywords.
 * Example: "Combo Acompañamiento", "Combo Bebida"
 */
export function isComboSubGroup(g: ModifierGroup): boolean {
  if (!g.name.startsWith("Combo")) return false;
  const lower = g.name.toLowerCase();
  return lower.includes("acompañamiento") || lower.includes("bebida");
}

/**
 * Normal group: everything that isn't premium, combo toggle, or combo sub.
 */
export function isNormalGroup(g: ModifierGroup): boolean {
  return !isPremiumGroup(g) && !isComboToggleGroup(g) && !isComboSubGroup(g);
}

/**
 * Classify all modifier groups into their categories.
 */
export function classifyModifierGroups(groups: ModifierGroup[]) {
  return {
    premium: groups.filter(isPremiumGroup),
    comboToggle: groups.find(isComboToggleGroup) ?? null,
    comboSub: groups.filter(isComboSubGroup),
    normal: groups.filter(isNormalGroup),
  };
}

/**
 * Clean premium option name for display: "Adición Tocineta" -> "CON TOCINETA"
 */
export function upsellLabel(name: string): string {
  return name.replace(/^adici[oó]n\s*/i, "con ");
}
