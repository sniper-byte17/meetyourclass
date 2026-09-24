import React, { useState } from 'react';
import {
  X,
  Mail,
  Linkedin,
  Instagram,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';
import { Profile, School } from '../types';

interface ConnectModalProps {
  profile: Profile | null;
  school: School | null;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ profile, school, onClose }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!profile) return null;

  const schoolName = school?.shortName || 'our university';

  const templates = [
    {
      title: '☕ Quick Coffee Chat',
      text: `Hi ${profile.name},\n\nI saw your profile on MeetFutureClass for ${schoolName}! I'm also part of the campus community and would love to hear more about your experience in ${profile.major}${profile.company ? ` and your work at ${profile.company}` : ''}. Would you be open to a 15-minute virtual coffee chat sometime soon?\n\nBest regards,`,
    },
    {
      title: '💼 Career & Mentorship Advice',
      text: `Hi ${profile.name},\n\nHope you're having a great week! I found your intro on the ${schoolName} MeetFutureClass directory. As someone interested in ${profile.currentRole || 'your field'}, I'd deeply appreciate any perspective or advice you could share about getting started in the industry.\n\nThanks so much!`,
    },
    {
      title: '👋 Campus Connection',
      text: `Hey ${profile.name}!\n\nGreat to connect with fellow ${schoolName} students and alumni on MeetFutureClass. Just wanted to say hi and expand my network with fellow classmates.\n\nLooking forward to staying in touch!`,
    },
  ];

  const handleCopyEmail = () => {
    if (profile.email) {
      navigator.clipboard.writeText(profile.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(templates[selectedTemplate].text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-bold text-neutral-900">
              Connect with {profile.name}
            </h3>
          </div>
          <button
            id="btn-close-connect-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Member Card Summary */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
            <img
              src={profile.photoUrl}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  profile.role === 'alumni'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <GraduationCap className="w-3 h-3" />
                {profile.role === 'alumni' ? `Alumni '${String(profile.gradYear).slice(-2)}` : `Student '${String(profile.gradYear).slice(-2)}`}
              </span>
              <h4 className="text-sm font-bold text-neutral-900 truncate mt-0.5">
                {profile.name}
              </h4>
              <p className="text-xs text-neutral-600 truncate">
                {profile.currentRole} {profile.company ? `@ ${profile.company}` : ''}
              </p>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Direct Contact Channels
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {profile.email ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 bg-white text-xs">
                  <div className="flex items-center gap-2 truncate mr-2">
                    <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="truncate text-neutral-800 font-medium">{profile.email}</span>
                  </div>
                  <button
                    onClick={handleCopyEmail}
                    className="p-1 text-neutral-500 hover:text-blue-700 hover:bg-neutral-100 rounded-md shrink-0"
                    title="Copy email"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl border border-neutral-100 bg-neutral-50 text-xs text-neutral-400">
                  No public email listed
                </div>
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
                  className="flex items-center justify-between p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-xs font-medium text-blue-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>View LinkedIn</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-pink-200 bg-pink-50/40 hover:bg-pink-50 text-xs font-medium text-pink-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                    <span>@{profile.instagram.replace('@', '')}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Starter Message Template */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                Suggested Intro Starter
              </span>
              <button
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            {/* Template selector pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedTemplate(i)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    selectedTemplate === i
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {tpl.title}
                </button>
              ))}
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700 whitespace-pre-wrap font-sans leading-relaxed">
              {templates[selectedTemplate].text}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-200 transition-colors"
          >
            Close
          </button>

          {profile.email ? (
            <a
              href={`mailto:${profile.email}?subject=${encodeURIComponent(
                `Connecting via MeetFutureClass (${schoolName})`
              )}&body=${encodeURIComponent(templates[selectedTemplate].text)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Email Now</span>
            </a>
          ) : (
            <button
              onClick={handleCopyMessage}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Intro Message</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
