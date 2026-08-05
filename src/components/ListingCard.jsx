import { useState, useRef } from 'react';
import { Star, MapPin, Heart, MoreHorizontal, Pencil, Trash2, Check, X, Image as ImageIcon, Users, BedDouble, Bath } from 'lucide-react';
import { Link } from 'react-router-dom';
import { firebaseClient } from '@/api/firebaseClient';
import moment from 'moment';
import { BUSINESS_CATS, PERSONAL_CATS } from '../hooks/useLang';
import ImageLightbox from './ImageLightbox';
import PhotoGrid from './PhotoGrid';
import useProfile from '../hooks/useProfile';
import { coverImage } from '../utils/img';
import { useAppContext } from '../lib/AppContext';
import { convertAndFormatPrice, priceUnitFor } from '../utils/currencyUtils';

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
  const catObj = [...BUSINESS_CATS, ...PERSONAL_CATS].find(c => c.key === listing.category) || BUSINESS_CATS[0];
  const catLabel = lang === 'lo' ? catObj.lo : catObj.en;
  const icon = catObj.icon;
  const isAdmin = currentUser?.role === 'admin';
  const safeDisplayImageUrl = (listing.image_urls && listing.image_urls.length > 0) ? listing.image_urls[0] : (listing.image_url || coverImage(listing));

  const handleDelete = async () => {
    if (!window.confirm(lang === 'lo' ? 'ລຶບລາຍການນີ້?' : 'Delete this listing?')) return;
    await firebaseClient.entities.Listing.delete(listing.id);
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
      const uploads = await Promise.all(editImageFiles.map(f => firebaseClient.integrations.Core.UploadFile({ file: f })));
      const newUrls = uploads.map(u => u.file_url).filter(Boolean);
      nextImageUrls = [...nextImageUrls, ...newUrls];
    }
    
    await firebaseClient.entities.Listing.update(listing.id, {
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
            <span className="text-xs px-2.5 py-1 rounded-xl bg-gradient-to-r from-primary/10 to-deep-green/10 text-primary font-semibold border border-primary/15 flex items-center gap-1">
              {icon} {catLabel}
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
           {/* Clamp long descriptions on phones so cards stay scannable */}
           <p className="line-clamp-2 sm:line-clamp-3">
             {lang === 'lo' && listing.description_lao ? listing.description_lao : listing.description}
           </p>
           {(listing.guests > 0 || listing.beds > 0) && (
             <div className="mt-2 flex items-center gap-1.5 flex-wrap">
               {listing.guests > 0 && (
                 <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                   <Users size={12} /> {listing.guests}
                 </span>
               )}
               {listing.beds > 0 && (
                 <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                   <BedDouble size={12} /> {listing.beds}
                 </span>
               )}
               {listing.baths > 0 && (
                 <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                   <Bath size={12} /> {listing.baths}
                 </span>
               )}
             </div>
           )}
        </div>
      )}

      {/* Photos */}
      {!editing && (
        <div className="relative border-y border-border/50">
          <PhotoGrid photos={listing.image_urls?.length > 0 ? listing.image_urls : [coverImage(listing)]} />
          {listing.rating >= 4.8 && (
            <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm text-foreground px-2 py-0.5 rounded text-xs font-semibold shadow-sm flex items-center gap-1">
              {icon} {catLabel}
            </div>
          )}
        </div>
      )}

      {/* Action Bar — two clean rows so price & Book never overflow */}
      {!editing && (
        <div className="px-4 py-3 bg-muted/10 space-y-2.5">
          {/* Row 1: save + rating */}
          <div className="flex items-center justify-between gap-3">
             <button
               onClick={(e) => { e.preventDefault(); setSaved(!saved); }}
               className="flex items-center gap-1.5 text-sm text-muted-foreground active:text-primary transition-colors font-medium whitespace-nowrap flex-shrink-0"
             >
               <Heart size={18} className={saved ? 'fill-red-500 text-red-500' : ''} />
               {saved ? (lang === 'lo' ? 'ບັນທຶກແລ້ວ' : 'Saved') : (lang === 'lo' ? 'ບັນທຶກ' : 'Save')}
             </button>
             <div className="flex items-center gap-1 text-amber-500 text-sm whitespace-nowrap min-w-0">
               <Star size={16} className="fill-amber-400 flex-shrink-0" />
               <span className="font-bold">{(listing.rating || 0).toFixed(1)}</span>
               {listing.review_count > 0 && <span className="text-muted-foreground text-xs truncate">({listing.review_count} {t.reviews})</span>}
             </div>
          </div>

          {/* Row 2: price + Book */}
          <div className="flex items-center justify-between gap-3">
             <div className="min-w-0 flex-1">
               <div className="inline-flex max-w-full items-baseline gap-1 rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-1.5">
                 {(() => {
                   const formatted = convertAndFormatPrice(listing.price, listing.currency, preferredCurrency, exchangeRates);
                   let pricePart = formatted.split('/')[0].trim();
                   // Compact millions so LAK prices stay short: 2,675,400 LAK -> 2.68M LAK
                   const m = pricePart.match(/([\d][\d,]{6,})/);
                   if (m) {
                     const num = parseFloat(m[1].replace(/,/g, ''));
                     if (isFinite(num) && num >= 1000000) {
                       const compact = (num / 1000000).toFixed(num >= 10000000 ? 1 : 2).replace(/\.?0+$/, '') + 'M';
                       pricePart = pricePart.replace(m[1], compact);
                     }
                   }
                   const unit = priceUnitFor(listing.category, lang); // /flight, /night, /hour, ...
                   return (
                     <>
                       <span className="wallet-num text-[14px] sm:text-[15px] font-bold text-primary truncate">{pricePart}</span>
                       {unit && <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-primary/60 flex-shrink-0">{unit}</span>}
                     </>
                   );
                 })()}
               </div>
             </div>
             <Link to={`/listing/${listing.id}`} className="flex-shrink-0 bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all">
               {lang === 'lo' ? 'ຈອງ' : 'Book'}
             </Link>
          </div>
        </div>
      )}

      {showLightbox && safeDisplayImageUrl && <ImageLightbox src={safeDisplayImageUrl} onClose={() => setShowLightbox(false)} />}
    </div>
  );
}