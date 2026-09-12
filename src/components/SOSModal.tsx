import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, ShieldAlert, MapPin, Share2, CheckCircle2, X, Radio, Heart, PhoneCall } from 'lucide-react';
import { TrustedContact } from '../types';
import confetti from 'canvas-confetti';

interface SOSModalProps {
  trustedContact: TrustedContact;
  isOpenDirectly?: boolean;
  onCloseDirectly?: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  trustedContact,
  isOpenDirectly,
  onCloseDirectly
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocationSharingActive, setIsLocationSharingActive] = useState(true);
  const [isCallSimulated, setIsCallSimulated] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpenDirectly) {
      setIsOpen(true);
      setIsResolved(false);
    }
  }, [isOpenDirectly]);

  const handleOpenSOS = () => {
    if (isDragging) return;
    setIsOpen(true);
    setIsResolved(false);
    setIsLocationSharingActive(true);
  };

  const handleCloseSOS = () => {
    setIsOpen(false);
    if (onCloseDirectly) onCloseDirectly();
  };

  const handleMarkSafe = () => {
    setIsResolved(true);
    setIsLocationSharingActive(false);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      setIsOpen(false);
      setIsResolved(false);
      if (onCloseDirectly) onCloseDirectly();
    }, 2200);
  };

  const triggerCallSimulation = (label: string) => {
    setIsCallSimulated(label);
    setTimeout(() => setIsCallSimulated(null), 3000);
  };

  return (
    <>
      {/* Draggable Floating SOS Action Button (Moveable anywhere on screen) */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.05}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => {
          setTimeout(() => setIsDragging(false), 150);
        }}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 touch-none cursor-grab active:cursor-grabbing select-none"
      >
        <motion.button
          onClick={handleOpenSOS}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 text-white font-extrabold text-sm shadow-2xl shadow-rose-600/50 hover:shadow-rose-600/70 border-2 border-white/90 backdrop-blur-sm transition-shadow overflow-hidden"
          title="Click for Emergency SOS • Drag to reposition"
        >
          <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-30 pointer-events-none" />
          <AlertTriangle className="w-5 h-5 text-amber-200 animate-bounce flex-shrink-0" />
          <span className="tracking-wide uppercase font-black text-xs">SOS Emergency</span>
        </motion.button>
      </motion.div>

      {/* Emergency Console Overlay Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-slate-900 border border-rose-900/60 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-rose-900/40 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Emergency Protocol Active
                  </span>
                </div>

                <button
                  onClick={handleCloseSOS}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isResolved ? (
                <>
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 text-rose-300 text-xs font-bold border border-rose-800/60">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>One-Tap Immediate Assistance</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      Emergency Activated
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Stay calm. Choose a direct response option below.
                    </p>
                  </div>

                  {/* Nearest Police Station Card */}
                  <div className="bg-slate-800/90 rounded-2xl p-4 border border-rose-800/50 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-rose-900/70 text-rose-300 flex items-center justify-center font-bold">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">Nearest Police Dispatch</span>
                          <strong className="text-sm font-bold text-white block">Sector 15 Main Police Station</strong>
                          <span className="text-xs text-slate-400">0.8 km away • 24/7 Desk Active</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => triggerCallSimulation("Police Control Room (100 / 112)")}
                        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Direct Call Police Control Room (100 / 112)</span>
                      </button>
                    </div>
                  </div>

                  {/* Call Simulation Banner Notification */}
                  <AnimatePresence>
                    {isCallSimulated && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-emerald-950 border border-emerald-700/70 p-3.5 rounded-2xl text-xs text-emerald-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-400 animate-pulse" />
                          <span>Dialing <strong>{isCallSimulated}</strong>...</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/80 px-2 py-0.5 rounded">Connected</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* One-Tap Emergency Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => triggerCallSimulation(trustedContact.name)}
                      className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all group"
                    >
                      <Phone className="w-5 h-5 text-pink-400 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Call Primary Contact</span>
                      <strong className="text-sm font-bold text-white block truncate">{trustedContact.name}</strong>
                      <span className="text-[11px] text-slate-400 block">{trustedContact.phone}</span>
                    </button>

                    <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-left flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Radio className="w-5 h-5 text-teal-400" />
                          <button
                            onClick={() => setIsLocationSharingActive(!isLocationSharingActive)}
                            className={`w-9 h-5 rounded-full transition-colors p-0.5 ${
                              isLocationSharingActive ? 'bg-teal-500' : 'bg-slate-600'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              isLocationSharingActive ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                        <strong className="text-xs font-bold text-white block">Emergency GPS Stream</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {isLocationSharingActive ? "Active for SOS duration only" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <span>
                      Location broadcast automatically terminates as soon as you tap <strong>I'm Safe Now</strong>.
                    </span>
                  </div>

                  {/* "I'm Safe Now" Exit Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleMarkSafe}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white font-extrabold text-base shadow-xl shadow-emerald-950 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5 text-amber-200" />
                      <span>I'm Safe Now (Exit Emergency)</span>
                    </button>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-8 text-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-900/80 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-600">
                    <Heart className="w-8 h-8 fill-emerald-400 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Safe Confirmation Received</h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    Emergency mode deactivated. Your location stream has been automatically shut down.
                  </p>
                </motion.div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
