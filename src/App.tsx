import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageType, TimeOfDay, UserProfile, RouteOption, CommunityNote } from './types';
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
import { User, X, Camera, CheckCircle2 } from 'lucide-react';
import { generateRealRoutes, recalculateRouteScoresForTime, getLiveTimeOfDay } from './services/routing';

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
  const [routes, setRoutes] = useState<RouteOption[]>(MOCK_ROUTES.default);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("route-best");

  // Community Notes Feed State
  const [communityNotes, setCommunityNotes] = useState<CommunityNote[]>(INITIAL_COMMUNITY_NOTES);

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

  const handleSearchComplete = async (newOrigin: string, newDestination: string) => {
    setOrigin(newOrigin);
    setDestination(newDestination);
    
    // Dynamically calculate real routes and geocoded polylines
    const computedRoutes = await generateRealRoutes(newOrigin, newDestination);
    const scored = recalculateRouteScoresForTime(computedRoutes, timeOfDay);
    setRoutes(scored);
    if (scored.length > 0) {
      setSelectedRouteId(scored[0].id);
    }
    changePage('results');
  };

  const handleSelectAndShare = (route: RouteOption) => {
    setSelectedRouteId(route.id);
    changePage('share');
  };

  const handleProceedOnly = (route: RouteOption) => {
    setSelectedRouteId(route.id);
    changePage('journey');
  };

  const handleAddCommunityNote = (newNote: CommunityNote) => {
    setCommunityNotes(prev => [newNote, ...prev]);
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
                onNavigateToLowSignal={() => {
                  setIsLowSignalGlobal(true);
                  changePage('lowsignal');
                }}
              />
            )}

            {activePage === 'share' && (
              <ShareJourneyPage
                selectedRoute={selectedRoute}
                onNavigateHome={() => changePage('home')}
                onStartJourney={() => changePage('journey')}
                onBack={handleGoBack}
                isLowSignalGlobal={isLowSignalGlobal}
              />
            )}

            {activePage === 'journey' && (
              <ActiveJourneyPage
                selectedRoute={selectedRoute}
                origin={origin || "Selected Origin"}
                destination={destination || "Selected Destination"}
                onEndJourney={handleGoBack}
                onNavigateHome={() => changePage('home')}
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
                    alt={userProfile.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-brand-purple mx-auto shadow-md"
                  />
                  <span className="absolute bottom-1 right-1 p-1.5 bg-brand-pink text-white rounded-full">
                    <Camera className="w-4 h-4" />
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900">{userProfile.name}</h3>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-brand-purple text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Prototype Account
                </span>
              </div>

              {/* Saved Quick Locations */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Saved Quick Locations
                </span>
                {userProfile.savedLocations.map((loc, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{loc.label}</span>
                    <span className="text-slate-500 truncate max-w-[200px]">{loc.address}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsProfileModalOpen(false)}
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
