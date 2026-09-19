import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Grid, 
  User, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  MessageCircle, 
  ChevronRight, 
  ChevronLeft,
  Wifi,
  BatteryCharging,
  X,
  Radio,
  Volume1
} from 'lucide-react';
import { ringtoneAudio } from '../utils/ringtoneAudio';

export interface RingMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCallerName?: string;
}

// Conversation prompts simulating a caring mother checking in
interface PromptItem {
  id: number;
  question: string;
  suggestedResponse: string;
}

const CONVERSATION_PROMPTS: PromptItem[] = [
  {
    id: 1,
    question: "Where are you right now, beta?",
    suggestedResponse: "Say: \"I'm just walking down the main avenue near the market, almost there!\""
  },
  {
    id: 2,
    question: "I'm waiting for you at home.",
    suggestedResponse: "Say: \"Yes, I can see the building gate now, see you in 3 minutes!\""
  },
  {
    id: 3,
    question: "How long will you take to reach?",
    suggestedResponse: "Say: \"About 5 to 10 minutes, traffic was light. Walking briskly!\""
  },
  {
    id: 4,
    question: "Did you take a cab or are you walking?",
    suggestedResponse: "Say: \"I'm walking along the brightly lit street, lots of people around.\""
  },
  {
    id: 5,
    question: "Call me immediately when you step inside.",
    suggestedResponse: "Say: \"Will do mom, I'll ring the doorbell as soon as I arrive.\""
  },
  {
    id: 6,
    question: "Stay on the line with me until you're inside.",
    suggestedResponse: "Say: \"Okay, I'm staying right here on call with you, don't hang up!\""
  }
];

export const RingMeModal: React.FC<RingMeModalProps> = ({
  isOpen,
  onClose,
  initialCallerName = "Mom"
}) => {
  // Call stages: 'incoming' | 'active' | 'ended'
  const [callState, setCallState] = useState<'incoming' | 'active' | 'ended'>('incoming');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showKeypad, setShowKeypad] = useState(false);
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
  const [isVoiceAudioEnabled, setIsVoiceAudioEnabled] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('10:42');

  const timerRef = useRef<any>(null);
  const promptIntervalRef = useRef<any>(null);

  // Update real-time clock for phone status bar
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // When modal opens: start in incoming mode and trigger ringtone
  useEffect(() => {
    if (isOpen) {
      setCallState('incoming');
      setElapsedSeconds(0);
      setIsMuted(false);
      setIsSpeakerOn(true);
      setShowKeypad(false);
      setCurrentPromptIdx(0);

      // Start realistic ringtone audio
      ringtoneAudio.start();

      // Safe vibration on supported mobile devices
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([400, 300, 400, 300, 600, 300]);
        } catch {
          // ignore
        }
      }
    } else {
      ringtoneAudio.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (promptIntervalRef.current) clearInterval(promptIntervalRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    return () => {
      ringtoneAudio.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (promptIntervalRef.current) clearInterval(promptIntervalRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  // Active call timer
  useEffect(() => {
    if (callState === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      // Rotate conversation prompt every 10 seconds automatically
      promptIntervalRef.current = setInterval(() => {
        setCurrentPromptIdx(prev => (prev + 1) % CONVERSATION_PROMPTS.length);
      }, 10000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (promptIntervalRef.current) clearInterval(promptIntervalRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (promptIntervalRef.current) clearInterval(promptIntervalRef.current);
    };
  }, [callState]);

  // Optional: Read prompt aloud via Web Speech API when active & enabled
  const speakCurrentPrompt = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.1; // Gentle, maternal tone
      utterance.volume = isSpeakerOn ? 0.75 : 0.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAcceptCall = () => {
    ringtoneAudio.stop();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(80);
      } catch {
        // ignore
      }
    }
    setCallState('active');
  };

  const handleDeclineOrEndCall = () => {
    ringtoneAudio.stop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallState('ended');
    setTimeout(() => {
      onClose();
      setCallState('incoming');
    }, 600);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="ring-me-overlay"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4 select-none"
      >
        {/* Smartphone Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative w-full h-full sm:h-[820px] sm:max-w-[410px] sm:rounded-[44px] bg-slate-950 text-white flex flex-col justify-between overflow-hidden sm:shadow-[0_25px_70px_rgba(0,0,0,0.85)] sm:border-[8px] sm:border-slate-800"
        >
          {/* Subtle Ambient Background Lighting */}
          <div className="absolute inset-0 pointer-events-none opacity-25">
            <div className="absolute -top-24 -left-20 w-72 h-72 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full blur-3xl animate-pulse duration-3000" />
            <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-gradient-to-tr from-purple-800 to-emerald-600 rounded-full blur-3xl animate-pulse duration-4000" />
          </div>

          {/* Internal Simulated Badge */}
          <div className="relative z-20 pt-2 px-4 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-indigo-300 text-[10px] font-bold">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              <span>Simulated Call • Ring Me</span>
            </div>

            <button
              onClick={handleDeclineOrEndCall}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              title="Close and exit Ring Me"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Realistic Phone Status Bar */}
          <div className="relative z-20 px-7 pt-2 flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>{currentTimeStr}</span>
            {/* Dynamic Island / Speaker Pill */}
            <div className="hidden sm:block w-24 h-4 bg-black rounded-full border border-slate-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold">5G</span>
              <Wifi className="w-3.5 h-3.5 text-slate-300" />
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* ======================================================== */}
          {/* STAGE 1: INCOMING CALL SCREEN */}
          {/* ======================================================== */}
          {callState === 'incoming' && (
            <div className="relative z-20 flex-1 flex flex-col items-center justify-between px-6 py-6 sm:py-8">
              {/* Caller Identity */}
              <div className="text-center space-y-3 pt-6">
                {/* Visual Ringing / Vibration Ripple Avatar */}
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                  {/* Expanding Ripple Rings */}
                  <motion.div
                    animate={{ scale: [1, 1.45, 1.8], opacity: [0.6, 0.3, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-pink-500/30 border border-pink-500/40 pointer-events-none"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.25, 1.5], opacity: [0.7, 0.4, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2, delay: 0.4, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-purple-500/30 border border-purple-500/40 pointer-events-none"
                  />

                  {/* Shaking vibration avatar */}
                  <motion.div
                    animate={{ rotate: [-2, 2, -2, 2, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, repeatDelay: 1.8 }}
                    className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-pink-500 via-purple-500 to-amber-300 shadow-2xl overflow-hidden"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80" 
                      alt="Mom avatar" 
                      className="w-full h-full rounded-full object-cover bg-slate-800"
                    />
                  </motion.div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                    {initialCallerName}
                  </h2>
                  <p className="text-sm font-medium text-pink-300/90 tracking-wide">
                    +91 98765 43210 • Mobile
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-slate-200 mt-1 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Incoming Call...</span>
                  </div>
                </div>
              </div>

              {/* Discreet Tip for Lone Walker */}
              <div className="text-center px-4 py-3 rounded-2xl bg-white/5 border border-white/10 max-w-xs text-[11px] text-slate-300">
                <p className="font-semibold text-amber-300 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Discomfort Exit Tool
                </p>
                <span className="text-slate-400 text-[10px] block mt-0.5">
                  Accept the call and pretend to converse. Realistic conversation prompts will guide what to say.
                </span>
              </div>

              {/* Large Accept & Decline Action Buttons */}
              <div className="w-full max-w-xs pb-4">
                <div className="flex items-center justify-around gap-6">
                  {/* Decline Button */}
                  <div className="flex flex-col items-center gap-2">
                    <motion.button
                      id="fake-call-decline-button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={handleDeclineOrEndCall}
                      className="w-18 h-18 sm:w-20 sm:h-20 w-[72px] h-[72px] rounded-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white flex items-center justify-center shadow-2xl shadow-rose-600/60 border-2 border-rose-400/40 transition-colors"
                      title="Decline Call"
                    >
                      <PhoneOff className="w-8 h-8 rotate-[135deg]" />
                    </motion.button>
                    <span className="text-xs font-bold text-slate-300 tracking-wide">Decline</span>
                  </div>

                  {/* Accept Button */}
                  <div className="flex flex-col items-center gap-2">
                    <motion.button
                      id="fake-call-accept-button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.92 }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      onClick={handleAcceptCall}
                      className="w-18 h-18 sm:w-20 sm:h-20 w-[72px] h-[72px] rounded-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/70 border-2 border-emerald-300/50 transition-colors"
                      title="Accept Call"
                    >
                      <Phone className="w-8 h-8 fill-current" />
                    </motion.button>
                    <span className="text-xs font-bold text-emerald-400 tracking-wide">Accept</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STAGE 2: ACTIVE CALL SCREEN */}
          {/* ======================================================== */}
          {callState === 'active' && (
            <div className="relative z-20 flex-1 flex flex-col justify-between px-6 py-4 overflow-y-auto">
              {/* Active Call Header */}
              <div className="text-center space-y-1.5 pt-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {initialCallerName}
                </h3>
                {/* Running Timer */}
                <div className="flex items-center justify-center gap-2 text-sm font-mono font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{formatTimer(elapsedSeconds)}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Call in progress • Simulated
                </p>

                {/* Animated Audio Waveform Visualizer */}
                <div className="py-2.5 flex items-center justify-center gap-1">
                  {[32, 54, 24, 68, 45, 80, 50, 70, 38, 62, 28, 48, 75, 42].map((height, i) => (
                    <motion.span
                      key={i}
                      animate={{ height: [height * 0.35, height, height * 0.35] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.85 + (i % 4) * 0.2,
                        ease: "easeInOut",
                        delay: i * 0.06
                      }}
                      className="w-1 rounded-full bg-gradient-to-t from-pink-500 to-purple-400 opacity-90 inline-block"
                      style={{ minHeight: '6px', maxHeight: '38px' }}
                    />
                  ))}
                </div>
              </div>

              {/* Natural Conversation Prompts (Card for Acting/Speaking Naturally) */}
              <div className="my-2 bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/15 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-pink-300 uppercase tracking-wider">
                    <MessageCircle className="w-3.5 h-3.5 text-pink-400" />
                    <span>What Mom is saying right now:</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Speak question toggle */}
                    <button
                      onClick={() => speakCurrentPrompt(CONVERSATION_PROMPTS[currentPromptIdx].question)}
                      className="p-1 rounded-full text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
                      title="Listen to Mom ask this question"
                    >
                      <Volume1 className="w-3.5 h-3.5" />
                    </button>

                    {/* Next prompt navigation */}
                    <button
                      onClick={() => setCurrentPromptIdx(prev => (prev + 1) % CONVERSATION_PROMPTS.length)}
                      className="text-[10px] font-bold text-pink-400 hover:text-pink-300 flex items-center pl-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* The Prompt Question */}
                <div className="bg-black/40 rounded-2xl p-3 border border-white/5 space-y-1.5">
                  <p className="text-base sm:text-lg font-bold text-amber-200 italic leading-snug">
                    "{CONVERSATION_PROMPTS[currentPromptIdx].question}"
                  </p>
                  <p className="text-xs text-slate-300 font-medium">
                    {CONVERSATION_PROMPTS[currentPromptIdx].suggestedResponse}
                  </p>
                </div>

                {/* Prompt Pagination Dots */}
                <div className="flex items-center justify-center gap-1.5 pt-0.5">
                  {CONVERSATION_PROMPTS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPromptIdx(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentPromptIdx ? 'w-5 bg-pink-400' : 'w-1.5 bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Optional Simulated Keypad Overlay */}
              <AnimatePresence>
                {showKeypad && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="grid grid-cols-3 gap-2.5 my-2 p-3 bg-black/70 rounded-2xl border border-white/10"
                  >
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
                      <button
                        key={k}
                        className="h-10 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-sm flex items-center justify-center transition-colors"
                      >
                        {k}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Standard Smartphone Call Controls Grid */}
              <div className="grid grid-cols-3 gap-y-4 gap-x-2 py-2 max-w-[280px] mx-auto w-full">
                {/* Mute Control */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isMuted 
                        ? 'bg-white text-slate-950 shadow-lg' 
                        : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <span className="text-[11px] font-medium text-slate-300">
                    {isMuted ? "Unmute" : "Mute"}
                  </span>
                </div>

                {/* Keypad Toggle */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setShowKeypad(!showKeypad)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      showKeypad 
                        ? 'bg-white text-slate-950 shadow-lg' 
                        : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    <Grid className="w-6 h-6" />
                  </button>
                  <span className="text-[11px] font-medium text-slate-300">Keypad</span>
                </div>

                {/* Speaker Toggle */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isSpeakerOn 
                        ? 'bg-white text-slate-950 shadow-lg' 
                        : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                  </button>
                  <span className="text-[11px] font-medium text-slate-300">
                    {isSpeakerOn ? "Speaker" : "Handset"}
                  </span>
                </div>
              </div>

              {/* End Call Button */}
              <div className="flex flex-col items-center justify-center pt-2 pb-2">
                <motion.button
                  id="fake-call-end-button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleDeclineOrEndCall}
                  className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white flex items-center justify-center shadow-2xl shadow-rose-600/70 border-2 border-rose-400/40 transition-colors"
                  title="End Call"
                >
                  <PhoneOff className="w-8 h-8 fill-current" />
                </motion.button>
                <span className="text-xs font-bold text-slate-300 mt-2">End Call</span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STAGE 3: CALL ENDED */}
          {/* ======================================================== */}
          {callState === 'ended' && (
            <div className="relative z-20 flex-1 flex flex-col items-center justify-center space-y-4 px-6">
              <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                <PhoneOff className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">Call Ended</h3>
              <p className="text-xs text-slate-400 font-mono">
                Duration: {formatTimer(elapsedSeconds)}
              </p>
            </div>
          )}

          {/* Bottom Home Indicator Bar */}
          <div className="relative z-20 pb-3 flex justify-center">
            <div className="w-32 h-1 bg-white/40 rounded-full" />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const FakeCallModal = RingMeModal;
export default RingMeModal;
