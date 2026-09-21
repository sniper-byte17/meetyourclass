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
  Image as ImageIcon,
  Sparkles,
  Layers,
  UserPlus,
  UserCheck,
  Mail,
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
  const [activeTab, setActiveTab] = useState<'queue' | 'pictures' | 'admins' | 'schools'>('queue');
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterSchoolId, setFilterSchoolId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
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
        addedBy: 'Martin Muthomi',
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
        setSubmissions(filtered);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, filterSchoolId, filterStatus]);

  if (!isOpen) return null;

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
              <button
                onClick={fetchBackendData}
                disabled={isLoading}
                title="Refresh backend data"
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-center">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Queue Total</p>
              <p className="text-xl sm:text-2xl font-black text-neutral-900 mt-0.5">
                {metrics?.totalSubmissions ?? submissions.length}
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-center">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Posts</p>
              <p className="text-xl sm:text-2xl font-black text-amber-900 mt-0.5">
                {metrics?.pendingQueue ?? submissions.filter((s) => s.status === 'queued').length}
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-center">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Posted on IG</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-900 mt-0.5">
                {metrics?.postedCount ?? submissions.filter((s) => s.status === 'posted').length}
              </p>
            </div>

            <div className="p-3.5 bg-pink-50 rounded-2xl border border-pink-200/80 text-center">
              <p className="text-[10px] font-bold text-pink-700 uppercase tracking-wider">Revenue Collected</p>
              <p className="text-xl sm:text-2xl font-black text-pink-950 mt-0.5">
                ${metrics?.verifiedRevenue ?? submissions.reduce((acc, s) => acc + (s.price || 0), 0)}
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
                    <option value="all">All Statuses</option>
                    <option value="queued">Queued (Pending)</option>
                    <option value="approved">Approved</option>
                    <option value="posted">Posted to IG</option>
                    <option value="rejected">Rejected</option>
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

                          {sub.paymentHandle && (
                            <span className="text-[11px] text-neutral-500">
                              Paid via {sub.paymentMethod}: <strong>{sub.paymentHandle}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {sub.status !== 'approved' && sub.status !== 'posted' && (
                            <button
                              onClick={() => handleUpdateStatus(sub.id, 'approved')}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition-colors cursor-pointer"
                            >
                              Approve
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
      </div>
    </AnimatePresence>
  );
};
