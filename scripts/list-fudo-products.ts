import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const AUTH_URL = process.env.FUDO_AUTH_URL || "https://auth.fu.do/api";
const API_URL = process.env.FUDO_API_URL || "https://api.fu.do/v1alpha1";
const KEY = process.env.FUDO_API_KEY || "";
const SECRET = process.env.FUDO_API_SECRET || "";

async function main() {
  const authRes = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: KEY, apiSecret: SECRET }),
  });
  const { token } = await authRes.json();

  const res = await fetch(
    `${API_URL}/products?page[size]=500`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!res.ok) { console.error("Error:", JSON.stringify(data)); return; }
  for (const p of data.data) {
    console.log(
      `${p.id} | ${p.attributes.name} | $${p.attributes.price} | ${p.attributes.code || "-"}`
    );
  }
  console.log(`\nTotal: ${data.data.length}`);
}

main().catch(console.error);
