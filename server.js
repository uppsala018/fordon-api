import express from "express";

const app = express();
const port = process.env.PORT || 3000;

function clean(value) {
  if (!value) return null;

  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value) {
  if (!value) return null;
  return clean(value.replace(/<[^>]*>/g, ""));
}

function matchField(html, label) {
  const safeLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    new RegExp(`${safeLabel}<\\/span>\\s*<span[^>]*>(.*?)<\\/span>`, "is"),
    new RegExp(`${safeLabel}<\\/dt>\\s*<dd[^>]*>(.*?)<\\/dd>`, "is"),
    new RegExp(`${safeLabel}<\\/div>\\s*<div[^>]*>(.*?)<\\/div>`, "is"),
    new RegExp(`>${safeLabel}<[^>]*>\\s*<[^>]+>(.*?)<\\/[^>]+>`, "is")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return stripTags(match[1]);
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
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8"
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

    const drivingBan = matchField(html, "Körförbud");
    const debt = matchField(html, "Skuld");
    const debtAmount = matchField(html, "Skuldsaldo");

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
      taxYear,
      drivingBan,
      debt,
      debtAmount
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
      drivingBan,
      debt,
      debtAmount,
      source: "biluppgifter.se"
    });
  } catch (error) {
    console.error("Lookup failed:", error);

    res.status(500).json({
      error: "error",
      message: "Kunde inte hämta data"
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
