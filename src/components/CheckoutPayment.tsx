import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Zap,
  Copy,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Instagram,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  Share2,
  Lock,
  Compass,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import {
  School,
  PostingSpeedTier,
  PaymentMode,
  SpeedTierOption,
  CheckoutSubmissionData,
} from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CheckoutPaymentProps {
  submission: CheckoutSubmissionData;
  onBackToEdit: () => void;
  onPaymentComplete: (orderData: {
    orderId: string;
    tier: PostingSpeedTier;
    mode: PaymentMode;
    amount: number;
    paymentNote: string;
  }) => void;
}

const SPEED_TIERS: SpeedTierOption[] = [
  {
    id: 'instant',
    title: 'Instant Priority Posting',
    timeframe: 'Posted within 1 hour',
    price: 10.0,
    badge: 'MOST POPULAR',
    badgeColor: 'bg-rose-500 text-white',
    description: 'Bypasses the entire queue. Posted immediately and pinned to the top of the campus page.',
    iconType: 'instant',
  },
  {
    id: '48hours',
    title: '48-Hour Priority',
    timeframe: 'Posted within 2 days',
    price: 7.0,
    badge: 'FAST TRACK',
    badgeColor: 'bg-blue-600 text-white',
    description: 'Fast-tracked into the prime afternoon posting schedule within 48 hours.',
    iconType: 'fast',
  },
  {
    id: '5days',
    title: 'Standard Queue',
    timeframe: 'Posted within 5 days',
    price: 5.0,
    badge: 'BUDGET VALUE',
    badgeColor: 'bg-neutral-600 text-white',
    description: 'Published in chronological order as submissions are verified across batches.',
    iconType: 'standard',
  },
];

export const CheckoutPayment: React.FC<CheckoutPaymentProps> = ({
  submission,
  onBackToEdit,
  onPaymentComplete,
}) => {
  const [selectedTier, setSelectedTier] = useState<PostingSpeedTier>('instant');
  const [selectedMode, setSelectedMode] = useState<PaymentMode>('venmo');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [safariCopied, setSafariCopied] = useState<boolean>(false);
  const [senderIdentifier, setSenderIdentifier] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showSafariHelpModal, setShowSafariHelpModal] = useState<boolean>(false);

  const currentTierObj = SPEED_TIERS.find((t) => t.id === selectedTier) || SPEED_TIERS[0];
  const cleanHandle = submission.instagram.trim().replace('@', '');
  const priceFormatted = `$${currentTierObj.price.toFixed(2)}`;

  // Payment Accounts configuration
  const paymentDetails = {
    venmo: {
      handle: '@CampusClassPosts',
      name: 'Campus Class Admin',
      note: `${submission.name} @${cleanHandle || 'student'} - ${submission.school.shortName} (${currentTierObj.title})`,
      webUrl: `https://account.venmo.com/pay?recipients=CampusClassPosts&amount=${currentTierObj.price.toFixed(2)}&note=${encodeURIComponent(
        `${submission.name} @${cleanHandle} ${submission.school.shortName} ${selectedTier}`
      )}`,
      deepLinkUrl: `venmo://paycharge?txn=pay&recipients=CampusClassPosts&amount=${currentTierObj.price.toFixed(2)}&note=${encodeURIComponent(
        `${submission.name} @${cleanHandle} ${submission.school.shortName} ${selectedTier}`
      )}`,
      safariUrl: `https://venmo.com/CampusClassPosts?txn=pay&amount=${currentTierObj.price.toFixed(2)}&note=${encodeURIComponent(
        `${submission.name} @${cleanHandle} ${submission.school.shortName}`
      )}`,
    },
    zelle: {
      email: 'payments@meetfutureclass.com',
      phone: '(404) 555-2031',
      recipientName: 'MeetFutureClass Campus Network',
      memo: `${submission.name} @${cleanHandle || 'student'} - ${submission.school.shortName} ${selectedTier}`,
    },
    paypal: {
      handle: '@CampusClassPosts',
      url: `https://paypal.me/CampusClassPosts/${currentTierObj.price.toFixed(2)}`,
      name: 'Campus Features Network',
      memo: `${submission.name} @${cleanHandle || 'student'} - ${submission.school.shortName}`,
    },
    cashapp: {
      cashtag: '$CampusClassPosts',
      url: `https://cash.app/$CampusClassPosts/${currentTierObj.price.toFixed(2)}`,
      name: 'Campus Class Posts',
      memo: `${submission.name} @${cleanHandle || 'student'}`,
    },
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField((prev) => (prev === fieldKey ? null : prev));
    }, 2500);
  };

  const handleCopySafariVenmoLink = () => {
    // Copy the exact web link designed to trigger the Venmo app in Safari on iPhone
    const urlToCopy = paymentDetails.venmo.safariUrl;
    navigator.clipboard.writeText(urlToCopy);
    setSafariCopied(true);
    setCopiedField('safari-link');
    setTimeout(() => {
      setSafariCopied(false);
      setCopiedField(null);
    }, 4000);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const orderId = `CC-${Math.floor(100000 + Math.random() * 900000)}`;
      onPaymentComplete({
        orderId,
        tier: selectedTier,
        mode: selectedMode,
        amount: currentTierObj.price,
        paymentNote: paymentDetails[selectedMode].memo || paymentDetails.venmo.note,
      });
    }, 900);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Return */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <button
          onClick={onBackToEdit}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit Profile Details</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
          <span className="text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Step 1-4 Done
          </span>
          <span>&gt;</span>
          <span className="text-pink-600 font-bold">Step 5: Checkout & Speed</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Final Step • Choose Posting Speed</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          Select Your Checkout Option
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600">
          Your profile is ready to post on{' '}
          <strong className="text-neutral-900">
            {submission.school.instagramHandle && submission.school.instagramHandle !== 'no username'
              ? submission.school.instagramHandle
              : `@${submission.school.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}2031`}
          </strong>
          . Choose how quickly you want your feature live!
        </p>
      </div>

      {/* Grid Layout: Left Column = Tiers & Payment, Right Column = Summary & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Speed Tiers & Payment Modes (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* SECTION 1: SPEED TIERS */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>1. How fast do you want to be posted?</span>
                </h2>
                <p className="text-xs text-neutral-500">
                  Select your turnaround time for the {submission.school.shortName} official feed.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {SPEED_TIERS.map((tier) => {
                const isSelected = selectedTier === tier.id;
                return (
                  <motion.div
                    whileTap={{ scale: 0.985 }}
                    key={tier.id}
                    id={`tier-card-${tier.id}`}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`relative rounded-2xl p-4 sm:p-5 border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-pink-600 bg-pink-50/40 shadow-sm ring-2 ring-pink-500/20'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-pink-600 bg-pink-600' : 'border-neutral-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-neutral-900 text-sm sm:text-base">
                              {tier.title}
                            </span>
                            {tier.badge && (
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  tier.badgeColor || 'bg-neutral-900 text-white'
                                }`}
                              >
                                {tier.badge}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-neutral-600 leading-relaxed">
                            {tier.description}
                          </p>

                          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 pt-1">
                            {tier.iconType === 'instant' ? (
                              <Zap className="w-3.5 h-3.5 text-rose-500" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                            )}
                            <span className={isSelected ? 'text-neutral-900 font-bold' : ''}>
                              {tier.timeframe}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price Tag */}
                      <div className="text-right shrink-0">
                        <span className="text-xl sm:text-2xl font-black text-neutral-900">
                          ${tier.price.toFixed(2)}
                        </span>
                        <p className="text-[10px] text-neutral-500 font-medium">One-time</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: PAYMENT METHOD MODES */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
            <div className="border-b border-neutral-100 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <span>2. Select Payment Method</span>
                </h2>
                <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100">
                  Total: {priceFormatted}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Venmo is our primary option. We also accept Zelle, Cash App, and PayPal.
              </p>
            </div>

            {/* Payment Mode Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Venmo Tab */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                id="tab-payment-venmo"
                type="button"
                onClick={() => setSelectedMode('venmo')}
                className={`relative p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  selectedMode === 'venmo'
                    ? 'border-blue-500 bg-blue-50/80 text-blue-950 font-bold shadow-sm ring-2 ring-blue-400/20'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-600 text-white uppercase tracking-wider shadow-xs">
                  Main Option
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#008CFF] text-white flex items-center justify-center font-black text-base italic shadow-xs">
                  V
                </div>
                <span className="text-xs font-bold">Venmo</span>
                <span className="text-[10px] text-neutral-500 font-normal">iOS & Safari</span>
              </motion.button>

              {/* Zelle Tab */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                id="tab-payment-zelle"
                type="button"
                onClick={() => setSelectedMode('zelle')}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  selectedMode === 'zelle'
                    ? 'border-purple-500 bg-purple-50/80 text-purple-950 font-bold shadow-sm ring-2 ring-purple-400/20'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#7414CA] text-white flex items-center justify-center font-black text-sm shadow-xs">
                  Z
                </div>
                <span className="text-xs font-bold">Zelle</span>
                <span className="text-[10px] text-neutral-500 font-normal">Bank to Bank</span>
              </motion.button>

              {/* Cash App Tab */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                id="tab-payment-cashapp"
                type="button"
                onClick={() => setSelectedMode('cashapp')}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  selectedMode === 'cashapp'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold shadow-sm ring-2 ring-emerald-400/20'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#00D632] text-white flex items-center justify-center font-black text-base shadow-xs">
                  $
                </div>
                <span className="text-xs font-bold">Cash App</span>
                <span className="text-[10px] text-neutral-500 font-normal">Cashtag</span>
              </motion.button>

              {/* PayPal Tab */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                id="tab-payment-paypal"
                type="button"
                onClick={() => setSelectedMode('paypal')}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  selectedMode === 'paypal'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-bold shadow-sm ring-2 ring-blue-500/20'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#003087] text-white flex items-center justify-center font-black text-xs shadow-xs">
                  P
                </div>
                <span className="text-xs font-bold">PayPal</span>
                <span className="text-[10px] text-neutral-500 font-normal">Instant</span>
              </motion.button>
            </div>

            {/* TAB CONTENT: VENMO (SPECIAL SAFARI IPHONE FOCUS) */}
            {selectedMode === 'venmo' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Safari iPhone Special Feature Highlight */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-pink-50 border border-blue-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900">
                          Pay with Venmo in Safari (iPhone)
                        </h3>
                        <p className="text-xs text-neutral-600">
                          Recommended when browsing inside Instagram or in-app view
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shrink-0">
                      iPhone Optimized
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 leading-relaxed">
                    If you are on an iPhone using Instagram’s in-app browser, Venmo often prevents in-app redirects. Copy the Safari payment link below and paste it into Safari to open Venmo smoothly.
                  </p>

                  {/* Copy Safari Link CTA */}
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      id="btn-copy-venmo-safari"
                      type="button"
                      onClick={handleCopySafariVenmoLink}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-[#008CFF] hover:bg-[#0077db] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-xs transition-all active:scale-98"
                    >
                      {safariCopied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>Copied Safari Link!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Venmo Link for Safari</span>
                        </>
                      )}
                    </button>

                    <a
                      id="btn-open-venmo-direct"
                      href={paymentDetails.venmo.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 text-xs sm:text-sm font-bold py-3 px-4 rounded-xl transition-all"
                    >
                      <span>Open Venmo App</span>
                      <ArrowUpRight className="w-4 h-4 text-neutral-500" />
                    </a>
                  </div>

                  {/* 3-Step Safari Instructions */}
                  <div className="bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-blue-100 space-y-2 text-xs">
                    <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      <span>How to Pay in Safari on iPhone:</span>
                    </p>
                    <ol className="space-y-1.5 text-neutral-600 list-decimal list-inside pl-1 text-[11px] sm:text-xs">
                      <li>
                        Tap <strong className="text-neutral-900">&quot;Copy Venmo Link for Safari&quot;</strong> above.
                      </li>
                      <li>
                        Switch to <strong className="text-neutral-900">Safari</strong> on your iPhone.
                      </li>
                      <li>
                        Paste into Safari&apos;s address bar and hit <strong className="text-neutral-900">Go</strong> — it will trigger &quot;Open in Venmo&quot; with {priceFormatted} prefilled!
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Direct Venmo Details for Manual Transfer */}
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-3">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Venmo Payment Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Username */}
                    <div className="bg-white rounded-xl p-3 border border-neutral-200 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-400 uppercase">
                          Venmo Handle
                        </p>
                        <p className="text-sm font-bold text-neutral-900">
                          {paymentDetails.venmo.handle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentDetails.venmo.handle, 'venmo-handle')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                      >
                        {copiedField === 'venmo-handle' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span className="text-[11px]">Copy</span>
                      </button>
                    </div>

                    {/* Amount */}
                    <div className="bg-white rounded-xl p-3 border border-neutral-200 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-400 uppercase">
                          Amount Due
                        </p>
                        <p className="text-sm font-bold text-neutral-900">{priceFormatted}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(currentTierObj.price.toFixed(2), 'venmo-amount')
                        }
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                      >
                        {copiedField === 'venmo-amount' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span className="text-[11px]">Copy</span>
                      </button>
                    </div>
                  </div>

                  {/* Required Memo */}
                  <div className="bg-white rounded-xl p-3 border border-neutral-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase">
                        Required Payment Note / Memo
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentDetails.venmo.note, 'venmo-note')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {copiedField === 'venmo-note' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[11px]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Copy Note</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs font-mono text-neutral-800 bg-neutral-100/80 p-2 rounded-lg break-all">
                      {paymentDetails.venmo.note}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      *Please include this note so we can match your payment with your Instagram submission instantly!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ZELLE */}
            {selectedMode === 'zelle' && (
              <div className="space-y-4 animate-in fade-in duration-200 bg-neutral-50 rounded-2xl p-5 border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#7414CA] text-white flex items-center justify-center font-bold text-xs">
                      Z
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">Zelle Direct Transfer</h3>
                      <p className="text-xs text-neutral-500">Send via your banking app (Chase, BoA, Wells Fargo, etc.)</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-900 bg-white px-2.5 py-1 rounded-lg border border-neutral-200">
                    {priceFormatted}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Email */}
                  <div className="bg-white rounded-xl p-3 border border-neutral-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase">
                        Zelle Email Recipient
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-neutral-900">
                        {paymentDetails.zelle.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(paymentDetails.zelle.email, 'zelle-email')}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 p-1.5 hover:bg-purple-50 rounded-lg flex items-center gap-1"
                    >
                      {copiedField === 'zelle-email' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-[11px]">Copy Email</span>
                    </button>
                  </div>

                  {/* Memo */}
                  <div className="bg-white rounded-xl p-3 border border-neutral-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase">
                        Zelle Memo / Note
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentDetails.zelle.memo, 'zelle-memo')}
                        className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                      >
                        {copiedField === 'zelle-memo' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[11px]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Copy Memo</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs font-mono text-neutral-800 bg-neutral-100/80 p-2 rounded-lg">
                      {paymentDetails.zelle.memo}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CASH APP */}
            {selectedMode === 'cashapp' && (
              <div className="space-y-4 animate-in fade-in duration-200 bg-neutral-50 rounded-2xl p-5 border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#00D632] text-white flex items-center justify-center font-bold text-xs">
                      $
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">Cash App Transfer</h3>
                      <p className="text-xs text-neutral-500">Pay directly with $Cashtag</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-900 bg-white px-2.5 py-1 rounded-lg border border-neutral-200">
                    {priceFormatted}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-3 border border-neutral-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase">Cashtag</p>
                      <p className="text-base font-black text-neutral-900">
                        {paymentDetails.cashapp.cashtag}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(paymentDetails.cashapp.cashtag, 'cashapp-tag')
                      }
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 p-1.5 hover:bg-emerald-50 rounded-lg flex items-center gap-1"
                    >
                      {copiedField === 'cashapp-tag' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-[11px]">Copy Tag</span>
                    </button>
                  </div>

                  <a
                    id="btn-open-cashapp"
                    href={paymentDetails.cashapp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#00D632] hover:bg-[#00be2d] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-xs transition-colors"
                  >
                    <span>Open Cash App (${currentTierObj.price.toFixed(2)})</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PAYPAL */}
            {selectedMode === 'paypal' && (
              <div className="space-y-4 animate-in fade-in duration-200 bg-neutral-50 rounded-2xl p-5 border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#003087] text-white flex items-center justify-center font-bold text-xs">
                      P
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">PayPal Direct</h3>
                      <p className="text-xs text-neutral-500">Pay via PayPal balance or debit/credit card</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-900 bg-white px-2.5 py-1 rounded-lg border border-neutral-200">
                    {priceFormatted}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-3 border border-neutral-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase">PayPal.me</p>
                      <p className="text-sm font-bold text-neutral-900">paypal.me/CampusClassPosts</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard('https://paypal.me/CampusClassPosts', 'paypal-url')
                      }
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                    >
                      {copiedField === 'paypal-url' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-[11px]">Copy Link</span>
                    </button>
                  </div>

                  <a
                    id="btn-open-paypal"
                    href={paymentDetails.paypal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#003087] hover:bg-[#002569] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-xs transition-colors"
                  >
                    <span>Open PayPal (${currentTierObj.price.toFixed(2)})</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* SENDER VERIFICATION FIELD & ACTION */}
            <div className="pt-2 border-t border-neutral-200 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="sender-id-input"
                  className="block text-xs font-bold text-neutral-800 uppercase tracking-wider"
                >
                  Your {selectedMode.toUpperCase()} Username / Account Name (For Instant Verification)
                </label>
                <div className="relative">
                  <input
                    id="sender-id-input"
                    type="text"
                    value={senderIdentifier}
                    onChange={(e) => setSenderIdentifier(e.target.value)}
                    placeholder={`e.g. @${cleanHandle || 'your_username'}`}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-neutral-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  Enter the handle or name you are sending payment from so our admin team can match and schedule your post immediately.
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                id="btn-confirm-payment-sent"
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmPayment}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all disabled:opacity-50 text-sm sm:text-base cursor-pointer min-h-[48px]"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Submission & Queue...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>I&apos;ve Sent Payment ({priceFormatted}) • Complete Order</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary & Live IG Post Card Review (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order Summary Box */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-neutral-900 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                Class of 2031
              </span>
            </h3>

            <div className="divide-y divide-neutral-100 text-xs space-y-2.5 pt-1">
              <div className="flex items-center justify-between pt-2">
                <span className="text-neutral-500">Campus Page:</span>
                <span className="font-bold text-neutral-900">
                  {submission.school.instagramHandle && submission.school.instagramHandle !== 'no username'
                    ? submission.school.instagramHandle
                    : `@${submission.school.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}2031`}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-neutral-500">Student Profile:</span>
                <span className="font-semibold text-neutral-900">
                  {submission.name} (@{cleanHandle || 'untagged'})
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-neutral-500">Selected Speed:</span>
                <span className="font-bold text-pink-600 flex items-center gap-1">
                  {selectedTier === 'instant' && <Zap className="w-3.5 h-3.5 text-rose-500" />}
                  {currentTierObj.title}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-neutral-500">Turnaround Time:</span>
                <span className="font-semibold text-neutral-900">{currentTierObj.timeframe}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-neutral-500">Payment Mode:</span>
                <span className="font-bold uppercase text-neutral-900">{selectedMode}</span>
              </div>

              <div className="flex items-center justify-between pt-3 text-sm">
                <span className="font-bold text-neutral-900">Total Due:</span>
                <span className="text-2xl font-black text-neutral-900">{priceFormatted}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-2 text-xs text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>100% Satisfaction Guarantee:</strong> If your post is not published within the selected timeframe, you will receive a prompt refund.
              </span>
            </div>
          </div>

          {/* Miniature Post Preview Card */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-600" />
                <span>Post Preview</span>
              </span>
              <span className="text-[10px] text-neutral-400">Ready to Publish</span>
            </div>

            <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-50 flex items-center gap-3 p-3">
              <div className="w-16 h-20 rounded-xl overflow-hidden bg-neutral-200 shrink-0 border border-neutral-200">
                <img
                  src={submission.photoUrl}
                  alt={submission.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-xs font-bold text-neutral-900 truncate">{submission.name}</p>
                <p className="text-[11px] text-pink-600 font-semibold">@{cleanHandle}</p>
                <p className="text-[10px] text-neutral-500 truncate">
                  {submission.major} • {submission.hometown}
                </p>
                <p className="text-[10px] text-neutral-600 line-clamp-1 italic">
                  &ldquo;{submission.bio}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
