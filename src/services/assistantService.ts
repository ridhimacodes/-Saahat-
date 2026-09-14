import { RouteOption, TimeOfDay, UserProfile } from '../types';

export interface AssistantContext {
  activePage: string;
  selectedRoute?: RouteOption | null;
  origin?: string;
  destination?: string;
  timeOfDay: TimeOfDay;
  isLowSignalGlobal: boolean;
  userProfile?: UserProfile | null;
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
 * Allows up to 4-5 sentences when explanation is needed, while staying concise for simple questions.
 */
export async function getAssistantResponse(
  userQuery: string,
  context: AssistantContext
): Promise<{ text: string; isSOSPrompt?: boolean; quickReplies?: string[] }> {
  const q = userQuery.trim().toLowerCase();

  // 1. Distress / Emergency Check
  if (isDistressMessage(q)) {
    return {
      text: "I am right here with you. Please stay calm and head toward populated, brightly lit areas if possible. I have opened the Emergency SOS console for you so you can trigger instant police dispatch and alert your emergency contacts with one tap.",
      isSOSPrompt: true,
      quickReplies: ["Open SOS Emergency", "Nearest Police", "I'm Safe Now"]
    };
  }

  // 2. Try Lovable AI Connector if configured in browser environment
  const lovableApiKey = (typeof window !== 'undefined' && (window as any).LOVABLE_API_KEY) || (import.meta as any).env?.VITE_LOVABLE_API_KEY;
  if (lovableApiKey) {
    try {
      const response = await fetchLovableAI(userQuery, context, lovableApiKey);
      if (response) return response;
    } catch (e) {
      console.warn("Lovable AI connector failed, falling back to built-in Saahat intelligence:", e);
    }
  }

  // 3. Built-in Comprehensive Contextual Intelligence with safe error handling
  try {
    return getLocalAssistantResponse(q, context);
  } catch (err) {
    console.error("Saarthi response generation error:", err);
    return {
      text: "Saarthi is having trouble responding right now, try again in a moment.",
      quickReplies: ["Why is this route rated high?", "What does Low Signal Mode do?", "How does Share ETA work?"]
    };
  }
}

function getLocalAssistantResponse(
  q: string,
  context: AssistantContext
): { text: string; isSOSPrompt?: boolean; quickReplies?: string[] } {
  const { selectedRoute, origin, destination, timeOfDay, isLowSignalGlobal, activePage, userProfile } = context;

  // -------------------------------------------------------------------------
  // 1. BASIC CONVERSATIONAL & GREETINGS ("hi", "what can you do", "who are you")
  // -------------------------------------------------------------------------
  if (
    /^(hi|hello|hey|greetings|namaste|good\s*(morning|afternoon|evening|day))[\s!.]*$/.test(q) ||
    q.includes("who are you") ||
    q.includes("what can you do") ||
    q.includes("help me with") ||
    q.includes("what is your purpose") ||
    q.includes("what do you do")
  ) {
    const routeMention = selectedRoute
      ? ` Right now you are exploring "${selectedRoute.name.split('—')[0].trim()}" with a Comfort Score of ${selectedRoute.comfortScore.toFixed(1)}/10.`
      : " You can search for routes between any two points to see comfort ratings and safety highlights.";
    return {
      text: `Hi, I'm Saarthi — your journey guide. Ask me anything about your route or the app.${routeMention} I can explain route comfort scores, street lighting, open shops along your path, and show you how features like Low Signal Mode, Share ETA, and Community Notes work.`,
      quickReplies: ["Why is this route rated high?", "What does Low Signal Mode do?", "How does Share ETA work?", "General night safety tips"]
    };
  }

  // Thank you / gratitude
  if (q.includes("thank") || q.includes("thanks") || q.includes("awesome") || q.includes("helpful") || q.includes("great job")) {
    return {
      text: "You're very welcome! Stay alert, trust your instincts, and feel free to ask anytime you want to check lighting, transit spots, or route conditions.",
      quickReplies: ["Check route lighting", "How does Share ETA work?", "What does Low Signal Mode do?"]
    };
  }

  // -------------------------------------------------------------------------
  // 2. GENERAL APP FEATURES
  // -------------------------------------------------------------------------

  // Feature: Low Signal Mode / Offline / Battery Saver
  if (
    q.includes("low signal") || 
    q.includes("low power") || 
    q.includes("offline") || 
    q.includes("no internet") || 
    q.includes("battery") ||
    q.includes("signal mode")
  ) {
    return {
      text: `Low Signal Mode adapts Saahat for low-battery or poor network conditions by switching to a high-contrast, text-first, dark interface that consumes minimal power and data. It provides cached turn-by-turn navigation steps and a directory of nearby verified emergency help points—such as 24/7 pharmacies, police desks, and hospitals—that you can reach even when completely offline.${isLowSignalGlobal ? " Low Signal Mode is currently ON on your device." : " You can toggle it anytime via the top header switch or from the Low Signal page."}`,
      quickReplies: ["How does Share ETA work?", "How to trigger SOS?", "Why is this route rated high?"]
    };
  }

  // Feature: Share ETA / Live Journey Tracking
  if (
    q.includes("share eta") || 
    q.includes("share journey") || 
    q.includes("live tracking") || 
    q.includes("share my location") || 
    q.includes("tracking") ||
    q.includes("trusted contact") ||
    q.includes("emergency contact")
  ) {
    return {
      text: "Share ETA lets you send a secure, end-to-end encrypted tracking link to your trusted contacts with a single tap. Recipients can view your route progress, safety rating, and live estimated arrival time in their web browser without needing to download an app or create an account. It also provides an automated 'I Have Arrived Safely' check-in button once you reach your destination.",
      quickReplies: ["What does Low Signal Mode do?", "How to trigger SOS?", "What is Comfort Score?"]
    };
  }

  // Feature: SOS Emergency Console
  if (
    q.includes("sos") || 
    q.includes("emergency button") || 
    q.includes("police button") || 
    q.includes("how does sos work") ||
    q.includes("call police")
  ) {
    return {
      text: "The SOS emergency trigger is accessible anytime via the prominent floating button on your screen. Tapping it opens the SOS Emergency Console, allowing you to trigger one-tap direct dialing to emergency police services (112 / 100), blast an instant emergency SMS with your live GPS location to your trusted contacts, and view the nearest verified 24/7 safe havens.",
      isSOSPrompt: true,
      quickReplies: ["Show SOS console", "Share ETA with contacts", "Check my route"]
    };
  }

  // Feature: Community Notes
  if (
    q.includes("community note") || 
    q.includes("notes") || 
    q.includes("crowdsource") || 
    q.includes("report") || 
    q.includes("feedback")
  ) {
    return {
      text: "Community Notes is Saahat's crowdsourced safety feed where verified local commuters report real-time ground conditions. Commuters can post and upvote updates about broken streetlights, deserted stretches, active transit security, or well-lit open markets. This crowd-validated feedback directly enhances the accuracy of our route safety scores across different hours.",
      quickReplies: ["What is Comfort Score?", "Is this route well-lit?", "How does Share ETA work?"]
    };
  }

  // Feature: Profile / Avatar Settings / Account
  if (
    q.includes("profile") || 
    q.includes("avatar") || 
    q.includes("account") || 
    q.includes("my name") || 
    q.includes("saved locations") || 
    q.includes("settings")
  ) {
    const profileName = userProfile?.name ? `named "${userProfile.name}"` : "with your personalized name";
    return {
      text: `Your Saahat Profile allows you to manage your display identity ${profileName}, choose or upload a custom avatar, and store quick shortcuts for frequent destinations like Home or Work. All profile updates are securely persisted to Supabase using your authenticated user ID, and you can edit or save your changes at any time by tapping your avatar icon in the navigation bar and selecting 'Done'.`,
      quickReplies: ["What does Low Signal Mode do?", "Why is this route rated high?", "How does Share ETA work?"]
    };
  }

  // Feature: Comfort Score / Rating explanation
  if (
    q.includes("comfort score") || 
    q.includes("how is it calculated") || 
    q.includes("score calculated") || 
    q.includes("safety score") || 
    q.includes("safety rating") ||
    q.includes("algorithm")
  ) {
    return {
      text: "Saahat's Comfort Score (rated from 0.0 to 10.0) evaluates four objective environmental factors: continuous street illumination, footfall density, open commercial storefronts (cafes, pharmacies, convenience stores), and proximity to active transit or police posts. The score dynamically updates depending on whether you travel during day, evening, night, or late-night hours.",
      quickReplies: ["Why is this route rated high?", "Is this route well-lit?", "Explain Low Signal Mode"]
    };
  }

  // -------------------------------------------------------------------------
  // 3. CURRENTLY DISPLAYED ROUTE SPECIFIC QUESTIONS
  // -------------------------------------------------------------------------
  if (selectedRoute) {
    const routeName = selectedRoute.name.split('—')[0].trim();
    const score = selectedRoute.comfortScore.toFixed(1);
    const pros = selectedRoute.pros && selectedRoute.pros.length > 0 ? selectedRoute.pros.join(', ') : "verified street lighting and active footfall";
    const cons = selectedRoute.cons && selectedRoute.cons.length > 0 ? selectedRoute.cons.join(', ') : "slightly longer travel time";
    const lighting = selectedRoute.scoreDetails?.lightingDesc || "steady illumination";
    const lightingScore = selectedRoute.scoreDetails?.lightingScore ?? 8;
    const footfall = selectedRoute.scoreDetails?.footfallDesc || "moderate pedestrian activity";
    const commercial = selectedRoute.scoreDetails?.commercialDesc || "open storefronts";
    const transit = selectedRoute.scoreDetails?.transitDesc || "nearby transit connectivity";

    // Why rated this way / Pros / Cons / Why rated high or low
    if (
      q.includes("why is this route") || 
      q.includes("why is it rated") || 
      q.includes("pro") || 
      q.includes("con") || 
      q.includes("drawback") || 
      q.includes("rated high") || 
      q.includes("rated low") || 
      q.includes("score") ||
      q.includes("advantage") ||
      q.includes("why this route")
    ) {
      return {
        text: `The currently selected route "${routeName}" is rated ${score}/10 because it prioritizes safety through ${pros}. Its primary advantage is strong environmental visibility with ${lighting.toLowerCase()} and ${footfall.toLowerCase()}. The main trade-off is ${cons.toLowerCase()}, as Saahat chooses active, populated thoroughfares rather than isolated shortcuts.`,
        quickReplies: ["Is this route well-lit?", "Are shops open along this route?", "How long will this take?"]
      };
    }

    // Street lighting / darkness / lamps
    if (
      q.includes("lit") || 
      q.includes("light") || 
      q.includes("dark") || 
      q.includes("street light") || 
      q.includes("lamp") || 
      q.includes("visibility")
    ) {
      return {
        text: `"${routeName}" has an environmental lighting score of ${lightingScore}/10 (${lighting}). Streetlights along this corridor are verified for continuous coverage, minimizing unlit pockets and dark alleyways during ${timeOfDay} hours. If you encounter any flickering or unlit stretches, you can also report it directly via Community Notes.`,
        quickReplies: ["Why is this route rated high?", "Are shops open along this route?", "Share ETA with contacts"]
      };
    }

    // Shops / Commercial activity / Footfall / Crowds / Activity
    if (
      q.includes("shop") || 
      q.includes("store") || 
      q.includes("open") || 
      q.includes("crowd") || 
      q.includes("footfall") || 
      q.includes("people") || 
      q.includes("market")
    ) {
      return {
        text: `Along "${routeName}", you will encounter ${footfall.toLowerCase()} alongside ${commercial.toLowerCase()}. These active commercial establishments provide natural bystander presence, well-lit storefronts, and accessible safe havens if you ever need to step into a public venue.`,
        quickReplies: ["Is this route well-lit?", "How long will this take?", "Why is this route rated high?"]
      };
    }

    // Transit / Metro / Bus connectivity
    if (
      q.includes("transit") || 
      q.includes("metro") || 
      q.includes("bus") || 
      q.includes("station") || 
      q.includes("connectivity")
    ) {
      return {
        text: `"${routeName}" offers ${transit.toLowerCase()} with convenient access to verified transit points. Traveling along established transit arteries provides reliable access to station security personnel and public transportation options throughout your trip.`,
        quickReplies: ["Why is this route rated high?", "Is this route well-lit?", "How long will this take?"]
      };
    }

    // Duration / Distance / ETA / How long
    if (
      q.includes("duration") || 
      q.includes("time") || 
      q.includes("how long") || 
      q.includes("distance") || 
      q.includes("km") || 
      q.includes("minutes") || 
      q.includes("eta")
    ) {
      return {
        text: `"${routeName}" spans ${selectedRoute.distanceKm} km with an estimated duration of ${selectedRoute.durationMinutes} minutes. While shorter paths may appear on conventional navigation maps, Saahat guides you along this route to ensure better lighting, bystander density, and overall comfort during ${timeOfDay} hours.`,
        quickReplies: ["Is this route well-lit?", "Why is this route rated high?", "How does Share ETA work?"]
      };
    }

    // Alternative routes / Other routes
    if (
      q.includes("other route") || 
      q.includes("alternative") || 
      q.includes("better route") || 
      q.includes("different route")
    ) {
      return {
        text: `Saahat generates multiple route alternatives based on your preference for comfort versus speed. The current recommendation "${routeName}" boasts the top comfort rating (${score}/10). You can compare alternative options on the Route Results screen to view their specific time, distance, and lighting ratings.`,
        quickReplies: ["Why is this route rated high?", "Is this route well-lit?", "How does Share ETA work?"]
      };
    }
  } else {
    // If user asks route questions but no route is active
    if (
      q.includes("route") || 
      q.includes("direction") || 
      q.includes("lighting") || 
      q.includes("score") || 
      q.includes("how long")
    ) {
      return {
        text: "You haven't selected a journey route yet! Head to the Search screen and enter your pickup and destination to view real-time comfort scores, street lighting, and transit connectivity for multiple route options.",
        quickReplies: ["What does Low Signal Mode do?", "How does Share ETA work?", "What is Saahat?"]
      };
    }
  }

  // -------------------------------------------------------------------------
  // 4. GENERAL SAFETY & JOURNEY ADVICE (Factual, Non-Alarming Tone)
  // -------------------------------------------------------------------------
  if (
    q.includes("safety tip") || 
    q.includes("safety advice") || 
    q.includes("advice") || 
    q.includes("night safety") || 
    q.includes("traveling at night") || 
    q.includes("walk alone") || 
    q.includes("safe travel") || 
    q.includes("stay safe") || 
    q.includes("tips")
  ) {
    return {
      text: "When traveling, especially during evening or late hours, staying along primary avenues with steady street lighting and active storefronts is recommended. Keep your phone charged, share your live ETA with a friend or family member, and stay observant of your surroundings without wearing noise-canceling headphones. Remember that Saahat's SOS console is accessible with a single tap if you ever want immediate assistance.",
      quickReplies: ["How does Share ETA work?", "What does Low Signal Mode do?", "Check route lighting"]
    };
  }

  // Taxi / Cab / Ride safety
  if (
    q.includes("cab") || 
    q.includes("taxi") || 
    q.includes("uber") || 
    q.includes("ola") || 
    q.includes("auto") || 
    q.includes("rickshaw") || 
    q.includes("driver")
  ) {
    return {
      text: "Before boarding any cab or auto-rickshaw, verify that the vehicle license plate matches your booking details and check that child locks are disabled on rear doors. Once your trip starts, you can use Saahat's Share ETA to let your trusted contacts track your route progress in real-time. If the driver deviates unexpectedly from populated avenues, keep your SOS console ready.",
      quickReplies: ["How does Share ETA work?", "How to trigger SOS?", "What does Low Signal Mode do?"]
    };
  }

  // Walking safety
  if (q.includes("walking") || q.includes("pedestrian") || q.includes("footpath")) {
    return {
      text: "When walking, choose sidewalks facing oncoming traffic so vehicles cannot pull up behind you unnoticed. Walk with confident posture, keep your phone easily reachable rather than buried in a bag, and prioritize paths marked with Saahat's high lighting and footfall scores.",
      quickReplies: ["Is this route well-lit?", "How does Share ETA work?", "Why is this route rated high?"]
    };
  }

  // Current page context response
  if (q.includes("where am i") || q.includes("current page") || q.includes("what screen")) {
    return {
      text: `You are currently on the "${activePage.toUpperCase()}" screen of Saahat.${selectedRoute ? ` Your active route is "${selectedRoute.name.split('—')[0].trim()}" (${selectedRoute.comfortScore.toFixed(1)}/10 comfort rating).` : ""} You can navigate between Search, Results, Share Journey, Community Notes, and Low Signal Mode using the navigation bar.`,
      quickReplies: ["Why is this route rated high?", "What does Low Signal Mode do?", "How does Share ETA work?"]
    };
  }

  // -------------------------------------------------------------------------
  // 5. HELPFUL REDIRECT FOR OUT-OF-SCOPE QUESTIONS
  // -------------------------------------------------------------------------
  return {
    text: "I can't help with that directly, but I can tell you about your route options, street lighting, comfort scores, or app features like Low Signal Mode and Share ETA. What would you like to know about your journey?",
    quickReplies: ["Why is this route rated high?", "What does Low Signal Mode do?", "How does Share ETA work?", "General night safety tips"]
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
    ? `Current Route: "${context.selectedRoute.name}", Comfort Score: ${context.selectedRoute.comfortScore.toFixed(1)}/10, Distance: ${context.selectedRoute.distanceKm}km, Time: ${context.selectedRoute.durationMinutes}min, Lighting: ${context.selectedRoute.scoreDetails?.lightingDesc} (Score: ${context.selectedRoute.scoreDetails?.lightingScore}/10), Footfall: ${context.selectedRoute.scoreDetails?.footfallDesc}, Commercial: ${context.selectedRoute.scoreDetails?.commercialDesc}, Pros: ${context.selectedRoute.pros?.join(', ')}, Cons: ${context.selectedRoute.cons?.join(', ')}.`
    : "No route currently selected.";

  const userProfileSummary = context.userProfile?.name
    ? `User Profile: Name "${context.userProfile.name}".`
    : "User Profile: Default user.";

  const systemPrompt = `You are Saarthi (spelled S-A-A-R-T-H-I), an empathetic, mobile-first, factual AI safety companion and journey guide for the women-first navigation web application Saahat ("Har Safar Mein Raahat").
Active Screen: ${context.activePage}. Time of day: ${context.timeOfDay}. Low Signal Mode: ${context.isLowSignalGlobal ? 'ON' : 'OFF'}.
${routeSummary}
${userProfileSummary}

Core Guidelines:
1. Tone: Warm, empowering, factual, calm, and non-alarming. Avoid sensationalism or fear-mongering.
2. Breadth: Answer questions on:
   - Any currently displayed route (comfort score, pros, cons, why it's rated a certain way, lighting, shops, footfall, transit access).
   - Saahat app features: Low Signal Mode (offline navigation & emergency help points), Share ETA (live encrypted journey tracker for trusted contacts), SOS Emergency Console (one-tap police dispatch & alert broadcast), Community Notes (crowdsourced streetlight & safety reports), and Profile/Avatar settings.
   - General safety & journey advice (factual, balanced street sense, public transit, and cab safety tips).
   - Basic conversational greetings ("hello", "what can you do", "who are you").
3. Context-Awareness: Always refer to the real, specific route details provided above when available (e.g. route name, comfort score out of 10, lighting details, pros and cons).
4. Response Length: Allow 3 to 5 sentences when the question genuinely requires explanation, while remaining concise and direct for simple questions. Do not truncate prematurely.
5. Out-of-scope Queries: If a question falls outside travel safety, navigation, or Saahat features, state so clearly and helpfully: "I can't help with that directly, but I can tell you about your route options or app features."
6. Distress / Emergency: If the user expresses imminent danger or distress, express calm support and advise opening the SOS emergency console immediately.`;

  try {
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
        max_tokens: 280,
        temperature: 0.6
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    return { text };
  } catch (err) {
    console.warn("Lovable API network error:", err);
    return null;
  }
}
