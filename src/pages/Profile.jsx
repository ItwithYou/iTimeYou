import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import MobileSelect from '../components/MobileSelect';
import StarRating from '../components/StarRating';
import TrustBadge from '../components/TrustBadge';
import VerificationBadge from '../components/VerificationBadge';
import ListingCard from '../components/ListingCard';
import PostCard from '../components/PostCard';
import { MapPin, Calendar, Users, Home, Camera, Shield, Trash2, MessageCircle, KeyRound, BadgeCheck, Building2, LogOut } from 'lucide-react';
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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
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
        gender: data[0].gender || '',
        birthdate: data[0].birthdate || ''
      });
      base44.entities.Post.filter({ author_email: data[0].user_email }, '-created_date', 20).then(setPosts);
      base44.entities.Listing.filter({ host_email: data[0].user_email }).then(setListings);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Smooth immediate UI update
    const tempUrl = URL.createObjectURL(file);
    setViewProfile(prev => ({ ...prev, photo_url: tempUrl }));
    setIsUploadingPhoto(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.UserProfile.update(viewProfile.id, { photo_url: file_url });
      loadProfile();
      refreshProfile();
      toast.success(lang === 'lo' ? 'ອັບເດດຮູບແລ້ວ ✅' : 'Photo updated ✅');
    } catch (err) {
      toast.error(lang === 'lo' ? 'ອັບໂຫຼດບໍ່ສຳເລັດ' : 'Upload failed');
    } finally {
      setIsUploadingPhoto(false);
      // Clean up object URL
      URL.revokeObjectURL(tempUrl);
    }
  };

  const saveEdit = async () => {
    const payload = {
      first_name: editData.first_name || '',
      last_name: editData.last_name || '',
      bio: editData.bio || '',
      bio_lao: editData.bio || '',
      location: editData.location || '',
      gender: editData.gender || '',
      birthdate: editData.birthdate || '',
    };
    try {
      await base44.entities.UserProfile.update(viewProfile.id, payload);
      // Keep the Firebase Auth display name in sync with the profile name.
      try { await base44.auth.updateMe({ full_name: `${payload.first_name} ${payload.last_name}`.trim() }); } catch { /* non-fatal */ }
      setViewProfile({ ...viewProfile, ...payload });
      setEditing(false);
      toast.success(t.profileSaved || 'Profile saved ✅');
      refreshProfile();
    } catch (e) {
      console.error('saveEdit failed:', e);
      toast.error(lang === 'lo' ? 'ບັນທຶກບໍ່ສຳເລັດ ລອງໃໝ່' : 'Could not save. Please try again.');
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
    <div className="max-w-3xl mx-auto pb-8">
      {/* Premium Cover */}
      <div className="h-48 sm:rounded-t-[32px] bg-gradient-to-tr from-primary/90 via-primary to-primary/50 relative overflow-hidden shadow-sm">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
      </div>

      {/* Info Card */}
      <div className="mx-4 sm:mx-8 -mt-16 bg-card rounded-[32px] px-6 sm:px-10 pb-8 pt-4 shadow-xl border border-border/50 relative z-10 backdrop-blur-sm">
        
        {/* Avatar Area Centered */}
        <div className="flex flex-col items-center -mt-20">
          <div className="relative shrink-0">
            <img
              src={viewProfile.photo_url || viewProfile.avatar_url || ''}
              alt=""
              onClick={() => setPhotoLightbox(viewProfile.photo_url || viewProfile.avatar_url || '')}
              className={`w-32 h-32 rounded-full border-[6px] border-card shadow-xl object-cover cursor-pointer hover:scale-105 transition-transform bg-muted ${isUploadingPhoto ? 'opacity-60' : ''}`} />
            
            {/* Update Photo Floating Button (Pro feeling) */}
            {isOwn && (
              <button
                type="button"
                disabled={isUploadingPhoto}
                onClick={(e) => { e.stopPropagation(); photoUploadRef.current?.click(); }}
                className="absolute bottom-1 right-1 bg-background text-foreground border border-border p-2 rounded-full shadow-lg hover:bg-muted transition-colors z-10 disabled:opacity-70"
                title={lang === 'lo' ? 'ປ່ຽນຮູບ' : 'Update Photo'}
              >
                {isUploadingPhoto ? (
                  <div className="w-4 h-4 rounded-full border-[3px] border-foreground border-t-transparent animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
            )}
            
            {/* Verification Badge */}
            {viewProfile.is_verified &&
              <span className={`absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 border-[3px] border-card text-white text-sm font-bold shadow-sm z-10 pointer-events-none`}>✓</span>
            }
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-4">{viewProfile.first_name} {viewProfile.last_name}</h1>
          
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3">
             <div className="flex items-center gap-1.5 bg-amber-100/60 text-amber-700 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
               <StarRating rating={viewProfile.trust_stars || 0} size={14} />
               <span>{viewProfile.trust_stars ? viewProfile.trust_stars.toFixed(1) : '5.0'}</span>
             </div>
             {viewProfile.is_pro ? (
               <button onClick={() => isOwn && setShowProModal(true)} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-sm font-bold border border-blue-100 shadow-sm cursor-pointer hover:bg-blue-100 transition-colors">
                 <BadgeCheck size={14} /> Pro
               </button>
             ) : viewProfile.is_verified ? (
               <button onClick={() => isOwn && setShowVerModal(true)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-sm font-bold border border-emerald-100 shadow-sm cursor-pointer hover:bg-emerald-100 transition-colors">
                 <Shield size={14} /> Verified
               </button>
             ) : isOwn ? (
               <button onClick={() => setShowVerModal(true)} className="inline-flex items-center gap-1.5 rounded-full bg-muted text-muted-foreground px-3 py-1 text-sm font-bold border border-border shadow-sm cursor-pointer hover:bg-muted/80 transition-colors">
                 <Shield size={14} /> {lang === 'lo' ? 'ຍັງບໍ່ຢືນຢັນ' : 'Unverified'}
               </button>
             ) : null}
          </div>

          {/* Action Row - Edit, Logout, Joined same line */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
             <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full font-medium border border-border/50">
               <Calendar size={14} className="text-primary/70" /> Joined {new Date(viewProfile.created_date).getFullYear()}
             </span>
             {isOwn && (
               <>
                 <button onClick={() => setEditing(!editing)} className="flex items-center gap-1.5 text-xs bg-foreground text-background px-4 py-1.5 rounded-full font-bold shadow-sm hover:opacity-90 transition-opacity">
                   {t.editProfile || 'Edit Profile'}
                 </button>
                 <button onClick={() => base44.auth.logout()} className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 border border-red-100 px-4 py-1.5 rounded-full font-bold shadow-sm hover:bg-red-100 transition-colors">
                   <LogOut size={14} /> {lang === 'lo' ? 'ອອກຈາກລະບົບ' : 'Logout'}
                 </button>
                 <input ref={photoUploadRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
               </>
             )}
          </div>
          
          <p className="text-base text-foreground/80 mt-5 font-medium leading-relaxed max-w-2xl text-center">
            {lang === 'lo' ? viewProfile.bio_lao || viewProfile.bio : viewProfile.bio}
          </p>
        </div>

        {/* Premium Glass Stats Box */}
        <div className="mt-6 mx-auto max-w-xl bg-gradient-to-br from-card/60 to-muted/30 backdrop-blur-md border border-border/60 rounded-3xl p-5 shadow-sm flex flex-wrap items-center justify-between sm:justify-around gap-4 text-center">
            <div className="flex flex-col items-center gap-1 min-w-[70px]">
              <p className="text-xl font-black text-foreground">{(viewProfile.friends || []).length}</p>
              <p className="text-xs font-bold text-muted-foreground">{lang === 'lo' ? 'ຜູ້ຕິດຕາມ' : 'Followers'}</p>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[70px]">
              <p className="text-xl font-black text-foreground">{posts.filter((post) => post.author_email === viewProfile.user_email && post.service_price > 0).length}</p>
              <p className="text-xs font-bold text-muted-foreground">{lang === 'lo' ? 'ບໍລິການ' : 'Services'}</p>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[70px]">
              <p className="text-xl font-black text-foreground capitalize">{viewProfile.gender || '-'}</p>
              <p className="text-xs font-bold text-muted-foreground">{lang === 'lo' ? 'ເພດ' : 'Gender'}</p>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[70px]">
              <p className="text-xl font-black text-foreground">{viewProfile.birthdate ? new Date(viewProfile.birthdate).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { day: 'numeric', month: 'short' }) : '-'}</p>
              <p className="text-xs font-bold text-muted-foreground">{lang === 'lo' ? 'ວັນເກີດ' : 'Birthday'}</p>
            </div>
        </div>
      </div>

      {/* Edit panel */}
      {isOwn && editing &&
      <div className="mx-6 mt-4 bg-card rounded-xl p-5 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold">{lang === 'lo' ? 'ຊື່' : 'First Name'}</label>
              <input value={editData.first_name} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-semibold">{lang === 'lo' ? 'ນາມສະກຸນ' : 'Last Name'}</label>
              <input value={editData.last_name} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold">Bio</label>
            <textarea value={editData.bio} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold">{lang === 'lo' ? 'ສະຖານທີ່' : 'Location'}</label>
            <input value={editData.location} onChange={(e) => setEditData({ ...editData, location: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div>
              <label className="text-xs font-semibold">{lang === 'lo' ? 'ວັນເກີດ' : 'Birthdate'}</label>
              <input type="date" value={editData.birthdate || ''} onChange={(e) => setEditData({ ...editData, birthdate: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
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