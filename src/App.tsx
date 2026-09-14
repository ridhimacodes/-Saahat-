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
import { User, X, Camera, CheckCircle2 } from 'lucide-react';
import { generateRealRoutes, recalculateRouteScoresForTime, getLiveTimeOfDay } from './services/routing';
import { fetchUserProfile, saveUserProfile, fetchCommunityNotes, createCommunityNote } from './services/supabaseService';

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
  const [isLowSignalGlobal, setIsLowSignalGlobal] = useState(false);
  const [isSOSOpenDirectly, setIsSOSOpenDirectly] = useState(false);

  // Search & Route State (Started empty by default as requested)
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [travelMode, setTravelMode] = useState<TravelMode>('CAB');
  const [routes, setRoutes] = useState<RouteOption[]>(MOCK_ROUTES.default);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("route-best");
  const [isJourneyStarted, setIsJourneyStarted] = useState<boolean>(false);

  // Community Notes Feed State
  const [communityNotes, setCommunityNotes] = useState<CommunityNote[]>(INITIAL_COMMUNITY_NOTES);

  // Invisible Supabase Initial Sync (loads persisted data if authenticated, otherwise preserves mock defaults seamlessly)
  useEffect(() => {
    fetchUserProfile().then((profile) => {
      if (profile) setUserProfile(profile);
    });
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
    handleGoBack();
  };

  const handleNavigateHome = () => {
    setIsJourneyStarted(false);
    changePage('home');
  };

  const handleAddCommunityNote = (newNote: CommunityNote) => {
    setCommunityNotes(prev => [newNote, ...prev]);
    createCommunityNote(newNote).catch(err => console.warn('Supabase note save:', err));
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
                selectedRoute={selectedRoute}
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

      {/* Persistent Saahat Assistant Chatbot (Bottom-Left Corner) */}
      <SaahatAssistant
        activePage={activePage}
        selectedRoute={selectedRoute}
        origin={origin}
        destination={destination}
        timeOfDay={timeOfDay}
        isLowSignalGlobal={isLowSignalGlobal}
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
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

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
                    className="text-xl font-bold text-slate-900 text-center w-full border-b border-purple-200 focus:border-brand-purple outline-hidden bg-transparent pb-1"
                  />
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-brand-purple text-xs font-bold mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified User Account
                  </span>
                </div>
              </div>

              {/* Saved Quick Locations */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Saved Quick Locations
                </span>
                {userProfile.savedLocations.length > 0 ? (
                  userProfile.savedLocations.map((loc, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{loc.label}</span>
                      <span className="text-slate-500 truncate max-w-[200px]">{loc.address}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-2">No saved locations yet.</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={async () => {
                    await saveUserProfile(userProfile);
                    setIsProfileModalOpen(false);
                  }}
                  className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 hover:scale-105 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
