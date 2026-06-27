import { useState, useRef } from 'react';
import { Star, MapPin, Heart, MoreHorizontal, Pencil, Trash2, Check, X, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CAT_ICONS } from '../hooks/useLang';
import ImageLightbox from './ImageLightbox';
import PhotoGrid from './PhotoGrid';
import useProfile from '../hooks/useProfile';
import { coverImage } from '../utils/img';
import { useAppContext } from '../lib/AppContext';
import { convertAndFormatPrice } from '../utils/currencyUtils';
import moment from 'moment';

export default function ListingCard({ listing, t, lang }) {
  const { currentUser } = useProfile();
  const { exchangeRates, preferredCurrency } = useAppContext();
  const [saved, setSaved] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(listing.title || '');
  const [editDescription, setEditDescription] = useState(listing.description || '');
  const [editImageUrls, setEditImageUrls] = useState(listing.image_urls || (listing.image_url ? [listing.image_url] : []));
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [editImagePreviews, setEditImagePreviews] = useState([]);
  const editImageInputRef = useRef(null);
  const catIndex = ['culture', 'stay', 'food', 'experience', 'home', 'nature'].indexOf(listing.category);
  const catLabel = t.categories[catIndex] || listing.category;
  const icon = CAT_ICONS[listing.category] || '📌';
  const isAdmin = currentUser?.role === 'admin';
  const safeDisplayImageUrl = (listing.image_urls && listing.image_urls.length > 0) ? listing.image_urls[0] : (listing.image_url || coverImage(listing));

  const handleDelete = async () => {
    if (!window.confirm(lang === 'lo' ? 'ລຶບລາຍການນີ້?' : 'Delete this listing?')) return;
    await base44.entities.Listing.delete(listing.id);
    window.location.reload();
  };

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setEditImageFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setEditImagePreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setEditImageFiles(prev => prev.filter((_, i) => i !== index));
    setEditImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleEdit = async () => {
    let nextImageUrls = [...editImageUrls];
    if (editImageFiles.length > 0) {
      const uploads = await Promise.all(editImageFiles.map(f => base44.integrations.Core.UploadFile({ file: f })));
      const newUrls = uploads.map(u => u.file_url).filter(Boolean);
      nextImageUrls = [...nextImageUrls, ...newUrls];
    }
    
    await base44.entities.Listing.update(listing.id, {
      title: editTitle,
      description: editDescription,
      image_urls: nextImageUrls,
      image_url: nextImageUrls[0] || listing.image_url,
    });
    setEditImageUrls(nextImageUrls);
    setEditImageFiles([]);
    setEditImagePreviews([]);
    setEditing(false);
    window.location.reload();
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl border-2 border-primary/20 flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/listing/${listing.id}`} className="text-sm font-bold truncate hover:text-primary transition-colors block text-foreground">
            {lang === 'lo' && listing.title_lao ? listing.title_lao : listing.title}
          </Link>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
             <span>{moment(new Date(listing.created_date || Date.now())).fromNow()}</span>
             <span>•</span>
             <span className="flex items-center gap-1"><MapPin size={10} /> {lang === 'lo' && listing.city_lao ? listing.city_lao : listing.city}, {listing.country}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {listing.category && (
            <span className="text-xs px-2.5 py-1 rounded-xl bg-gradient-to-r from-primary/10 to-deep-green/10 text-primary font-semibold border border-primary/15 flex-shrink-0">
              {CAT_ICONS[listing.category]} {catLabel}
            </span>
          )}
          {isAdmin && (
            <div className="relative">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                <MoreHorizontal size={16} className="text-muted-foreground" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden min-w-[160px]">
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
      </div>

      {/* Content / Edit */}
      {editing ? (
        <div className="p-4 pt-0">
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
          <div className="flex items-center justify-between mb-2 mt-2 border-b border-border pb-2">
             <label className="text-xs font-semibold text-muted-foreground uppercase">
               {lang === 'lo' ? 'ເພີ່ມຮູບພາບ' : 'Add Photos'}
             </label>
             <button type="button" onClick={() => editImageInputRef.current?.click()} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors">
               <ImageIcon size={14} /> {lang === 'lo' ? 'ເລືອກຮູບ' : 'Choose'}{editImageFiles.length > 0 ? ` (${editImageFiles.length})` : ''}
             </button>
          </div>
          <input ref={editImageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
          
          {editImagePreviews.length > 0 && (
            <div className="mb-3 rounded-xl overflow-hidden border border-border">
              <PhotoGrid photos={editImagePreviews} onRemove={removePhoto} />
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button onClick={handleEdit} className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90">
              <Check size={12} /> Save
            </button>
            <button onClick={() => { setEditing(false); setEditTitle(listing.title || ''); setEditDescription(listing.description || ''); setEditImageUrls(listing.image_urls || []); setEditImageFiles([]); setEditImagePreviews([]); }} className="flex items-center gap-1 border border-border px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-3 text-sm leading-relaxed text-foreground">
           {listing.description}
           {(listing.guests > 0 || listing.beds > 0) && (
             <div className="mt-2 text-xs text-muted-foreground font-medium flex items-center gap-2">
               {listing.guests > 0 && <span>{listing.guests} {t.guests}</span>}
               {listing.beds > 0 && <span>• {listing.beds} {t.beds}</span>}
               {listing.baths > 0 && <span>• {listing.baths} {t.bath}</span>}
             </div>
           )}
        </div>
      )}

      {/* Photos */}
      {!editing && (
        <div className="relative border-y border-border/50">
          <PhotoGrid photos={listing.image_urls?.length > 0 ? listing.image_urls : [coverImage(listing)]} />
          {listing.rating >= 4.8 && (
            <span className="absolute top-3 left-3 bg-amber-400 text-white px-2.5 py-0.5 rounded-lg text-xs font-bold shadow pointer-events-none">
              ✦ Top
            </span>
          )}
        </div>
      )}

      {/* Action Bar */}
      {!editing && (
        <div className="flex items-center justify-between px-4 py-3 bg-muted/10">
          <div className="flex items-center gap-4">
             <button
               onClick={(e) => { e.preventDefault(); setSaved(!saved); }}
               className="flex items-center gap-1.5 text-sm text-muted-foreground active:text-primary transition-colors font-medium"
             >
               <Heart size={18} className={saved ? 'fill-red-500 text-red-500' : ''} />
               {saved ? 'Saved' : 'Save'}
             </button>
             <div className="flex items-center gap-1 text-amber-500 text-sm">
               <Star size={16} className="fill-amber-400" />
               <span className="font-bold">{(listing.rating || 0).toFixed(1)}</span>
               {listing.review_count > 0 && <span className="text-muted-foreground text-xs">({listing.review_count} {t.reviews})</span>}
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
               <div className="bg-gradient-to-tr from-rose-50 to-white border border-rose-100/60 shadow-sm rounded-lg px-2.5 py-1 flex items-center justify-center">
                 <span className="font-serif text-[14px] sm:text-[1.1rem] font-medium text-rose-500 tracking-wide">
                   {(() => {
                     const formatted = convertAndFormatPrice(listing.price, listing.currency, preferredCurrency, exchangeRates);
                     const [pricePart, suffixPart] = formatted.split('/');
                     return (
                       <>
                         {pricePart}
                         {suffixPart && <span className="text-[10px] sm:text-[12px] opacity-70 ml-0.5 font-bold uppercase tracking-widest">/{suffixPart}</span>}
                       </>
                     );
                   })()}
                 </span>
               </div>
             </div>
             <Link to={`/listing/${listing.id}`} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity">
               {lang === 'lo' ? 'ຈອງ' : 'Book'}
             </Link>
          </div>
        </div>
      )}

      {showLightbox && safeDisplayImageUrl && <ImageLightbox src={safeDisplayImageUrl} onClose={() => setShowLightbox(false)} />}
    </div>
  );
}