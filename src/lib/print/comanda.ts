// ESC/POS comanda ticket generator for 80mm thermal printer (~48 char columns)

const ESC = "\x1b";
const GS = "\x1d";

const INIT = `${ESC}\x40`; // Initialize printer
const CENTER = `${ESC}\x61\x01`;
const LEFT = `${ESC}\x61\x00`;
const BOLD_ON = `${ESC}\x45\x01`;
const BOLD_OFF = `${ESC}\x45\x00`;
const DOUBLE_HEIGHT = `${GS}\x21\x01`; // Double height only (width stays normal)
const NORMAL_SIZE = `${GS}\x21\x00`;
const FEED_3 = `${ESC}\x64\x03`;
const CUT = `${GS}\x56\x00`; // Full cut

const COL_WIDTH = 48;

export interface ComandaModifier {
  name: string;
  quantity: number;
  price: number;
  group_name?: string;
}

export interface ComandaItem {
  name: string;
  quantity: number;
  price: number;
  modifiers: ComandaModifier[];
}

export interface ComandaData {
  sale_id: string;
  sale_type: "TAKEAWAY" | "DINE_IN";
  items: ComandaItem[];
  total: number;
  cashier_name: string;
}

function formatCOP(amount: number): string {
  return `$${amount.toLocaleString("es-CO")}`;
}

function line(char: string): string {
  return char.repeat(COL_WIDTH) + "\n";
}

/** Right-pad left text + right-align right text to fill COL_WIDTH */
function columns(left: string, right: string): string {
  const gap = COL_WIDTH - left.length - right.length;
  if (gap < 1) return left + " " + right + "\n";
  return left + " ".repeat(gap) + right + "\n";
}

function saleTypeLabel(type: "TAKEAWAY" | "DINE_IN"): string {
  return type === "TAKEAWAY" ? "LLEVAR" : "MESA";
}

function timestamp(): string {
  const now = new Date();
  const d = now.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Bogota",
  });
  const t = now.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Bogota",
  });
  return `${d} ${t}`;
}

export function generateComanda(data: ComandaData): Buffer {
  let ticket = "";

  // Initialize
  ticket += INIT;

  // Header
  ticket += CENTER;
  ticket += line("=");
  ticket += BOLD_ON + DOUBLE_HEIGHT;
  ticket += "C O M A N D A\n";
  ticket += NORMAL_SIZE + BOLD_OFF;
  ticket += line("=");

  // Sale info
  ticket += LEFT;
  ticket += columns(`#${data.sale_id}`, saleTypeLabel(data.sale_type));
  ticket += timestamp() + "\n";
  ticket += "\n";

  // Items
  ticket += line("-");
  for (const item of data.items) {
    const qty = `${item.quantity}x`;
    const name = item.name;
    const price = formatCOP(item.price * item.quantity);
    ticket += BOLD_ON;
    ticket += columns(` ${qty} ${name}`, price);
    ticket += BOLD_OFF;

    // Classify modifiers by group
    const toppings: ComandaModifier[] = [];
    const combo: ComandaModifier[] = [];
    const premium: ComandaModifier[] = [];

    for (const mod of item.modifiers) {
      const gn = (mod.group_name || "").toLowerCase();
      if (gn.startsWith("combo")) {
        combo.push(mod);
      } else if (mod.price > 0) {
        premium.push(mod);
      } else {
        toppings.push(mod);
      }
    }

    // Premium (e.g. Tocineta)
    for (const mod of premium) {
      const modPrice = formatCOP(mod.price * mod.quantity);
      ticket += BOLD_ON;
      ticket += columns(`    >> ${mod.name}`, modPrice);
      ticket += BOLD_OFF;
    }

    // Toppings (one per line)
    for (const mod of toppings) {
      ticket += `    + ${mod.name}\n`;
    }

    // Combo
    if (combo.length > 0) {
      const comboToggle = combo.find((c) => c.price > 0);
      const comboSubs = combo.filter((c) => c.price === 0);
      if (comboToggle) {
        ticket += BOLD_ON;
        ticket += columns(`    ** COMBO`, formatCOP(comboToggle.price));
        ticket += BOLD_OFF;
      }
      for (const sub of comboSubs) {
        ticket += `       - ${sub.name}\n`;
      }
    }
  }
  ticket += line("-");

  // Total
  ticket += BOLD_ON + DOUBLE_HEIGHT;
  ticket += columns("TOTAL", formatCOP(data.total));
  ticket += NORMAL_SIZE + BOLD_OFF;
  ticket += line("-");

  // Footer
  ticket += `Cajero: ${data.cashier_name}\n`;
  ticket += "\n";
  ticket += line("=");

  // Feed and cut
  ticket += FEED_3;
  ticket += CUT;

  return Buffer.from(ticket, "binary");
}
