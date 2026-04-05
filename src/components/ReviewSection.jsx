import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StarRating from './StarRating';
import { toast } from 'sonner';
import moment from 'moment';

export default function ReviewSection({ targetProfile, currentUser, t, lang, onReviewSubmitted }) {
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myText, setMyText] = useState('');
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [targetProfile.id]);

  const loadReviews = async () => {
    const data = await base44.entities.Review.filter({ target_profile_id: targetProfile.id }, '-created_date', 20);
    setReviews(data);
    if (currentUser) {
      setAlreadyReviewed(data.some(r => r.reviewer_email === currentUser.email));
    }
  };

  const submitReview = async () => {
    if (myRating === 0) return;
    if (alreadyReviewed) { toast.error(t.alreadyReviewed); return; }
    setSubmitting(true);

    await base44.entities.Review.create({
      reviewer_email: currentUser.email,
      reviewer_name: currentUser.full_name || currentUser.email,
      target_profile_id: targetProfile.id,
      target_email: targetProfile.user_email,
      stars: myRating,
      text: myText,
    });

    // Update trust stars
    const newTotalRatings = (targetProfile.total_ratings || 0) + 1;
    const newRatingSum = (targetProfile.rating_sum || 0) + myRating;
    const newTrustStars = Math.round((newRatingSum / newTotalRatings) * 10) / 10;

    await base44.entities.UserProfile.update(targetProfile.id, {
      total_ratings: newTotalRatings,
      rating_sum: newRatingSum,
      trust_stars: newTrustStars,
    });

    setMyRating(0);
    setMyText('');
    setSubmitting(false);
    toast.success(t.reviewSubmitted);
    loadReviews();
    onReviewSubmitted?.();
  };

  return (
    <div className="mx-6 mt-4 bg-card rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold mb-3">{t.rateUser}</h3>

      {!alreadyReviewed ? (
        <div className="space-y-3 mb-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">{t.yourRating}</label>
            <StarRating rating={myRating} interactive onRate={setMyRating} size={24} />
          </div>
          <textarea
            value={myText}
            onChange={e => setMyText(e.target.value)}
            placeholder={t.writeReview}
            rows={2}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          />
          <button
            onClick={submitReview}
            disabled={myRating === 0 || submitting}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {t.submitReview}
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">✅ {t.alreadyReviewed}</p>
      )}

      {reviews.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">{reviews.length} {t.reviews}</h4>
          {reviews.map(r => (
            <div key={r.id} className="flex gap-3 pb-3 border-b border-border last:border-0">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.reviewer_email}`}
                alt=""
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{r.reviewer_name || r.reviewer_email}</span>
                  <StarRating rating={r.stars} size={12} />
                </div>
                {r.text && <p className="text-sm text-muted-foreground mt-0.5">{r.text}</p>}
                <span className="text-xs text-muted-foreground">{moment(r.created_date).fromNow()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}