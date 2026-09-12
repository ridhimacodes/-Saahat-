import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, ChevronDown, ChevronUp, Sun, Sunset, Moon, Bus, Store, Shield, Sparkles, ArrowRight, AlertCircle, Eye, Share2, CheckCircle2, ShieldAlert, ThumbsUp, AlertTriangle, Compass, Download, HardDrive, Trash2 } from 'lucide-react';
import { RouteOption, TimeOfDay } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { saveJourneyLocally, isRouteDownloaded, estimateStorageSize, getSavedJourneysLocally, deleteSavedJourneyLocally } from '../utils/offlineStorage';

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
  onNavigateToLowSignal?: () => void;
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
  isLowSignalGlobal,
  onNavigateToLowSignal
}) => {
  const [expandedScoreId, setExpandedScoreId] = useState<string | null>(selectedRouteId);
  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  const [downloadedRouteIds, setDownloadedRouteIds] = useState<string[]>(() =>
    getSavedJourneysLocally().map(j => j.id)
  );
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const handleDownloadRoute = (targetRoute: RouteOption) => {
    saveJourneyLocally(origin, destination, targetRoute);
    setDownloadedRouteIds(prev => Array.from(new Set([...prev, targetRoute.id])));
    const sizeEst = estimateStorageSize(targetRoute);
    setDownloadToast(`Route "${targetRoute.name.split('—')[0].trim()}" saved for offline use ✓ (${sizeEst})`);
    setTimeout(() => setDownloadToast(null), 5000);
  };

  const handleDeleteRoute = (targetRoute: RouteOption) => {
    deleteSavedJourneyLocally(targetRoute.id);
    setDownloadedRouteIds(prev => prev.filter(id => id !== targetRoute.id));
    setDownloadToast(`Route "${targetRoute.name.split('—')[0].trim()}" deleted from offline storage`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  const toggleExpandScore = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedScoreId(expandedScoreId === id ? null : id);
  };

  const getTimeLabel = (time: TimeOfDay) => {
    switch (time) {
      case 'day': return 'Daytime (6:00 AM – 5:00 PM)';
      case 'evening': return 'Evening (5:00 PM – 8:00 PM)';
      case 'night': return 'Night (8:00 PM – 11:00 PM)';
      case 'lateNight': return 'Late Night (11:00 PM – 6:00 AM)';
      default: return 'Night (8:00 PM – 11:00 PM)';
    }
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 font-sans ${
      isLowSignalGlobal ? 'text-slate-100' : 'bg-[#F9F4F0]'
    }`}>
      {/* Toast Notification for Offline Download */}
      <AnimatePresence>
        {downloadToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-amber-300 px-5 py-3.5 rounded-2xl shadow-2xl border border-amber-400/50 flex items-center gap-3 text-xs font-bold"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{downloadToast}</span>
            {onNavigateToLowSignal && (
              <button
                onClick={onNavigateToLowSignal}
                className="ml-2 px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-sm shrink-0"
              >
                View Offline Route →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Parameters & Selected Time Status Header Bar */}
      <div className={`rounded-3xl p-5 border shadow-sm space-y-4 ${
        isLowSignalGlobal ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-[#E8D8D3]'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isLowSignalGlobal ? 'bg-amber-400/20 text-amber-300' : 'bg-[#F2E6E2] text-[#5E253B]'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className={`font-bold ${isLowSignalGlobal ? 'text-white' : 'text-[#3E1627]'}`}>{origin.split(',')[0]}</span>
                <span className={`font-bold ${isLowSignalGlobal ? 'text-amber-400' : 'text-[#A3526B]'}`}>→</span>
                <span className={`font-bold ${isLowSignalGlobal ? 'text-emerald-400' : 'text-[#1E6B45]'}`}>{destination.split(',')[0]}</span>
              </div>
              <p className={`text-xs font-semibold mt-1 flex items-center gap-1.5 flex-wrap ${isLowSignalGlobal ? 'text-slate-300' : 'text-[#7E5767]'}`}>
                <Clock className={`w-3.5 h-3.5 ${isLowSignalGlobal ? 'text-amber-400' : 'text-[#A3526B]'}`} />
                <span>Evaluated for Live System Time:</span>
                <span className={`font-bold px-3 py-1 rounded-full border text-xs flex items-center gap-1.5 shadow-2xs ${
                  isLowSignalGlobal ? 'bg-amber-400/20 text-amber-300 border-amber-400/40' : 'bg-[#F2E6E2] text-[#3E1627] border-[#E0D0C9]'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>{getTimeLabel(timeOfDay)}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {downloadedRouteIds.length > 0 && onNavigateToLowSignal && (
              <button
                onClick={onNavigateToLowSignal}
                className="px-4 py-2 rounded-full text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-500 shadow-sm transition-all flex items-center gap-1.5"
              >
                <HardDrive className="w-3.5 h-3.5 text-slate-950" />
                <span>View Downloaded Routes ({downloadedRouteIds.length})</span>
              </button>
            )}
            <button
              onClick={onBackToSearch}
              className={`px-5 py-2 rounded-full text-xs font-bold border transition-all shadow-xs ${
                isLowSignalGlobal
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-600'
                  : 'bg-[#F2E6E2] hover:bg-[#E8D8D3] text-[#5E253B] border-[#E0D0C9]'
              }`}
            >
              Change Parameters
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout: Interactive Map + Route Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Real Map Display */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-serif font-bold flex items-center gap-2 ${
              isLowSignalGlobal ? 'text-white' : 'text-[#3E1627]'
            }`}>
              <Eye className={`w-5 h-5 ${isLowSignalGlobal ? 'text-amber-400' : 'text-[#A3526B]'}`} />
              <span>Real Route Map Preview ({routes.length} Paths)</span>
            </h2>
            <span className={`text-xs font-medium ${isLowSignalGlobal ? 'text-slate-300' : 'text-[#7E5767]'}`}>
              Click routes to select
            </span>
          </div>

          <InteractiveMap
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            isLowSignalGlobal={isLowSignalGlobal}
          />

          {/* Context Disclaimer */}
          <div className={`p-4 rounded-2xl text-xs flex items-start gap-2.5 shadow-2xs border ${
            isLowSignalGlobal 
              ? 'bg-slate-900 border-slate-700 text-slate-200' 
              : 'bg-white border-[#E8D8D3] text-[#6E4B59]'
          }`}>
            <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
              isLowSignalGlobal ? 'text-amber-400' : 'text-[#A3526B]'
            }`} />
            <p className="leading-relaxed">
              <strong>Context Disclaimer:</strong> Saahat evaluates factual environmental signals (lighting, footfall, transit, open businesses) to give you total control.
            </p>
          </div>
        </div>

        {/* Right Column: Comparative Route Cards */}
        <div className="lg:col-span-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-serif font-bold ${isLowSignalGlobal ? 'text-white' : 'text-[#3E1627]'}`}>
              Evaluated Options ({routes.length})
            </h2>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              isLowSignalGlobal
                ? 'text-amber-300 bg-amber-400/20 border-amber-400/40'
                : 'text-[#1E6B45] bg-emerald-50 border-emerald-200'
            }`}>
              Evaluated for {timeOfDay === 'day' ? 'Daytime' : timeOfDay === 'evening' ? 'Evening' : timeOfDay === 'night' ? 'Night' : 'Late Night'}
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
                          ? (isLowSignalGlobal ? 'bg-slate-900 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xl' : 'bg-white border-[#1E6B45] ring-2 ring-[#1E6B45]/30 shadow-xl') 
                          : (isLowSignalGlobal ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/40 shadow-xl' : 'bg-white border-[#A3526B] ring-2 ring-[#A3526B]/30 shadow-xl'))
                      : (isLowSignalGlobal ? 'bg-slate-900/90 border-slate-700 hover:border-slate-500 shadow-sm' : 'bg-white/80 border-[#E8D8D3] hover:border-[#A3526B] shadow-sm')
                  }`}
                >
                  {/* Selected Indicator Strip */}
                  {isSelected && (
                    <div 
                      className="absolute top-0 left-0 bottom-0 w-2 shadow-sm"
                      style={{ backgroundColor: route.color || (isBestMatch ? (isLowSignalGlobal ? '#34D399' : '#1E6B45') : (isLowSignalGlobal ? '#FBBF24' : '#A3526B')) }}
                    />
                  )}

                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`font-bold text-base sm:text-lg ${isLowSignalGlobal ? 'text-white' : 'text-[#3E1627]'}`}>
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
                            style={{ backgroundColor: route.color || (isBestMatch ? (isLowSignalGlobal ? '#059669' : '#1E6B45') : (isLowSignalGlobal ? '#D97706' : '#A3526B')) }}
                          >
                            Selected
                          </span>
                        )}

                        {downloadedRouteIds.includes(route.id) ? (
                          <div className="flex items-center gap-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shadow-2xs ${
                              isLowSignalGlobal ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Offline Ready ({estimateStorageSize(route)})</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRoute(route);
                              }}
                              className="p-1 rounded-full text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors"
                              title="Delete Downloaded Map"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadRoute(route);
                            }}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 shadow-2xs ${
                              isLowSignalGlobal ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' : 'bg-[#F2E6E2] hover:bg-[#E8D8D3] text-[#5E253B] border-[#E0D0C9]'
                            }`}
                            title="Download Route for Offline Use"
                          >
                            <Download className="w-3 h-3 text-[#A3526B]" />
                            <span>Download Offline</span>
                          </button>
                        )}
                      </div>
                      <p className={`text-xs font-medium ${isLowSignalGlobal ? 'text-slate-300' : 'text-[#7E5767]'}`}>
                        {route.via}
                      </p>
                    </div>

                    {/* Score Badge */}
                    <div className="text-right flex-shrink-0">
                      <div className={`inline-flex items-baseline gap-1 px-3 py-1 rounded-2xl font-extrabold text-lg ${
                        isBestMatch 
                          ? (isLowSignalGlobal ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50' : 'bg-emerald-50 text-[#1E6B45] border border-emerald-200')
                          : (isLowSignalGlobal ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50' : 'bg-purple-50 text-[#5E253B] border border-purple-200')
                      }`}>
                        <span>{route.comfortScore}</span>
                        <span className="text-xs font-normal opacity-70">/10</span>
                      </div>
                      <span className={`block text-[10px] font-semibold mt-0.5 ${isLowSignalGlobal ? 'text-slate-400' : 'text-[#7E5767]'}`}>
                        Journey Fit
                      </span>
                    </div>
                  </div>

                  {/* Time Band Highlight Tag Badge */}
                  <div className="mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                      isLowSignalGlobal
                        ? (route.tag.type === 'recommended'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                            : route.tag.type === 'positive'
                            ? 'bg-sky-950 text-sky-300 border-sky-500/50'
                            : 'bg-amber-950 text-amber-300 border-amber-500/50')
                        : (route.tag.type === 'recommended'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : route.tag.type === 'positive'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300')
                    }`}>
                      {route.tag.text}
                    </span>
                  </div>

                  {/* Duration & Distance Pill Metrics */}
                  <div className={`flex items-center gap-3 text-xs font-bold mb-3 ${isLowSignalGlobal ? 'text-slate-100' : 'text-[#3E1627]'}`}>
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
                      isLowSignalGlobal ? 'bg-slate-800 text-amber-300 border border-slate-700' : 'bg-[#F2E6E2] text-[#5E253B]'
                    }`}>
                      <Clock className={`w-3.5 h-3.5 ${isLowSignalGlobal ? 'text-amber-400' : 'text-[#A3526B]'}`} />
                      <span>{route.durationMinutes} min</span>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
                      isLowSignalGlobal ? 'bg-slate-800 text-emerald-300 border border-slate-700' : 'bg-[#F2E6E2] text-[#5E253B]'
                    }`}>
                      <MapPin className={`w-3.5 h-3.5 ${isLowSignalGlobal ? 'text-emerald-400' : 'text-[#1E6B45]'}`} />
                      <span>{route.distanceKm} km</span>
                    </div>
                  </div>

                  {/* PROS & CONS COMPARISON */}
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 pt-3 border-t ${
                    isLowSignalGlobal ? 'border-slate-800' : 'border-[#F5ECE8]'
                  }`}>
                    {/* PROS CARD */}
                    <div className={`p-3 rounded-2xl border space-y-1.5 ${
                      isLowSignalGlobal ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-emerald-50/80 border-emerald-200'
                    }`}>
                      <span className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                        isLowSignalGlobal ? 'text-emerald-300' : 'text-[#1E6B45]'
                      }`}>
                        <ThumbsUp className={`w-3.5 h-3.5 ${isLowSignalGlobal ? 'text-emerald-300' : 'text-[#1E6B45]'}`} />
                        Pros / Advantages
                      </span>
                      <ul className="space-y-1">
                        {route.pros?.map((pro, pIdx) => (
                          <li key={pIdx} className={`text-[11px] font-semibold flex items-start gap-1.5 leading-tight ${
                            isLowSignalGlobal ? 'text-emerald-200' : 'text-emerald-950'
                          }`}>
                            <span className={`${isLowSignalGlobal ? 'text-emerald-400' : 'text-[#1E6B45]'} font-bold`}>•</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CONS CARD */}
                    <div className={`p-3 rounded-2xl border space-y-1.5 ${
                      isLowSignalGlobal ? 'bg-amber-950/40 border-amber-800/60' : 'bg-amber-50/80 border-amber-200'
                    }`}>
                      <span className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                        isLowSignalGlobal ? 'text-amber-300' : 'text-amber-800'
                      }`}>
                        <AlertTriangle className={`w-3.5 h-3.5 ${isLowSignalGlobal ? 'text-amber-400' : 'text-amber-600'}`} />
                        Cons / Trade-offs
                      </span>
                      <ul className="space-y-1">
                        {route.cons?.map((con, cIdx) => (
                          <li key={cIdx} className={`text-[11px] font-semibold flex items-start gap-1.5 leading-tight ${
                            isLowSignalGlobal ? 'text-amber-200' : 'text-amber-950'
                          }`}>
                            <span className={`${isLowSignalGlobal ? 'text-amber-400' : 'text-amber-600'} font-bold`}>•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Accordion "Why this route?" */}
                  <div className={`pt-2 border-t ${isLowSignalGlobal ? 'border-slate-800' : 'border-[#F5ECE8]'}`}>
                    <button
                      onClick={(e) => toggleExpandScore(route.id, e)}
                      className={`w-full flex items-center justify-between text-xs font-bold transition-colors py-1 ${
                        isLowSignalGlobal ? 'text-amber-300 hover:text-amber-200' : 'text-[#A3526B] hover:text-[#5E253B]'
                      }`}
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
                          className={`overflow-hidden pt-3 text-xs space-y-2.5 ${
                            isLowSignalGlobal ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          <p className={`p-3 rounded-2xl border font-medium ${
                            isLowSignalGlobal ? 'bg-slate-800/90 border-slate-700 text-slate-100' : 'bg-[#F9F4F0] border-[#E8D8D3] text-[#3E1627]'
                          }`}>
                            {route.scoreDetails.summaryExplanation}
                          </p>

                          <div className={`space-y-1.5 pl-1 ${isLowSignalGlobal ? 'text-slate-300' : 'text-[#6E4B59]'}`}>
                            <div className="flex justify-between">
                              <span>Lighting Continuity:</span>
                              <span className={`font-bold ${isLowSignalGlobal ? 'text-amber-300' : 'text-[#3E1627]'}`}>{route.scoreDetails.lightingScore}/10</span>
                            </div>
                            <div className="flex justify-between pt-1">
                              <span>Open Business Presence:</span>
                              <span className={`font-bold ${isLowSignalGlobal ? 'text-amber-300' : 'text-[#3E1627]'}`}>{route.scoreDetails.commercialScore}/10</span>
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
              className={`w-full sm:w-1/2 py-4 rounded-full font-bold text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 ${
                isLowSignalGlobal 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50' 
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-200" />
              <span>Proceed with Journey</span>
            </button>

            {/* Button 2: Proceed & Share ETA */}
            <button
              onClick={() => onSelectAndShare(selectedRoute)}
              className={`w-full sm:w-1/2 py-4 rounded-full font-bold text-sm shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 ${
                isLowSignalGlobal 
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold border border-amber-400' 
                  : 'bg-[#A3526B] hover:bg-[#8F445B] text-white'
              }`}
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
