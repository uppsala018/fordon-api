import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/vehicle/:reg", (req, res) => {
  const reg = req.params.reg.toUpperCase();

  // enkel testdata
  if (reg === "ABC123") {
    return res.json({
      registrationNumber: "ABC123",
      make: "Volvo",
      model: "XC60"
    });
  }

  return res.status(404).json({
    error: "not_found",
    message: "Fordon hittades inte"
  });
});

app.listen(port, () => {
  console.log("Server running");
});
