import { Star, MapPin, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { CAT_ICONS } from '../hooks/useLang';

export default function ListingCard({ listing, t, lang }) {
  const [saved, setSaved] = useState(false);
  const catIndex = ['culture', 'stay', 'food', 'experience', 'home', 'nature'].indexOf(listing.category);
  const catLabel = t.categories[catIndex] || listing.category;
  const icon = CAT_ICONS[listing.category] || '📌';

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border">
      {/* Image */}
      <div className="h-52 overflow-hidden relative">
        <img
          src={listing.image_url}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Save button */}
        <button
          onClick={(e) => { e.preventDefault(); setSaved(!saved); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
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
      </div>

      {/* Content */}
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
    </div>
  );
}