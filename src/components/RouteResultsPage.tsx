import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, ChevronDown, ChevronUp, Sun, Bus, Store, Shield, Sparkles, ArrowRight, AlertCircle, Eye, Share2, CheckCircle2, ShieldAlert, ThumbsUp, AlertTriangle, Compass } from 'lucide-react';
import { RouteOption, TimeOfDay } from '../types';
import { InteractiveMap } from './InteractiveMap';

interface RouteResultsPageProps {
  origin: string;
  destination: string;
  routes: RouteOption[];
  selectedRouteId: string;
  setSelectedRouteId: (id: string) => void;
  onSelectAndShare: (route: RouteOption) => void;
  onProceedOnly: (route: RouteOption) => void;
  onBackToSearch: () => void;
  timeOfDay: TimeOfDay;
  setTimeOfDay: (time: TimeOfDay) => void;
  isLowSignalGlobal: boolean;
}

export const RouteResultsPage: React.FC<RouteResultsPageProps> = ({
  origin,
  destination,
  routes,
  selectedRouteId,
  setSelectedRouteId,
  onSelectAndShare,
  onProceedOnly,
  onBackToSearch,
  timeOfDay,
  setTimeOfDay,
  isLowSignalGlobal
}) => {
  const [expandedScoreId, setExpandedScoreId] = useState<string | null>(selectedRouteId);
  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  const toggleExpandScore = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedScoreId(expandedScoreId === id ? null : id);
  };

  const timeBandOptions: { id: TimeOfDay; label: string; icon: React.ReactNode }[] = [
    { id: 'day', label: 'Day (6am-5pm)', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'evening', label: 'Evening (5pm-8pm)', icon: <Sun className="w-3.5 h-3.5 text-orange-400" /> },
    { id: 'night', label: 'Night (8pm-11pm)', icon: <Clock className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'lateNight', label: 'Late Night (11pm-6am)', icon: <Clock className="w-3.5 h-3.5 text-indigo-400" /> }
  ];

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 font-sans ${
      isLowSignalGlobal ? 'text-slate-100' : 'bg-[#F9F4F0]'
    }`}>
      
      {/* Search Parameters & Live Time Scoring Header Bar */}
      <div className="bg-white rounded-3xl p-5 border border-[#E8D8D3] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F2E6E2] flex items-center justify-center text-[#5E253B] shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className="font-bold text-[#3E1627]">{origin.split(',')[0]}</span>
                <span className="text-[#A3526B] font-bold">→</span>
                <span className="font-bold text-[#1E6B45]">{destination.split(',')[0]}</span>
              </div>
              <p className="text-xs font-medium text-[#7E5767] mt-0.5">
                Dynamic Time Scoring Active: <span className="font-bold capitalize text-[#3E1627]">{timeOfDay} conditions</span>
              </p>
            </div>
          </div>

          <button
            onClick={onBackToSearch}
            className="px-5 py-2 rounded-full text-xs font-bold bg-[#F2E6E2] hover:bg-[#E8D8D3] text-[#5E253B] border border-[#E0D0C9] transition-all shadow-xs shrink-0"
          >
            Change Parameters
          </button>
        </div>

        {/* Live Time Band Switcher (Reruns scoring algorithm instantly when clicked) */}
        <div className="pt-2 border-t border-[#F5ECE8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#7E5767]">
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
            <span>Test Dynamic Scoring Model by Time Band:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {timeBandOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTimeOfDay(opt.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  timeOfDay === opt.id
                    ? 'bg-[#3E1627] text-amber-300 border-[#3E1627] shadow-md scale-105'
                    : 'bg-[#F9F4F0] text-[#7E5767] border-[#E0D0C9] hover:bg-white'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Layout: Interactive Map + Route Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Real Map Display */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-[#3E1627] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#A3526B]" />
              <span>Real Route Map Preview ({routes.length} Paths)</span>
            </h2>
            <span className="text-xs text-[#7E5767] font-medium">Click routes to select</span>
          </div>

          <InteractiveMap
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            isLowSignalGlobal={isLowSignalGlobal}
          />

          {/* Context Disclaimer */}
          <div className="p-4 rounded-2xl text-xs bg-white border border-[#E8D8D3] text-[#6E4B59] flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-[#A3526B] flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Context Disclaimer:</strong> HerPath evaluates factual environmental signals (lighting, footfall, transit, open businesses) to give you total control.
            </p>
          </div>
        </div>

        {/* Right Column: Comparative Route Cards */}
        <div className="lg:col-span-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-[#3E1627]">
              Evaluated Options ({routes.length})
            </h2>
            <span className="text-xs font-bold text-[#1E6B45] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Ranked for {timeOfDay}
            </span>
          </div>

          <div className="space-y-4">
            {routes.map((route, idx) => {
              const isSelected = route.id === selectedRouteId;
              const isBestMatch = idx === 0;
              const isExpanded = expandedScoreId === route.id;

              return (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, x: 25 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`rounded-3xl border p-5 sm:p-6 transition-all duration-300 cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? (isBestMatch 
                          ? 'bg-white border-[#1E6B45] ring-2 ring-[#1E6B45]/30 shadow-xl' 
                          : 'bg-white border-[#A3526B] ring-2 ring-[#A3526B]/30 shadow-xl')
                      : 'bg-white/80 border-[#E8D8D3] hover:border-[#A3526B] shadow-sm'
                  }`}
                >
                  {/* Selected Indicator Strip */}
                  {isSelected && (
                    <div 
                      className="absolute top-0 left-0 bottom-0 w-2 shadow-sm"
                      style={{ backgroundColor: route.color || (isBestMatch ? '#1E6B45' : '#A3526B') }}
                    />
                  )}

                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-base sm:text-lg text-[#3E1627]">
                          {route.name}
                        </h3>
                        {isBestMatch && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-xs">
                            BEST MATCH
                          </span>
                        )}
                        {isSelected && (
                          <span 
                            className="px-2.5 py-0.5 rounded-full text-white text-[10px] font-bold shadow-sm"
                            style={{ backgroundColor: route.color || (isBestMatch ? '#1E6B45' : '#A3526B') }}
                          >
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#7E5767]">
                        {route.via}
                      </p>
                    </div>

                    {/* Score Badge */}
                    <div className="text-right flex-shrink-0">
                      <div className={`inline-flex items-baseline gap-1 px-3 py-1 rounded-2xl font-extrabold text-lg ${
                        isBestMatch ? 'bg-emerald-50 text-[#1E6B45] border border-emerald-200' : 'bg-purple-50 text-[#5E253B] border border-purple-200'
                      }`}>
                        <span>{route.comfortScore}</span>
                        <span className="text-xs font-normal opacity-70">/10</span>
                      </div>
                      <span className="block text-[10px] font-semibold text-[#7E5767] mt-0.5">
                        Journey Fit
                      </span>
                    </div>
                  </div>

                  {/* Time Band Highlight Tag Badge */}
                  <div className="mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                      route.tag.type === 'recommended'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : route.tag.type === 'positive'
                        ? 'bg-blue-100 text-blue-900 border-blue-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {route.tag.text}
                    </span>
                  </div>

                  {/* Duration & Distance Pill Metrics */}
                  <div className="flex items-center gap-3 text-xs font-bold text-[#3E1627] mb-3">
                    <div className="flex items-center gap-1 bg-[#F2E6E2] text-[#5E253B] px-3 py-1.5 rounded-full">
                      <Clock className="w-3.5 h-3.5 text-[#A3526B]" />
                      <span>{route.durationMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#F2E6E2] text-[#5E253B] px-3 py-1.5 rounded-full">
                      <MapPin className="w-3.5 h-3.5 text-[#1E6B45]" />
                      <span>{route.distanceKm} km</span>
                    </div>
                  </div>

                  {/* PROS & CONS COMPARISON */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 pt-3 border-t border-[#F5ECE8]">
                    {/* PROS CARD */}
                    <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 space-y-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1E6B45] flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-[#1E6B45]" />
                        Pros / Advantages
                      </span>
                      <ul className="space-y-1">
                        {route.pros?.map((pro, pIdx) => (
                          <li key={pIdx} className="text-[11px] font-semibold text-emerald-950 flex items-start gap-1.5 leading-tight">
                            <span className="text-[#1E6B45] font-bold">•</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CONS CARD */}
                    <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 space-y-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Cons / Trade-offs
                      </span>
                      <ul className="space-y-1">
                        {route.cons?.map((con, cIdx) => (
                          <li key={cIdx} className="text-[11px] font-semibold text-amber-950 flex items-start gap-1.5 leading-tight">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Accordion "Why this route?" */}
                  <div className="pt-2 border-t border-[#F5ECE8]">
                    <button
                      onClick={(e) => toggleExpandScore(route.id, e)}
                      className="w-full flex items-center justify-between text-xs font-bold text-[#A3526B] hover:text-[#5E253B] transition-colors py-1"
                    >
                      <span>Why this score?</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden pt-3 text-xs space-y-2.5 text-slate-600"
                        >
                          <p className="bg-[#F9F4F0] p-3 rounded-2xl border border-[#E8D8D3] font-medium text-[#3E1627]">
                            {route.scoreDetails.summaryExplanation}
                          </p>

                          <div className="space-y-1.5 pl-1 text-[#6E4B59]">
                            <div className="flex justify-between">
                              <span>Lighting Continuity:</span>
                              <span className="font-bold text-[#3E1627]">{route.scoreDetails.lightingScore}/10</span>
                            </div>
                            <div className="flex justify-between pt-1">
                              <span>Open Business Presence:</span>
                              <span className="font-bold text-[#3E1627]">{route.scoreDetails.commercialScore}/10</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </motion.div>
              );
            })}
          </div>

          {/* DUAL ACTION BUTTONS AS REQUESTED IN SECOND IMAGE */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            {/* Button 1: Proceed with Journey Only */}
            <button
              onClick={() => onProceedOnly(selectedRoute)}
              className="w-full sm:w-1/2 py-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-emerald-200" />
              <span>Proceed with Journey</span>
            </button>

            {/* Button 2: Proceed & Share ETA */}
            <button
              onClick={() => onSelectAndShare(selectedRoute)}
              className="w-full sm:w-1/2 py-4 rounded-full bg-[#A3526B] hover:bg-[#8F445B] text-white font-bold text-sm shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Proceed & Share ETA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
