import React from 'react';
import { X, HelpCircle, Instagram, ShieldCheck, Zap, Mail, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSchools: () => void;
  onNavigateToSteps: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSchools,
  onNavigateToSteps,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-5 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Help & Support</h3>
                <p className="text-xs text-neutral-500">Frequently asked student questions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Q&A Items */}
          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
              <h4 className="font-bold text-neutral-900 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-600" />
                <span>How do I get posted on my school&apos;s page?</span>
              </h4>
              <p className="text-neutral-600 text-xs leading-relaxed">
                Click <strong>Find my school</strong>, choose your college, upload your photo, add your bio and Instagram handle, and pick your delivery speed tier.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
              <h4 className="font-bold text-neutral-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>What are the turnaround speed options?</span>
              </h4>
              <p className="text-neutral-600 text-xs leading-relaxed">
                We offer <strong>Instant Priority</strong> (under 1 hour), <strong>48-Hour Priority</strong>, and <strong>Standard</strong> turnaround times.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
              <h4 className="font-bold text-neutral-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>What payment methods can I use?</span>
              </h4>
              <p className="text-neutral-600 text-xs leading-relaxed">
                We accept <strong>Venmo</strong> (with dedicated Safari 1-tap iPhone flow), <strong>Zelle</strong>, <strong>Cash App</strong>, and <strong>PayPal</strong>.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            <button
              onClick={() => {
                onClose();
                onNavigateToSchools();
              }}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold hover:opacity-95 transition-opacity text-center shadow-xs"
            >
              Find my school
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigateToSteps();
              }}
              className="py-2.5 px-4 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-semibold hover:bg-neutral-200 transition-colors text-center"
            >
              See how it works
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
