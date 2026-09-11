import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ShieldCheck, UserCheck, Clock, CheckCircle2, Send, Lock, Sparkles, Heart, Copy, Check } from 'lucide-react';
import { RouteOption, TrustedContact } from '../types';
import { TRUSTED_CONTACTS } from '../data/mockData';

interface ShareJourneyPageProps {
  selectedRoute: RouteOption;
  onNavigateHome: () => void;
}

export const ShareJourneyPage: React.FC<ShareJourneyPageProps> = ({
  selectedRoute,
  onNavigateHome
}) => {
  const [selectedContact, setSelectedContact] = useState<TrustedContact>(TRUSTED_CONTACTS[0]);
  const [customName, setCustomName] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [useCustomContact, setUseCustomContact] = useState(false);
  const [arrivalTime, setArrivalTime] = useState("10:15 PM");
  
  // State for message status
  const [isShared, setIsShared] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasArrivedSafely, setHasArrivedSafely] = useState(false);

  const contactName = useCustomContact ? (customName || "Trusted Contact") : selectedContact.name;
  const contactPhone = useCustomContact ? (customPhone || "+1 (555) 000-0000") : selectedContact.phone;

  const generatedMessage = `I'm heading home via ${selectedRoute.name.split('—')[0].trim()} (${selectedRoute.durationMinutes} mins), expected arrival by ${arrivalTime}. Powered by HerPath.`;

  const handleShareETA = (e: React.FormEvent) => {
    e.preventDefault();
    setIsShared(true);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleArrivedSafely = () => {
    setHasArrivedSafely(true);
    // Fire celebratory confetti explosion physics!
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      
      {/* Page Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pink-100 text-brand-pink text-xs font-bold mb-3"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>One-Time Privacy Safety Feature</span>
        </motion.div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Share Journey & ETA
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Send a quick status update to a trusted friend or family member.
        </p>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-xl shadow-purple-900/5 space-y-6"
      >
        
        {/* Route Summary Pill */}
        <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Selected Route</span>
            <span className="font-extrabold text-slate-900 text-sm">{selectedRoute.name}</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-brand-purple block">{selectedRoute.durationMinutes} mins</span>
            <span className="text-[11px] text-slate-500">{selectedRoute.distanceKm} km</span>
          </div>
        </div>

        {!isShared ? (
          <form onSubmit={handleShareETA} className="space-y-6">
            
            {/* Contact Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pick Trusted Contact
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomContact(!useCustomContact)}
                  className="text-xs font-bold text-brand-purple hover:underline"
                >
                  {useCustomContact ? "Choose Saved Contact" : "+ Add Custom Number"}
                </button>
              </div>

              {!useCustomContact ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TRUSTED_CONTACTS.map((contact) => {
                    const isSelected = selectedContact.id === contact.id;
                    return (
                      <div
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'border-brand-purple bg-purple-50 ring-2 ring-purple-300'
                            : 'border-slate-200 hover:border-purple-200 bg-slate-50/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full ${contact.avatarBg} text-white font-bold flex items-center justify-center text-sm shadow-sm`}>
                          {contact.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <span className="font-bold text-slate-900 text-sm block truncate">{contact.name}</span>
                          <span className="text-xs text-slate-500 block truncate">{contact.phone}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                    className="p-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-800"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    required
                    className="p-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Arrival Time Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Expected Arrival Time
              </label>
              <div className="relative flex items-center">
                <Clock className="w-5 h-5 absolute left-3.5 text-purple-600" />
                <input
                  type="text"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  placeholder="e.g. 10:15 PM"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Message Preview Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                SMS / WhatsApp Preview
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed italic bg-white p-3 rounded-xl border border-slate-100">
                "{generatedMessage}"
              </p>
            </div>

            {/* Share CTA Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6C2BD9] via-[#7C3AED] to-[#FF4D8D] text-white font-bold text-base shadow-lg shadow-purple-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span>Share ETA with {contactName.split(' ')[0]}</span>
            </button>

          </form>
        ) : (
          /* Confirmation & "I've Arrived Safely" Section */
          <div className="space-y-6 text-center">
            
            {/* Animated Checkmark Bounce */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">ETA Shared Successfully!</h2>
              <p className="text-slate-500 text-sm mt-1">
                Sent message notification preview to <strong className="text-slate-800">{contactName}</strong> ({contactPhone}).
              </p>
            </div>

            {/* Copy SMS Link */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Outgoing Message Content:</span>
                <button
                  onClick={handleCopyMessage}
                  className="text-xs font-bold text-brand-purple flex items-center gap-1 hover:underline"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? "Copied!" : "Copy Text"}</span>
                </button>
              </div>
              <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                {generatedMessage}
              </p>
            </div>

            {/* "I've Arrived Safely" Completion Button */}
            {!hasArrivedSafely ? (
              <div className="pt-2">
                <button
                  onClick={handleArrivedSafely}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-lg shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 animate-pulse-glow"
                >
                  <Heart className="w-6 h-6 text-amber-200 fill-amber-200" />
                  <span>I've Arrived Safely!</span>
                </button>
              </div>
            ) : (
              /* Celebratory Arrival State */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl space-y-3"
              >
                <div className="inline-flex p-3 rounded-full bg-emerald-500 text-white shadow-lg">
                  <Sparkles className="w-6 h-6 animate-spin-slow" />
                </div>
                <h3 className="text-xl font-extrabold text-emerald-900">
                  Wonderful news! Journey Completed.
                </h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  A notification has been sent confirming your safe arrival. Have a relaxing evening!
                </p>

                <button
                  onClick={onNavigateHome}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all"
                >
                  Return to Home
                </button>
              </motion.div>
            )}

          </div>
        )}

        {/* Privacy Note */}
        <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100 text-xs text-purple-900 flex items-center justify-center gap-2 text-center">
          <Lock className="w-4 h-4 text-brand-purple flex-shrink-0" />
          <span>
            <strong>Privacy Assurance:</strong> This is a one-time message. HerPath never continuously tracks or stores your live GPS location.
          </span>
        </div>

      </motion.div>
    </div>
  );
};
