// Reliable image fallbacks so listings/posts never show a broken image.

// Soft teal→gold gradient used as the ultimate fallback (inline SVG, always loads).
export const GRADIENT_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%230ADBB9'/%3E%3Cstop offset='1' stop-color='%23E5B567'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23g)'/%3E%3C/svg%3E";

// Curated category cover images (Unsplash, stable IDs).
const CATEGORY_IMG = {
  food: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
  stay: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
  experience: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80',
  culture: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=800&q=80',
  home: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80',
  nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
};

export function coverImage(item = {}) {
  const direct = (item.image_url || item.photo_url || (Array.isArray(item.photos) && item.photos[0]) || '').trim?.() || '';
  if (direct) return direct;
  return CATEGORY_IMG[item.category] || GRADIENT_IMG;
}

// Use on any <img>: falls back to category image, then gradient, never broken.
export function onImgError(e, category) {
  const el = e.currentTarget;
  const cat = CATEGORY_IMG[category];
  if (cat && el.src !== cat) { el.src = cat; return; }
  el.onerror = null;
  el.src = GRADIENT_IMG;
}
