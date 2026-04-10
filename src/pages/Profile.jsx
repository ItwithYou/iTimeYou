import { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import StarRating from '../components/StarRating';
import TrustBadge from '../components/TrustBadge';
import VerificationBadge from '../components/VerificationBadge';
import ListingCard from '../components/ListingCard';
import PostCard from '../components/PostCard';
import { MapPin, Calendar, Users, Home, Camera, Shield, Trash2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import VerificationModal from '../components/VerificationModal';
import ReviewSection from '../components/ReviewSection';

export default function Profile() {
  const { id } = useParams();
  const { profile: myProfile, currentUser, t, lang, refreshProfile } = useOutletContext();
  const [viewProfile, setViewProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showVerModal, setShowVerModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwn = viewProfile?.user_email === currentUser?.email;
  const navigate = useNavigate();

  const startChat = async () => {
    const existing = await base44.entities.Conversation.list('-updated_date', 50);
    const found = existing.find((c) =>
    c.participants?.includes(currentUser.email) && c.participants?.includes(viewProfile.user_email)
    );
    let convId;
    if (found) {
      convId = found.id;
    } else {
      const conv = await base44.entities.Conversation.create({
        participants: [currentUser.email, viewProfile.user_email],
        last_message: ''
      });
      convId = conv.id;
    }
    navigate(`/messages?conv=${convId}`);
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    const data = await base44.entities.UserProfile.filter({ id });
    if (data[0]) {
      setViewProfile(data[0]);
      setEditData({
        first_name: data[0].first_name,
        last_name: data[0].last_name,
        bio: lang === 'lo' ? data[0].bio_lao || data[0].bio : data[0].bio,
        location: data[0].location || ''
      });
      base44.entities.Post.filter({ author_email: data[0].user_email }, '-created_date', 20).then(setPosts);
      base44.entities.Listing.filter({ host_email: data[0].user_email }).then(setListings);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.UserProfile.update(viewProfile.id, { photo_url: file_url });
    loadProfile();
    refreshProfile();
    toast.success(lang === 'lo' ? 'ອັບເດດຮູບແລ້ວ ✅' : 'Photo updated ✅');
  };

  const saveEdit = async () => {
    await base44.entities.UserProfile.update(viewProfile.id, {
      first_name: editData.first_name,
      last_name: editData.last_name,
      bio: editData.bio,
      bio_lao: editData.bio,
      location: editData.location
    });
    setEditing(false);
    loadProfile();
    refreshProfile();
    toast.success(t.profileSaved);
  };

  if (!viewProfile) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>);


  return (
    <div className="max-w-3xl mx-auto pb-8">
      {/* Cover */}
      <div className="h-44 bg-gradient-to-r from-primary to-secondary relative rounded-b-3xl">
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <img
            src={viewProfile.photo_url || viewProfile.avatar_url || ''}
            alt=""
            className="w-24 h-24 rounded-full border-4 border-card shadow-lg object-cover" />
          
        </div>
      </div>

      {/* Info */}
      <div className="pt-16 pb-4 px-6 bg-card text-center">
        <h1 className="text-2xl font-bold tracking-tight">{viewProfile.first_name} {viewProfile.last_name}</h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <StarRating rating={viewProfile.trust_stars || 0} size={18} />
        </div>
        <div className="mt-1">
          <TrustBadge stars={viewProfile.trust_stars || 0} lang={lang} />
        </div>
        <div className="mt-2">
          <VerificationBadge status={viewProfile.is_verified ? 'verified' : viewProfile.verification_status} t={t} />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
          {viewProfile.location &&
          <span className="flex items-center gap-1"><MapPin size={14} /> {viewProfile.location}</span>
          }
          <span className="flex items-center gap-1"><Calendar size={14} /> {t.joined} {new Date(viewProfile.created_date).getFullYear()}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5 max-w-md mx-auto">
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-center">
            <p className="text-2xl font-black tracking-tight text-foreground">{(viewProfile.friends || []).length}</p>
            <p className="text-xs font-medium text-muted-foreground">{lang === 'lo' ? 'ຜູ້ຕິດຕາມ' : 'Followers'}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-center">
            <p className="text-2xl font-black tracking-tight text-primary">{posts.length}</p>
            <p className="text-xs font-medium text-muted-foreground">{lang === 'lo' ? 'ໃຫ້ບໍລິການ' : 'Provide Service'}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-center">
            <p className="text-2xl font-black tracking-tight text-primary">{viewProfile.wallet_balance || 0}</p>
            <p className="text-xs font-medium text-muted-foreground">{lang === 'lo' ? 'ໃຊ້ບໍລິການ' : 'Use Service'}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3 font-medium tracking-wide">
          {lang === 'lo' ? viewProfile.bio_lao || viewProfile.bio : viewProfile.bio}
        </p>

        {isOwn &&
        <div className="flex gap-2 justify-center mt-4 flex-wrap">
            <button onClick={() => setEditing(!editing)} className="border border-border px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-muted transition-colors select-none">
              ✏️ {t.editProfile}
            </button>
            <label className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90 select-none">
              <Camera size={14} className="inline mr-1" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            <button onClick={() => base44.auth.logout()} className="px-4 py-1.5 text-sm font-semibold rounded-2xl flex items-center gap-1.5 border border-border hover:bg-muted transition-colors select-none">
              🚪 {lang === 'lo' ? 'ອອກຈາກລະບົບ' : 'Logout'}
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 border border-destructive/50 text-destructive px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-destructive/5 transition-colors select-none">
              <Trash2 size={13} /> {lang === 'lo' ? 'ລຶບບັນຊີ' : 'Delete Account'}
            </button>
          </div>
        }
      </div>

      {/* Edit panel */}
      {isOwn && editing &&
      <div className="mx-6 mt-4 bg-card rounded-xl p-5 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold">{lang === 'lo' ? 'ຊື່' : 'First Name'}</label>
              <input value={editData.first_name} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-semibold">{lang === 'lo' ? 'ນາມສະກຸນ' : 'Last Name'}</label>
              <input value={editData.last_name} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold">Bio</label>
            <textarea value={editData.bio} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold">{lang === 'lo' ? 'ສະຖານທີ່' : 'Location'}</label>
            <input value={editData.location} onChange={(e) => setEditData({ ...editData, location: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <button onClick={saveEdit} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:opacity-90">
            💾 {t.saveChanges}
          </button>
        </div>
      }

      {/* Verification */}
      {isOwn && !viewProfile.is_verified && viewProfile.verification_status !== 'pending' &&
      <div className="mx-6 mt-4 bg-card rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold flex items-center gap-2"><Shield size={18} /> {lang === 'lo' ? 'ການຢືນຢັນບັນຊີ' : 'Account Verification'}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-3">{t.verFeats}</p>
          <button onClick={() => setShowVerModal(true)} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
            {t.verifyNow}
          </button>
        </div>
      }

      {isOwn && viewProfile.verification_status === 'pending' &&
      <div className="mx-6 mt-4 bg-amber-50 rounded-xl p-5">
          <h3 className="font-semibold">⏳ {t.verPending}</h3>
          <p className="text-sm text-muted-foreground mt-1">We're reviewing your documents — usually 1-2 business days.</p>
        </div>
      }

      {/* Message button for other users */}
      {!isOwn && currentUser &&
      <div className="flex justify-center mt-4 px-6">
          <button
          onClick={startChat}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
          
            <MessageCircle size={15} />
            {lang === 'lo' ? 'ສົ່ງຂໍ້ຄວາມ' : 'Send Message'}
          </button>
        </div>
      }

      {/* Review section (rate other users) */}
      {!isOwn && currentUser &&
      <ReviewSection targetProfile={viewProfile} currentUser={currentUser} t={t} lang={lang} onReviewSubmitted={loadProfile} />
      }

      {/* Tabs */}
      <div className="flex border-b border-border mx-6 mt-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-3 text-sm font-semibold relative ${activeTab === 'posts' ? 'text-primary' : 'text-muted-foreground'}`}>
          
          {t.posts} ({posts.length})
          {activeTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-3 text-sm font-semibold relative ${activeTab === 'listings' ? 'text-primary' : 'text-muted-foreground'}`}>
          
          {t.listings} ({listings.length})
          {activeTab === 'listings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      <div className="px-6 pt-4">
        {activeTab === 'posts' &&
        <div className="space-y-4">
            {posts.map((p) =>
          <PostCard key={p.id} post={p} currentUserEmail={currentUser?.email} t={t} lang={lang} />
          )}
            {posts.length === 0 &&
          <p className="text-center py-8 text-muted-foreground">{t.noPosts}</p>
          }
          </div>
        }
        {activeTab === 'listings' && (
        listings.length > 0 ?
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {listings.map((l) => <ListingCard key={l.id} listing={l} t={t} lang={lang} />)}
            </div> :

        <p className="text-center py-8 text-muted-foreground">{t.noListings}</p>)

        }
      </div>

      {showVerModal &&
      <VerificationModal
        profile={viewProfile}
        t={t}
        lang={lang}
        onClose={() => setShowVerModal(false)}
        onSubmitted={() => {setShowVerModal(false);loadProfile();refreshProfile();}} />

      }

      {currentUser?.role === 'admin' && !isOwn && viewProfile.verification_status === 'pending' &&
      <div className="mx-6 mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-1 flex items-center gap-2">⏳ Pending Verification</h3>
          <p className="text-xs text-muted-foreground mb-3">{viewProfile.verification_name && `ID Name: ${viewProfile.verification_name}`} {viewProfile.verification_dob && `· DOB: ${viewProfile.verification_dob}`}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {viewProfile.id_document_url &&
          <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">🪪 ID Document</p>
                <img src={viewProfile.id_document_url} alt="ID" className="w-full rounded-xl border border-border object-cover max-h-40 cursor-zoom-in" onClick={() => window.open(viewProfile.id_document_url, '_blank')} />
              </div>
          }
            {viewProfile.selfie_url &&
          <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">🤳 Selfie with ID</p>
                <img src={viewProfile.selfie_url} alt="Selfie" className="w-full rounded-xl border border-border object-cover max-h-40 cursor-zoom-in" onClick={() => window.open(viewProfile.selfie_url, '_blank')} />
              </div>
          }
            {viewProfile.face_selfie_url &&
          <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">📸 Face Check Selfie</p>
                <img src={viewProfile.face_selfie_url} alt="Face selfie" className="w-full rounded-xl border border-border object-cover max-h-40 cursor-zoom-in" onClick={() => window.open(viewProfile.face_selfie_url, '_blank')} />
              </div>
          }
          </div>
          <div className="flex gap-3">
            <button
            onClick={async () => {
              await base44.entities.UserProfile.update(viewProfile.id, { verification_status: 'verified', is_verified: true });
              await base44.entities.Notification.create({ user_email: viewProfile.user_email, type: '✅', text: 'Your identity has been verified! You can now use all features.', text_lao: 'ຕົວຕົນຂອງທ່ານໄດ້ຖືກຢືນຢັນແລ້ວ!' });
              toast.success('Approved ✅');loadProfile();
            }}
            className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
            ✅ Approve</button>
            <button
            onClick={async () => {
              await base44.entities.UserProfile.update(viewProfile.id, { verification_status: 'rejected', is_verified: false });
              await base44.entities.Notification.create({ user_email: viewProfile.user_email, type: '❌', text: 'Your identity verification was rejected. Please resubmit with clearer documents.', text_lao: 'ການຢືນຢັນຕົວຕົນຂອງທ່ານຖືກປະຕິເສດ.' });
              toast.success('Rejected');loadProfile();
            }}
            className="flex-1 bg-destructive text-destructive-foreground py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
            ❌ Reject</button>
          </div>
        </div>
      }

      {currentUser?.role === 'admin' && !isOwn &&
      <div className="mx-6 mt-4 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-2">Admin verification controls</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Review this user's verification details and approve or reject from the admin panel.
          </p>
          <button
          onClick={() => navigate('/admin/verification')}
          className="w-full sm:w-auto bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          
            Open verification approvals
          </button>
        </div>
      }

      {/* Delete Account Confirmation Dialog */}
      {showDeleteConfirm &&
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 shadow-xl border border-border">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">⚠️</div>
              <h3 className="font-bold text-base">{lang === 'lo' ? 'ລຶບບັນຊີຂອງທ່ານ?' : 'Delete your account?'}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {lang === 'lo' ? 'ການດຳເນີນການນີ້ບໍ່ສາມາດຍ້ອນຄືນໄດ້. ຂໍ້ມູນທັງໝົດຈະຖືກລຶບ.' : 'This action cannot be undone. All your data will be permanently deleted.'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
              onClick={async () => {
                await base44.entities.UserProfile.delete(viewProfile.id);
                base44.auth.logout();
              }}
              className="w-full bg-destructive text-destructive-foreground py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity select-none">
              
                {lang === 'lo' ? 'ຢືນຢັນການລຶບ' : 'Yes, Delete My Account'}
              </button>
              <button
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full border border-border py-3 rounded-xl font-semibold text-sm hover:bg-muted transition-colors select-none">
              
                {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}