import { useState, useEffect } from 'react';
import { useAppContext } from '../lib/AppContext';
import { firebaseClient } from '@/api/firebaseClient';
import { toast } from 'sonner';
import { Check, X, KeyRound } from 'lucide-react';
import ImageLightbox from '../components/ImageLightbox';
import { formatDateDMY } from '../utils/dateUtils';

export default function AdminVerification() {
  const { currentUser, lang } = useAppContext();
  const [profiles, setProfiles] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  // Approve modal state
  const [approvingProfile, setApprovingProfile] = useState(null);
  const [expiryDate, setExpiryDate] = useState('');

  // Reject modal state
  const [rejectingProfile, setRejectingProfile] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    loadProfiles();
  }, [currentUser]);

  const loadProfiles = async () => {
    setLoading(true);
    const data = await firebaseClient.entities.UserProfile.list('-created_date', 200);
    setProfiles(data);
    setLoading(false);
  };

  const approve = async (profile, expiry) => {
    await firebaseClient.entities.UserProfile.update(profile.id, {
      verification_status: 'verified',
      is_verified: true,
      verification_expiry_date: expiry || '',
      verification_reject_reason: '',
    });
    await Promise.all([
      firebaseClient.entities.Notification.create({
        user_email: profile.user_email,
        type: '✅',
        text: `Your identity has been verified!${expiry ? ` Document expires: ${formatDateDMY(expiry)}` : ''} You can now use all features.`,
        text_lao: `ຕົວຕົນຂອງທ່ານໄດ້ຖືກຢືນຢັນແລ້ວ!${expiry ? ` ເອກະສານໝົດອາຍຸ: ${formatDateDMY(expiry)}` : ''} ທ່ານສາມາດໃຊ້ທຸກຟັງຊັ່ນໄດ້ແລ້ວ.`,
      }),
      firebaseClient.functions.invoke('sendVerificationEmail', {
        email: profile.user_email,
        status: 'verified',
        fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      }),
    ]);
    toast.success('Profile approved ✅');
    setApprovingProfile(null);
    setExpiryDate('');
    loadProfiles();
  };

  const reject = async (profile, reason) => {
    await firebaseClient.entities.UserProfile.update(profile.id, {
      verification_status: 'rejected',
      is_verified: false,
      verification_reject_reason: reason || '',
    });
    await Promise.all([
      firebaseClient.entities.Notification.create({
        user_email: profile.user_email,
        type: '❌',
        text: `Your identity verification was rejected.${reason ? ` Reason: ${reason}` : ''} Please resubmit with clearer documents.`,
        text_lao: `ການຢືນຢັນຕົວຕົນຂອງທ່ານຖືກປະຕິເສດ.${reason ? ` ເຫດຜົນ: ${reason}` : ''} ກະລຸນາສົ່ງໃໝ່ດ້ວຍເອກະສານທີ່ຊັດເຈນກວ່າ.`,
      }),
      firebaseClient.functions.invoke('sendVerificationEmail', {
        email: profile.user_email,
        status: 'rejected',
        fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      }),
    ]);
    toast.success('Profile rejected');
    setRejectingProfile(null);
    setRejectReason('');
    loadProfiles();
  };

  const quickApprove = async (profile) => {
    if (!window.confirm(`Quick approve ${profile.first_name} ${profile.last_name}?`)) return;
    await approve(profile, '');
  };

  const approvePro = async (profile) => {
    await firebaseClient.entities.UserProfile.update(profile.id, {
      pro_verification_status: 'verified',
      is_pro: true,
      pro_reject_reason: '',
    });
    await firebaseClient.entities.Notification.create({
      user_email: profile.user_email,
      type: '🔵',
      text: `Your Pro verification has been approved for ${profile.business_name || 'your business'}.`,
      text_lao: `ການຢືນຢັນ Pro ຂອງທ່ານສຳລັບ ${profile.business_name || 'ທຸລະກິດ'} ໄດ້ຖືກອະນຸມັດແລ້ວ.`,
    });
    toast.success('Pro approved ✅');
    loadProfiles();
  };

  const rejectPro = async (profile) => {
    await firebaseClient.entities.UserProfile.update(profile.id, {
      pro_verification_status: 'rejected',
      is_pro: false,
      pro_reject_reason: 'Rejected by admin',
    });
    await firebaseClient.entities.Notification.create({
      user_email: profile.user_email,
      type: '🔵',
      text: 'Your Pro verification was rejected.',
      text_lao: 'ການຢືນຢັນ Pro ຂອງທ່ານຖືກປະຕິເສດ.',
    });
    toast.success('Pro rejected');
    loadProfiles();
  };

  const quickApprovePro = async (profile) => {
    if (!window.confirm(`Quick pass Pro for ${profile.first_name} ${profile.last_name}?`)) return;
    await firebaseClient.entities.UserProfile.update(profile.id, {
      pro_verification_status: 'verified',
      is_pro: true,
      pro_reject_reason: '',
      business_name: profile.business_name || `${profile.first_name} ${profile.last_name}`.trim(),
    });
    await firebaseClient.entities.Notification.create({
      user_email: profile.user_email,
      type: '🔵',
      text: 'Admin quick-passed your Pro verification.',
      text_lao: 'Admin ອະນຸມັດ Pro ໃຫ້ທ່ານແບບດ່ວນແລ້ວ.',
    });
    toast.success('Pro quick pass ✅');
    loadProfiles();
  };

  const resetPassword = async (profile) => {
    if (!window.confirm(`Reset password for ${profile.user_email}?`)) return;
    try {
      const res = await firebaseClient.functions.invoke('resetUserPassword', { email: profile.user_email });
      if (res.data.success) {
        toast.success('Password reset email sent ✅');
      }
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const isOnline = (profile) => {
    if (!profile.last_active) return false;
    const diffMinutes = (new Date() - new Date(profile.last_active)) / (1000 * 60);
    return diffMinutes < 5;
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center px-4">
        <div>
          <p className="text-4xl mb-3">🔒</p>
          <h2 className="font-bold text-lg mb-1">Admin Only</h2>
          <p className="text-muted-foreground text-sm">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const requestProfiles = profiles.filter(p => p.verification_status === 'pending' || p.pro_verification_status === 'pending');
  const verifiedProfiles = profiles.filter(p => p.is_verified || p.verification_status === 'verified' || p.is_pro || p.pro_verification_status === 'verified');
  const notVerifiedProfiles = profiles.filter(p => !p.is_verified && p.verification_status !== 'pending' && p.verification_status !== 'verified' && !p.is_pro && p.pro_verification_status !== 'pending' && p.pro_verification_status !== 'verified');
  const visibleProfiles = activeTab === 'requests' ? requestProfiles : activeTab === 'verified' ? verifiedProfiles : notVerifiedProfiles;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Verification Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{visibleProfiles.length} users</p>
        </div>
        <button onClick={loadProfiles} className="border border-border px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
          🔄 Refresh
        </button>
      </div>

      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('verified')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'verified' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          ✅ Verified
          {verifiedProfiles.length > 0 && <span className="ml-1 text-xs bg-primary text-white rounded-full px-1.5">{verifiedProfiles.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'requests' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          ⏳ Requests
          {requestProfiles.length > 0 && <span className="ml-1 text-xs bg-amber-500 text-white rounded-full px-1.5">{requestProfiles.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('not_verified')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'not_verified' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          ❌ Not Verified
          {notVerifiedProfiles.length > 0 && <span className="ml-1 text-xs bg-destructive text-white rounded-full px-1.5">{notVerifiedProfiles.length}</span>}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : visibleProfiles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-semibold">No users in this list</p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleProfiles.map(p => (
            <div key={p.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={p.photo_url || p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_email}`}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border-2 border-border"
                  />
                  {isOnline(p) && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Online now" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">{p.first_name} {p.last_name}</h3>
                  <p className="text-xs text-muted-foreground">{p.user_email}</p>
                  {p.verification_name && <p className="text-xs text-muted-foreground">ID Name: <span className="font-semibold text-foreground">{p.verification_name}</span></p>}
                  {p.verification_dob && <p className="text-xs text-muted-foreground">DOB: <span className="font-semibold text-foreground">{formatDateDMY(p.verification_dob)}</span></p>}
                  {p.verification_expiry_date && <p className="text-xs text-muted-foreground">Doc Expires: <span className="font-semibold text-foreground">{formatDateDMY(p.verification_expiry_date)}</span></p>}
                  {p.last_active && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last active: {isOnline(p) ? <span className="text-emerald-600 font-semibold">Online now</span> : new Date(p.last_active).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 border ${p.pro_verification_status === 'pending' || p.verification_status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-300' : p.is_pro || p.pro_verification_status === 'verified' ? 'bg-blue-100 text-blue-700 border-blue-300' : p.is_verified || p.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                    {p.pro_verification_status === 'pending' ? '🔵 Pro Pending' : p.verification_status === 'pending' ? '⏳ Pending' : p.is_pro || p.pro_verification_status === 'verified' ? '🔵 Pro' : p.is_verified || p.verification_status === 'verified' ? '✅ Verified' : '❌ Not Verified'}
                  </span>
                  {isOnline(p) && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-300">
                      🟢 Online
                    </span>
                  )}
                </div>
              </div>

              {/* Pending requests — show documents + approve/reject */}
              {activeTab === 'requests' && (
                <>
                  {p.pro_verification_status === 'pending' ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="sm:col-span-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-xs font-semibold text-blue-700 mb-1">Business name</p>
                          <p className="text-sm font-semibold">{p.business_name || '-'}</p>
                          <p className="text-xs font-semibold text-blue-700 mt-3 mb-1">Tax ID</p>
                          <p className="text-sm">{p.business_tax_id || '-'}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">🏢 Business License</p>
                          {p.business_license_url ? (
                            <img src={p.business_license_url} alt="Business License" onClick={() => setLightboxSrc(p.business_license_url)} className="w-full rounded-xl border border-border object-cover max-h-52 hover:opacity-90 transition-opacity cursor-zoom-in" />
                          ) : (
                            <div className="bg-muted rounded-xl h-32 flex items-center justify-center text-muted-foreground text-sm">No business license uploaded</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => approvePro(p)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                          <Check size={15} /> Approve Pro
                        </button>
                        <button
                          onClick={() => rejectPro(p)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-destructive text-destructive-foreground py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                          <X size={15} /> Reject Pro
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">🪪 ID Document</p>
                          {p.id_document_url ? (
                            <img src={p.id_document_url} alt="ID" onClick={() => setLightboxSrc(p.id_document_url)} className="w-full rounded-xl border border-border object-cover max-h-52 hover:opacity-90 transition-opacity cursor-zoom-in" />
                          ) : (
                            <div className="bg-muted rounded-xl h-32 flex items-center justify-center text-muted-foreground text-sm">No document uploaded</div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">🤳 Selfie with ID</p>
                          {p.selfie_url ? (
                            <img src={p.selfie_url} alt="Selfie" onClick={() => setLightboxSrc(p.selfie_url)} className="w-full rounded-xl border border-border object-cover max-h-52 hover:opacity-90 transition-opacity cursor-zoom-in" />
                          ) : (
                            <div className="bg-muted rounded-xl h-32 flex items-center justify-center text-muted-foreground text-sm">No selfie uploaded</div>
                          )}
                        </div>
                      </div>

                      {p.verification_reject_reason && (
                        <div className="mb-4 p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                          <p className="text-xs font-semibold text-destructive mb-1">Previous rejection reason:</p>
                          <p className="text-sm">{p.verification_reject_reason}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => { setApprovingProfile(p); setExpiryDate(''); }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                          <Check size={15} /> Approve
                        </button>
                        <button
                          onClick={() => { setRejectingProfile(p); setRejectReason(''); }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-destructive text-destructive-foreground py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                          <X size={15} /> Reject
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Verified users — show expiry + reset password */}
              {activeTab === 'verified' && (
                <div className="pt-3 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-muted-foreground">{p.user_email}</p>
                    {p.is_pro && <p className="text-xs text-blue-700 font-semibold mt-1">Business: {p.business_name || '-'}</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {!p.is_pro && (
                      <button
                        onClick={() => quickApprovePro(p)}
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Check size={14} /> Quick Pass Pro
                      </button>
                    )}
                    <button
                      onClick={() => resetPassword(p)}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <KeyRound size={14} /> Reset Password
                    </button>
                  </div>
                </div>
              )}

              {/* Not verified users — quick approve + reset password */}
              {activeTab === 'not_verified' && (
                <div className="pt-3 border-t border-border">
                  {p.verification_reject_reason && (
                    <div className="mb-3 p-3 bg-muted rounded-xl">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Last rejection reason:</p>
                      <p className="text-sm">{p.verification_reject_reason}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold">{p.first_name} {p.last_name}</p>
                      <p className="text-xs text-muted-foreground">{p.user_email}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => quickApprove(p)}
                        className="flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Check size={14} /> Quick Approve
                      </button>
                      <button
                        onClick={() => quickApprovePro(p)}
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Check size={14} /> Quick Pass Pro
                      </button>
                      <button
                        onClick={() => resetPassword(p)}
                        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        <KeyRound size={14} /> Reset PW
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      {/* Approve modal with expiry date */}
      {approvingProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setApprovingProfile(null)}>
          <div className="bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 border border-border shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-1">Approve Verification</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {approvingProfile.first_name} {approvingProfile.last_name} — {approvingProfile.user_email}
            </p>
            <label className="block text-sm font-semibold mb-2">Document Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary mb-4"
            />
            <p className="text-xs text-muted-foreground mb-4">Set the expiry date from the user's ID document. Leave empty if not applicable.</p>
            <div className="flex gap-2">
              <button onClick={() => setApprovingProfile(null)} className="flex-1 border border-border py-2.5 rounded-xl text-sm font-semibold hover:bg-muted">Cancel</button>
              <button
                onClick={() => approve(approvingProfile, expiryDate)}
                className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:opacity-90"
              >
                ✅ Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal with reason */}
      {rejectingProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setRejectingProfile(null)}>
          <div className="bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 border border-border shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-1">Reject Verification</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {rejectingProfile.first_name} {rejectingProfile.last_name} — {rejectingProfile.user_email}
            </p>
            <label className="block text-sm font-semibold mb-2">Rejection Reason</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Explain why the documents were rejected so the user can fix and resubmit..."
              rows={4}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setRejectingProfile(null)} className="flex-1 border border-border py-2.5 rounded-xl text-sm font-semibold hover:bg-muted">Cancel</button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) {
                    toast.error('Please provide a rejection reason');
                    return;
                  }
                  reject(rejectingProfile, rejectReason);
                }}
                className="flex-1 bg-destructive text-destructive-foreground py-2.5 rounded-xl text-sm font-bold hover:opacity-90"
              >
                ❌ Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}