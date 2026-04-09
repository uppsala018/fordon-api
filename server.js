import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/vehicle/:reg", async (req, res) => {
  const reg = req.params.reg.toUpperCase();

  try {
    const url = `https://biluppgifter.se/fordon/${reg}`;
    const response = await fetch(url);
    const html = await response.text();

    // enkel parsing (inte perfekt men funkar ibland)
    const makeMatch = html.match(/Fabrikat<\/span>\s*<span[^>]*>(.*?)<\/span>/);
    const modelMatch = html.match(/Modell<\/span>\s*<span[^>]*>(.*?)<\/span>/);

    const make = makeMatch ? makeMatch[1] : null;
    const model = modelMatch ? modelMatch[1] : null;

    if (!make && !model) {
      return res.status(404).json({
        error: "not_found",
        message: "Ingen data hittades"
      });
    }

    res.json({
      registrationNumber: reg,
      make,
      model,
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
