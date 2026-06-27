// Reliable, unique image fallbacks so cards are never broken or duplicated.

// Soft teal→gold gradient — ultimate inline fallback (always loads).
export const GRADIENT_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%230ADBB9'/%3E%3Cstop offset='1' stop-color='%23E5B567'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23g)'/%3E%3C/svg%3E";

// Stable short seed from any string (so each item gets its OWN consistent photo).
function seedFrom(item = {}) {
  const base = String(item.id || item.title || item.text || item.image_url || Math.random());
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// A reliable, UNIQUE photo per item (Lorem Picsum CDN — always loads).
function uniquePhoto(item) {
  return `https://picsum.photos/seed/itimeyou-${seedFrom(item)}/800/600`;
}

// Reliable unique photo from any string seed (e.g. a failing image src).
export function reliablePhoto(seedStr) {
  return uniquePhoto({ id: seedStr });
}

// Primary cover: use the real photo if present, else a unique reliable photo.
export function coverImage(item = {}) {
  const direct =
    (item.image_url || item.photo_url || (Array.isArray(item.photos) && item.photos[0]) || '').trim?.() || '';
  return direct || uniquePhoto(item);
}

// <img onError>: fall back to a unique reliable photo, then the gradient.
export function onImgError(e, item = {}) {
  const el = e.currentTarget;
  const fallback = uniquePhoto(item);
  if (el.src !== fallback) { el.src = fallback; return; }
  el.onerror = null;
  el.src = GRADIENT_IMG;
}
