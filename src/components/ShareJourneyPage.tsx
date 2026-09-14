import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ShieldCheck, UserCheck, Clock, CheckCircle2, Send, Lock, Sparkles, Heart, Copy, Check, ArrowLeft, History, Trash2, X, Plus } from 'lucide-react';
import { RouteOption, TrustedContact } from '../types';
import { TRUSTED_CONTACTS } from '../data/mockData';
import { fetchEmergencyContacts, addEmergencyContact, deleteEmergencyContact } from '../services/supabaseService';
import { 
  getSharedETAHistory, 
  addSharedETAHistory, 
  clearSharedETAHistory, 
  removeSharedETAHistoryItem, 
  SharedETAHistoryItem 
} from '../services/historyService';

interface ShareJourneyPageProps {
  selectedRoute?: RouteOption | null;
  onNavigateHome: () => void;
  onStartJourney?: () => void;
  onBack?: () => void;
  isLowSignalGlobal?: boolean;
  isJourneyStarted?: boolean;
}

export const ShareJourneyPage: React.FC<ShareJourneyPageProps> = ({
  selectedRoute,
  onNavigateHome,
  onStartJourney,
  onBack,
  isLowSignalGlobal = false,
  isJourneyStarted = false
}) => {
  const [contactsList, setContactsList] = useState<TrustedContact[]>(TRUSTED_CONTACTS);
  const [selectedContact, setSelectedContact] = useState<TrustedContact>(TRUSTED_CONTACTS[0]);
  const [customName, setCustomName] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [useCustomContact, setUseCustomContact] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [sharedETAHistory, setSharedETAHistory] = useState<SharedETAHistoryItem[]>(() => getSharedETAHistory());

  // Sync saved emergency contacts from Supabase in background
  React.useEffect(() => {
    fetchEmergencyContacts().then((loaded) => {
      if (loaded && loaded.length > 0) {
        setContactsList(loaded);
        setSelectedContact(loaded[0]);
      }
    });
  }, []);
  
  // Compute realistic live arrival time (Now + duration)
  const computeLiveETA = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + (selectedRoute?.durationMinutes || 15));
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const [arrivalTime, setArrivalTime] = useState(computeLiveETA());
  
  // State for message status
  const [isShared, setIsShared] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasArrivedSafely, setHasArrivedSafely] = useState(false);

  const contactName = useCustomContact 
    ? (customName || "Contact") 
    : (selectedContact?.name || "Contact");
  const contactPhone = useCustomContact 
    ? (customPhone || "") 
    : (selectedContact?.phone || "");

  const routeDisplayName = selectedRoute ? selectedRoute.name.split('—')[0].trim() : "Custom Route";
  const routeDuration = selectedRoute ? selectedRoute.durationMinutes : 15;

  const generatedMessage = isJourneyStarted
    ? `I have started my journey via ${routeDisplayName} (${routeDuration} mins), expected arrival by ${arrivalTime}. Powered by Saahat.`
    : `Journey pending: Route planned via ${routeDisplayName} (${routeDuration} mins). Live ETA activates upon journey start. Powered by Saahat.`;

  const handleShareETA = (e: React.FormEvent) => {
    e.preventDefault();

    // Record strictly to Shared ETA History: who we shared with and what route was shared
    const updatedHistory = addSharedETAHistory({
      recipientName: contactName,
      recipientPhone: contactPhone,
      routeName: selectedRoute ? selectedRoute.name : 'Custom Journey',
      durationMinutes: selectedRoute ? selectedRoute.durationMinutes : 15,
      distanceKm: selectedRoute ? selectedRoute.distanceKm : 0,
      expectedArrivalTime: arrivalTime
    });
    setSharedETAHistory(updatedHistory);

    if (!isJourneyStarted && onStartJourney) {
      onStartJourney();
      return;
    }
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
      {onBack && (
        <button
          onClick={onBack}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
            isLowSignalGlobal
              ? 'bg-slate-900 text-amber-300 border-slate-700 hover:bg-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      )}

      {/* Page Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 ${
            isLowSignalGlobal ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-pink-100 text-brand-pink'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>One-Time Privacy Safety Feature</span>
        </motion.div>
        <h1 className={`text-3xl font-extrabold tracking-tight ${isLowSignalGlobal ? 'text-white' : 'text-slate-900'}`}>
          Share Journey & ETA
        </h1>
        <p className={`text-sm mt-1 font-medium ${isLowSignalGlobal ? 'text-slate-300' : 'text-slate-500'}`}>
          Send a quick status update to a trusted friend or family member.
        </p>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl p-6 sm:p-8 space-y-6 ${
          isLowSignalGlobal
            ? 'bg-slate-900 border-2 border-slate-700 text-slate-100 shadow-2xl'
            : 'bg-white border border-purple-100 shadow-xl shadow-purple-900/5'
        }`}
      >
        
        {/* Route Summary Pill - ONLY shown when a route is actually selected, never showing static statement */}
        {selectedRoute && (
          <div className={`p-4 rounded-2xl flex items-center justify-between ${
            isLowSignalGlobal ? 'bg-slate-800 border border-slate-700' : 'bg-purple-50/80 border border-purple-100'
          }`}>
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                isLowSignalGlobal ? 'text-amber-400 font-mono' : 'text-slate-400'
              }`}>Selected Route</span>
              <span className={`font-extrabold text-sm ${
                isLowSignalGlobal ? 'text-white' : 'text-slate-900'
              }`}>{selectedRoute.name}</span>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold block ${
                isLowSignalGlobal ? 'text-amber-300' : 'text-brand-purple'
              }`}>{selectedRoute.durationMinutes} mins</span>
              <span className={`text-[11px] ${
                isLowSignalGlobal ? 'text-slate-300' : 'text-slate-500'
              }`}>{selectedRoute.distanceKm} km</span>
            </div>
          </div>
        )}

        {!isShared ? (
          <form onSubmit={handleShareETA} className="space-y-6">
            
            {/* Contact Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold uppercase tracking-wider ${
                  isLowSignalGlobal ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Pick Trusted Contact
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomContact(!useCustomContact)}
                  className={`text-xs font-bold hover:underline ${
                    isLowSignalGlobal ? 'text-amber-300' : 'text-brand-purple'
                  }`}
                >
                  {useCustomContact ? "Choose Saved Contact" : "+ Add Custom Number"}
                </button>
              </div>

              {!useCustomContact ? (
                contactsList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {contactsList.map((contact) => {
                      const isSelected = selectedContact?.id === contact.id;
                      return (
                        <div
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? (isLowSignalGlobal ? 'border-amber-400 bg-slate-800 ring-2 ring-amber-400' : 'border-brand-purple bg-purple-50 ring-2 ring-purple-300')
                              : (isLowSignalGlobal ? 'border-slate-700 bg-slate-950/60 hover:border-slate-600' : 'border-slate-200 hover:border-purple-200 bg-slate-50/50')
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-10 h-10 rounded-full ${contact.avatarBg} text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0`}>
                              {contact.name.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <span className={`font-bold text-sm block truncate ${isLowSignalGlobal ? 'text-white' : 'text-slate-900'}`}>{contact.name}</span>
                              <span className={`text-xs block truncate ${isLowSignalGlobal ? 'text-slate-300' : 'text-slate-500'}`}>{contact.phone}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await deleteEmergencyContact(contact.id);
                              setContactsList(prev => prev.filter(c => c.id !== contact.id));
                              if (selectedContact?.id === contact.id) {
                                setSelectedContact(contactsList.find(c => c.id !== contact.id) || null as any);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-slate-100"
                            title="Delete contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`p-4 rounded-2xl border text-center text-xs ${
                    isLowSignalGlobal ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    No saved contacts yet. Click <strong>+ Add Custom Number</strong> above to add one.
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      required
                      className={`p-3 rounded-2xl border text-sm font-medium ${
                        isLowSignalGlobal ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'border-slate-200 text-slate-800'
                      }`}
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      required
                      className={`p-3 rounded-2xl border text-sm font-medium ${
                        isLowSignalGlobal ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isSavingContact || !customName.trim() || !customPhone.trim()}
                    onClick={async () => {
                      if (!customName.trim() || !customPhone.trim()) return;
                      setIsSavingContact(true);
                      try {
                        const saved = await addEmergencyContact({
                          name: customName.trim(),
                          phone: customPhone.trim(),
                          relationship: 'Trusted',
                          avatarBg: 'bg-purple-600'
                        });
                        if (saved) {
                          setContactsList(prev => [saved, ...prev.filter(c => c.id !== saved.id)]);
                          setSelectedContact(saved);
                          setCustomName("");
                          setCustomPhone("");
                          setUseCustomContact(false);
                        }
                      } finally {
                        setIsSavingContact(false);
                      }
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      isLowSignalGlobal ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700' : 'bg-purple-50 border-purple-200 text-brand-purple hover:bg-purple-100'
                    } ${isSavingContact ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {isSavingContact ? "Saving..." : "Save Contact to Account"}
                  </button>
                </div>
              )}
            </div>

            {/* Arrival Time Input */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold uppercase tracking-wider block ${
                isLowSignalGlobal ? 'text-slate-300' : 'text-slate-500'
              }`}>
                Expected Arrival Time
              </label>
              <div className="relative flex items-center">
                <Clock className={`w-5 h-5 absolute left-3.5 ${isLowSignalGlobal ? 'text-amber-400' : 'text-purple-600'}`} />
                <input
                  type="text"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  placeholder="e.g. 10:15 PM"
                  required
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-sm font-semibold ${
                    isLowSignalGlobal ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>

            {/* Message Preview Box */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isLowSignalGlobal ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-wider block ${
                isLowSignalGlobal ? 'text-amber-300 font-mono' : 'text-slate-500'
              }`}>
                SMS / WhatsApp Preview
              </span>
              <p className={`text-xs font-medium leading-relaxed italic p-3 rounded-xl border ${
                isLowSignalGlobal ? 'bg-slate-950 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-100'
              }`}>
                "{generatedMessage}"
              </p>
            </div>

            {/* Share CTA Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6C2BD9] via-[#7C3AED] to-[#FF4D8D] text-white font-bold text-base shadow-lg shadow-purple-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span>{isJourneyStarted ? `Share Live ETA with ${contactName.split(' ')[0]}` : `Start Journey & Activate Live ETA`}</span>
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
              <h2 className={`text-2xl font-bold ${isLowSignalGlobal ? 'text-white' : 'text-slate-900'}`}>ETA Shared Successfully!</h2>
              <p className={`text-sm mt-1 ${isLowSignalGlobal ? 'text-slate-300' : 'text-slate-500'}`}>
                Sent message notification preview to <strong className={isLowSignalGlobal ? 'text-amber-300' : 'text-slate-800'}>{contactName}</strong> ({contactPhone}).
              </p>
            </div>

            {/* Copy SMS Link */}
            <div className={`p-4 rounded-2xl border text-left space-y-2 ${
              isLowSignalGlobal ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${isLowSignalGlobal ? 'text-slate-300' : 'text-slate-500'}`}>Outgoing Message Content:</span>
                <button
                  onClick={handleCopyMessage}
                  className={`text-xs font-bold flex items-center gap-1 hover:underline ${
                    isLowSignalGlobal ? 'text-amber-300' : 'text-brand-purple'
                  }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? "Copied!" : "Copy Text"}</span>
                </button>
              </div>
              <p className={`text-xs p-3 rounded-xl border ${
                isLowSignalGlobal ? 'bg-slate-950 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-200'
              }`}>
                {generatedMessage}
              </p>
            </div>

            {/* "Start Navigation" or "I've Arrived Safely" Action Buttons */}
            {!hasArrivedSafely ? (
              <div className="pt-2 space-y-3">
                {onStartJourney && (
                  <button
                    onClick={onStartJourney}
                    className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Start Active Navigation (Large Map)</span>
                  </button>
                )}
                <button
                  onClick={handleArrivedSafely}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5 text-amber-200 fill-amber-200" />
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
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-center gap-2 text-center ${
          isLowSignalGlobal ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-purple-50/70 border-purple-100 text-purple-900'
        }`}>
          <Lock className={`w-4 h-4 flex-shrink-0 ${isLowSignalGlobal ? 'text-amber-400' : 'text-brand-purple'}`} />
          <span>
            <strong>Privacy Assurance:</strong> This is a one-time message. Saahat never continuously tracks or stores your live GPS location.
          </span>
        </div>

      </motion.div>

      {/* Shared ETA History Section - Only displayed when ETAs have actually been shared */}
      {sharedETAHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-6 border shadow-sm space-y-3 ${
            isLowSignalGlobal
              ? 'bg-slate-900 border-slate-800 text-slate-100'
              : 'bg-white border-purple-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className={`w-4 h-4 ${isLowSignalGlobal ? 'text-amber-400' : 'text-brand-purple'}`} />
              <h3 className={`font-bold text-sm ${isLowSignalGlobal ? 'text-white' : 'text-slate-900'}`}>
                Shared ETA History ({sharedETAHistory.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                clearSharedETAHistory();
                setSharedETAHistory([]);
              }}
              className={`text-[11px] font-semibold hover:underline flex items-center gap-1 ${
                isLowSignalGlobal ? 'text-slate-400 hover:text-rose-400' : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {sharedETAHistory.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                  isLowSignalGlobal
                    ? 'bg-slate-950/60 border-slate-800 text-slate-200'
                    : 'bg-purple-50/50 border-purple-100 text-slate-800'
                }`}
              >
                <div className="space-y-1 flex-1 mr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm">{item.recipientName}</span>
                    {item.recipientPhone && (
                      <span className="text-[11px] text-slate-400">({item.recipientPhone})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                    <span>Route: <strong className="text-slate-700 dark:text-slate-300">{item.routeName.split('—')[0].trim()}</strong></span>
                    <span>• Expected: <strong className="text-emerald-600 dark:text-emerald-400">{item.expectedArrivalTime}</strong></span>
                    <span>• Shared at: {item.sharedAt}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const updated = removeSharedETAHistoryItem(item.id);
                    setSharedETAHistory(updated);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Remove from history"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  );
};
