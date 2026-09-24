import React, { useState, useEffect, useMemo } from 'react';
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
  Globe,
  Search,
  BarChart3,
  TrendingUp,
  Award,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { School, StudentSubmission, AdminUser } from '../types';
import { api, AdminMetrics } from '../services/api';
import { SchoolPhotoTemplate, generateTemplatedCanvas, getSchoolIgTag } from './SchoolPhotoTemplate';
import { getSchoolMainPageUrl, getSchoolPostingUrl } from '../utils/schoolLinks';
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
  initialPortalMode?: 'poster' | 'master' | 'public';
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  schools,
  initialPortalMode = 'poster',
}) => {
  const [portalMode, setPortalMode] = useState<'poster' | 'master'>(() => {
    if (initialPortalMode === 'master') return 'master';
    return 'poster';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [analyticsSchoolSearch, setAnalyticsSchoolSearch] = useState<string>('');
  const [photoCarouselIndices, setPhotoCarouselIndices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen && initialPortalMode) {
      setPortalMode(initialPortalMode === 'master' ? 'master' : 'poster');
    }
  }, [isOpen, initialPortalMode]);

  // Poster Authentication (unlocked by username 'mato' or 'pato' + password '#NewChapter')
  const [isPosterAuthenticated, setIsPosterAuthenticated] = useState<boolean>(() => {
    try {
      const savedPoster = sessionStorage.getItem('mfc_poster_auth');
      if (savedPoster) {
        const parsed = JSON.parse(savedPoster);
        if (parsed?.authenticated && (parsed?.user === 'mato' || parsed?.user === 'pato')) {
          return true;
        }
      }
      const savedMaster = sessionStorage.getItem('mfc_master_auth');
      if (savedMaster) {
        const parsed = JSON.parse(savedMaster);
        if (parsed?.authenticated && (parsed?.user === 'mato' || parsed?.user === 'pato')) {
          return true;
        }
      }
      const legacy = sessionStorage.getItem('meetfutureclass_admin_auth');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (parsed?.authenticated && (parsed?.user === 'mato' || parsed?.user === 'pato')) {
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  });

  // Master Authentication (unlocked by username 'mato' or 'pato' + password '#NewChapter@2026')
  const [isMasterAuthenticated, setIsMasterAuthenticated] = useState<boolean>(() => {
    try {
      const savedMaster = sessionStorage.getItem('mfc_master_auth');
      if (savedMaster) {
        const parsed = JSON.parse(savedMaster);
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
      const savedMaster = sessionStorage.getItem('mfc_master_auth');
      if (savedMaster) {
        const parsed = JSON.parse(savedMaster);
        if (parsed?.user) return parsed.user;
      }
      const savedPoster = sessionStorage.getItem('mfc_poster_auth');
      if (savedPoster) {
        const parsed = JSON.parse(savedPoster);
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

  // Tab navigation: master defaults to 'analytics', poster defaults to 'queue'
  const [activeTab, setActiveTab] = useState<'analytics' | 'payments' | 'queue' | 'pictures' | 'admins' | 'schools'>('queue');

  // Sync default tab when portalMode toggles
  useEffect(() => {
    if (portalMode === 'master') {
      setActiveTab('analytics');
    } else {
      setActiveTab('queue');
    }
  }, [portalMode]);

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
  const [customDomainInput, setCustomDomainInput] = useState<string>('https://meetfutureclass.com');
  const [copiedLinkType, setCopiedLinkType] = useState<string | null>(null);
  const [showDomainGuide, setShowDomainGuide] = useState(false);

  // New admin form state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminUser['role']>('campus_manager');
  const [newAdminSchool, setNewAdminSchool] = useState<string>('all');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Handle Login submission for both portals
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const cleanUser = loginUsername.trim().toLowerCase();
    const cleanPass = loginPassword.trim();
    const validUsers = ['mato', 'pato'];

    if (portalMode === 'master') {
      // Master Admin: username "mato" or "pato" and password "#NewChapter@2026"
      if (!validUsers.includes(cleanUser) || cleanPass !== '#NewChapter@2026') {
        setTimeout(() => {
          setIsLoggingIn(false);
          setLoginError('Invalid Master Admin details. Requires username (mato or pato) and master password (#NewChapter@2026).');
        }, 350);
        return;
      }

      try {
        await api.adminLogin(cleanUser, cleanPass);
      } catch {
        // Fallback
      }

      setIsLoggingIn(false);
      setIsMasterAuthenticated(true);
      setIsPosterAuthenticated(true); // Master privileges unlock poster portal too
      setCurrentAdminUser(cleanUser);
      try {
        sessionStorage.setItem('mfc_master_auth', JSON.stringify({ authenticated: true, user: cleanUser }));
        sessionStorage.setItem('mfc_poster_auth', JSON.stringify({ authenticated: true, user: cleanUser }));
      } catch {
        // ignore
      }
      setLoginPassword('');
      setLoginError(null);
    } else {
      // School Poster Portal: username "mato" or "pato" and password "#NewChapter"
      // Note: "#NewChapter@2026" also unlocks it
      if (!validUsers.includes(cleanUser) || (cleanPass !== '#NewChapter' && cleanPass !== '#NewChapter@2026')) {
        setTimeout(() => {
          setIsLoggingIn(false);
          setLoginError('Invalid Poster Portal details. Requires username (mato or pato) and password (#NewChapter).');
        }, 350);
        return;
      }

      try {
        await api.adminLogin(cleanUser, cleanPass);
      } catch {
        // Fallback
      }

      setIsLoggingIn(false);
      setIsPosterAuthenticated(true);
      if (cleanPass === '#NewChapter@2026') {
        setIsMasterAuthenticated(true);
        try {
          sessionStorage.setItem('mfc_master_auth', JSON.stringify({ authenticated: true, user: cleanUser }));
        } catch {
          // ignore
        }
      }
      setCurrentAdminUser(cleanUser);
      try {
        sessionStorage.setItem('mfc_poster_auth', JSON.stringify({ authenticated: true, user: cleanUser }));
      } catch {
        // ignore
      }
      setLoginPassword('');
      setLoginError(null);
    }
  };

  // Handle Logout (clears both portal sessions)
  const handleLogout = () => {
    try {
      sessionStorage.removeItem('mfc_poster_auth');
      sessionStorage.removeItem('mfc_master_auth');
      sessionStorage.removeItem('meetfutureclass_admin_auth');
    } catch {
      // ignore
    }
    setIsPosterAuthenticated(false);
    setIsMasterAuthenticated(false);
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

  const handleVerifyPayment = handleApprovePayment;

  useEffect(() => {
    if (!isOpen) return;
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
        if (portalMode === 'master' && filterPaymentStatus !== 'all') {
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
  }, [isOpen, portalMode, filterSchoolId, filterStatus, filterPaymentStatus]);

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

      // Workflow automation: Auto-transition into "Approved Ready" if currently in queue
      if (sub.status === 'queued') {
        await handleUpdateStatus(sub.id, 'approved');
        setActionMessage(`📸 Graphic downloaded! Post for @${cleanHandle} has automatically transitioned to "Approved Ready" (Ready to Post).`);
      } else {
        setActionMessage(`Downloaded Instagram post graphic for @${cleanHandle}!`);
      }
      setTimeout(() => setActionMessage(null), 4000);
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

      // Workflow automation: Auto-transition into "Approved Ready" if currently in queue
      if (sub.status === 'queued') {
        await handleUpdateStatus(sub.id, 'approved');
        setActionMessage(`📸 Original photo downloaded! Post for @${cleanHandle} has automatically transitioned to "Approved Ready".`);
      } else {
        setActionMessage(`Downloaded original student photo for @${cleanHandle}!`);
      }
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      console.error('Failed to download photo:', err);
      window.open(sub.photoUrl, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  // Download all original photos attached to this post (up to 10 photos)
  const handleDownloadAllPhotos = async (sub: StudentSubmission) => {
    const photos = sub.photoUrls && sub.photoUrls.length > 0 ? sub.photoUrls : [sub.photoUrl];
    setDownloadingId(`all_${sub.id}`);
    try {
      const cleanHandle = sub.instagram.replace('@', '').trim();

      // Download each attached photo
      for (let i = 0; i < photos.length; i++) {
        try {
          let blob: Blob;
          try {
            const res = await fetch(photos[i]);
            blob = await res.blob();
          } catch {
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(photos[i])}`;
            const res = await fetch(proxyUrl);
            blob = await res.blob();
          }
          const objectUrl = URL.createObjectURL(blob);
          downloadBlobUrl(objectUrl, `${sub.school.shortName}_${cleanHandle}_photo_${i + 1}.jpg`);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
        } catch (err) {
          console.error(`Failed to download photo #${i + 1}:`, err);
        }
      }

      // Workflow automation: Auto-transition into "Approved Ready" if currently in queue
      if (sub.status === 'queued') {
        await handleUpdateStatus(sub.id, 'approved');
        setActionMessage(`📸 All ${photos.length} photos downloaded! Post for @${cleanHandle} has automatically transitioned to "Approved Ready".`);
      } else {
        setActionMessage(`Downloaded all ${photos.length} photos for @${cleanHandle}!`);
      }
      setTimeout(() => setActionMessage(null), 4000);
    } finally {
      setDownloadingId(null);
    }
  };

  const totalMembers = schools.reduce((acc, s) => acc + s.memberCount, 0);

  // Financial & Operational Analytics Calculations
  const totalVerifiedRevenue = useMemo(() => {
    return submissions
      .filter((s) => s.paymentStatus === 'paid')
      .reduce((acc, s) => acc + (s.price || 0), 0);
  }, [submissions]);

  const totalPendingRevenue = useMemo(() => {
    return submissions
      .filter((s) => s.paymentStatus === 'pending_verification' || s.paymentStatus === 'pending')
      .reduce((acc, s) => acc + (s.price || 0), 0);
  }, [submissions]);

  const paidSubmissionsCount = useMemo(() => {
    return submissions.filter((s) => s.paymentStatus === 'paid').length;
  }, [submissions]);

  const pendingVerificationCount = useMemo(() => {
    return submissions.filter((s) => s.paymentStatus === 'pending_verification' || s.paymentStatus === 'pending').length;
  }, [submissions]);

  const postedCount = useMemo(() => {
    return submissions.filter((s) => s.status === 'posted').length;
  }, [submissions]);

  const approvedCount = useMemo(() => {
    return submissions.filter((s) => s.status === 'approved').length;
  }, [submissions]);

  const queuedCount = useMemo(() => {
    return submissions.filter((s) => s.status === 'queued').length;
  }, [submissions]);

  const averageOrderValue = useMemo(() => {
    if (paidSubmissionsCount === 0) return '0.00';
    return (totalVerifiedRevenue / paidSubmissionsCount).toFixed(2);
  }, [totalVerifiedRevenue, paidSubmissionsCount]);

  const paidConversionRate = useMemo(() => {
    if (submissions.length === 0) return 0;
    return Math.round((paidSubmissionsCount / submissions.length) * 100);
  }, [paidSubmissionsCount, submissions.length]);

  // Which schools are making more money: School revenue ranking data
  const schoolsRevenueData = useMemo(() => {
    return schools
      .map((school) => {
        const schoolSubs = submissions.filter((s) => s.school.id === school.id);
        const paidSubs = schoolSubs.filter((s) => s.paymentStatus === 'paid');
        const verifiedRevenue = paidSubs.reduce((acc, s) => acc + (s.price || 0), 0);
        const pendingRevenue = schoolSubs
          .filter((s) => s.paymentStatus === 'pending_verification' || s.paymentStatus === 'pending')
          .reduce((acc, s) => acc + (s.price || 0), 0);
        const totalCount = schoolSubs.length;
        const paidCount = paidSubs.length;
        const queuedSubsCount = schoolSubs.filter((s) => s.status === 'queued').length;
        const postedSubsCount = schoolSubs.filter((s) => s.status === 'posted').length;
        const avgOrder = paidCount > 0 ? (verifiedRevenue / paidCount).toFixed(2) : '0.00';
        const convRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

        return {
          school,
          verifiedRevenue,
          pendingRevenue,
          totalPotential: verifiedRevenue + pendingRevenue,
          paidCount,
          totalCount,
          queuedSubsCount,
          postedSubsCount,
          avgOrder,
          convRate,
        };
      })
      .sort((a, b) => {
        if (b.verifiedRevenue !== a.verifiedRevenue) {
          return b.verifiedRevenue - a.verifiedRevenue;
        }
        if (b.totalPotential !== a.totalPotential) {
          return b.totalPotential - a.totalPotential;
        }
        return b.totalCount - a.totalCount;
      });
  }, [schools, submissions]);

  const maxSchoolRevenue = useMemo(() => {
    const max = Math.max(...schoolsRevenueData.map((s) => s.verifiedRevenue), 0);
    return max > 0 ? max : 1;
  }, [schoolsRevenueData]);

  const topEarningSchool = schoolsRevenueData.length > 0 && schoolsRevenueData[0].verifiedRevenue > 0
    ? schoolsRevenueData[0]
    : null;

  // Speed tier revenue data
  const tierRevenueData = useMemo(() => {
    const instantPaid = submissions.filter((s) => s.tier === 'instant' && s.paymentStatus === 'paid');
    const hours48Paid = submissions.filter((s) => s.tier === '48hours' && s.paymentStatus === 'paid');
    const days5Paid = submissions.filter((s) => s.tier === '5days' && s.paymentStatus === 'paid');

    const instantRev = instantPaid.reduce((acc, s) => acc + (s.price || 10), 0);
    const hours48Rev = hours48Paid.reduce((acc, s) => acc + (s.price || 7), 0);
    const days5Rev = days5Paid.reduce((acc, s) => acc + (s.price || 5), 0);

    return {
      instant: { count: instantPaid.length, revenue: instantRev, price: 10 },
      hours48: { count: hours48Paid.length, revenue: hours48Rev, price: 7 },
      days5: { count: days5Paid.length, revenue: days5Rev, price: 5 },
      totalRev: instantRev + hours48Rev + days5Rev,
    };
  }, [submissions]);

  if (!isOpen) return null;

  // Dual-portal Authentication Guard
  const isAuthorizedForCurrentPortal =
    portalMode === 'master' ? isMasterAuthenticated : (isPosterAuthenticated || isMasterAuthenticated);

  if (!isAuthorizedForCurrentPortal) {
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
              <div
                className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-md mb-3.5 ${
                  portalMode === 'master'
                    ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
                    : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600'
                }`}
              >
                {portalMode === 'master' ? (
                  <Lock className="w-7 h-7 text-white" />
                ) : (
                  <Instagram className="w-7 h-7 text-white" />
                )}
              </div>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1.5 ${
                  portalMode === 'master'
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-blue-50 border border-blue-200 text-blue-700'
                }`}
              >
                <span>
                  {portalMode === 'master' ? 'Master Analytics • Mato & Pato' : 'Campus Posting Portal • Mato & Pato'}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-neutral-900 tracking-tight">
                {portalMode === 'master' ? 'Master Analytics Admin Login' : 'School Poster Portal Login'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                {portalMode === 'master'
                  ? 'Enter master administrative credentials to access financial earnings, school revenue leaderboards, and payment verification.'
                  : 'Enter posting credentials to search schools, review incoming requests, and download Instagram post graphics.'}
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
                    placeholder={portalMode === 'master' ? 'Enter password (#NewChapter@2026)' : 'Enter password (#NewChapter)'}
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
                  className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                    portalMode === 'master'
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying credentials...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>{portalMode === 'master' ? 'Unlock Master Analytics' : 'Unlock Poster Portal'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-3 border-t border-neutral-200/70 text-center space-y-2">
                <button
                  id="admin-login-toggle-mode-btn"
                  type="button"
                  onClick={() => {
                    setPortalMode(portalMode === 'master' ? 'poster' : 'master');
                    setLoginError(null);
                    setLoginPassword('');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {portalMode === 'master' ? (
                    <>
                      <Instagram className="w-3.5 h-3.5 text-blue-600" />
                      <span>Switch to School Poster Portal (Password: #NewChapter)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Switch to Master Analytics Admin (Password: #NewChapter@2026)</span>
                    </>
                  )}
                </button>
                <button
                  id="admin-login-cancel-btn"
                  type="button"
                  onClick={onClose}
                  className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer font-medium"
                >
                  Close and return to site
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-sm shrink-0 ${
                portalMode === 'master'
                  ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
                  : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600'
              }`}>
                {portalMode === 'master' ? <BarChart3 className="w-5 h-5 text-white" /> : <Instagram className="w-5 h-5 text-white" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight">
                    {portalMode === 'master' ? 'Master Analytics Admin' : 'School Poster Portal'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    portalMode === 'master'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    {portalMode === 'master' ? 'Executive Analytics • Mato & Pato' : 'Posting Team • Mato & Pato'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {portalMode === 'master'
                    ? 'Total revenue metrics, which schools make more money, speed tier analytics & graphs'
                    : 'Search schools, review requests by campus, and download Instagram-ready post graphics'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {/* Dual Portal Switcher Pill */}
              <div className="flex items-center p-1 bg-neutral-100 rounded-2xl border border-neutral-200">
                <button
                  type="button"
                  id="portal-switch-poster-btn"
                  onClick={() => setPortalMode('poster')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    portalMode === 'poster'
                      ? 'bg-white text-blue-700 shadow-xs ring-1 ring-neutral-200'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Campus Poster Portal: Search school, view requests & download IG graphics"
                >
                  <Instagram className="w-3.5 h-3.5 text-blue-600" />
                  <span>Poster Portal</span>
                </button>
                <button
                  type="button"
                  id="portal-switch-master-btn"
                  onClick={() => setPortalMode('master')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    portalMode === 'master'
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Master Analytics: Total earnings, school financial charts & graphs"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Master Analytics</span>
                </button>
              </div>

              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>User: <strong className="text-pink-600 font-bold">@{currentAdminUser}</strong></span>
              </div>

              <button
                id="admin-logout-btn"
                onClick={handleLogout}
                title="Log out of Admin Portal"
                className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-neutral-700 border border-neutral-200 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-neutral-500 hover:text-red-600" />
                <span className="hidden xs:inline">Log out</span>
              </button>

              <button
                id="admin-refresh-data-btn"
                onClick={fetchBackendData}
                disabled={isLoading}
                title="Refresh data"
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
          {portalMode === 'master' ? (
            /* MASTER ADMIN METRICS: Full Financial Metrics & Revenue Breakdown */
            <div className="space-y-3 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-pink-50 rounded-2xl border border-pink-200/80 text-center">
                  <p className="text-[10px] font-bold text-pink-700 uppercase tracking-wider flex items-center justify-center gap-1">
                    <DollarSign className="w-3 h-3 text-pink-600" />
                    <span>Verified Revenue</span>
                  </p>
                  <p className="text-2xl font-black text-pink-950 mt-0.5">
                    ${totalVerifiedRevenue}
                  </p>
                  <p className="text-[10px] text-pink-600 font-semibold mt-0.5">
                    {paidSubmissionsCount} paid posts
                  </p>
                </div>

                <div className={`p-3 rounded-2xl border text-center transition-colors ${
                  pendingVerificationCount > 0
                    ? 'bg-amber-500/10 border-amber-300'
                    : 'bg-neutral-50 border-neutral-200'
                }`}>
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1">
                    <span>Awaiting Payment</span>
                    {pendingVerificationCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </p>
                  <p className="text-2xl font-black text-amber-900 mt-0.5">
                    ${totalPendingRevenue}
                  </p>
                  <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                    {pendingVerificationCount} in verification
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-center">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Top Campus Earner</p>
                  <p className="text-base font-black text-emerald-950 mt-0.5 truncate">
                    {topEarningSchool ? topEarningSchool.school.shortName : 'N/A'}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    {topEarningSchool ? `$${topEarningSchool.verifiedRevenue} made` : 'No earnings yet'}
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200/80 text-center">
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Avg Order Value</p>
                  <p className="text-2xl font-black text-blue-900 mt-0.5">
                    ${averageOrderValue}
                  </p>
                  <p className="text-[10px] text-blue-600 font-semibold mt-0.5">
                    {paidConversionRate}% conversion
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200/80 text-center col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Published on IG</p>
                  <p className="text-2xl font-black text-purple-950 mt-0.5">
                    {metrics?.postedCount ?? postedCount}
                  </p>
                  <p className="text-[10px] text-purple-600 font-semibold mt-0.5">
                    of {submissions.length} total
                  </p>
                </div>
              </div>

              {/* Master Financial Breakdown Sub-bar */}
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-neutral-800">
                  <TrendingUp className="w-4 h-4 text-pink-600" />
                  <span>Speed Tier Breakdown:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-neutral-600">
                  <span>
                    ⚡ Instant ($10): <strong>{tierRevenueData.instant.count} posts</strong> (${tierRevenueData.instant.revenue})
                  </span>
                  <span>•</span>
                  <span>
                    ⚡ 48-Hour ($7): <strong>{tierRevenueData.hours48.count} posts</strong> (${tierRevenueData.hours48.revenue})
                  </span>
                  <span>•</span>
                  <span>
                    Standard ($5): <strong>{tierRevenueData.days5.count} posts</strong> (${tierRevenueData.days5.revenue})
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* POSTER PORTAL METRICS: Strictly Hide All Earnings & Financial Details */
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-center">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Submissions</p>
                <p className="text-xl font-black text-neutral-900 mt-0.5">
                  {submissions.length}
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200/80 text-center">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Active Campuses</p>
                <p className="text-xl font-black text-blue-900 mt-0.5">
                  {schools.length}
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-center">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Waiting in Queue</p>
                <p className="text-xl font-black text-amber-900 mt-0.5">
                  {queuedCount}
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200/80 text-center">
                <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Approved Ready</p>
                <p className="text-xl font-black text-purple-900 mt-0.5">
                  {approvedCount}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-center col-span-2 sm:col-span-1">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Published on IG</p>
                <p className="text-xl font-black text-emerald-900 mt-0.5">
                  {metrics?.postedCount ?? postedCount}
                </p>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-2.5 pt-0.5 text-xs font-bold overflow-x-auto overflow-y-hidden shrink-0 min-h-[46px]">
            {portalMode === 'master' && (
              <button
                id="admin-tab-analytics-btn"
                onClick={() => setActiveTab('analytics')}
                className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'analytics'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-pink-500" />
                <span>Financial Analytics & Graphs</span>
              </button>
            )}

            {portalMode === 'master' && (
              <button
                id="admin-tab-payments-btn"
                onClick={() => setActiveTab('payments')}
                className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'payments'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span>Payment Verification ({pendingVerificationCount})</span>
              </button>
            )}

            <button
              id="admin-tab-queue-btn"
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'queue'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {portalMode === 'master' ? `All Requests (${submissions.length})` : `School Posting Queue (${submissions.length})`}
              </span>
            </button>

            <button
              id="admin-tab-pictures-btn"
              onClick={() => setActiveTab('pictures')}
              className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'pictures'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200/60'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-pink-600" />
              <span>Student Pictures & IG Download ({submissions.length})</span>
            </button>

            <button
              id="admin-tab-schools-btn"
              onClick={() => setActiveTab('schools')}
              className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'schools'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Campuses ({schools.length})</span>
            </button>

            {portalMode === 'master' && (
              <button
                id="admin-tab-admins-btn"
                onClick={() => setActiveTab('admins')}
                className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'admins'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>Managers & Admins ({adminUsers.length})</span>
              </button>
            )}
          </div>

          {/* TAB: Master Financial Analytics & Graphs */}
          {portalMode === 'master' && activeTab === 'analytics' && (
            <div className="space-y-6 shrink-0">
              {/* Executive Revenue Summary Hero Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 text-white shadow-xl border border-neutral-800 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Executive Financial Overview</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                      ${totalVerifiedRevenue}
                      <span className="text-sm font-semibold text-neutral-400 ml-2">Total Verified Revenue</span>
                    </h2>
                    <p className="text-xs text-neutral-400 mt-1 max-w-md">
                      Generated from {paidSubmissionsCount} verified paid submissions across {schools.length} universities.
                      {totalPendingRevenue > 0 && ` An additional $${totalPendingRevenue} is currently pending payment verification.`}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                      <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Top Earner</p>
                      <p className="text-base font-extrabold text-pink-400 truncate mt-0.5">
                        {topEarningSchool ? topEarningSchool.school.shortName : 'N/A'}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {topEarningSchool ? `$${topEarningSchool.verifiedRevenue} made` : '$0'}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                      <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Avg Order</p>
                      <p className="text-base font-extrabold text-blue-400 mt-0.5">
                        ${averageOrderValue}
                      </p>
                      <p className="text-[10px] text-neutral-400">per verified post</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs col-span-2 sm:col-span-1">
                      <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Paid Conversion</p>
                      <p className="text-base font-extrabold text-emerald-400 mt-0.5">
                        {paidConversionRate}%
                      </p>
                      <p className="text-[10px] text-neutral-400">{paidSubmissionsCount} of {submissions.length} total</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRAPH 1: "Which Schools Are Making More Money" - Visual Leaderboard Bar Graph */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-pink-600" />
                      <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 tracking-tight">
                        Which Schools Are Making More Money?
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Real-time revenue ranking across all campuses. Click &ldquo;View Requests&rdquo; to instantly filter submissions for that school.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                      Sorted by: Revenue ($) Descending
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {schoolsRevenueData.map((item, idx) => {
                    const percentage = Math.max(Math.round((item.verifiedRevenue / maxSchoolRevenue) * 100), item.verifiedRevenue > 0 ? 8 : 2);
                    const rankMedal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

                    return (
                      <div
                        key={item.school.id}
                        className="p-3.5 rounded-2xl bg-neutral-50/80 hover:bg-neutral-100/80 border border-neutral-200/80 transition-all space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-base font-black w-7 text-center shrink-0">
                              {rankMedal}
                            </span>
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-2xs"
                              style={{ backgroundColor: item.school.primaryColor || '#db2777' }}
                            >
                              {item.school.shortName.slice(0, 3)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-sm text-neutral-900">
                                  {item.school.name}
                                </h4>
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-800">
                                  {item.school.shortName} • {item.school.state}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-500 font-medium">
                                {item.totalCount} total submissions • {item.paidCount} paid posts • {item.postedSubsCount} published on IG
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <div className="text-right">
                              <p className="text-lg font-black text-pink-600">
                                ${item.verifiedRevenue}
                              </p>
                              {item.pendingRevenue > 0 && (
                                <p className="text-[10px] font-bold text-amber-700">
                                  +${item.pendingRevenue} pending
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setFilterSchoolId(item.school.id);
                                setActiveTab('queue');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-pink-50 text-pink-700 border border-neutral-300 hover:border-pink-300 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <span>View Requests ({item.totalCount})</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Visual Revenue Comparison Bar */}
                        <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden relative">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GRAPHS ROW: Speed Tier Breakdown & Delivery Funnel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Graph 2: Speed Tier Revenue Performance */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-4">
                  <div className="border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">
                        Revenue by Speed Tier
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Comparing student demand between Instant ($10), 48-Hour ($7), and Standard ($5)
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Instant Tier */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-rose-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <span>⚡ Instant Priority ($10)</span>
                        </span>
                        <span className="text-neutral-900 font-extrabold">
                          ${tierRevenueData.instant.revenue} ({tierRevenueData.instant.count} posts)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              tierRevenueData.totalRev > 0
                                ? Math.round((tierRevenueData.instant.revenue / tierRevenueData.totalRev) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* 48-Hour Tier */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-blue-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span>⚡ 48-Hour Priority ($7)</span>
                        </span>
                        <span className="text-neutral-900 font-extrabold">
                          ${tierRevenueData.hours48.revenue} ({tierRevenueData.hours48.count} posts)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              tierRevenueData.totalRev > 0
                                ? Math.round((tierRevenueData.hours48.revenue / tierRevenueData.totalRev) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Standard 5-Days Tier */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-neutral-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-neutral-500" />
                          <span>Standard 5-Days ($5)</span>
                        </span>
                        <span className="text-neutral-900 font-extrabold">
                          ${tierRevenueData.days5.revenue} ({tierRevenueData.days5.count} posts)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full bg-neutral-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              tierRevenueData.totalRev > 0
                                ? Math.round((tierRevenueData.days5.revenue / tierRevenueData.totalRev) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-600 flex items-center justify-between">
                    <span className="font-semibold">Total Monetized Submissions:</span>
                    <span className="font-extrabold text-neutral-900">
                      {tierRevenueData.instant.count + tierRevenueData.hours48.count + tierRevenueData.days5.count} requests
                    </span>
                  </div>
                </div>

                {/* Graph 3: Payment Verification & Delivery Funnel */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-4">
                  <div className="border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">
                        Pipeline & Delivery Funnel
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Submissions progress from queue submission to verified Instagram publication
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Awaiting Verification</p>
                      <p className="text-2xl font-black text-amber-900 mt-0.5">
                        {pendingVerificationCount}
                      </p>
                      <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                        ${totalPendingRevenue} value
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Verified Paid</p>
                      <p className="text-2xl font-black text-emerald-900 mt-0.5">
                        {paidSubmissionsCount}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        ${totalVerifiedRevenue} collected
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                      <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Ready to Post</p>
                      <p className="text-2xl font-black text-blue-900 mt-0.5">
                        {approvedCount}
                      </p>
                      <p className="text-[10px] text-blue-700 font-semibold mt-0.5">
                        Graphics generated
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-center">
                      <p className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Live on Instagram</p>
                      <p className="text-2xl font-black text-purple-900 mt-0.5">
                        {postedCount}
                      </p>
                      <p className="text-[10px] text-purple-700 font-semibold mt-0.5">
                        Community posts
                      </p>
                    </div>
                  </div>

                  {pendingVerificationCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('payments')}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Review {pendingVerificationCount} Pending Payments (${totalPendingRevenue})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Comprehensive Campus Financial Performance Ledger Table */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">
                      Comprehensive Campus Financial Ledger
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Complete metrics breakdown per school: revenue, pending receipts, order value, and post conversion
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={analyticsSchoolSearch}
                      onChange={(e) => setAnalyticsSchoolSearch(e.target.value)}
                      placeholder="Filter ledger by campus..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 text-[10px] font-black text-neutral-500 uppercase tracking-wider bg-neutral-50/50">
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">University</th>
                        <th className="py-2.5 px-3 text-right">Verified Revenue</th>
                        <th className="py-2.5 px-3 text-right">Pending Proof</th>
                        <th className="py-2.5 px-3 text-center">Paid Posts</th>
                        <th className="py-2.5 px-3 text-center">Total Requests</th>
                        <th className="py-2.5 px-3 text-right">Avg Order</th>
                        <th className="py-2.5 px-3 text-right">Conversion</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-medium">
                      {schoolsRevenueData
                        .filter((item) => {
                          if (!analyticsSchoolSearch.trim()) return true;
                          const q = analyticsSchoolSearch.toLowerCase().trim();
                          return (
                            item.school.name.toLowerCase().includes(q) ||
                            item.school.shortName.toLowerCase().includes(q) ||
                            (item.school.state && item.school.state.toLowerCase().includes(q))
                          );
                        })
                        .map((item, idx) => (
                          <tr key={item.school.id} className="hover:bg-neutral-50/70 transition-colors">
                            <td className="py-3 px-3 font-black text-neutral-900">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0"
                                  style={{ backgroundColor: item.school.primaryColor || '#db2777' }}
                                >
                                  {item.school.shortName.slice(0, 2)}
                                </div>
                                <span className="font-extrabold text-neutral-900">{item.school.name}</span>
                                <span className="text-[10px] text-neutral-500">({item.school.shortName})</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-black text-pink-600 text-sm">
                              ${item.verifiedRevenue}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-amber-700">
                              {item.pendingRevenue > 0 ? `$${item.pendingRevenue}` : '—'}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-neutral-900">
                              {item.paidCount}
                            </td>
                            <td className="py-3 px-3 text-center text-neutral-600">
                              {item.totalCount}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-neutral-700">
                              ${item.avgOrder}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.convRate > 50
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.convRate > 0
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}>
                                {item.convRate}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterSchoolId(item.school.id);
                                  setActiveTab('queue');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                Filter Requests
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Master Admin Payment Verification Queue */}
          {portalMode === 'master' && activeTab === 'payments' && (
            <div className="space-y-4 shrink-0">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-xs text-amber-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-sm block">Payment Verification Queue</span>
                    <span>Review student payment proofs, Zelle/Venmo receipts, and verify earnings.</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-amber-900">${totalPendingRevenue}</span>
                  <span className="block text-[10px] font-bold text-amber-700">{pendingVerificationCount} proofs pending</span>
                </div>
              </div>

              {submissions.filter((s) => s.paymentStatus === 'pending_verification' || s.paymentStatus === 'pending').length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-extrabold text-sm text-neutral-900">All Payments Verified!</p>
                  <p className="text-xs text-neutral-500">There are currently no submissions awaiting payment approval.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions
                    .filter((s) => s.paymentStatus === 'pending_verification' || s.paymentStatus === 'pending')
                    .map((sub) => (
                      <div
                        key={sub.id}
                        className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={sub.photoUrl}
                            alt={sub.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-16 object-cover rounded-xl border border-neutral-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-neutral-900">{sub.name}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800">
                                {sub.school.shortName}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-100 text-pink-800">
                                ${sub.price} ({sub.tier.toUpperCase()})
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Instagram: <strong className="text-pink-600">@{sub.instagram}</strong> • Method: <strong className="uppercase">{sub.paymentMethod}</strong>
                            </p>
                            {sub.paymentReceiptNote && (
                              <p className="text-xs text-neutral-600 mt-1 bg-neutral-50 p-1.5 rounded-lg border border-neutral-200">
                                &ldquo;{sub.paymentReceiptNote}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center">
                          {sub.paymentReceiptUrl && (
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptSub(sub)}
                              className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-neutral-600" />
                              <span>View Receipt</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleVerifyPayment(sub)}
                            disabled={isVerifyingPaymentId === sub.id}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Payment (${sub.price})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectPayment(sub)}
                            disabled={isVerifyingPaymentId === sub.id}
                            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 1: Live Submissions Queue */}
          {activeTab === 'queue' && (
            <div className="space-y-4 shrink-0">
              {/* Dedicated Search & Filter Controls */}
              <div className="space-y-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-200 text-xs">
                {/* Dedicated School & Student Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="admin-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search university (e.g., Emory, UGA, USC), state, or student @handle..."
                    className="w-full pl-10 pr-10 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-xs font-medium placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500 focus:border-pink-500 shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Posts per School Leaderboard / Filter Chips */}
                <div className="space-y-1.5 pt-1 border-t border-neutral-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                      Posts per School (Click to Filter):
                    </span>
                    {filterSchoolId !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setFilterSchoolId('all')}
                        className="text-[11px] font-bold text-pink-600 hover:text-pink-700 underline cursor-pointer"
                      >
                        Show All Schools
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden py-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFilterSchoolId('all')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        filterSchoolId === 'all'
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      All Campuses ({submissions.length})
                    </button>

                    {schools.map((s) => {
                      const count = submissions.filter((sub) => sub.school.id === s.id).length;
                      if (count === 0 && filterSchoolId !== s.id && !searchQuery) return null;
                      const isSelected = filterSchoolId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFilterSchoolId(isSelected ? 'all' : s.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-pink-600 text-white shadow-xs'
                              : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-pink-50 hover:border-pink-300'
                          }`}
                        >
                          <span>{s.shortName}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-800'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active School Filter Banner */}
                {filterSchoolId !== 'all' && (() => {
                  const selSchool = schools.find((s) => s.id === filterSchoolId);
                  const schoolSubs = submissions.filter((s) => s.school.id === filterSchoolId);
                  const schoolQueued = schoolSubs.filter((s) => s.status === 'queued').length;
                  const schoolApproved = schoolSubs.filter((s) => s.status === 'approved').length;
                  const schoolPosted = schoolSubs.filter((s) => s.status === 'posted').length;

                  return (
                    <div className="p-3 rounded-xl bg-pink-100/80 border border-pink-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: selSchool?.primaryColor || '#db2777' }}
                        >
                          {selSchool?.shortName.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-extrabold text-neutral-900">
                            Viewing requests for {selSchool?.name} ({selSchool?.shortName})
                          </span>
                          <span className="text-neutral-600 block text-[11px]">
                            {schoolSubs.length} total submissions • {schoolQueued} queued • {schoolApproved} approved • {schoolPosted} posted to IG
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFilterSchoolId('all')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-pink-300 text-pink-700 font-bold hover:bg-pink-50 transition-colors cursor-pointer text-xs shadow-2xs"
                      >
                        ✕ Clear School Filter
                      </button>
                    </div>
                  );
                })()}

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-200/60">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="font-bold text-neutral-700">Refine Status:</span>
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

                    {/* Payment status filter is strictly restricted to Master Admin */}
                    {portalMode === 'master' && (
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
                    )}
                  </div>
                </div>
              </div>

              {/* Submissions List */}
              {submissions.filter((sub) => {
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase().trim();
                  const matchSchool =
                    sub.school.name.toLowerCase().includes(q) ||
                    sub.school.shortName.toLowerCase().includes(q) ||
                    (sub.school.state && sub.school.state.toLowerCase().includes(q));
                  const matchStudent =
                    sub.name.toLowerCase().includes(q) ||
                    sub.instagram.toLowerCase().includes(q) ||
                    sub.major.toLowerCase().includes(q) ||
                    (sub.hometown && sub.hometown.toLowerCase().includes(q));
                  if (!matchSchool && !matchStudent) return false;
                }
                if (filterSchoolId !== 'all' && sub.school.id !== filterSchoolId) return false;
                if (filterStatus !== 'all' && sub.status !== filterStatus) return false;
                if (portalMode === 'master' && filterPaymentStatus !== 'all' && sub.paymentStatus !== filterPaymentStatus) {
                  return false;
                }
                return true;
              }).length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 space-y-2">
                  <Clock className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p className="text-sm font-bold text-neutral-700">No submissions found</p>
                  <p className="text-xs text-neutral-500">
                    {searchQuery
                      ? `No posts matched "${searchQuery}". Try clearing search filters.`
                      : 'When students submit their feature post on any campus, it will appear here in real time.'}
                  </p>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterSchoolId('all');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-bold cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions
                    .filter((sub) => {
                      if (searchQuery.trim()) {
                        const q = searchQuery.toLowerCase().trim();
                        const matchSchool =
                          sub.school.name.toLowerCase().includes(q) ||
                          sub.school.shortName.toLowerCase().includes(q) ||
                          (sub.school.state && sub.school.state.toLowerCase().includes(q));
                        const matchStudent =
                          sub.name.toLowerCase().includes(q) ||
                          sub.instagram.toLowerCase().includes(q) ||
                          sub.major.toLowerCase().includes(q) ||
                          (sub.hometown && sub.hometown.toLowerCase().includes(q));
                        if (!matchSchool && !matchStudent) return false;
                      }
                      if (filterSchoolId !== 'all' && sub.school.id !== filterSchoolId) return false;
                      if (filterStatus !== 'all' && sub.status !== filterStatus) return false;
                      if (portalMode === 'master' && filterPaymentStatus !== 'all' && sub.paymentStatus !== filterPaymentStatus) {
                        return false;
                      }
                      return true;
                    })
                    .map((sub) => {
                      // Dynamic Queue Position Calculation for transparency
                      const queuedList = submissions.filter((s) => s.status === 'queued');
                      const queuePosition = sub.status === 'queued' ? queuedList.findIndex((q) => q.id === sub.id) + 1 : null;
                      const photosCount = sub.photoUrls && sub.photoUrls.length > 0 ? sub.photoUrls.length : 1;

                      return (
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
                                {photosCount > 1 && (
                                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                                    {photosCount}p
                                  </span>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-extrabold text-sm text-neutral-900">{sub.name}</h4>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                                    {sub.school.shortName} &apos;{String(sub.gradYear).slice(-2)}
                                  </span>

                                  {portalMode === 'master' ? (
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
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                                      {sub.tier === 'instant'
                                        ? '⚡ Instant Priority'
                                        : sub.tier === '48hours'
                                        ? '⚡ 48-Hour Priority'
                                        : 'Standard Timeline'}
                                    </span>
                                  )}
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
                                  {photosCount > 1 && (
                                    <span className="font-semibold text-neutral-600">
                                      📸 {photosCount} Photos Attached
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status badge & quick download */}
                            <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                              <button
                                onClick={() => handleDownloadTemplatedGraphic(sub)}
                                disabled={downloadingId === `template_${sub.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                title="Download Instagram-ready 1080x1350 graphic with school colors"
                              >
                                <Download className={`w-3.5 h-3.5 ${downloadingId === `template_${sub.id}` ? 'animate-bounce text-pink-600' : ''}`} />
                                <span>Download Post</span>
                              </button>

                              {/* Queue Transparency Status Badge */}
                              {sub.status === 'posted' ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>✓ Published on IG</span>
                                </span>
                              ) : sub.status === 'approved' ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Approved Ready</span>
                                </span>
                              ) : sub.status === 'rejected' ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  Rejected
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                  <span>Queue Position #{queuePosition && queuePosition > 0 ? queuePosition : 1}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Bio snippet */}
                          {sub.bio && (
                            <p className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 italic">
                              &ldquo;{sub.bio}&rdquo;
                            </p>
                          )}

                          {/* Master Admin Only: Payment Proof & Verification Panel */}
                          {portalMode === 'master' && (
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
                          )}

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
                                <span>Preview Post Card</span>
                              </button>

                              <button
                                onClick={() => handleDownloadOriginalPhoto(sub)}
                                disabled={downloadingId === `orig_${sub.id}`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer text-[11px]"
                                title="Download raw unedited photo"
                              >
                                <Download className="w-3 h-3" />
                                <span>Original Photo</span>
                              </button>

                              {photosCount > 1 && (
                                <button
                                  onClick={() => handleDownloadAllPhotos(sub)}
                                  disabled={downloadingId === `all_${sub.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors cursor-pointer text-[11px] font-bold"
                                  title="Download all attached photos"
                                >
                                  <Download className="w-3 h-3 text-pink-600" />
                                  <span>All {photosCount} Photos</span>
                                </button>
                              )}
                            </div>

                            {/* Workflow Controls: Available to both Poster and Master Admin */}
                            {portalMode === 'poster' ? (
                              <div className="flex items-center gap-1.5">
                                {sub.status !== 'posted' ? (
                                  <button
                                    onClick={() => handleUpdateStatus(sub.id, 'posted')}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Mark as Posted</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateStatus(sub.id, 'approved')}
                                    className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors cursor-pointer"
                                    title="Unmark as posted"
                                  >
                                    <span>Undo Posted</span>
                                  </button>
                                )}
                              </div>
                            ) : (
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
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Student Pictures & IG Download Gallery */}
          {activeTab === 'pictures' && (
            <div className="space-y-4 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-pink-50/60 p-3 rounded-2xl border border-pink-100 text-xs">
                <div>
                  <p className="font-extrabold text-neutral-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-pink-600" />
                    <span>Instagram Asset Hub</span>
                  </p>
                  <p className="text-neutral-600 text-xs mt-0.5">
                    Preview and download student photos with school branding or raw unedited images to post directly on Instagram.
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

              {/* School Search & Filter for Pictures Tab */}
              <div className="space-y-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-200 text-xs">
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search university (e.g. Emory, UGA, USC) or student @handle to filter pictures..."
                    className="w-full pl-10 pr-10 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-xs font-medium placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500 shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* School Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden py-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFilterSchoolId('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      filterSchoolId === 'all'
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    All Campuses ({submissions.length})
                  </button>
                  {schools.map((s) => {
                    const count = submissions.filter((sub) => sub.school.id === s.id).length;
                    if (count === 0 && filterSchoolId !== s.id && !searchQuery) return null;
                    const isSelected = filterSchoolId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFilterSchoolId(isSelected ? 'all' : s.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-pink-600 text-white shadow-xs'
                            : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-pink-50'
                        }`}
                      >
                        <span>{s.shortName}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-800'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {submissions.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
                  <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p className="text-sm font-bold text-neutral-700 mt-2">No student pictures yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {submissions
                    .filter((sub) => {
                      if (searchQuery.trim()) {
                        const q = searchQuery.toLowerCase().trim();
                        const matchSchool =
                          sub.school.name.toLowerCase().includes(q) ||
                          sub.school.shortName.toLowerCase().includes(q) ||
                          (sub.school.state && sub.school.state.toLowerCase().includes(q));
                        const matchStudent =
                          sub.name.toLowerCase().includes(q) ||
                          sub.instagram.toLowerCase().includes(q) ||
                          sub.major.toLowerCase().includes(q) ||
                          (sub.hometown && sub.hometown.toLowerCase().includes(q));
                        if (!matchSchool && !matchStudent) return false;
                      }
                      if (filterSchoolId !== 'all' && sub.school.id !== filterSchoolId) return false;
                      return true;
                    })
                    .map((sub) => (
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

                          <div className={`grid ${sub.photoUrls && sub.photoUrls.length > 1 ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5`}>
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
                                  <span>Caption</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleDownloadOriginalPhoto(sub)}
                              disabled={downloadingId === `orig_${sub.id}`}
                              className="py-1.5 px-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <Download className="w-3 h-3 text-neutral-500" />
                              <span>Raw</span>
                            </button>

                            {sub.photoUrls && sub.photoUrls.length > 1 && (
                              <button
                                onClick={() => handleDownloadAllPhotos(sub)}
                                disabled={downloadingId === `all_${sub.id}`}
                                className="py-1.5 px-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                title="Download all attached photos"
                              >
                                <Download className="w-3 h-3 text-pink-600" />
                                <span>All ({sub.photoUrls.length})</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Active Campuses & Instagram Bio Links Generator */}
          {activeTab === 'schools' && (
            <div className="space-y-4 shrink-0">
              {/* Instagram Bio Links Generator & Domain Bar */}
              <div className="p-4 bg-gradient-to-r from-pink-50 via-purple-50 to-neutral-50 rounded-2xl border border-pink-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                        Instagram Bio Links Generator
                      </h4>
                      <p className="text-[11px] text-neutral-600">
                        Generate and copy the two links for each campus Instagram page bio.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDomainGuide(!showDomainGuide)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-bold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>{showDomainGuide ? 'Hide Domain Guide' : 'Custom Domain Setup Guide'}</span>
                  </button>
                </div>

                {/* Custom Domain Input for Link Generation */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 text-xs">
                  <label className="text-neutral-700 font-bold sm:shrink-0 flex items-center gap-1">
                    <span>Target Domain for Links:</span>
                  </label>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value)}
                      placeholder={typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 font-mono"
                    />
                  </div>
                  {customDomainInput && (
                    <button
                      type="button"
                      onClick={() => setCustomDomainInput('')}
                      className="px-2 py-1 text-[11px] text-neutral-500 hover:text-neutral-800 underline cursor-pointer"
                    >
                      Reset to Current Host
                    </button>
                  )}
                </div>

                {/* Explanatory badge */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-600 bg-white/80 p-2.5 rounded-xl border border-pink-100">
                  <div className="flex items-start gap-1.5">
                    <span className="font-extrabold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded text-[10px]">
                      Link 1
                    </span>
                    <div>
                      <strong className="text-neutral-800">Main Page / Campus Hub:</strong> Takes students to browse classmates and view the full campus directory.
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-extrabold text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded text-[10px]">
                      Link 2
                    </span>
                    <div>
                      <strong className="text-neutral-800">Direct Post & Submit:</strong> Instantly opens the photo upload & checkout form for that specific school.
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Custom Domain Guide Accordion */}
              {showDomainGuide && (
                <div className="p-4 bg-neutral-900 text-white rounded-2xl border border-neutral-800 space-y-3 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="font-black tracking-wider uppercase text-pink-400 flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      How to Point a Custom Domain to This Application
                    </span>
                    <button
                      onClick={() => setShowDomainGuide(false)}
                      className="text-neutral-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-neutral-300 leading-relaxed">
                    <p>
                      <strong>Step 1: Buy Your Domain</strong><br />
                      Purchase your chosen domain (e.g. <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-pink-300">classof2031.com</code> or <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-pink-300">meetyourclass.com</code>) from any registrar (Namecheap, Cloudflare, GoDaddy, or Google Cloud Domains).
                    </p>
                    <p>
                      <strong>Step 2: Map Custom Domain in Google Cloud Run</strong><br />
                      In Google Cloud Console, navigate to <strong>Cloud Run &rarr; Manage Custom Domains &rarr; Add Mapping</strong>. Select this service and type your domain name. Cloud Run will provide you with DNS records (an <strong>A record</strong> pointing to Google Cloud IP addresses or a <strong>CNAME record</strong> for subdomains).
                    </p>
                    <p>
                      <strong>Step 3: Update DNS Records at Registrar</strong><br />
                      Log into your registrar/DNS provider (Cloudflare, Namecheap, etc.) and add the DNS records provided in Step 2. Cloud Run automatically provisions free managed SSL certificates within 10–20 minutes.
                    </p>
                    <p>
                      <strong>Step 4: Add Links into Instagram Bio</strong><br />
                      Instagram allows adding multiple links in any profile bio! On each school’s IG profile (e.g. <code>@emory2031</code>), tap <em>Edit Profile &rarr; Links &rarr; Add External Link</em> and paste Link 1 and Link 2 below!
                    </p>
                  </div>
                </div>
              )}

              {/* Schools list with one-click copy buttons */}
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {schools.map((s) => {
                  const effectiveBase = (customDomainInput.trim()
                    ? (customDomainInput.startsWith('http') ? customDomainInput.trim() : `https://${customDomainInput.trim()}`)
                    : (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');

                  const mainPageUrl = `${effectiveBase}/?school=${encodeURIComponent(s.id)}`;
                  const directPostUrl = `${effectiveBase}/?school=${encodeURIComponent(s.id)}&post=1`;

                  const isCopiedMain = copiedLinkType === `${s.id}_main`;
                  const isCopiedPost = copiedLinkType === `${s.id}_post`;

                  return (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all shadow-2xs space-y-2.5 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: s.accentColor }}
                          >
                            {s.shortName.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-extrabold text-neutral-900">{s.name}</p>
                            <p className="text-[11px] text-pink-600 font-semibold flex items-center gap-1">
                              <Instagram className="w-3 h-3" />
                              {s.instagramHandle || `@${s.shortName.toLowerCase()}2031`}
                              <span className="text-neutral-400 font-normal ml-1">
                                • {s.memberCount} members
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Quick preview button */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <a
                            href={mainPageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                            title="Preview school hub"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* The Two IG Bio Links */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-neutral-100">
                        {/* Link 1: Main Page */}
                        <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider block">
                              Link 1: Main Page / Hub
                            </span>
                            <span className="text-[11px] font-mono text-neutral-800 truncate block">
                              {mainPageUrl}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(mainPageUrl);
                              setCopiedLinkType(`${s.id}_main`);
                              setTimeout(() => setCopiedLinkType(null), 3000);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                              isCopiedMain
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
                            }`}
                          >
                            {isCopiedMain ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-neutral-500" />
                                <span>Copy Link 1</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Link 2: Direct Post & Feature Form */}
                        <div className="p-2 rounded-xl bg-pink-50/70 border border-pink-200/80 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-extrabold text-pink-700 uppercase tracking-wider block">
                              Link 2: Direct Post Form
                            </span>
                            <span className="text-[11px] font-mono text-pink-950 truncate block">
                              {directPostUrl}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(directPostUrl);
                              setCopiedLinkType(`${s.id}_post`);
                              setTimeout(() => setCopiedLinkType(null), 3000);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                              isCopiedPost
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-pink-600 hover:bg-pink-700 text-white shadow-2xs'
                            }`}
                          >
                            {isCopiedPost ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Link 2</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Admin Users & Team Management */}
          {activeTab === 'admins' && (
            <div className="space-y-4 shrink-0">
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
