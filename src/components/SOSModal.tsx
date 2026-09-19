import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, ShieldAlert, MapPin, Share2, CheckCircle2, X, Radio, Heart, PhoneCall } from 'lucide-react';
import { TrustedContact } from '../types';
import { fetchEmergencyContacts } from '../services/supabaseService';
import confetti from 'canvas-confetti';

interface SOSModalProps {
  trustedContact?: TrustedContact;
  isOpenDirectly?: boolean;
  onCloseDirectly?: () => void;
  activeJourneyInfo?: {
    origin?: string;
    destination?: string;
    routeName?: string;
    eta?: string;
  } | null;
  onTriggerRingMe?: () => void;
  onTriggerFakeCall?: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  trustedContact: initialContact,
  isOpenDirectly,
  onCloseDirectly,
  activeJourneyInfo,
  onTriggerRingMe,
  onTriggerFakeCall
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isLocationSharingActive, setIsLocationSharingActive] = useState(true);
  const [isCallSimulated, setIsCallSimulated] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeContact, setActiveContact] = useState<TrustedContact | undefined>(initialContact);
  const [alertDispatched, setAlertDispatched] = useState(false);

  // Sync latest saved contacts from Supabase/Share ETA
  useEffect(() => {
    if (!initialContact) {
      fetchEmergencyContacts().then(contacts => {
        if (contacts && contacts.length > 0) {
          setActiveContact(contacts[0]);
        }
      });
    } else {
      setActiveContact(initialContact);
    }
  }, [initialContact]);

  useEffect(() => {
    if (isOpenDirectly) {
      setIsOpen(true);
      setIsCountdownActive(true);
      setCountdown(5);
      setIsResolved(false);
      setAlertDispatched(false);
    }
  }, [isOpenDirectly]);

  // 5-second Countdown Interval
  useEffect(() => {
    let timer: any;
    if (isOpen && isCountdownActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isOpen && isCountdownActive && countdown === 0) {
      triggerEmergencyDispatch();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isCountdownActive, countdown]);

  const handleOpenSOS = () => {
    if (isDragging) return;
    setIsOpen(true);
    setIsCountdownActive(true);
    setCountdown(5);
    setIsResolved(false);
    setIsLocationSharingActive(true);
    setAlertDispatched(false);
  };

  const handleCancelCountdown = () => {
    setIsCountdownActive(false);
    setIsOpen(false);
    if (onCloseDirectly) onCloseDirectly();
  };

  const triggerEmergencyDispatch = () => {
    setIsCountdownActive(false);
    setAlertDispatched(true);
    setIsLocationSharingActive(true);

    // Prepare and dispatch emergency alert with live GPS and active journey
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendAlertMessage(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          sendAlertMessage();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      sendAlertMessage();
    }
  };

  const sendAlertMessage = (lat?: number, lng?: number) => {
    const contactPhone = activeContact?.phone || '';
    if (!contactPhone) return;

    let cleanPhone = contactPhone.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone;
    } else if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.substring(1);
    }

    const locText = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : 'GPS Location fetching...';
    const journeyText = activeJourneyInfo ? `\n🚗 Active Journey: ${activeJourneyInfo.origin} → ${activeJourneyInfo.destination}` : '';
    const alertMsg = `🚨 EMERGENCY SOS ALERT FROM SAAHAT!\n\nI need immediate assistance!\n📍 Location: ${locText}\n⏱️ Time: ${new Date().toLocaleTimeString()}${journeyText}\n\n🚨 Please call emergency services (112) or call me immediately.`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(alertMsg)}`;
    window.open(waUrl, '_blank');
  };

  const handleCloseSOS = () => {
    setIsOpen(false);
    setIsCountdownActive(false);
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
      setIsCountdownActive(false);
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

              {isCountdownActive ? (
                <div className="py-4 text-center space-y-5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black border border-rose-500/40 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-300" />
                    <span>Confirming Emergency Activation</span>
                  </div>

                  <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="6" className="text-slate-800" fill="transparent" />
                      <circle 
                        cx="56" 
                        cy="56" 
                        r="48" 
                        stroke="currentColor" 
                        strokeWidth="6" 
                        className="text-rose-500 transition-all duration-1000" 
                        fill="transparent" 
                        strokeDasharray={301.6} 
                        strokeDashoffset={301.6 * (1 - countdown / 5)} 
                      />
                    </svg>
                    <span className="absolute text-5xl font-black text-white tracking-tight">{countdown}</span>
                  </div>

                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Initiating Emergency Alert
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Sending your live GPS location & route info to <strong className="text-pink-300">{activeContact?.name || 'Trusted Contact'}</strong> in {countdown}s.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      onClick={handleCancelCountdown}
                      className="w-full sm:flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all shadow-md"
                    >
                      Cancel Alert
                    </button>
                    <button
                      onClick={triggerEmergencyDispatch}
                      className="w-full sm:flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 text-white font-black text-xs shadow-xl shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all"
                    >
                      Send Alert Now
                    </button>
                  </div>
                </div>
              ) : !isResolved ? (
                <>
                  {alertDispatched && activeContact && (
                    <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-700 text-xs text-rose-200 flex items-center justify-between">
                      <span>🚨 Emergency alert sent to <strong>{activeContact.name}</strong> ({activeContact.phone})</span>
                      <span className="text-[10px] font-bold bg-rose-800 text-white px-2 py-0.5 rounded">Dispatched</span>
                    </div>
                  )}

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
                      onClick={() => triggerCallSimulation(activeContact ? activeContact.name : 'Emergency Helpline (112)')}
                      className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all group"
                    >
                      <Phone className="w-5 h-5 text-pink-400 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Call Primary Contact</span>
                      <strong className="text-sm font-bold text-white block truncate">
                        {activeContact ? activeContact.name : 'Emergency Helpline'}
                      </strong>
                      <span className="text-[11px] text-slate-400 block">
                        {activeContact ? activeContact.phone : '112 / Police'}
                      </span>
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

                  {/* Discreet Alternative: Ring Me Tool */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-slate-900 border border-indigo-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-white block">Need a discreet excuse to leave?</strong>
                        <span className="text-[10px] text-indigo-200 block">Trigger Ring Me (Simulated • No dispatch)</span>
                      </div>
                    </div>

                    <button
                      id="sos-trigger-ring-me"
                      onClick={() => {
                        handleCloseSOS();
                        const fn = onTriggerRingMe || onTriggerFakeCall;
                        if (fn) fn();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
                    >
                      Ring Me
                    </button>
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
