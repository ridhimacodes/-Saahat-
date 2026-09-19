import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, 
  X, 
  FastForward, 
  Wifi, 
  WifiOff, 
  Clock, 
  AlertTriangle, 
  BatteryLow, 
  Copy, 
  Trash2, 
  Zap
} from 'lucide-react';
import { 
  getActiveCheckIn, 
  createActiveCheckIn, 
  confirmArrivedSafely, 
  handleCheckInOption1_RunningLate, 
  handleCheckInOption2_LowSignal, 
  handleCheckInOption3_NeedHelpNow, 
  handleUnresponsiveEscalation, 
  isSimulatedOffline, 
  setSimulatedOffline, 
  getSimSpeedMultiplier, 
  setSimSpeedMultiplier, 
  subscribeToSimSpeed, 
  getLogEvents, 
  subscribeToLogEvents, 
  clearLogEvents, 
  clearActiveCheckIn, 
  saveActiveCheckIn, 
  SimulationLogEvent, 
  addLogEvent 
} from '../services/checkInService';
import { ActiveCheckInJourney } from '../types';

interface DemoSimulatorPanelProps {
  userName?: string;
  onTriggerSOS?: () => void;
}

export const DemoSimulatorPanel: React.FC<DemoSimulatorPanelProps> = ({
  userName = 'Trisha',
  onTriggerSOS
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<SimulationLogEvent[]>(() => getLogEvents());
  const [simSpeed, setSimSpeed] = useState<number>(() => getSimSpeedMultiplier());
  const [isOffline, setIsOffline] = useState<boolean>(() => isSimulatedOffline());
  const [activeJourney, setActiveJourney] = useState<ActiveCheckInJourney | null>(() => getActiveCheckIn());
  const [copiedLog, setCopiedLog] = useState(false);

  // Subscribe to live log events, speed, and checkin status
  useEffect(() => {
    const unsubLogs = subscribeToLogEvents(setLogs);
    const unsubSpeed = subscribeToSimSpeed(setSimSpeed);
    return () => {
      unsubLogs();
      unsubSpeed();
    };
  }, []);

  // Sync active journey periodically or on state change
  useEffect(() => {
    const check = () => setActiveJourney(getActiveCheckIn());
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleOffline = () => {
    const next = !isOffline;
    setIsOffline(next);
    setSimulatedOffline(next);
  };

  const handleSetSpeed = (speed: number) => {
    setSimSpeedMultiplier(speed);
  };

  // Helper to ensure a demo journey exists before testing states
  const ensureDemoJourney = (): ActiveCheckInJourney => {
    let current = getActiveCheckIn();
    if (!current) {
      current = createActiveCheckIn({
        recipientName: 'Mom (Trusted Contact)',
        recipientPhone: '+919876543210',
        routeName: 'Pink Line Safe Corridor',
        durationMinutes: 1,
        expectedArrivalTime: new Date(Date.now() + 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        customArrivalMessage: 'Made it safe to my room! Love you.'
      });
      setActiveJourney(current);
    }
    return current;
  };

  // State Jump Triggers
  const handleJumpToExpiry = () => {
    const journey = ensureDemoJourney();
    journey.targetTimestamp = Date.now();
    saveActiveCheckIn(journey);
    setActiveJourney({ ...journey });
    addLogEvent('Demo Action: Jumped countdown to 00:00 (Check-In Due)', 'system');
  };

  const handleTriggerOption1 = () => {
    ensureDemoJourney();
    handleCheckInOption1_RunningLate(15, userName);
    setActiveJourney(getActiveCheckIn());
  };

  const handleTriggerOption2 = () => {
    ensureDemoJourney();
    handleCheckInOption2_LowSignal(userName);
    setActiveJourney(getActiveCheckIn());
  };

  const handleTriggerOption3 = () => {
    ensureDemoJourney();
    handleCheckInOption3_NeedHelpNow(userName);
    setActiveJourney(getActiveCheckIn());
    if (onTriggerSOS) onTriggerSOS();
  };

  const handleTriggerTier = (tier: number) => {
    ensureDemoJourney();
    handleUnresponsiveEscalation(tier, userName);
    setActiveJourney(getActiveCheckIn());
  };

  const handleTriggerSafeArrival = () => {
    ensureDemoJourney();
    confirmArrivedSafely(userName);
    setActiveJourney(getActiveCheckIn());
  };

  const handleReset = () => {
    clearActiveCheckIn();
    setActiveJourney(null);
    addLogEvent('Demo Action: Active check-in journey reset', 'system');
  };

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.channel.toUpperCase()}] ${l.event}${l.details ? ` -> "${l.details}"` : ''}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  return (
    <>
      {/* Discreet Trigger Button (Floating in bottom-right) */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-900 text-amber-300 hover:text-amber-200 border border-amber-400/40 shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 text-xs font-bold"
          title="Open Developer & Judge Demo Simulator Panel"
        >
          <FlaskConical className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline">Demo Simulator</span>
          {isOffline && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Simulating Offline" />
          )}
        </button>
      </div>

      {/* Expandable Demo Simulator Modal Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border-2 border-amber-500/30 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
            >
              {/* Panel Header */}
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>Saahat Demo Simulator</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900 text-purple-200 border border-purple-700 font-mono">
                        Judges & Testing Tool
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Instantly test check-in states, speed-up time, simulate offline SMS, and inspect chronological logs.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Panel Scrollable Content */}
              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                
                {/* 1. Time-Speed Acceleration Controls */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <FastForward className="w-4 h-4 text-amber-400" />
                      <span>Countdown Time Speed Acceleration</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      {simSpeed === 60 ? '⚡ 60x (1 min = 1 sec)' : simSpeed === 10 ? '10x Speed' : '1x Real-Time'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetSpeed(1)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        simSpeed === 1 
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md' 
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      1x (Real Time)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetSpeed(10)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        simSpeed === 10 
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md' 
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      10x Speed
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetSpeed(60)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        simSpeed === 60 
                          ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md shadow-amber-500/20' 
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                      title="1 minute of journey elapsed every 1 second"
                    >
                      ⚡ 60x (1 min = 1s)
                    </button>
                  </div>
                </div>

                {/* 2. Online / Offline Connectivity Simulation Toggle */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {isOffline ? (
                        <WifiOff className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Wifi className="w-4 h-4 text-emerald-400" />
                      )}
                      <span className="text-xs font-bold text-white">
                        Connectivity: {isOffline ? 'Simulating OFFLINE' : 'ONLINE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {isOffline 
                        ? 'All dispatches automatically fire native SMS (`sms:`) intents.'
                        : 'Dispatches trigger WhatsApp deep link (`wa.me`) primary.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleOffline}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 shadow-sm ${
                      isOffline
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                    }`}
                  >
                    <span>{isOffline ? 'Switch to Online' : 'Simulate Offline Mode'}</span>
                  </button>
                </div>

                {/* 3. Direct State Jump Buttons */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Direct Check-In State Jump Shortcuts</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Current Status: <strong className="text-amber-300">{activeJourney?.checkinStatus || 'No Journey'}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={handleJumpToExpiry}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-400/40 text-amber-300 text-xs font-bold text-left transition-all"
                    >
                      <Clock className="w-3.5 h-3.5 mb-1 text-amber-400" />
                      <div>Hit 00:00 Now</div>
                      <span className="text-[9px] text-slate-400 font-normal">Triggers Prompt</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTriggerOption1}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/40 text-purple-300 text-xs font-bold text-left transition-all"
                    >
                      <FastForward className="w-3.5 h-3.5 mb-1 text-purple-400" />
                      <div>Option 1: Late</div>
                      <span className="text-[9px] text-slate-400 font-normal">+15m Reschedule</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTriggerOption2}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-sky-300 text-xs font-bold text-left transition-all"
                    >
                      <BatteryLow className="w-3.5 h-3.5 mb-1 text-sky-400" />
                      <div>Option 2: Low Signal</div>
                      <span className="text-[9px] text-slate-400 font-normal">+45m Backstop</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTriggerOption3}
                      className="p-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/60 text-rose-300 text-xs font-bold text-left transition-all"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mb-1 text-rose-400 animate-bounce" />
                      <div>Option 3: SOS</div>
                      <span className="text-[9px] text-rose-400 font-normal">Help Needed Now</span>
                    </button>
                  </div>

                  {/* Escalation Tiers & Reset */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-bold mr-1">Escalation Tiers:</span>
                      <button
                        type="button"
                        onClick={() => handleTriggerTier(1)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700"
                      >
                        Tier 1 (Nudge)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerTier(2)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-orange-300 border border-slate-700"
                      >
                        Tier 2 (SMS ping)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerTier(3)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700"
                      >
                        Tier 3 (Urgent Alert)
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleTriggerSafeArrival}
                        className="px-3 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                      >
                        ✓ Confirm Arrival
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      >
                        Reset Journey
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Live Chronological Event Log Panel */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-sans">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span>Live Chronological Audit Log ({logs.length} events)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyLogs}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                        title="Copy log to clipboard"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedLog ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={clearLogEvents}
                        className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1"
                        title="Clear log"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {logs.length > 0 ? (
                      logs.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-bold">{item.timestamp}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                item.channel === 'whatsapp'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : item.channel === 'sms'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {item.channel === 'whatsapp' ? '💬 WhatsApp' : item.channel === 'sms' ? '📱 SMS' : '⚙️ System'}
                              </span>
                            </div>
                            {item.recipient && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                                To: {item.recipient}
                              </span>
                            )}
                          </div>
                          <div className="text-white text-[11px] font-medium leading-relaxed font-sans">
                            {item.event}
                          </div>
                          {item.details && (
                            <div className="text-[10px] text-slate-400 italic bg-black/40 p-1.5 rounded-lg border border-slate-800 break-words font-sans">
                              "{item.details}"
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500 text-xs italic font-sans">
                        No events logged yet. Trigger a state jump or adjust countdown to see live actions logged here.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Panel Footer */}
              <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
                <span>Saahat Active Check-In Protocol v2</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
