import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Check, X, Eye } from 'lucide-react';
import ImageLightbox from '../components/ImageLightbox';

export default function AdminVerification() {
  const { currentUser, lang } = useOutletContext();
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bottomProfile, setBottomProfile] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    loadPending();
  }, [currentUser]);

  const loadPending = async () => {
    setLoading(true);
    const data = await base44.entities.UserProfile.filter({ verification_status: 'pending' }, '-created_date', 50);
    setProfiles(data);
    setLoading(false);
  };

  const approve = async (profile) => {
    await base44.entities.UserProfile.update(profile.id, {
      verification_status: 'verified',
      is_verified: true,
    });
    await base44.entities.Notification.create({
      user_email: profile.user_email,
      type: '✅',
      text: 'Your identity has been verified! You can now use all features.',
      text_lao: 'ຕົວຕົນຂອງທ່ານໄດ້ຖືກຢືນຢັນແລ້ວ! ທ່ານສາມາດໃຊ້ທຸກຟັງຊັ່ນໄດ້ແລ້ວ.',
    });
    toast.success('Profile approved ✅');
    setSelected(null);
    loadPending();
  };

  const reject = async (profile) => {
    await base44.entities.UserProfile.update(profile.id, {
      verification_status: 'rejected',
      is_verified: false,
    });
    await base44.entities.Notification.create({
      user_email: profile.user_email,
      type: '❌',
      text: 'Your identity verification was rejected. Please resubmit with clearer documents.',
      text_lao: 'ການຢືນຢັນຕົວຕົນຂອງທ່ານຖືກປະຕິເສດ. ກະລຸນາສົ່ງໃໝ່ດ້ວຍເອກະສານທີ່ຊັດເຈນກວ່າ.',
    });
    toast.success('Profile rejected');
    setSelected(null);
    loadPending();
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Verification Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{profiles.length} pending review</p>
        </div>
        <button onClick={loadPending} className="border border-border px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-semibold">No pending verifications</p>
        </div>
      ) : (
        <div className="space-y-6">
          {profiles.map(p => (
            <div key={p.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={p.photo_url || p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_email}`}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2 border-border"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">{p.first_name} {p.last_name}</h3>
                  <p className="text-xs text-muted-foreground">{p.user_email}</p>
                  {p.verification_name && <p className="text-xs text-muted-foreground">ID Name: <span className="font-semibold text-foreground">{p.verification_name}</span></p>}
                  {p.verification_dob && <p className="text-xs text-muted-foreground">Date of Birth: <span className="font-semibold text-foreground">{p.verification_dob}</span></p>}
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2.5 py-1 rounded-full font-semibold flex-shrink-0">⏳ Pending</span>
              </div>

              {/* Documents */}
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

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => approve(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  <Check size={15} /> Approve
                </button>
                <button
                  onClick={() => reject(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-destructive text-destructive-foreground py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  <X size={15} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      {/* Sticky bottom action bar */}
      {selected && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl px-4 py-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{selected.first_name} {selected.last_name}</p>
            <p className="text-xs text-muted-foreground truncate">{selected.user_email}</p>
          </div>
          <button
            onClick={() => { approve(selected); setSelected(null); setBottomProfile(null); }}
            className="flex items-center gap-1.5 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Check size={15} /> Approve
          </button>
          <button
            onClick={() => { reject(selected); setSelected(null); setBottomProfile(null); }}
            className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <X size={15} /> Reject
          </button>
        </div>
      )}
    </div>
  );
}