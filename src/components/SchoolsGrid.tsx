import React, { useState } from 'react';
import {
  Search,
  Users,
  ArrowRight,
  Plus,
  Building2,
  Filter,
  PlayCircle,
  Sparkles,
  Smartphone,
  Send,
  Image as ImageIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { School } from '../types';
import { ALL_54_STATES, POPULAR_STATE_CODES } from '../data/statesData';
import { motion } from 'motion/react';

interface SchoolsGridProps {
  schools: School[];
  onSelectSchool: (school: School) => void;
  onRequestSchoolModal: () => void;
}

// 4 Steps definition matching exact illustration cards in user screenshots (Image 2 & Image 4)
const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    title: 'Choose your school',
    desc: 'Find your Class of 2031 page.',
    iconBg: '#FDF2F8', // Soft pink
    icon: (
      <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
        <Building2 className="w-6 h-6" />
      </div>
    ),
    iconSmall: (
      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
        <Building2 className="w-5 h-5" />
      </div>
    ),
  },
  {
    number: 2,
    title: 'Add photos and a bio',
    desc: 'Share your photos and tell future classmates about yourself.',
    iconBg: '#FFF1F2', // Soft rose
    icon: (
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
        <ImageIcon className="w-6 h-6" />
      </div>
    ),
    iconSmall: (
      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
        <ImageIcon className="w-5 h-5" />
      </div>
    ),
  },
  {
    number: 3,
    title: 'Preview your post',
    desc: 'See exactly how your post will appear.',
    iconBg: '#F5F3FF', // Soft purple
    icon: (
      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
        <Smartphone className="w-6 h-6" />
      </div>
    ),
    iconSmall: (
      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
        <Smartphone className="w-5 h-5" />
      </div>
    ),
  },
  {
    number: 4,
    title: 'Post instantly',
    desc: 'Your profile is published instantly so classmates can find you.',
    iconBg: '#FEF3C7', // Soft amber
    icon: (
      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
        <Send className="w-6 h-6" />
      </div>
    ),
    iconSmall: (
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
        <Send className="w-5 h-5" />
      </div>
    ),
  },
];

const INITIAL_VISIBLE_COUNT = 8;
const BATCH_SIZE = 12;

// Featured popular campus IDs matching design screenshots
const FEATURED_SCHOOL_IDS = [
  'acu',
  'belmont',
  'bucknell',
  'dayton',
  'elon',
  'emory',
  'furman',
  'georgetown',
];

export const SchoolsGrid: React.FC<SchoolsGridProps> = ({
  schools,
  onSelectSchool,
  onRequestSchoolModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'featured' | 'all'>('featured');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);

  // When user is actively filtering with search or state, we show all matching search results
  const isFiltering = searchQuery.trim().length > 0 || selectedState !== 'ALL';
  const showFeaturedMode = activeTab === 'featured' && !isFiltering;

  // Featured schools: find the 8 featured campuses in order, fallback to first 8
  const featuredSchools = FEATURED_SCHOOL_IDS
    .map((id) => schools.find((s) => s.id === id))
    .filter((s): s is School => Boolean(s));
  const effectiveFeatured = featuredSchools.length > 0 ? featuredSchools : schools.slice(0, 8);

  const filteredSchools = schools.filter((school) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      school.name.toLowerCase().includes(query) ||
      school.shortName.toLowerCase().includes(query) ||
      school.location.toLowerCase().includes(query) ||
      school.mascot.toLowerCase().includes(query) ||
      (school.instagramHandle && school.instagramHandle.toLowerCase().includes(query));

    const matchesState = selectedState === 'ALL' || school.state === selectedState;

    return matchesSearch && matchesState;
  });

  const schoolsToDisplay = showFeaturedMode
    ? effectiveFeatured
    : filteredSchools.slice(0, visibleCount);

  const hasMore = !showFeaturedMode && filteredSchools.length > visibleCount;

  const selectedStateObj = ALL_54_STATES.find((s) => s.code === selectedState);

  // Helper for school avatar styling matching screenshot
  const getSchoolAvatarStyle = (school: School) => {
    // Specific recognizable styles from screenshots
    if (school.id === 'acu') return { backgroundColor: '#582C83' };
    if (school.id === 'belmont') return { backgroundColor: '#002D62' };
    if (school.id === 'bucknell') return { background: 'linear-gradient(135deg, #1B365D 0%, #E87722 100%)' };
    if (school.id === 'dayton') return { background: 'linear-gradient(135deg, #004B87 0%, #C41230 100%)' };
    if (school.id === 'elon') return { background: 'linear-gradient(135deg, #73000A 0%, #C41230 100%)' };
    if (school.id === 'emory') return { background: 'linear-gradient(135deg, #002878 0%, #B3A369 100%)' };
    if (school.id === 'furman') return { background: 'linear-gradient(135deg, #582C83 0%, #8B5CF6 100%)' };
    if (school.id === 'georgetown') return { backgroundColor: '#041E42' };

    return { backgroundColor: school.accentColor || '#002D62' };
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 w-full max-w-full overflow-x-hidden">
      {/* 1. HERO SECTION - With Instagram Gradient Theme */}
      <section className="pt-2 sm:pt-4 space-y-6 sm:space-y-8 max-w-4xl">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 leading-[1.12]">
          Meet your future <br className="hidden sm:inline" />
          classmates <span className="bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 bg-clip-text text-transparent">before campus.</span>
        </h1>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            id="btn-hero-find-school"
            onClick={() => {
              document.getElementById('schools')?.scrollIntoView({ behavior: 'smooth' });
              setTimeout(() => {
                document.getElementById('school-search-input')?.focus();
              }, 400);
            }}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white text-sm sm:text-base font-bold py-3 sm:py-3.5 px-5 sm:px-6 rounded-2xl shadow-md transition-opacity cursor-pointer min-h-[44px]"
          >
            <Search className="w-4 h-4" />
            <span>Find my school</span>
          </button>

          <button
            id="btn-hero-how-it-works"
            onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-pink-50/40 border border-neutral-300 hover:border-pink-300 text-neutral-800 hover:text-pink-600 text-sm sm:text-base font-semibold py-3 sm:py-3.5 px-5 sm:px-6 rounded-2xl transition-all cursor-pointer shadow-2xs min-h-[44px]"
          >
            <PlayCircle className="w-4 h-4 text-pink-600" />
            <span>See how it works</span>
          </button>
        </div>

        {/* Social Proof with Avatar Stack */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex -space-x-2 overflow-hidden shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
              AJ
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
              MT
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-600 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
              KL
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
              RS
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-neutral-900 leading-none">
              4.7/5.0 from 1,200+ students
            </p>
            <p className="text-[11px] sm:text-xs text-neutral-500 mt-1 leading-none">
              Built for incoming freshmen.
            </p>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS SECTION - With Instagram Gradient Theme */}
      <section id="how-it-works" className="scroll-mt-20 space-y-6 sm:space-y-8">
        <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 text-center tracking-tight">
          How it <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">works</span>
        </h2>

        {/* DESKTOP VIEW: Horizontal layout with Instagram gradient connector and badges */}
        <div className="hidden md:block relative pt-4 pb-2">
          {/* Pink/Purple Dashed Connector Line */}
          <div className="absolute top-[32px] left-[12%] right-[12%] h-0.5 border-t-2 border-dashed border-pink-300 -z-0" />

          <div className="grid grid-cols-4 gap-5 relative z-10">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                {/* Step Number Circle with Instagram Gradient */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs mb-4">
                  {step.number}
                </div>

                {/* Step Card */}
                <div className="w-full bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs flex flex-col items-center text-center h-full hover:shadow-md hover:border-pink-200 transition-all">
                  <div className="mb-4">{step.icon}</div>
                  <h3 className="font-extrabold text-neutral-900 text-base mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-[200px]">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MOBILE VIEW: Compact vertical layout with vertical dashed timeline */}
        <div className="md:hidden relative pl-6 space-y-3.5 max-w-lg mx-auto">
          {/* Vertical Pink Dashed Line */}
          <div className="absolute top-4 bottom-8 left-[19px] w-0.5 border-l-2 border-dashed border-pink-300 -z-0" />

          {HOW_IT_WORKS_STEPS.map((step) => (
            <div key={step.number} className="relative flex items-center gap-3">
              {/* Step Number Circle Badge */}
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs z-10">
                {step.number}
              </div>

              {/* Sleek Compact White Card */}
              <div className="flex-1 bg-white rounded-2xl p-3 sm:p-3.5 border border-neutral-200 shadow-xs flex items-center gap-3 hover:border-pink-200 transition-colors">
                <div className="shrink-0">{step.iconSmall}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-neutral-900 text-sm leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-tight">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FIND YOUR SCHOOL SECTION - With Instagram Gradient Accents */}
      <section id="schools" className="scroll-mt-20 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Find your <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">school</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Select your campus to connect with future classmates and get featured.
            </p>
          </div>

          {/* Featured vs All Campuses Toggle Tabs */}
          <div className="inline-flex p-1 bg-neutral-100 rounded-2xl border border-neutral-200 self-start sm:self-auto shrink-0 shadow-2xs">
            <button
              id="tab-featured-campuses"
              onClick={() => {
                setActiveTab('featured');
                setSearchQuery('');
                setSelectedState('ALL');
                setVisibleCount(INITIAL_VISIBLE_COUNT);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                showFeaturedMode
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${showFeaturedMode ? 'text-pink-600' : 'text-neutral-400'}`} />
              <span>Featured ({effectiveFeatured.length})</span>
            </button>

            <button
              id="tab-all-campuses"
              onClick={() => {
                setActiveTab('all');
                setVisibleCount(INITIAL_VISIBLE_COUNT);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !showFeaturedMode
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${!showFeaturedMode ? 'text-pink-600' : 'text-neutral-400'}`} />
              <span>All Campuses ({schools.length})</span>
            </button>
          </div>
        </div>

        {/* Search Box - Full Width */}
        <div className="relative flex items-center w-full">
          <Search className="absolute left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
          <input
            id="school-search-input"
            type="text"
            placeholder="Search your college..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(INITIAL_VISIBLE_COUNT);
            }}
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 text-sm sm:text-base font-medium shadow-2xs focus:outline-hidden focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 px-2 py-1 text-xs text-pink-600 hover:text-pink-700 font-medium bg-pink-50 rounded-md cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* State Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">State:</span>
            <select
              id="state-select-dropdown"
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setVisibleCount(INITIAL_VISIBLE_COUNT);
              }}
              className="bg-transparent text-xs font-semibold text-neutral-800 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All 54 States & Territories ({schools.length} schools)</option>
              {ALL_54_STATES.map((state) => {
                const count = schools.filter((s) => s.state === state.code).length;
                return (
                  <option key={state.code} value={state.code}>
                    {state.name} ({state.code}) {count > 0 ? `• ${count} school${count > 1 ? 's' : ''}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
            {POPULAR_STATE_CODES.slice(0, 6).map((code) => (
              <button
                key={code}
                onClick={() => {
                  setSelectedState(code);
                  setVisibleCount(INITIAL_VISIBLE_COUNT);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedState === code
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {code === 'ALL' ? 'All' : code}
              </button>
            ))}
            {selectedState !== 'ALL' && (
              <button
                onClick={() => {
                  setSelectedState('ALL');
                  setVisibleCount(INITIAL_VISIBLE_COUNT);
                }}
                className="text-pink-600 text-xs font-bold hover:underline shrink-0 ml-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* SCHOOLS CONTAINER */}
        {schoolsToDisplay.length > 0 ? (
          <div>
            {/* MOBILE LIST VIEW: Compact horizontal white cards */}
            <div className="sm:hidden space-y-2.5">
              {schoolsToDisplay.map((school) => {
                const avatarStyle = getSchoolAvatarStyle(school);
                return (
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    key={school.id}
                    id={`mobile-school-item-${school.id}`}
                    onClick={() => onSelectSchool(school)}
                    className="bg-white border border-neutral-200 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-pink-300 transition-colors"
                  >
                    {/* Left: Round Monogram Avatar */}
                    <div
                      className="w-11 h-11 rounded-full text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs"
                      style={avatarStyle}
                    >
                      {school.shortName.slice(0, 3).toUpperCase()}
                    </div>

                    {/* Middle: Name, Handle, Member Count */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h3 className="font-extrabold text-neutral-900 text-sm leading-tight truncate">
                        {school.name}
                      </h3>
                      <p className="text-xs text-neutral-500 truncate leading-none">
                        {school.instagramHandle && school.instagramHandle !== 'no username'
                          ? school.instagramHandle
                          : `@${school.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}2031`}
                      </p>
                      <p className="text-xs font-bold text-pink-600 leading-none pt-0.5">
                        {school.memberCount.toLocaleString()} students
                      </p>
                    </div>

                    {/* Right: Instagram Pink Arrow Icon */}
                    <div className="shrink-0 pl-1">
                      <ArrowRight className="w-4 h-4 text-pink-600" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* DESKTOP GRID VIEW: Clean 4-Column Cards */}
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {schoolsToDisplay.map((school) => {
                const avatarStyle = getSchoolAvatarStyle(school);
                const titleText = `${school.shortName} Class of 2031`;
                const handleText =
                  school.instagramHandle && school.instagramHandle !== 'no username'
                    ? school.instagramHandle
                    : `@${school.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}2031`;

                return (
                  <motion.div
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    key={school.id}
                    id={`desktop-school-card-${school.id}`}
                    onClick={() => onSelectSchool(school)}
                    className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-pink-300 transition-all group"
                  >
                    <div className="space-y-3">
                      {/* Top Row: Avatar + Title & Handle */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs"
                          style={avatarStyle}
                        >
                          {school.shortName.slice(0, 3).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-neutral-900 text-sm sm:text-base leading-tight truncate">
                            {titleText}
                          </h3>
                          <p className="text-xs text-neutral-500 truncate mt-0.5">
                            {handleText}
                          </p>
                        </div>
                      </div>

                      {/* School Name */}
                      <p className="text-xs sm:text-sm text-neutral-600 font-medium">
                        {school.name}
                      </p>

                      {/* Students Pill */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50/60 border border-pink-100 text-xs font-semibold text-pink-700">
                        <Users className="w-3.5 h-3.5 text-pink-500" />
                        <span>{school.memberCount.toLocaleString()} students</span>
                      </div>
                    </div>

                    {/* Instagram Gradient Button: Get posted -> */}
                    <div className="pt-4 mt-4 border-t border-neutral-100">
                      <button
                        id={`btn-get-posted-${school.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSchool(school);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-opacity cursor-pointer shadow-xs"
                      >
                        <span>Get posted</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Controls when in Featured Mode */}
            {showFeaturedMode && (
              <div className="mt-5 p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-neutral-900">
                    Showing {effectiveFeatured.length} featured Class of 2031 campuses
                  </p>
                  <p className="text-[11px] sm:text-xs text-neutral-500">
                    Looking for your campus? Search above or explore all {schools.length} universities across the US.
                  </p>
                </div>
                <button
                  id="btn-browse-all-campuses-cta"
                  onClick={() => {
                    setActiveTab('all');
                    setVisibleCount(INITIAL_VISIBLE_COUNT);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0 transition-opacity min-h-[40px]"
                >
                  <span>Browse All {schools.length} Campuses</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Controls when in All / Filtered Mode */}
            {!showFeaturedMode && (
              <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3">
                {/* Status indicator */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-600">
                  <span>
                    Showing {schoolsToDisplay.length} of {filteredSchools.length} {selectedState !== 'ALL' ? `${selectedState} ` : ''}universities
                  </span>
                </div>

                {/* Load More & View All Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
                  {hasMore && (
                    <button
                      id="btn-load-more-schools"
                      onClick={() => setVisibleCount((prev) => prev + BATCH_SIZE)}
                      className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-neutral-300 hover:border-pink-300 text-neutral-800 hover:text-pink-600 text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer min-h-[44px]"
                    >
                      <ChevronDown className="w-4 h-4 text-pink-600" />
                      <span>
                        Show 12 More ({filteredSchools.length - schoolsToDisplay.length} left)
                      </span>
                    </button>
                  )}

                  {hasMore && (
                    <button
                      id="btn-view-all-schools"
                      onClick={() => setVisibleCount(filteredSchools.length)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-xs transition-opacity cursor-pointer min-h-[44px] shrink-0"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>View All ({filteredSchools.length})</span>
                    </button>
                  )}

                  {visibleCount > INITIAL_VISIBLE_COUNT && (
                    <button
                      id="btn-show-fewer-schools"
                      onClick={() => {
                        setVisibleCount(INITIAL_VISIBLE_COUNT);
                        document.getElementById('schools')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center justify-center gap-1 px-4 py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer min-h-[44px]"
                    >
                      <ChevronUp className="w-4 h-4 text-neutral-500" />
                      <span>Show Fewer</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-neutral-300 rounded-3xl p-10 text-center space-y-3">
            <Building2 className="w-10 h-10 text-neutral-400 mx-auto" />
            <h3 className="text-base font-bold text-neutral-800">
              No school found matching &quot;{searchQuery}&quot;
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
              Don&apos;t see your campus? Request your school and we will launch your Class of 2031 feature page.
            </p>
            <button
              onClick={onRequestSchoolModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs hover:opacity-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Request Your School</span>
            </button>
          </div>
        )}

        {/* Bottom Request Banner */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm font-bold text-neutral-900">
              Can&apos;t find your university or class page?
            </p>
            <p className="text-[11px] sm:text-xs text-neutral-500">
              We add new schools daily across all 54 US states and territories.
            </p>
          </div>
          <button
            onClick={onRequestSchoolModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request School</span>
          </button>
        </div>
      </section>
    </div>
  );
};
