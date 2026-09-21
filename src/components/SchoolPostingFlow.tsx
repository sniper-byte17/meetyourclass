import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Upload,
  Instagram,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Eye,
  Copy,
  Download,
  Share2,
  MapPin,
  GraduationCap,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Building2,
  Smile,
  Users,
  Crop,
  Check,
  Music2,
  Palette,
  Link as LinkIcon,
} from 'lucide-react';
import { School, Profile, UserRole, PostingSpeedTier, PaymentMode } from '../types';
import { SAMPLE_AVATARS } from '../data/schoolsData';
import { CATEGORIZED_MAJORS, ALL_54_STATES, POPULAR_HOMETOWN_HUBS } from '../data/majorsAndLocations';
import { SchoolPhotoTemplate, generateTemplatedCanvas, getSchoolIgTag } from './SchoolPhotoTemplate';
import { CheckoutPayment } from './CheckoutPayment';
import { PhotoCropperModal } from './PhotoCropperModal';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { getSchoolMainPageUrl, getSchoolPostingUrl } from '../utils/schoolLinks';

interface SchoolPostingFlowProps {
  school: School;
  onBackToSchools: () => void;
  onSubmitProfile: (profile: Profile) => void;
}

const INTEREST_TAGS = [
  'Looking for Roommates',
  'Pre-Med / Health',
  'Business & Finance',
  'Computer Science / Tech',
  'Coffee Chats',
  'Club Sports / Gym',
  'Music & Concerts',
  'Greek Life',
  'Visual Arts & Film',
  'Study Groups',
  'Campus Tours',
  'Foodies',
];

export const SchoolPostingFlow: React.FC<SchoolPostingFlowProps> = ({
  school,
  onBackToSchools,
  onSubmitProfile,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [currentViewMode, setCurrentViewMode] = useState<'wizard' | 'checkout' | 'confirmed'>('wizard');
  const [completedOrder, setCompletedOrder] = useState<{
    orderId: string;
    tier: PostingSpeedTier;
    mode: PaymentMode;
    amount: number;
    paymentNote: string;
  } | null>(null);
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<UserRole>('student');
  const [gradYear, setGradYear] = useState<number>(2031); // Default to 2031 as requested
  const [major, setMajor] = useState<string>('');
  const [hometown, setHometown] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>(SAMPLE_AVATARS[0]);
  const [sourceImageForCrop, setSourceImageForCrop] = useState<string>(SAMPLE_AVATARS[0]);
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const [isCropped, setIsCropped] = useState<boolean>(false);
  const [cropSuccessToast, setCropSuccessToast] = useState<boolean>(false);
  const [instagram, setInstagram] = useState<string>('');
  const [tiktok, setTiktok] = useState<string>('');
  const [snapchat, setSnapchat] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [lookingFor, setLookingFor] = useState<string>('Roommate & new friends');
  const [tags, setTags] = useState<string[]>(['Looking for Roommates', 'Coffee Chats']);
  const [customTag, setCustomTag] = useState<string>('');
  const [isCustomMajor, setIsCustomMajor] = useState<boolean>(false);
  const [selectedLocationHub, setSelectedLocationHub] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showIgLinksModal, setShowIgLinksModal] = useState<boolean>(false);
  const [copiedLinkType, setCopiedLinkType] = useState<string | null>(null);

  const cleanHandle = instagram.trim().replace('@', '');
  const cleanTikTok = tiktok.trim().replace('@', '');
  const igPageHandle = (school.instagramHandle && school.instagramHandle !== 'no username')
    ? school.instagramHandle
    : `@${school.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}2031`;

  // File Upload Handler - triggers photo cropper directly
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
          setIsCropped(false);
          setIsCropperOpen(true); // Automatically open the crop modal to crop photo to user's liking!
          setErrors((prev) => ({ ...prev, photo: '' }));
        }
      };
      reader.readAsDataURL(file);
      // Reset input value so re-uploading the same image triggers
      e.target.value = '';
    }
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setPhotoUrl(croppedDataUrl);
    setIsCropped(true);
    setErrors((prev) => ({ ...prev, photo: '' }));
    setCropSuccessToast(true);
    setTimeout(() => setCropSuccessToast(false), 4000);
  };

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else if (tags.length < 5) {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTag.trim()) {
      e.preventDefault();
      const val = customTag.trim();
      if (!tags.includes(val) && tags.length < 5) {
        setTags([...tags, val]);
        setCustomTag('');
      }
    }
  };

  // Step Validation
  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!name.trim()) newErrors.name = 'Please enter your full name';
      if (!major.trim()) newErrors.major = 'Please enter your major or program';
      if (!hometown.trim()) newErrors.hometown = 'Please enter your city/hometown';
      if (!photoUrl) newErrors.photo = 'Please select or upload a portrait photo';
    } else if (stepNumber === 2) {
      if (!cleanHandle) newErrors.instagram = 'Please provide your Instagram username so we can tag you';
    } else if (stepNumber === 3) {
      if (!bio.trim()) newErrors.bio = 'Please write a brief introduction for future classmates';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setCurrentStep(1);
      return;
    }

    const createdProfile: Profile = {
      id: `post-${Date.now()}`,
      schoolId: school.id,
      name: name.trim(),
      role,
      gradYear: Number(gradYear),
      major: major.trim(),
      currentRole: role === 'student' ? `Incoming Class of '${String(gradYear).slice(-2)}` : 'Alumni',
      location: hometown.trim(),
      bio: bio.trim(),
      tags,
      instagram: cleanHandle || undefined,
      tiktok: cleanTikTok || undefined,
      photoUrl,
      createdAt: new Date().toISOString().split('T')[0],
      isUserSubmission: true,
    };

    onSubmitProfile(createdProfile);
    setCurrentViewMode('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formattedCaption = `Introducing ${name.trim() || 'New Student'} (${cleanHandle ? `@${cleanHandle}` : ''}) to the ${school.name} Class of ${gradYear}! 🎓✨\n\n` +
    `📍 Hometown: ${hometown || 'Campus'}\n` +
    `📚 Major: ${major || 'Undeclared'}\n` +
    `✨ About: "${bio || 'Excited to meet everyone!'}"\n` +
    (cleanTikTok ? `📱 TikTok: @${cleanTikTok}\n` : '') +
    (snapchat ? `👻 Snap: ${snapchat}\n` : '') +
    `🔍 Looking for: ${lookingFor}\n\n` +
    `Drop a comment below or DM @${cleanHandle || 'them'} to connect before move-in! Welcome to the ${school.shortName} family! 🦅💙\n\n` +
    `#${school.shortName.replace(/[^a-zA-Z0-9]/g, '')} #ClassOf${gradYear} #MeetFutureClass #CollegeBound`;

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(formattedCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 3000);
  };

  // CHECKOUT PAYMENT SCREEN
  if (currentViewMode === 'checkout') {
    return (
      <CheckoutPayment
        submission={{
          school,
          name: name.trim(),
          instagram: cleanHandle,
          tiktok: cleanTikTok || undefined,
          gradYear: Number(gradYear),
          major: major.trim(),
          hometown: hometown.trim(),
          bio: bio.trim(),
          photoUrl,
          lookingFor,
          tags,
          formattedCaption,
        }}
        onBackToEdit={() => {
          setCurrentViewMode('wizard');
          setCurrentStep(4);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onPaymentComplete={(orderData) => {
          setCompletedOrder(orderData);
          setCurrentViewMode('confirmed');
          window.scrollTo({ top: 0, behavior: 'smooth' });

          // Send submission to backend with pending verification
          api.createSubmission({
            school,
            name: name.trim() || 'New Student',
            instagram: cleanHandle || '',
            tiktok: cleanTikTok || undefined,
            gradYear: Number(gradYear),
            major: major.trim() || 'Undeclared',
            hometown: hometown.trim() || 'Campus',
            bio: bio.trim(),
            lookingFor,
            tags,
            photoUrl,
            tier: orderData.tier,
            price: orderData.amount,
            status: 'queued',
            paymentStatus: 'pending_verification',
            paymentMethod: orderData.mode,
            paymentHandle: orderData.senderHandleOrName || orderData.paymentNote,
            paymentProofType: orderData.paymentProofType,
            paymentProofUrl: orderData.paymentProofUrl,
            paymentProofNote: orderData.paymentNote,
            caption: formattedCaption,
          }).catch((err) => {
            console.warn('Backend submission sync note:', err);
          });

          // Verify payment with backend
          api.verifyPayment({
            submissionId: orderData.orderId,
            studentName: name.trim() || 'New Student',
            studentHandle: cleanHandle || '',
            schoolId: school.id,
            tier: orderData.tier,
            amount: orderData.amount,
            paymentMode: orderData.mode,
            payerHandleOrMemo: orderData.paymentNote,
          }).catch((err) => {
            console.warn('Backend payment verification sync note:', err);
          });
        }}
      />
    );
  }

  // SUCCESS CONFIRMATION & QUEUE RECEIPT SCREEN
  if (currentViewMode === 'confirmed') {
    const tierDetails =
      completedOrder?.tier === 'instant'
        ? {
            name: 'Instant Priority Posting',
            time: 'Within 1 Hour (Instant)',
            price: '$10.00',
            badge: 'Instant Queue Front',
            badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          }
        : completedOrder?.tier === '48hours'
        ? {
            name: '48-Hour Priority',
            time: 'Within 48 Hours (2 Days)',
            price: '$7.00',
            badge: '48h Fast Track',
            badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          }
        : {
            name: 'Standard Queue',
            time: 'Within 5 Business Days',
            price: '$5.00',
            badge: 'Standard Queue',
            badgeBg: 'bg-neutral-100 text-neutral-700 border-neutral-200',
          };

    const modeLabel =
      completedOrder?.mode === 'venmo'
        ? 'Venmo'
        : completedOrder?.mode === 'zelle'
        ? 'Zelle'
        : completedOrder?.mode === 'cashapp'
        ? 'Cash App'
        : 'PayPal';

    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Payment Proof Submitted • Queue Ticket #{completedOrder?.orderId || 'CC-2031'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            You&apos;re Queued for <span className="text-pink-600">{igPageHandle}</span>!
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 max-w-xl mx-auto">
            Your profile card and proof of payment ({tierDetails.price} via {modeLabel}) have been submitted. Our campus administrators review your receipt or link and will publish your feature post according to your selected timeframe.
          </p>
        </div>

        {/* Order Status & Turnaround Summary */}
        <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg grid grid-cols-2 sm:grid-cols-4 gap-5 text-center">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Turnaround Speed</span>
            <span className="text-sm sm:text-base font-bold text-rose-400 block">{tierDetails.time}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Campus Feed</span>
            <span className="text-sm sm:text-base font-bold text-pink-400 block">{igPageHandle}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Payment Method</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 block">
              {modeLabel} ({tierDetails.price})
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Tagged Student</span>
            <span className="text-sm sm:text-base font-bold text-blue-400 block">@{cleanHandle}</span>
          </div>
        </div>

        {/* Generated Post Preview & Next Steps */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-md grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Mock IG Card */}
          <div className="mx-auto w-full max-w-xs bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-3 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                  style={{ backgroundColor: school.accentColor }}
                >
                  {school.shortName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900 leading-tight">{igPageHandle.replace('@', '')}</p>
                  <p className="text-[10px] text-neutral-400">{school.location}</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                Featured
              </span>
            </div>

            {/* Photo with Overlay Badge */}
            <div className="relative aspect-4/5 w-full bg-neutral-100 overflow-hidden">
              <img
                src={photoUrl}
                alt={name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                {school.shortName} &apos;{String(gradYear).slice(-2)}
              </div>
              {cleanHandle && (
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs text-neutral-900 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
                  <span className="flex items-center gap-1">
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    <span>@{cleanHandle}</span>
                  </span>
                  <span className="text-[10px] text-neutral-500">{hometown}</span>
                </div>
              )}
            </div>

            {/* Card Content Footer */}
            <div className="p-3.5 space-y-2 bg-neutral-50/60">
              <div className="flex items-center justify-between text-neutral-500">
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                  <MessageCircle className="w-4 h-4" />
                  <Send className="w-4 h-4" />
                </div>
                <Bookmark className="w-4 h-4" />
              </div>

              <div>
                <p className="text-xs font-bold text-neutral-900">{name}</p>
                <p className="text-[11px] text-neutral-600 line-clamp-2 mt-0.5">{bio}</p>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {tags.slice(0, 2).map((t) => (
                  <span key={t} className="text-[9px] font-semibold bg-white border border-neutral-200 px-1.5 py-0.5 rounded-md text-neutral-700">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions & Caption */}
          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-neutral-900">
                Next Steps for Your Feature
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Your post will be published to <strong className="text-neutral-900">{igPageHandle}</strong> within <strong className="text-neutral-900">{tierDetails.time}</strong>. You will receive a direct mention and story tag!
              </p>
            </div>

            {/* Pre-formatted caption box */}
            <div className="relative bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200/80">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Instagram Caption
                </span>
                <button
                  id="btn-copy-caption"
                  onClick={handleCopyCaption}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 bg-white border border-blue-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedCaption ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Caption</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-neutral-700 font-mono whitespace-pre-line line-clamp-6">
                {formattedCaption}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="btn-post-another"
                onClick={() => {
                  setCurrentViewMode('wizard');
                  setCurrentStep(1);
                  setName('');
                  setBio('');
                  setInstagram('');
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer"
              >
                <span>Submit Another Post</span>
              </button>

              <button
                id="btn-choose-school-done"
                onClick={onBackToSchools}
                className="inline-flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs sm:text-sm font-semibold py-3 px-4 rounded-xl border border-neutral-200 transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Explore Other Schools</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE POSTING WIZARD
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-8">
      {/* Top Breadcrumb & School Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-schools"
            onClick={onBackToSchools}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-neutral-600 hover:text-neutral-900 group transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-neutral-400 group-hover:text-neutral-900" />
            <span>All Campuses</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIgLinksModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Get Link 1 and Link 2 for this school's Instagram Bio"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Copy IG Bio Links</span>
          </button>
        </div>

        {/* School Identifier */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-xs"
            style={{ backgroundColor: school.accentColor }}
          >
            {school.shortName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900 leading-tight">
                {school.name}
              </h2>
              <span className="text-[11px] font-bold text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Instagram className="w-3 h-3" />
                <span>{igPageHandle}</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              {school.location} • Class of {gradYear} Official Feature
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator Tracker */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-3 sm:p-5 shadow-xs">
        {/* Mobile View: High-density step banner with animated progress segments */}
        <div className="sm:hidden space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-[11px] font-extrabold uppercase tracking-wide">
                Step 0{currentStep} / 04
              </span>
              <span className="text-xs font-bold text-neutral-800 truncate">
                {currentStep === 1 && 'Photo & Program'}
                {currentStep === 2 && 'Handle & Socials'}
                {currentStep === 3 && 'Bio & Interests'}
                {currentStep === 4 && 'Preview & Post'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-neutral-400">
              {Math.round((currentStep / 4) * 100)}%
            </span>
          </div>

          {/* 4 Interactive Progress Segments */}
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((stepNum) => (
              <button
                key={stepNum}
                type="button"
                onClick={() => {
                  if (stepNum < currentStep || validateStep(currentStep)) {
                    setCurrentStep(stepNum);
                  }
                }}
                className="h-2 rounded-full overflow-hidden bg-neutral-100 relative cursor-pointer"
                title={`Go to step ${stepNum}`}
              >
                <div
                  className={`h-full w-full transition-all duration-300 ${
                    currentStep >= stepNum
                      ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600'
                      : 'bg-transparent'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Desktop View: 4-Column Grid */}
        <div className="hidden sm:grid grid-cols-4 gap-2">
          {[
            { step: 1, title: 'Photo & Program' },
            { step: 2, title: 'Handle & Socials' },
            { step: 3, title: 'Bio & Interests' },
            { step: 4, title: 'Preview & Post' },
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => {
                if (item.step < currentStep || validateStep(currentStep)) {
                  setCurrentStep(item.step);
                }
              }}
              className={`text-left p-2 sm:p-2.5 rounded-xl transition-all border cursor-pointer ${
                currentStep === item.step
                  ? 'bg-pink-50/80 border-pink-300 text-pink-900 shadow-xs'
                  : currentStep > item.step
                  ? 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                  : 'bg-transparent border-transparent text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                {currentStep > item.step ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-pink-600" />
                ) : (
                  <span>0{item.step}</span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-semibold truncate mt-0.5">
                {item.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Wizard Form Body */}
      <div className="bg-white border border-neutral-200 rounded-3xl shadow-md overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* STEP 1: Photo & Basic Details */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="p-5 sm:p-10 space-y-7 sm:space-y-8"
            >
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                <span>Step 01 of 04</span>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Upload Photo & Academic Info
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                This portrait will be featured on the {school.shortName} class feed and story slides.
              </p>
            </div>

            {/* Photo Upload Area */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Portrait Photo *
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                <div
                  onClick={() => {
                    setSourceImageForCrop(sourceImageForCrop || photoUrl);
                    setIsCropperOpen(true);
                  }}
                  className="relative group w-32 h-40 sm:w-36 sm:h-44 rounded-2xl overflow-hidden bg-neutral-900 border-2 border-white shadow-md shrink-0 cursor-pointer"
                  title="Click to crop and adjust photo"
                >
                  <SchoolPhotoTemplate
                    photoUrl={photoUrl}
                    school={school}
                    studentInstagram={cleanHandle}
                    studentName={name}
                    gradYear={gradYear}
                    major={major}
                    hometown={hometown}
                    className="w-full h-full"
                    showWatermark={false}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white text-xs font-bold transition-opacity z-10">
                    <Crop className="w-5 h-5 text-pink-400" />
                    <span>{isCropped ? 'Re-crop Photo' : 'Crop Photo'}</span>
                  </div>
                  {isCropped && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-md flex items-center gap-1 z-10">
                      <Check className="w-3 h-3" />
                      <span>Cropped</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 flex-1 text-center sm:text-left">
                  {/* Template info pill */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200/80 text-[11px] text-neutral-700 font-medium">
                    <Palette className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                    <span>
                      <strong>Custom Campus Template:</strong> University colors ({school.shortName}), student tag on top, and school IG at bottom.
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      id="btn-upload-photo-step1"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl shadow-xs transition-opacity cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Your Photo</span>
                    </button>

                    <button
                      type="button"
                      id="btn-crop-photo-step1"
                      onClick={() => {
                        setSourceImageForCrop(sourceImageForCrop || photoUrl);
                        setIsCropperOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-neutral-100 text-neutral-800 text-xs sm:text-sm font-bold py-2.5 px-3.5 rounded-xl border border-neutral-300 shadow-xs transition-colors cursor-pointer"
                      title="Adjust crop, zoom, rotation or aspect ratio"
                    >
                      <Crop className="w-4 h-4 text-pink-600" />
                      <span>Crop / Adjust</span>
                    </button>

                    <span className="text-xs text-neutral-400">JPG, PNG under 8MB</span>
                  </div>

                  <AnimatePresence>
                    {cropSuccessToast && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Photo cropped & framing updated successfully!</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-[11px] text-neutral-500">
                    💡 Uploading a photo opens the interactive cropper. You can crop to 4:5 (Instagram portrait), square, zoom, rotate, or reposition anytime.
                  </p>

                  {errors.photo && (
                    <p className="text-xs font-semibold text-rose-600">{errors.photo}</p>
                  )}

                  {/* Sample selection */}
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-500 mb-1.5">
                      Or select sample portrait:
                    </p>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {SAMPLE_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPhotoUrl(url);
                            setSourceImageForCrop(url);
                            setIsCropped(false);
                          }}
                          className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                            photoUrl === url ? 'border-blue-600 scale-105 shadow-sm' : 'border-neutral-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Sample ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Name, Class Year, Role */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  id="input-post-name"
                  type="text"
                  placeholder="e.g., Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-neutral-50 border text-sm font-medium text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-rose-400 ring-1 ring-rose-300' : 'border-neutral-200'
                  }`}
                />
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Class Year *
                </label>
                <select
                  id="select-post-class-year"
                  value={gradYear}
                  onChange={(e) => setGradYear(Number(e.target.value))}
                  className="w-full px-3.5 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-semibold text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value={2031}>Class of 2031 (Freshman)</option>
                  <option value={2030}>Class of 2030</option>
                  <option value={2029}>Class of 2029</option>
                  <option value={2028}>Class of 2028</option>
                  <option value={2027}>Class of 2027</option>
                  <option value={2026}>Class of 2026</option>
                  <option value={2025}>Class of 2025 / Alumni</option>
                </select>
              </div>
            </div>

            {/* Major & Hometown Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="select-post-major" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Major / Field of Study *
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
                  <div className="space-y-2">
                    <select
                      id="select-post-major"
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
                      className={`w-full px-4 py-3 rounded-xl bg-neutral-50 border text-sm font-medium text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                        errors.major ? 'border-rose-400 ring-1 ring-rose-300' : 'border-neutral-200'
                      }`}
                    >
                      <option value="">-- Choose Major from dropdown --</option>
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
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      id="input-post-custom-major"
                      type="text"
                      autoFocus
                      placeholder="e.g. Neuroscience & Finance, Undeclared..."
                      value={major}
                      onChange={(e) => {
                        setMajor(e.target.value);
                        setErrors((prev) => ({ ...prev, major: '' }));
                      }}
                      className={`w-full px-4 py-3 rounded-xl bg-neutral-50 border text-sm font-medium text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                        errors.major ? 'border-rose-400 ring-1 ring-rose-300' : 'border-neutral-200'
                      }`}
                    />
                  </div>
                )}
                {errors.major && <p className="text-xs text-rose-600 mt-1">{errors.major}</p>}
              </div>

              <div>
                <label htmlFor="select-post-hometown" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Hometown / State *
                </label>
                <div className="space-y-2">
                  <select
                    id="select-post-hometown"
                    value={selectedLocationHub}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedLocationHub(val);
                      if (val && val !== '__manual__') {
                        setHometown(val);
                        setErrors((prev) => ({ ...prev, hometown: '' }));
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-medium text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- Choose Hometown / State from dropdown --</option>
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
                    id="input-post-hometown"
                    type="text"
                    placeholder="City, State (e.g. Atlanta, GA or Chicago, IL)"
                    value={hometown}
                    onChange={(e) => {
                      setHometown(e.target.value);
                      setErrors((prev) => ({ ...prev, hometown: '' }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl bg-neutral-50 border text-xs sm:text-sm font-medium text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      errors.hometown ? 'border-rose-400 ring-1 ring-rose-300' : 'border-neutral-200'
                    }`}
                  />
                </div>
                {errors.hometown && <p className="text-xs text-rose-600 mt-1">{errors.hometown}</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Instagram Handle & Socials */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="p-5 sm:p-10 space-y-7 sm:space-y-8"
          >
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold uppercase tracking-wider mb-2">
                <span>Step 02 of 04</span>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Instagram Tag & Socials
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Your Instagram username is required so the official {igPageHandle} account can tag your profile in the feed and story.
              </p>
            </div>

            {/* Main Instagram Handle */}
            <div className="max-w-xl space-y-2">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Your Instagram Handle *
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-neutral-400 font-bold text-base select-none">
                  @
                </div>
                <input
                  id="input-post-instagram"
                  type="text"
                  placeholder="your_handle"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className={`w-full pl-9 pr-4 py-3.5 rounded-xl bg-neutral-50 border text-base font-semibold text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-pink-500 ${
                    errors.instagram ? 'border-rose-400 ring-1 ring-rose-300' : 'border-neutral-200'
                  }`}
                />
              </div>
              {errors.instagram && (
                <p className="text-xs text-rose-600 mt-1">{errors.instagram}</p>
              )}

              {cleanHandle && (
                <div className="flex items-center gap-2 p-3 bg-pink-50/70 border border-pink-200 rounded-xl text-xs font-medium text-pink-800">
                  <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                  <span>
                    You will be tagged as <strong>@{cleanHandle}</strong> on <strong>{igPageHandle}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Optional secondary handles */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Optional Secondary Socials & Preferences
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Connect on other platforms so future classmates and prospective roommates can reach out.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* TikTok Handle (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 text-pink-600" />
                      <span>TikTok Handle (optional)</span>
                    </span>
                    <span className="text-[10px] text-neutral-400">@username</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-neutral-400 font-bold text-xs select-none">
                      @
                    </span>
                    <input
                      id="input-post-tiktok"
                      type="text"
                      placeholder="your_tiktok"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm font-medium text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  {cleanTikTok && (
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Featured in caption as: @{cleanTikTok}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Snapchat Username (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. alex_snap"
                    value={snapchat}
                    onChange={(e) => setSnapchat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm font-medium text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    What are you looking for most?
                  </label>
                  <select
                    value={lookingFor}
                    onChange={(e) => setLookingFor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm font-medium text-neutral-900 focus:bg-white"
                  >
                    <option value="Roommate & new friends">Roommate & new friends</option>
                    <option value="Study groups & peers in my major">Study groups & peers in my major</option>
                    <option value="Campus friends & social life">Campus friends & social life</option>
                    <option value="Club sports & workout buddies">Club sports & workout buddies</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Bio & Interests */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="p-5 sm:p-10 space-y-7 sm:space-y-8"
          >
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                <span>Step 03 of 04</span>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Bio & Interests
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Introduce yourself in 2–3 sentences. Mention what you like doing, dorm preferences, or fun facts!
              </p>
            </div>

            {/* Bio textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Introduction / Caption Bio *
                </label>
                <span className="text-xs text-neutral-400">{bio.length}/350 chars</span>
              </div>
              <textarea
                id="textarea-post-bio"
                rows={4}
                maxLength={350}
                placeholder={`Hey everyone! Super excited to be attending ${school.name} this fall! I love hiking, playing guitar, trying new coffee spots, and I'm currently looking for a roommate. Don't hesitate to DM me!`}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl bg-neutral-50 border text-sm font-medium text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                  errors.bio ? 'border-rose-400 ring-1 ring-rose-300' : 'border-neutral-200'
                }`}
              />
              {errors.bio && <p className="text-xs text-rose-600 mt-1">{errors.bio}</p>}
            </div>

            {/* Networking Tags */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Select Your Tags / Interests (Up to 5)
              </label>

              <div className="flex flex-wrap gap-2">
                {INTEREST_TAGS.map((tag) => {
                  const selected = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selected
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {selected ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>

              {/* Custom tag input */}
              <div className="pt-2 max-w-sm">
                <input
                  type="text"
                  placeholder="Type custom interest and hit Enter..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-800"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Live Preview & Submit */}
        {currentStep === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="p-5 sm:p-10 space-y-7 sm:space-y-8"
          >
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                <span>Step 04 of 04</span>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Review Your Instagram Card & Post
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Here is exactly how your card will look when posted to {igPageHandle}.
              </p>
            </div>

            {/* Side-by-side preview and details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Instagram Card Mockup */}
              <div className="mx-auto w-full max-w-xs bg-white rounded-3xl border border-neutral-200 shadow-xl overflow-hidden flex flex-col">
                <div className="p-3 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full text-xs font-bold text-white flex items-center justify-center shrink-0"
                      style={{ backgroundColor: school.accentColor }}
                    >
                      {school.shortName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900 leading-tight">
                        {igPageHandle.replace('@', '')}
                      </p>
                      <p className="text-[10px] text-neutral-400">{school.name}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full">
                    Official Post
                  </span>
                </div>

                <div className="relative aspect-4/5 w-full bg-neutral-900 overflow-hidden">
                  <SchoolPhotoTemplate
                    photoUrl={photoUrl}
                    school={school}
                    studentInstagram={cleanHandle}
                    studentName={name}
                    gradYear={gradYear}
                    major={major}
                    hometown={hometown}
                    className="w-full h-full"
                    showWatermark={true}
                  />
                </div>

                <div className="p-4 space-y-2 bg-neutral-50/70">
                  <div className="flex items-center justify-between text-neutral-600">
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <MessageCircle className="w-4 h-4" />
                      <Send className="w-4 h-4" />
                    </div>
                    <Bookmark className="w-4 h-4" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-neutral-900">
                      {name || 'Your Name'}
                    </p>
                    <p className="text-[11px] text-neutral-700 font-medium line-clamp-3 mt-1">
                      {bio || 'No bio entered yet.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {tags.map((t) => (
                      <span key={t} className="text-[9px] font-semibold bg-white border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-600">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Direct crop adjustment & download template buttons */}
                <div className="p-3 bg-neutral-100/70 border-t border-neutral-200 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    id="btn-recrop-step4"
                    onClick={() => {
                      setSourceImageForCrop(sourceImageForCrop || photoUrl);
                      setIsCropperOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Adjust Crop</span>
                  </button>
                  <button
                    type="button"
                    id="btn-download-templated-photo"
                    onClick={async () => {
                      try {
                        const dataUri = await generateTemplatedCanvas(photoUrl, school, cleanHandle, gradYear, major, hometown);
                        const a = document.createElement('a');
                        a.href = dataUri;
                        a.download = `${school.shortName}_ClassOf${gradYear}_${name.trim() || 'Student'}.jpg`;
                        a.click();
                      } catch (err) {
                        console.error('Error downloading templated photo:', err);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-700 hover:text-pink-800 bg-pink-50 hover:bg-pink-100/80 border border-pink-200 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Templated Graphic</span>
                  </button>
                </div>
              </div>

              {/* Submission Summary & Instant Post CTA */}
              <div className="space-y-6">
                {/* Creative Custom Template Active Banner */}
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 border border-pink-200/80 text-xs text-neutral-800">
                  <Palette className="w-4 h-4 text-pink-600 shrink-0" />
                  <span>
                    <strong>Custom {school.shortName} Template Applied:</strong> University theme colors, student tag @{cleanHandle || 'handle'} on top, and {school.instagramHandle || `@${school.shortName.toLowerCase()}2031`} on bottom.
                  </span>
                </div>

                <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 space-y-3">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Post Summary
                  </h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between py-1 border-b border-neutral-200/60">
                      <span className="text-neutral-500">School / Page:</span>
                      <span className="font-semibold text-neutral-900">{school.name} ({igPageHandle})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-200/60">
                      <span className="text-neutral-500">Student:</span>
                      <span className="font-semibold text-neutral-900">{name} (Class of {gradYear})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-200/60">
                      <span className="text-neutral-500">Major:</span>
                      <span className="font-semibold text-neutral-900">{major}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-200/60">
                      <span className="text-neutral-500">Instagram Handle:</span>
                      <span className="font-bold text-pink-600">@{cleanHandle}</span>
                    </div>
                    {cleanTikTok && (
                      <div className="flex justify-between py-1 border-b border-neutral-200/60">
                        <span className="text-neutral-500">TikTok Handle:</span>
                        <span className="font-semibold text-pink-600">@{cleanTikTok}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1">
                      <span className="text-neutral-500">Hometown:</span>
                      <span className="font-semibold text-neutral-900">{hometown}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-pink-900">
                    <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                    <span>Next: Select Checkout & Posting Speed</span>
                  </div>
                  <p className="text-xs text-pink-800 leading-relaxed">
                    Charges vary by posting speed: <strong>Instant ($10.00)</strong>, <strong>48 Hours ($7.00)</strong>, or <strong>5 Days ($5.00)</strong>. Supported payment modes include <strong>Venmo</strong> (with Safari support), <strong>Zelle</strong>, <strong>PayPal</strong>, and <strong>Cash App</strong>.
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  id="btn-final-submit-post"
                  onClick={handleSubmit}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white text-sm sm:text-base font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all cursor-pointer min-h-[48px]"
                >
                  <span>Submit Info & Proceed to Checkout Options</span>
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Wizard Footer Navigation Controls - Mobile optimized with sticky bottom ergonomics */}
        <div className="sticky bottom-0 sm:static z-20 px-4 sm:px-6 py-3.5 sm:py-4 bg-white/95 sm:bg-neutral-50/90 backdrop-blur-md sm:backdrop-blur-none border-t border-neutral-200 shadow-lg sm:shadow-none flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              id="btn-wizard-prev"
              onClick={handlePrevStep}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-700 hover:text-neutral-900 px-3.5 py-2.5 rounded-xl hover:bg-neutral-200/70 transition-colors cursor-pointer min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              id="btn-wizard-next"
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer min-h-[44px]"
            >
              <span>Continue to Step 0{currentStep + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              id="btn-wizard-submit-alt"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer min-h-[44px]"
            >
              <span>Proceed to Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Interactive Photo Cropper Dialog */}
      <PhotoCropperModal
        isOpen={isCropperOpen}
        imageSrc={sourceImageForCrop || photoUrl}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />

      {/* IG Bio Links Dialog for this Campus */}
      <AnimatePresence>
        {showIgLinksModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-neutral-900 text-sm">
                      Instagram Bio Links for {school.shortName}
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Copy these two links to put in your @{igPageHandle.replace('@', '')} bio
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowIgLinksModal(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Link 1: Main Page */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-neutral-900 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Link 1: Main Page / Campus Hub</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-medium">Browse Classmates</span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Takes students to explore the full campus directory and meet future classmates.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/?school=${school.id}` : ''}
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-white border border-neutral-300 font-mono text-[11px] text-neutral-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/?school=${school.id}`;
                      navigator.clipboard.writeText(url);
                      setCopiedLinkType('main');
                      setTimeout(() => setCopiedLinkType(null), 3000);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                      copiedLinkType === 'main'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-neutral-900 hover:bg-black text-white'
                    }`}
                  >
                    {copiedLinkType === 'main' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link 1</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Link 2: Direct Post & Submit */}
              <div className="p-3.5 rounded-2xl bg-pink-50/70 border border-pink-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-pink-900 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Link 2: Direct Post & Submit</span>
                  </span>
                  <span className="text-[10px] text-pink-700 font-bold">Fast-Track Form</span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Directly opens this submission wizard so students can upload their photo, bio, and submit immediately.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/?school=${school.id}&post=1` : ''}
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-white border border-pink-300 font-mono text-[11px] text-pink-950"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/?school=${school.id}&post=1`;
                      navigator.clipboard.writeText(url);
                      setCopiedLinkType('post');
                      setTimeout(() => setCopiedLinkType(null), 3000);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                      copiedLinkType === 'post'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-pink-600 hover:bg-pink-700 text-white'
                    }`}
                  >
                    {copiedLinkType === 'post' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link 2</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 bg-neutral-100 p-2.5 rounded-xl">
                💡 <strong>Instagram Tip:</strong> You can add multiple links directly in your Instagram bio! Go to <em>Edit Profile &rarr; Links &rarr; Add external link</em> and add both links with clean titles.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
