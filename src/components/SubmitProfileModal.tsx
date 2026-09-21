import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Sparkles,
  GraduationCap,
  Briefcase,
  MapPin,
  Instagram,
  Linkedin,
  Mail,
  Eye,
  Edit3,
  Crop,
  Music2,
} from 'lucide-react';
import { School, Profile, UserRole } from '../types';
import { SAMPLE_AVATARS } from '../data/schoolsData';
import { CATEGORIZED_MAJORS, ALL_54_STATES, POPULAR_HOMETOWN_HUBS } from '../data/majorsAndLocations';
import { PhotoCropperModal } from './PhotoCropperModal';

interface SubmitProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  schools: School[];
  defaultSchoolId?: string;
  onSubmitProfile: (newProfile: Profile) => void;
}

const COMMON_TAG_SUGGESTIONS = [
  'Coffee Chats',
  'Mentorship',
  'Career Advice',
  'Internships',
  'Software / Tech',
  'Finance & Banking',
  'Pre-Med / Health',
  'Consulting',
  'Startups',
  'Roommate Search',
];

export const SubmitProfileModal: React.FC<SubmitProfileModalProps> = ({
  isOpen,
  onClose,
  schools,
  defaultSchoolId = 'emory',
  onSubmitProfile,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [schoolId, setSchoolId] = useState<string>(defaultSchoolId);
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState<string>('');
  const [gradYear, setGradYear] = useState<number>(2026);
  const [major, setMajor] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [tags, setTags] = useState<string[]>(['Coffee Chats', 'Career Advice']);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [instagram, setInstagram] = useState<string>('');
  const [tiktok, setTiktok] = useState<string>('');
  const [linkedin, setLinkedin] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isCustomMajor, setIsCustomMajor] = useState<boolean>(false);
  const [selectedLocationHub, setSelectedLocationHub] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>(SAMPLE_AVATARS[0]);
  const [sourceImageForCrop, setSourceImageForCrop] = useState<string>(SAMPLE_AVATARS[0]);
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const [isCropped, setIsCropped] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedSchool = schools.find((s) => s.id === schoolId) || schools[0];

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, photo: 'File size must be under 8MB' }));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const raw = reader.result;
          setSourceImageForCrop(raw);
          setPhotoUrl(raw);
          setIsCropperOpen(true);
          setErrors((prev) => ({ ...prev, photo: '' }));
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  // Toggle tag
  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      if (tags.length < 5) {
        setTags([...tags, tag]);
      }
    }
  };

  // Add custom tag
  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      const clean = customTagInput.trim();
      if (!tags.includes(clean) && tags.length < 5) {
        setTags([...tags, clean]);
        setCustomTagInput('');
      }
    }
  };

  // Form Validation & Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Please enter your name';
    if (!major.trim()) newErrors.major = 'Please enter your major or field';
    if (!location.trim()) newErrors.location = 'Please enter your city/hometown';
    if (!bio.trim()) newErrors.bio = 'Please write a short bio to introduce yourself';
    if (!photoUrl) newErrors.photo = 'Please provide or select a photo';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveTab('form');
      return;
    }

    const createdProfile: Profile = {
      id: `user-${Date.now()}`,
      schoolId,
      name: name.trim(),
      role,
      gradYear: Number(gradYear),
      major: major.trim(),
      currentRole: currentRole.trim() || (role === 'student' ? 'Student' : 'Alumni'),
      company: company.trim() || undefined,
      location: location.trim(),
      bio: bio.trim(),
      tags,
      instagram: instagram.trim() ? instagram.replace('@', '') : undefined,
      tiktok: tiktok.trim() ? tiktok.replace('@', '') : undefined,
      linkedin: linkedin.trim() || undefined,
      email: email.trim() || undefined,
      photoUrl,
      createdAt: new Date().toISOString().split('T')[0],
      isUserSubmission: true,
    };

    onSubmitProfile(createdProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight">
                Introduce Yourself / Post Profile
              </h2>
              <p className="text-xs text-neutral-500">
                Join the {selectedSchool.name} network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Tab Switcher */}
            <div className="md:hidden flex bg-neutral-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'form' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Form
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'preview' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Preview
                </span>
              </button>
            </div>

            <button
              id="btn-close-submit-modal"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
          {/* Form Area */}
          <div
            className={`p-6 space-y-6 md:col-span-7 ${
              activeTab === 'preview' ? 'hidden md:block' : 'block'
            }`}
          >
            <form id="profile-submit-form" onSubmit={handleSubmit} className="space-y-5">
              {/* School & Role Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                    School / University *
                  </label>
                  <select
                    id="input-school-select"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm font-medium text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                    I am a *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        role === 'student'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Current Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('alumni')}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        role === 'alumni'
                          ? 'bg-white text-blue-800 shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Alumni / Grad
                    </button>
                  </div>
                </div>
              </div>

              {/* Name & Grad Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <input
                    id="input-name"
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl bg-neutral-50 border text-xs sm:text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                      errors.name ? 'border-red-400' : 'border-neutral-200'
                    }`}
                  />
                  {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                    Class Year *
                  </label>
                  <select
                    id="input-grad-year"
                    value={gradYear}
                    onChange={(e) => setGradYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm font-medium text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {[2031, 2030, 2029, 2028, 2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016].map(
                      (yr) => (
                        <option key={yr} value={yr}>
                          {yr} ({yr >= 2026 ? 'Student' : 'Alumni'})
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Photo Selector & Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Profile Photo *
                </label>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => {
                      setSourceImageForCrop(sourceImageForCrop || photoUrl);
                      setIsCropperOpen(true);
                    }}
                    className="relative group w-14 h-14 rounded-2xl overflow-hidden border-2 border-neutral-200 shadow-xs shrink-0 cursor-pointer"
                    title="Click to crop or adjust"
                  >
                    <img
                      src={photoUrl}
                      alt="Preview avatar"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                      <Crop className="w-4 h-4" />
                    </div>
                    {isCropped && (
                      <div className="absolute top-1 right-1 px-1 py-0.2 rounded bg-pink-600 text-white text-[8px] font-bold shadow-xs">
                        Cropped
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSourceImageForCrop(sourceImageForCrop || photoUrl);
                          setIsCropperOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Crop or adjust photo"
                      >
                        <Crop className="w-3.5 h-3.5 text-pink-600" />
                        <span>Crop</span>
                      </button>
                      <span className="text-[11px] text-neutral-400">or pick an avatar below</span>
                    </div>

                    {/* Quick Avatar Row */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      {SAMPLE_AVATARS.slice(0, 6).map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPhotoUrl(img)}
                          className={`relative rounded-lg overflow-hidden shrink-0 border-2 transition-transform hover:scale-105 ${
                            photoUrl === img ? 'border-blue-700 ring-2 ring-blue-200' : 'border-transparent'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Avatar ${i}`}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {errors.photo && <p className="text-[11px] text-red-500">{errors.photo}</p>}
              </div>

              {/* Major & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="select-modal-major" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Major / Degree *
                    </label>
                    {isCustomMajor && (
                      <button
                        type="button"
                        onClick={() => setIsCustomMajor(false)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        ← Back to list
                      </button>
                    )}
                  </div>

                  {!isCustomMajor ? (
                    <select
                      id="select-modal-major"
                      value={CATEGORIZED_MAJORS.flatMap(c => c.majors).includes(major) ? major : (major ? '__custom__' : '')}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomMajor(true);
                          if (CATEGORIZED_MAJORS.flatMap(c => c.majors).includes(major)) setMajor('');
                        } else {
                          setMajor(e.target.value);
                          setErrors((prev) => ({ ...prev, major: '' }));
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-xl bg-neutral-50 border text-xs sm:text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer ${
                        errors.major ? 'border-red-400' : 'border-neutral-200'
                      }`}
                    >
                      <option value="">-- Select Major from dropdown --</option>
                      {CATEGORIZED_MAJORS.map((cat) => (
                        <optgroup key={cat.category} label={cat.category}>
                          {cat.majors.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="__custom__">✏️ Other / Double Major / Enter custom...</option>
                    </select>
                  ) : (
                    <input
                      id="input-major"
                      type="text"
                      autoFocus
                      placeholder="e.g. Economics & CS, Biology, Pre-Law..."
                      value={major}
                      onChange={(e) => {
                        setMajor(e.target.value);
                        setErrors((prev) => ({ ...prev, major: '' }));
                      }}
                      className={`w-full px-3 py-2 rounded-xl bg-neutral-50 border text-xs sm:text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                        errors.major ? 'border-red-400' : 'border-neutral-200'
                      }`}
                    />
                  )}
                  {errors.major && <p className="text-[11px] text-red-500 mt-1">{errors.major}</p>}
                </div>

                <div>
                  <label htmlFor="select-modal-location" className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                    Current Location / Hometown *
                  </label>
                  <div className="space-y-1.5">
                    <select
                      id="select-modal-location"
                      value={selectedLocationHub}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedLocationHub(val);
                        if (val && val !== '__manual__') {
                          setLocation(val);
                          setErrors((prev) => ({ ...prev, location: '' }));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
                    >
                      <option value="">-- Choose Hometown from dropdown --</option>
                      <optgroup label="Popular College Hometown Hubs">
                        {POPULAR_HOMETOWN_HUBS.map((hub) => (
                          <option key={hub} value={hub}>
                            📍 {hub}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="All 54 States & Territories">
                        {ALL_54_STATES.map((st) => (
                          <option key={st.code} value={`${st.name} (${st.code})`}>
                            {st.name} ({st.code})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="International & Other">
                        <option value="International / Study Abroad">International / Study Abroad</option>
                        <option value="__manual__">✏️ Type Specific City & State below...</option>
                      </optgroup>
                    </select>

                    <input
                      id="input-location"
                      type="text"
                      placeholder="e.g. Atlanta, GA or New York, NY"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setErrors((prev) => ({ ...prev, location: '' }));
                      }}
                      className={`w-full px-3 py-1.5 rounded-xl bg-neutral-50 border text-xs sm:text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                        errors.location ? 'border-red-400' : 'border-neutral-200'
                      }`}
                    />
                  </div>
                  {errors.location && <p className="text-[11px] text-red-500 mt-1">{errors.location}</p>}
                </div>
              </div>

              {/* Current Role & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                    {role === 'alumni' ? 'Current Title / Profession' : 'Current Role or Career Goal'}
                  </label>
                  <input
                    id="input-current-role"
                    type="text"
                    placeholder={
                      role === 'alumni'
                        ? 'e.g. Product Manager, Consultant, Attorney'
                        : 'e.g. Aspiring Software Engineer, Pre-Med Junior'
                    }
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                    Company / Organization (Optional)
                  </label>
                  <input
                    id="input-company"
                    type="text"
                    placeholder="e.g. Google, Deloitte, Emory Lab, Freelance..."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  Bio / Introduction *
                </label>
                <textarea
                  id="input-bio"
                  rows={3}
                  placeholder="Tell your classmates about yourself, clubs or sports you did, what advice you're looking for or can share, and what you love to do..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl bg-neutral-50 border text-xs sm:text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed ${
                    errors.bio ? 'border-red-400' : 'border-neutral-200'
                  }`}
                />
                {errors.bio && <p className="text-[11px] text-red-500 mt-1">{errors.bio}</p>}
              </div>

              {/* Networking Tags */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Networking Topics & Interests (Pick up to 5)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_TAG_SUGGESTIONS.map((tag) => {
                    const isSelected = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-700 text-white shadow-xs'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Or type custom tag and press Enter..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={handleAddCustomTag}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 placeholder:text-neutral-400"
                  />
                </div>
              </div>

              {/* Social & Contact Links */}
              <div className="space-y-2.5 pt-2 border-t border-neutral-100">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Contact & Socials (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="relative">
                    <Instagram className="w-4 h-4 text-pink-500 absolute left-3 top-2.5" />
                    <input
                      id="input-instagram"
                      type="text"
                      placeholder="Instagram (@handle)"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900"
                    />
                  </div>

                  <div className="relative">
                    <Music2 className="w-4 h-4 text-pink-600 absolute left-3 top-2.5" />
                    <input
                      id="input-tiktok"
                      type="text"
                      placeholder="TikTok (@handle)"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900"
                    />
                  </div>

                  <div className="relative">
                    <Linkedin className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                    <input
                      id="input-linkedin"
                      type="text"
                      placeholder="LinkedIn handle/URL"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      id="input-email"
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Real-time Preview Area */}
          <div
            className={`p-6 bg-neutral-50/70 flex flex-col justify-between md:col-span-5 ${
              activeTab === 'form' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Live Directory Card Preview
                </span>
                <span className="text-[11px] text-neutral-400">Updates as you type</span>
              </div>

              {/* The Preview Card */}
              <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-start gap-3.5">
                  <img
                    src={photoUrl || SAMPLE_AVATARS[0]}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-neutral-100 shadow-xs shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                        role === 'alumni'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <GraduationCap className="w-3 h-3" />
                      {role === 'alumni' ? `Alumni '${String(gradYear).slice(-2)}` : `Student '${String(gradYear).slice(-2)}`}
                    </span>

                    <h3 className="text-base font-bold text-neutral-900 truncate mt-1">
                      {name || 'Your Full Name'}
                    </h3>

                    <p className="text-xs text-neutral-600 truncate mt-0.5 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{major || 'Your Major / Field'}</span>
                    </p>
                  </div>
                </div>

                {(currentRole || company) && (
                  <div className="bg-neutral-50 rounded-xl p-2.5 text-xs text-neutral-700 flex items-start gap-2 border border-neutral-100">
                    <Briefcase className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900 truncate">
                        {currentRole || 'Your Title'}
                      </p>
                      {company && (
                        <p className="text-neutral-500 truncate text-[11px]">
                          {company}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{location || 'City, State'}</span>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
                  {bio ||
                    'Write a friendly bio introduces yourself, what you are studying or working on, and how you would like to connect!'}
                </p>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    {instagram && <Instagram className="w-4 h-4 text-pink-500" />}
                    {linkedin && <Linkedin className="w-4 h-4 text-blue-600" />}
                    {email && <Mail className="w-4 h-4 text-neutral-500" />}
                    {!instagram && !linkedin && !email && <span>Socials preview</span>}
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700">Ready to post</span>
                </div>
              </div>

              {/* Informative tips */}
              <div className="bg-blue-50/80 border border-blue-200/70 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                  Instant Publication
                </p>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  Your profile goes live immediately to the {selectedSchool.shortName} network directory. Other students and alumni can discover your card and reach out.
                </p>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="pt-6 border-t border-neutral-200 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-98"
              >
                Post Profile Instantly
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Footer */}
        <div className="md:hidden px-6 py-3 border-t border-neutral-200 bg-white flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-semibold"
          >
            Post Profile
          </button>
        </div>
      </div>

      {/* Interactive Photo Cropper */}
      <PhotoCropperModal
        isOpen={isCropperOpen}
        imageSrc={sourceImageForCrop || photoUrl}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={(croppedUrl) => {
          setPhotoUrl(croppedUrl);
          setIsCropped(true);
          setErrors((prev) => ({ ...prev, photo: '' }));
        }}
      />
    </div>
  );
};
