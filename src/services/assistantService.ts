import { RouteOption, TimeOfDay, UserProfile, TrustedContact } from '../types';

export interface AssistantContext {
  activePage: string;
  selectedRoute?: RouteOption | null;
  origin?: string;
  destination?: string;
  timeOfDay: TimeOfDay;
  isLowSignalGlobal: boolean;
  userProfile?: UserProfile | null;
  contacts?: TrustedContact[];
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
 * Builds a structured live app state context block for Saarthi.
 * Injected into every AI request and logged to the console.
 */
export function buildAppContextBlock(context: AssistantContext): string {
  const {
    activePage,
    selectedRoute,
    origin,
    destination,
    timeOfDay,
    isLowSignalGlobal,
    userProfile,
    contacts
  } = context;

  // Format Time Band
  const timeBandFormatted = timeOfDay === 'lateNight' 
    ? 'Late Night (11 PM - 6 AM)' 
    : timeOfDay === 'night' 
    ? 'Night (9 PM - 11 PM)' 
    : timeOfDay === 'evening' 
    ? 'Evening (5 PM - 9 PM)' 
    : 'Day (6 AM - 5 PM)';

  // Format Route Details
  let routeSection = "No route currently selected (User has not chosen a route or is on search/home screen).";
  if (selectedRoute) {
    const prosStr = selectedRoute.pros && selectedRoute.pros.length > 0 ? selectedRoute.pros.join('; ') : 'N/A';
    const consStr = selectedRoute.cons && selectedRoute.cons.length > 0 ? selectedRoute.cons.join('; ') : 'N/A';
    const tagStr = selectedRoute.tag?.text ? `${selectedRoute.tag.text} (${selectedRoute.tag.type})` : 'N/A';
    const lightingDesc = selectedRoute.scoreDetails?.lightingDesc || 'N/A';
    const lightingScore = selectedRoute.scoreDetails?.lightingScore ?? 'N/A';
    const footfallDesc = selectedRoute.scoreDetails?.footfallDesc || 'N/A';
    const commercialDesc = selectedRoute.scoreDetails?.commercialDesc || 'N/A';
    const transitDesc = selectedRoute.scoreDetails?.transitDesc || 'N/A';

    routeSection = `Name: "${selectedRoute.name}"
Comfort Score: ${selectedRoute.comfortScore.toFixed(1)}/10
Badge / Tag: ${tagStr}
Distance: ${selectedRoute.distanceKm} km
Duration: ${selectedRoute.durationMinutes} mins
Via: ${selectedRoute.via || 'Direct Corridor'}
Pros: ${prosStr}
Cons: ${consStr}
Lighting Details: ${lightingDesc} (Score: ${lightingScore}/10)
Pedestrian Footfall: ${footfallDesc}
Commercial Activity: ${commercialDesc}
Transit Connectivity: ${transitDesc}`;
  }

  // Format Circle / Emergency Contacts
  let contactsSection = "No emergency contacts added yet in Circle.";
  if (contacts && contacts.length > 0) {
    contactsSection = contacts
      .map((c, i) => `${i + 1}. ${c.name} (${c.relationship}) - ${c.phone}`)
      .join('\n');
  }

  // Structured App Features Summary
  const featuresSection = `- Low Signal Mode: Offline turn-by-turn navigation steps, cached 24/7 emergency help points (police, hospital, pharmacy), and low-battery dark UI requiring zero cellular internet.
- Share ETA: 1-tap live journey tracking via secure web link sent to trusted contacts, with real-time ETA, route score, and automatic arrival check-ins.
- SOS Emergency: Prominent floating emergency trigger that initiates 1-tap direct dialing to police (112 / 100) and broadcasts instant SMS with GPS coordinates to trusted contacts.
- Community Notes: Crowdsourced safety feed where local commuters post and upvote ground-truth reports on broken streetlights, deserted areas, or active security.
- Profile & Avatar: Personalized user profile with display name, customizable safety avatars, and quick shortcuts for saved home/work locations stored securely in Supabase.`;

  return `[LIVE SAAHAT APP STATE CONTEXT]
Active Screen: ${activePage.toUpperCase()}
Current Time Band: ${timeBandFormatted}
Low Signal Mode: ${isLowSignalGlobal ? 'ACTIVE (ON)' : 'INACTIVE (OFF)'}
Active Origin: ${origin || 'None specified'}
Active Destination: ${destination || 'None specified'}
User Profile Name: ${userProfile?.name ? userProfile.name : 'Anonymous Commuter'}

--- CURRENT SELECTED ROUTE ---
${routeSection}

--- USER'S CIRCLE (TRUSTED CONTACTS) ---
${contactsSection}

--- SAAHAT CORE APP FEATURES ---
${featuresSection}
[END LIVE SAAHAT APP STATE CONTEXT]`;
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
 * Injects live app state and logs the context block to the console.
 */
export async function getAssistantResponse(
  userQuery: string,
  context: AssistantContext
): Promise<{ text: string; isSOSPrompt?: boolean; quickReplies?: string[] }> {
  const q = userQuery.trim().toLowerCase();

  // Construct and log the structured live app state context block
  const contextBlock = buildAppContextBlock(context);
  console.log('[Saarthi AI Context Block]:\n', contextBlock);

  // 1. Distress / Emergency Check
  if (isDistressMessage(q)) {
    return {
      text: "I am right here with you. Please stay calm and head toward populated, brightly lit areas if possible. I have opened the Emergency SOS console for you so you can trigger instant police dispatch and alert your emergency contacts with one tap.",
      isSOSPrompt: true,
      quickReplies: ["Open SOS Emergency", "Nearest Police", "I'm Safe Now"]
    };
  }

  // 2. Try Gemini AI if API key is configured
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log('[Saarthi] Gemini API key present:', !!geminiApiKey, geminiApiKey ? `(starts with: ${geminiApiKey.substring(0, 6)}...)` : '(not set)');
  if (geminiApiKey) {
    try {
      const response = await fetchGeminiAI(userQuery, contextBlock, geminiApiKey);
      console.log('[Saarthi] Gemini response:', response ? 'SUCCESS' : 'NULL (falling back to local)');
      if (response) return response;
    } catch (e) {
      console.warn("[Saarthi] Gemini AI failed, falling back to built-in Saahat intelligence:", e);
    }
  }

  // 3. Built-in Comprehensive Contextual Intelligence with safe error handling
  try {
    return getLocalAssistantResponse(q, context);
  } catch (err) {
    console.error("Saarthi response generation error:", err);
    return {
      text: "Saarthi is having trouble responding right now, try again in a moment.",
      quickReplies: ["Why is this route the best match?", "What does Low Signal Mode do?", "What's in my Circle?"]
    };
  }
}

function getLocalAssistantResponse(
  q: string,
  context: AssistantContext
): { text: string; isSOSPrompt?: boolean; quickReplies?: string[] } {
  const { selectedRoute, origin, destination, timeOfDay, isLowSignalGlobal, activePage, userProfile, contacts } = context;

  // -------------------------------------------------------------------------
  // 1. BASIC CONVERSATIONAL & GREETINGS ("hi", "ha hello", "what can you do", "who are you")
  // -------------------------------------------------------------------------
  if (
    /^(ha|haan|haa|ha\s+hello|ha\s+hi|hi|hello|hey|greetings|namaste|good\s*(morning|afternoon|evening|day))[\s!.,?]*$/.test(q) ||
    q.startsWith("ha hello") ||
    q.startsWith("ha hi") ||
    q.startsWith("haan hello") ||
    q === "ha" ||
    q === "haan" ||
    q === "hi" ||
    q === "hello" ||
    q.includes("who are you") ||
    q.includes("what can you do") ||
    q.includes("help me with") ||
    q.includes("what is your purpose") ||
    q.includes("what do you do")
  ) {
    const routeMention = selectedRoute
      ? ` Right now you are exploring "${selectedRoute.name.split('—')[0].trim()}" with a Comfort Score of ${selectedRoute.comfortScore.toFixed(1)}/10.`
      : " You can search for routes between any two points to see comfort ratings and safety highlights.";
    const defaultReplies = selectedRoute
      ? ["Why is this route the best match?", "What does Low Signal Mode do?", "What's in my Circle?", "General night safety tips"]
      : ["What does Low Signal Mode do?", "What's in my Circle?", "How does Share ETA work?", "General night safety tips"];
    return {
      text: `Hi, I'm Saarthi — your journey guide. Ask me anything about your route or the app.${routeMention} I can explain route comfort scores, street lighting, open shops along your path, and show you how features like Low Signal Mode, Share ETA, and Community Notes work.`,
      quickReplies: defaultReplies
    };
  }

  // Thank you / gratitude
  if (q.includes("thank") || q.includes("thanks") || q.includes("awesome") || q.includes("helpful") || q.includes("great job")) {
    return {
      text: "You're very welcome! Stay alert, trust your instincts, and feel free to ask anytime you want to check lighting, transit spots, or route conditions.",
      quickReplies: selectedRoute
        ? ["Why is this route the best match?", "How does Share ETA work?", "What does Low Signal Mode do?"]
        : ["What does Low Signal Mode do?", "What's in my Circle?", "How does Share ETA work?"]
    };
  }

  // -------------------------------------------------------------------------
  // 2. USER'S CIRCLE / TRUSTED EMERGENCY CONTACTS
  // -------------------------------------------------------------------------
  if (
    q.includes("circle") || 
    q.includes("in my circle") || 
    q.includes("trusted contact") || 
    q.includes("emergency contact") || 
    q.includes("contacts")
  ) {
    if (contacts && contacts.length > 0) {
      const contactsListStr = contacts
        .map(c => `${c.name} (${c.relationship}: ${c.phone})`)
        .join(', ');
      return {
        text: `In your Saahat Circle, you currently have ${contacts.length} trusted emergency contact${contacts.length > 1 ? 's' : ''}: ${contactsListStr}. When you tap Share ETA or trigger the SOS button, these contacts will receive your live tracking link or emergency coordinates automatically.`,
        quickReplies: ["How does Share ETA work?", "How to trigger SOS?", "What does Low Signal Mode do?"]
      };
    } else {
      return {
        text: "Your Circle currently has no emergency contacts saved. You can add trusted friends or family members anytime by navigating to the 'Share Journey' tab or opening the SOS Emergency Console and tapping '+ Add Custom Number'. Once added, they will receive your live tracking links and instant alerts during emergencies.",
        quickReplies: ["How does Share ETA work?", "How to trigger SOS?", "What does Low Signal Mode do?"]
      };
    }
  }

  // -------------------------------------------------------------------------
  // 3. GENERAL APP FEATURES
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
      text: `Low Signal Mode adapts Saahat for low-battery or poor network conditions by switching to a high-contrast, text-first, dark interface that consumes minimal power and data. It provides cached turn-by-turn navigation steps and a directory of nearby verified emergency help points—such as 24/7 pharmacies, police desks, and hospitals—that you can reach even when completely offline.${isLowSignalGlobal ? " Low Signal Mode is currently ACTIVE on your device." : " You can toggle it anytime via the top header switch or from the Low Signal page."}`,
      quickReplies: ["What's in my Circle?", "How does Share ETA work?", "Why is this route the best match?"]
    };
  }

  // Feature: Share ETA / Live Journey Tracking
  if (
    q.includes("share eta") || 
    q.includes("share journey") || 
    q.includes("live tracking") || 
    q.includes("share my location") || 
    q.includes("tracking")
  ) {
    return {
      text: "Share ETA lets you send a secure, end-to-end encrypted tracking link to your trusted contacts with a single tap. Recipients can view your route progress, safety rating, and live estimated arrival time in their web browser without needing to download an app or create an account. It also provides an automated 'I Have Arrived Safely' check-in button once you reach your destination.",
      quickReplies: ["What's in my Circle?", "What does Low Signal Mode do?", "How to trigger SOS?"]
    };
  }

  // Feature: Ring Me Simulation (Discreet Comfort Call)
  if (
    q.includes("ring me") ||
    q.includes("fake call") ||
    q.includes("fake phone call") ||
    q.includes("call mom") ||
    q.includes("discreet call") ||
    q.includes("pretend call") ||
    q.includes("simulate call")
  ) {
    return {
      text: "The 'Ring Me' feature provides an innocuous simulated incoming phone call from 'Mom'. It is designed as a discreet comfort tool for situations where you need an excuse to step away from an awkward conversation or feel less alone in public. It features a loud realistic smartphone ringtone with vibration, a smartphone incoming screen, a running call timer, an animated audio waveform, and natural conversation cues. It is 100% simulated and does not dial real numbers or contact anyone.",
      quickReplies: ["Ring Me", "How does SOS work?", "What does Low Signal Mode do?"]
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
      quickReplies: ["What does Low Signal Mode do?", "Why is this route the best match?", "How does Share ETA work?"]
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
      quickReplies: ["Why is this route the best match?", "Is this route well-lit?", "Explain Low Signal Mode"]
    };
  }

  // -------------------------------------------------------------------------
  // 4. CURRENTLY DISPLAYED ROUTE SPECIFIC QUESTIONS
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

    // Why rated this way / Pros / Cons / Why rated high or low / Best Match
    if (
      q.includes("why is this route") || 
      q.includes("why is it rated") || 
      q.includes("best match") || 
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
        text: `The currently selected route "${selectedRoute.name}" is designated as the Best Match with a Comfort Score of ${score}/10 because it prioritizes safety through ${pros}. Its primary advantage is strong environmental visibility with ${lighting.toLowerCase()} and ${footfall.toLowerCase()}. The main trade-off is ${cons.toLowerCase()}, as Saahat chooses active, populated thoroughfares rather than isolated shortcuts.`,
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
        quickReplies: ["Why is this route the best match?", "Are shops open along this route?", "Share ETA with contacts"]
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
        quickReplies: ["Is this route well-lit?", "How long will this take?", "Why is this route the best match?"]
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
        quickReplies: ["Why is this route the best match?", "Is this route well-lit?", "How long will this take?"]
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
        quickReplies: ["Is this route well-lit?", "Why is this route the best match?", "How does Share ETA work?"]
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
        quickReplies: ["Why is this route the best match?", "Is this route well-lit?", "How does Share ETA work?"]
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
        quickReplies: ["What does Low Signal Mode do?", "How does Share ETA work?", "What's in my Circle?"]
      };
    }
  }

  // -------------------------------------------------------------------------
  // 5. GENERAL SAFETY & JOURNEY ADVICE (Factual, Non-Alarming Tone)
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
      quickReplies: ["Is this route well-lit?", "How does Share ETA work?", "Why is this route the best match?"]
    };
  }

  // Current page context response
  if (q.includes("where am i") || q.includes("current page") || q.includes("what screen")) {
    return {
      text: `You are currently on the "${activePage.toUpperCase()}" screen of Saahat.${selectedRoute ? ` Your active route is "${selectedRoute.name.split('—')[0].trim()}" (${selectedRoute.comfortScore.toFixed(1)}/10 comfort rating).` : ""} You can navigate between Search, Results, Share Journey, Community Notes, and Low Signal Mode using the navigation bar.`,
      quickReplies: ["Why is this route the best match?", "What does Low Signal Mode do?", "What's in my Circle?"]
    };
  }

  // -------------------------------------------------------------------------
  // 6. HELPFUL REDIRECT FOR OUT-OF-SCOPE QUESTIONS
  // -------------------------------------------------------------------------
  return {
    text: "I can't help with that directly, but I can tell you about your route options, street lighting, comfort scores, or app features like Low Signal Mode and Share ETA. What would you like to know about your journey?",
    quickReplies: ["Why is this route the best match?", "What does Low Signal Mode do?", "What's in my Circle?", "General night safety tips"]
  };
}

/**
 * Google Gemini AI integration for intelligent context-aware responses
 */
async function fetchGeminiAI(
  userQuery: string,
  contextBlock: string,
  apiKey: string
): Promise<{ text: string; isSOSPrompt?: boolean; quickReplies?: string[] } | null> {
  const systemInstruction = `You are Saarthi, the in-app AI guide for Saahat — a women's context-aware travel safety app built for India.

You have access to the following REAL-TIME app state and route data:

${contextBlock}

Rules:
1. Tone: Warm, empowering, factual, calm, and non-alarming. Keep responses concise (2-4 sentences max).
2. Use the SPECIFIC data above — reference actual comfort scores, actual pros/cons, actual lighting descriptions, and actual feature names.
3. Do NOT give vague or generic safety advice. Use the specific route information provided.
4. If asked "Why is this route the best match?", cite the exact comfort score, specific pros, and environmental ratings from the data above.
5. If asked about features (Low Signal Mode, Share ETA, SOS, Community Notes, Profile), explain the exact app mechanics.
6. If asked about the Circle or emergency contacts, reference the user's actual contacts if listed, or explain how to add them.
7. If the question falls outside the app's scope, say: "I can't help with that directly, but I can tell you about your route options or app features."
8. If the user expresses distress or emergency, stay calm and instruct them to use the SOS Emergency button immediately.
9. Do NOT use markdown formatting, bullet points, or numbered lists. Reply in plain conversational text.
10. Do NOT include any emojis in your response.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userQuery }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
            topP: 0.9
          }
        })
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.warn('Gemini API error:', res.status, errBody);
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;

    // Check if Gemini's response indicates distress/SOS
    const lowerText = text.toLowerCase();
    const isSOSPrompt = lowerText.includes('sos') || lowerText.includes('emergency console') || lowerText.includes('call police');

    return {
      text,
      isSOSPrompt,
      quickReplies: isSOSPrompt
        ? ["Open SOS Emergency", "I'm Safe Now"]
        : ["Why is this route the best match?", "What does Low Signal Mode do?", "What's in my Circle?"]
    };
  } catch (err) {
    console.warn("Gemini API network error:", err);
    return null;
  }
}
