import { RouteOption, TimeOfDay } from '../types';

export interface AssistantContext {
  activePage: string;
  selectedRoute?: RouteOption | null;
  origin?: string;
  destination?: string;
  timeOfDay: TimeOfDay;
  isLowSignalGlobal: boolean;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isSOSPrompt?: boolean;
  quickReplies?: string[];
}

/**
 * Check if the user's prompt expresses distress or need for emergency help.
 */
export function isDistressMessage(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  const distressPatterns = [
    /\b(i\s*feel\s*unsafe|unsafe|help\s*me|i\s*need\s*help|emergency|danger|scared|someone\s*is\s*following\s*me|being\s*followed|attack|harass|stalk|stalked|sos|trouble|in\s*trouble|save\s*me|call\s*police)\b/i,
    /\b(bachao|madad|khatra|dar\s*lag\s*raha)\b/i // Common Hindi/Hinglish safety phrases
  ];
  return distressPatterns.some(pattern => pattern.test(normalized));
}

/**
 * Generates an intelligent, context-aware reply using Saahat route data, features, and safety guidelines.
 * Returns concise (2-3 sentences max) responses.
 */
export async function getAssistantResponse(
  userQuery: string,
  context: AssistantContext
): Promise<{ text: string; isSOSPrompt?: boolean; quickReplies?: string[] }> {
  const q = userQuery.trim().toLowerCase();

  // 1. Distress / Emergency Check
  if (isDistressMessage(q)) {
    return {
      text: "I am here with you. Please stay calm — I've brought up your Emergency SOS console right here so you can alert your trusted contacts or call the nearest police immediately.",
      isSOSPrompt: true,
      quickReplies: ["Open SOS Emergency", "Nearest Police", "I'm Safe Now"]
    };
  }

  // 2. Try Lovable AI Connector if configured in browser environment
  const lovableApiKey = (window as any).LOVABLE_API_KEY || (import.meta as any).env?.VITE_LOVABLE_API_KEY;
  if (lovableApiKey) {
    try {
      const response = await fetchLovableAI(userQuery, context, lovableApiKey);
      if (response) return response;
    } catch (e) {
      console.warn("Lovable AI connector failed, falling back to built-in Saahat intelligence:", e);
    }
  }

  // 3. Built-in Contextual Intelligence (Zero-config, instant, 2-3 sentences max)
  return getLocalAssistantResponse(q, context);
}

function getLocalAssistantResponse(
  q: string,
  context: AssistantContext
): { text: string; isSOSPrompt?: boolean; quickReplies?: string[] } {
  const { selectedRoute, origin, destination, timeOfDay, isLowSignalGlobal } = context;

  // Feature query: Low Signal Mode
  if (q.includes("low signal") || q.includes("low power") || q.includes("offline") || q.includes("no internet")) {
    return {
      text: "Low Signal Mode switches Saahat into a high-contrast, low-data interface with offline turn-by-turn steps and nearby help points. It ensures your safety navigation works reliably even in zero-reception spots or low battery.",
      quickReplies: ["How does Share ETA work?", "Check route safety", "What is Comfort Score?"]
    };
  }

  // Feature query: Share ETA / Journey Sharing
  if (q.includes("share eta") || q.includes("share journey") || q.includes("live tracking") || q.includes("trusted contact")) {
    return {
      text: "Share ETA lets you send an encrypted live journey tracker to your trusted contacts with one tap. They can view your real-time GPS progress, route safety score, and expected arrival without needing an account.",
      quickReplies: ["What does Low Signal Mode do?", "Why is this route rated high?", "How to trigger SOS?"]
    };
  }

  // Feature query: SOS Emergency
  if (q.includes("sos") || q.includes("emergency button") || q.includes("police")) {
    return {
      text: "The SOS button is always accessible on your screen. Tapping it activates immediate one-tap calling to local police dispatch, alerts your trusted contacts with your live GPS coordinates, and shows nearby verified 24/7 safe havens.",
      isSOSPrompt: true,
      quickReplies: ["Show SOS console", "Share ETA with contacts", "Check my route"]
    };
  }

  // Feature query: Comfort Score / Rating explanation
  if (q.includes("comfort score") || q.includes("how is it calculated") || q.includes("score calculated") || q.includes("safety score")) {
    return {
      text: "Saahat's Comfort Score (0-10) is dynamically calculated using continuous street lighting, open commercial storefronts, pedestrian footfall, and proximity to active transit or police posts. It recalculates in real-time as day turns to night.",
      quickReplies: ["Why is this route rated high?", "Is this route well-lit?", "Explain Low Signal Mode"]
    };
  }

  // Route queries
  if (selectedRoute) {
    const routeName = selectedRoute.name.split('—')[0].trim();
    const score = selectedRoute.comfortScore.toFixed(1);

    // Why is this route rated high / low / why this score
    if (q.includes("why is this route") || q.includes("rated high") || q.includes("rating") || q.includes("why is it safe") || q.includes("safety")) {
      const topPros = selectedRoute.pros?.slice(0, 2).join(" and ") || "high pedestrian visibility and verified streetlights";
      const lighting = selectedRoute.scoreDetails?.lightingDesc || "consistent lighting";
      return {
        text: `${routeName} has a Comfort Score of ${score}/10 because of ${topPros}. It benefits from ${lighting.toLowerCase()}, making it a dependable choice for your travel.`,
        quickReplies: ["Is this route well-lit?", "How long does it take?", "What does Low Signal Mode do?"]
      };
    }

    // Is it well lit / lighting query
    if (q.includes("lit") || q.includes("light") || q.includes("dark") || q.includes("street light") || q.includes("lamp")) {
      const lightingDesc = selectedRoute.scoreDetails?.lightingDesc || "continuous LED street illumination";
      const lightScore = selectedRoute.scoreDetails?.lightingScore ?? 8;
      return {
        text: `${routeName} has a lighting score of ${lightScore}/10 (${lightingDesc}). Main thoroughfares along this path remain brightly illuminated throughout the night.`,
        quickReplies: ["Why is this route rated high?", "Are shops open along this route?", "Share ETA with Mom"]
      };
    }

    // Shops / footfall / crowd
    if (q.includes("shop") || q.includes("store") || q.includes("open") || q.includes("crowd") || q.includes("footfall") || q.includes("people")) {
      const footfallDesc = selectedRoute.scoreDetails?.footfallDesc || "active pedestrian activity";
      const commercialDesc = selectedRoute.scoreDetails?.commercialDesc || "open convenience stores and cafes";
      return {
        text: `Along ${routeName}, you will find ${footfallDesc.toLowerCase()} with ${commercialDesc.toLowerCase()}. These open storefronts provide natural surveillance and safe checkpoints.`,
        quickReplies: ["Is this route well-lit?", "How long will this take?", "Share ETA"]
      };
    }

    // Duration / distance / ETA
    if (q.includes("duration") || q.includes("time") || q.includes("how long") || q.includes("distance") || q.includes("km")) {
      return {
        text: `${routeName} spans ${selectedRoute.distanceKm} km and is estimated at ${selectedRoute.durationMinutes} minutes. It prioritizes populated, well-lit corridors over deserted shortcuts.`,
        quickReplies: ["Is this route well-lit?", "Why is this route rated high?", "Start navigation"]
      };
    }
  } else {
    // If no route selected yet
    if (q.includes("route") || q.includes("direction") || q.includes("where")) {
      return {
        text: "You haven't selected a route yet! Enter your pickup and destination in the Search tab to see real-time safety scores, lighting conditions, and comfortable travel options.",
        quickReplies: ["What does Low Signal Mode do?", "How does Share ETA work?", "What is Saahat?"]
      };
    }
  }

  // General App Identity
  if (q.includes("who are you") || q.includes("what are you") || q.includes("saahat") || q.includes("hello") || q.includes("hi") || q.includes("hey")) {
    return {
      text: "Hi! I'm your Saahat Assistant. I can help explain route comfort scores, street lighting, open shops along your path, and show you how our safety features like Share ETA and Low Signal Mode work.",
      quickReplies: ["Why is this route rated high?", "What does Low Signal Mode do?", "How does Share ETA work?"]
    };
  }

  // Thank you / closing
  if (q.includes("thank") || q.includes("great") || q.includes("awesome") || q.includes("ok") || q.includes("cool")) {
    return {
      text: "You're very welcome! Stay aware, travel safely, and let me know if you need anything else on your journey.",
      quickReplies: ["Check route lighting", "How does Share ETA work?"]
    };
  }

  // Out of scope / unrelated query redirect
  return {
    text: "I'm focused on helping you travel safely with Saahat. You can ask me about route lighting, safety ratings, open shops, Low Signal Mode, or how to share your ETA!",
    quickReplies: ["Why is this route rated high?", "What does Low Signal Mode do?", "How does Share ETA work?"]
  };
}

/**
 * Optional Lovable AI connector integration
 */
async function fetchLovableAI(
  userQuery: string,
  context: AssistantContext,
  apiKey: string
): Promise<{ text: string; isSOSPrompt?: boolean; quickReplies?: string[] } | null> {
  const routeSummary = context.selectedRoute
    ? `Current Route: ${context.selectedRoute.name}, Comfort Score: ${context.selectedRoute.comfortScore}/10, Distance: ${context.selectedRoute.distanceKm}km, Time: ${context.selectedRoute.durationMinutes}min, Lighting: ${context.selectedRoute.scoreDetails?.lightingDesc}, Pros: ${context.selectedRoute.pros?.join(', ')}.`
    : "No route currently selected.";

  const systemPrompt = `You are the Saahat Assistant, an empathetic, mobile-first safety assistant for the women-first navigation app Saahat ("Har Safar Mein Raahat").
Active Page: ${context.activePage}. Time of day: ${context.timeOfDay}.
${routeSummary}
Rules:
1. Keep responses short and conversational (2-3 sentences max).
2. Answer questions about the current route (safety, lighting, open shops) using provided data.
3. Explain Saahat features (Low Signal Mode, Share ETA, SOS) clearly.
4. If distress or unsafety is expressed, express empathy and advise activating SOS immediately.
5. If unrelated to journeys or safety, politely redirect back to travel safety.`;

  const res = await fetch("https://api.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery }
      ],
      max_tokens: 120,
      temperature: 0.6
    })
  });

  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) return null;

  return { text };
}
