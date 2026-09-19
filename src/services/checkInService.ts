import { ActiveCheckInJourney, CheckInStatus, CheckInChannel, CheckInStatusEvent } from '../types';
import { updateSharedETAHistoryItem } from './historyService';

const ACTIVE_CHECKIN_KEY = 'saahat_active_checkin';
const SIMULATED_OFFLINE_KEY = 'saahat_simulate_offline';

// Event listener subscribers for real-time reactivity across components
type CheckInSubscriber = (journey: ActiveCheckInJourney | null) => void;
const subscribers: Set<CheckInSubscriber> = new Set();

export function subscribeToCheckIn(cb: CheckInSubscriber): () => void {
  subscribers.add(cb);
  cb(getActiveCheckIn());
  return () => {
    subscribers.delete(cb);
  };
}

function notifySubscribers(journey: ActiveCheckInJourney | null) {
  subscribers.forEach(cb => {
    try {
      cb(journey);
    } catch (e) {
      console.warn('Check-in subscriber error:', e);
    }
  });
}

// ---------------------------------------------------------------------------
// Connectivity & Offline Simulation Helpers
// ---------------------------------------------------------------------------

export function isSimulatedOffline(): boolean {
  try {
    return localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSimulatedOffline(val: boolean): void {
  try {
    localStorage.setItem(SIMULATED_OFFLINE_KEY, val ? 'true' : 'false');
    notifySubscribers(getActiveCheckIn());
    addLogEvent(
      val ? 'Switched to Offline Mode (SMS fallback active)' : 'Switched to Online Mode (WhatsApp primary active)',
      val ? 'sms' : 'whatsapp'
    );
  } catch {
    // Ignore
  }
}

// ---------------------------------------------------------------------------
// Simulation Log Event System
// ---------------------------------------------------------------------------

export interface SimulationLogEvent {
  id: string;
  timestamp: string;
  rawTime: number;
  event: string;
  channel: CheckInChannel | 'system';
  details?: string;
  recipient?: string;
}

const SIM_LOGS_KEY = 'saahat_sim_logs';
let memoryLogs: SimulationLogEvent[] = [];
try {
  const saved = localStorage.getItem(SIM_LOGS_KEY);
  if (saved) memoryLogs = JSON.parse(saved);
} catch {}

type LogSubscriber = (logs: SimulationLogEvent[]) => void;
const logSubscribers: Set<LogSubscriber> = new Set();

export function subscribeToLogEvents(cb: LogSubscriber): () => void {
  logSubscribers.add(cb);
  cb([...memoryLogs]);
  return () => {
    logSubscribers.delete(cb);
  };
}

export function addLogEvent(
  event: string,
  channel: CheckInChannel | 'system' = 'system',
  details?: string,
  recipient?: string
): SimulationLogEvent {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const entry: SimulationLogEvent = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: timeStr,
    rawTime: Date.now(),
    event,
    channel,
    details,
    recipient
  };
  memoryLogs = [entry, ...memoryLogs].slice(0, 100);
  try {
    localStorage.setItem(SIM_LOGS_KEY, JSON.stringify(memoryLogs));
  } catch {}
  logSubscribers.forEach(cb => {
    try { cb([...memoryLogs]); } catch {}
  });
  return entry;
}

export function getLogEvents(): SimulationLogEvent[] {
  return [...memoryLogs];
}

export function clearLogEvents(): void {
  memoryLogs = [];
  try {
    localStorage.removeItem(SIM_LOGS_KEY);
  } catch {}
  logSubscribers.forEach(cb => cb([]));
}

// ---------------------------------------------------------------------------
// Time-Speed Multiplier for Fast Demo
// ---------------------------------------------------------------------------

let simSpeedMultiplier = 1;
const speedSubscribers: Set<(mult: number) => void> = new Set();

export function getSimSpeedMultiplier(): number {
  return simSpeedMultiplier;
}

export function setSimSpeedMultiplier(mult: number): void {
  simSpeedMultiplier = mult;
  speedSubscribers.forEach(cb => {
    try { cb(mult); } catch {}
  });
  addLogEvent(
    `Simulation speed set to ${mult}x ${mult === 60 ? '(1 min = 1 sec)' : ''}`,
    'system'
  );
}

export function subscribeToSimSpeed(cb: (mult: number) => void): () => void {
  speedSubscribers.add(cb);
  cb(simSpeedMultiplier);
  return () => {
    speedSubscribers.delete(cb);
  };
}

export function isDeviceOnline(): boolean {
  if (isSimulatedOffline()) return false;
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Channel Dispatch Logic: WhatsApp Primary, Native SMS Fallback
// ---------------------------------------------------------------------------

export function formatCleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[\s\-\(\)]/g, '');
  if (!clean.startsWith('+') && !clean.startsWith('91')) {
    clean = '91' + clean;
  } else if (clean.startsWith('+')) {
    clean = clean.substring(1);
  }
  return clean;
}

export interface DispatchResult {
  channel: CheckInChannel;
  url: string;
  recipientPhone: string;
  message: string;
  timestamp: string;
}

export function dispatchStatusMessage(
  recipientPhone: string,
  message: string,
  forceOffline?: boolean
): DispatchResult {
  const online = forceOffline !== undefined ? !forceOffline : isDeviceOnline();
  const cleanPhone = formatCleanPhoneNumber(recipientPhone);
  const encodedMessage = encodeURIComponent(message);
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let channel: CheckInChannel = 'whatsapp';
  let url = '';

  if (online) {
    // Primary: WhatsApp Deep Link
    channel = 'whatsapp';
    url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = url;
    }
  } else {
    // Offline Fallback: Native SMS URI
    channel = 'sms';
    // Cross-platform SMS URI standard
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    url = isIOS 
      ? `sms:${cleanPhone}&body=${encodedMessage}`
      : `sms:${cleanPhone}?body=${encodedMessage}`;
    
    // Trigger native SMS application directly via an anchor click to avoid popup blocker issues
    try {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('target', '_top');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 300);
    } catch {
      window.location.href = url;
    }
  }

  // Record outgoing dispatch to chronological simulation log
  addLogEvent(
    `Outgoing ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} sent to ${cleanPhone}`,
    channel,
    message,
    cleanPhone
  );

  return {
    channel,
    url,
    recipientPhone,
    message,
    timestamp
  };
}

// ---------------------------------------------------------------------------
// Active Check-In State Management
// ---------------------------------------------------------------------------

export function getActiveCheckIn(): ActiveCheckInJourney | null {
  try {
    const raw = localStorage.getItem(ACTIVE_CHECKIN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse active checkin:', e);
    return null;
  }
}

export function saveActiveCheckIn(journey: ActiveCheckInJourney | null): void {
  try {
    if (!journey) {
      localStorage.removeItem(ACTIVE_CHECKIN_KEY);
    } else {
      localStorage.setItem(ACTIVE_CHECKIN_KEY, JSON.stringify(journey));
    }
    notifySubscribers(journey);
  } catch (e) {
    console.warn('Failed to save active checkin:', e);
  }
}

// Create a new active check-in journey
export function createActiveCheckIn(params: {
  historyId?: string;
  recipientName: string;
  recipientPhone: string;
  routeName: string;
  durationMinutes: number;
  expectedArrivalTime: string;
  customArrivalMessage?: string;
  lastKnownLocation?: {
    lat: number;
    lng: number;
    mapsLink: string;
    text: string;
  };
}): ActiveCheckInJourney {
  const targetTimestamp = Date.now() + params.durationMinutes * 60 * 1000;
  const initialEvent: CheckInStatusEvent = {
    status: 'pending',
    timestamp: Date.now(),
    timestampFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    channel: isDeviceOnline() ? 'whatsapp' : 'sms',
    note: `Check-in scheduled for ${params.expectedArrivalTime}. Custom arrival message held pending status confirmation.`
  };

  const newJourney: ActiveCheckInJourney = {
    id: params.historyId || `checkin-${Date.now()}`,
    recipientName: params.recipientName,
    recipientPhone: params.recipientPhone,
    routeName: params.routeName,
    durationMinutes: params.durationMinutes,
    expectedArrivalTime: params.expectedArrivalTime,
    targetTimestamp,
    customArrivalMessage: params.customArrivalMessage || '',
    customMessageReleased: false,
    checkinStatus: 'pending',
    channelUsed: isDeviceOnline() ? 'whatsapp' : 'sms',
    statusHistory: [initialEvent],
    escalationTier: 0,
    lastKnownLocation: params.lastKnownLocation
  };

  saveActiveCheckIn(newJourney);

  addLogEvent(
    `Journey created: Expected arrival ${params.expectedArrivalTime} (~${params.durationMinutes}m) with ${params.recipientName}`,
    'system',
    params.customArrivalMessage ? `Scheduled custom arrival note held: "${params.customArrivalMessage}"` : undefined,
    params.recipientPhone
  );

  return newJourney;
}

// User confirms or schedules custom message on current active journey
export function scheduleCustomArrivalMessage(customMessage: string): boolean {
  const current = getActiveCheckIn();
  if (!current) return false;
  const updated: ActiveCheckInJourney = {
    ...current,
    customArrivalMessage: customMessage.trim()
  };
  saveActiveCheckIn(updated);
  updateSharedETAHistoryItem(current.id, {
    customArrivalMessage: customMessage.trim()
  });
  addLogEvent(
    `Custom arrival message scheduled: "${customMessage.trim()}" (held securely until confirmed safe arrival)`,
    'system',
    customMessage.trim(),
    current.recipientPhone
  );
  return true;
}

// User confirms they have arrived safely: Release held custom message!
export function confirmArrivedSafely(userName: string = 'I'): { dispatched: boolean; messageSent?: string; channel?: CheckInChannel } {
  const current = getActiveCheckIn();
  if (!current) return { dispatched: false };

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const finalMessage = current.customArrivalMessage && current.customArrivalMessage.trim()
    ? `✨ ${userName}: "${current.customArrivalMessage}"\n\n(Confirmed safe arrival via Saahat at ${timeStr})`
    : `✅ ${userName} has arrived safely at destination.\n\nConfirmed safe arrival via Saahat at ${timeStr}.`;

  // Release and send the scheduled arrival message
  const result = dispatchStatusMessage(current.recipientPhone, finalMessage);

  addLogEvent(
    `User confirmed safe arrival! Released scheduled arrival message to ${current.recipientName}`,
    result.channel,
    finalMessage,
    current.recipientPhone
  );

  const updatedHistory: CheckInStatusEvent[] = [
    ...current.statusHistory,
    {
      status: 'arrived_safely',
      timestamp: Date.now(),
      timestampFormatted: timeStr,
      channel: result.channel,
      note: `Safe arrival confirmed. Released scheduled message to ${current.recipientName} via ${result.channel.toUpperCase()}.`
    }
  ];

  const updatedJourney: ActiveCheckInJourney = {
    ...current,
    checkinStatus: 'arrived_safely',
    customMessageReleased: true,
    channelUsed: result.channel,
    statusHistory: updatedHistory,
    escalationTier: 0
  };

  saveActiveCheckIn(updatedJourney);

  // Update in shared history if exists
  updateSharedETAHistoryItem(current.id, {
    checkinStatus: 'arrived_safely',
    customMessageReleased: true,
    channelUsed: result.channel
  });

  return {
    dispatched: true,
    messageSent: finalMessage,
    channel: result.channel
  };
}

// Option 1: "I'm safe — just running late"
// Reschedules arrival time, sends notification, restarts live countdown
export function handleCheckInOption1_RunningLate(
  minutesToAdd: number,
  userName: string = 'User'
): { newArrivalTime: string; channel: CheckInChannel; message: string } {
  const current = getActiveCheckIn();
  if (!current) {
    throw new Error('No active check-in journey found');
  }

  const now = new Date();
  now.setMinutes(now.getMinutes() + minutesToAdd);
  const newArrivalTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newTargetTimestamp = Date.now() + minutesToAdd * 60 * 1000;

  const message = `${userName} is safe — just running late. New check-in: ${newArrivalTime} (+${minutesToAdd} mins). Powered by Saahat.`;
  const result = dispatchStatusMessage(current.recipientPhone, message);

  addLogEvent(
    `User checked in: "Running Late" (+${minutesToAdd}m). New check-in due: ${newArrivalTime}`,
    result.channel,
    message,
    current.recipientPhone
  );

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const updatedHistory: CheckInStatusEvent[] = [
    ...current.statusHistory,
    {
      status: 'safe_delayed',
      timestamp: Date.now(),
      timestampFormatted: timeStr,
      channel: result.channel,
      note: `User confirmed safe but running late. Extended by +${minutesToAdd}m to ${newArrivalTime}. Escalation cancelled.`
    }
  ];

  const updatedJourney: ActiveCheckInJourney = {
    ...current,
    checkinStatus: 'safe_delayed',
    newCheckinTime: newArrivalTime,
    targetTimestamp: newTargetTimestamp,
    durationMinutes: current.durationMinutes + minutesToAdd,
    channelUsed: result.channel,
    statusHistory: updatedHistory,
    escalationTier: 0 // Cancels pending escalation
  };

  saveActiveCheckIn(updatedJourney);
  updateSharedETAHistoryItem(current.id, {
    checkinStatus: 'safe_delayed',
    newCheckinTime: newArrivalTime,
    channelUsed: result.channel
  });

  return {
    newArrivalTime,
    channel: result.channel,
    message
  };
}

// Option 2: "I'm safe — low battery / poor signal"
// Pauses escalation, shares last authorized location, schedules longer backstop timer (+45m)
export function handleCheckInOption2_LowSignal(
  userName: string = 'User',
  locationString?: string
): { channel: CheckInChannel; message: string; backstopTime: string } {
  const current = getActiveCheckIn();
  if (!current) {
    throw new Error('No active check-in journey found');
  }

  const now = new Date();
  now.setMinutes(now.getMinutes() + 45);
  const backstopTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newTargetTimestamp = Date.now() + 45 * 60 * 1000;

  const loc = locationString || current.lastKnownLocation?.text || 'Current Route Checkpoint';
  const mapsLink = current.lastKnownLocation?.mapsLink ? ` (${current.lastKnownLocation.mapsLink})` : '';

  const message = `${userName} is safe but has low battery/weak signal. She may go offline. Last location shared: ${loc}${mapsLink}. Next check-in: ${backstopTime} (~45 min). Silence afterward is expected and not alarming. Powered by Saahat.`;
  const result = dispatchStatusMessage(current.recipientPhone, message);

  addLogEvent(
    `User checked in: "Low Battery / Weak Signal". Escalation paused. Next check-in set to ${backstopTime}`,
    result.channel,
    message,
    current.recipientPhone
  );

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const updatedHistory: CheckInStatusEvent[] = [
    ...current.statusHistory,
    {
      status: 'safe_low_signal',
      timestamp: Date.now(),
      timestampFormatted: timeStr,
      channel: result.channel,
      note: `User confirmed safe with low battery/signal. Escalation paused. Longer backstop set for ${backstopTime}.`
    }
  ];

  const updatedJourney: ActiveCheckInJourney = {
    ...current,
    checkinStatus: 'safe_low_signal',
    newCheckinTime: backstopTime,
    targetTimestamp: newTargetTimestamp,
    backstopTimestamp: newTargetTimestamp,
    channelUsed: result.channel,
    statusHistory: updatedHistory,
    escalationTier: 0
  };

  saveActiveCheckIn(updatedJourney);
  updateSharedETAHistoryItem(current.id, {
    checkinStatus: 'safe_low_signal',
    newCheckinTime: backstopTime,
    channelUsed: result.channel
  });

  return {
    channel: result.channel,
    message,
    backstopTime
  };
}

// Option 3: "I need help now"
// Immediately alerts all contacts, shares live GPS coordinates, and triggers SOS console
export function handleCheckInOption3_NeedHelpNow(
  userName: string = 'User',
  coordinates?: { lat: number; lng: number }
): { channel: CheckInChannel; message: string } {
  const current = getActiveCheckIn();
  const phone = current?.recipientPhone || '';

  const lat = coordinates?.lat || current?.lastKnownLocation?.lat || 28.6653;
  const lng = coordinates?.lng || current?.lastKnownLocation?.lng || 77.2324;
  const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const message = `🚨 URGENT: ${userName} has requested immediate help via Saahat. Last known location: ${mapsLink} (${lat.toFixed(5)}, ${lng.toFixed(5)}). Sent: ${timeStr}. Please check on her immediately or contact local authorities.`;
  const result = dispatchStatusMessage(phone, message);

  addLogEvent(
    `🚨 User triggered Option 3: "I need help now!" Broadcast sent to ${phone}`,
    result.channel,
    message,
    phone
  );

  if (current) {
    const updatedHistory: CheckInStatusEvent[] = [
      ...current.statusHistory,
      {
        status: 'help_requested',
        timestamp: Date.now(),
        timestampFormatted: timeStr,
        channel: result.channel,
        note: `CRITICAL: User explicitly tapped 'I need help now'. Emergency dispatch broadcast sent via ${result.channel.toUpperCase()}.`
      }
    ];

    const updatedJourney: ActiveCheckInJourney = {
      ...current,
      checkinStatus: 'help_requested',
      channelUsed: result.channel,
      statusHistory: updatedHistory,
      escalationTier: 3
    };

    saveActiveCheckIn(updatedJourney);
    updateSharedETAHistoryItem(current.id, {
      checkinStatus: 'help_requested',
      channelUsed: result.channel
    });
  }

  return {
    channel: result.channel,
    message
  };
}

// ---------------------------------------------------------------------------
// Tiered Escalation for Unresponsiveness
// ---------------------------------------------------------------------------

export function handleUnresponsiveEscalation(
  tier: number,
  userName: string = 'User'
): { tier: number; message: string; channel: CheckInChannel } {
  const current = getActiveCheckIn();
  if (!current) {
    throw new Error('No active check-in journey found');
  }

  const phone = current.recipientPhone;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let message = '';

  if (tier === 1) {
    // Tier 1: Gentle Nudge to contact
    message = `⚠️ Saahat Safety Check: ${userName} reached expected arrival time (${current.expectedArrivalTime}) with no check-in recorded yet. Attempting automated in-app follow-up. Timestamp: ${timeStr}.`;
  } else if (tier === 2) {
    // Tier 2: SMS Fallback Attempt
    message = `⚠️ Saahat Escalation (Tier 2): ${userName} has not responded to check-in prompts 5+ mins past arrival time. Contacting primary emergency contact. Route: ${current.routeName}. Timestamp: ${timeStr}.`;
  } else {
    // Tier 3: Detailed Emergency Escalation
    const loc = current.lastKnownLocation;
    const locStr = loc ? `${loc.text} (${loc.mapsLink})` : 'Designated Route';
    message = `🚨 URGENT SAAHAT ESCALATION: ${userName} remains completely unresponsive after multiple check-in prompts. Route: ${current.routeName}. Last known checkpoint: ${locStr}. Nearest Police Assistance advised. Sent ${timeStr}.`;
  }

  // Force SMS fallback on Tier 2 & Tier 3 if desired for maximum delivery reliability
  const forceSMS = tier >= 2;
  const result = dispatchStatusMessage(phone, message, forceSMS);

  addLogEvent(
    `⚠️ Unresponsiveness Escalation Tier ${tier} triggered (${tier === 1 ? 'Internal Nudge' : tier === 2 ? 'SMS ping' : 'Emergency alert'})`,
    result.channel,
    message,
    phone
  );

  const updatedHistory: CheckInStatusEvent[] = [
    ...current.statusHistory,
    {
      status: 'no_response',
      timestamp: Date.now(),
      timestampFormatted: timeStr,
      channel: result.channel,
      note: `Escalation Tier ${tier} triggered due to unresponsiveness. Sent via ${result.channel.toUpperCase()}.`
    }
  ];

  const updatedJourney: ActiveCheckInJourney = {
    ...current,
    checkinStatus: 'no_response',
    escalationTier: tier,
    channelUsed: result.channel,
    statusHistory: updatedHistory
  };

  saveActiveCheckIn(updatedJourney);
  updateSharedETAHistoryItem(current.id, {
    checkinStatus: 'no_response',
    channelUsed: result.channel
  });

  return {
    tier,
    message,
    channel: result.channel
  };
}

// Clear or end active check-in journey
export function clearActiveCheckIn(): void {
  saveActiveCheckIn(null);
}
