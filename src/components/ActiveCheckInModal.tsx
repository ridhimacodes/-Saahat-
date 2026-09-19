import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  BatteryLow, 
  WifiOff, 
  Send, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  X, 
  AlertCircle, 
  Compass, 
  Radio, 
  ExternalLink,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { 
  ActiveCheckInJourney, 
  CheckInChannel, 
  CheckInStatus 
} from '../types';
import { 
  subscribeToCheckIn, 
  confirmArrivedSafely, 
  handleCheckInOption1_RunningLate, 
  handleCheckInOption2_LowSignal, 
  handleCheckInOption3_NeedHelpNow, 
  handleUnresponsiveEscalation,
  isDeviceOnline,
  isSimulatedOffline,
  setSimulatedOffline,
  saveActiveCheckIn,
  clearActiveCheckIn,
  getSimSpeedMultiplier,
  subscribeToSimSpeed,
  addLogEvent
} from '../services/checkInService';
import confetti from 'canvas-confetti';

interface ActiveCheckInModalProps {
  userName?: string;
  onTriggerSOS: () => void;
  isLowSignalGlobal?: boolean;
}

export const ActiveCheckInModal: React.FC<ActiveCheckInModalProps> = ({
  userName = 'Trisha',
  onTriggerSOS,
  isLowSignalGlobal = false
}) => {
  const [journey, setJourney] = useState<ActiveCheckInJourney | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [selectedLateMins, setSelectedLateMins] = useState<number | null>(null);
  const [lastActionNotice, setLastActionNotice] = useState<{ text: string; channel: CheckInChannel } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unresponsiveElapsedSeconds, setUnresponsiveElapsedSeconds] = useState(0);
  const [currentTier, setCurrentTier] = useState<number>(0);
  const [offlineSimulated, setOfflineSimulated] = useState(isSimulatedOffline());

  // Subscribe to real-time check-in updates
  useEffect(() => {
    const unsubscribe = subscribeToCheckIn((j) => {
      setJourney(j);
      if (j) {
        const secs = Math.max(0, Math.floor((j.targetTimestamp - Date.now()) / 1000));
        setRemainingSeconds(secs);
        if (secs === 0 && j.checkinStatus === 'pending') {
          setIsPromptOpen(true);
        }
        setCurrentTier(j.escalationTier);
      } else {
        setIsPromptOpen(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 1-second interval ticker for live countdown & escalation monitoring
  useEffect(() => {
    if (!journey || journey.checkinStatus === 'arrived_safely') return;

    const interval = setInterval(() => {
      const speed = getSimSpeedMultiplier();
      if (speed > 1 && journey.targetTimestamp > Date.now()) {
        // Accelerate countdown by shifting target timestamp closer
        const advanceMs = (speed - 1) * 1000;
        journey.targetTimestamp = Math.max(Date.now(), journey.targetTimestamp - advanceMs);
      }

      const now = Date.now();
      const secs = Math.max(0, Math.floor((journey.targetTimestamp - now) / 1000));
      setRemainingSeconds(secs);

      // When countdown hits 0 and status is pending: trigger prompt!
      if (secs === 0) {
        if (!isPromptOpen && journey.checkinStatus === 'pending') {
          setIsPromptOpen(true);
          addLogEvent("Countdown reached zero — Check-in prompt displayed to user", "system");
        }

        // Track time past arrival for unresponsiveness escalation
        const overTimeSecs = Math.floor((now - journey.targetTimestamp) / 1000);
        setUnresponsiveElapsedSeconds(overTimeSecs);

        // Standard 5-minute unresponsiveness tiers (300s = 5m, 600s = 10m, 900s = 15m)
        if (journey.checkinStatus === 'pending' || journey.checkinStatus === 'no_response') {
          if (overTimeSecs >= 900 && journey.escalationTier < 3) {
            handleUnresponsiveEscalation(3, userName);
          } else if (overTimeSecs >= 600 && journey.escalationTier < 2) {
            handleUnresponsiveEscalation(2, userName);
          } else if (overTimeSecs >= 300 && journey.escalationTier < 1) {
            handleUnresponsiveEscalation(1, userName);
          }
        }
      } else {
        setUnresponsiveElapsedSeconds(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [journey, userName, isPromptOpen]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs}h ${remainingMins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Safe Arrival confirmation handler
  const handleConfirmArrival = () => {
    const res = confirmArrivedSafely(userName);
    setIsPromptOpen(false);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
    if (res.dispatched && res.channel) {
      setLastActionNotice({
        text: 'Safe arrival confirmed! Custom message released.',
        channel: res.channel
      });
      setTimeout(() => setLastActionNotice(null), 5000);
    }
  };

  // Option 1: Running late (+15, +30, +60 min)
  const handleApplyRunningLate = (mins: number) => {
    try {
      const res = handleCheckInOption1_RunningLate(mins, userName);
      setSelectedLateMins(null);
      setIsPromptOpen(false);
      setLastActionNotice({
        text: `Check-in postponed by +${mins}m to ${res.newArrivalTime}`,
        channel: res.channel
      });
      setTimeout(() => setLastActionNotice(null), 5000);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Option 2: Low battery / poor signal
  const handleSelectLowSignal = () => {
    try {
      const res = handleCheckInOption2_LowSignal(userName);
      setIsPromptOpen(false);
      setLastActionNotice({
        text: `Contact notified of low battery/signal. Backstop timer set for ${res.backstopTime}.`,
        channel: res.channel
      });
      setTimeout(() => setLastActionNotice(null), 6000);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Option 3: Immediate emergency help
  const handleSelectNeedHelp = () => {
    handleCheckInOption3_NeedHelpNow(userName);
    setIsPromptOpen(false);
    onTriggerSOS();
  };

  // Demo & Fast Testing Helpers
  const handleFastTest1Min = () => {
    if (!journey) return;
    const updated = {
      ...journey,
      targetTimestamp: Date.now() + 60 * 1000,
      durationMinutes: 1,
      checkinStatus: 'pending' as CheckInStatus,
      escalationTier: 0
    };
    saveActiveCheckIn(updated);
    setRemainingSeconds(60);
    setIsPromptOpen(false);
  };

  const handleTriggerExpiryNow = () => {
    if (!journey) return;
    const updated = {
      ...journey,
      targetTimestamp: Date.now() - 1000,
      checkinStatus: 'pending' as CheckInStatus
    };
    saveActiveCheckIn(updated);
    setRemainingSeconds(0);
    setIsPromptOpen(true);
  };

  const handleSimulateFastEscalation = (tier: number) => {
    handleUnresponsiveEscalation(tier, userName);
  };

  const toggleSimulateOffline = () => {
    const next = !offlineSimulated;
    setOfflineSimulated(next);
    setSimulatedOffline(next);
  };

  if (!journey) return null;

  const onlineState = !offlineSimulated && !isLowSignalGlobal && isDeviceOnline();

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* 1. PERSISTENT LIVE COUNTDOWN FLOATING DOCK                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed top-16 sm:top-20 left-1/2 transform -translate-x-1/2 z-40 w-[95%] max-w-lg select-none">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`rounded-2xl border shadow-xl backdrop-blur-md overflow-hidden transition-all ${
            isLowSignalGlobal
              ? 'bg-slate-900/95 border-slate-700 text-white'
              : remainingSeconds === 0
              ? 'bg-amber-50/95 border-amber-300 text-slate-900'
              : 'bg-white/95 border-purple-200 text-slate-900 shadow-purple-900/10'
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 py-2.5 flex items-center justify-between gap-3 border-b border-inherit/40 bg-black/5">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${
                remainingSeconds === 0 ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'
              }`} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Active Check-In with {journey.recipientName}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Channel Transparency Badge */}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                onlineState
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {onlineState ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>WhatsApp Primary</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2.5 h-2.5 text-amber-700" />
                    <span>SMS Offline Fallback</span>
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                title={isMinimized ? "Expand check-in bar" : "Minimize check-in bar"}
              >
                {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Main Countdown Body */}
          {!isMinimized && (
            <div className="p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Expected Arrival: <strong className="text-slate-800 dark:text-slate-200">{journey.newCheckinTime || journey.expectedArrivalTime}</strong>
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight flex items-center gap-2">
                    <Clock className={`w-5 h-5 ${remainingSeconds === 0 ? 'text-amber-500 animate-bounce' : 'text-indigo-600'}`} />
                    <span className={remainingSeconds === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}>
                      {remainingSeconds === 0 ? '00:00 (Check-In Due)' : `${formatCountdown(remainingSeconds)} remaining`}
                    </span>
                  </div>
                </div>

                {/* Confirm Arrival Button */}
                <button
                  type="button"
                  onClick={handleConfirmArrival}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
                  title="Confirm safe arrival and release custom message"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I've Arrived Safely</span>
                </button>
              </div>

              {/* Scheduled Custom Message Preview Notice (Status-Gated) */}
              {journey.customArrivalMessage && !journey.customMessageReleased && (
                <div className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">
                    Scheduled message held securely: <em>"{journey.customArrivalMessage}"</em>
                  </span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Action Notice Toast */}
        <AnimatePresence>
          {lastActionNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg flex items-center justify-between gap-2 border border-slate-700"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{lastActionNotice.text}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase font-bold">
                {lastActionNotice.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. THREE-OPTION CHECK-IN PROMPT MODAL AT ARRIVAL TIME (00:00)      */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {isPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 sm:p-8 shadow-2xl border border-amber-200 dark:border-slate-700 space-y-6 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      Expected Arrival Check-In
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Your ETA with <strong>{journey.recipientName}</strong> was {journey.newCheckinTime || journey.expectedArrivalTime}. Please confirm your status:
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPromptOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Channel Transparency Tag */}
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">Outgoing Dispatch Channel:</span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                  onlineState
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  <Send className="w-3 h-3" />
                  <span>{onlineState ? 'Primary: WhatsApp' : 'Offline Fallback: Native SMS'}</span>
                </span>
              </div>

              {/* THE THREE ACTIVE OPTIONS */}
              <div className="space-y-3">
                {/* OPTION 1: "I'm safe — just running late" */}
                <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 p-4 space-y-3 bg-indigo-50/40 dark:bg-indigo-950/20 hover:border-indigo-400 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                        <span>Option 1:</span>
                        <span>"I'm safe — just running late"</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Cancels pending escalation. Select a new check-in window to notify {journey.recipientName} and restart countdown:
                      </p>
                    </div>
                  </div>

                  {/* One-tap quick options (+15 / +30 / +60 min) */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApplyRunningLate(15)}
                      className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-105 active:scale-95"
                    >
                      +15 Mins
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyRunningLate(30)}
                      className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-105 active:scale-95"
                    >
                      +30 Mins
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyRunningLate(60)}
                      className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-105 active:scale-95"
                    >
                      +60 Mins
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono">
                    Message to send: <em>"{userName} is safe — just running late. New check-in: [selected time]."</em>
                  </div>
                </div>

                {/* OPTION 2: "I'm safe — low battery / poor signal" */}
                <button
                  type="button"
                  onClick={handleSelectLowSignal}
                  className="w-full text-left rounded-2xl border-2 border-amber-200 dark:border-amber-900/60 p-4 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-400 transition-all hover:scale-[1.01] active:scale-[0.99] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-2">
                      <BatteryLow className="w-4 h-4 text-amber-600" />
                      <span>Option 2: "I'm safe — low battery / poor signal"</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      +45m Backstop
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Pauses escalation and shares your last known checkpoint. Explicitly reassures your contact that subsequent silence is expected and not alarming.
                  </p>
                </button>

                {/* OPTION 3: "I need help now" */}
                <button
                  type="button"
                  onClick={handleSelectNeedHelp}
                  className="w-full text-left rounded-2xl border-2 border-rose-500 bg-gradient-to-r from-rose-600 to-red-600 text-white p-4 hover:from-rose-500 hover:to-red-500 shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-black flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-200 animate-bounce" />
                      <span>Option 3: "I need help now"</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20">
                      Emergency Alert
                    </span>
                  </div>
                  <p className="text-xs text-rose-100 leading-relaxed">
                    Immediately broadcasts urgent emergency message with live Google Maps link and plain-text GPS to all emergency contacts and opens your SOS console.
                  </p>
                </button>
              </div>

              {/* Unresponsiveness Escalation Status & Timer Notice */}
              <div className="rounded-2xl p-3.5 bg-slate-100 dark:bg-slate-800 border text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-[11px]">
                  <span className="text-slate-700 dark:text-slate-300">Automated Escalation if Unresponsive:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    {unresponsiveElapsedSeconds >= 300 
                      ? `Tier ${currentTier || 1} Triggered` 
                      : `Escalates in ${300 - (unresponsiveElapsedSeconds % 300)}s`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  If you do not tap any choice within 5 minutes past expected arrival, Saahat begins the tiered escalation sequence (Tier 1 nudge → Tier 2 SMS fallback → Tier 3 detailed alert with route, checkpoint, and nearest police station).
                </p>

              </div>

              {/* Footer: Safe Arrival Alternative */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-medium">Already reached?</span>
                <button
                  type="button"
                  onClick={handleConfirmArrival}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>I've Arrived Safely (Release Message)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
