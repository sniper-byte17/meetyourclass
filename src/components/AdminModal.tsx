import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Users,
  CheckCircle2,
  Clock,
  Instagram,
  RefreshCw,
  ExternalLink,
  DollarSign,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Filter,
  Download,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Sparkles,
  Layers,
  UserPlus,
  UserCheck,
  Mail,
  Lock,
  KeyRound,
  User,
  LogOut,
  FileCheck,
  ArrowUpRight,
  Link as LinkIcon,
  CheckCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { School, StudentSubmission, AdminUser } from '../types';
import { api, AdminMetrics } from '../services/api';
import { SchoolPhotoTemplate, generateTemplatedCanvas, getSchoolIgTag } from './SchoolPhotoTemplate';
import {
  subscribeToSubmissions,
  getAdminUsersFromFirebase,
  saveAdminUserToFirebase,
  deleteAdminUserInFirebase,
} from '../services/firebase';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  schools: School[];
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, schools }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = sessionStorage.getItem('meetfutureclass_admin_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed?.authenticated && (parsed?.user === 'mato' || parsed?.user === 'pato')) {
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [currentAdminUser, setCurrentAdminUser] = useState<string>(() => {
    try {
      const savedAuth = sessionStorage.getItem('meetfutureclass_admin_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed?.user) return parsed.user;
      }
    } catch {
      // ignore
    }
    return 'mato';
  });

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'queue' | 'pictures' | 'admins' | 'schools'>('queue');
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterSchoolId, setFilterSchoolId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [selectedReceiptSub, setSelectedReceiptSub] = useState<StudentSubmission | null>(null);
  const [isVerifyingPaymentId, setIsVerifyingPaymentId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [previewSub, setPreviewSub] = useState<StudentSubmission | null>(null);
  const [galleryViewMode, setGalleryViewMode] = useState<'templated' | 'original'>('templated');

  // New admin form state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminUser['role']>('campus_manager');
  const [newAdminSchool, setNewAdminSchool] = useState<string>('all');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Handle Admin Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const cleanUser = loginUsername.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    // Required credentials:
    // Username: "mato" or "pato"
    // Password: "#NewChapter"
    const validUsers = ['mato', 'pato'];
    const validPassword = '#NewChapter';

    if (!validUsers.includes(cleanUser) || cleanPass !== validPassword) {
      setTimeout(() => {
        setIsLoggingIn(false);
        setLoginError('Invalid login details. Please check your username and password.');
      }, 350);
      return;
    }

    try {
      // Also notify backend session endpoint if accessible
      await api.adminLogin(cleanUser, cleanPass);
    } catch {
      // Fallback works directly
    }

    setIsLoggingIn(false);
    setIsAuthenticated(true);
    setCurrentAdminUser(cleanUser);
    try {
      sessionStorage.setItem(
        'meetfutureclass_admin_auth',
        JSON.stringify({ authenticated: true, user: cleanUser, loginTime: new Date().toISOString() })
      );
    } catch {
      // ignore quota or disabled storage
    }
    setLoginPassword('');
    setLoginError(null);
  };

  // Handle Admin Logout
  const handleLogout = () => {
    try {
      sessionStorage.removeItem('meetfutureclass_admin_auth');
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError(null);
  };

  const fetchBackendData = async () => {
    setIsLoading(true);
    try {
      const [subs, met, admins] = await Promise.all([
        api.getSubmissions(
          filterSchoolId === 'all' ? undefined : filterSchoolId,
          filterStatus === 'all' ? undefined : filterStatus
        ),
        api.getAdminMetrics(),
        getAdminUsersFromFirebase(),
      ]);
      setSubmissions(subs);
      setMetrics(met);
      setAdminUsers(admins);
    } catch (err) {
      console.error('Failed to load admin data from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminName.trim()) return;

    setIsAddingAdmin(true);
    try {
      const cleanEmail = newAdminEmail.trim().toLowerCase();
      const newAdmin: AdminUser = {
        id: `admin_${Date.now()}`,
        email: cleanEmail,
        name: newAdminName.trim(),
        role: newAdminRole,
        assignedSchoolId: newAdminSchool,
        addedAt: new Date().toISOString(),
        addedBy: currentAdminUser === 'mato' ? 'Mato' : 'Pato',
        status: 'active',
      };

      await saveAdminUserToFirebase(newAdmin);
      setAdminUsers((prev) => [...prev, newAdmin]);
      setNewAdminEmail('');
      setNewAdminName('');
      setActionMessage(`Added ${newAdmin.name} (${newAdmin.role}) to Meet Your Class database!`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      console.error('Failed to add admin:', err);
      alert('Could not add admin user. Please try again.');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleDeleteAdminUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove admin "${name}"?`)) return;
    try {
      await deleteAdminUserInFirebase(id);
      setAdminUsers((prev) => prev.filter((a) => a.id !== id));
      setActionMessage(`Removed admin ${name}.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete admin user:', err);
    }
  };

  const handleApprovePayment = async (sub: StudentSubmission) => {
    setIsVerifyingPaymentId(sub.id);
    try {
      await api.updateSubmissionPayment(sub.id, 'paid', currentAdminUser, {
        status: sub.status === 'queued' ? 'approved' : sub.status,
      });

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? {
                ...s,
                paymentStatus: 'paid',
                paymentVerifiedAt: new Date().toISOString(),
                paymentVerifiedBy: currentAdminUser,
                status: s.status === 'queued' ? 'approved' : s.status,
              }
            : s
        )
      );

      setActionMessage(`✓ Payment of $${sub.price} approved for ${sub.name} by @${currentAdminUser}! Submission is approved.`);
      setTimeout(() => setActionMessage(null), 4000);
      if (selectedReceiptSub?.id === sub.id) {
        setSelectedReceiptSub(null);
      }
    } catch (err) {
      console.error('Failed to approve payment:', err);
      setActionMessage('Failed to approve payment. Please retry.');
    } finally {
      setIsVerifyingPaymentId(null);
    }
  };

  const handleRejectPayment = async (sub: StudentSubmission) => {
    if (!confirm(`Are you sure you want to decline the payment proof for ${sub.name}?`)) {
      return;
    }
    setIsVerifyingPaymentId(sub.id);
    try {
      await api.updateSubmissionPayment(sub.id, 'rejected', currentAdminUser, {
        status: 'rejected',
      });

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? {
                ...s,
                paymentStatus: 'rejected',
                status: 'rejected',
                paymentVerifiedBy: currentAdminUser,
              }
            : s
        )
      );

      setActionMessage(`Payment proof declined for ${sub.name}.`);
      setTimeout(() => setActionMessage(null), 4000);
      if (selectedReceiptSub?.id === sub.id) {
        setSelectedReceiptSub(null);
      }
    } catch (err) {
      console.error('Failed to decline payment:', err);
      setActionMessage('Failed to decline payment. Please retry.');
    } finally {
      setIsVerifyingPaymentId(null);
    }
  };

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    fetchBackendData();

    // Real-time Firestore subscription
    const unsubscribe = subscribeToSubmissions((updatedSubs) => {
      if (updatedSubs && updatedSubs.length > 0) {
        let filtered = updatedSubs;
        if (filterSchoolId !== 'all') {
          filtered = filtered.filter((s) => s.school?.id === filterSchoolId);
        }
        if (filterStatus !== 'all') {
          filtered = filtered.filter((s) => s.status === filterStatus);
        }
        if (filterPaymentStatus !== 'all') {
          if (filterPaymentStatus === 'pending_verification') {
            filtered = filtered.filter(
              (s) => s.paymentStatus === 'pending_verification' || s.paymentStatus === 'pending'
            );
          } else {
            filtered = filtered.filter((s) => s.paymentStatus === filterPaymentStatus);
          }
        }
        setSubmissions(filtered);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, isAuthenticated, filterSchoolId, filterStatus, filterPaymentStatus]);

  if (!isOpen) return null;

  // If not authenticated, prompt for admin credentials
  if (!isAuthenticated) {
    return (
      <AnimatePresence>
        <div id="admin-login-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <motion.div
            id="admin-login-modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 relative overflow-hidden"
          >
            {/* Top Close Button */}
            <button
              id="admin-login-close-btn"
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header / Brand */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-md mb-3.5">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-neutral-900 tracking-tight">
                Admin Portal Login
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                Enter your authorized credentials to manage submissions, downloads, and campus queues.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div
                  id="admin-login-error-alert"
                  className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span className="font-medium">{loginError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-login-username"
                  className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5"
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-login-username"
                    type="text"
                    autoFocus
                    required
                    value={loginUsername}
                    onChange={(e) => {
                      setLoginUsername(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="Enter username (mato or pato)"
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-login-password"
                  className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-11 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all font-medium"
                  />
                  <button
                    id="admin-login-toggle-password"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="admin-login-submit-btn"
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying credentials...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Access Admin Portal</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  id="admin-login-cancel-btn"
                  type="button"
                  onClick={onClose}
                  className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer font-medium"
                >
                  Cancel and return to site
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  const handleUpdateStatus = async (id: string, status: StudentSubmission['status']) => {
    try {
      await api.updateSubmissionStatus(id, status);
      setActionMessage(`Status updated to "${status}"!`);
      setTimeout(() => setActionMessage(null), 3000);
      fetchBackendData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this student submission from the queue?')) return;
    try {
      await api.deleteSubmission(id);
      setActionMessage('Submission removed from queue.');
      setTimeout(() => setActionMessage(null), 3000);
      fetchBackendData();
    } catch (err) {
      console.error('Error deleting submission:', err);
    }
  };

  const handleCopyCaption = (sub: StudentSubmission) => {
    const text = `${sub.caption}\n\n📸 Photo by: @${sub.instagram}\n${sub.tiktok ? `🎵 TikTok: @${sub.tiktok}\n` : ''}🎓 ${sub.school.name} Class of ${sub.gradYear}\n📍 ${sub.hometown}\n📚 ${sub.major}\n\n#${sub.school.shortName}${sub.gradYear} #MeetFutureClass`;
    navigator.clipboard.writeText(text);
    setCopiedId(sub.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const downloadBlobUrl = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download high-resolution Instagram-ready templated graphic
  const handleDownloadTemplatedGraphic = async (sub: StudentSubmission) => {
    setDownloadingId(`template_${sub.id}`);
    try {
      const cleanHandle = sub.instagram.replace('@', '').trim();
      const filename = `${sub.school.shortName.replace(/[^a-zA-Z0-9]/g, '')}_${cleanHandle}_IG_POST.png`;

      // Generate 1080x1350 canvas
      const canvasUrl = await generateTemplatedCanvas(
        sub.photoUrl,
        sub.school,
        sub.instagram,
        sub.gradYear,
        sub.major,
        sub.hometown
      );
      downloadBlobUrl(canvasUrl, filename);
      setActionMessage(`Downloaded Instagram post graphic for @${cleanHandle}!`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      console.error('Failed to generate templated post graphic:', err);
      // Fallback: download original
      handleDownloadOriginalPhoto(sub);
    } finally {
      setDownloadingId(null);
    }
  };

  // Download raw original student photo
  const handleDownloadOriginalPhoto = async (sub: StudentSubmission) => {
    setDownloadingId(`orig_${sub.id}`);
    try {
      const cleanHandle = sub.instagram.replace('@', '').trim();
      const filename = `${sub.school.shortName.replace(/[^a-zA-Z0-9]/g, '')}_${cleanHandle}_original.jpg`;

      // Fetch photo (using proxy if needed)
      let blob: Blob;
      try {
        const res = await fetch(sub.photoUrl);
        blob = await res.blob();
      } catch {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(sub.photoUrl)}`;
        const res = await fetch(proxyUrl);
        blob = await res.blob();
      }
      const objectUrl = URL.createObjectURL(blob);
      downloadBlobUrl(objectUrl, filename);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);

      setActionMessage(`Downloaded original student photo for @${cleanHandle}!`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      console.error('Failed to download photo:', err);
      window.open(sub.photoUrl, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const totalMembers = schools.reduce((acc, s) => acc + s.memberCount, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl border border-neutral-200 space-y-5 max-h-[92vh] overflow-y-auto flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight">
                    Campus Manager Dashboard
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live Server
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  MeetFutureClass • Real-time queue, IG photo downloader, and verified campus features
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Admin: <strong className="text-pink-600 font-bold">@{currentAdminUser}</strong></span>
              </div>
              <button
                id="admin-logout-btn"
                onClick={handleLogout}
                title="Log out and lock Admin Portal"
                className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-neutral-700 border border-neutral-200 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-neutral-500 hover:text-red-600" />
                <span className="hidden xs:inline">Log out</span>
              </button>
              <button
                id="admin-refresh-data-btn"
                onClick={fetchBackendData}
                disabled={isLoading}
                title="Refresh backend data"
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                id="admin-modal-close-btn"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action toast */}
          {actionMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-center">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Queue Total</p>
              <p className="text-xl font-black text-neutral-900 mt-0.5">
                {submissions.length}
              </p>
            </div>

            <div className={`p-3 rounded-2xl border text-center transition-colors ${
              submissions.filter((s) => s.paymentStatus === 'pending_verification' || s.paymentStatus === 'pending').length > 0
                ? 'bg-amber-500/10 border-amber-300'
                : 'bg-neutral-50 border-neutral-200'
            }`}>
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1">
                <span>Awaiting Payment</span>
                {submissions.filter((s) => s.paymentStatus === 'pending_verification' || s.paymentStatus === 'pending').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </p>
              <p className="text-xl font-black text-amber-900 mt-0.5">
                {submissions.filter((s) => s.paymentStatus === 'pending_verification' || s.paymentStatus === 'pending').length}
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200/80 text-center">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Approved Ready</p>
              <p className="text-xl font-black text-blue-900 mt-0.5">
                {submissions.filter((s) => s.status === 'approved').length}
              </p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-center">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Posted on IG</p>
              <p className="text-xl font-black text-emerald-900 mt-0.5">
                {metrics?.postedCount ?? submissions.filter((s) => s.status === 'posted').length}
              </p>
            </div>

            <div className="p-3 bg-pink-50 rounded-2xl border border-pink-200/80 text-center col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold text-pink-700 uppercase tracking-wider">Verified Revenue</p>
              <p className="text-xl font-black text-pink-950 mt-0.5">
                ${submissions.filter((s) => s.paymentStatus === 'paid').reduce((acc, s) => acc + (s.price || 0), 0)}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'queue'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Live Submissions Queue ({submissions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('pictures')}
              className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'pictures'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200/60'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-pink-600" />
              <span>Student Pictures & IG Download ({submissions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('schools')}
              className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'schools'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Active Campuses ({schools.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('admins')}
              className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'admins'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin Users & Managers ({adminUsers.length})</span>
            </button>
          </div>

          {/* TAB 1: Live Submissions Queue */}
          {activeTab === 'queue' && (
            <div className="space-y-4 flex-1">
              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200 text-xs">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="font-bold text-neutral-700">Filter By:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filterSchoolId}
                    onChange={(e) => setFilterSchoolId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-neutral-200 text-neutral-800 font-medium cursor-pointer"
                  >
                    <option value="all">All Campuses</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shortName}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-neutral-200 text-neutral-800 font-medium cursor-pointer"
                  >
                    <option value="all">All Post Statuses</option>
                    <option value="queued">Queued (Pending)</option>
                    <option value="approved">Approved Ready</option>
                    <option value="posted">Posted to IG</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <select
                    value={filterPaymentStatus}
                    onChange={(e) => setFilterPaymentStatus(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-neutral-200 text-neutral-800 font-bold cursor-pointer"
                  >
                    <option value="all">All Payments</option>
                    <option value="pending_verification">⚠️ Awaiting Payment Proof ({submissions.filter((s) => s.paymentStatus === 'pending_verification' || s.paymentStatus === 'pending').length})</option>
                    <option value="paid">✓ Verified Paid</option>
                    <option value="rejected">✕ Payment Declined</option>
                  </select>
                </div>
              </div>

              {/* Submissions List */}
              {submissions.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 space-y-2">
                  <Clock className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p className="text-sm font-bold text-neutral-700">No submissions found</p>
                  <p className="text-xs text-neutral-500">
                    When students submit their feature post on any campus, it will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Student info & photo */}
                        <div className="flex items-center gap-3">
                          <div className="relative group/thumb shrink-0">
                            <img
                              src={sub.photoUrl}
                              alt={sub.name}
                              referrerPolicy="no-referrer"
                              className="w-14 h-16 object-cover rounded-xl border border-neutral-200 bg-neutral-100 shadow-2xs"
                            />
                            <button
                              onClick={() => setPreviewSub(sub)}
                              title="Click to view & download IG asset"
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-white" />
                            </button>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm text-neutral-900">{sub.name}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                                {sub.school.shortName} &apos;{String(sub.gradYear).slice(-2)}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sub.tier === 'instant'
                                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                    : sub.tier === '48hours'
                                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                    : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                                }`}
                              >
                                {sub.tier.toUpperCase()} (${sub.price})
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1 flex-wrap">
                              <span className="flex items-center gap-1 font-semibold text-pink-600">
                                <Instagram className="w-3.5 h-3.5" />
                                @{sub.instagram}
                              </span>
                              {sub.tiktok && (
                                <span className="font-medium text-neutral-700">🎵 @{sub.tiktok}</span>
                              )}
                              <span>📍 {sub.hometown}</span>
                              <span>📚 {sub.major}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status badge & quick download */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <button
                            onClick={() => handleDownloadTemplatedGraphic(sub)}
                            disabled={downloadingId === `template_${sub.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            title="Download Instagram-ready 1080x1350 graphic with school colors"
                          >
                            <Download className={`w-3.5 h-3.5 ${downloadingId === `template_${sub.id}` ? 'animate-bounce text-pink-600' : ''}`} />
                            <span>Download Post</span>
                          </button>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              sub.status === 'posted'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : sub.status === 'approved'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : sub.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {sub.status === 'posted'
                              ? '✓ Posted to IG'
                              : sub.status === 'approved'
                              ? 'Approved'
                              : sub.status === 'rejected'
                              ? 'Rejected'
                              : 'Queued'}
                          </span>
                        </div>
                      </div>

                      {/* Bio snippet */}
                      {sub.bio && (
                        <p className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 italic">
                          &ldquo;{sub.bio}&rdquo;
                        </p>
                      )}

                      {/* Payment Proof & Verification Panel */}
                      <div className={`p-3 rounded-2xl border transition-all text-xs ${
                        sub.paymentStatus === 'paid'
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : sub.paymentStatus === 'rejected'
                          ? 'bg-rose-50/80 border-rose-200'
                          : 'bg-amber-50/90 border-amber-300 shadow-2xs'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                                {sub.paymentStatus === 'paid' ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-900 font-bold">Payment Verified</span>
                                  </>
                                ) : sub.paymentStatus === 'rejected' ? (
                                  <>
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span className="text-rose-900 font-bold">Payment Proof Rejected</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                    <span className="text-amber-900 font-bold">Payment Review Pending</span>
                                  </>
                                )}
                              </span>

                              <span className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-800 font-bold text-[10px]">
                                {sub.paymentMethod?.toUpperCase() || 'VENMO'} (${sub.price})
                              </span>

                              {sub.paymentHandle && (
                                <span className="text-[11px] text-neutral-600 font-medium">
                                  Sender: <strong className="text-neutral-900">{sub.paymentHandle}</strong>
                                </span>
                              )}
                            </div>

                            {/* Proof details & notes */}
                            {sub.paymentProofNote && (
                              <p className="text-[11px] text-neutral-600 italic">
                                Note: &ldquo;{sub.paymentProofNote}&rdquo;
                              </p>
                            )}

                            {sub.paymentVerifiedBy && sub.paymentStatus === 'paid' && (
                              <p className="text-[10px] text-emerald-700">
                                Verified by <strong>@{sub.paymentVerifiedBy}</strong>
                                {sub.paymentVerifiedAt && ` on ${new Date(sub.paymentVerifiedAt).toLocaleDateString()}`}
                              </p>
                            )}
                          </div>

                          {/* Action controls & proof viewer */}
                          <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
                            {/* If screenshot exists */}
                            {sub.paymentProofUrl && (sub.paymentProofType === 'screenshot' || sub.paymentProofUrl.startsWith('data:image')) && (
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptSub(sub)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-pink-600" />
                                <span>Inspect Receipt</span>
                              </button>
                            )}

                            {/* If link exists */}
                            {sub.paymentProofUrl && sub.paymentProofType === 'link' && (
                              <a
                                href={sub.paymentProofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                              >
                                <span>Open Payment Link</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* If no proof uploaded at all */}
                            {!sub.paymentProofUrl && sub.paymentStatus !== 'paid' && (
                              <span className="text-[11px] text-amber-800 font-medium bg-amber-100/80 px-2 py-1 rounded-lg">
                                No receipt/link attached
                              </span>
                            )}

                            {/* Approve / Reject buttons */}
                            {sub.paymentStatus !== 'paid' ? (
                              <>
                                <button
                                  type="button"
                                  disabled={isVerifyingPaymentId === sub.id}
                                  onClick={() => handleApprovePayment(sub)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve Payment (${sub.price})</span>
                                </button>

                                {sub.paymentStatus !== 'rejected' && (
                                  <button
                                    type="button"
                                    disabled={isVerifyingPaymentId === sub.id}
                                    onClick={() => handleRejectPayment(sub)}
                                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs transition-all cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                )}
                              </>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Verified Paid</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 text-xs font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleCopyCaption(sub)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                          >
                            {copiedId === sub.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Copied Caption!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-neutral-500" />
                                <span>Copy IG Caption</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => setPreviewSub(sub)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Preview Photo Asset</span>
                          </button>

                          <button
                            onClick={() => handleDownloadOriginalPhoto(sub)}
                            disabled={downloadingId === `orig_${sub.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer text-[11px]"
                            title="Download raw unedited photo"
                          >
                            <Download className="w-3 h-3" />
                            <span>Raw Photo</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {sub.status !== 'approved' && sub.status !== 'posted' && (
                            <button
                              onClick={() => {
                                if (sub.paymentStatus !== 'paid') {
                                  handleApprovePayment(sub);
                                } else {
                                  handleUpdateStatus(sub.id, 'approved');
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition-colors cursor-pointer"
                            >
                              {sub.paymentStatus !== 'paid' ? 'Approve & Verify' : 'Approve'}
                            </button>
                          )}

                          {sub.status !== 'posted' && (
                            <button
                              onClick={() => handleUpdateStatus(sub.id, 'posted')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer"
                            >
                              Mark as Posted
                            </button>
                          )}

                          {sub.status !== 'rejected' && (
                            <button
                              onClick={() => handleUpdateStatus(sub.id, 'rejected')}
                              className="px-2 py-1 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(sub.id)}
                            title="Delete"
                            className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Student Pictures & IG Download Gallery */}
          {activeTab === 'pictures' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-pink-50/60 p-3 rounded-2xl border border-pink-100 text-xs">
                <div>
                  <p className="font-extrabold text-neutral-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-pink-600" />
                    <span>Instagram Asset Hub</span>
                  </p>
                  <p className="text-neutral-600 text-xs mt-0.5">
                    Preview and download student photos with school branding or original image to post directly on @{getSchoolIgTag(schools[0]).replace('@', '')}.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-pink-200 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => setGalleryViewMode('templated')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      galleryViewMode === 'templated'
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Templated Frame
                  </button>
                  <button
                    onClick={() => setGalleryViewMode('original')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      galleryViewMode === 'original'
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Raw Photo
                  </button>
                </div>
              </div>

              {submissions.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
                  <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p className="text-sm font-bold text-neutral-700 mt-2">No student pictures yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                    >
                      {/* Image Frame */}
                      <div className="relative aspect-4/5 bg-neutral-900 overflow-hidden">
                        {galleryViewMode === 'templated' ? (
                          <SchoolPhotoTemplate
                            photoUrl={sub.photoUrl}
                            school={sub.school}
                            studentName={sub.name}
                            studentInstagram={sub.instagram}
                            gradYear={sub.gradYear}
                            major={sub.major}
                            hometown={sub.hometown}
                            className="w-full h-full"
                          />
                        ) : (
                          <img
                            src={sub.photoUrl}
                            alt={sub.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        )}

                        <div className="absolute top-2 right-2 z-30">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md ${
                              sub.status === 'posted'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-black/70 text-white backdrop-blur-md'
                            }`}
                          >
                            {sub.status === 'posted' ? '✓ Posted' : 'Queued'}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-extrabold text-sm text-neutral-900 truncate">
                              {sub.name}
                            </h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                              {sub.school.shortName}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-pink-600 flex items-center gap-1 mt-0.5">
                            <Instagram className="w-3 h-3" />
                            @{sub.instagram}
                          </p>
                          <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
                            {sub.major} • {sub.hometown}
                          </p>
                        </div>

                        {/* Download & Copy Buttons */}
                        <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                          <button
                            onClick={() => handleDownloadTemplatedGraphic(sub)}
                            disabled={downloadingId === `template_${sub.id}`}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <Download className={`w-3.5 h-3.5 ${downloadingId === `template_${sub.id}` ? 'animate-bounce' : ''}`} />
                            <span>
                              {downloadingId === `template_${sub.id}` ? 'Generating Post...' : 'Download IG Post (1080x1350)'}
                            </span>
                          </button>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => handleCopyCaption(sub)}
                              className="py-1.5 px-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              {copiedId === sub.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-neutral-500" />
                                  <span>Copy Caption</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleDownloadOriginalPhoto(sub)}
                              disabled={downloadingId === `orig_${sub.id}`}
                              className="py-1.5 px-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <Download className="w-3 h-3 text-neutral-500" />
                              <span>Raw Photo</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Active Campuses */}
          {activeTab === 'schools' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                {schools.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: s.accentColor }}
                      >
                        {s.shortName.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900">{s.name}</p>
                        <p className="text-[11px] text-pink-600 font-medium">
                          {s.instagramHandle || `@${s.shortName.toLowerCase()}2031`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-neutral-900">{s.memberCount}</span>
                      <span className="text-neutral-400 block text-[10px]">members</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Admin Users & Team Management */}
          {activeTab === 'admins' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl">
                <div>
                  <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    Database: <span className="font-mono font-normal text-pink-600">meet-your-class</span>
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Manage team access, campus managers, and moderators with independent Firestore permissions.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                  <UserCheck className="w-3 h-3" />
                  <span>{adminUsers.length} Active Admins</span>
                </div>
              </div>

              {/* Add New Admin Form */}
              <form
                onSubmit={handleAddAdminUser}
                className="p-4 bg-white border border-neutral-200 rounded-2xl space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                  <UserPlus className="w-4 h-4 text-purple-600" />
                  <span>Add New Team Member / Campus Manager</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Full Name (e.g. Sarah Jenkins)"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                  />

                  <input
                    type="email"
                    required
                    placeholder="Email (e.g. sarah@school.edu)"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                  />

                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as AdminUser['role'])}
                    className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                  >
                    <option value="campus_manager">Campus Manager</option>
                    <option value="moderator">Queue Moderator</option>
                    <option value="super_admin">Super Admin</option>
                  </select>

                  <select
                    value={newAdminSchool}
                    onChange={(e) => setNewAdminSchool(e.target.value)}
                    className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                  >
                    <option value="all">All Campuses (Universal)</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shortName} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isAddingAdmin}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isAddingAdmin ? 'Saving to Firestore...' : 'Add Admin User'}</span>
                  </button>
                </div>
              </form>

              {/* Admin Users Roster */}
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {adminUsers.map((admin) => {
                  const assignedSchoolObj = schools.find((s) => s.id === admin.assignedSchoolId);
                  return (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-50 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {admin.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-neutral-900">{admin.name}</p>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                admin.role === 'super_admin'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : admin.role === 'campus_manager'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {admin.role.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-neutral-400" />
                              {admin.email}
                            </span>
                            <span>•</span>
                            <span>
                              Scope: {admin.assignedSchoolId === 'all' || !admin.assignedSchoolId ? 'All Campuses' : assignedSchoolObj?.name || admin.assignedSchoolId}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {admin.id !== 'admin_primary' && (
                          <button
                            onClick={() => handleDeleteAdminUser(admin.id, admin.name)}
                            title="Remove admin"
                            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Server Endpoint: <code>/api/submissions</code> • Ready for IG Publishing</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>

        {/* Modal: Single Photo High-Res Asset Previewer */}
        {previewSub && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-neutral-200 space-y-4 max-h-[95vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-neutral-900">{previewSub.name}</h4>
                  <p className="text-xs text-pink-600 font-semibold">@{previewSub.instagram} • {previewSub.school.name}</p>
                </div>
                <button
                  onClick={() => setPreviewSub(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Templated Post Preview */}
              <div className="aspect-4/5 w-full rounded-2xl overflow-hidden shadow-md">
                <SchoolPhotoTemplate
                  photoUrl={previewSub.photoUrl}
                  school={previewSub.school}
                  studentName={previewSub.name}
                  studentInstagram={previewSub.instagram}
                  gradYear={previewSub.gradYear}
                  major={previewSub.major}
                  hometown={previewSub.hometown}
                  className="w-full h-full"
                />
              </div>

              {/* Download Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleDownloadTemplatedGraphic(previewSub)}
                  disabled={downloadingId === `template_${previewSub.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Download className={`w-4 h-4 ${downloadingId === `template_${previewSub.id}` ? 'animate-bounce' : ''}`} />
                  <span>Download Instagram-Ready Post (1080x1350)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCopyCaption(previewSub)}
                    className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedId === previewSub.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Copy Caption</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDownloadOriginalPhoto(previewSub)}
                    disabled={downloadingId === `orig_${previewSub.id}`}
                    className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Raw Photo</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal: Payment Receipt / Proof Verification Lightbox */}
        {selectedReceiptSub && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 space-y-4 max-h-[92vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-neutral-900 text-base">
                      Payment Verification Proof
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Verify receipt or transaction for {selectedReceiptSub.name} (@{selectedReceiptSub.instagram})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReceiptSub(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Order / Payment Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-neutral-50 p-3 rounded-2xl border border-neutral-200 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">Campus</span>
                  <span className="font-bold text-neutral-900 truncate block">{selectedReceiptSub.school?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">Tier & Price</span>
                  <span className="font-bold text-pink-600 block">
                    {selectedReceiptSub.tier.toUpperCase()} (${selectedReceiptSub.price})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">Payment App</span>
                  <span className="font-bold text-emerald-700 block">{selectedReceiptSub.paymentMethod.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">Sender Handle</span>
                  <span className="font-bold text-neutral-900 block truncate">
                    {selectedReceiptSub.paymentHandle || 'Not provided'}
                  </span>
                </div>
              </div>

              {selectedReceiptSub.paymentProofNote && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">Student Note/Memo: </span>
                  <span>&ldquo;{selectedReceiptSub.paymentProofNote}&rdquo;</span>
                </div>
              )}

              {/* Receipt Image / Proof Visualizer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                  <span>Attached Screenshot / Receipt</span>
                  {selectedReceiptSub.paymentProofUrl?.startsWith('data:') && (
                    <span className="text-neutral-500 text-[11px]">Uploaded by student</span>
                  )}
                </div>

                {selectedReceiptSub.paymentProofUrl ? (
                  <div className="max-h-96 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center p-2">
                    <img
                      src={selectedReceiptSub.paymentProofUrl}
                      alt={`Receipt from ${selectedReceiptSub.name}`}
                      referrerPolicy="no-referrer"
                      className="max-h-88 max-w-full object-contain rounded-xl shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 space-y-1">
                    <p className="text-xs font-bold text-neutral-700">No screenshot image attached</p>
                    <p className="text-[11px] text-neutral-500">
                      Check sender handle or payment note: {selectedReceiptSub.paymentHandle}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-neutral-500">
                  Reviewing as <strong className="text-pink-600 font-bold">@{currentAdminUser}</strong>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isVerifyingPaymentId === selectedReceiptSub.id}
                    onClick={() => handleRejectPayment(selectedReceiptSub)}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors cursor-pointer border border-neutral-200 hover:border-rose-300"
                  >
                    Decline Receipt
                  </button>

                  <button
                    type="button"
                    disabled={isVerifyingPaymentId === selectedReceiptSub.id}
                    onClick={() => handleApprovePayment(selectedReceiptSub)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Payment (${selectedReceiptSub.price})</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
