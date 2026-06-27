import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import MobileSelect from '../components/MobileSelect';
import StarRating from '../components/StarRating';
import TrustBadge from '../components/TrustBadge';
import ListingCard from '../components/ListingCard';
import PostCard from '../components/PostCard';
import { MapPin, Calendar, Camera, Shield, Trash2, MessageCircle, KeyRound, BadgeCheck, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import VerificationModal from '../components/VerificationModal';
import ProVerificationModal from '../components/ProVerificationModal';
import ReviewSection from '../components/ReviewSection';
import ImageLightbox from '../components/ImageLightbox';

export default function Profile() {
  const { id } = useParams();
  const outletContext = useOutletContext();
  const { profile: myProfile, currentUser, t, lang, refreshProfile } = outletContext || {};
  const [viewProfile, setViewProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showVerModal, setShowVerModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoLightbox, setPhotoLightbox] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const photoUploadRef = useRef(null);

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
    if (currentUser) {
      loadProfile();
    }
  }, [id, currentUser]);

  const loadProfile = async () => {
    if (!currentUser) return;
    const data = await base44.entities.UserProfile.filter({ id });
    if (data[0]) {
      setViewProfile(data[0]);
      setEditData({
        first_name: data[0].first_name,
        last_name: data[0].last_name,
        bio: lang === 'lo' ? data[0].bio_lao || data[0].bio : data[0].bio,
        location: data[0].location || '',
        gender: data[0].gender || ''
      });
      base44.entities.Post.filter({ author_email: data[0].user_email }, '-created_date', 20).then(setPosts);
      base44.entities.Listing.filter({ host_email: data[0].user_email }).then(setListings);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.UserProfile.update(viewProfile.id, { photo_url: file_url });
      
      // Optimistic update for immediate smoothness
      setViewProfile(prev => ({ ...prev, photo_url: file_url }));
      
      loadProfile();
      refreshProfile();
      toast.success(lang === 'lo' ? 'ອັບເດດຮູບແລ້ວ ✅' : 'Photo updated ✅');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const saveEdit = async () => {
    // Prevent undefined values which crash Firestore
    const safeData = {
      first_name: editData.first_name || '',
      last_name: editData.last_name || '',
      bio: editData.bio || '',
      bio_lao: editData.bio || '',
      location: editData.location || '',
      gender: editData.gender || '',
    };

    // Optimistic: update local state immediately
    const optimisticProfile = {
      ...viewProfile,
      ...safeData,
    };
    setViewProfile(optimisticProfile);
    setEditing(false);

    try {
      // Persist in background
      await base44.entities.UserProfile.update(viewProfile.id, safeData);
      toast.success(t.profileSaved);
      refreshProfile();
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Failed to save. Please try again.');
      // Revert optimistic update
      loadProfile();
    }
  };

  if (!currentUser) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <p className="text-muted-foreground mb-2">Please sign in to view profiles</p>
        <button onClick={() => base44.auth.redirectToLogin()} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-semibold">Sign In</button>
      </div>
    </div>
  );

  if (!viewProfile) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );


  return (
    <div className="max-w-4xl mx-auto pb-8 pt-4 px-4 sm:px-6">
      {/* Premium Cover & Info Card */}
      <div className="mx-auto max-w-2xl rounded-[32px] border border-border bg-card shadow-lg overflow-hidden">
        {/* Gradient Banner */}
        <div className="h-32 sm:h-40 bg-gradient-to-br from-primary/80 via-primary to-primary/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
        </div>

        {/* Content Section */}
        <div className="px-6 sm:px-10 pb-10 text-center relative -mt-16 sm:-mt-20">
          <div className="relative inline-block group">
            <img
              src={viewProfile.photo_url || viewProfile.avatar_url || ''}
              alt=""
              onClick={() => !isUploading && setPhotoLightbox(viewProfile.photo_url || viewProfile.avatar_url || '')}
              className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[6px] border-card shadow-xl object-cover relative z-10 bg-muted transition-transform duration-300 ${isUploading ? 'opacity-50' : 'cursor-pointer hover:scale-[1.02]'}`} />
            
            {isUploading && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-[2px] border-[6px] border-card">
                 <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}

            {viewProfile.is_verified &&
              <span className="absolute bottom-3 right-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-emerald-500 border-4 border-card text-white text-sm sm:text-base font-bold z-20 shadow-md">✓</span>
            }
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-4 text-foreground">{viewProfile.first_name} {viewProfile.last_name}</h1>
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <StarRating rating={viewProfile.trust_stars || 0} size={20} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground font-medium">
            {viewProfile.location &&
            <span className="flex items-center gap-1.5 bg-muted/50 px-4 py-1.5 rounded-full border border-border/50"><MapPin size={15} className="text-primary" /> {viewProfile.location}</span>
            }
            <span className="flex items-center gap-1.5 bg-muted/50 px-4 py-1.5 rounded-full border border-border/50"><Calendar size={15} className="text-primary" /> {t.joined} {new Date(viewProfile.created_date).getFullYear()}</span>
          </div>

          <div className="mt-5 flex justify-center gap-3 flex-wrap">
            {viewProfile.is_pro ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-1.5 text-sm font-bold border border-blue-500/20 shadow-sm">
                <BadgeCheck size={16} /> Pro
              </span>
            ) : viewProfile.is_verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 text-sm font-bold border border-emerald-500/20 shadow-sm">
                <Shield size={16} /> Verified
              </span>
            ) : null}
            <TrustBadge stars={viewProfile.trust_stars || 0} lang={lang} />
          </div>

          <p className="text-base text-foreground/80 mt-6 font-medium tracking-wide max-w-lg mx-auto leading-relaxed">
            {lang === 'lo' ? viewProfile.bio_lao || viewProfile.bio : viewProfile.bio}
          </p>

          <div className="mt-8 border-t border-border/50 pt-8">
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="text-center group cursor-default">
                <p className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">{(viewProfile.friends || []).length}</p>
                <p className="mt-2 text-xs font-semibold tracking-widest uppercase text-muted-foreground">{lang === 'lo' ? 'ຜູ້ຕິດຕາມ' : 'Follower'}</p>
              </div>
              <div className="text-center group cursor-default">
                <p className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">{posts.filter((post) => post.author_email === viewProfile.user_email && post.service_price > 0).length}</p>
                <p className="mt-2 text-xs font-semibold tracking-widest uppercase text-muted-foreground">{lang === 'lo' ? 'ໃຫ້ບໍລິການ' : 'Service'}</p>
              </div>
              <div className="text-center group cursor-default flex flex-col justify-center">
                <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground capitalize mt-2 group-hover:text-primary transition-colors">{viewProfile.gender || '-'}</p>
                <p className="mt-3 text-xs font-semibold tracking-widest uppercase text-muted-foreground">{lang === 'lo' ? 'ເພດ' : 'Gender'}</p>
              </div>
            </div>
          </div>

          {isOwn &&
          <div className="flex gap-3 justify-center mt-10 flex-wrap">
              <button onClick={() => setEditing(!editing)} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:scale-[1.02] transition-all select-none shadow-primary/20">
                <BadgeCheck size={16} /> {t.editProfile}
              </button>
              <button type="button" disabled={isUploading} onClick={() => photoUploadRef.current?.click()} className="flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary hover:text-primary-foreground transition-all select-none border border-primary/20 disabled:opacity-50 disabled:pointer-events-none">
                <Camera size={16} className={isUploading ? "animate-pulse" : ""} /> {isUploading ? (lang === 'lo' ? 'ກຳລັງອັບໂຫຼດ...' : 'Uploading...') : (lang === 'lo' ? 'ຮູບ' : 'Photo')}
              </button>
              <input ref={photoUploadRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <button onClick={() => navigate(`/profile/${viewProfile.id}/password`)} className="flex items-center gap-2 border border-border bg-card px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-all select-none shadow-sm">
                <KeyRound size={16} className="text-muted-foreground" /> {lang === 'lo' ? 'ລະຫັດຜ່ານ' : 'Password'}
              </button>
              <button onClick={() => base44.auth.logout()} className="flex items-center gap-2 border border-border bg-card px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-all select-none shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                {lang === 'lo' ? 'ອອກລະບົບ' : 'Logout'}
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 border border-destructive/20 text-destructive bg-destructive/5 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-destructive hover:text-destructive-foreground transition-all select-none mt-2 sm:mt-0 w-full sm:w-auto justify-center">
                <Trash2 size={16} /> {lang === 'lo' ? 'ລຶບບັນຊີ' : 'Delete Account'}
              </button>
            </div>
          }
        </div>
      </div>

      {/* Edit panel */}
      {isOwn && editing &&
      <div className="mx-6 mt-4 bg-card rounded-xl p-5 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold">{lang === 'lo' ? 'ຊື່' : 'First Name'}</label>
              <input value={editData.first_name || ''} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold">{lang === 'lo' ? 'ນາມສະກຸນ' : 'Last Name'}</label>
              <input value={editData.last_name || ''} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold">Bio</label>
            <textarea value={editData.bio || ''} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold">{lang === 'lo' ? 'ສະຖານທີ່' : 'Location'}</label>
            <input value={editData.location || ''} onChange={(e) => setEditData({ ...editData, location: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
          </div>
          <div>
            <label className="text-xs font-semibold">{lang === 'lo' ? 'ເພດ' : 'Gender'}</label>
            <MobileSelect
              value={editData.gender || ''}
              onChange={(v) => setEditData({ ...editData, gender: v })}
              options={[
                { value: '', label: lang === 'lo' ? 'ເລືອກເພດ' : 'Select gender' },
                { value: 'male', label: lang === 'lo' ? 'ຊາຍ' : 'Male' },
                { value: 'female', label: lang === 'lo' ? 'ຍິງ' : 'Female' },
                { value: 'other', label: lang === 'lo' ? 'ອື່ນໆ' : 'Other' },
              ]}
              placeholder={lang === 'lo' ? 'ເລືອກເພດ' : 'Select gender'}
              label={lang === 'lo' ? 'ເພດ' : 'Gender'}
            />
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
          <button onClick={() => setShowVerModal(true)} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg text-sm font-semibold active:opacity-80 min-h-[48px]">
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

      {isOwn && viewProfile.is_verified && !viewProfile.is_pro && viewProfile.pro_verification_status !== 'pending' && (
        <div className="mx-6 mt-4 bg-blue-50 rounded-xl p-5 shadow-sm border border-blue-100">
          <h3 className="font-semibold flex items-center gap-2"><Building2 size={18} /> {lang === 'lo' ? 'ສະໝັກ Pro' : 'Apply for Pro'}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            {lang === 'lo' ? 'ຜ່ານການຢືນຢັນສ່ວນຕົວກ່ອນ ແລ້ວຈຶ່ງສາມາດສະໝັກ Pro ເພື່ອລົງໂພສທຸລະກິດໄດ້' : 'Pass personal verification first, then apply for Pro to post business listings.'}
          </p>
          <button onClick={() => setShowProModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-semibold active:opacity-80 min-h-[48px]">
            {lang === 'lo' ? 'ສະໝັກ Pro' : 'Apply Pro'}
          </button>
        </div>
      )}

      {isOwn && viewProfile.pro_verification_status === 'pending' && (
        <div className="mx-6 mt-4 bg-blue-50 rounded-xl p-5 border border-blue-100">
          <h3 className="font-semibold text-blue-700">⏳ {lang === 'lo' ? 'Pro ກຳລັງກວດສອບ' : 'Pro verification pending'}</h3>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'lo' ? 'ກຳລັງກວດເອກະສານທຸລະກິດຂອງທ່ານ' : 'We are reviewing your business documents.'}</p>
        </div>
      )}

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

      {showProModal && (
        <ProVerificationModal
          profile={viewProfile}
          lang={lang}
          onClose={() => setShowProModal(false)}
          onSubmitted={() => {
            setShowProModal(false);
            loadProfile();
            refreshProfile();
          }}
        />
      )}

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
      <ImageLightbox src={photoLightbox} onClose={() => setPhotoLightbox(null)} />

      {showDeleteConfirm &&
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }} onTouchEnd={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}>
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