import { Star, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CAT_ICONS } from '../hooks/useLang';

export default function ListingCard({ listing, t, lang }) {
  const catIndex = ['culture', 'stay', 'food', 'experience', 'home', 'nature'].indexOf(listing.category);
  const catLabel = t.categories[catIndex] || listing.category;
  const icon = CAT_ICONS[listing.category] || '📌';

  return (
    <Link to={`/listing/${listing.id}`} className="group block bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="h-48 overflow-hidden relative">
        <img 
          src={listing.image_url} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {listing.rating >= 4.8 && (
          <span className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-xs font-semibold">⭐ Top</span>
        )}
        <span className="absolute top-3 right-3 bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full text-xs font-semibold">
          {icon} {catLabel}
        </span>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-sm leading-tight flex-1 mr-2">
            {lang === 'lo' && listing.title_lao ? listing.title_lao : listing.title}
          </h3>
          <div className="flex items-center gap-1 text-gold text-sm whitespace-nowrap">
            <Star size={14} className="fill-gold" />
            {(listing.rating || 0).toFixed(1)}
          </div>
        </div>
        <p className="text-muted-foreground text-xs flex items-center gap-1 mb-1">
          <MapPin size={12} />
          {lang === 'lo' && listing.city_lao ? listing.city_lao : listing.city}, {listing.country}
        </p>
        <p className="text-muted-foreground text-xs">
          {listing.guests} {t.guests} · {listing.beds} {t.beds} · {listing.baths} {t.bath}
        </p>
        <p className="mt-2 text-sm">
          <span className="text-primary font-bold text-base">${listing.price}</span>
          <span className="text-muted-foreground"> {t.perNight}</span>
        </p>
      </div>
    </Link>
  );
}