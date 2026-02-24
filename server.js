const path = require("path");
const express = require("express");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, "public");

// Serves the frontend files in /public
app.use(express.static(publicDir));

function getRequiredEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Upstream request failed: ${response.status}`);
  }

  return response.json();
}

// Frontend calls this route instead of calling Giphy directly
app.get("/api/giphy/search", async function (req, res) {
  const query = String(req.query.query || "").trim();
  const apiKey = getRequiredEnv("GIPHY_API_KEY");

  if (!query) {
    return res.status(400).json({ error: "Missing query" });
  }

  if (!apiKey) {
    return res.status(503).json({ error: "Giphy API key is not configured" });
  }

  try {
    const giphyUrl = new URL("https://api.giphy.com/v1/gifs/search");
    giphyUrl.searchParams.set("q", query);
    giphyUrl.searchParams.set("limit", "25");
    giphyUrl.searchParams.set("rating", "g");
    giphyUrl.searchParams.set("lang", "en");
    giphyUrl.searchParams.set("sort", "relevant");
    giphyUrl.searchParams.set("api_key", apiKey);

    const data = await fetchJson(giphyUrl);
    return res.json(data);
  } catch (error) {
    console.error("Giphy proxy error:", error.message);
    return res.status(502).json({ error: "Failed to load Giphy results" });
  }
});

// Frontend calls this route instead of calling NYT directly
app.get("/api/nyt/articles", async function (req, res) {
  const drink = String(req.query.drink || "").trim();
  const apiKey = getRequiredEnv("NYT_API_KEY");

  if (!drink) {
    return res.status(400).json({ error: "Missing drink" });
  }

  if (!apiKey) {
    return res
      .status(503)
      .json({ error: "NYT API key is not configured" });
  }

  try {
    const nytUrl = new URL(
      "https://api.nytimes.com/svc/search/v2/articlesearch.json"
    );
    nytUrl.searchParams.set("q", `${drink} cocktail`);
    nytUrl.searchParams.set("api-key", apiKey);

    const data = await fetchJson(nytUrl);
    return res.json(data);
  } catch (error) {
    console.error("NYT proxy error:", error.message);
    return res.status(502).json({ error: "Failed to load NYT articles" });
  }
});

// Any other route loads the main page
app.get("*", function (req, res) {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, function () {
  console.log(`WikiDrinks running at http://localhost:${PORT}`);
});
