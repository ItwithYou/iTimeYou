import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { firebaseClient } from '@/api/firebaseClient';
import { toast } from 'sonner';

export default function ReviewBookingModal({ booking, currentUser, lang, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  const isGuest = booking.guest_email === currentUser?.email;
  const canReview = isGuest && booking.status === 'completed' && !booking.review_submitted;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(lang === 'lo' ? 'ກະລຸນາໃຫ້ຄະແນນ' : 'Please select a rating');
      return;
    }

    setLoading(true);

    try {
      // Create review for the host
      await firebaseClient.entities.Review.create({
        reviewer_email: currentUser.email,
        reviewer_name: `${currentUser.full_name || 'Guest'}`,
        target_email: booking.host_email,
        target_profile_id: booking.host_email,
        stars: rating,
        text: reviewText,
        listing_id: booking.listing_id,
      });

      // Update listing rating
      const listing = await firebaseClient.entities.Listing.get(booking.listing_id);
      const newReviewCount = (listing.review_count || 0) + 1;
      const newRatingSum = (listing.rating || 0) * (listing.review_count || 0) + rating;
      const newAverage = newRatingSum / newReviewCount;

      await firebaseClient.entities.Listing.update(booking.listing_id, {
        review_count: newReviewCount,
        rating: parseFloat(newAverage.toFixed(1)),
      });

      // Update booking to mark review as submitted
      await firebaseClient.entities.Booking.update(booking.id, {
        review_submitted: true,
        guest_review: rating,
        guest_review_text: reviewText,
      });

      // Update host profile trust stars
      const hostProfiles = await firebaseClient.entities.UserProfile.filter({ user_email: booking.host_email });
      if (hostProfiles.length > 0) {
        const hostProfile = hostProfiles[0];
        const newTotalRatings = (hostProfile.total_ratings || 0) + 1;
        const newRatingSum = (hostProfile.rating_sum || 0) + rating;
        const newTrustStars = newRatingSum / newTotalRatings;

        await firebaseClient.entities.UserProfile.update(hostProfile.id, {
          total_ratings: newTotalRatings,
          rating_sum: newRatingSum,
          trust_stars: parseFloat(newTrustStars.toFixed(1)),
        });
      }

      toast.success(lang === 'lo' ? 'ຂອບໃຈສຳລັບຄຳຕິຊົມ!' : 'Thank you for your review!');
      onReviewSubmitted?.();
      onClose();
    } catch (error) {
      toast.error(error.message || (lang === 'lo' ? 'ບໍ່ສາມາດສົ່ງຄຳຕິຊົມໄດ້' : 'Failed to submit review'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 border border-border shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain" onMouseDown={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{lang === 'lo' ? 'ໃຫ້ຄະແນນ ແລະ ຄຳຕິຊົມ' : 'Leave a Review'}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Booking info */}
          <div className="bg-muted/50 rounded-xl p-4 border border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              {lang === 'lo' ? 'ການຈອງຂອງທ່ານ' : 'Your Booking'}
            </p>
            <p className="text-sm font-medium">
              {lang === 'lo' ? 'ເຊັກອອກ:' : 'Check-out:'} {new Date(booking.check_out).toLocaleDateString()}
            </p>
          </div>

          {/* Star rating */}
          <div>
            <label className="block text-sm font-semibold mb-3">
              {lang === 'lo' ? 'ໃຫ້ຄະແນນດາວ' : 'How was your stay?'}
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform active:scale-95 p-1 min-w-[48px] min-h-[48px] flex items-center justify-center"
                >
                  <Star
                    size={40}
                    className={`${
                      star <= (hoveredRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm mt-3 font-semibold text-muted-foreground">
              {rating === 5 && (lang === 'lo' ? 'ດີເລີດ! ⭐' : 'Excellent! ⭐')}
              {rating === 4 && (lang === 'lo' ? 'ດີຫຼາຍ' : 'Very Good')}
              {rating === 3 && (lang === 'lo' ? 'ພໍໃຊ້' : 'Good')}
              {rating === 2 && (lang === 'lo' ? 'ບໍ່ຄ່ອຍດີ' : 'Fair')}
              {rating === 1 && (lang === 'lo' ? 'ບໍ່ດີ' : 'Poor')}
              {rating === 0 && (lang === 'lo' ? 'ເລືອກຈຳນວນດາວ' : 'Select a rating')}
            </p>
          </div>

          {/* Review text */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              {lang === 'lo' ? 'ຂຽນຄຳຕິຊົມ (ບໍ່ບັງຄັບ)' : 'Write a review (optional)'}
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={lang === 'lo' ? 'ບອກເຮົາກ່ຽວກັບປະສົບການຂອງທ່ານ...' : 'Tell us about your experience...'}
              rows={4}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                {lang === 'lo' ? 'ກຳລັງສົ່ງ...' : 'Submitting...'}
              </div>
            ) : (
              lang === 'lo' ? 'ສົ່ງຄຳຕິຊົມ' : 'Submit Review'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}