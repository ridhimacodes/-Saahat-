import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  WifiOff, 
  BatteryLow, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Check, 
  Shield, 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle2,
  HardDrive,
  Download,
  Trash2,
  Eye,
  Clock,
  Compass,
  Volume1,
  Mic
} from 'lucide-react';
import { RouteOption } from '../types';
import { OFFLINE_HELP_POINTS } from '../data/mockData';
import { InteractiveMap } from './InteractiveMap';
import { 
  getSavedJourneysLocally, 
  deleteSavedJourneyLocally, 
  SavedJourney,
  saveJourneyLocally
} from '../utils/offlineStorage';

interface LowSignalPageProps {
  selectedRoute: RouteOption;
  onExitLowSignal: () => void;
  onBack?: () => void;
  origin?: string;
  destination?: string;
}

export const LowSignalPage: React.FC<LowSignalPageProps> = ({
  selectedRoute,
  onExitLowSignal,
  onBack,
  origin = 'IGDTUW Campus, Kashmiri Gate, Delhi',
  destination = 'India Gate, New Delhi'
}) => {
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'sentOk' | 'sentHelp'>('idle');
  const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>([]);
  const [activeJourneyId, setActiveJourneyId] = useState<string>(selectedRoute.id);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    let journeys = getSavedJourneysLocally();
    // If no journeys saved in localStorage, automatically save current route as default offline journey
    if (journeys.length === 0) {
      const defaultSaved = saveJourneyLocally(origin, destination, selectedRoute);
      journeys = [defaultSaved];
    }
    setSavedJourneys(journeys);
    if (!journeys.some(j => j.id === activeJourneyId)) {
      setActiveJourneyId(journeys[0]?.id || selectedRoute.id);
    }
  }, [selectedRoute, origin, destination]);

  const activeJourney = savedJourneys.find(j => j.id === activeJourneyId);
  const currentRoute = activeJourney ? activeJourney.route : selectedRoute;

  const steps = activeJourney?.instructions || currentRoute.offlineSteps || [
    `Exit ${origin.split(',')[0]} main gate → Walk straight along ${currentRoute.via}`,
    'Pass 24/7 Pharmacy & Bakery on right (illuminated sidewalk)',
    'Continue straight for 400m through active commercial stretch',
    `Arrive safely at ${destination.split(',')[0]}`
  ];

  const helpPoints = activeJourney?.helpPoints || OFFLINE_HELP_POINTS.map(hp => ({
    name: hp.name,
    type: hp.type,
    phone: hp.phone,
    distance: hp.distance
  }));

  const handleSendCheckIn = (type: 'ok' | 'help') => {
    setCheckInStatus(type === 'ok' ? 'sentOk' : 'sentHelp');
    setTimeout(() => {
      setCheckInStatus('idle');
    }, 4000);
  };

  const handleDeleteSavedRoute = (id: string) => {
    deleteSavedJourneyLocally(id);
    const updated = savedJourneys.filter(j => j.id !== id);
    setSavedJourneys(updated);
    if (updated.length > 0) {
      setActiveJourneyId(updated[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-amber-400 selection:text-slate-950">
      
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Low Battery / Signal Status Header */}
        <div className="bg-slate-900 border-2 border-amber-400/40 rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">
              <BatteryLow className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-amber-400 text-lg uppercase tracking-wider">
                  Low Signal & Battery Mode
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Offline Map Active</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Minimal AMOLED battery saver • High contrast vector corridor cached
              </p>
            </div>
          </div>

          <button
            onClick={onBack || onExitLowSignal}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Previous Page</span>
          </button>
        </div>

        {/* SECTION: VIEW DOWNLOADED ROUTES SELECTOR */}
        {savedJourneys.length > 0 && (
          <div className="bg-slate-900/90 border border-amber-400/30 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-base font-extrabold text-white">
                    View Downloaded Routes ({savedJourneys.length} Saved)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Locally stored map corridors & directions — zero internet required
                  </p>
                </div>
              </div>

              {activeJourney && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                    Route saved for offline use ✓ ({activeJourney.storageSizeMb})
                  </span>
                </div>
              )}
            </div>

            {/* Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
              {savedJourneys.map((j) => {
                const isActive = j.id === activeJourneyId;
                return (
                  <button
                    key={j.id}
                    onClick={() => setActiveJourneyId(j.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 border flex items-center gap-2 ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-[1.02]'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span>{j.route.name.split('—')[0]}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-slate-950/20 text-slate-900 font-extrabold' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {j.storageSizeMb}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* HIGH CONTRAST OFFLINE MAP CORRIDOR PREVIEW */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Offline Corridor Map Preview</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Vector tile cache active
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
            <InteractiveMap
              routes={[currentRoute]}
              selectedRouteId={currentRoute.id}
              isLowSignalGlobal={true}
            />
          </div>
        </div>

        {/* Offline Step-by-Step Directions Card */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-xl font-black text-white">
                  Cached Directions: {currentRoute.name.split('—')[0]}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {activeJourney?.origin.split(',')[0]} → {activeJourney?.destination.split(',')[0]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  const fullText = `Offline directions for ${currentRoute.name.split('—')[0]}. ${steps.map((st, i) => `Step ${i + 1}: ${st}`).join('. ')}`;
                  speakText(fullText);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Read directions aloud via Voice Assistant"
              >
                <Volume1 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse text-amber-300' : 'text-amber-400'}`} />
                <span>{isSpeaking ? 'Reading Aloud...' : 'Voice Assistant'}</span>
              </button>

              <span className="text-xs font-mono text-amber-400 bg-amber-950 px-3 py-1 rounded-xl border border-amber-800 font-bold">
                {currentRoute.durationMinutes} mins • {currentRoute.distanceKm} km
              </span>

              {activeJourney && savedJourneys.length > 1 && (
                <button
                  onClick={() => handleDeleteSavedRoute(activeJourney.id)}
                  className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-all"
                  title="Remove saved route offline copy"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Large Easy-to-Tap Directions List */}
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div
                key={idx}
                onClick={() => speakText(`Step ${idx + 1}: ${step}`)}
                className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 flex items-start justify-between gap-3.5 shadow-sm cursor-pointer group transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-base sm:text-lg font-extrabold text-slate-100 leading-snug">
                    {step}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakText(`Step ${idx + 1}: ${step}`);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 transition-all shrink-0 mt-0.5"
                  title="Listen to this direction step"
                >
                  <Volume1 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SMS Low Signal Check-In Buttons */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">
              SMS Fallback Check-In
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Quick One-Tap Status Broadcast
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sends an SMS text message to your primary contact without requiring 4G/5G data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleSendCheckIn('ok')}
              className="py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-6 h-6 text-amber-300" />
              <span>I'm OK (Send SMS)</span>
            </button>

            <button
              onClick={() => handleSendCheckIn('help')}
              className="py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <AlertTriangle className="w-6 h-6 text-amber-200" />
              <span>Need Help (Send SMS)</span>
            </button>
          </div>

          {/* SMS Sent Feedback Notice */}
          <AnimatePresence>
            {checkInStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${
                  checkInStatus === 'sentOk'
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                    : 'bg-rose-950 border-rose-600 text-rose-300'
                }`}
              >
                <MessageSquare className="w-5 h-5 shrink-0" />
                <span>
                  {checkInStatus === 'sentOk'
                    ? "SMS sent to Mom (+91 98765 43210): 'I am safe on my route. (Low Signal Check-In)'"
                    : "Emergency SMS sent to Mom (+91 98765 43210): 'Need assistance along Sector 4 Route.'"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[11px] text-slate-500 text-center font-mono">
            ⚡ Works even with poor network or 2G connections.
          </p>
        </div>

        {/* Pre-Saved Offline Help Points */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>Pre-Saved Offline Help Points</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Stored locally for {currentRoute.name.split('—')[0]}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {helpPoints.map((hp, hIdx) => (
              <div
                key={hIdx}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <strong className="text-sm font-bold text-amber-300 block">{hp.name}</strong>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {hp.distance}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{hp.type || 'Help Station'}</p>
                <a
                  href={`tel:${hp.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-700 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Call {hp.phone}</span>
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
