import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ShieldCheck, UserCheck, Clock, CheckCircle2, Send, Lock, Sparkles, Heart, Copy, Check, ArrowLeft, History, Trash2, X, Plus, MessageSquare, WifiOff, Bell, BatteryLow, AlertTriangle } from 'lucide-react';
import { RouteOption, TrustedContact, CheckInChannel, ActiveCheckInJourney } from '../types';
import { TRUSTED_CONTACTS } from '../data/mockData';
import { fetchEmergencyContacts, addEmergencyContact, deleteEmergencyContact } from '../services/supabaseService';
import { 
  getSharedETAHistory, 
  addSharedETAHistory, 
  clearSharedETAHistory, 
  removeSharedETAHistoryItem, 
  SharedETAHistoryItem 
} from '../services/historyService';
import { 
  createActiveCheckIn, 
  dispatchStatusMessage, 
  confirmArrivedSafely,
  isDeviceOnline,
  getActiveCheckIn,
  subscribeToCheckIn,
  handleCheckInOption1_RunningLate,
  handleCheckInOption2_LowSignal,
  handleCheckInOption3_NeedHelpNow,
  scheduleCustomArrivalMessage
} from '../services/checkInService';

interface ShareJourneyPageProps {
  selectedRoute?: RouteOption | null;
  onNavigateHome: () => void;
  onStartJourney?: (contact?: TrustedContact) => void;
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
  const [contactNotice, setContactNotice] = useState<string | null>(null);
  const [sharedETAHistory, setSharedETAHistory] = useState<SharedETAHistoryItem[]>(() => getSharedETAHistory());

  // Sync saved emergency contacts from Supabase in background
  React.useEffect(() => {
    fetchEmergencyContacts().then((loaded) => {
      if (loaded && loaded.length > 0) {
        setContactsList(loaded);
        setSelectedContact(loaded[0]);
      } else {
        setContactsList([]);
      }
    });
  }, []);
  
  const [customArrivalMessage, setCustomArrivalMessage] = useState("");
  const [testDurationMinutes, setTestDurationMinutes] = useState<number | null>(null);
  const [channelUsedTag, setChannelUsedTag] = useState<CheckInChannel>('whatsapp');
  const [activeJourney, setActiveJourney] = useState<ActiveCheckInJourney | null>(() => getActiveCheckIn());
  const [isMessageScheduled, setIsMessageScheduled] = useState(false);

  React.useEffect(() => {
    const unsub = subscribeToCheckIn(setActiveJourney);
    return unsub;
  }, []);

  const effectiveDuration = testDurationMinutes !== null 
    ? testDurationMinutes 
    : (selectedRoute?.durationMinutes || 15);

  // Compute realistic live arrival time (Now + duration)
  const computeLiveETA = (dur: number = effectiveDuration) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + dur);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const [arrivalTime, setArrivalTime] = useState(computeLiveETA());
  
  // Re-sync arrival time when effective duration changes
  const handleSelectDuration = (mins: number | null) => {
    setTestDurationMinutes(mins);
    const dur = mins !== null ? mins : (selectedRoute?.durationMinutes || 15);
    setArrivalTime(computeLiveETA(dur));
  };

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

  const generatedMessage = isJourneyStarted
    ? `I have started my journey via ${routeDisplayName} (${effectiveDuration} mins), expected arrival by ${arrivalTime}. Powered by Saahat.`
    : `Journey pending: Route planned via ${routeDisplayName} (${effectiveDuration} mins). Live ETA activates upon journey start. Powered by Saahat.`;

  const handleShareETA = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that a phone number is available
    if (!contactPhone || !contactPhone.trim()) {
      alert('Please select or add an emergency contact with a phone number before sharing.');
      return;
    }

    const historyId = `eta-hist-${Date.now()}`;

    // 1. Create Active Check-in Journey with status-gated scheduled arrival message
    createActiveCheckIn({
      historyId,
      recipientName: contactName,
      recipientPhone: contactPhone,
      routeName: selectedRoute ? selectedRoute.name : 'Custom Journey',
      durationMinutes: effectiveDuration,
      expectedArrivalTime: arrivalTime,
      customArrivalMessage: customArrivalMessage.trim() || undefined
    });

    // 2. Dispatch departure notification with WhatsApp primary and SMS offline fallback
    const initialMsg = `🛡️ Saahat Safety Update\n\nHi, I'm on my way via ${routeDisplayName}.\n⏱️ Expected Arrival: ${arrivalTime} (~${effectiveDuration} mins).\n\nPowered by Saahat — Safe Journeys for Women.`;
    const dispatchRes = dispatchStatusMessage(contactPhone, initialMsg);
    setChannelUsedTag(dispatchRes.channel);
    setIsShared(true);

    // 3. Record strictly to Shared ETA History
    const updatedHistory = addSharedETAHistory({
      recipientName: contactName,
      recipientPhone: contactPhone,
      routeName: selectedRoute ? selectedRoute.name : 'Custom Journey',
      durationMinutes: effectiveDuration,
      distanceKm: selectedRoute ? selectedRoute.distanceKm : 0,
      expectedArrivalTime: arrivalTime,
      checkinStatus: 'pending',
      customArrivalMessage: customArrivalMessage.trim() || undefined,
      customMessageReleased: false,
      channelUsed: dispatchRes.channel
    });
    setSharedETAHistory(updatedHistory);

    const activeContactObj: TrustedContact = useCustomContact ? {
      id: `custom-${Date.now()}`,
      name: customName || 'Emergency Contact',
      phone: customPhone,
      relationship: 'Trusted Contact',
      avatarBg: 'bg-purple-600'
    } : selectedContact;

    // If journey hasn't started yet, start the journey first with selected trusted contact
    if (!isJourneyStarted && onStartJourney) {
      onStartJourney(activeContactObj);
    }

    // Format the phone number for wa.me (remove spaces/dashes, add country code if missing)
    let cleanPhone = contactPhone.replace(/[\s\-\(\)]/g, '');
    // If no country code prefix, assume India (+91)
    if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone;
    } else if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.substring(1); // remove the leading +
    }

    // Helper to open WhatsApp with a given message
    const openWhatsApp = (message: string) => {
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      setIsShared(true);
    };

    // Try to get current location and include it in the message
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          const message = `🛡️ Saahat Safety Update\n\nHi, I'm on my way via ${routeDisplayName}.\n⏱️ ETA: ${arrivalTime} (~${effectiveDuration} mins)\n📍 My current location: ${mapsLink}\n\nPowered by Saahat — Safe Journeys for Women.`;
          openWhatsApp(message);
        },
        (_geoError) => {
          // Location denied or unavailable — send message without location
          const message = `🛡️ Saahat Safety Update\n\nHi, I'm on my way via ${routeDisplayName}.\n⏱️ ETA: ${arrivalTime} (~${effectiveDuration} mins)\n📍 Location unavailable (permission not granted)\n\nPowered by Saahat — Safe Journeys for Women.`;
          openWhatsApp(message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      // Geolocation API not available — send without location
      const message = `🛡️ Saahat Safety Update\n\nHi, I'm on my way via ${routeDisplayName}.\n⏱️ ETA: ${arrivalTime} (~${effectiveDuration} mins)\n\nPowered by Saahat — Safe Journeys for Women.`;
      openWhatsApp(message);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleArrivedSafely = () => {
    confirmArrivedSafely();
    setHasArrivedSafely(true);
    setSharedETAHistory(getSharedETAHistory());
    setActiveJourney(getActiveCheckIn());
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
            
            {/* ============================================================= */}
            {/* SECTION A: Active Check-In                                    */}
            {/* ============================================================= */}
            <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
              isLowSignalGlobal 
                ? 'bg-slate-900/90 border-slate-700 text-white' 
                : 'bg-white border-purple-100 shadow-purple-900/5'
            }`}>
              <div className="flex items-center justify-between border-b border-inherit/40 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Section A: Active Check-In
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Proactive contact monitoring & check-in safety options
                    </p>
                  </div>
                </div>

                {/* Channel Badge (WhatsApp / SMS) */}
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                  isDeviceOnline()
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                }`}>
                  {isDeviceOnline() ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>WhatsApp Primary</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                      <span>SMS Fallback (Offline)</span>
                    </>
                  )}
                </span>
              </div>

              {/* Contact Information & Selector */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Designated Contact: <strong className="text-slate-800 dark:text-white">{contactName}</strong> {contactPhone && `(${contactPhone})`}
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomContact(!useCustomContact)}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {useCustomContact ? "Choose Saved Contact" : "+ Add Custom Number"}
                  </button>
                </div>

                {!useCustomContact ? (
                  contactsList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {contactsList.map((contact) => {
                        const isSelected = selectedContact?.id === contact.id;
                        return (
                          <div
                            key={contact.id}
                            onClick={() => setSelectedContact(contact)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                              isSelected
                                ? (isLowSignalGlobal ? 'border-amber-400 bg-slate-800 ring-2 ring-amber-400' : 'border-brand-purple bg-purple-50 ring-2 ring-purple-300')
                                : (isLowSignalGlobal ? 'border-slate-700 bg-slate-950/60 hover:border-slate-600' : 'border-slate-200 hover:border-purple-200 bg-slate-50/50')
                            }`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className={`w-8 h-8 rounded-full ${contact.avatarBg} text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0`}>
                                {contact.name.charAt(0)}
                              </div>
                              <div className="overflow-hidden">
                                <span className={`font-bold text-xs block truncate ${isLowSignalGlobal ? 'text-white' : 'text-slate-900'}`}>{contact.name}</span>
                                <span className={`text-[11px] block truncate ${isLowSignalGlobal ? 'text-slate-300' : 'text-slate-500'}`}>{contact.phone}</span>
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
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded hover:bg-slate-100"
                              title="Delete contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`p-3 rounded-2xl border text-center text-xs ${
                      isLowSignalGlobal ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      No saved contacts. Click <strong>+ Add Custom Number</strong> to add one.
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Contact Name"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        required
                        className={`p-2.5 rounded-xl border text-xs font-medium ${
                          isLowSignalGlobal ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-200 text-slate-800'
                        }`}
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number (e.g. 9876543210)"
                        value={customPhone}
                        onChange={(e) => setCustomPhone(e.target.value)}
                        required
                        className={`p-2.5 rounded-xl border text-xs font-medium ${
                          isLowSignalGlobal ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isSavingContact || !customName.trim() || !customPhone.trim()}
                      onClick={async () => {
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
                      className="w-full py-2 rounded-xl text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 transition-colors"
                    >
                      {isSavingContact ? "Saving..." : "Save Contact to Account"}
                    </button>
                  </div>
                )}

                {/* Expected Arrival & Status Row */}
                <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Arrival</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                      {activeJourney?.newCheckinTime || activeJourney?.expectedArrivalTime || arrivalTime}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Check-In Status</span>
                    <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300">
                      {activeJourney ? (
                        activeJourney.checkinStatus === 'arrived_safely' ? '✓ Arrived Safely' :
                        activeJourney.checkinStatus === 'safe_delayed' ? `Running Late (${activeJourney.newCheckinTime})` :
                        activeJourney.checkinStatus === 'safe_low_signal' ? 'Low Battery / Offline' :
                        activeJourney.checkinStatus === 'help_requested' ? '⚠️ SOS Alert Dispatched' :
                        'Active Check-In Scheduled'
                      ) : 'Ready to Activate'}
                    </span>
                  </div>
                </div>

                {/* "I've Arrived Safely" Action Button */}
                <button
                  type="button"
                  onClick={handleArrivedSafely}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>I've Arrived Safely (Release Scheduled Message)</span>
                </button>

                {/* Check-In Status Quick Response Options */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Check-In Status Shortcut Options:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeJourney) {
                          handleCheckInOption1_RunningLate(15, 'Trisha');
                          setActiveJourney(getActiveCheckIn());
                        } else {
                          handleSelectDuration(effectiveDuration + 15);
                        }
                      }}
                      className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-bold text-left hover:bg-amber-100 transition-all"
                    >
                      <div className="flex items-center gap-1.5 font-extrabold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Running Late</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">+15m Reschedule</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (activeJourney) {
                          handleCheckInOption2_LowSignal('Trisha');
                          setActiveJourney(getActiveCheckIn());
                        } else {
                          alert("Start your journey first to activate low-battery backstop.");
                        }
                      }}
                      className="p-2.5 rounded-xl border border-sky-300 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 text-xs font-bold text-left hover:bg-sky-100 transition-all"
                    >
                      <div className="flex items-center gap-1.5 font-extrabold">
                        <BatteryLow className="w-3.5 h-3.5 text-sky-600" />
                        <span>Low Battery/Signal</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">+45m Backstop</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (activeJourney) {
                          handleCheckInOption3_NeedHelpNow('Trisha');
                          setActiveJourney(getActiveCheckIn());
                        }
                        if (onStartJourney) onStartJourney();
                      }}
                      className="p-2.5 rounded-xl border border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs font-bold text-left hover:bg-rose-100 transition-all"
                    >
                      <div className="flex items-center gap-1.5 font-extrabold">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                        <span>Need Help Now</span>
                      </div>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-0.5">Emergency SOS</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* ============================================================= */}
            {/* SECTION B: Expected Arrival Time                              */}
            {/* ============================================================= */}
            <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
              isLowSignalGlobal 
                ? 'bg-slate-900/90 border-slate-700 text-white' 
                : 'bg-white border-purple-100 shadow-purple-900/5'
            }`}>
              <div className="flex items-center justify-between border-b border-inherit/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Section B: Expected Arrival Time
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Target clock arrival time with automated buffer allowances
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-300">
                  ~{effectiveDuration} mins
                </span>
              </div>

              <div className="space-y-3">
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

                {/* Quick-Select Buttons (Notice: 1-Min Fast Test is completely removed from here) */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-xs text-slate-400 font-bold mr-1">Quick Select:</span>
                  <button
                    type="button"
                    onClick={() => handleSelectDuration(null)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      testDurationMinutes === null
                        ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Route Est ({selectedRoute?.durationMinutes || 15}m)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDuration((selectedRoute?.durationMinutes || 15) + 15)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      testDurationMinutes === (selectedRoute?.durationMinutes || 15) + 15
                        ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    +15m Buffer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDuration((selectedRoute?.durationMinutes || 15) + 30)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      testDurationMinutes === (selectedRoute?.durationMinutes || 15) + 30
                        ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    +30m Buffer
                  </button>
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* SECTION C: Custom Arrival Message (Status-Gated)              */}
            {/* ============================================================= */}
            <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
              isLowSignalGlobal 
                ? 'bg-slate-900/90 border-slate-700 text-white' 
                : 'bg-white border-purple-100 shadow-purple-900/5'
            }`}>
              <div className="flex items-center justify-between border-b border-inherit/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Section C: Custom Arrival Message
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Held securely & released only upon confirmed safe arrival
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  Status-Gated
                </span>
              </div>

              <div className="space-y-3">
                <textarea
                  value={customArrivalMessage}
                  onChange={(e) => {
                    setCustomArrivalMessage(e.target.value);
                    setIsMessageScheduled(false);
                  }}
                  rows={3}
                  placeholder="Write a custom note to send upon safe arrival (e.g., 'Reached safe and sound! Inside now.')"
                  className={`w-full p-3.5 rounded-2xl border text-xs font-medium leading-relaxed resize-none ${
                    isLowSignalGlobal 
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold mr-1">Presets:</span>
                  {[
                    "Reached home safe and sound!",
                    "Inside the apartment now, all good.",
                    "Home safely, thanks for watching over me!"
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomArrivalMessage(preset);
                        setIsMessageScheduled(false);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-purple-50"
                    >
                      "{preset}"
                    </button>
                  ))}
                </div>

                {/* Schedule Message Confirmation Button */}
                <div className="pt-1 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!customArrivalMessage.trim()) return;
                      scheduleCustomArrivalMessage(customArrivalMessage.trim());
                      setIsMessageScheduled(true);
                    }}
                    disabled={!customArrivalMessage.trim()}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                      isMessageScheduled
                        ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                    }`}
                  >
                    {isMessageScheduled ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200" />
                        <span>Message Scheduled ✓</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Schedule Message</span>
                      </>
                    )}
                  </button>

                  {isMessageScheduled && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Saved to journey release</span>
                    </span>
                  )}
                </div>

                {/* Explicit Safety Notice */}
                <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-slate-800/70 border border-purple-100 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 leading-normal flex items-start gap-2">
                  <Lock className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                  <span>
                    <strong>Safety Protection:</strong> This message will <strong>NOT</strong> blindly fire at the clock time. It is tied to your journey and only released once you confirm your status upon arrival.
                  </span>
                </div>
              </div>
            </div>

            {/* Outgoing Message Preview Box */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isLowSignalGlobal ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-wider block ${
                isLowSignalGlobal ? 'text-amber-300 font-mono' : 'text-slate-500'
              }`}>
                SMS / WhatsApp Message Preview
              </span>
              <p className={`text-xs font-medium leading-relaxed italic p-3 rounded-xl border ${
                isLowSignalGlobal ? 'bg-slate-950 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-100'
              }`}>
                "{generatedMessage}"
              </p>
            </div>

            {/* Share & Start Journey Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6C2BD9] via-[#7C3AED] to-[#FF4D8D] text-white font-bold text-base shadow-lg shadow-purple-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span>{isJourneyStarted ? `Share Live ETA with ${contactName.split(' ')[0]}` : `Start Guardian Journey & Share ETA`}</span>
              </button>

              {!isJourneyStarted && onStartJourney && (
                <button
                  type="button"
                  onClick={() => {
                    const activeContactObj: TrustedContact = useCustomContact ? {
                      id: `custom-${Date.now()}`,
                      name: customName || 'Emergency Contact',
                      phone: customPhone,
                      relationship: 'Trusted Contact',
                      avatarBg: 'bg-purple-600'
                    } : selectedContact;
                    onStartJourney(activeContactObj);
                  }}
                  className={`w-full py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isLowSignalGlobal
                      ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                      : 'bg-purple-50 border-purple-200 text-brand-purple hover:bg-purple-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Start Journey Directly (Without WhatsApp Share)</span>
                </button>
              )}
            </div>

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
                    onClick={() => {
                      const activeContactObj: TrustedContact = useCustomContact ? {
                        id: `custom-${Date.now()}`,
                        name: customName || 'Emergency Contact',
                        phone: customPhone,
                        relationship: 'Trusted Contact',
                        avatarBg: 'bg-purple-600'
                      } : selectedContact;
                      onStartJourney(activeContactObj);
                    }}
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

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      let cleanPhone = contactPhone.replace(/[\s\-\(\)]/g, '');
                      if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('91')) {
                        cleanPhone = '91' + cleanPhone;
                      } else if (cleanPhone.startsWith('+')) {
                        cleanPhone = cleanPhone.substring(1);
                      }
                      const safeMsg = encodeURIComponent(`🛡️ Saahat Safety Update\n\nI have reached safely at my destination! All good. Powered by Saahat.`);
                      window.open(`https://wa.me/${cleanPhone}?text=${safeMsg}`, '_blank');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Notify {contactName.split(' ')[0]} via WhatsApp</span>
                  </button>
                  <button
                    onClick={onNavigateHome}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-bold hover:bg-emerald-100/50 transition-all"
                  >
                    Return to Home
                  </button>
                </div>
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
                <div className="space-y-1.5 flex-1 mr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm">{item.recipientName}</span>
                    {item.recipientPhone && (
                      <span className="text-[11px] text-slate-400">({item.recipientPhone})</span>
                    )}
                    {/* Status Badge */}
                    {item.checkinStatus === 'arrived_safely' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        ✓ Arrived Safely
                      </span>
                    )}
                    {item.checkinStatus === 'safe_delayed' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        Running Late ({item.newCheckinTime || 'Extended'})
                      </span>
                    )}
                    {item.checkinStatus === 'safe_low_signal' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                        Low Battery / Offline
                      </span>
                    )}
                    {item.checkinStatus === 'help_requested' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
                        ⚠️ SOS Triggered
                      </span>
                    )}
                    {item.checkinStatus === 'no_response' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
                        🚨 Escalated (No Response)
                      </span>
                    )}
                    {(!item.checkinStatus || item.checkinStatus === 'pending') && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                        Active Check-In
                      </span>
                    )}

                    {/* Channel Badge */}
                    {item.channelUsed === 'sms' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        📱 SMS (Offline Fallback)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        💬 WhatsApp
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                    <span>Route: <strong className="text-slate-700 dark:text-slate-300">{item.routeName.split('—')[0].trim()}</strong></span>
                    <span>• Expected: <strong className="text-emerald-600 dark:text-emerald-400">{item.expectedArrivalTime}</strong></span>
                    <span>• Shared at: {item.sharedAt}</span>
                  </div>
                  {item.customArrivalMessage && (
                    <div className="text-[10px] text-slate-400 italic">
                      Scheduled safe message: "{item.customArrivalMessage}"
                    </div>
                  )}
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
