import React, { useState } from 'react';
import { X, Building2, Check, Send } from 'lucide-react';

interface RequestSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted: (schoolName: string) => void;
}

export const RequestSchoolModal: React.FC<RequestSchoolModalProps> = ({
  isOpen,
  onClose,
  onRequestSubmitted,
}) => {
  if (!isOpen) return null;

  const [schoolName, setSchoolName] = useState('');
  const [cityState, setCityState] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (schoolName.trim()) {
      setSubmitted(true);
      onRequestSubmitted(schoolName.trim());
      setTimeout(() => {
        setSubmitted(false);
        setSchoolName('');
        setCityState('');
        setEmail('');
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Request Your School</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-neutral-900">School Request Received!</h4>
              <p className="text-xs text-neutral-600 max-w-xs mx-auto">
                We will configure the network directory for {schoolName} shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-neutral-600 leading-relaxed">
                Tell us which university or college you would like to bring to MeetFutureClass so students and alumni can network.
              </p>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  University / College Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vanderbilt University, Georgia State..."
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-900 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  City & State
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nashville, TN"
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-900 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  Your School / Student Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-900 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-xs transition-opacity cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
