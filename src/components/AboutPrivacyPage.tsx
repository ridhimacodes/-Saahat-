import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Eye, Lock, Sparkles, HeartHandshake, Database, CheckCircle2, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface AboutPrivacyPageProps {
  onNavigateSearch: () => void;
  onBack?: () => void;
  isLowSignalGlobal?: boolean;
}

export const AboutPrivacyPage: React.FC<AboutPrivacyPageProps> = ({
  onNavigateSearch,
  onBack,
  isLowSignalGlobal = false
}) => {
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
