import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Users,
  MapPin,
  GraduationCap,
  Briefcase,
  ExternalLink,
  Instagram,
  Linkedin,
  Mail,
  MessageSquare,
  Sparkles,
  Award,
  Filter,
} from 'lucide-react';
import { School, Profile, UserRole } from '../types';

interface SchoolFeedProps {
  school: School;
  profiles: Profile[];
  onBackToSchools: () => void;
  onOpenSubmit: () => void;
  onOpenConnect: (profile: Profile) => void;
}

export const SchoolFeed: React.FC<SchoolFeedProps> = ({
  school,
  profiles,
  onBackToSchools,
  onOpenSubmit,
  onOpenConnect,
}) => {
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Filter profiles for this specific school
  const schoolProfiles = profiles.filter((p) => p.schoolId === school.id);

  // Extract all unique tags across profiles
  const allTags = Array.from(
    new Set(schoolProfiles.flatMap((p) => p.tags || []))
  ).filter(Boolean);

  const filteredProfiles = schoolProfiles.filter((profile) => {
    const matchesRole = roleFilter === 'all' || profile.role === roleFilter;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      profile.name.toLowerCase().includes(query) ||
      profile.major.toLowerCase().includes(query) ||
      (profile.currentRole && profile.currentRole.toLowerCase().includes(query)) ||
      (profile.company && profile.company.toLowerCase().includes(query)) ||
      profile.location.toLowerCase().includes(query) ||
      profile.bio.toLowerCase().includes(query) ||
      profile.tags.some((t) => t.toLowerCase().includes(query));

    const matchesTag = selectedTag === 'all' || profile.tags.includes(selectedTag);

    return matchesRole && matchesSearch && matchesTag;
  });

  const alumniCount = schoolProfiles.filter((p) => p.role === 'alumni').length;
  const studentCount = schoolProfiles.filter((p) => p.role === 'student').length;

  return (
    <div className="space-y-8 pb-20">
      {/* Top Breadcrumb & School Banner */}
      <div className="space-y-4">
        <button
          id="btn-back-to-schools"
          onClick={onBackToSchools}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Schools</span>
        </button>

        {/* School Collegiate Banner */}
        <div
          className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white shadow-lg bg-gradient-to-r ${school.bannerBg}`}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs text-white border border-white/20">
                  {school.state} Campus Network
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/20 backdrop-blur-xs text-white/90">
                  Mascot: {school.mascot}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                {school.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-200">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-neutral-300" />
                  {school.location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="w-4 h-4 text-neutral-300" />
                  {schoolProfiles.length} Members in directory ({alumniCount} Alumni, {studentCount} Students)
                </span>
              </div>
            </div>

            {/* Post Profile CTA */}
            <div className="shrink-0">
              <button
                id="btn-feed-post-profile"
                onClick={onOpenSubmit}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-neutral-900 hover:bg-neutral-100 font-bold text-sm px-5 py-3.5 rounded-xl shadow-md transition-all active:scale-98"
              >
                <Plus className="w-4 h-4 text-blue-700" />
                <span>Introduce Yourself / Post Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Role Filter Tabs */}
          <div className="inline-flex p-1 bg-neutral-100 rounded-xl max-w-md">
            <button
              id="tab-filter-all"
              onClick={() => setRoleFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All ({schoolProfiles.length})
            </button>
            <button
              id="tab-filter-alumni"
              onClick={() => setRoleFilter('alumni')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === 'alumni'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Alumni ({alumniCount})
            </button>
            <button
              id="tab-filter-student"
              onClick={() => setRoleFilter('student')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === 'student'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Current Students ({studentCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              id="input-feed-search"
              type="text"
              placeholder="Search by name, major, company, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 hover:text-neutral-700 bg-neutral-200 px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Networking Tag Chips */}
        {allTags.length > 0 && (
          <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Tags:
            </span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                selectedTag === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All Topics
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? 'all' : tag)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-700 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Results Summary */}
      <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
        <span>
          Showing <strong>{filteredProfiles.length}</strong> {filteredProfiles.length === 1 ? 'profile' : 'profiles'}
        </span>
        {(searchQuery || selectedTag !== 'all' || roleFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTag('all');
              setRoleFilter('all');
            }}
            className="text-blue-700 hover:underline font-medium"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Profiles Grid */}
      {filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              id={`profile-card-${profile.id}`}
              className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative ${
                profile.isUserSubmission
                  ? 'border-blue-400 ring-2 ring-blue-100'
                  : 'border-neutral-200/90'
              }`}
            >
              {profile.isUserSubmission && (
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Just Added</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Profile Header: Photo & Role Badge */}
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={profile.photoUrl}
                      alt={profile.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-neutral-100 shadow-xs"
                      onError={(e) => {
                        // Fallback avatar
                        (e.target as HTMLElement).setAttribute(
                          'src',
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'
                        );
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                          profile.role === 'alumni'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <GraduationCap className="w-3 h-3" />
                        {profile.role === 'alumni' ? `Alumni '${String(profile.gradYear).slice(-2)}` : `Student '${String(profile.gradYear).slice(-2)}`}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-neutral-900 truncate">
                      {profile.name}
                    </h3>

                    <p className="text-xs text-neutral-600 truncate mt-0.5 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{profile.major}</span>
                    </p>
                  </div>
                </div>

                {/* Current Role / Organization */}
                {(profile.currentRole || profile.company) && (
                  <div className="bg-neutral-50 rounded-xl p-2.5 text-xs text-neutral-700 flex items-start gap-2 border border-neutral-100">
                    <Briefcase className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900 truncate">
                        {profile.currentRole}
                      </p>
                      {profile.company && (
                        <p className="text-neutral-500 truncate text-[11px]">
                          {profile.company}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Hometown / Location */}
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{profile.location}</span>
                </div>

                {/* Bio */}
                <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
                  {profile.bio}
                </p>

                {/* Tags */}
                {profile.tags && profile.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions: Socials & Connect */}
              <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {profile.instagram && (
                    <a
                      href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`@${profile.instagram.replace('@', '')} on Instagram`}
                      className="w-8 h-8 rounded-lg bg-neutral-50 hover:bg-pink-50 hover:text-pink-600 text-neutral-500 flex items-center justify-center transition-colors border border-neutral-200"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}

                  {profile.linkedin && (
                    <a
                      href={
                        profile.linkedin.startsWith('http')
                          ? profile.linkedin
                          : `https://linkedin.com/in/${profile.linkedin}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      title="LinkedIn Profile"
                      className="w-8 h-8 rounded-lg bg-neutral-50 hover:bg-blue-50 hover:text-blue-700 text-neutral-500 flex items-center justify-center transition-colors border border-neutral-200"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}

                  {profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      title={profile.email}
                      className="w-8 h-8 rounded-lg bg-neutral-50 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors border border-neutral-200"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <button
                  id={`btn-connect-${profile.id}`}
                  onClick={() => onOpenConnect(profile)}
                  className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Connect</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-12 text-center space-y-4">
          <GraduationCap className="w-12 h-12 text-neutral-400 mx-auto" />
          <h3 className="text-base font-bold text-neutral-800">
            No profiles match your search or filter
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
            Try resetting your search query or role filter, or be the first to introduce yourself in this category!
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('all');
                setRoleFilter('all');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={onOpenSubmit}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white transition-colors"
            >
              Post Your Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
