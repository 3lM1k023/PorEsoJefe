// transito-backend/articulos.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================
// Config: Python + modelo NLP
// =============================
const PYTHON_BIN = process.env.PYTHON_BIN || "python"; // o "py"
const NLP_DIR = path.resolve(__dirname, "..", "nlp");
const PREDICT_SCRIPT = path.join(NLP_DIR, "predict_intent.py");

// Thresholds
const INTENT_CONF_MIN = Number(process.env.INTENT_CONF_MIN || 0.65); // recomendado 0.65~0.75

// =============================
// Utilidades texto
// =============================
function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function unique(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}
function flattenToText(value, out = []) {
  if (value == null) return out;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    out.push(String(value));
    return out;
  }
  if (Array.isArray(value)) {
    for (const v of value) flattenToText(v, out);
    return out;
  }
  if (typeof value === "object") {
    for (const k of Object.keys(value)) flattenToText(value[k], out);
    return out;
  }
  return out;
}
function hasAny(tNorm, keywords) {
  return keywords.some((k) => tNorm.includes(k));
}
function escapeRx(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// =============================
// 0) Llamar al modelo ML (Python)
// =============================
function predictIntentML(texto) {
  return new Promise((resolve) => {
    // Validaciones mínimas
    if (!fs.existsSync(PREDICT_SCRIPT)) {
      return resolve({ intent: null, confidence: 0.0, top: [], error: "predict_intent.py no encontrado" });
    }

    const py = spawn(PYTHON_BIN, [PREDICT_SCRIPT, texto, "5"], {
      cwd: path.resolve(__dirname, ".."), // raíz del proyecto
      windowsHide: true,
    });

    let out = "";
    let err = "";

    py.stdout.on("data", (d) => (out += d.toString("utf-8")));
    py.stderr.on("data", (d) => (err += d.toString("utf-8")));

    py.on("close", (code) => {
      if (code !== 0) {
        return resolve({
          intent: null,
          confidence: 0.0,
          top: [],
          error: `Python exit=${code} stderr=${err.trim()}`,
        });
      }

      try {
        const obj = JSON.parse(out.trim());
        const intent = obj.intent ? normalizeText(obj.intent) : null;
        const confidence = typeof obj.confidence === "number" ? obj.confidence : 0.0;
        const top = Array.isArray(obj.top) ? obj.top : [];
        resolve({ intent, confidence, top, error: obj.error || null });
      } catch (e) {
        resolve({
          intent: null,
          confidence: 0.0,
          top: [],
          error: `No pude parsear JSON de Python. Salida: ${out.slice(0, 200)}`,
        });
      }
    });
  });
}

// =============================
// 1) Cargar artículos (carpeta correcta)
// =============================
function loadAllArticles() {
  const ARTICULOS_DIR = path.resolve(__dirname, "..", "articulos");
  if (!fs.existsSync(ARTICULOS_DIR)) throw new Error(`No existe la carpeta de artículos: ${ARTICULOS_DIR}`);

  const files = fs.readdirSync(ARTICULOS_DIR).filter((f) => f.endsWith(".json"));
  const all = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(ARTICULOS_DIR, f), "utf-8");
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) for (const a of arr) all.push(a);
  }
  console.log(`✔ Artículos cargados: ${all.length}`);
  return all;
}

const ARTICLES = loadAllArticles();

// =============================
// 2) Índice
// =============================
function buildIndex(articles) {
  return articles.map((a) => {
    const intents = (a.intents || []).map(normalizeText);

    const titulo = normalizeText(a.titulo || "");
    const descripcion = normalizeText(a.descripcion || "");
    const explicacion = normalizeText(a.explicacion_clara || "");

    const obligaciones = flattenToText(a.obligaciones || []).map(normalizeText);
    const prohibiciones = flattenToText(a.prohibiciones || []).map(normalizeText);
    const sanciones = flattenToText(a.sanciones || []).map(normalizeText);
    const contenido = flattenToText(a.contenido || a.texto || "").map(normalizeText);
    const estructura = flattenToText(a.estructura_registro || {}).map(normalizeText);

    const extras = flattenToText({
      sujeto: a.sujeto,
      autoridad_responsable: a.autoridad_responsable,
      medida: a.medida,
      coordinacion: a.coordinacion,
      procedimiento: a.procedimiento,
      requisitos: a.requisitos,
      tipo: a.tipo,
    }).map(normalizeText);

    const bag = unique([
      ...intents,
      titulo,
      descripcion,
      explicacion,
      ...obligaciones,
      ...prohibiciones,
      ...sanciones,
      ...contenido,
      ...estructura,
      ...extras,
    ]).filter((x) => x && x.length >= 3);

    const regexes = bag
      .filter((s) => s.length <= 60)
      .map((s) => new RegExp(`\\b${escapeRx(s)}\\b`, "i"));

    const tokens = unique(bag.join(" ").split(/\s+/).filter((t) => t.length >= 4));

    return { art: a, intents, titulo, tokens, regexes };
  });
}

const INDEX = buildIndex(ARTICLES);

// =============================
// 3) Scoring (usa intent ML si existe y es confiable)
// =============================
function scoreArticle(userTextNorm, entry, predictedIntent = null, intentConfidence = 0.0) {
  let score = 0;

  // Si el intent es confiable, lo usamos fuerte
  const useIntent = predictedIntent && intentConfidence >= INTENT_CONF_MIN;

  if (useIntent && entry.intents?.length) {
    if (entry.intents.includes(predictedIntent)) score += 4.0;
    else score -= 2.0;
  }

  for (const rx of entry.regexes) if (rx.test(userTextNorm)) score += 0.6;
  for (const t of entry.tokens) if (userTextNorm.includes(t)) score += 0.15;

  if (entry.titulo && userTextNorm.includes(entry.titulo)) score += 1.5;
  if (entry.art.aplicable_en_infracciones) score += 0.4;

  return score;
}

// =============================
// 4) Slot por reglas (general)
// =============================
function detectSlotGeneral(tNorm) {
  if (hasAny(tNorm, ["quien", "autoridad", "responsable", "a cargo"])) return "responsable";
  if (hasAny(tNorm, ["que datos", "incluye", "obligacion", "requisitos", "documentos"])) return "contenido";
  if (hasAny(tNorm, ["prohibido", "no se puede", "restriccion"])) return "prohibicion";
  if (hasAny(tNorm, ["multa", "sancion", "pago", "castigo"])) return "sancion";
  if (hasAny(tNorm, ["procedimiento", "como", "tramite", "que procede", "recurso", "impugnar"])) return "procedimiento";
  if (hasAny(tNorm, ["donde", "consultar", "estadisticas", "indice"])) return "acceso_consulta";
  return "general";
}

// =============================
// 5) Vista del artículo (sin inventar campos)
// =============================
function buildArticuloView(art, slot) {
  const base = {
    articulo: art.articulo,
    titulo: art.titulo,
    tipo: art.tipo || "desconocido",
    intents: art.intents || [],
    descripcion: art.descripcion || "",
    explicacion_clara: art.explicacion_clara || "",
    aplicable_en_infracciones: Boolean(art.aplicable_en_infracciones),
  };

  const detalle = {};

  if (slot === "responsable" || slot === "general") {
    if (art.sujeto) detalle.sujeto = art.sujeto;
    if (art.autoridad_responsable) detalle.autoridad_responsable = art.autoridad_responsable;
    if (art.coordinacion) detalle.coordinacion = art.coordinacion;
  }

  if (slot === "contenido" || slot === "general") {
    if (art.obligaciones) detalle.obligaciones = art.obligaciones;
    if (art.estructura_registro) detalle.estructura_registro = art.estructura_registro;
    if (art.requisitos) detalle.requisitos = art.requisitos;
    if (art.contenido) detalle.contenido = art.contenido;
    if (art.texto) detalle.texto = art.texto;
  }

  if (slot === "prohibicion" || slot === "general") {
    if (art.prohibiciones) detalle.prohibiciones = art.prohibiciones;
  }

  if (slot === "sancion" || slot === "general") {
    if (art.sanciones) detalle.sanciones = art.sanciones;
    if (art.multa) detalle.multa = art.multa;
  }

  if (slot === "procedimiento" || slot === "general") {
    if (art.procedimiento) detalle.procedimiento = art.procedimiento;
    if (art.documentos) detalle.documentos = art.documentos;
    if (art.plazos) detalle.plazos = art.plazos;
  }

  if (Object.keys(detalle).length === 0) {
    if (art.obligaciones) detalle.obligaciones = art.obligaciones;
    else if (art.contenido) detalle.contenido = art.contenido;
    else if (art.texto) detalle.texto = art.texto;
  }

  return { ...base, slot, detalle };
}

// =============================
// 6) Endpoint
// =============================
app.post("/nlp/analizar", async (req, res) => {
  const texto = String(req.body?.texto || "").trim();
  if (!texto) return res.status(400).json({ error: 'Falta "texto"' });

  const tNorm = normalizeText(texto);

  // Aquí entra el modelo ML (Python)
  const ml = await predictIntentML(texto);
  const predictedIntent = ml.intent;
  const intentConfidence = ml.confidence || 0.0;

  const scored = INDEX.map((e) => ({
    entry: e,
    score: scoreArticle(tNorm, e, predictedIntent, intentConfidence),
  })).sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3);
  const best = top[0];

  if (!best || best.score < 1.0) {
    return res.json({
      intent: predictedIntent || "desconocido",
      intent_confidence: intentConfidence,
      confidence: 0.2,
      articulo: null,
      ml_error: ml.error || null,
      top_intents: ml.top || [],
      razonamiento: "No se encontraron coincidencias suficientes.",
      aviso: "No es asesoría legal. Verifica el reglamento vigente.",
    });
  }

  const slot = detectSlotGeneral(tNorm);
  const articuloView = buildArticuloView(best.entry.art, slot);

  return res.json({
    intent: predictedIntent || "articulo_relevante",
    intent_confidence: intentConfidence,
    confidence: Math.min(0.95, 0.45 + best.score * 0.08),
    infraccion: Boolean(best.entry.art.aplicable_en_infracciones),
    articulo: articuloView,
    top: top.map((x) => ({
      articulo: x.entry.art.articulo,
      titulo: x.entry.art.titulo,
      score: x.score,
    })),
    top_intents: ml.top || [],
    ml_error: ml.error || null,
    razonamiento: `Score(${best.score.toFixed(2)}), slot=${slot}, useIntent=${
      predictedIntent && intentConfidence >= INTENT_CONF_MIN
    }.`,
    aviso: "No es asesoría legal. Verifica el reglamento vigente.",
  });
});

// =============================
// Arranque
// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`TransitoVial backend listo en http://localhost:${PORT}`);
  console.log(`NLP script: ${PREDICT_SCRIPT}`);
});
