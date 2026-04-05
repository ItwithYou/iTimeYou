import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, max = 5, size = 16, interactive = false, onRate }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`${i < Math.round(rating) ? 'fill-gold text-gold' : 'text-muted-foreground/30'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          size={size}
          onClick={interactive ? () => onRate?.(i + 1) : undefined}
        />
      ))}
    </div>
  );
}