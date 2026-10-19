import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

interface ChatTurn {
  sender: "interviewer" | "candidate";
  text: string;
  isChallenge?: boolean;
}

interface CandidateProfile {
  name: string;
  education: string;
  workExperience: string;
  aiExperience: string;
  programmingKnowledge: string;
  languages: string;
  remoteExperience: string;
  goals: string;
}

interface Phase4Result {
  selectedModel: "A" | "B" | "";
  ratings: { A: number; B: number };
  rationale: string;
}

const PLATFORM_NAMES = ["Scale AI", "Outlier", "Alignerr", "Invisible", "Mercor", "Micro1"] as const;

const COMPETENCY_KEYS = [
  "communication",
  "instructionFollowing",
  "accuracyEvaluation",
  "contextTracking",
  "reasoning",
  "responseRanking",
  "safetyAwareness",
  "professionalism",
  "confidence",
  "analyticalThinking",
  "evidenceBasedDecisionMaking",
] as const;

// Real, currently-reachable sections of the app — the model must pick from
// this exact list rather than inventing a specific lesson id (the old local
// scoring code pointed at "p2_m1_l6 (...)"-style ids that are dead content,
// unreachable from any nav — exactly the kind of fabricated specificity
// this endpoint exists to stop doing).
const VALID_GROWTH_POINTERS = [
  "Assessment — Beginner",
  "Assessment — Intermediate",
  "Assessment — Expert",
  "Module Lessons",
  "AI Interview Practice",
];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { roleName, profile, transcript, phase4 } = (await req.json()) as {
    roleName: string;
    profile: CandidateProfile;
    transcript: ChatTurn[];
    phase4: Phase4Result;
  };

  if (!roleName || !profile || !Array.isArray(transcript)) {
    return NextResponse.json(
      { success: false, error: "Missing roleName, profile, or transcript." },
      { status: 400 },
    );
  }

  const candidateWordCount = transcript
    .filter((t) => t.sender === "candidate")
    .map((t) => t.text)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  // Don't ask the model to grade a conversation that barely happened —
  // that's exactly the scenario where an LLM is most likely to fill the gap
  // with plausible-sounding but ungrounded content.
  if (candidateWordCount < 20) {
    return NextResponse.json(
      { success: false, error: "Not enough interview content to grade yet." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "AI grading is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  const transcriptText = transcript
    .map((t) => `${t.sender === "interviewer" ? "Interviewer" : "Candidate"}${t.isChallenge ? " (challenge round)" : ""}: ${t.text}`)
    .join("\n");

  const phase4Correct = phase4.selectedModel === "B";
  const phase4RatingAccurate = phase4.ratings.B > phase4.ratings.A;

  const prompt = `You are a senior AI-evaluator hiring assessor grading a completed mock interview for the role of "${roleName}" on AI training/evaluation platforms (e.g. Scale AI, Outlier, Alignerr, Mercor).

Candidate profile:
- Name: ${profile.name}
- Education: ${profile.education}
- Work experience: ${profile.workExperience}
- AI/RLHF experience: ${profile.aiExperience}
- Programming knowledge: ${profile.programmingKnowledge}
- Remote work experience: ${profile.remoteExperience}
- Career goals: ${profile.goals}

Full interview transcript:
${transcriptText}

Separately, the candidate also completed an objective written exercise: given two model translations, they were asked to identify which better honored a strict present-tense instruction constraint. The objectively correct choice is Model B. This candidate chose Model ${phase4.selectedModel || "(no answer)"} (${phase4Correct ? "correct" : "incorrect"}), rated Model A at ${phase4.ratings.A}/5 and Model B at ${phase4.ratings.B}/5 (rating B higher is the correct pattern: ${phase4RatingAccurate ? "they did this" : "they did not do this"}), and wrote this rationale: "${phase4.rationale || "(none provided)"}"

Grade this candidate. Ground every single claim in the transcript, the profile, or the written-exercise result above — do not invent facts, quotes, or achievements that were not actually said or demonstrated.

For the "platforms" section: you have no real insider knowledge of any named company's actual current hiring bar, acceptance rate, or internal standards. Do NOT state anything as if it were a known fact about that company. Instead, frame each platform's description purely as "how the skills this candidate demonstrated in this transcript would generally translate to that platform's typical evaluation style" (e.g. structured rubric-following, pairwise comparison rigor, written justification depth) — speculative and skill-based, never a factual claim about the company itself.

For each "growthAreas" item, the "lesson" field must be exactly one of these strings (pick whichever is most relevant to that growth area) — do not invent any other value: ${VALID_GROWTH_POINTERS.map((p) => `"${p}"`).join(", ")}.

Return strict JSON:
- score: overall 0-100 readiness score
- competencies: object with these exact 0-100 integer fields: ${COMPETENCY_KEYS.join(", ")}
- strengths: 2-4 short strings, each citing something concrete the candidate actually said or did
- growthAreas: 1-3 objects {topic, lesson} — topic is a specific, transcript-grounded skill gap
- platforms: exactly these 6 platforms in this order, each {name, score (0-100), desc (1-2 sentences, skill-based framing per the rule above)}: ${PLATFORM_NAMES.join(", ")}`;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            competencies: {
              type: Type.OBJECT,
              properties: Object.fromEntries(
                COMPETENCY_KEYS.map((key) => [key, { type: Type.NUMBER }]),
              ),
              required: [...COMPETENCY_KEYS],
            },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            growthAreas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  lesson: { type: Type.STRING },
                },
                required: ["topic", "lesson"],
              },
            },
            platforms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  desc: { type: Type.STRING },
                },
                required: ["name", "score", "desc"],
              },
            },
          },
          required: ["score", "competencies", "strengths", "growthAreas", "platforms"],
        },
      },
    });

    const textContent = response.text;
    if (!textContent) throw new Error("Empty response from Gemini API");

    const report = JSON.parse(textContent);
    report.score = Math.round(Math.min(100, Math.max(0, report.score)));

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("Error generating interview report with Gemini:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to generate your report",
    });
  }
}
