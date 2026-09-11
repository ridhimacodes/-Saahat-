import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, BatteryLow, MapPin, Phone, MessageSquare, Check, Shield, AlertTriangle, ArrowLeft, Sun, CheckCircle2 } from 'lucide-react';
import { RouteOption, OfflineHelpPoint } from '../types';
import { OFFLINE_HELP_POINTS } from '../data/mockData';

interface LowSignalPageProps {
  selectedRoute: RouteOption;
  onExitLowSignal: () => void;
}

export const LowSignalPage: React.FC<LowSignalPageProps> = ({
  selectedRoute,
  onExitLowSignal
}) => {
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'sentOk' | 'sentHelp'>('idle');

  const steps = selectedRoute.offlineSteps || [
    'Exit Metro Station Gate 2 → Walk straight on Main Road (300m)',
    'Pass 24/7 Bakery on right (illuminated sidewalk)',
    'Turn right at bus shelter onto Sector 4 Link Road (400m)',
    'Arrive at Greenwood Apartments Gate 1'
  ];

  const handleSendCheckIn = (type: 'ok' | 'help') => {
    setCheckInStatus(type === 'ok' ? 'sentOk' : 'sentHelp');
    setTimeout(() => {
      setCheckInStatus('idle');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-amber-400 selection:text-slate-950">
      
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Low Battery / Signal Status Header */}
        <div className="bg-slate-900 border-2 border-amber-400/40 rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center">
              <BatteryLow className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-400 text-lg uppercase tracking-wider">
                  Low Signal & Battery Mode
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-400 text-[10px] font-bold">
                  Offline Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Minimal AMOLED battery saver • High contrast directions cached
              </p>
            </div>
          </div>

          <button
            onClick={onExitLowSignal}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Switch to Standard UI</span>
          </button>
        </div>

        {/* Offline Step-by-Step Directions Card */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-black text-white">
                Cached Directions: {selectedRoute.name.split('—')[0]}
              </h2>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-950 px-2.5 py-1 rounded border border-amber-800">
              {selectedRoute.durationMinutes} mins • {selectedRoute.distanceKm} km
            </span>
          </div>

          {/* Large Easy-to-Tap Directions List */}
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3.5"
              >
                <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-base sm:text-lg font-extrabold text-slate-100 leading-snug">
                  {step}
                </p>
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
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                <span>
                  {checkInStatus === 'sentOk'
                    ? "SMS sent to Mom: 'I am safe on my route. (Low Signal Check-In)'"
                    : "Emergency SMS sent to Mom: 'Need assistance along Sector 4 Route.'"}
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
            <span className="text-xs text-slate-400 font-mono">Stored locally</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OFFLINE_HELP_POINTS.map((hp) => (
              <div
                key={hp.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <strong className="text-sm font-bold text-amber-300 block">{hp.name}</strong>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                    {hp.distance}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{hp.address}</p>
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
