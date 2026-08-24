import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.post("/api/estimate", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "La clé OpenAI n’est pas configurée sur le serveur."
      });
    }

    const { text, meal } = req.body || {};
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Description du repas manquante." });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
Tu estimes des aliments pour un journal alimentaire personnel.
Réponds en français.

Règles:
- Sépare les principaux aliments consommés.
- Estime calories et protéines pour chacun.
- Si l'utilisateur donne une valeur exacte (ex: "pita 100 calories"), conserve cette valeur.
- Si quantité ou marque manque, prends une portion courante et indique clairement l'hypothèse.
- Pour café/thé sans sucre ni lait, utilise environ 0 à 5 kcal.
- N'ajoute aucun aliment qui n'a pas été mentionné.
- N'exagère pas la précision: les valeurs sont des estimations.
- Retourne UNIQUEMENT du JSON valide, sans markdown.

Format exact:
{
  "items": [
    {
      "name": "Nom de l'aliment",
      "calories": 123,
      "protein_g": 12,
      "note": "Hypothèse courte si nécessaire"
    }
  ]
}

Repas: ${meal || "non précisé"}
Texte utilisateur: ${text.trim()}
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      input: prompt
    });

    let raw = (response.output_text || "").trim();
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/,"").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("Réponse non JSON:", raw);
      return res.status(502).json({ error: "L’IA a retourné un format inattendu. Réessaie." });
    }

    if (!Array.isArray(parsed.items)) {
      return res.status(502).json({ error: "Réponse IA invalide." });
    }

    const items = parsed.items.slice(0, 30).map(x => ({
      name: String(x.name || "Aliment").slice(0, 120),
      calories: Math.max(0, Math.min(10000, Number(x.calories) || 0)),
      protein_g: Math.max(0, Math.min(1000, Number(x.protein_g) || 0)),
      note: String(x.note || "").slice(0, 250)
    }));

    res.json({ items });
  } catch (err) {
    console.error(err);
    const status = err?.status || 500;
    if (status === 401) {
      return res.status(500).json({ error: "La clé OpenAI configurée sur le serveur n’est pas valide." });
    }
    if (status === 429) {
      return res.status(429).json({ error: "Limite API atteinte. Réessaie dans un moment ou vérifie la facturation OpenAI." });
    }
    res.status(500).json({ error: "Impossible d’estimer pour le moment." });
  }
});

const port = Number(process.env.PORT || 10000);
app.listen(port, "0.0.0.0", () => {
  console.log(`Journal IA démarré sur le port ${port}`);
});
