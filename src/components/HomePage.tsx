import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ShieldCheck, HeartHandshake, ArrowRight, Camera, Upload, Lock, Sparkles, Clock, Calendar, Sun, Moon, Sunset, ChevronDown, EyeOff, Shield, FileCheck, ChevronRight, PhoneCall } from 'lucide-react';
import { UserProfile, TimeOfDay } from '../types';
import { PRESET_AVATARS } from '../data/mockData';

interface HomePageProps {
  onNavigateToSearch: () => void;
  onNavigateToAbout: () => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  isLowSignalGlobal: boolean;
  timeOfDay: TimeOfDay;
  setTimeOfDay: (time: TimeOfDay) => void;
  onTriggerRingMe?: () => void;
  onTriggerFakeCall?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToSearch,
  onNavigateToAbout,
  userProfile,
  setUserProfile,
  isLowSignalGlobal,
  timeOfDay,
  setTimeOfDay,
  onTriggerRingMe,
  onTriggerFakeCall
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Time & Day Clock State
  const [now, setNow] = useState(new Date());
  const [departureMode, setDepartureMode] = useState<'now' | 'custom'>('now');
  const [customDate, setCustomDate] = useState('2026-09-11');
  const [customTime, setCustomTime] = useState('20:30');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUserProfile(prev => ({
            ...prev,
            avatarUrl: event.target?.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (url: string) => {
    setUserProfile(prev => ({
      ...prev,
      avatarUrl: url
    }));
  };

  const getLiveTimeOfDay = (): TimeOfDay => {
    const hour = now.getHours();
    if (hour >= 6 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'evening';
    if (hour >= 20 && hour < 23) return 'night';
    return 'lateNight';
  };

  useEffect(() => {
    if (departureMode === 'now') {
      setTimeOfDay(getLiveTimeOfDay());
    }
  }, [now, departureMode]);

  return (
    <div className={`space-y-16 sm:space-y-24 pb-20 ${isLowSignalGlobal ? 'bg-slate-950 text-slate-100' : ''}`}>
      
      {/* Full-Width Redesigned Hero Section with Uploaded Image */}
      <section className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] flex items-center overflow-hidden bg-[#230B15]">
        
        {/* Real Image Background (Woman walking confidently framed clearly on the right) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-0 flex items-center justify-end"
        >
          <img
            src="/hero.jpg"
            alt="Young Indian woman walking confidently in illuminated city street at dusk"
            className="w-full h-full object-cover object-[68%_15%] sm:object-[65%_center] lg:object-[62%_center] filter brightness-100"
          />

          {/* Dark Maroon/Charcoal Gradient Overlay (Covers Left Side for Text Readability, Fades Out Completely to Expose Her Picture on Right) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#230B15] via-[#230B15]/80 via-40% to-transparent w-[92%] sm:w-[55%] lg:w-[48%] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#230B15]/90 via-transparent to-black/20 pointer-events-none" />
        </motion.div>

        {/* Hero Foreground Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-white">
          <div className="max-w-2xl space-y-6">
            
            {/* ENLARGED TAGLINE (+30px Font Size: text-2xl sm:text-4xl ~42px) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="inline-block"
            >
              <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl inline-flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow flex-shrink-0" />
                <span className="font-extrabold text-base sm:text-xl lg:text-2xl tracking-wider text-amber-300 uppercase drop-shadow-md">
                  YOUR JOURNEY. YOUR CHOICE. YOUR CONFIDENCE.
                </span>
              </div>
            </motion.div>

            {/* Premium Editorial Serif Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-lg"
            >
              Go beyond the <br />
              <span className="italic bg-gradient-to-r from-amber-200 via-pink-200 to-white bg-clip-text text-transparent">
                fastest route.
              </span>
            </motion.h1>

            {/* Subtext Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="text-base sm:text-xl text-purple-100 font-medium leading-relaxed max-w-xl drop-shadow-sm"
            >
              Saahat helps you choose a journey that fits the moment — with clearer options, useful journey signals, and support when you need it.
            </motion.p>

            {/* LIVE TIME & DAY OPTION WIDGET */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white/20 space-y-3 max-w-xl shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Departure Timing Filter</span>
                </div>

                {/* Departure Mode Radio Selector */}
                <div className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-white/10">
                  <button
                    type="button"
                    onClick={() => { setDepartureMode('now'); setTimeOfDay(getLiveTimeOfDay()); }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      departureMode === 'now'
                        ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Leaving Now (Live)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDepartureMode('custom')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      departureMode === 'custom'
                        ? 'bg-brand-pink text-white shadow-md scale-105'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Schedule Other Time
                  </button>
                </div>
              </div>

              {departureMode === 'now' ? (
                /* Live Clock Display */
                <div className="flex items-center justify-between bg-black/30 p-3 rounded-2xl border border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-white text-sm">{formattedDate}</span>
                    <span className="text-purple-200">at</span>
                    <span className="font-extrabold text-amber-300 text-sm">{formattedTime}</span>
                  </div>
                </div>
              ) : (
                /* Custom Time & Day Input Picker */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-purple-200 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-pink-300" />
                      Select Day:
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-purple-400 text-white text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-purple-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      Select Time:
                    </label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => {
                        setCustomTime(e.target.value);
                        const hour = parseInt(e.target.value.split(':')[0]);
                        if (hour >= 6 && hour < 17) setTimeOfDay('day');
                        else if (hour >= 17 && hour < 20) setTimeOfDay('evening');
                        else if (hour >= 20 && hour < 23) setTimeOfDay('night');
                        else setTimeOfDay('lateNight');
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-purple-400 text-white text-xs font-bold"
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Side-by-Side Dual CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
            >
              {/* Primary Filled Button */}
              <button
                onClick={onNavigateToSearch}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#FF4D8D] to-[#8B5CF6] text-white font-bold text-lg shadow-2xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <Compass className="w-6 h-6 text-amber-200 group-hover:rotate-45 transition-transform duration-300" />
                <span>Plan My Journey</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Secondary Ghost Button */}
              <button
                onClick={onNavigateToAbout}
                className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-base border border-white/30 backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Explore Saahat</span>
              </button>
            </motion.div>

          </div>
        </div>

      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className={`text-2xl sm:text-3xl font-bold ${isLowSignalGlobal ? 'text-white' : 'text-slate-900'}`}>
            Why Women Choose <span className="text-brand-purple">Saahat</span>
          </h2>
          <p className={`text-sm sm:text-base mt-2 ${isLowSignalGlobal ? 'text-slate-400 font-mono' : 'text-slate-500'}`}>
            Contextual environmental signals without surveillance or fear tactics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Card 1: Compass / Map */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className={`p-8 rounded-3xl border transition-all duration-300 group hover:scale-105 ${
              isLowSignalGlobal 
                ? 'bg-slate-900 border-slate-800 text-white shadow-lg' 
                : 'bg-white border-purple-100 shadow-xl shadow-purple-900/5 hover:shadow-2xl'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-brand-purple mb-6 animate-float-slow group-hover:scale-110 transition-transform">
              <Compass className="w-9 h-9 text-brand-purple" />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isLowSignalGlobal ? 'text-amber-300' : 'text-slate-900'}`}>
              Real conditions, not just distance
            </h3>
            <p className={`text-sm leading-relaxed ${isLowSignalGlobal ? 'text-slate-300' : 'text-slate-600'}`}>
              We evaluate continuous street lighting, active shopfronts, transit hubs, and footfall density by time of day.
            </p>
          </motion.div>

          {/* Card 2: Lock / Shield */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.30 }}
            className={`p-8 rounded-3xl border transition-all duration-300 group hover:scale-105 ${
              isLowSignalGlobal 
                ? 'bg-slate-900 border-slate-800 text-white shadow-lg' 
                : 'bg-white border-purple-100 shadow-xl shadow-purple-900/5 hover:shadow-2xl'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-pink-100 flex items-center justify-center text-brand-pink mb-6 animate-float-medium group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-9 h-9 text-brand-pink" />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isLowSignalGlobal ? 'text-amber-300' : 'text-slate-900'}`}>
              No live tracking, ever
            </h3>
            <p className={`text-sm leading-relaxed ${isLowSignalGlobal ? 'text-slate-300' : 'text-slate-600'}`}>
              Zero continuous location logs. Search routes privately. When you share ETAs, it is a single one-time update.
            </p>
          </motion.div>

          {/* Card 3: Heart / People */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className={`p-8 rounded-3xl border transition-all duration-300 group hover:scale-105 ${
              isLowSignalGlobal 
                ? 'bg-slate-900 border-slate-800 text-white shadow-lg' 
                : 'bg-white border-purple-100 shadow-xl shadow-purple-900/5 hover:shadow-2xl'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center text-brand-teal mb-6 animate-float-slow group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-9 h-9 text-brand-teal" />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isLowSignalGlobal ? 'text-amber-300' : 'text-slate-900'}`}>
              We describe, we never judge an area
            </h3>
            <p className={`text-sm leading-relaxed ${isLowSignalGlobal ? 'text-slate-300' : 'text-slate-600'}`}>
              No fear-mongering or area stigma. Objective indicators help you pick the path that feels right for you.
            </p>
          </motion.div>

        </div>

        {/* Dedicated Quick Action: Ring Me Feature Spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className={`mt-8 p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
            isLowSignalGlobal
              ? 'bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border-slate-700 text-white'
              : 'bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 border-purple-800/40 text-white'
          }`}
        >
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                <span>Quick Comfort Tool</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Everyday Quick Action: <span className="bg-gradient-to-r from-indigo-300 via-purple-200 to-amber-200 bg-clip-text text-transparent">Ring Me</span>
              </h3>

              <p className="text-sm text-purple-200/90 max-w-xl leading-relaxed">
                Need a believable excuse to step away from an awkward conversation or feel more connected when walking alone? Trigger an immediate simulated call from <strong>Mom</strong> with a realistic ringtone, smartphone interface, and natural conversation cues.
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-[11px] text-slate-300">
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 font-semibold">📞 Caller: Mom</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 font-semibold">💬 Conversation Prompts</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 font-semibold">🔒 100% Simulated & Private</span>
              </div>
            </div>

            {/* Launch Ring Me Button */}
            <div className="flex-shrink-0">
              <motion.button
                id="home-trigger-ring-me"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const fn = onTriggerRingMe || onTriggerFakeCall;
                  if (fn) fn();
                }}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-800 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-600/60 border-2 border-white/20 flex items-center gap-3 transition-all duration-300 group"
                title="Ring Me"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PhoneCall className="w-5 h-5 text-indigo-200" />
                </div>
                <div className="text-left">
                  <span className="block text-xs uppercase font-black tracking-wider text-indigo-200">Discreet Comfort</span>
                  <span className="block text-base font-bold text-white">Ring Me</span>
                </div>
                <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform text-indigo-200" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Profile Picture Personalization Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`rounded-3xl p-6 sm:p-10 border shadow-xl relative overflow-hidden ${
          isLowSignalGlobal ? 'bg-slate-900 border-slate-800 text-white' : 'bg-gradient-to-br from-white via-purple-50/50 to-pink-50/40 border-purple-100'
        }`}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-[#6C2BD9] via-[#FF4D8D] to-amber-300 shadow-lg">
                <img
                  src={userProfile.avatarUrl}
                  alt="Profile Avatar"
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 bg-brand-pink text-white p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                title="Upload custom photo"
              >
                <Camera className="w-5 h-5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-purple bg-purple-100 px-3 py-1 rounded-full">
                  Personalize Your Profile
                </span>
                <h3 className={`text-2xl font-bold mt-2 ${isLowSignalGlobal ? 'text-white' : 'text-slate-900'}`}>
                  Choose or Upload Your Avatar
                </h3>
                <p className={`text-sm mt-1.5 ${isLowSignalGlobal ? 'text-slate-400' : 'text-slate-600'}`}>
                  Your avatar is stored locally in your browser to personalize your navigation dashboard and route sharing cards — strictly private with zero server uploads.
                </p>
              </div>

              {/* Animated Flat Illustration Avatar Presets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-slate-400 block">Flat Illustration Presets:</span>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  {PRESET_AVATARS.map((url, idx) => {
                    const isSelected = userProfile.avatarUrl === url;
                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleSelectPreset(url)}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all duration-300 relative ${
                          isSelected
                            ? 'border-brand-purple ring-4 ring-purple-400/50 shadow-lg shadow-purple-500/30 scale-105'
                            : 'border-white/80 opacity-80 hover:opacity-100 shadow-sm'
                        }`}
                        title={`Preset Avatar ${idx + 1}`}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover bg-white" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 hover:scale-105 transition-all flex items-center gap-2 shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </button>

                {/* Skip for now text link */}
                <button
                  type="button"
                  onClick={onNavigateToSearch}
                  className={`text-xs font-semibold transition-colors underline underline-offset-4 ${
                    isLowSignalGlobal ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-purple-600'
                  }`}
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Privacy Pledge Banner */}
      <footer className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Subtle slow shimmer background dot pattern */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#FF4D8D_1px,transparent_1px)] [background-size:16px_16px] animate-pulse duration-[5000ms]" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-4 text-center md:text-left">
              {/* Clickable Heading linking to About & Privacy */}
              <button
                onClick={onNavigateToAbout}
                className="group flex items-center justify-center md:justify-start gap-2 hover:opacity-90 transition-opacity text-left focus:outline-none"
              >
                <Lock className="w-5 h-5 text-teal-300" />
                <span className="font-bold text-lg text-white group-hover:underline">Saahat Privacy Pledge</span>
                <ChevronRight className="w-4 h-4 text-teal-300 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className="text-purple-200 text-sm max-w-xl">
                We never store your search origins, destinations, or real-time location. Saahat provides objective environmental data so you navigate with total independence.
              </p>

              {/* Three Trust Indicator Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-medium text-purple-100 shadow-sm">
                  <EyeOff className="w-3.5 h-3.5 text-teal-300" />
                  <span>Zero Location Logs</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-medium text-purple-100 shadow-sm">
                  <Shield className="w-3.5 h-3.5 text-amber-300" />
                  <span>Private Search</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-medium text-purple-100 shadow-sm">
                  <FileCheck className="w-3.5 h-3.5 text-pink-300" />
                  <span>Transparent Data Use</span>
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateToSearch}
              className="px-6 py-3 rounded-xl bg-white text-brand-purple font-bold text-sm hover:bg-purple-50 hover:scale-105 transition-all shadow-lg flex items-center gap-2 shrink-0"
            >
              <span>Search Routes Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

