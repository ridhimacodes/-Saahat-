import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageType, TimeOfDay, UserProfile, RouteOption, CommunityNote, TravelMode } from './types';
import { INITIAL_USER_PROFILE, MOCK_ROUTES, INITIAL_COMMUNITY_NOTES, TRUSTED_CONTACTS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { RouteSearchPage } from './components/RouteSearchPage';
import { RouteResultsPage } from './components/RouteResultsPage';
import { ShareJourneyPage } from './components/ShareJourneyPage';
import { CommunityNotesPage } from './components/CommunityNotesPage';
import { AboutPrivacyPage } from './components/AboutPrivacyPage';
import { LowSignalPage } from './components/LowSignalPage';
import { ActiveJourneyPage } from './components/ActiveJourneyPage';
import { SOSModal } from './components/SOSModal';
import { SaahatAssistant } from './components/SaahatAssistant';
import { User, X, Camera, CheckCircle2, Plus, Trash2, MapPin, LogOut } from 'lucide-react';
import { generateRealRoutes, recalculateRouteScoresForTime, getLiveTimeOfDay } from './services/routing';
import { 
  fetchUserProfile, 
  saveUserProfile, 
  fetchCommunityNotes, 
  createCommunityNote,
  getCurrentUser,
  signInWithEmail,
  signUpWithEmail,
  signOutUser
} from './services/supabaseService';
import { supabase } from './config/supabase';

export function App() {
  const [activePage, setActivePage] = useState<PageType>('home');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getLiveTimeOfDay());

  // Periodically update live time of day to match system clock automatically
  useEffect(() => {
    const updateTime = () => setTimeOfDay(getLiveTimeOfDay());
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocLabel, setNewLocLabel] = useState('Home');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [isLowSignalGlobal, setIsLowSignalGlobal] = useState(false);
  const [isSOSOpenDirectly, setIsSOSOpenDirectly] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Search & Route State (Started empty by default as requested)
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [travelMode, setTravelMode] = useState<TravelMode>('CAB');
  const [routes, setRoutes] = useState<RouteOption[]>(MOCK_ROUTES.default);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("route-best");
  const [isJourneyStarted, setIsJourneyStarted] = useState<boolean>(false);

  // Community Notes Feed State
  const [communityNotes, setCommunityNotes] = useState<CommunityNote[]>(INITIAL_COMMUNITY_NOTES);

  // Supabase User Session & Profile Sync
  useEffect(() => {
    getCurrentUser().then((user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserProfile().then((profile) => {
          if (profile) setUserProfile(profile);
        });
      }
    });

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const user = session?.user || null;
        setCurrentUser(user);
        if (user) {
          const profile = await fetchUserProfile();
          if (profile) setUserProfile(profile);
        } else {
          setUserProfile(INITIAL_USER_PROFILE);
        }
      });
      return () => subscription.unsubscribe();
    }
    return undefined;
  }, []);

  useEffect(() => {
    fetchCommunityNotes().then((notes) => {
      if (notes && notes.length > 0) setCommunityNotes(notes);
    });
  }, []);

  // Browser History Navigation Manager
  const changePage = (newPage: PageType, replace = false) => {
    if (newPage === activePage) return;
    if (!replace) {
      window.history.pushState({ page: newPage }, '', `#${newPage}`);
    } else {
      window.history.replaceState({ page: newPage }, '', `#${newPage}`);
    }
    setActivePage(newPage);
  };

  const handleGoBack = () => {
    if (window.history.state && window.history.state.page && window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback hierarchy
      switch (activePage) {
        case 'results':
          changePage('search', true);
          break;
        case 'share':
        case 'journey':
          changePage('results', true);
          break;
        case 'search':
        case 'community':
        case 'about':
        case 'lowsignal':
        default:
          changePage('home', true);
          break;
      }
    }
  };

  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ page: 'home' }, '', '#home');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.page) {
        setActivePage(event.state.page);
      } else {
        const hashPage = window.location.hash.replace('#', '') as PageType;
        if (['home', 'search', 'results', 'share', 'journey', 'community', 'about', 'lowsignal'].includes(hashPage)) {
          setActivePage(hashPage);
        } else {
          setActivePage('home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Recalculate routes dynamically whenever timeOfDay or base routes change
  const timeEvaluatedRoutes = recalculateRouteScoresForTime(routes, timeOfDay);
  const selectedRoute = timeEvaluatedRoutes.find(r => r.id === selectedRouteId) || timeEvaluatedRoutes[0];
  // A route is ONLY active if origin and destination are present AND user is currently on results, share, or journey screens
  const hasUserSearched = Boolean(origin && destination) && ['results', 'share', 'journey'].includes(activePage);
  const saarthiActiveRoute = hasUserSearched ? selectedRoute : null;

  const handleSearchComplete = async (newOrigin: string, newDestination: string, newMode?: TravelMode) => {
    setOrigin(newOrigin);
    setDestination(newDestination);
    const activeMode = newMode || travelMode;
    if (newMode) setTravelMode(newMode);
    
    // Dynamically calculate real routes and geocoded polylines for the chosen travel mode
    const computedRoutes = await generateRealRoutes(newOrigin, newDestination, activeMode);
    const scored = recalculateRouteScoresForTime(computedRoutes, timeOfDay);
    setRoutes(scored);
    if (scored.length > 0) {
      setSelectedRouteId(scored[0].id);
    }
    changePage('results');
  };

  const handleTravelModeChange = async (newMode: TravelMode) => {
    setTravelMode(newMode);
    if (origin && destination) {
      const computedRoutes = await generateRealRoutes(origin, destination, newMode);
      const scored = recalculateRouteScoresForTime(computedRoutes, timeOfDay);
      setRoutes(scored);
    }
  };

  const handleSelectAndShare = (route: RouteOption) => {
    setSelectedRouteId(route.id);
    changePage('share');
  };

  const handleProceedOnly = (route: RouteOption) => {
    setSelectedRouteId(route.id);
    setIsJourneyStarted(true);
    changePage('journey');
  };

  const handleStartJourneyFromShare = () => {
    setIsJourneyStarted(true);
    changePage('journey');
  };

  const handleEndJourney = () => {
    setIsJourneyStarted(false);
    setOrigin("");
    setDestination("");
    changePage('home');
  };

  const handleNavigateHome = () => {
    setIsJourneyStarted(false);
    setOrigin("");
    setDestination("");
    changePage('home');
  };

  const handleAddCommunityNote = (newNote: CommunityNote) => {
    setCommunityNotes(prev => [newNote, ...prev]);
    createCommunityNote(newNote).catch(err => console.warn('Supabase note save:', err));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthLoading(true);

    try {
      if (authMode === 'signin') {
        const res = await signInWithEmail(authEmail, authPassword);
        if (res.error) {
          setAuthError(res.error);
        } else if (res.user) {
          setCurrentUser(res.user);
          const p = await fetchUserProfile();
          if (p) setUserProfile(p);
          setAuthEmail('');
          setAuthPassword('');
        }
      } else {
        const res = await signUpWithEmail(authEmail, authPassword);
        if (res.error) {
          if (res.error.toLowerCase().includes('rate limit')) {
            setAuthError('Email rate limit reached on Supabase. In Supabase Dashboard > Authentication > Providers > Email, turn off "Confirm email" for instant accounts, or sign in if already registered.');
          } else {
            setAuthError(res.error);
          }
        } else if (res.user) {
          if (res.session) {
            setCurrentUser(res.user);
            const p = await fetchUserProfile();
            if (p) setUserProfile(p);
            setAuthEmail('');
            setAuthPassword('');
          } else {
            setAuthSuccess('Account registered! Please check your email to confirm your account, then click Sign In.');
            setAuthMode('signin');
          }
        }
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setUserProfile(INITIAL_USER_PROFILE);
    setIsProfileModalOpen(false);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${
      isLowSignalGlobal ? 'bg-slate-950 text-slate-100' : 'bg-[#F8F5FF]'
    }`}>
      
      {/* Persistent Navigation Header with Pinned SOS & Global Low Signal Toggle */}
      <Navbar
        activePage={activePage}
        setActivePage={(p) => changePage(p)}
        timeOfDay={timeOfDay}
        setTimeOfDay={setTimeOfDay}
        userProfile={userProfile}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onTriggerSOS={() => setIsSOSOpenDirectly(true)}
        isLowSignalGlobal={isLowSignalGlobal}
        setIsLowSignalGlobal={setIsLowSignalGlobal}
      />

      {/* Main Viewport Router with Framer Motion Page Transitions */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activePage}-${isLowSignalGlobal}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {activePage === 'home' && (
              <HomePage
                onNavigateToSearch={() => changePage('search')}
                onNavigateToAbout={() => changePage('about')}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                isLowSignalGlobal={isLowSignalGlobal}
                timeOfDay={timeOfDay}
                setTimeOfDay={setTimeOfDay}
              />
            )}

            {activePage === 'search' && (
              <RouteSearchPage
                onSearchComplete={handleSearchComplete}
                onBack={handleGoBack}
                timeOfDay={timeOfDay}
                setTimeOfDay={setTimeOfDay}
                isLowSignalGlobal={isLowSignalGlobal}
                travelMode={travelMode}
                setTravelMode={setTravelMode}
              />
            )}

            {activePage === 'results' && (
              <RouteResultsPage
                origin={origin || "Selected Origin"}
                destination={destination || "Selected Destination"}
                routes={timeEvaluatedRoutes}
                selectedRouteId={selectedRouteId}
                setSelectedRouteId={setSelectedRouteId}
                onSelectAndShare={handleSelectAndShare}
                onProceedOnly={handleProceedOnly}
                onBackToSearch={handleGoBack}
                timeOfDay={timeOfDay}
                setTimeOfDay={setTimeOfDay}
                isLowSignalGlobal={isLowSignalGlobal}
                travelMode={travelMode}
                onTravelModeChange={handleTravelModeChange}
                onNavigateToLowSignal={() => {
                  setIsLowSignalGlobal(true);
                  changePage('lowsignal');
                }}
              />
            )}

            {activePage === 'share' && (
              <ShareJourneyPage
                selectedRoute={saarthiActiveRoute}
                isJourneyStarted={isJourneyStarted}
                onNavigateHome={handleNavigateHome}
                onStartJourney={handleStartJourneyFromShare}
                onBack={handleGoBack}
                isLowSignalGlobal={isLowSignalGlobal}
              />
            )}

            {activePage === 'journey' && (
              <ActiveJourneyPage
                selectedRoute={selectedRoute}
                origin={origin || "Selected Origin"}
                destination={destination || "Selected Destination"}
                onEndJourney={handleEndJourney}
                onNavigateHome={handleNavigateHome}
                isLowSignalGlobal={isLowSignalGlobal}
                timeOfDay={timeOfDay}
              />
            )}

            {activePage === 'community' && (
              <CommunityNotesPage
                notes={communityNotes}
                onAddNote={handleAddCommunityNote}
                onBack={handleGoBack}
                isLowSignalGlobal={isLowSignalGlobal}
              />
            )}

            {activePage === 'about' && (
              <AboutPrivacyPage
                onNavigateSearch={() => changePage('search')}
                onBack={handleGoBack}
                isLowSignalGlobal={isLowSignalGlobal}
              />
            )}

            {activePage === 'lowsignal' && (
              <LowSignalPage
                selectedRoute={selectedRoute}
                onExitLowSignal={() => {
                  setIsLowSignalGlobal(false);
                  handleGoBack();
                }}
                onBack={handleGoBack}
                origin={origin || "IGDTUW Campus, Kashmiri Gate, Delhi"}
                destination={destination || "India Gate, New Delhi"}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Persistent SOS Floating Action Button & Modal */}
      <SOSModal 
        trustedContact={TRUSTED_CONTACTS[0]} 
        isOpenDirectly={isSOSOpenDirectly}
        onCloseDirectly={() => setIsSOSOpenDirectly(false)}
      />

      {/* Persistent Saarthi Chatbot (Bottom-Left Corner) */}
      <SaahatAssistant
        activePage={activePage}
        selectedRoute={saarthiActiveRoute}
        origin={origin}
        destination={destination}
        timeOfDay={timeOfDay}
        isLowSignalGlobal={isLowSignalGlobal}
        userProfile={userProfile}
        onTriggerSOS={() => setIsSOSOpenDirectly(true)}
      />

      {/* User Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-purple-100 relative space-y-6"
            >
              <div className="flex items-center justify-between">
                {currentUser ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                    {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors ml-auto"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!currentUser ? (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 mx-auto flex items-center justify-center font-bold">
                      <User className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {authMode === 'signin' ? 'Account Sign In' : 'Create Account'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {authMode === 'signin' 
                        ? 'Sign in to access your saved profile and emergency contacts.' 
                        : 'Create your account to store personal safety settings.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1 bg-purple-50 p-1 rounded-2xl border border-purple-100">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signin'); setAuthError(null); setAuthSuccess(null); }}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${
                        authMode === 'signin' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-800 hover:bg-purple-100/60'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signup'); setAuthError(null); setAuthSuccess(null); }}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${
                        authMode === 'signup' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-800 hover:bg-purple-100/60'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed">
                      {authError}
                    </div>
                  )}

                  {authSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium leading-relaxed">
                      {authSuccess}
                    </div>
                  )}

                  <form onSubmit={handleAuthSubmit} className="space-y-3.5 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="w-full text-xs p-3 rounded-2xl bg-purple-50/50 border border-purple-200 text-slate-800 outline-hidden focus:border-brand-purple"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full text-xs p-3 rounded-2xl bg-purple-50/50 border border-purple-200 text-slate-800 outline-hidden focus:border-brand-purple"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-50 transition-all shadow-md shadow-purple-500/20"
                    >
                      {isAuthLoading ? 'Please wait...' : authMode === 'signin' ? 'Sign In to Account' : 'Create Account'}
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="text-center space-y-3">
                    <div className="relative inline-block">
                      <img
                        src={userProfile.avatarUrl}
                        alt={userProfile.name || "Profile"}
                        className="w-24 h-24 rounded-full object-cover border-4 border-brand-purple mx-auto shadow-md bg-purple-50"
                      />
                      <label className="absolute bottom-1 right-1 p-1.5 bg-brand-pink text-white rounded-full cursor-pointer hover:scale-110 transition-transform">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  const updated = { ...userProfile, avatarUrl: ev.target.result as string };
                                  setUserProfile(updated);
                                  saveUserProfile(updated);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="text"
                        value={userProfile.name}
                        placeholder="Enter your name"
                        onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            await saveUserProfile(userProfile);
                            const refreshed = await fetchUserProfile();
                            if (refreshed) setUserProfile(refreshed);
                            setIsProfileModalOpen(false);
                          }
                        }}
                        className="text-xl font-bold text-slate-900 text-center w-full border-b border-purple-200 focus:border-brand-purple outline-hidden bg-transparent pb-1"
                      />
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-brand-purple text-xs font-bold mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {currentUser?.email || 'Verified User Account'}
                      </span>
                    </div>
                  </div>

                  {/* Saved Quick Locations */}
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Saved Quick Locations
                      </span>
                      {!isAddingLocation && (
                        <button
                          type="button"
                          onClick={() => setIsAddingLocation(true)}
                          className="px-2.5 py-1 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Location</span>
                        </button>
                      )}
                    </div>

                    {/* Add Location Inline Form */}
                    {isAddingLocation && (
                      <div className="p-3.5 rounded-2xl bg-purple-50/90 border border-purple-200 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Label
                            </label>
                            <select
                              value={newLocLabel}
                              onChange={(e) => setNewLocLabel(e.target.value)}
                              className="w-full text-xs font-bold p-2 rounded-xl bg-white border border-purple-200 text-slate-800 outline-hidden"
                            >
                              <option value="Home">Home</option>
                              <option value="Work">Work</option>
                              <option value="College">College</option>
                              <option value="Gym">Gym</option>
                              <option value="Favorite">Favorite</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Address / Place Name
                          </label>
                          <input
                            type="text"
                            value={newLocAddress}
                            placeholder="e.g. Connaught Place, New Delhi"
                            onChange={(e) => setNewLocAddress(e.target.value)}
                            className="w-full text-xs p-2 rounded-xl bg-white border border-purple-200 text-slate-800 outline-hidden focus:border-brand-purple"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingLocation(false);
                              setNewLocAddress('');
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/60 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={!newLocAddress.trim()}
                            onClick={async () => {
                              if (!newLocAddress.trim()) return;
                              const newLocation = {
                                label: newLocLabel,
                                address: newLocAddress.trim()
                              };
                              const updated = {
                                ...userProfile,
                                savedLocations: [...userProfile.savedLocations, newLocation]
                              };
                              setUserProfile(updated);
                              setIsAddingLocation(false);
                              setNewLocAddress('');
                              await saveUserProfile(updated);
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-all shadow-xs"
                          >
                            Save Location
                          </button>
                        </div>
                      </div>
                    )}

                    {userProfile.savedLocations.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {userProfile.savedLocations.map((loc, idx) => (
                          <div key={idx} className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block truncate">{loc.label}</span>
                                <span className="text-slate-500 truncate block text-[11px] max-w-[190px] sm:max-w-[240px]">{loc.address}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                const updatedList = userProfile.savedLocations.filter((_, i) => i !== idx);
                                const updated = { ...userProfile, savedLocations: updatedList };
                                setUserProfile(updated);
                                await saveUserProfile(updated);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                              title="Delete saved location"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      !isAddingLocation && (
                        <p className="text-xs text-slate-400 italic text-center py-2">No saved locations yet. Tap "+ Add Location" to save your Home, Work, or College.</p>
                      )
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await saveUserProfile(userProfile);
                        const refreshed = await fetchUserProfile();
                        if (refreshed) setUserProfile(refreshed);
                        setIsProfileModalOpen(false);
                      }}
                      className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 hover:scale-105 transition-all"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
