import express from "express";
import path from "path";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Google GenAI client
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Python Architecture & Live Bridge Endpoints
app.get("/api/python/status", (req, res) => {
  res.json({
    status: "ok",
    python_version: "Python 3.10.12",
    modules: [
      "python_janvani/app.py (FastAPI)",
      "python_janvani/standalone_server.py (Zero-dependency HTTP Server)",
      "python_janvani/gemini_service.py (Gemini 3.6 Multimodal Triage)",
      "python_janvani/whatsapp_service.py (WhatsApp Seva Gateway)",
      "python_janvani/cli.py (Interactive Terminal CLI)",
      "python_janvani/models.py (Civic Entity Schemas)"
    ],
    runtime: "Python 3 Native Native Execution",
    gemini_model: "gemini-3.6-flash",
    timestamp: new Date().toISOString()
  });
});

app.post("/api/python/triage", (req, res) => {
  const { input, imageBase64, language } = req.body || {};
  const payload = JSON.stringify({
    action: "triage",
    text: input || "",
    image_base64: imageBase64 || null,
    language: language || "English"
  });

  const py = spawn("python3", ["python_janvani/bridge.py"]);
  let stdoutData = "";
  let stderrData = "";

  py.stdout.on("data", (chunk) => {
    stdoutData += chunk;
  });
  py.stderr.on("data", (chunk) => {
    stderrData += chunk;
  });

  py.on("close", (code) => {
    if (stdoutData) {
      try {
        const parsed = JSON.parse(stdoutData.trim());
        return res.json(parsed);
      } catch (e) {
        return res.json({ success: true, source: "Python 3.10 Engine", raw: stdoutData });
      }
    }
    return res.status(500).json({ success: false, error: stderrData || "Python process failed" });
  });

  py.stdin.write(payload);
  py.stdin.end();
});

app.post("/api/python/copilot", (req, res) => {
  const { message, language } = req.body || {};
  const payload = JSON.stringify({
    action: "copilot",
    message: message || "",
    language: language || "English"
  });

  const py = spawn("python3", ["python_janvani/bridge.py"]);
  let stdoutData = "";
  let stderrData = "";

  py.stdout.on("data", (chunk) => {
    stdoutData += chunk;
  });
  py.stderr.on("data", (chunk) => {
    stderrData += chunk;
  });

  py.on("close", (code) => {
    if (stdoutData) {
      try {
        const parsed = JSON.parse(stdoutData.trim());
        return res.json(parsed);
      } catch (e) {
        return res.json({ success: true, source: "Python 3.10 Engine", reply: stdoutData });
      }
    }
    return res.status(500).json({ success: false, error: stderrData || "Python process failed" });
  });

  py.stdin.write(payload);
  py.stdin.end();
});

// Grievance Upvote Registry (Server-side single-vote enforcement)
const grievanceUpvotesRegistry = new Set<string>();
const grievanceUpvoteCounts = new Map<string, number>();

app.post("/api/grievances/:id/upvote", (req, res) => {
  const { id } = req.params;
  const rawUserId = req.body?.userId || req.headers["x-user-id"] || req.ip || "anonymous_citizen";
  const userId = String(rawUserId).trim();
  const userKey = `${id}:::${userId}`;

  // Check if user has already supported this grievance
  if (grievanceUpvotesRegistry.has(userKey)) {
    return res.status(409).json({
      success: false,
      alreadySupported: true,
      message: "You have already supported this grievance. Each citizen can support an issue only once.",
      grievanceId: id,
      upvotes: grievanceUpvoteCounts.get(id) ?? Number(req.body?.currentUpvotes || 0),
      hasUpvoted: true,
    });
  }

  // Record vote
  grievanceUpvotesRegistry.add(userKey);
  const baseCount = Number(req.body?.currentUpvotes || 0);
  const updatedCount = (grievanceUpvoteCounts.get(id) ?? baseCount) + 1;
  grievanceUpvoteCounts.set(id, updatedCount);

  return res.json({
    success: true,
    message: "Grievance supported successfully.",
    grievanceId: id,
    upvotes: updatedCount,
    hasUpvoted: true,
  });
});

app.get("/api/grievances/upvotes-status", (req, res) => {
  const rawUserId = req.query.userId || req.headers["x-user-id"] || req.ip || "anonymous_citizen";
  const userId = String(rawUserId).trim();
  const upvotedIds: string[] = [];

  grievanceUpvotesRegistry.forEach((entry) => {
    const [gId, uId] = entry.split(":::");
    if (uId === userId) {
      upvotedIds.push(gId);
    }
  });

  return res.json({
    success: true,
    upvotedIds,
  });
});

// 2. AI Triage Endpoint (Auto-categorize, severity 1-10, department, SLA, keywords)
app.post("/api/gemini/triage", async (req, res) => {
  const { input, imageBase64, language } = req.body || {};

  const getFallbackTriage = () => {
    const text = (input || "").toLowerCase();
    let category = "Roads & Potholes";
    let department = "Public Works Department (PWD) / Municipal Corporation";
    let severity = 8;
    let sla = 48;

    if (/garbage|waste|clean|trash|kachra|safai|dump/i.test(text)) {
      category = "Garbage & Sanitation";
      department = "Solid Waste Management Division";
      severity = 7;
      sla = 24;
    } else if (/water|pipe|leak|pani|nal|supply/i.test(text)) {
      category = "Drinking Water & Pipeline Leakage";
      department = "Water Supply & Sewerage Board (Jal Nigam)";
      severity = 8;
      sla = 24;
    } else if (/wire|electric|transformer|bijli|pole|current|shock/i.test(text)) {
      category = "Electricity Hazard & Wiring";
      department = "State Electricity Distribution Corp (Discom)";
      severity = 9;
      sla = 24;
    } else if (/drain|sewer|nullah|gutter|waterlog|flood/i.test(text)) {
      category = "Sewage & Drain Overflow";
      department = "Municipal Drainage & Stormwater Wing";
      severity = 8;
      sla = 48;
    } else if (/light|streetlight|andhera|lamp/i.test(text)) {
      category = "Streetlight Breakdown";
      department = "Municipal Electrical & Streetlighting Wing";
      severity = 6;
      sla = 48;
    } else if (/fog|mosquito|dengue|malaria|health|hospital/i.test(text)) {
      category = "Public Health & Fogging";
      department = "Municipal Health & Vector Control Cell";
      severity = 7;
      sla = 48;
    }

    return {
      category,
      severityScore: severity,
      suggestedTitle: input ? input.slice(0, 60) : "Civic Infrastructure Defect",
      department,
      targetSlaHours: sla,
      landmarkExtracted: "Ward Sector Area",
      riskAnalysis: "Public safety priority assessed by JanVani Triage Engine.",
      urgencyLevel: severity >= 8 ? "CRITICAL" : "HIGH",
    };
  };

  try {
    const ai = getAI();
    if (!ai) {
      return res.json(getFallbackTriage());
    }

    const systemPrompt = `You are the JanVani National Civic Grievance Triage AI engine for the Government of India.
Analyze the citizen grievance input (and optional image).
Return a JSON response with:
- category: one of ["Roads & Potholes", "Garbage & Sanitation", "Drinking Water & Pipeline Leakage", "Electricity Hazard & Wiring", "Sewage & Drain Overflow", "Streetlight Breakdown", "Public Health & Fogging", "Illegal Encroachments"]
- severityScore: integer 1 to 10 (10 = life threatening / critical infrastructure hazard)
- suggestedTitle: concise, clear administrative title (max 12 words)
- department: exact municipal department responsible (e.g., "Public Works Department (PWD)", "Solid Waste Management Division", "Water Supply & Sewerage Board", "State Electricity Distribution Corp")
- targetSlaHours: integer (24, 48, or 72 based on urgency)
- landmarkExtracted: extracted landmark or location cues if mentioned
- riskAnalysis: 1-2 sentence assessment of public health/safety risk
- urgencyLevel: "CRITICAL", "HIGH", "MEDIUM", or "NORMAL"`;

    const contents: any[] = [];
    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        },
      });
    }
    contents.push({
      text: `Citizen Grievance Report (Language: ${language || "English/Hindi"}):\n"${input || "Citizen uploaded image proof for municipal grievance triage."}"\nProvide output strictly in JSON format.`,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch {
      return res.json(getFallbackTriage());
    }
  } catch (error: any) {
    console.warn("Triage API notice (using smart rules):", error?.message || error);
    return res.json(getFallbackTriage());
  }
});

// 2.1 AI Semantic Validation & Auto-Categorization Endpoint
app.post("/api/gemini/validate-grievance", async (req, res) => {
  const { description = "", title = "", category = "" } = req.body || {};
  const fullText = `${title ? title + " - " : ""}${description}`.trim();

  // Smart fallback classifier
  const runFallbackValidation = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        isValid: false,
        rejectionMessage: "This doesn't appear to be a valid civic issue. Please describe a specific problem you'd like to report.",
        category: category || "Other",
      };
    }

    const lower = trimmed.toLowerCase();

    // Check for spam, greetings, testing, or casual chat
    const isSpamOrGreeting =
      /^(hi|hello|hey|namaste|pranam|test|testing|test 123|123|abc|asdf|qwerty|how are you|kya haal|good morning|good evening|yo|lol|ok|okay|nice|cool|hi there|checking)$/i.test(
        lower
      ) ||
      (/^(hello|hi|hey|test)\b/i.test(lower) && lower.length < 20 && !/(road|light|water|wire|pipe|pothole|garbage|drain|sewer)/i.test(lower));

    // Common non-civic phrases
    const isNonCivicChat =
      /^(i like|who are you|tell me a joke|weather today|cricket score|recipe|song|movie|football|what is your name)/i.test(
        lower
      );

    // Civic keywords
    const hasCivicKeywords =
      /(sadak|road|pothole|gaddha|khadda|crack|asphalt|culvert|traffic|bridge|speed breaker|kachra|kuda|garbage|waste|clean|safai|dump|badboo|smell|gandagi|dustbin|pani|paani|water|pipe|leak|pipeline|nal|supply|tanker|borewell|contamination|bijli|electric|wire|taar|transformer|pole|spark|current|shock|light|streetlight|andhera|roshni|lamp|naali|drain|sewer|nullah|gutter|waterlog|keechad|overflow|choke|machhar|mosquito|dengue|malaria|fogging|dawa|hospital|health|kabza|encroach|illegal|thela|footpath|block|hawker|broken|hazard|damage|repair)/i.test(
        lower
      );

    if (isSpamOrGreeting || isNonCivicChat || (!hasCivicKeywords && lower.length < 15)) {
      return {
        isValid: false,
        rejectionMessage:
          "This doesn't appear to be a valid civic issue. Please describe a specific problem you'd like to report.",
        category: "Other",
      };
    }

    // Auto-categorize accurately
    let detectedCategory = "Other";
    if (/road|pothole|asphalt|sadak|gaddha|khadda|culvert|bridge|traffic/i.test(lower)) {
      detectedCategory = "Roads & Potholes";
    } else if (/garbage|waste|clean|safai|kachra|kuda|dump|dustbin|badboo|gandagi/i.test(lower)) {
      detectedCategory = "Garbage & Sanitation";
    } else if (/water|pipe|leak|pipeline|nal|paani|pani|tanker|borewell/i.test(lower)) {
      detectedCategory = "Drinking Water & Pipeline Leakage";
    } else if (/wire|electric|transformer|bijli|pole|current|spark|shock/i.test(lower)) {
      detectedCategory = "Electricity Hazard & Wiring";
    } else if (/drain|sewer|nullah|gutter|waterlog|naali|keechad|overflow|choke/i.test(lower)) {
      detectedCategory = "Sewage & Drain Overflow";
    } else if (/streetlight|light|andhera|lamp|roshni/i.test(lower)) {
      detectedCategory = "Streetlight Breakdown";
    } else if (/mosquito|dengue|malaria|fogging|machhar|dawa|health/i.test(lower)) {
      detectedCategory = "Public Health & Fogging";
    } else if (/encroach|illegal|thela|footpath|kabza|hawker/i.test(lower)) {
      detectedCategory = "Illegal Encroachments";
    }

    return {
      isValid: true,
      category: detectedCategory,
      rejectionMessage: null,
      suggestedTitle: trimmed.slice(0, 60),
    };
  };

  try {
    const ai = getAI();
    if (!ai) {
      return res.json(runFallbackValidation(fullText));
    }

    const systemPrompt = `You are the JanVani AI Semantic Civic Grievance Validator for India's National Governance System.
Analyze the user's input to determine if it is a GENUINE civic or municipal infrastructure issue.

RULES:
1. BLOCK SPAM / MEANINGLESS / NON-CIVIC INPUTS:
   - Block random greetings ("Hello", "hi", "hey there"), testing words ("test", "testing 123", "test case"), gibberish ("asdfgh", "qwerty123"), or casual non-civic chat ("what is the capital of France", "I love biryani", "how are you today").
   - For these invalid inputs, set "isValid": false and "rejectionMessage": "This doesn't appear to be a valid civic issue. Please describe a specific problem you'd like to report."

2. ALLOW VALID SHORT QUERIES:
   - Genuine short descriptions MUST PASS (e.g. "Broken streetlight", "Pothole on road", "No drinking water", "Water pipe leaking", "Gutter overflow", "Kachra saaf nahi hua", "Live wire sparking").
   - For valid issues, set "isValid": true and "rejectionMessage": null.

3. AUTO-CATEGORIZATION:
   If valid, classify strictly into ONE of these exact categories:
   - "Roads & Potholes"
   - "Garbage & Sanitation"
   - "Drinking Water & Pipeline Leakage"
   - "Electricity Hazard & Wiring"
   - "Sewage & Drain Overflow"
   - "Streetlight Breakdown"
   - "Public Health & Fogging"
   - "Illegal Encroachments"
   - "Other" (If no match is found, default to "Other")

Output STRICT JSON:
{
  "isValid": boolean,
  "category": string,
  "rejectionMessage": string | null,
  "suggestedTitle": string
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ text: `Evaluate this citizen grievance text:\n"${fullText}"` }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    if (typeof parsed.isValid === "boolean") {
      return res.json({
        isValid: parsed.isValid,
        category: parsed.category || "Other",
        rejectionMessage: parsed.isValid
          ? null
          : parsed.rejectionMessage || "This doesn't appear to be a valid civic issue. Please describe a specific problem you'd like to report.",
        suggestedTitle: parsed.suggestedTitle || fullText.slice(0, 60),
      });
    }

    return res.json(runFallbackValidation(fullText));
  } catch (err: any) {
    console.warn("AI Grievance validation notice:", err?.message || err);
    return res.json(runFallbackValidation(fullText));
  }
});

// =========================================================================
// 2.45 Dynamic Location Reverse Geocoding & Detection Endpoint
// =========================================================================
app.get("/api/location/reverse-geocode", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: "Missing lat/lng query parameters" });
  }

  try {
    const fetchRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "JanVani-Civic-App/1.0",
          "Accept-Language": "en,hi",
        },
      }
    );

    if (fetchRes.ok) {
      const data: any = await fetchRes.json();
      const addr = data.address || {};
      const roadOrArea =
        addr.road ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.village ||
        addr.hamlet ||
        addr.industrial ||
        data.display_name?.split(",")?.[0] ||
        "Live GPS Pin";

      const district = addr.state_district || addr.county || addr.city || addr.town || "Dhar";
      const city = addr.city || addr.town || addr.municipality || addr.village || district;
      const state = addr.state || "Madhya Pradesh";
      const postcode = addr.postcode || "";
      const ward = addr.suburb || addr.neighbourhood || `Ward (${roadOrArea})`;

      const formattedLocality = `${roadOrArea}${city !== roadOrArea ? `, ${city}` : ""}${postcode ? ` - ${postcode}` : ""}`;

      return res.json({
        locality: formattedLocality,
        road: roadOrArea,
        ward: ward,
        city: city,
        district: district,
        state: state,
        postcode: postcode,
        lat: Number(lat),
        lng: Number(lng),
        fullAddress: data.display_name || formattedLocality,
      });
    }
  } catch (err: any) {
    console.warn("Reverse geocode notice:", err?.message || err);
  }

  return res.json({
    locality: `GPS Pin (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
    ward: `Ward GPS Zone (${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)})`,
    city: "Local Municipal Area",
    district: "Dhar",
    state: "Madhya Pradesh",
    lat: Number(lat),
    lng: Number(lng),
  });
});

app.get("/api/location/search", async (req, res) => {
  const query = (req.query.q as string || "").trim();
  if (!query || query.length < 2) {
    return res.status(400).json({ error: "Search query must be at least 2 characters" });
  }

  try {
    const fetchRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=6&addressdetails=1`,
      {
        headers: {
          "User-Agent": "JanVani-Civic-App/1.0",
          "Accept-Language": "en,hi",
        },
      }
    );

    if (fetchRes.ok) {
      const items: any[] = await fetchRes.json();
      const mapped = items.map((it) => {
        const addr = it.address || {};
        const road = addr.road || addr.suburb || addr.neighbourhood || it.display_name.split(",")[0];
        const district = addr.state_district || addr.county || addr.city || addr.town || "Dhar";
        const city = addr.city || addr.town || addr.municipality || district;
        const state = addr.state || "Madhya Pradesh";
        return {
          displayName: it.display_name,
          locality: `${road}, ${city}`,
          ward: addr.suburb || addr.neighbourhood || `Ward (${road})`,
          district: district,
          city: city,
          state: state,
          postcode: addr.postcode || "",
          lat: parseFloat(it.lat),
          lng: parseFloat(it.lon),
        };
      });
      return res.json(mapped);
    }
  } catch (err: any) {
    console.warn("Location search error:", err?.message || err);
  }

  return res.json([]);
});

// =========================================================================
// 2.5 Fully Voice Assistant Intake Engine (Multilingual Speech-to-Grievance)
// =========================================================================
app.post("/api/gemini/voice-intake", async (req, res) => {
  const {
    spokenTranscript,
    language = "hi-IN",
    languageName = "Hindi",
    conversationHistory = [],
    currentUserDistrict = "Dhar",
    currentUserWard = "Central Ward",
    currentUserLocation = "Main City Road",
    currentStage = "listening", // "listening" | "awaiting_confirmation"
  } = req.body || {};

  const cleanTranscript = (spokenTranscript || "").trim();

  // Helper to detect language from text heuristics
  const detectLanguageHeuristic = (text: string) => {
    // Check Devanagari script
    if (/[\u0900-\u097F]/.test(text)) {
      if (/आहे|नाही|करा|झाला|तक्रार|रस्त्यावर|कचऱ्याचा|पाणी|दुर्गंधी/i.test(text)) {
        return { code: "mr-IN", name: "Marathi", lang: "mr" };
      }
      return { code: "hi-IN", name: "Hindi", lang: "hi" };
    }
    // Gujarati
    if (/[\u0A80-\u0AFF]/.test(text)) {
      return { code: "gu-IN", name: "Gujarati", lang: "gu" };
    }
    // Bengali
    if (/[\u0980-\u09FF]/.test(text)) {
      return { code: "bn-IN", name: "Bengali", lang: "bn" };
    }
    // Tamil
    if (/[\u0B80-\u0BFF]/.test(text)) {
      return { code: "ta-IN", name: "Tamil", lang: "ta" };
    }
    // Telugu
    if (/[\u0C00-\u0C7F]/.test(text)) {
      return { code: "te-IN", name: "Telugu", lang: "te" };
    }
    // Kannada
    if (/[\u0C80-\u0CFF]/.test(text)) {
      return { code: "kn-IN", name: "Kannada", lang: "kn" };
    }
    // Romanized check (Hinglish vs English)
    if (/\b(sadak|gaddha|paani|pani|nal|kachra|kuda|safai|bijli|taar|naali|nala|machhar|thela|bhai|kardo|kar do|hai|mein|mai|pe|par|yeh|ye|humare|hamare|ward)\b/i.test(text)) {
      return { code: "hi-IN", name: "Hindi", lang: "hi" };
    }
    return { code: "en-IN", name: "English", lang: "en" };
  };

  const detectedLang = detectLanguageHeuristic(cleanTranscript);

  // Smart fallback extraction rules in case AI key is pending or network fallback
  const getFallbackVoiceIntake = () => {
    const text = cleanTranscript.toLowerCase();

    // Check affirmative confirmation intent
    const isAffirmative = /^(haan|ha|haa|haji|haanji|kar do|kardo|darj karo|darj|sahi hai|theek hai|thik hai|yes|yep|yeah|submit|confirm|okay|ok|file it|proceed|go ahead|kardo bhai|ho|hoya|haam|avunu|haudu|darj kar do|done|हाँ|हाँजी|हाँ जी|दर्ज करो|दर्ज कर दो|कर दो|कर दीजिए|ठीक है|सही है|हो|हो करा|नोंदवा|હા|બરાબર|হ্যাঁ|জমা দিন|ஆம்|அவுनु|ಹೌದು)$/i.test(text.trim());
    const isNegative = /^(nahin|nahi|no|cancel|badlo|change|ruko|na|ना|नहीं|नको|না)$/i.test(text.trim());

    if (currentStage === "awaiting_confirmation" && isAffirmative) {
      return {
        hasValidCivicIssue: true,
        isReadyToSubmit: true,
        detectedIntent: "confirm_submit",
        voiceReply: detectedLang.lang === "hi"
          ? "आपकी शिकायत दर्ज कर ली गई है। धन्यवाद!"
          : "Your complaint has been successfully registered. Thank you!",
        detectedLanguage: detectedLang.lang,
        detectedLanguageName: detectedLang.name,
        detectedLanguageCode: detectedLang.code,
        fullCitizenSpeech: cleanTranscript,
      };
    }

    if (currentStage === "awaiting_confirmation" && isNegative) {
      return {
        hasValidCivicIssue: false,
        isReadyToSubmit: false,
        detectedIntent: "cancel_retry",
        voiceReply: detectedLang.lang === "hi"
          ? "कोई बात नहीं। कृपया अपनी समस्या और स्थान दोबारा बताएं।"
          : "Understood. Please describe your complaint and location again.",
        detectedLanguage: detectedLang.lang,
        detectedLanguageName: detectedLang.name,
        detectedLanguageCode: detectedLang.code,
        fullCitizenSpeech: cleanTranscript,
      };
    }

    // Check for Greetings / Casual / Non-civic messages
    const isGreetingOrCasual = /^(hello|hi|hey|namaste|pranam|namaskar|good morning|good evening|kaise ho|kya haal|who are you|kaun ho|testing|test|mic test|123|one two three|hello mic|sun rahe ho|awaaz aa rahi hai|namaskara|vanakkam|kem cho)/i.test(text.trim()) && text.length < 35;
    
    // Check if any civic keyword matches
    const hasCivicKeywords = /(sadak|road|pothole|gaddha|khadda|crack|asphalt|kachra|kuda|garbage|waste|clean|safai|dump|badboo|smell|gandagi|pani|paani|water|pipe|leak|pipeline|nal|supply|tanker|bijli|electric|wire|taar|transformer|pole|spark|current|light|streetlight|andhera|roshni|naali|drain|sewer|nullah|gutter|waterlog|keechad|machhar|mosquito|dengue|malaria|fogging|dawa|kabza|encroach|illegal|thela|footpath)/i.test(text);

    if (isGreetingOrCasual || (!hasCivicKeywords && text.length < 20)) {
      return {
        hasValidCivicIssue: false,
        isReadyToSubmit: false,
        detectedIntent: "no_civic_issue",
        extractedProblem: "",
        extractedCategory: "",
        extractedLocality: "",
        extractedWard: "",
        extractedDistrict: currentUserDistrict,
        severityScore: 0,
        assignedDepartment: "",
        targetSlaHours: 0,
        suggestedTitle: "",
        fullCitizenSpeech: cleanTranscript,
        detectedLanguage: detectedLang.lang,
        detectedLanguageName: detectedLang.name,
        detectedLanguageCode: detectedLang.code,
        voiceReply: detectedLang.lang === "hi"
          ? "नमस्ते! कृपया अपनी नगर पालिका से संबंधित समस्या बताएं (जैसे सड़क का गड्ढा, कचरा, पानी की लीकेज, या खराब स्ट्रीट लाइट) और अपना क्षेत्र बताएं।"
          : detectedLang.lang === "mr"
          ? "नमस्कार! कृपया आपली नागरी समस्या (जसे रस्त्यावरील खड्डा, कचरा, पाण्याची गळती, किंवा पथदिवा) आणि ठिकाण सांगा."
          : "Hello! Please tell me about your municipal issue (such as a road pothole, garbage dump, water pipeline leak, or broken streetlight) along with your locality.",
      };
    }

    // Civic problem detected - classify accurately
    let category = "Roads & Potholes";
    let department = "Public Works Department (PWD / Roads Wing)";
    let severity = 8;
    let sla = 48;
    let summary = "Road Pothole & Asphalt Degradation";
    let locality = currentUserLocation || `Main Road, ${currentUserDistrict}`;

    if (/garbage|waste|clean|trash|kachra|kuda|safai|dump|badboo|smell|gandagi/i.test(text)) {
      category = "Garbage & Sanitation";
      department = "Swachh Bharat Mission & Solid Waste Management Cell";
      severity = 7;
      sla = 24;
      summary = "Overflowing Community Garbage & Sanitation Hazard";
      locality = currentUserLocation || `Market Square, ${currentUserDistrict}`;
    } else if (/water|pipe|leak|pani|paani|nal|pipeline|gushing|peene|tanker/i.test(text)) {
      category = "Drinking Water & Pipeline Leakage";
      department = "PHED / Municipal Potable Water Division";
      severity = 8;
      sla = 24;
      summary = "Potable Water Pipeline Burst & Supply Disruption";
      locality = currentUserLocation || `Water Supply Line, ${currentUserDistrict}`;
    } else if (/wire|electric|transformer|bijli|pole|current|spark|light|andhera|roshni/i.test(text)) {
      if (/light|streetlight|andhera|roshni/i.test(text)) {
        category = "Streetlight Breakdown";
        department = "Municipal Public Streetlighting Cell";
        severity = 6;
        sla = 48;
        summary = "Defective Streetlight / Dark Spot on Main Road";
      } else {
        category = "Electricity Hazard & Wiring";
        department = "Electricity Board (MPPKVVCL) & Safety Wing";
        severity = 9;
        sla = 24;
        summary = "Exposed Live Wire & Transformer Sparking Hazard";
      }
      locality = currentUserLocation || `Electric Supply Junction, ${currentUserDistrict}`;
    } else if (/drain|sewer|nullah|gutter|waterlog|ganda|overflow|keechad|naali/i.test(text)) {
      category = "Sewage & Drain Overflow";
      department = "Municipal Drainage & Stormwater Division";
      severity = 8;
      sla = 48;
      summary = "Blocked Nullah & Open Drainage Overflow";
      locality = currentUserLocation || `Drainage Sector, ${currentUserDistrict}`;
    } else if (/mosquito|dengue|malaria|fogging|machhar|dawa/i.test(text)) {
      category = "Public Health & Fogging";
      department = "District Vector-borne Disease & Health Wing";
      severity = 7;
      sla = 24;
      summary = "Mosquito Breeding & Vector Control Fogging Required";
      locality = currentUserLocation || `Residential Colony, ${currentUserDistrict}`;
    } else if (/encroach|illegal|kabza|thela|footpath|block/i.test(text)) {
      category = "Illegal Encroachments";
      department = "Municipal Anti-Encroachment & Town Planning Wing";
      severity = 6;
      sla = 72;
      summary = "Footpath Obstruction & Illegal Encroachment";
      locality = currentUserLocation || `Main Bazar Road, ${currentUserDistrict}`;
    } else {
      category = "Other";
      department = "General Municipal Administration & Citizen Redressal Wing";
      severity = 6;
      sla = 48;
      summary = cleanTranscript.slice(0, 60) || "Civic Complaint";
      locality = currentUserLocation || `Municipal Zone, ${currentUserDistrict}`;
    }

    let voiceReply = "";
    if (detectedLang.lang === "hi") {
      voiceReply = `मैंने आपकी समस्या नोट कर ली है: ${locality} में ${summary} (${category})। क्या आप इसे तुरंत दर्ज करना चाहते हैं? बोलें 'हाँ' या 'दर्ज करो'।`;
    } else if (detectedLang.lang === "mr") {
      voiceReply = `मी आपली तक्रार नोंदवली आहे: ${locality} मधील ${summary} (${category})। दाखल करण्यासाठी 'हो' म्हणा.`;
    } else {
      voiceReply = `I have noted your complaint: ${summary} at ${locality} under ${category}. Should I register this now? Please say 'Yes' or 'Submit'.`;
    }

    return {
      hasValidCivicIssue: true,
      voiceReply,
      extractedProblem: summary,
      extractedCategory: category,
      extractedLocality: locality,
      extractedWard: currentUserWard || "Ward Area",
      extractedDistrict: currentUserDistrict,
      severityScore: severity,
      assignedDepartment: department,
      targetSlaHours: sla,
      isReadyToSubmit: true,
      suggestedTitle: `${summary}`,
      fullCitizenSpeech: cleanTranscript,
      detectedIntent: "new_grievance",
      detectedLanguage: detectedLang.lang,
      detectedLanguageName: detectedLang.name,
      detectedLanguageCode: detectedLang.code,
    };
  };

  try {
    const ai = getAI();
    if (!ai) {
      return res.json(getFallbackVoiceIntake());
    }

    const systemPrompt = `You are "JanVani Voice Grievance Officer" (जनवाणी आवाज़ सेवा), the Official AI Voice Redressal Officer for the Municipal Corporation of ${currentUserDistrict}.
Citizens of all literacy levels speak to you in their native language (e.g. Hindi, English, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, etc.) to file municipal grievances without forms or typing.

CRITICAL INSTRUCTION 1 - DETECT LANGUAGE & RESPOND IN EXACT SAME LANGUAGE:
- Detect the user's spoken language from their transcript.
- Populate:
  "detectedLanguage": e.g. "hi", "en", "mr", "gu", "bn", "ta", "te", "kn",
  "detectedLanguageName": e.g. "Hindi", "English", "Marathi", "Gujarati", etc.,
  "detectedLanguageCode": e.g. "hi-IN", "en-IN", "mr-IN", "gu-IN", "bn-IN", "ta-IN", "te-IN", "kn-IN".
- Your spoken "voiceReply" MUST BE IN THE EXACT SAME DETECTED LANGUAGE as the citizen spoke!

CRITICAL INSTRUCTION 2 - PREVENT FAKE / RANDOM REPORTS (VALIDATE CIVIC ISSUE):
- Check if the citizen's message actually describes an actionable municipal / civic issue (such as a broken road/pothole, garbage dump, drinking water leakage, open live wire/transformer spark, blocked drain/sewer, broken streetlight/darkness, mosquito fogging, or illegal encroachment).
- If the citizen only said hello, greetings, conversational remarks ("kaise ho", "who are you"), test words ("testing 123", "hello mic"), unintelligible noise, or unrelated topics (cooking, movies, weather, cricket):
  -> Set "hasValidCivicIssue": false
  -> Set "isReadyToSubmit": false
  -> Set "detectedIntent": "no_civic_issue"
  -> Set "extractedProblem": ""
  -> Set "extractedCategory": ""
  -> In "voiceReply": Greet them warmly in their detected language and politely ask them to describe their municipal complaint (e.g. pothole, garbage, water leak, streetlight) and location.
- DO NOT invent or fabricate a grievance if none was mentioned!

CRITICAL INSTRUCTION 3 - AUTOMATIC ACCURATE CATEGORY SELECTION:
If "hasValidCivicIssue" is true, classify strictly into ONE of these categories:
1. "Roads & Potholes" (broken road, pothole, asphalt, crater)
2. "Garbage & Sanitation" (garbage heap, overflowing dustbin, waste stench, cleaning)
3. "Drinking Water & Pipeline Leakage" (potable water pipeline burst, tap dry, leak)
4. "Electricity Hazard & Wiring" (sparking transformer, dangling live wire, power hazard)
5. "Sewage & Drain Overflow" (blocked nullah, gutter overflow, sewage waterlogging)
6. "Streetlight Breakdown" (streetlight defective, dark road, dark spot)
7. "Public Health & Fogging" (mosquito breeding, dengue/malaria prevention, fogging)
8. "Illegal Encroachments" (footpath obstruction, illegal shop/thela encroachment)
9. "Other" (If no existing category above is appropriate for the civic issue, automatically select "Other")

Also extract:
- "extractedLocality": The specific road, landmark, market, chowk, or colony mentioned (or fallback to "${currentUserLocation || currentUserDistrict}").
- "assignedDepartment": Official municipal wing (e.g. PWD, PHED, Swachh Bharat Cell, Electricity Board, etc.)
- "targetSlaHours": 24, 48, or 72 based on urgency.
- "isReadyToSubmit": true.
- "voiceReply": 1-2 sentence spoken summary acknowledging problem and place, asking if they want to submit.

CRITICAL INSTRUCTION 4 - CONFIRMATION INTENT:
- If citizen is answering YES / "haan" / "kar do" / "sahi hai" / "submit":
  -> "detectedIntent": "confirm_submit", "voiceReply": "Your complaint has been registered. Thank you!" (in user's language).
- If citizen is answering NO / "nahi" / "cancel" / "ruko":
  -> "detectedIntent": "cancel_retry", "voiceReply": "Sure, please tell me your issue again." (in user's language).

Return STRICT JSON with this schema:
{
  "hasValidCivicIssue": boolean,
  "detectedLanguage": string,
  "detectedLanguageName": string,
  "detectedLanguageCode": string,
  "voiceReply": string,
  "extractedProblem": string,
  "extractedCategory": string,
  "extractedLocality": string,
  "extractedWard": string,
  "extractedDistrict": string,
  "severityScore": number,
  "assignedDepartment": string,
  "targetSlaHours": number,
  "suggestedTitle": string,
  "isReadyToSubmit": boolean,
  "detectedIntent": "confirm_submit" | "cancel_retry" | "new_grievance" | "no_civic_issue"
}`;

    const contents: any[] = [];
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      contents.push({
        text: `Previous conversation turns:\n${JSON.stringify(conversationHistory.slice(-4))}`,
      });
    }

    contents.push({
      text: `Citizen spoken input:\n"${cleanTranscript}"\nCurrent stage: ${currentStage}\nCurrent User Context: District: ${currentUserDistrict}, Live Location: ${currentUserLocation}, Ward: ${currentUserWard}.\nAnalyze the speech, detect the language, validate civic issue existence, categorize, and formulate a spoken reply in the SAME language. Output STRICT JSON.`,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    try {
      const parsed = JSON.parse(responseText);
      const fallback = getFallbackVoiceIntake();
      return res.json({
        ...fallback,
        ...parsed,
        fullCitizenSpeech: cleanTranscript,
      });
    } catch {
      return res.json(getFallbackVoiceIntake());
    }
  } catch (err: any) {
    console.warn("Voice Intake API notice:", err?.message || err);
    return res.json(getFallbackVoiceIntake());
  }
});

// =========================================================================
// 2.55 Dedicated IVR Voice Assistant Greeting Endpoint
// =========================================================================
app.post("/api/gemini/ivr-greeting", async (req, res) => {
  const {
    language = "hi-IN",
    languageName = "Hindi",
    district = "Dhar",
  } = req.body || {};

  const defaultGreetings: Record<string, string> = {
    "hi-IN": `नमस्ते! जनवाणी आवाज़ सेवा में आपका स्वागत है। मैं आपका AI सहायता अधिकारी हूँ। कृपया बताइए, मैं आपकी क्या सहायता कर सकता हूँ? अपनी समस्या और स्थान बोलें।`,
    "en-IN": `Namaste! Welcome to JanVani AI Voice Helpline for ${district}. I am your Civic Voice Assistant. How can I help you today? Please tell me your complaint and locality.`,
    "mr-IN": `नमस्कार! जनवाणी आवाज सेवेत आपले स्वागत आहे. मी आपला AI सहाय्यक अधिकारी आहे. मी आपली काय मदत करू शकतो? कृपया आपली समस्या आणि ठिकाण सांगा.`,
    "gu-IN": `નમસ્તે! જનવાણી અવાજ સેવામાં આપનું સ્વાગત છે. હું તમારો AI સહાયક અધિકારી છું. હું તમારી શું મદદ કરી શકું? કૃપા કરીને તમારી ફરિયાદ અને વિસ્તાર જણાવો.`,
    "bn-IN": `নমস্কার! জনবাণী ভয়েস হেল্পলাইনে আপনাকে স্বাগতম। আমি আপনার এআই কর্মকর্তা। আমি কীভাবে আপনাকে সাহায্য করতে পারি? আপনার অভিযোগ ও এলাকা বলুন।`,
    "ta-IN": `வணக்கம்! ஜன்வாணி குரல் உதவி மையத்திற்கு வரவேற்கிறோம். நான் உங்கள் AI அதிகாரி. உங்களுக்கு நான் எவ்வாறு உதவ முடியும்? உங்கள் புகாரைக் கூறுங்கள்.`,
    "te-IN": `నమస్కారం! జన్వాణి వాయిస్ హెల్ప్‌లైన్‌కు స్వాగతం. నేను మీ AI సహాయక అధికారిని. నేను మీకు ఎలా సహాయం చేయగలను? మీ సమస్యను చెప్పండి.`,
    "kn-IN": `ನಮಸ್ಕಾರ! ಜನವಾಣಿ ವಾಯ್ಸ್ ಸಹಾಯವಾಣಿಗೆ ಸ್ವಾಗತ. ನಾನು ನಿಮ್ಮ AI ಸಹಾಯ ಅಧಿಕಾರಿ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ನಿಮ್ಮ ದೂರು ತಿಳಿಸಿ.`,
  };

  const fallbackGreeting = defaultGreetings[language] || defaultGreetings["hi-IN"];

  try {
    const ai = getAI();
    if (!ai) {
      return res.json({ greeting: fallbackGreeting });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          text: `You are the Official AI IVR Civic Redressal Voice Officer of Municipal Corporation of ${district}.
Generate a single, warm, welcoming 1-2 sentence spoken IVR greeting in ${languageName} (${language}) that asks the citizen: "How can I help you today? Please speak your civic complaint and locality."
Do not include asterisks or emojis, keep it 100% natural for audio readout.`,
        },
      ],
    });

    const greeting = response.text?.trim() || fallbackGreeting;
    return res.json({ greeting });
  } catch (err: any) {
    return res.json({ greeting: fallbackGreeting });
  }
});

// =========================================================================
// 2.6 Gemini Neural Text-To-Speech (TTS) Voice Redressal Officer Endpoint
// =========================================================================
app.post("/api/gemini/tts", async (req, res) => {
  const { text, voiceName = "Kore" } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing text parameter for TTS." });
  }

  try {
    const ai = getAI();
    if (!ai) {
      return res.json({ success: false, fallbackToBrowser: true });
    }

    const cleanText = text.slice(0, 300); // keep it concise for instant voice responses
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({
        success: true,
        audioBase64: base64Audio,
        sampleRate: 24000,
        voiceName: voiceName,
      });
    }
    return res.json({ success: false, fallbackToBrowser: true });
  } catch (err: any) {
    console.warn("Gemini TTS API notice (falling back to browser Web Speech):", err?.message || err);
    return res.json({ success: false, fallbackToBrowser: true, error: err?.message });
  }
});

// =========================================================================
// WhatsApp Civic Helpline & Automated Triage Gateway (+91 90131 51515)
// =========================================================================

// In-memory store for WhatsApp transactions and live gateway logs
interface WhatsAppIntakeRecord {
  id: string;
  senderPhone: string;
  senderName: string;
  rawMessage: string;
  mediaUrl?: string;
  timestamp: string;
  generatedToken: string;
  grievance: any;
  botReply: string;
  deliveryStatus: "Delivered & Acknowledged" | "Processed" | "Escalated";
}

const whatsappIntakeLog: WhatsAppIntakeRecord[] = [
  {
    id: "wa-seed-1",
    senderPhone: "+91 98263 77410",
    senderName: "Rameshwar Patel",
    rawMessage: "Main Mandi Road ke samne kachre ka dher laga hai aur sadak par badboo aa rahi hai. Kripya safai karwayein.",
    timestamp: "Today, 10:15 am",
    generatedToken: "JV-WA-DHAR-2026-9102",
    grievance: {
      id: `g-wa-1`,
      token: "JV-WA-DHAR-2026-9102",
      title: "Garbage Accumulation & Odor at Main Mandi Entrance",
      category: "Garbage & Sanitation",
      ward: "Ward 12 (Central Bazar)",
      severityScore: 7,
      targetSlaHours: 24,
      department: "Solid Waste Management Wing / Nagar Palika Parishad",
      assignedNodal: "Er. Rajesh Sharma (AE Civil)",
    },
    botReply: "🇮🇳 *JanVani Official WhatsApp Seva*\n\nNamaste Rameshwar Patel, your grievance has been auto-registered on the Nodal Officer Suite!\n\n📋 *Token:* JV-WA-DHAR-2026-9102\n📂 *Category:* Garbage & Sanitation\n📍 *Ward:* Ward 12 (Central Bazar)\n⏱️ *SLA:* 24 Hours\n👤 *Assigned Officer:* Er. Rajesh Sharma (+91 94252 44120)\n\n🔍 Track Live: https://janvani.gov.in/track?token=JV-WA-DHAR-2026-9102",
    deliveryStatus: "Delivered & Acknowledged",
  },
  {
    id: "wa-seed-2",
    senderPhone: "+91 94250 88912",
    senderName: "Sunita Choudhary",
    rawMessage: "Civil Hospital feeder pipeline burst ho gaya hai, drinking water supply stopped in ward 15.",
    timestamp: "Today, 09:30 am",
    generatedToken: "JV-WA-DHAR-2026-7840",
    grievance: {
      id: `g-wa-2`,
      token: "JV-WA-DHAR-2026-7840",
      title: "Drinking Water Main Transmission Pipe Rupture near Civil Hospital",
      category: "Drinking Water & Pipeline Leakage",
      ward: "Ward 15 (Old Mandi Ring Rd)",
      severityScore: 9,
      targetSlaHours: 24,
      department: "Water Supply & PHED / Jal Nigam",
      assignedNodal: "Er. Rajesh Sharma (AE Civil)",
    },
    botReply: "🇮🇳 *JanVani Official WhatsApp Seva*\n\nNamaste Sunita Choudhary, your grievance has been auto-registered on the Nodal Officer Suite!\n\n📋 *Token:* JV-WA-DHAR-2026-7840\n📂 *Category:* Drinking Water & Pipeline Leakage\n📍 *Ward:* Ward 15\n🚨 *Urgency:* CRITICAL (Severity: 9/10)\n⏱️ *SLA:* 24 Hours\n👤 *Assigned Officer:* Er. Rajesh Sharma (+91 94252 44120)\n\n🔍 Track Live: https://janvani.gov.in/track?token=JV-WA-DHAR-2026-7840",
    deliveryStatus: "Delivered & Acknowledged",
  },
];

// Helper: Dispatch live real WhatsApp message via Meta Cloud API or Twilio (when credentials provided)
async function dispatchRealWhatsAppMessage(recipientPhone: string, text: string) {
  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // 1. Try Meta WhatsApp Cloud API if configured
  if (metaToken && phoneNumberId) {
    try {
      const cleanPhone = recipientPhone.replace(/\D/g, "");
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: { preview_url: false, body: text },
        }),
      });
      const data = await res.json();
      console.log("Meta WhatsApp Cloud API dispatch result:", data);
      return { success: true, provider: "Meta Cloud API", data };
    } catch (err) {
      console.error("Meta WhatsApp Cloud API dispatch error:", err);
    }
  }

  // 2. Try Twilio WhatsApp API if configured
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

  if (twilioAccountSid && twilioAuthToken) {
    try {
      const cleanPhone = recipientPhone.startsWith("+") ? recipientPhone : `+${recipientPhone.replace(/\D/g, "")}`;
      const to = `whatsapp:${cleanPhone}`;
      const from = twilioFromNumber.startsWith("whatsapp:") ? twilioFromNumber : `whatsapp:${twilioFromNumber}`;

      const formData = new URLSearchParams();
      formData.append("To", to);
      formData.append("From", from);
      formData.append("Body", text);

      const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64");
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });
      const data = await res.json();
      console.log("Twilio WhatsApp dispatch result:", data);
      return { success: true, provider: "Twilio WhatsApp", data };
    } catch (err) {
      console.error("Twilio WhatsApp dispatch error:", err);
    }
  }

  return { success: false, reason: "No live WhatsApp credentials configured (simulator mode)." };
}

// Helper: AI WhatsApp Grievance Parser & Auto-Registration Logic
async function processWhatsAppCivicMessage(data: {
  senderPhone: string;
  senderName?: string;
  messageText: string;
  mediaUrl?: string;
  imageBase64?: string;
  location?: any;
}) {
  const { senderPhone, senderName = "Citizen", messageText, mediaUrl, imageBase64, location } = data;
  const rawText = messageText || "Civic issue reported via WhatsApp";
  const now = new Date();
  const tokenRandom = Math.floor(1000 + Math.random() * 9000);
  const generatedToken = `JV-WA-DHAR-2026-${tokenRandom}`;

  // Default fallback triage in case AI is unreachable
  let category = "Roads & Potholes";
  let department = "Public Works Department (PWD) / Municipal Council";
  let severityScore = 8;
  let targetSlaHours = 48;
  let ward = location?.ward || "Central Ward (Civil Lines)";
  let locality = location?.locality || "Main Market Road, Dhar";
  let title = "Civic Grievance via WhatsApp";
  let detailedDescription = rawText;
  let landmark = "Reported by WhatsApp citizen";
  let riskAnalysis = "Auto-triaged via JanVani WhatsApp Civic Helpline.";
  let imageUrl = mediaUrl || (imageBase64 ? imageBase64 : "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80");

  const textLower = rawText.toLowerCase();
  if (/garbage|kachra|waste|dustbin|safai|dump|badboo|smell/i.test(textLower)) {
    category = "Garbage & Sanitation";
    department = "Solid Waste Management Division";
    severityScore = 7;
    targetSlaHours = 24;
    title = `Garbage & Sanitation Hazard reported in ${ward}`;
    imageUrl = imageUrl || "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80";
  } else if (/water|pipe|leak|pani|nal|supply|tanker/i.test(textLower)) {
    category = "Drinking Water & Pipeline Leakage";
    department = "Water Supply & Sewerage Board (Jal Nigam)";
    severityScore = 8;
    targetSlaHours = 24;
    title = `Drinking Water Supply Issue / Pipeline Leak in ${ward}`;
    imageUrl = imageUrl || "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=800&q=80";
  } else if (/wire|electric|transformer|bijli|pole|current|light|spark/i.test(textLower)) {
    category = "Electricity Hazard & Wiring";
    department = "State Electricity Distribution Corp (Discom)";
    severityScore = 9;
    targetSlaHours = 24;
    title = `Live Electrical Wire / Power Hazard in ${ward}`;
    imageUrl = imageUrl || "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80";
  } else if (/sewer|drain|nullah|gutter|gala|overflow|waterlog/i.test(textLower)) {
    category = "Sewage & Drain Overflow";
    department = "Municipal Drainage & Stormwater Wing";
    severityScore = 8;
    targetSlaHours = 48;
    title = `Drainage / Sewer Overflow reported in ${ward}`;
    imageUrl = imageUrl || "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80";
  } else if (/streetlight|andhera|dark|pole light/i.test(textLower)) {
    category = "Streetlight Breakdown";
    department = "Municipal Electrical & Streetlighting Wing";
    severityScore = 6;
    targetSlaHours = 48;
    title = `Non-functional Streetlights in ${ward}`;
    imageUrl = imageUrl || "https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=800&q=80";
  }

  // Attempt Multimodal Gemini 3.7 Flash extraction
  try {
    const ai = getAI();
    if (ai) {
      const prompt = `You are the JanVani WhatsApp Civic Intake AI Assistant (Ministry of Housing & Urban Affairs - MoHUA).
A citizen sent this WhatsApp grievance message (may be in Hindi, Hinglish, English, or mixed):
"${rawText}"

Extract and structure into JSON:
{
  "category": "Roads & Potholes" | "Garbage & Sanitation" | "Drinking Water & Pipeline Leakage" | "Electricity Hazard & Wiring" | "Sewage & Drain Overflow" | "Streetlight Breakdown" | "Public Health & Fogging" | "Illegal Encroachments",
  "title": "Clear, concise grievance title (max 10 words)",
  "detailedDescription": "Formal administrative description incorporating all facts mentioned by the citizen",
  "severityScore": integer 1 to 10 (10 = immediate danger/life threat),
  "targetSlaHours": 24 | 48 | 72,
  "department": "Exact responsible department",
  "ward": "Ward 27 (Bagdun / Sector 3)" or best matched ward,
  "locality": "Locality or landmark mentioned",
  "landmark": "Landmark cues",
  "riskAnalysis": "1-2 sentence hazard assessment"
}`;

      const contents: any[] = [];
      if (imageBase64) {
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
          },
        });
      }
      contents.push({ text: prompt });

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: contents,
        config: { responseMimeType: "application/json" },
      });

      const parsed = JSON.parse(aiResponse.text || "{}");
      if (parsed.category) category = parsed.category;
      if (parsed.title) title = parsed.title;
      if (parsed.detailedDescription) detailedDescription = parsed.detailedDescription;
      if (parsed.severityScore) severityScore = Number(parsed.severityScore);
      if (parsed.targetSlaHours) targetSlaHours = Number(parsed.targetSlaHours);
      if (parsed.department) department = parsed.department;
      if (parsed.ward) ward = parsed.ward;
      if (parsed.locality) locality = parsed.locality;
      if (parsed.landmark) landmark = parsed.landmark;
      if (parsed.riskAnalysis) riskAnalysis = parsed.riskAnalysis;
    }
  } catch (err) {
    console.warn("WhatsApp AI Triage notice (using deterministic parser):", err);
  }

  // Build the complete registered Grievance object for the Nodal Officer Suite
  const newGrievance = {
    id: `g-wa-${Date.now()}`,
    token: generatedToken,
    title: title,
    description: detailedDescription,
    category: category,
    state: "Madhya Pradesh",
    stateCode: "MP",
    district: "Dhar",
    ward: ward,
    locality: locality,
    department: department,
    status: "Submitted & Token Issued",
    dateFiled: now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    severityScore: severityScore,
    targetSlaHours: targetSlaHours,
    slaRemainingHours: targetSlaHours,
    assignedNodal: "Er. Rajesh Sharma (AE Civil)",
    assignedOfficerTitle: "Assistant Engineer (Civil & Public Works)",
    assignedOfficerPhone: "+91 94252 44120",
    assignedOfficerEmail: "rajesh.sharma@mp.gov.in",
    imageUrl: imageUrl,
    upvotes: 1,
    hasUpvoted: false,
    filedByName: `${senderName} (via WhatsApp)`,
    filedByAadhaar: `WA-${senderPhone.slice(-4)}`,
    sourceChannel: "whatsapp",
    whatsappSenderPhone: senderPhone,
    whatsappSenderName: senderName,
    whatsappMessageText: rawText,
    geoCoords: { x: 55, y: 48, lat: location?.lat || 22.6013, lng: location?.lng || 75.3389 },
    timeline: [
      {
        title: "WhatsApp Grievance Received & Auto-Triaged",
        description: `Citizen message received on official WhatsApp Helpline (+91 90131 51515). Multimodal AI auto-categorized into ${category} (Severity ${severityScore}/10).`,
        timestamp: "Just now",
        status: "completed",
        verifiedBadge: "WhatsApp Verified Citizen",
      },
      {
        title: "Dispatched to Nodal Officer Suite",
        description: `Assigned to Er. Rajesh Sharma with ${targetSlaHours}h statutory SLA under Public Services Guarantee Act.`,
        timestamp: "Just now",
        status: "completed",
        officerOrEntity: "JanVani AI Gateway",
      },
      {
        title: "Field Inspection & Remediation Squad Dispatch",
        description: "Assigned quick-response squad notified via SMS/WhatsApp dispatch alert.",
        timestamp: "Pending",
        status: "pending",
        officerOrEntity: "Er. Rajesh Sharma (AE Civil)",
      },
    ],
  };

  // WhatsApp bot response message template
  const botReply = `🇮🇳 *JanVani Official WhatsApp Civic Seva* 🇮🇳
*Ministry of Housing & Urban Affairs (MoHUA)*

Namaste *${senderName}*, your civic grievance has been automatically registered & dispatched to the Nodal Officer:

📋 *Token ID:* \`${generatedToken}\`
📂 *Category:* ${category}
📍 *Ward:* ${ward}
🚨 *Severity Score:* ${severityScore}/10 (${severityScore >= 8 ? "🔴 CRITICAL" : "🟡 HIGH"})
⏱️ *Statutory SLA Target:* ${targetSlaHours} Hours
🏛️ *Department:* ${department}
👤 *Assigned Nodal Officer:* Er. Rajesh Sharma (+91 94252 44120)

🔍 *Live Status Tracking:*
https://janvani.gov.in/track?token=${generatedToken}

_You will receive automatic WhatsApp alerts on every milestone update._`;

  const intakeRecord: WhatsAppIntakeRecord = {
    id: `wa-${Date.now()}`,
    senderPhone: senderPhone,
    senderName: senderName,
    rawMessage: rawText,
    mediaUrl: imageUrl,
    timestamp: "Just now",
    generatedToken: generatedToken,
    grievance: newGrievance,
    botReply: botReply,
    deliveryStatus: "Delivered & Acknowledged",
  };

  whatsappIntakeLog.unshift(intakeRecord);

  // Attempt real outbound WhatsApp dispatch to recipient's phone if credentials exist
  dispatchRealWhatsAppMessage(senderPhone, botReply).catch((err) =>
    console.warn("Outbound WhatsApp dispatch attempt:", err)
  );

  return {
    success: true,
    token: generatedToken,
    grievance: newGrievance,
    botReply: botReply,
    record: intakeRecord,
  };
}

// 1. WhatsApp Webhook Verification Endpoint (Meta / WhatsApp Cloud API Standard)
app.get(["/api/webhook/whatsapp", "/api/whatsapp/webhook"], (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "janvani_secure_token";

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WhatsApp Webhook Verified successfully!");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.json({
    status: "active",
    service: "JanVani WhatsApp Civic Intake Webhook Gateway",
    helplineNumber: "+91 90131 51515",
    totalIntakeMessages: whatsappIntakeLog.length,
  });
});

// 2. WhatsApp Incoming Webhook POST Endpoint (Handles Meta Cloud API, Twilio, or Direct JanVani Payloads)
app.post(["/api/webhook/whatsapp", "/api/whatsapp/webhook"], async (req, res) => {
  try {
    const body = req.body || {};

    let senderPhone = "+91 98260 00000";
    let senderName = "Citizen";
    let messageText = "";
    let mediaUrl = "";
    let imageBase64 = body.imageBase64 || "";

    // 1. Check Meta WhatsApp Cloud API format
    if (body.entry && body.entry[0]?.changes && body.entry[0]?.changes[0]?.value?.messages) {
      const msg = body.entry[0].changes[0].value.messages[0];
      senderPhone = msg.from ? `+${msg.from}` : senderPhone;
      senderName = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || "WhatsApp Citizen";
      messageText = msg.text?.body || msg.caption || "";
      if (msg.image?.id || msg.image?.url) {
        mediaUrl = msg.image.url || "";
      }
    }
    // 2. Check Twilio WhatsApp format
    else if (body.From && (body.Body || body.MediaUrl0)) {
      senderPhone = body.From.replace("whatsapp:", "");
      senderName = body.ProfileName || "WhatsApp Citizen";
      messageText = body.Body || "";
      mediaUrl = body.MediaUrl0 || "";
    }
    // 3. Direct JanVani API JSON format
    else {
      senderPhone = body.from || body.senderPhone || body.phone || "+91 98263 77410";
      senderName = body.senderName || body.name || "Praneet Dubey";
      messageText = body.text || body.message || body.rawMessage || "";
      mediaUrl = body.mediaUrl || body.imageUrl || "";
    }

    if (!messageText && !mediaUrl && !imageBase64) {
      return res.status(400).json({ error: "Missing message text or image attachment." });
    }

    const result = await processWhatsAppCivicMessage({
      senderPhone,
      senderName,
      messageText,
      mediaUrl,
      imageBase64,
      location: body.location,
    });

    res.json(result);
  } catch (error: any) {
    console.error("WhatsApp Webhook Intake error:", error);
    res.status(500).json({ error: error.message || "Failed to process WhatsApp grievance." });
  }
});

// 3. Get WhatsApp Live Intake Stream & Stats (For Nodal Officer Suite)
app.get("/api/whatsapp/messages", (req, res) => {
  res.json({
    helplineNumber: "+91 90131 51515",
    activeGateway: "JanVani AI WhatsApp Multi-Channel Intake",
    totalLogged: whatsappIntakeLog.length,
    records: whatsappIntakeLog,
  });
});

// 4. Officer Suite Direct WhatsApp Update Sender (Sends live SLA update SMS/WhatsApp to citizen)
app.post("/api/whatsapp/send-officer-update", async (req, res) => {
  try {
    const { phone, token, status, officerName, updateNote } = req.body || {};
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const notificationMessage = `🇮🇳 *JanVani Nodal Officer Update*\n\nDear Citizen, your grievance *${token || "JV-WA-DHAR-2026-8941"}* has been updated by Nodal Officer *${officerName || "Er. Rajesh Sharma"}*:\n\n📌 *New Status:* ${status || "Work In Progress"}\n📝 *Remarks:* ${updateNote || "Squad mobilized for on-ground repair work."}\n⏱️ *Time:* Today, ${timestamp}\n\n🔍 Track: https://janvani.gov.in/track?token=${token}`;

    // Record in intake log
    const match = whatsappIntakeLog.find((r) => r.generatedToken === token || r.senderPhone === phone);
    if (match) {
      match.deliveryStatus = status === "Resolved & Verified" ? "Processed" : "Delivered & Acknowledged";
    }

    // Attempt real outbound WhatsApp dispatch to recipient's phone if credentials exist
    const dispatchResult = await dispatchRealWhatsAppMessage(phone || "+91 98263 77410", notificationMessage);

    res.json({
      success: true,
      deliveredTo: phone || "+91 98263 77410",
      channel: "WhatsApp Business API Gateway",
      notificationMessage: notificationMessage,
      dispatchResult: dispatchResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to dispatch WhatsApp alert." });
  }
});

// 5. WhatsApp Conversational Simulator Bot Endpoint
app.post("/api/whatsapp/simulate-chat", async (req, res) => {
  try {
    const { message, senderPhone = "+91 98263 77410", senderName = "Citizen", history = [] } = req.body || {};
    const ai = getAI();

    // Check if citizen is greeting or asking what the bot does
    const isGreeting = /^(hi|hello|namaste|pranam|hey|start|menu|help|kya hai)$/i.test(message.trim());

    if (isGreeting) {
      const greetingReply = `🇮🇳 *JanVani WhatsApp Civic Helpline (+91 90131 51515)*\n*Government of India • Ministry of Housing & Urban Affairs*\n\nNamaste *${senderName}*! 🙏\n\nI am your automated AI Civic Intake Assistant. You can text any civic defect or emergency here to get it *instantly registered & assigned* on the Nodal Officer Suite.\n\n*How to register a complaint:* \n1️⃣ Describe the problem (e.g. _"Station Road par 3 foot bada pothole hai, auto gir gaya"_)\n2️⃣ Send a photo or live location if available.\n\n⚡ *Example:* _"Ward 27 Bagdun Talab Road par kachre ka dher laga hai please clean"_`;
      return res.json({
        reply: greetingReply,
        isRegistered: false,
      });
    }

    // Process the grievance
    const result = await processWhatsAppCivicMessage({
      senderPhone,
      senderName,
      messageText: message,
    });

    res.json({
      reply: result.botReply,
      isRegistered: true,
      grievance: result.grievance,
      token: result.token,
    });
  } catch (error: any) {
    console.error("WhatsApp simulation error:", error);
    res.status(500).json({ error: error.message || "Error simulating WhatsApp bot." });
  }
});

// 3. AI Description Enhancer Endpoint
app.post("/api/gemini/enhance", async (req, res) => {
  const { title, description, category, locality } = req.body || {};

  const getFallbackEnhancement = () => ({
    enhancedText: `Urgent civic intervention requested at ${locality || "the specified location"}. The issue "${title || "Civic Defect"}" has caused severe disruption and public safety hazards. Specifically, ${description || "urgent inspection and remediation is requested"}. Immediate inspection by field engineers and deployment of remediation machinery is requested under municipal SLA guidelines.`,
  });

  try {
    const ai = getAI();
    if (!ai) {
      return res.json(getFallbackEnhancement());
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Transform this rough citizen report into a crisp, official administrative grievance filing for municipal engineers:\nCategory: ${category}\nTitle: ${title}\nLocality: ${locality}\nRough text: "${description}"\n\nRequirements:\n1. Maintain objective, factual, urgent tone.\n2. Detail the exact safety/health hazard.\n3. Mention landmark context.\n4. Keep it under 120 words. Output only the enhanced description text.`,
      config: {
        systemInstruction: "You are the JanVani AI Grievance Drafter for Indian Municipalities. Output only the enhanced grievance paragraph without preamble.",
      },
    });

    res.json({ enhancedText: response.text?.trim() || description });
  } catch (error: any) {
    console.warn("Enhance API notice (using template):", error?.message || error);
    res.json(getFallbackEnhancement());
  }
});

// 4. JanVani AI Copilot Chat Endpoint
app.post("/api/gemini/copilot", async (req, res) => {
  const { messages, message, history, language } = req.body || {};

  const userMessages = messages || (message ? [...(history || []).map((h: any) => ({ role: h.role === "assistant" ? "assistant" : "user", content: h.content })), { role: "user", content: message }] : [{ role: "user", content: "Hello" }]);
  const lastMsg = userMessages[userMessages.length - 1]?.content || "";

  const getFallbackCopilotReply = () => {
    let reply = `Namaste! I am your JanVani AI Civic Copilot. Regarding your query on "${lastMsg.slice(0, 45)}": Municipal grievances are governed by the Citizen Charter with strict 24h to 72h SLAs. You can track any token directly using the tracker, or draft an instant RTI escalation letter if SLA expires.`;
    if (lastMsg.includes("JV-DHAR-2026-8941") || lastMsg.toLowerCase().includes("status") || lastMsg.toLowerCase().includes("track")) {
      reply = `Status for Token JV-DHAR-2026-8941:\n- Issue: Severe 3-Foot Deep Pothole & Waterlogging near Bagdun Talab Road\n- Current Stage: 🟡 Work In Progress (Assigned to Er. Rajesh Sharma, AE Civil)\n- SLA Countdown: 14 hours remaining out of 48h Target SLA.\n- Action: Cold-mix asphalt batching material dispatched for site patching.`;
    } else if (lastMsg.toLowerCase().includes("rti") || lastMsg.toLowerCase().includes("appeal")) {
      reply = `To file an RTI for civic works:\n1. Section 6(1) of RTI Act 2005 allows any citizen to seek measurement books, inspection logs, and contractor penalty records.\n2. In JanVani, click "Draft Formal RTI / Jan Sunwai Letter" on any grievance card to generate a pre-filled, legally compliant petition.`;
    } else if (lastMsg.toLowerCase().includes("pothole") || lastMsg.toLowerCase().includes("road")) {
      reply = `Statutory Road & Pothole Repair SLA:\n- Standard Potholes: 48 hours resolution SLA under Public Works Department (PWD).\n- Highways/NHAI Corridors: 72 hours with mandatory cold polymer mix.\n- If overdue, your report automatically triggers Tier-1 escalation to the Sub-Divisional Magistrate (SDM).`;
    }
    return { reply };
  };

  try {
    const ai = getAI();
    if (!ai) {
      return res.json(getFallbackCopilotReply());
    }

    const conversationHistory = userMessages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content || "" }],
    }));

    const systemInstruction = `You are the JanVani AI National Civic Copilot, an authoritative, highly helpful AI assistant for India's National Civic Grievance & Governance Platform (Ministry of Housing & Urban Affairs - MoHUA).
You assist citizens and municipal officers with:
- Grievance status lookups (Tokens like JV-DHAR-2026-8941, JV-MUM-2026-4412, etc.)
- Explaining Municipal SLAs (e.g. Garbage: 24h, Potholes: 48h, Water Leakage: 24h, Streetlights: 48h)
- Guiding users on filing formal RTI (Right to Information Act 2005) or Jan Sunwai petitions
- Central & State schemes (Swachh Bharat Mission Urban 2.0, AMRUT 2.0, PM SVANidhi, PM Awas Yojana Urban, Jal Jeevan Mission Urban)
- 3-Tier GIS micro-mapping navigation (State -> District -> Ward level)
- Emergency 112 escalation protocols

Respond politely in ${language || "English"} (or Hindi/Hinglish if addressed in Hindi). Do NOT use any Markdown formatting like bold asterisks () or italics. Keep responses plain text, concise and actionable.`;

    const chat = ai.chats.create({
      model: "gemini-3.7-flash",
      config: {
        systemInstruction: systemInstruction,
      },
      history: conversationHistory.slice(0, -1),
    });

    const response = await chat.sendMessage({
      message: lastMsg,
    });

    res.json({ reply: response.text || getFallbackCopilotReply().reply });
  } catch (error: any) {
    console.warn("Copilot API notice (using fallback copilot):", error?.message || error);
    res.json(getFallbackCopilotReply());
  }
});

// 5. Draft Formal RTI / Jan Sunwai Letter
app.post("/api/gemini/draft-rti", async (req, res) => {
  const { grievance, citizenName, citizen } = req.body || {};
  const applicantName = citizenName || citizen?.name || "Praneet Dubey";

  const getFallbackRti = () => {
    const template = `FORM A - APPLICATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005

To:
The Public Information Officer (PIO) / Executive Officer,
${grievance?.department || "Municipal Corporation"},
${grievance?.district || "Dhar"}, ${grievance?.state || "Madhya Pradesh"}

Subject: Request for Information regarding pending Civic Grievance Token ${grievance?.token || "JV-DHAR-2026-8941"}

Applicant Details:
Name: ${applicantName}
Identity: Verified Citizen (e-Aadhaar UIDAI Linked: ${citizen?.aadhaarNumber || "XXXX-XXXX-5060"})
Address: Ward ${grievance?.ward || "27, Bagdun"}, ${grievance?.locality || "Sector 3"}, ${grievance?.district || "Dhar"}

Sir/Madam,
I have filed a formal grievance titled "${grievance?.title || "Civic Defect"}" on the JanVani National Portal on ${grievance?.date || "31 August 2026"}. Under Section 6(1) of the RTI Act 2005, please furnish the following information:

1. Daily Progress Report and file movements regarding Token ${grievance?.token || "JV-DHAR-2026-8941"}.
2. Name, designation, and contact details of the official(s) held responsible for breaching the 48-hour Citizen Charter SLA.
3. Certified copy of the contractor work order, tender sanction, and site inspection measurement book (MB) for this sector.
4. Details of penal action, if any, initiated against the contractor for non-rectification.

I hereby confirm that I am a citizen of India and have deposited the requisite application fee online.

Date: ${new Date().toLocaleDateString("en-IN")}
Place: ${grievance?.district || "Dhar"}, ${grievance?.state || "Madhya Pradesh"}

Yours Faithfully,
${applicantName}`;
    return { rtiDraft: template, letter: template };
  };

  try {
    const ai = getAI();
    if (!ai) {
      return res.json(getFallbackRti());
    }

    const prompt = `Draft a formal, legally structured Application under Section 6(1) of the Right to Information Act, 2005 (RTI Act) for a citizen seeking information on a delayed municipal grievance.
Grievance Token: ${grievance?.token}
Issue: ${grievance?.title}
Location: ${grievance?.locality}, Ward ${grievance?.ward}, ${grievance?.district}, ${grievance?.state}
Department: ${grievance?.department}
Assigned Officer: ${grievance?.assignedNodal}
SLA: ${grievance?.sla}
Citizen Name: ${applicantName} (Verified Citizen)

Make it authoritative, referencing relevant RTI provisions, seeking certified inspection records, measurement book entries, contractor penalty clauses, and daily movement logs.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Indian administrative and legal RTI drafting engine.",
      },
    });

    const text = response.text?.trim() || getFallbackRti().letter;
    res.json({ rtiDraft: text, letter: text });
  } catch (error: any) {
    console.warn("RTI API notice (using legal template):", error?.message || error);
    res.json(getFallbackRti());
  }
});

// ViaSocket Webhook Integration
app.post("/api/viasocket/trigger", async (req, res) => {
  const { eventType, payload } = req.body || {};
  const webhookUrl = process.env.VIASOCKET_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(503).json({ 
      success: false, 
      message: "ViaSocket webhook URL is not configured. Please add VIASOCKET_WEBHOOK_URL to your environment variables." 
    });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: eventType || "NEW_GRIEVANCE",
        timestamp: new Date().toISOString(),
        data: payload
      }),
    });

    if (!response.ok) {
      throw new Error(`ViaSocket responded with status: ${response.status}`);
    }

    res.json({ success: true, message: "Successfully triggered ViaSocket workflow" });
  } catch (error: any) {
    console.error("ViaSocket trigger error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Google Maps Data & Real-Place Civic Problem Spotter with Maps Grounding
app.post("/api/gemini/maps-spot-problems", async (req, res) => {
  try {
    const {
      scope = "district", // "national" | "state" | "district" | "real_place"
      stateName = "Madhya Pradesh",
      districtName = "Dhar",
      placeQuery = "",
      category = "All Civic Issues",
      latitude,
      longitude,
    } = req.body;

    const ai = getAI();

    // Context query description
    let targetLocationDescription = "";
    if (scope === "national") {
      targetLocationDescription = `Pan-India National Corridors, Major Inter-State Highways (NH-44, NH-48, NH-27), Mega-City Transit Nodes, and National Drainage Bottlenecks across India`;
    } else if (scope === "state") {
      targetLocationDescription = `State of ${stateName}, India (major district highways, state capital corridors, state PWD road junctions, and regional municipal centers)`;
    } else if (scope === "district") {
      targetLocationDescription = `District of ${districtName}, ${stateName}, India (including municipal council roads, bus stands, major intersections, hospital approaches, water supply lines, and ward dumping zones)`;
    } else {
      targetLocationDescription = `${placeQuery ? `${placeQuery}, ` : ""}${districtName ? `${districtName}, ` : ""}${stateName}, India`;
    }

    const queryPrompt = `You are the JanVani National Civic GIS & Google Maps Intelligence Engine for the Ministry of Housing & Urban Affairs (MoHUA), Government of India.
Use real Google Maps data and place intelligence to identify real-world civic, road, infrastructure, waterlogging, garbage, and public utility problems for:
Location / Scope: ${targetLocationDescription}
Category Focus: ${category}
${latitude && longitude ? `Geographic Anchor: Latitude ${latitude}, Longitude ${longitude}` : ""}

Please identify 4 to 6 specific, real places/intersections/roads/landmarks in this geographic area that commonly experience civic vulnerabilities or need municipal intervention.
For EACH problem spot, provide:
1. Exact Place / Intersection / Landmark Name (as listed on Google Maps)
2. Exact Road / Ward / Locality Address
3. Type of Problem (e.g. Chronic Pothole Cluster, Severe Monsoon Waterlogging, Open High-Tension Wire Hazard, Garbage Vulnerable Point, Pipeline Rupture, Broken Streetlights)
4. Severity (CRITICAL / HIGH / MEDIUM)
5. Detailed Hazard Analysis and Impact on Citizens (school zones, emergency vehicles, pedestrian safety)
6. Responsible Municipal Authority / Department (e.g. PWD, Municipal Corporation, NHAI, Discom)
7. Standard Citizen Charter SLA & Recommended Remedial Engineering Action.

Provide a comprehensive, authoritative report with clear headings and bullet points. Ground all places with actual Google Maps landmarks.`;

    if (!ai) {
      // Fallback realistic grounded spots across India
      const mockGroundedSpots = getMockGroundedProblemSpots(scope, stateName, districtName, placeQuery);
      return res.json({
        reportMarkdown: mockGroundedSpots.markdown,
        groundingChunks: mockGroundedSpots.chunks,
        spots: mockGroundedSpots.spots,
        scope,
        stateName,
        districtName,
      });
    }

    // Call Gemini 3.7 Flash with googleMaps grounding tool
    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (latitude && longitude && typeof latitude === "number" && typeof longitude === "number") {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: latitude,
            longitude: longitude,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: queryPrompt,
      config: config,
    });

    const reportMarkdown = response.text || "No report generated.";
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Parse and structure grounded spots
    const parsedSpots = parseGroundedSpots(reportMarkdown, rawChunks, stateName, districtName, placeQuery, scope);

    res.json({
      reportMarkdown,
      groundingChunks: rawChunks,
      spots: parsedSpots,
      scope,
      stateName,
      districtName,
    });
  } catch (error: any) {
    console.warn("Google Maps spot problems notice (using grounded fallback):", error?.message || error);
    // Graceful fallback if quota, 429 rate limit, or temporary API issue
    const mockGroundedSpots = getMockGroundedProblemSpots(
      req.body?.scope || "district",
      req.body?.stateName || "Madhya Pradesh",
      req.body?.districtName || "Dhar",
      req.body?.placeQuery || ""
    );
    res.json({
      reportMarkdown: mockGroundedSpots.markdown,
      groundingChunks: mockGroundedSpots.chunks,
      spots: mockGroundedSpots.spots,
      scope: req.body?.scope || "district",
      stateName: req.body?.stateName || "Madhya Pradesh",
      districtName: req.body?.districtName || "Dhar",
      isFallback: true,
    });
  }
});

// Helper to parse spots from Gemini + Grounding chunks
function parseGroundedSpots(
  markdown: string,
  chunks: any[],
  stateName: string,
  districtName: string,
  placeQuery: string,
  scope: string
) {
  const spots: any[] = [];
  
  // Extract map links and titles from grounding chunks
  const mapPlaces: Array<{ title: string; uri: string; address?: string; snippet?: string }> = [];
  for (const chunk of chunks) {
    if (chunk.maps) {
      mapPlaces.push({
        title: chunk.maps.title || "Identified Google Maps Location",
        uri: chunk.maps.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chunk.maps.title || districtName)}`,
        address: chunk.maps.address,
        snippet: chunk.maps.placeAnswerSources?.reviewSnippets?.[0]?.snippet,
      });
    }
  }

  // Split markdown by major headings/numbers to find spots
  const sections = markdown.split(/(?=###|\n\d+\.\s+\*\*|\n\*\*Spot\s+\d+:?|\n\*\*Location\s+\d+:?)/g);

  let spotIndex = 1;
  for (const section of sections) {
    if (section.length < 40) continue;

    // Extract title
    const titleMatch = section.match(/(?:###|\*\*Spot\s+\d+:?|\d+\.\s+\*\*)([^\*\n#:]+)/i);
    const title = titleMatch ? titleMatch[1].replace(/^\d+\.?\s*/, "").trim() : `Spot #${spotIndex} (${districtName})`;

    // Extract severity
    let severity = "HIGH";
    if (/critical/i.test(section)) severity = "CRITICAL";
    else if (/medium|moderate/i.test(section)) severity = "MEDIUM";

    // Extract category
    let category = "Roads & Potholes";
    if (/garbage|sanitation|waste|dump/i.test(section)) category = "Garbage & Sanitation";
    else if (/water|pipeline|leak|supply/i.test(section)) category = "Drinking Water & Pipeline Leakage";
    else if (/drain|sewer|waterlog|flood/i.test(section)) category = "Sewage & Drain Overflow";
    else if (/electric|wire|transformer|power/i.test(section)) category = "Electricity Hazard & Wiring";
    else if (/light|streetlight|lamp/i.test(section)) category = "Streetlight Breakdown";

    // Extract authority
    const authMatch = section.match(/(?:Authority|Department|Responsible):\s*([^\n\*\.]+)/i);
    const authority = authMatch ? authMatch[1].trim() : `${districtName} Municipal Corporation / PWD`;

    // Extract action/SLA
    const actionMatch = section.match(/(?:Action|Remedial|SLA|Protocol):\s*([^\n\*\.]+)/i);
    const action = actionMatch ? actionMatch[1].trim() : "Immediate on-site engineering inspection within 24h.";

    // Match or create google maps uri
    const matchedMapPlace = mapPlaces[spotIndex - 1] || mapPlaces[0];
    const googleMapsUrl = matchedMapPlace?.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title}, ${districtName}, ${stateName}`)}`;

    spots.push({
      id: `spot-maps-${Date.now()}-${spotIndex}`,
      title: title,
      locationName: `${title}, ${districtName}`,
      state: stateName,
      district: districtName,
      category: category,
      severity: severity,
      hazardDescription: section.slice(0, 300).replace(/[*#]/g, "").trim(),
      reportedCondition: section.slice(0, 180).replace(/[*#]/g, "").trim(),
      googleMapsUrl: googleMapsUrl,
      placeSearchUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title}, ${districtName}, ${stateName}`)}`,
      responsibleAuthority: authority,
      actionProtocol: action,
      groundingSources: mapPlaces.slice(0, 3),
    });

    spotIndex++;
    if (spots.length >= 6) break;
  }

  // If parsing resulted in fewer spots, supplement with standard grounded spots
  if (spots.length === 0) {
    return getMockGroundedProblemSpots(scope, stateName, districtName, placeQuery).spots;
  }

  return spots;
}

// Fallback high-fidelity dataset for pan-India real place problem spotting
function getMockGroundedProblemSpots(scope: string, stateName: string, districtName: string, placeQuery: string) {
  if (scope === "national") {
    return {
      markdown: `### National-Scale Google Maps Civic & Highway Hotspot Intelligence

1. National Highway 44 (NH-44) - Chambal & North-South Corridor Chokepoint
   - Location: NH-44 Gwalior-Jhansi-Lalitpur Highway Junction, Central India
   - Hazard: Monsoon heavy axle deformation, recurring 1.5-meter crater formation, low-visibility intersection near dhabas.
   - Severity: CRITICAL
   - Authority: National Highways Authority of India (NHAI) Project Implementation Unit
   - Protocol: Cold polymer bitumen hot-mix resurfacing with reflective retro-cat-eyes within 48h.

2. Delhi-Mumbai Industrial Corridor (DMIC) Pithampur Freight Bypass
   - Location: Sector 3 Industrial Estate Intersection, Dhar-Indore Bypass, MP
   - Hazard: High chemical tanker traffic with unpaved road shoulders and broken culverts causing 2-hour traffic gridlocks.
   - Severity: CRITICAL
   - Authority: MP Industrial Development Corporation (MPIDC) & PWD
   - Protocol: Reinforced concrete grade-separator deployment and drainage widening.

3. Western Express Highway (WEH) - Milan Subway & Andheri Flyover Junction
   - Location: Andheri East Western Express Highway, Mumbai, Maharashtra
   - Hazard: Severe tidal waterlogging during high rainfall, subterranean drainage siltation, chronic bumper-to-bumper stall.
   - Severity: HIGH
   - Authority: Brihanmumbai Municipal Corporation (BMC) & MMRDA
   - Protocol: High-capacity 500 HP dewatering pumps and box drain micro-tunneling.

4. Grand Trunk Road (NH-19) - Varanasi-Prayagraj Ghat Access Corridor
   - Location: Cantt Railway Station to Lahartara Junction, Varanasi, Uttar Pradesh
   - Hazard: Overhead high-tension electrical cables sagging over crowded pedestrian marketplaces and open sewer lines.
   - Severity: HIGH
   - Authority: Varanasi Nagar Nigam & Purvanchal Vidyut Vitaran Nigam
   - Protocol: Underground HT cable ducting and precast concrete slab drain covering under Smart Cities Mission.`,
      chunks: [
        { maps: { title: "NH-44 North-South Corridor Junction", uri: "https://www.google.com/maps/search/?api=1&query=NH-44+National+Highway+India" } },
        { maps: { title: "Pithampur Sector 3 Industrial Freight Corridor", uri: "https://www.google.com/maps/search/?api=1&query=Pithampur+Sector+3+Industrial+Area+Dhar" } },
        { maps: { title: "Western Express Highway Andheri East", uri: "https://www.google.com/maps/search/?api=1&query=Western+Express+Highway+Andheri+East+Mumbai" } },
        { maps: { title: "Varanasi Cantt Lahartara Junction", uri: "https://www.google.com/maps/search/?api=1&query=Varanasi+Cantt+Railway+Station+Lahartara" } },
      ],
      spots: [
        {
          id: "nat-spot-1",
          title: "NH-44 North-South Highway Corridor Chokepoint",
          locationName: "NH-44 Gwalior-Jhansi-Lalitpur Section",
          state: "National",
          district: "Inter-State",
          category: "Roads & Potholes",
          severity: "CRITICAL",
          hazardDescription: "Monsoon heavy vehicle axle road deformation, 1.5-meter deep crater clusters, and zero reflective markers creating high-risk collision zones.",
          reportedCondition: "Critical asphalt degradation on bridge approach spans.",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=NH-44+National+Highway+India",
          placeSearchUrl: "https://www.google.com/maps/search/?api=1&query=NH-44+National+Highway+India",
          coordinates: { lat: 26.2183, lng: 78.1828 },
          responsibleAuthority: "NHAI PIU / Ministry of Road Transport & Highways (MoRTH)",
          actionProtocol: "Milling and 50mm Dense Bituminous Macadam overlay with thermoplastic road markings within 48h.",
          groundingSources: [{ title: "NH-44 Google Maps Real-Time Location", uri: "https://www.google.com/maps/search/?api=1&query=NH-44+National+Highway+India" }],
        },
        {
          id: "nat-spot-2",
          title: "DMIC Pithampur Freight Bypass & Bagdun Junction",
          locationName: "Sector 3 Industrial Hub, Dhar-Indore Corridor",
          state: "Madhya Pradesh",
          district: "Dhar",
          category: "Roads & Potholes",
          severity: "CRITICAL",
          hazardDescription: "Industrial freight bottleneck with broken concrete culverts, unpaved muddy road shoulders, and heavy vehicle stagnation.",
          reportedCondition: "Severe water logging and crater formation impacting 10,000+ factory workers daily.",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Pithampur+Sector+3+Industrial+Area+Dhar",
          placeSearchUrl: "https://www.google.com/maps/search/?api=1&query=Pithampur+Sector+3+Industrial+Area+Dhar",
          coordinates: { lat: 22.6013, lng: 75.6844 },
          responsibleAuthority: "MP Industrial Development Corporation (MPIDC) & PWD Dhar",
          actionProtocol: "Paver block reinforcement and precast storm drain construction.",
          groundingSources: [{ title: "Pithampur Sector 3 on Google Maps", uri: "https://www.google.com/maps/search/?api=1&query=Pithampur+Sector+3+Industrial+Area+Dhar" }],
        },
        {
          id: "nat-spot-3",
          title: "Western Express Highway & Milan Subway Drainage Choke",
          locationName: "Andheri East - Santacruz Corridor, Mumbai",
          state: "Maharashtra",
          district: "Mumbai Suburban",
          category: "Sewage & Drain Overflow",
          severity: "HIGH",
          hazardDescription: "Subterranean stormwater drainage siltation leading to 3-foot waterlogging during high tide rainfall, halting airport access traffic.",
          reportedCondition: "Chronic monsoon drainage overflow and arterial traffic blockage.",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Western+Express+Highway+Andheri+East+Mumbai",
          placeSearchUrl: "https://www.google.com/maps/search/?api=1&query=Western+Express+Highway+Andheri+East+Mumbai",
          coordinates: { lat: 19.1136, lng: 72.8697 },
          responsibleAuthority: "Brihanmumbai Municipal Corporation (BMC) Stormwater Dept",
          actionProtocol: "Deployment of 500 HP submersible dewatering pump sets and robotic desilting.",
          groundingSources: [{ title: "Western Express Highway on Google Maps", uri: "https://www.google.com/maps/search/?api=1&query=Western+Express+Highway+Andheri+East+Mumbai" }],
        },
        {
          id: "nat-spot-4",
          title: "GT Road Varanasi Cantt - Lahartara Overbridge Corridor",
          locationName: "Lahartara Bauliya Chowk, Varanasi",
          state: "Uttar Pradesh",
          district: "Varanasi",
          category: "Electricity Hazard & Wiring",
          severity: "HIGH",
          hazardDescription: "Exposed overhead 11kV distribution lines sagging over crowded commercial bazaars with ungrounded junction boxes.",
          reportedCondition: "High danger of electrocution during waterlogged rainy days.",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Varanasi+Cantt+Railway+Station+Lahartara",
          placeSearchUrl: "https://www.google.com/maps/search/?api=1&query=Varanasi+Cantt+Railway+Station+Lahartara",
          coordinates: { lat: 25.3262, lng: 82.9863 },
          responsibleAuthority: "Purvanchal Vidyut Vitaran Nigam Ltd (PVVNL) & Smart City Varanasi",
          actionProtocol: "Immediate underground aerial bunched cabling (ABC) and transformer cage fencing.",
          groundingSources: [{ title: "Varanasi Lahartara Chowk on Google Maps", uri: "https://www.google.com/maps/search/?api=1&query=Varanasi+Cantt+Railway+Station+Lahartara" }],
        },
      ],
    };
  }

  // District / State specific real place spots (e.g. Dhar, Indore, Mumbai, etc.)
  const isDhar = districtName.toLowerCase().includes("dhar") || placeQuery.toLowerCase().includes("dhar") || placeQuery.toLowerCase().includes("pithampur");
  const isMumbai = districtName.toLowerCase().includes("mumbai") || stateName.toLowerCase().includes("maharashtra");
  
  if (isDhar) {
    return {
      markdown: `### Google Maps Real-Place Intelligence for District Dhar (Madhya Pradesh)

1. Bagdun Talab Road & Sector 3 Industrial Approach
   - Location: Bagdun Talab Road, Ward 27, Pithampur Industrial Belt, Dhar (Near Talab Chowk)
   - Hazard: 3-foot deep pothole cluster, continuous chemical waterlogging from overflowing surface nullahs, severe two-wheeler skid hazard.
   - Severity: CRITICAL
   - Authority: Municipal Council Pithampur & PWD Sub-Division Dhar
   - Action: Slag-asphalt patching, concrete retaining wall on talab flank within 24h.

2. Dhar Fort & Bhojshala Historical Access Corridor
   - Location: Fort Road, Old City Bazaar, Ward 12, Dhar City
   - Hazard: Narrow tourist route with open uncovered storm drains, high pedestrian risk, and non-functional sodium vapour streetlights.
   - Severity: HIGH
   - Authority: Dhar Nagar Palika Parishad (Public Works & Electrical Cell)
   - Action: Heavy-duty RCC drain cover slabs and high-lumen solar LED illumination.

3. Dhar District Hospital (Civil Hospital) Emergency Gate Road
   - Location: Old Bus Stand Road to District Hospital Emergency Gate, Dhar
   - Hazard: Garbage vulnerable dump site (GVP) directly opposite ambulance entry, stray cattle congregation causing transit delays for critical patients.
   - Severity: CRITICAL
   - Authority: Municipal Health & Solid Waste Management Wing, Dhar
   - Action: Mechanized tipper clearance, bio-disinfection spray, and 24x7 anti-dumping surveillance sensor.

4. Dhar-Mandu Tourism Highway (SH-38) - Nalchha Ghat Stretch
   - Location: State Highway 38, Nalchha Ghat Curve, Dhar District
   - Hazard: Landslide prone slope with broken crash barriers, deep road edge ruts, and lack of convex blind-curve mirrors.
   - Severity: HIGH
   - Authority: MP State Road Development Corporation (MPRDC)
   - Action: W-beam crash barrier installation and rockfall protective netting.`,
      chunks: [
        { maps: { title: "Bagdun Talab Pithampur Dhar", uri: "https://www.google.com/maps/search/?api=1&query=Bagdun+Talab+Pithampur+Dhar+Madhya+Pradesh" } },
        { maps: { title: "Dhar Fort & Bhojshala Complex", uri: "https://www.google.com/maps/search/?api=1&query=Dhar+Fort+Madhya+Pradesh" } },
        { maps: { title: "Dhar District Hospital Emergency Gate", uri: "https://www.google.com/maps/search/?api=1&query=District+Hospital+Dhar+Madhya+Pradesh" } },
        { maps: { title: "Dhar Mandu State Highway 38 Nalchha", uri: "https://www.google.com/maps/search/?api=1&query=Nalchha+Dhar+Mandu+Road+Madhya+Pradesh" } },
      ],
      spots: [
        {
          id: "dhar-spot-1",
          title: "Bagdun Talab Road & Sector 3 Industrial Approach",
          locationName: "Bagdun Talab Road, Ward 27, Pithampur, Dhar",
          state: "Madhya Pradesh",
          district: "Dhar",
          category: "Roads & Potholes",
          severity: "CRITICAL",
          hazardDescription: "Multiple 3-foot deep pothole craters with stagnant rainwater overflow, creating severe accident risks for shift workers and two-wheelers.",
          reportedCondition: "Critical road surface collapse near Talab overflow weir.",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Bagdun+Talab+Pithampur+Dhar+Madhya+Pradesh",
          placeSearchUrl: "https://www.google.com/maps/search/?api=1&query=Bagdun+Talab+Pithampur+Dhar+Madhya+Pradesh",
          coordinates: { lat: 22.6092, lng: 75.6881 },
          responsibleAuthority: "Pithampur Nagar Palika Parishad / PWD Dhar",
          actionProtocol: "Cold polymer asphalt filling, water diversion trenches, and 48-hour SLA completion.",
          groundingSources: [{ title: "Bagdun Talab on Google Maps", uri: "https://www.google.com/maps/search/?api=1&query=Bagdun+Talab+Pithampur+Dhar+Madhya+Pradesh" }],
        },
        {
          id: "dhar-spot-2",
          title: "Dhar District Civil Hospital Emergency Access Gate",
          locationName: "Old Bus Stand to Civil Hospital Road, Ward 8, Dhar",
          state: "Madhya Pradesh",
          district: "Dhar",
          category: "Garbage & Sanitation",
          severity: "CRITICAL",
          hazardDescription: "Open garbage dumping point opposite emergency ambulance entry, bio-waste contamination, and stray animal obstruction.",
          reportedCondition: "Severe sanitation hazard and ambulance blockage.",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=District+Hospital+Dhar+Madhya+Pradesh",
          placeSearchUrl: "https://www.google.com/maps/search/?api=1&query=District+Hospital+Dhar+Madhya+Pradesh",
          coordinates: { lat: 22.5976, lng: 75.2967 },
          responsibleAuthority: "Dhar Nagar Palika Parishad (Sanitation Department)",
          actionProtocol: "Immediate JCB waste clearance, bleaching powder sanitization, and beautification barrier installation within 24h.",
          groundingSources: [{ title: "District Hospital Dhar on Google Maps", uri: "https://www.google.com/maps/search/?api=1&query=District+Hospital+Dhar+Madhya+Pradesh" }],
        },
        {
          id: "dhar-spot-3",
          title: "Dhar Historic Fort Road & Bhojshala Heritage Access",
          locationName: "Fort Gate Chowk, Ward 12, Old Dhar City",
          state: "Madhya Pradesh",
          district: "Dhar",
          category: "Sewage & Drain Overflow",
          severity: "HIGH",
          hazardDescription: "Uncovered historic storm drain overflowing onto pedestrian cobblestones, non-functional streetlights creating dark blindspots.",
          reportedCondition: "Open drain hazard in heavy footfall tourist zone.",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Dhar+Fort+Madhya+Pradesh",
          placeSearchUrl: "https://www.google.com/maps/search/?api=1&query=Dhar+Fort+Madhya+Pradesh",
          coordinates: { lat: 22.6025, lng: 75.3048 },
          responsibleAuthority: "Archaeological Survey Liaison & Dhar Nagar Palika",
          actionProtocol: "Precast concrete drain covers and 65W LED streetlight replacement.",
          groundingSources: [{ title: "Dhar Fort on Google Maps", uri: "https://www.google.com/maps/search/?api=1&query=Dhar+Fort+Madhya+Pradesh" }],
        },
        {
          id: "dhar-spot-4",
          title: "SH-38 Dhar-Mandu Tourism Ghat Road (Nalchha Curve)",
          locationName: "State Highway 38, Nalchha Ghat, Dhar District",
          state: "Madhya Pradesh",
          district: "Dhar",
          category: "Roads & Potholes",
          severity: "HIGH",
          hazardDescription: "Damaged mountain slope crash barriers, sharp hair-pin turn asphalt disintegration, and lack of warning blinkers.",
          reportedCondition: "Dangerous ghat section with high accident vulnerability.",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Nalchha+Dhar+Mandu+Road+Madhya+Pradesh",
          placeSearchUrl: "https://www.google.com/maps/search/?api=1&query=Nalchha+Dhar+Mandu+Road+Madhya+Pradesh",
          coordinates: { lat: 22.4286, lng: 75.3854 },
          responsibleAuthority: "MP State Road Development Corporation (MPRDC)",
          actionProtocol: "W-Beam crash barrier replacement and solar blinker installation.",
          groundingSources: [{ title: "Nalchha Ghat on Google Maps", uri: "https://www.google.com/maps/search/?api=1&query=Nalchha+Dhar+Mandu+Road+Madhya+Pradesh" }],
        },
      ],
    };
  }

  // Generic District / Real Place generator
  return {
    markdown: `### Real-Place Google Maps Civic Problem Spots for ${districtName}, ${stateName}

1. ${districtName} Central Railway Station & Main Bus Stand Approach Road
   - Location: Station Road Junction, Central Ward, ${districtName}
   - Hazard: Chronic traffic bottlenecks, uneven tarmac potholes, and stagnant drainage puddles near transit entry gates.
   - Severity: HIGH
   - Authority: ${districtName} Municipal Corporation & PWD
   - Action: Micro-surfacing of 800m road stretch and drain grating installation.

2. ${districtName} District Collectorate & Jan Sunwai Kendra Chowk
   - Location: Collector Office Roundabout, Civil Lines, ${districtName}
   - Hazard: Inoperative traffic signaling lights and pedestrian zebra crossing fade causing public chaos during peak office hours.
   - Severity: MEDIUM
   - Authority: Traffic Police & Municipal Electrical Wing
   - Action: Synchronized solar smart traffic timer replacement.

3. ${districtName} Main Vegetable & Grain Mandi Market Yard
   - Location: Krishi Upaj Mandi Complex, Outer Ring Road, ${districtName}
   - Hazard: Daily 4-tonne organic vegetable refuse dumping with lack of covered compactors, emitting noxious odor and blocking drainage channels.
   - Severity: CRITICAL
   - Authority: Agriculture Produce Market Committee (APMC) & Municipal Sanitation Wing
   - Action: Deployment of 20kl mechanized compactor and daily biomethanation transfer.

4. ${districtName} Government General Hospital Feeder Pipeline Route
   - Location: Hospital Road, Ward 15, ${districtName}
   - Hazard: Major underground 300mm drinking water main pipeline burst, leaking 50,000 liters of treated water daily and eroding road base.
   - Severity: CRITICAL
   - Authority: Public Health Engineering Department (PHED) / Jal Board
   - Action: Excavation, high-pressure ductile iron sleeve clamp repair within 24h.`,
    chunks: [
      { maps: { title: `${districtName} Bus Stand Junction`, uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${districtName} Bus Stand ${stateName}`)}` } },
      { maps: { title: `${districtName} Collectorate Office`, uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Collector Office ${districtName} ${stateName}`)}` } },
      { maps: { title: `${districtName} Main Market Yard`, uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Mandi ${districtName} ${stateName}`)}` } },
      { maps: { title: `${districtName} District Hospital`, uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`District Hospital ${districtName} ${stateName}`)}` } },
    ],
    spots: [
      {
        id: `spot-${districtName.toLowerCase()}-1`,
        title: `${districtName} Central Transit & Station Road Junction`,
        locationName: `Station Road, Central Ward, ${districtName}`,
        state: stateName,
        district: districtName,
        category: "Roads & Potholes",
        severity: "HIGH",
        hazardDescription: "Uneven tarmac degradation, large pothole clusters, and waterlogging stalling public buses and auto-rickshaws.",
        reportedCondition: "Arterial commute breakdown with high risk of commuter accidents.",
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${districtName} Railway Station Bus Stand ${stateName}`)}`,
        placeSearchUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${districtName} Railway Station Bus Stand ${stateName}`)}`,
        responsibleAuthority: `${districtName} Municipal Corporation / PWD`,
        actionProtocol: "Cold-mix bitumen resurfacing and side drain desilting within 48h.",
        groundingSources: [{ title: `${districtName} Transit Hub on Google Maps`, uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${districtName} Station ${stateName}`)}` }],
      },
      {
        id: `spot-${districtName.toLowerCase()}-2`,
        title: `${districtName} Main Mandi Commercial Waste Hub`,
        locationName: `Krishi Upaj Mandi Complex, Ring Road, ${districtName}`,
        state: stateName,
        district: districtName,
        category: "Garbage & Sanitation",
        severity: "CRITICAL",
        hazardDescription: "Massive open organic garbage accumulation obstructing stormwater channels and creating public health disease vector risks.",
        reportedCondition: "Chronic sanitation failure and road encroachment.",
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Krishi Mandi ${districtName} ${stateName}`)}`,
        placeSearchUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Krishi Mandi ${districtName} ${stateName}`)}`,
        responsibleAuthority: `${districtName} Solid Waste Management Wing`,
        actionProtocol: "Installation of twin hydraulic compactors and daily bio-spray within 24h.",
        groundingSources: [{ title: `${districtName} Mandi on Google Maps`, uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Mandi ${districtName} ${stateName}`)}` }],
      },
      {
        id: `spot-${districtName.toLowerCase()}-3`,
        title: `${districtName} Hospital Feeder Water Pipeline Leak`,
        locationName: `Civil Hospital Road, Ward 15, ${districtName}`,
        state: stateName,
        district: districtName,
        category: "Drinking Water & Pipeline Leakage",
        severity: "CRITICAL",
        hazardDescription: "Underground main transmission water pipe rupture leading to loss of drinking water supply to 5,000 households and undermining road sub-base.",
        reportedCondition: "Severe water wastage and road foundation cavitation.",
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`District Hospital ${districtName} ${stateName}`)}`,
        placeSearchUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`District Hospital ${districtName} ${stateName}`)}`,
        responsibleAuthority: "Public Health Engineering Department (PHED) / Jal Board",
        actionProtocol: "Emergency hydraulic isolation, pipe collar replacement, and road restoration within 24h.",
        groundingSources: [{ title: `${districtName} Hospital Road on Google Maps`, uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`District Hospital ${districtName} ${stateName}`)}` }],
      },
    ],
  };
}

// 7. Google BigQuery Civic Analytics & Data-Driven Governance Engine
app.get("/api/bigquery/analytics", async (req, res) => {
  try {
    const timeRange = (req.query.timeRange as string) || "30d";
    const selectedState = (req.query.state as string) || "Madhya Pradesh";
    const selectedDistrict = (req.query.district as string) || "All Districts";

    // BigQuery mock/real dataset metadata
    const bigQueryMetadata = {
      projectId: "gov-janvani-national-analytics",
      datasetId: "gov_janvani_dw",
      tableId: "grievances_partitioned_clustered",
      partitionColumn: "submission_date (DAY)",
      clusterColumns: ["state_code", "district_name", "category_id"],
      lastSyncTimestamp: new Date().toISOString(),
      bytesScannedMb: (Math.random() * 25 + 35).toFixed(2),
      slotExecutionTimeMs: Math.floor(Math.random() * 200 + 140),
      cacheHit: Math.random() > 0.3,
      totalRowsAnalyzed: 148290,
      totalGrievancesLogged: 34180,
    };

    // 1. Time-series grievance trend data and summary metrics based on selected period
    const isWeek = timeRange === "7d" || timeRange === "week";
    const isYear = timeRange === "1y" || timeRange === "year";

    const trendsData = isWeek
      ? [
          { day: "Mon", date: "Aug 25", submitted: 182, resolved: 174, reported: 182, slaBreached: 8, avgResolutionHours: 21.2, pendingActive: 44, slaSpeed: 21.2 },
          { day: "Tue", date: "Aug 26", submitted: 215, resolved: 202, reported: 215, slaBreached: 13, avgResolutionHours: 22.4, pendingActive: 57, slaSpeed: 22.4 },
          { day: "Wed", date: "Aug 27", submitted: 310, resolved: 290, reported: 310, slaBreached: 20, avgResolutionHours: 24.1, pendingActive: 77, slaSpeed: 24.1 },
          { day: "Thu", date: "Aug 28", submitted: 260, resolved: 248, reported: 260, slaBreached: 12, avgResolutionHours: 20.8, pendingActive: 89, slaSpeed: 20.8 },
          { day: "Fri", date: "Aug 29", submitted: 275, resolved: 260, reported: 275, slaBreached: 15, avgResolutionHours: 21.8, pendingActive: 104, slaSpeed: 21.8 },
          { day: "Sat", date: "Aug 30", submitted: 165, resolved: 172, reported: 165, slaBreached: 7, avgResolutionHours: 18.2, pendingActive: 97, slaSpeed: 18.2 },
          { day: "Sun", date: "Aug 31", submitted: 120, resolved: 128, reported: 120, slaBreached: 5, avgResolutionHours: 17.5, pendingActive: 89, slaSpeed: 17.5 },
        ]
      : [
          { day: "Week 1", date: "Aug 01-07", submitted: 1820, resolved: 1710, reported: 1820, slaBreached: 110, avgResolutionHours: 22.6, pendingActive: 220, slaSpeed: 22.6 },
          { day: "Week 2", date: "Aug 08-14", submitted: 2140, resolved: 2010, reported: 2140, slaBreached: 130, avgResolutionHours: 21.8, pendingActive: 350, slaSpeed: 21.8 },
          { day: "Week 3", date: "Aug 15-21", submitted: 2490, resolved: 2320, reported: 2490, slaBreached: 170, avgResolutionHours: 23.4, pendingActive: 520, slaSpeed: 23.4 },
          { day: "Week 4", date: "Aug 22-31", submitted: 1970, resolved: 1890, reported: 1970, slaBreached: 80, avgResolutionHours: 19.8, pendingActive: 600, slaSpeed: 19.8 },
        ];

    const summaryStats = isWeek
      ? {
          totalRegistered: 1527,
          inAction: 389,
          resolved: 1474,
          priority: 80,
          resolutionRate: 96,
          avgSpeed: "21.2h",
          slaMax: "48h max",
          rateChange: "+12% this week",
          periodLabel: "This Week (Aug 25 - 31)",
        }
      : {
          totalRegistered: 8420,
          inAction: 1840,
          resolved: 7930,
          priority: 385,
          resolutionRate: 94,
          avgSpeed: "19.8h",
          slaMax: "30-Day Rate: 96.4%",
          rateChange: "+18% this month",
          periodLabel: "This Month (August 2026)",
        };

    // 2. Average Resolution Time by Category vs Target Statutory SLA (hours)
    const categorySlaData = [
      { category: "Roads & Potholes", actualAvgHours: 36.4, statutorySlaHours: 48, p95Hours: 54, complaintsCount: 12450, complianceRate: 91.2 },
      { category: "Garbage & Sanitation", actualAvgHours: 14.8, statutorySlaHours: 24, p95Hours: 22, complaintsCount: 9840, complianceRate: 96.8 },
      { category: "Water Supply Leakage", actualAvgHours: 18.2, statutorySlaHours: 24, p95Hours: 26, complaintsCount: 5620, complianceRate: 94.1 },
      { category: "Drain & Sewer Overflow", actualAvgHours: 28.6, statutorySlaHours: 48, p95Hours: 44, complaintsCount: 3890, complianceRate: 92.5 },
      { category: "Electricity & Wiring", actualAvgHours: 11.5, statutorySlaHours: 24, p95Hours: 19, complaintsCount: 2780, complianceRate: 98.4 },
      { category: "Streetlight Breakdown", actualAvgHours: 39.0, statutorySlaHours: 48, p95Hours: 51, complaintsCount: 2100, complianceRate: 88.7 },
      { category: "Public Health & Fogging", actualAvgHours: 22.3, statutorySlaHours: 48, p95Hours: 35, complaintsCount: 1450, complianceRate: 95.0 },
    ];

    // 3. District-level Hot-Spot Density & Governance Performance Index
    const districtHotspotData = [
      { district: "Dhar", state: "Madhya Pradesh", totalComplaints: 4280, hotspotDensityIndex: 88.4, avgResolutionHours: 21.2, slaPassRate: 95.2, criticalZonesCount: 7, resolvedRate: 93.8 },
      { district: "Indore", state: "Madhya Pradesh", totalComplaints: 7890, hotspotDensityIndex: 94.6, avgResolutionHours: 16.5, slaPassRate: 98.1, criticalZonesCount: 12, resolvedRate: 97.4 },
      { district: "Bhopal", state: "Madhya Pradesh", totalComplaints: 6120, hotspotDensityIndex: 82.1, avgResolutionHours: 23.8, slaPassRate: 92.4, criticalZonesCount: 9, resolvedRate: 91.0 },
      { district: "Ujjain", state: "Madhya Pradesh", totalComplaints: 3410, hotspotDensityIndex: 76.5, avgResolutionHours: 24.1, slaPassRate: 93.7, criticalZonesCount: 5, resolvedRate: 92.9 },
      { district: "Jabalpur", state: "Madhya Pradesh", totalComplaints: 4190, hotspotDensityIndex: 79.8, avgResolutionHours: 27.4, slaPassRate: 89.6, criticalZonesCount: 6, resolvedRate: 88.4 },
      { district: "Gwalior", state: "Madhya Pradesh", totalComplaints: 3880, hotspotDensityIndex: 81.3, avgResolutionHours: 26.9, slaPassRate: 90.2, criticalZonesCount: 8, resolvedRate: 89.1 },
      { district: "Mumbai Suburban", state: "Maharashtra", totalComplaints: 14200, hotspotDensityIndex: 97.2, avgResolutionHours: 28.4, slaPassRate: 89.3, criticalZonesCount: 24, resolvedRate: 87.6 },
      { district: "Pune", state: "Maharashtra", totalComplaints: 9840, hotspotDensityIndex: 86.7, avgResolutionHours: 22.1, slaPassRate: 94.2, criticalZonesCount: 14, resolvedRate: 93.5 },
      { district: "North Delhi", state: "Delhi", totalComplaints: 8430, hotspotDensityIndex: 91.5, avgResolutionHours: 25.0, slaPassRate: 91.8, criticalZonesCount: 15, resolvedRate: 90.2 },
      { district: "Bangalore Urban", state: "Karnataka", totalComplaints: 11950, hotspotDensityIndex: 95.1, avgResolutionHours: 31.2, slaPassRate: 86.4, criticalZonesCount: 19, resolvedRate: 85.1 },
    ];

    // 4. Department Workload & Velocity Mart
    const departmentWorkloadData = [
      { department: "Public Works Dept (PWD)", activeLoad: 412, completedTotal: 8920, avgDurationHours: 34.2, expenditureLakhs: 142.5, efficiencyScore: 88 },
      { department: "Solid Waste Management", activeLoad: 180, completedTotal: 12400, avgDurationHours: 14.1, expenditureLakhs: 86.0, efficiencyScore: 96 },
      { department: "Water Supply & PHED", activeLoad: 245, completedTotal: 6510, avgDurationHours: 19.4, expenditureLakhs: 94.2, efficiencyScore: 93 },
      { department: "Discom / Electricity Board", activeLoad: 92, completedTotal: 4180, avgDurationHours: 12.0, expenditureLakhs: 38.5, efficiencyScore: 97 },
      { department: "Municipal Drainage Wing", activeLoad: 164, completedTotal: 3450, avgDurationHours: 27.8, expenditureLakhs: 64.8, efficiencyScore: 89 },
    ];

    // 5. Ward Density Cluster Breakdown for Selected District
    const wardDensityData = [
      { ward: "Ward 27 (Bagdun / Sector 3)", complaints: 485, severityAvg: 8.4, densityPct: 34.2, primaryIssue: "Road Cratering & Nullah Overflow" },
      { ward: "Ward 12 (Fort & Bhojshala)", complaints: 290, severityAvg: 7.1, densityPct: 20.4, primaryIssue: "Open Heritage Drains & Streetlights" },
      { ward: "Ward 8 (Civil Hospital Area)", complaints: 240, severityAvg: 8.9, densityPct: 16.9, primaryIssue: "Hospital Gate Garbage & Bio-Waste" },
      { ward: "Ward 15 (Old Mandi Ring Rd)", complaints: 215, severityAvg: 6.8, densityPct: 15.1, primaryIssue: "Water Main Distribution Leakage" },
      { ward: "Ward 21 (Housing Board Col)", complaints: 190, severityAvg: 6.2, densityPct: 13.4, primaryIssue: "Sagging Low-Tension Power Wires" },
    ];

    // 6. BigQuery SQL Schema & Sample Executed Query
    const standardSql = `SELECT 
  district_name,
  category_name,
  COUNT(grievance_id) AS total_volume,
  ROUND(AVG(TIMESTAMP_DIFF(resolved_at, created_at, HOUR)), 1) AS avg_resolution_hours,
  ROUND(COUNTIF(sla_breach_flag = FALSE) * 100.0 / COUNT(*), 1) AS sla_compliance_pct,
  COUNTIF(severity_score >= 8) AS critical_hotspots
FROM 
  \`gov-janvani-national-analytics.gov_janvani_dw.grievances_partitioned_clustered\`
WHERE 
  DATE(created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  ${selectedDistrict !== "All Districts" ? `AND district_name = '${selectedDistrict}'` : ""}
GROUP BY 
  district_name, category_name
ORDER BY 
  total_volume DESC
LIMIT 100;`;

    res.json({
      metadata: bigQueryMetadata,
      summary: summaryStats,
      trends: trendsData,
      categorySla: categorySlaData,
      districtHotspots: districtHotspotData,
      departmentWorkload: departmentWorkloadData,
      wardDensity: wardDensityData,
      standardSql: standardSql,
      timeRange: timeRange,
      selectedState: selectedState,
      selectedDistrict: selectedDistrict,
    });
  } catch (error: any) {
    console.error("BigQuery analytics error:", error);
    res.status(500).json({ error: error.message || "Failed to load BigQuery analytics" });
  }
});

// 8. Custom BigQuery SQL Query / AI Natural Language Query Runner
app.post("/api/bigquery/run-query", async (req, res) => {
  try {
    const { queryText, isNaturalLanguage = false } = req.body;
    const ai = getAI();

    let sqlToExecute = queryText || "";
    let aiExplanation = "";

    if (isNaturalLanguage && ai) {
      const sqlPrompt = `You are the Google BigQuery Data Architect for JanVani (Ministry of Housing & Urban Affairs - MoHUA).
Translate this natural language civic analytics request into standard Google BigQuery SQL.
Dataset schema:
- Table: \`gov-janvani-national-analytics.gov_janvani_dw.grievances_partitioned_clustered\`
- Columns:
  - grievance_id (STRING)
  - token (STRING)
  - state_name (STRING)
  - district_name (STRING)
  - ward_number (INT64)
  - category_name (STRING)
  - department_name (STRING)
  - severity_score (INT64 1-10)
  - status (STRING: 'Submitted', 'Work In Progress', 'Resolved')
  - created_at (TIMESTAMP)
  - resolved_at (TIMESTAMP)
  - resolution_hours (FLOAT64)
  - sla_target_hours (INT64)
  - sla_breach_flag (BOOL)
  - repair_cost_inr (FLOAT64)

User Prompt: "${queryText}"

Return JSON:
{
  "sql": "SELECT ...",
  "explanation": "Brief 1-2 sentence description of what this BigQuery analysis computes",
  "recommendedChart": "AreaChart" | "BarChart" | "LineChart" | "PieChart"
}`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: sqlPrompt,
        config: { responseMimeType: "application/json" },
      });

      try {
        const parsed = JSON.parse(aiResponse.text || "{}");
        sqlToExecute = parsed.sql || sqlToExecute;
        aiExplanation = parsed.explanation || "Analyzed using BigQuery partitioned engine.";
      } catch {
        // Fallback SQL
        sqlToExecute = `SELECT district_name, category_name, COUNT(*) AS grievance_count, AVG(resolution_hours) as avg_hours FROM \`gov-janvani-national-analytics.gov_janvani_dw.grievances_partitioned_clustered\` GROUP BY 1, 2 ORDER BY grievance_count DESC LIMIT 20;`;
        aiExplanation = "Computed district and category defect aggregations from BigQuery.";
      }
    }

    // Generate realistic query execution results
    const rows = [
      { district: "Dhar", category: "Roads & Potholes", volume: 1840, avg_resolution_hrs: 34.2, sla_pass_pct: 94.8, total_budget_inr: 4520000 },
      { district: "Dhar", category: "Garbage & Sanitation", volume: 1210, avg_resolution_hrs: 13.9, sla_pass_pct: 97.2, total_budget_inr: 1890000 },
      { district: "Dhar", category: "Drinking Water Supply", volume: 680, avg_resolution_hrs: 17.5, sla_pass_pct: 95.0, total_budget_inr: 1450000 },
      { district: "Indore", category: "Roads & Potholes", volume: 2940, avg_resolution_hrs: 22.8, sla_pass_pct: 98.4, total_budget_inr: 8900000 },
      { district: "Indore", category: "Garbage & Sanitation", volume: 2450, avg_resolution_hrs: 9.8, sla_pass_pct: 99.2, total_budget_inr: 3200000 },
      { district: "Bhopal", category: "Drain & Sewerage", volume: 1520, avg_resolution_hrs: 26.4, sla_pass_pct: 91.5, total_budget_inr: 3800000 },
      { district: "Ujjain", category: "Streetlight Breakdown", volume: 840, avg_resolution_hrs: 38.1, sla_pass_pct: 89.2, total_budget_inr: 950000 },
      { district: "Mumbai Suburban", category: "Roads & Potholes", volume: 5400, avg_resolution_hrs: 36.8, sla_pass_pct: 88.1, total_budget_inr: 14200000 },
    ];

    res.json({
      sql: sqlToExecute || `SELECT district_name, category_name, COUNT(*) AS grievance_count, AVG(resolution_hours) as avg_hours FROM \`gov-janvani-national-analytics.gov_janvani_dw.grievances_partitioned_clustered\` GROUP BY 1, 2 ORDER BY grievance_count DESC LIMIT 20;`,
      explanation: aiExplanation || "Generated BigQuery SQL for governance analytics.",
      executionStats: {
        bytesProcessed: "54.2 MB",
        queryTimeMs: 284,
        slotMilliseconds: 812,
        cacheHit: true,
        billingTier: 1,
      },
      columns: ["district", "category", "volume", "avg_resolution_hrs", "sla_pass_pct", "total_budget_inr"],
      rows: rows,
    });
  } catch (error: any) {
    console.warn("Run query API notice (using mock engine):", error?.message || error);
    res.json({
      sql: `SELECT district_name, category_name, COUNT(*) AS grievance_count, AVG(resolution_hours) as avg_hours FROM \`gov-janvani-national-analytics.gov_janvani_dw.grievances_partitioned_clustered\` GROUP BY 1, 2 ORDER BY grievance_count DESC LIMIT 20;`,
      explanation: "BigQuery DW analytics computed across active districts.",
      executionStats: {
        bytesProcessed: "54.2 MB",
        queryTimeMs: 284,
        slotMilliseconds: 812,
        cacheHit: true,
        billingTier: 1,
      },
      columns: ["district", "category", "volume", "avg_resolution_hrs", "sla_pass_pct", "total_budget_inr"],
      rows: [
        { district: "Dhar", category: "Roads & Potholes", volume: 1840, avg_resolution_hrs: 34.2, sla_pass_pct: 94.8, total_budget_inr: 4520000 },
        { district: "Dhar", category: "Garbage & Sanitation", volume: 1210, avg_resolution_hrs: 13.9, sla_pass_pct: 97.2, total_budget_inr: 1890000 },
        { district: "Indore", category: "Roads & Potholes", volume: 2940, avg_resolution_hrs: 22.8, sla_pass_pct: 98.4, total_budget_inr: 8900000 },
      ],
    });
  }
});

// 9. AI Governance Intelligence & Predictive Decision Support
app.post("/api/bigquery/governance-ai-insights", async (req, res) => {
  const { district = "Dhar", state = "Madhya Pradesh" } = req.body || {};

  const getFallbackGovernanceInsights = () => ({
    insights: [
      {
        title: `Pothole Density Spikes in ${district} Industrial Corridors`,
        severity: "HIGH",
        metric: "42% of all district road defects concentrated in 2 adjacent wards",
        recommendation: "Issue emergency blanket road milling & 50mm bitumen overlays before weekend monsoon spell. Deploy PWD squad #4 with mobile asphalt patching vehicle.",
        projectedImpact: "+14.2% faster turnaround, prevents 85+ traffic stoppages daily.",
      },
      {
        title: `${district} Civil Hospital Approach Sanitation SLA Bottleneck`,
        severity: "CRITICAL",
        metric: "Hospital Road experiencing recurring open dumping opposite ambulance gate",
        recommendation: "Station a 20kl mechanized hydraulic compactor and assign 2 dedicated sanitary inspectors for 24x7 clearance under Swachh Bharat Urban cell.",
        projectedImpact: "Eliminates ambulance transit delays and achieves 99% ward sanitation SLA compliance.",
      },
      {
        title: `${district} High-Pressure Water Pipeline Leakage (Mandi Feeder)`,
        severity: "MEDIUM",
        metric: "Estimated 45,000 liters/day unmetered treated water loss",
        recommendation: "Install acoustic leak detection sensors and replace 300mm ductile iron sleeve collars on transmission line.",
        projectedImpact: "Conserves municipal water reserves and prevents road foundation erosion.",
      },
    ],
    predictiveTrendText: `BigQuery ML forecasting predicts a 28% increase in storm drain overflow complaints over the next 14 days in ${district}, ${state} due to localized convective monsoon cloudbursts. Pre-emptive desilting of major culverts is strongly recommended.`,
  });

  try {
    const ai = getAI();

    if (!ai) {
      return res.json(getFallbackGovernanceInsights());
    }

    const prompt = `You are the BigQuery AI Senior Governance Analyst for the Ministry of Housing & Urban Affairs (MoHUA), Government of India.
Analyze the multi-dimensional civic performance data for District: ${district}, State: ${state}.
Generate 3 strategic, highly actionable data-driven governance interventions for the District Collector and Municipal Commissioner, plus a predictive weather/civic trend forecast.

Format JSON strictly:
{
  "insights": [
    {
      "title": "Concise administrative title",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM",
      "metric": "Key statistical finding from BigQuery DW",
      "recommendation": "Exact engineering / municipal squad action",
      "projectedImpact": "Measurable SLA or citizen outcome"
    }
  ],
  "predictiveTrendText": "2-3 sentence forward-looking predictive risk assessment using BigQuery ML forecasting."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.warn("Governance AI API notice (using fallback insights):", error?.message || error);
    res.json(getFallbackGovernanceInsights());
  }
});

// Notifications In-Memory Store & Endpoints
let systemNotifications = [
  {
    id: "notif-1",
    title: "Field Unit Dispatched",
    message: "Inspection team reached Ward 27 (Bagdun) for road crater patching under Token JV-MP-DHAR-2026-0891.",
    timestamp: "12 mins ago",
    type: "status_update",
    read: false,
    token: "JV-MP-DHAR-2026-0891",
  },
  {
    id: "notif-2",
    title: "Statutory SLA Alert: 8 Hours Remaining",
    message: "Overhead transformer oil leak near Bagdun Mandi requires urgent clearance before SLA breach.",
    timestamp: "35 mins ago",
    type: "sla_warning",
    read: false,
    token: "JV-MP-DHAR-2026-0418",
  },
  {
    id: "notif-3",
    title: "Grievance Certified & Resolved",
    message: "Drinking water pipeline leak at Civil Hospital junction has been successfully repaired and dual-verified.",
    timestamp: "2 hours ago",
    type: "resolution",
    read: false,
    token: "JV-MP-DHAR-2026-0105",
  },
  {
    id: "notif-4",
    title: "Citizen Support Milestone",
    message: "Your reported civic issue 'Monsoon Road Crater' has garnered 48 community upvotes in your ward.",
    timestamp: "4 hours ago",
    type: "upvote",
    read: true,
    token: "JV-MP-DHAR-2026-0891",
  },
  {
    id: "notif-5",
    title: "WhatsApp Seva Grievance Ingested",
    message: "New public sanitation report ingested via WhatsApp Hotline (+91 90131 51515). Token JV-WA-DHAR-2026-9102 assigned.",
    timestamp: "5 hours ago",
    type: "new_grievance",
    read: true,
    token: "JV-WA-DHAR-2026-9102",
  },
];

app.get("/api/notifications", (req, res) => {
  res.json({
    success: true,
    notifications: systemNotifications,
    unreadCount: systemNotifications.filter((n) => !n.read).length,
  });
});

app.post("/api/notifications/read", (req, res) => {
  const { id, all } = req.body || {};
  if (all) {
    systemNotifications = systemNotifications.map((n) => ({ ...n, read: true }));
  } else if (id) {
    systemNotifications = systemNotifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  }
  res.json({
    success: true,
    notifications: systemNotifications,
    unreadCount: systemNotifications.filter((n) => !n.read).length,
  });
});

// Vite Middleware for Development / Static serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JanVani National Portal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
