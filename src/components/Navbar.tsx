import React from 'react';
import { HelpCircle, Instagram, Shield } from 'lucide-react';
import { School } from '../types';

interface NavbarProps {
  currentView: 'schools' | 'post';
  selectedSchool: School | null;
  onNavigateHome: () => void;
  onNavigateToSchools: () => void;
  onNavigateToSteps: () => void;
  onOpenHelp: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  selectedSchool,
  onNavigateHome,
  onNavigateToSchools,
  onNavigateToSteps,
  onOpenHelp,
  onOpenAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 overflow-hidden">
        {/* Brand Logo with Instagram Gradient */}
        <button
          id="nav-brand-logo"
          onClick={onNavigateHome}
          className="flex items-center gap-2 sm:gap-2.5 text-left group transition-opacity hover:opacity-90 focus:outline-hidden shrink-0 min-w-0 cursor-pointer"
        >
          {/* Instagram gradient icon badge */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-neutral-900 truncate block max-w-[170px] xs:max-w-none">
              Meet<span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">FutureClass</span>
            </span>
            <span className="hidden xs:block text-[10px] text-neutral-400 font-medium -mt-0.5 leading-none">
              meetfutureclass.com
            </span>
          </div>
        </button>

        {/* Top Links */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-neutral-700 shrink-0">
          <button
            id="nav-link-how-it-works"
            onClick={onNavigateToSteps}
            className="hover:text-pink-600 transition-colors cursor-pointer py-1 px-1 whitespace-nowrap"
          >
            How it works
          </button>

          <button
            id="nav-link-schools"
            onClick={onNavigateToSchools}
            className="hover:text-pink-600 transition-colors cursor-pointer py-1 px-1 whitespace-nowrap"
          >
            Schools
          </button>

          <button
            id="nav-link-help"
            onClick={onOpenHelp}
            className="hover:text-pink-600 transition-colors cursor-pointer py-1 px-1 flex items-center gap-1.5 whitespace-nowrap"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500 group-hover:text-pink-600" />
            <span>Help</span>
          </button>

          {onOpenAdmin && (
            <button
              id="nav-link-admin-portal"
              onClick={onOpenAdmin}
              className="text-neutral-700 hover:text-pink-600 transition-colors cursor-pointer py-1 px-1.5 rounded-lg hover:bg-pink-50/50 flex items-center gap-1.5 whitespace-nowrap"
              title="Campus Admin Portal"
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500" />
              <span>Admin Portal</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
