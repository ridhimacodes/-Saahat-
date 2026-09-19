import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Eye, Lock, Sparkles, HeartHandshake, Database, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Radio, Trash2, ShieldAlert } from 'lucide-react';
import { TrustedContact } from '../types';
import { deleteUserJourneyHistory, stopAllActiveJourneys } from '../services/supabaseService';
import { clearAllHistory } from '../services/historyService';

interface AboutPrivacyPageProps {
  onNavigateSearch: () => void;
  onBack?: () => void;
  isLowSignalGlobal?: boolean;
  isJourneyActive?: boolean;
  activeContacts?: TrustedContact[];
  onStopLocationSharing?: () => void;
}

export const AboutPrivacyPage: React.FC<AboutPrivacyPageProps> = ({
  onNavigateSearch,
  onBack,
  isLowSignalGlobal = false,
  isJourneyActive = false,
  activeContacts = [],
  onStopLocationSharing
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [sharingStopped, setSharingStopped] = useState(false);

  const handleStopSharing = async () => {
    setSharingStopped(true);
    await stopAllActiveJourneys();
    if (onStopLocationSharing) onStopLocationSharing();
  };

  const handleDeleteHistory = async () => {
    if (!window.confirm("Are you sure you want to delete all saved journey and location search history? This cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    try {
      clearAllHistory();
      await deleteUserJourneyHistory();
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 5000);
    } catch (err) {
      console.warn("Failed to delete history:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16 space-y-12 ${isLowSignalGlobal ? 'text-slate-100' : ''}`}>
      {onBack && (
        <button
          onClick={onBack}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 w-fit ${
            isLowSignalGlobal
              ? 'bg-slate-900 text-amber-300 border-slate-700 hover:bg-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      )}
      
      {/* Header Banner */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold ${
            isLowSignalGlobal ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-purple-100 text-brand-purple'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Our Uncompromising Privacy Promise</span>
        </motion.div>
        <h1 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isLowSignalGlobal ? 'text-white' : 'text-slate-900'}`}>
          Trust & Privacy at the Core
        </h1>
        <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium ${isLowSignalGlobal ? 'text-slate-300' : 'text-slate-600'}`}>
          Saahat is built to empower women with real environmental context while respecting absolute data dignity.
        </p>
      </div>

      {/* Interactive Privacy Centre Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl p-6 sm:p-8 border shadow-xl space-y-6 ${
          isLowSignalGlobal 
            ? 'bg-slate-900 border-slate-700 text-white' 
            : 'bg-white border-purple-100 shadow-purple-500/5 text-slate-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-brand-purple dark:text-purple-300 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl">Saahat Privacy Centre</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage real-time telemetry, location sharing, and your data footprint</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 w-fit">
            Client-Side Encrypted
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tile 1: Active Journey Status */}
          <div className={`p-4 rounded-2xl border ${isLowSignalGlobal ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Journey Status
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isJourneyActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              <strong className="text-sm font-bold">
                {isJourneyActive ? 'Guardian Journey Active' : 'Idle / Inactive'}
              </strong>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {isJourneyActive 
                ? 'Your journey is actively updating ETA and safety markers.' 
                : 'No active transit or GPS session is in progress.'}
            </p>
          </div>

          {/* Tile 2: Live Location Sharing */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between ${isLowSignalGlobal ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                Location Sharing
              </span>
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${(!sharingStopped && isJourneyActive) ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                <strong className="text-sm font-bold">
                  {(!sharingStopped && isJourneyActive) ? 'Live Stream Active' : 'Stream Stopped / Inactive'}
                </strong>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {activeContacts.length > 0
                  ? `Recipients: ${activeContacts.map(c => c.name).join(', ')}`
                  : 'No contacts currently receiving live telemetry.'}
              </p>
            </div>

            {isJourneyActive && !sharingStopped && (
              <button
                onClick={handleStopSharing}
                className="mt-3 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs"
              >
                Stop Sharing Location Now
              </button>
            )}
          </div>

          {/* Tile 3: 1-Click History Purge */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between ${isLowSignalGlobal ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                Data Footprint
              </span>
              <strong className="text-sm font-bold block">1-Click History Purge</strong>
              <p className="text-[11px] text-slate-500 mt-1">
                Instantly clear all local journey searches, ETA records, and cloud journey logs.
              </p>
            </div>

            <button
              onClick={handleDeleteHistory}
              disabled={isDeleting}
              className={`mt-3 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                deleteSuccess
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              {deleteSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>History Deleted!</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Purging...' : 'Delete All Journey History'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Grid: What We Use vs What We NEVER Do */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Column 1: What Data Is Used */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-xl shadow-purple-900/5 space-y-6"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-brand-teal flex items-center justify-center font-bold">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">What Data We Use</h2>
              <p className="text-xs text-slate-500">Public environmental & infrastructure signals</p>
            </div>
          </div>

          <ul className="space-y-4 text-sm text-slate-700">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Public Streetlight Infrastructure</strong>
                <span>Open municipal lighting data and LED installation records along pedestrian paths.</span>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Time-of-Day Footfall & Business Hours</strong>
                <span>Opening schedules for 24/7 pharmacies, open-air markets, and late-night cafes.</span>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Public Transit Schedules</strong>
                <span>Metro entrance concourse lighting and real-time bus shelter location data.</span>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Verified Community Notes</strong>
                <span>Anonymous neighbor updates regarding temporary maintenance or new streetlight upgrades.</span>
              </div>
            </li>
          </ul>
        </motion.div>

        {/* Column 2: What We NEVER Do */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-xl shadow-pink-900/5 space-y-6"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 text-brand-pink flex items-center justify-center font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">What We NEVER Do</h2>
              <p className="text-xs text-slate-500">No surveillance, no area stigma</p>
            </div>
          </div>

          <ul className="space-y-4 text-sm text-slate-700">
            <li className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">No Live GPS Tracking</strong>
                <span>We never continuously log your location or monitor your background movement.</span>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">No Storing Location History</strong>
                <span>Your searched origins and destinations are never saved on remote tracking servers.</span>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">No Labeling Areas as "Dangerous"</strong>
                <span>We strictly avoid subjective fear-mongering or stigmatizing entire neighborhoods.</span>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">No Selling User Data</strong>
                <span>Saahat is independent and free from third-party advertising trackers.</span>
              </div>
            </li>
          </ul>
        </motion.div>

      </div>

      {/* Why This Matters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-tr from-purple-900 via-indigo-900 to-purple-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden space-y-6"
      >
        <div className="flex items-center gap-3">
          <HeartHandshake className="w-8 h-8 text-amber-300" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Why This Matters</h2>
        </div>

        <p className="text-purple-100 text-base leading-relaxed max-w-3xl">
          Women deserve travel companions that provide factual, objective environmental context without inducing anxiety or restricting freedom. By focusing on streetlights, business hours, and transit hubs, Saahat supports your independence and peace of mind on every journey.
        </p>

        <div className="pt-2">
          <button
            onClick={onNavigateSearch}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <span>Try Searching a Route</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

    </div>
  );
};
