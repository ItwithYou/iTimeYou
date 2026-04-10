import { useState, useRef } from 'react';
import { Star, MapPin, Heart, MoreHorizontal, Pencil, Trash2, Check, X, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CAT_ICONS } from '../hooks/useLang';
import ImageLightbox from './ImageLightbox';
import useProfile from '../hooks/useProfile';

export default function ListingCard({ listing, t, lang }) {
  const { currentUser } = useProfile();
  const [saved, setSaved] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(listing.title || '');
  const [editDescription, setEditDescription] = useState(listing.description || '');
  const [editImageUrl, setEditImageUrl] = useState(listing.image_url || '');
  const [editImageFile, setEditImageFile] = useState(null);
  const editImageInputRef = useRef(null);
  const catIndex = ['culture', 'stay', 'food', 'experience', 'home', 'nature'].indexOf(listing.category);
  const catLabel = t.categories[catIndex] || listing.category;
  const icon = CAT_ICONS[listing.category] || '📌';
  const isAdmin = currentUser?.role === 'admin';
  const displayImageUrl = editImageFile ? URL.createObjectURL(editImageFile) : (editImageUrl || listing.image_url || '');
  const safeDisplayImageUrl = displayImageUrl?.trim();

  const handleDelete = async () => {
    if (!window.confirm(lang === 'lo' ? 'ລຶບລາຍການນີ້?' : 'Delete this listing?')) return;
    await base44.entities.Listing.delete(listing.id);
    window.location.reload();
  };

  const handleEdit = async () => {
    let nextImageUrl = editImageUrl;
    if (editImageFile) {
      const upload = await base44.integrations.Core.UploadFile({ file: editImageFile });
      nextImageUrl = upload.file_url;
    }
    await base44.entities.Listing.update(listing.id, {
      title: editTitle,
      description: editDescription,
      image_url: nextImageUrl,
    });
    setEditImageUrl(nextImageUrl);
    setEditImageFile(null);
    setEditing(false);
    window.location.reload();
  };

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border">
      {/* Image */}
      <div className="h-52 overflow-hidden relative cursor-pointer" onClick={() => setShowLightbox(true)}>
        <img
          src={safeDisplayImageUrl}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Save button */}
        <button
          onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
          className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform z-10"
        >
          <Heart size={14} className={saved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'} />
        </button>
        {/* Category badge */}
        <span className="absolute bottom-3 left-3 bg-gradient-to-r from-primary to-deep-green text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-md">
          {icon} {catLabel}
        </span>
        {/* Top listing badge */}
        {listing.rating >= 4.8 && (
          <span className="absolute top-3 left-3 bg-amber-400 text-white px-2.5 py-0.5 rounded-lg text-xs font-bold shadow">
            ✦ Top
          </span>
        )}
        {isAdmin && (
          <div className="absolute top-3 right-14 z-10">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md"
            >
              <MoreHorizontal size={14} className="text-muted-foreground" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[160px]">
                <button onClick={() => { setEditing(true); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                  <Pencil size={13} /> {lang === 'lo' ? 'ແກ້ໄຂ' : 'Edit'}
                </button>
                <button onClick={handleDelete} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                  <Trash2 size={13} /> {lang === 'lo' ? 'ລຶບ' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div className="p-4">
          <input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder={lang === 'lo' ? 'ຊື່ລາຍການ' : 'Listing title'}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary mb-2"
          />
          <textarea
            value={editDescription}
            onChange={e => setEditDescription(e.target.value)}
            placeholder={lang === 'lo' ? 'ລາຍລະອຽດ' : 'Description'}
            rows={3}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary resize-none mb-2"
          />
          <input
            value={editImageUrl}
            onChange={e => setEditImageUrl(e.target.value)}
            placeholder={lang === 'lo' ? 'ລິ້ງຮູບພາບ' : 'Image URL'}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary mb-2"
          />
          <button type="button" onClick={() => editImageInputRef.current?.click()} className="mb-2 flex items-center gap-2 w-fit text-xs font-semibold text-primary min-h-[44px] px-2">
            <ImageIcon size={14} />
            {lang === 'lo' ? 'ເລືອກຮູບຈາກຄອມ' : 'Choose photo from desktop'}
          </button>
          <input ref={editImageInputRef} type="file" accept="image/*" className="hidden" onChange={e => setEditImageFile(e.target.files?.[0] || null)} />
          {safeDisplayImageUrl && (
            <img src={safeDisplayImageUrl} alt="" className="w-full max-h-52 object-cover rounded-xl border border-border mb-3" />
          )}
          <div className="flex gap-2">
            <button onClick={handleEdit} className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90">
              <Check size={12} /> Save
            </button>
            <button onClick={() => { setEditing(false); setEditTitle(listing.title || ''); setEditDescription(listing.description || ''); setEditImageUrl(listing.image_url || ''); setEditImageFile(null); }} className="flex items-center gap-1 border border-border px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <Link to={`/listing/${listing.id}`} className="block p-4">
          <div className="flex justify-between items-start mb-1.5">
            <h3 className="font-bold text-sm leading-tight flex-1 mr-2 text-foreground">
              {lang === 'lo' && listing.title_lao ? listing.title_lao : listing.title}
            </h3>
            <div className="flex items-center gap-1 text-amber-500 text-sm whitespace-nowrap flex-shrink-0">
              <Star size={13} className="fill-amber-400" />
              <span className="font-semibold text-xs">{(listing.rating || 0).toFixed(1)}</span>
              {listing.review_count > 0 && <span className="text-muted-foreground text-xs">({listing.review_count} {t.reviews})</span>}
            </div>
          </div>
          <p className="text-muted-foreground text-xs flex items-center gap-1 mb-2">
            <MapPin size={11} />
            {lang === 'lo' && listing.city_lao ? listing.city_lao : listing.city}, {listing.country}
          </p>
          {(listing.guests > 0 || listing.beds > 0) && (
            <p className="text-muted-foreground text-xs mb-3">
              {listing.guests > 0 && `${listing.guests} ${t.guests}`}
              {listing.beds > 0 && ` · ${listing.beds} ${t.beds}`}
              {listing.baths > 0 && ` · ${listing.baths} ${t.bath}`}
            </p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm">
              <span className="text-primary font-black text-lg">${listing.price}</span>
              <span className="text-muted-foreground text-xs"> {t.perNight}</span>
            </p>
            <span className="text-xs bg-primary/8 text-primary px-2.5 py-1 rounded-lg font-semibold border border-primary/20">
              {lang === 'lo' ? 'ຈອງ' : 'Book'}
            </span>
          </div>
        </Link>
      )}

      {showLightbox && safeDisplayImageUrl && <ImageLightbox src={safeDisplayImageUrl} onClose={() => setShowLightbox(false)} />}
    </div>
  );
}