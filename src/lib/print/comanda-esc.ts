// Client-side ESC/POS comanda ticket generator for 80mm thermal printer (~48 char columns)
// Uses Uint8Array instead of Buffer — runs in browser

const ESC = 0x1b;
const GS = 0x1d;

function bytes(...vals: number[]): Uint8Array {
  return new Uint8Array(vals);
}

// Encode text as CP1252 (Windows Latin-1) — supports ñ, á, é, í, ó, ú, etc.
// Characters outside CP1252 are replaced with '?'
function text(str: string): Uint8Array {
  const result = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // ASCII range (0x00-0x7F) — passes through directly
    // Latin-1 Supplement (0x80-0xFF) — same as CP1252 for common chars
    if (code <= 0xff) {
      result[i] = code;
    } else {
      result[i] = 0x3f; // '?'
    }
  }
  return result;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

// ESC/POS commands
const INIT = bytes(ESC, 0x40);
const CODEPAGE_1252 = bytes(ESC, 0x74, 0x10); // Select character code table: CP1252 (Windows Latin-1)
const CENTER = bytes(ESC, 0x61, 0x01);
const LEFT = bytes(ESC, 0x61, 0x00);
const BOLD_ON = bytes(ESC, 0x45, 0x01);
const BOLD_OFF = bytes(ESC, 0x45, 0x00);
const DOUBLE_HEIGHT = bytes(GS, 0x21, 0x01);
const NORMAL_SIZE = bytes(GS, 0x21, 0x00);
const FEED_3 = bytes(ESC, 0x64, 0x03);
const CUT = bytes(GS, 0x56, 0x00);
const LF = bytes(0x0a);

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

function line(char: string): Uint8Array {
  return text(char.repeat(COL_WIDTH) + "\n");
}

function columns(left: string, right: string): Uint8Array {
  const gap = COL_WIDTH - left.length - right.length;
  if (gap < 1) return text(left + " " + right + "\n");
  return text(left + " ".repeat(gap) + right + "\n");
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

export function generateComanda(data: ComandaData): Uint8Array {
  const parts: Uint8Array[] = [];

  // Initialize + set codepage for ñ/acentos
  parts.push(INIT);
  parts.push(CODEPAGE_1252);

  // Header
  parts.push(CENTER);
  parts.push(line("="));
  parts.push(BOLD_ON);
  parts.push(text("C O M A N D A\n"));
  parts.push(BOLD_OFF);
  parts.push(line("="));

  // Sale info
  parts.push(LEFT);
  parts.push(columns(`#${data.sale_id}`, saleTypeLabel(data.sale_type)));
  parts.push(text(timestamp() + "\n"));
  parts.push(LF);

  // Items
  parts.push(line("-"));
  for (const item of data.items) {
    const qty = `${item.quantity}x`;
    const price = formatCOP(item.price * item.quantity);
    parts.push(BOLD_ON);
    parts.push(columns(` ${qty} ${item.name}`, price));
    parts.push(BOLD_OFF);

    // Classify modifiers by group
    const toppings: ComandaModifier[] = [];
    const combo: ComandaModifier[] = []; // combo toggle + sub-selections
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
      parts.push(BOLD_ON);
      parts.push(columns(`    >> ${mod.name}`, modPrice));
      parts.push(BOLD_OFF);
    }

    // Toppings (one per line)
    for (const mod of toppings) {
      parts.push(text(`    + ${mod.name}\n`));
    }

    // Combo
    if (combo.length > 0) {
      const comboToggle = combo.find((c) => c.price > 0);
      const comboSubs = combo.filter((c) => c.price === 0);
      if (comboToggle) {
        parts.push(BOLD_ON);
        parts.push(columns(`    ** COMBO`, formatCOP(comboToggle.price)));
        parts.push(BOLD_OFF);
      }
      for (const sub of comboSubs) {
        parts.push(text(`       - ${sub.name}\n`));
      }
    }
  }
  parts.push(line("-"));

  // Total
  parts.push(BOLD_ON);
  parts.push(columns("TOTAL", formatCOP(data.total)));
  parts.push(BOLD_OFF);
  parts.push(line("-"));

  // Footer
  parts.push(text(`Cajero: ${data.cashier_name}\n`));
  parts.push(LF);
  parts.push(line("="));

  // Feed and cut
  parts.push(FEED_3);
  parts.push(CUT);

  return concat(...parts);
}
