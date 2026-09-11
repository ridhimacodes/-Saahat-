import React from 'react';
import { motion } from 'framer-motion';
import { Sliders, Zap, Heart, Sun, Store, Scale, Sparkles } from 'lucide-react';

export type PreferencePreset = 'fast' | 'comfort' | 'wellLit' | 'active' | 'balance';

interface PreferenceSliderProps {
  currentPreset: PreferencePreset;
  onPresetChange: (preset: PreferencePreset) => void;
  isLowSignalGlobal?: boolean;
}

export const PreferenceSlider: React.FC<PreferenceSliderProps> = ({
  currentPreset,
  onPresetChange,
  isLowSignalGlobal
}) => {
  const presets: { id: PreferencePreset; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'fast', label: 'Fast', icon: <Zap className="w-3.5 h-3.5" />, desc: 'Prioritizes shortest travel time' },
    { id: 'comfort', label: 'Comfort', icon: <Heart className="w-3.5 h-3.5" />, desc: 'Smooth sidewalks & wide avenues' },
    { id: 'wellLit', label: 'Well-Lit', icon: <Sun className="w-3.5 h-3.5" />, desc: 'Continuous LED streetlight coverage' },
    { id: 'active', label: 'Active', icon: <Store className="w-3.5 h-3.5" />, desc: 'Open storefronts & pedestrian stream' },
    { id: 'balance', label: 'Balance', icon: <Scale className="w-3.5 h-3.5" />, desc: 'Optimal blend of speed & comfort' },
  ];

  return (
    <div className={`rounded-3xl p-5 sm:p-6 border transition-all ${
      isLowSignalGlobal
        ? 'bg-slate-900 border-slate-800 text-white'
        : 'glass-card border-pink-200/60 shadow-sm'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-100/80 text-theme-mauve flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4 text-theme-deepPlum" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-theme-deepPlum">
              Route Preference Tuning
            </h3>
            <p className="text-[11px] text-theme-mauve">
              Adjust balance between travel speed and environmental comfort
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-pink-50 text-theme-deepPlum border border-pink-200">
          <Sparkles className="w-3 h-3 inline mr-1 text-amber-500" />
          Live Preference
        </span>
      </div>

      {/* Slider Label Axis */}
      <div className="flex items-center justify-between text-xs font-bold text-theme-mauve mb-3 px-1">
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Fastest
        </span>
        <span className="text-slate-300">←──────────────→</span>
        <span className="flex items-center gap-1 text-emerald-600">
          <Heart className="w-3.5 h-3.5 text-pink-500" />
          More Comfortable
        </span>
      </div>

      {/* Preset Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {presets.map((p) => {
          const isSelected = currentPreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onPresetChange(p.id)}
              className={`p-2.5 rounded-2xl text-xs font-extrabold flex flex-col items-center gap-1 border transition-all duration-300 hover:scale-105 active:scale-95 ${
                isSelected
                  ? 'bg-theme-deepPlum text-white border-theme-deepPlum shadow-md ring-2 ring-pink-300'
                  : 'bg-white/80 border-pink-100 text-theme-deepPlum hover:bg-pink-50/70'
              }`}
            >
              <div className={isSelected ? 'text-amber-300' : 'text-theme-mauve'}>
                {p.icon}
              </div>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Preset Description Footer */}
      <div className="mt-3 text-center text-[11px] font-semibold text-theme-mauve bg-pink-50/50 py-1.5 px-3 rounded-xl border border-pink-100">
        Selected Preset: <strong className="text-theme-deepPlum">{presets.find(p => p.id === currentPreset)?.desc}</strong>
      </div>

    </div>
  );
};
