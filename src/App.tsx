import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SchoolsGrid } from './components/SchoolsGrid';
import { SchoolPostingFlow } from './components/SchoolPostingFlow';
import { RequestSchoolModal } from './components/RequestSchoolModal';
import { HelpModal } from './components/HelpModal';
import { AdminModal } from './components/AdminModal';
import { INITIAL_SCHOOLS, INITIAL_PROFILES } from './data/schoolsData';
import { School, Profile } from './types';
import { CheckCircle2, Instagram, Shield } from 'lucide-react';
import { api } from './services/api';
import { parseCurrentUrl } from './utils/schoolLinks';

const STORAGE_PROFILES_KEY = 'classmateconnect_custom_profiles_v1';
const STORAGE_SCHOOLS_KEY = 'classmateconnect_custom_schools_v1';

export default function App() {
  const [schools, setSchools] = useState<School[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SCHOOLS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return INITIAL_SCHOOLS;
  });

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const ids = new Set(parsed.map((p: Profile) => p.id));
        return [...parsed, ...INITIAL_PROFILES.filter((p) => !ids.has(p.id))];
      }
    } catch {
      // fallback
    }
    return INITIAL_PROFILES;
  });

  const [selectedSchool, setSelectedSchool] = useState<School | null>(() => {
    return INITIAL_SCHOOLS.find((s) => s.id === 'acu') || INITIAL_SCHOOLS[0];
  });

  const [currentView, setCurrentView] = useState<'schools' | 'post'>('schools');
  const [isRequestSchoolOpen, setIsRequestSchoolOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize with backend API on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [backendSchools, backendProfiles] = await Promise.all([
          api.getSchools(),
          api.getProfiles(),
        ]);
        if (backendSchools && backendSchools.length > 0) {
          setSchools(backendSchools);
        }
        if (backendProfiles && backendProfiles.length > 0) {
          setProfiles(backendProfiles);
        }
      } catch (err) {
        console.warn('Backend sync note:', err);
      }
    }
    loadBackendData();
  }, []);

  // Check initial URL hash / path / search query params
  useEffect(() => {
    const handleUrlRoute = () => {
      const parsed = parseCurrentUrl(schools);
      if (parsed.school) {
        setSelectedSchool(parsed.school);
      }
      setCurrentView(parsed.view);
    };

    handleUrlRoute();

    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      window.removeEventListener('popstate', handleUrlRoute);
    };
  }, [schools]);

  // Save custom profiles
  const handleSaveProfile = (newProfile: Profile) => {
    const updated = [newProfile, ...profiles];
    setProfiles(updated);

    // Save user submissions in localStorage
    try {
      const userSubmissions = updated.filter((p) => p.isUserSubmission);
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(userSubmissions));
    } catch {
      // Ignore quota error
    }

    // Sync to backend API in background
    api.createProfile(newProfile).catch((err) => {
      console.warn('Background profile sync note:', err);
    });

    const targetSchool = schools.find((s) => s.id === newProfile.schoolId) || selectedSchool;
    setToastMessage(`Profile submitted! Your ${targetSchool?.shortName || ''} Instagram post is queued.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school);
    setCurrentView('post');
    // Update browser URL so students can bookmark or share the direct link
    try {
      const newUrl = `${window.location.pathname}?school=${encodeURIComponent(school.id)}&post=1`;
      window.history.pushState({ schoolId: school.id, view: 'post' }, '', newUrl);
    } catch {
      // noop
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToSchools = () => {
    if (currentView !== 'schools') {
      setCurrentView('schools');
      try {
        const cleanUrl = window.location.pathname.startsWith('/post') ? '/' : window.location.pathname;
        window.history.pushState({ view: 'schools' }, '', cleanUrl);
      } catch {
        // noop
      }
      setTimeout(() => {
        document.getElementById('schools')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('schools')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigateToSteps = () => {
    if (currentView !== 'schools') {
      setCurrentView('schools');
      setTimeout(() => {
        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRequestSchoolSubmitted = (schoolName: string) => {
    // Send to backend API
    api.requestSchool({ schoolName }).catch((err) => {
      console.warn('Backend request school note:', err);
    });
    setToastMessage(`Request for "${schoolName}" submitted! We'll notify you once launched.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 overflow-x-hidden w-full max-w-full">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        selectedSchool={selectedSchool}
        onNavigateHome={() => {
          setCurrentView('schools');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToSchools={handleNavigateToSchools}
        onNavigateToSteps={handleNavigateToSteps}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-neutral-800 flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-6 sm:pt-8 overflow-x-hidden">
        {currentView === 'schools' || !selectedSchool ? (
          <SchoolsGrid
            schools={schools}
            onSelectSchool={handleSelectSchool}
            onRequestSchoolModal={() => setIsRequestSchoolOpen(true)}
          />
        ) : (
          <SchoolPostingFlow
            school={selectedSchool}
            onBackToSchools={() => {
              setCurrentView('schools');
              try {
                const cleanUrl = window.location.pathname.startsWith('/post') ? '/' : window.location.pathname;
                window.history.pushState({ view: 'schools' }, '', cleanUrl);
              } catch {
                // noop
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSubmitProfile={handleSaveProfile}
          />
        )}
      </main>

      {/* Request School Modal */}
      <RequestSchoolModal
        isOpen={isRequestSchoolOpen}
        onClose={() => setIsRequestSchoolOpen(false)}
        onRequestSubmitted={handleRequestSchoolSubmitted}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onNavigateToSchools={handleNavigateToSchools}
        onNavigateToSteps={handleNavigateToSteps}
      />

      {/* Admin Backend Queue Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        schools={schools}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-8 sm:py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Instagram className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-neutral-900">
                Meet<span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">FutureClass</span>
              </p>
              <p className="text-xs text-neutral-500">
                meetfutureclass.com • Official Campus Instagram Feature Network • All 54 States & Territories
              </p>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-semibold text-neutral-600">
            <button
              onClick={handleNavigateToSchools}
              className="hover:text-pink-600 transition-colors cursor-pointer"
            >
              Find my school
            </button>
            <span>•</span>
            <button
              onClick={handleNavigateToSteps}
              className="hover:text-pink-600 transition-colors cursor-pointer"
            >
              How it works
            </button>
            <span>•</span>
            <button
              onClick={() => setIsHelpOpen(true)}
              className="hover:text-pink-600 transition-colors cursor-pointer"
            >
              Help & FAQ
            </button>
            <span>•</span>
            <button
              onClick={() => setIsRequestSchoolOpen(true)}
              className="hover:text-pink-600 transition-colors cursor-pointer"
            >
              Request School
            </button>
            <span>•</span>
            <button
              id="footer-admin-portal-btn"
              onClick={() => setIsAdminOpen(true)}
              className="inline-flex items-center gap-1 text-neutral-800 hover:text-pink-600 transition-colors cursor-pointer font-bold"
            >
              <Shield className="w-3 h-3 text-pink-500" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
