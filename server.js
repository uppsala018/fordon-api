import express from "express";

const app = express();
const port = process.env.PORT || 3000;

function clean(value) {
  if (!value) return null;
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchField(html, label) {
  const patterns = [
    new RegExp(`${label}<\\/span>\\s*<span[^>]*>(.*?)<\\/span>`, "i"),
    new RegExp(`${label}<\\/dt>\\s*<dd[^>]*>(.*?)<\\/dd>`, "i"),
    new RegExp(`${label}<\\/div>\\s*<div[^>]*>(.*?)<\\/div>`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return clean(match[1].replace(/<[^>]+>/g, ""));
    }
  }

  return null;
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/vehicle/:reg", async (req, res) => {
  const reg = req.params.reg.toUpperCase().replace(/\s+/g, "");

  try {
    const url = `https://biluppgifter.se/fordon/${reg}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await response.text();

    const make = matchField(html, "Fabrikat");
    const model = matchField(html, "Modell");
    const year = matchField(html, "Årsmodell");
    const color = matchField(html, "Färg");
    const fuel = matchField(html, "Drivmedel");
    const gearbox = matchField(html, "Växellåda");
    const vehicleType = matchField(html, "Fordonstyp");
    const inspection = matchField(html, "Besiktigad");
    const nextInspection = matchField(html, "Nästa besiktning");
    const inspectionStatus = matchField(html, "Besiktningsstatus");
    const ownerCount = matchField(html, "Antal ägare");
    const ownerType = matchField(html, "Typ av ägare");
    const taxStatus = matchField(html, "Fordonsskatt");
    const taxYear = matchField(html, "Årlig skatt");

    const hasAnyData = [
      make,
      model,
      year,
      color,
      fuel,
      gearbox,
      vehicleType,
      inspection,
      nextInspection,
      inspectionStatus,
      ownerCount,
      ownerType,
      taxStatus,
      taxYear
    ].some(Boolean);

    if (!hasAnyData) {
      return res.status(404).json({
        error: "not_found",
        message: "Ingen data hittades"
      });
    }

    res.json({
      registrationNumber: reg,
      make,
      model,
      year,
      color,
      fuel,
      gearbox,
      vehicleType,
      inspection,
      nextInspection,
      inspectionStatus,
      ownerCount,
      ownerType,
      taxStatus,
      taxYear,
      source: "biluppgifter.se"
    });
  } catch (error) {
    res.status(500).json({
      error: "error",
      message: "Kunde inte hämta data"
    });
  }
});

app.listen(port, () => {
  console.log("Server running");
});
