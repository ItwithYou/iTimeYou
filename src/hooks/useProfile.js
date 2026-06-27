import { useState, useEffect } from 'react';
import { firebaseClient } from '@/api/firebaseClient';

export default function useProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const user = await firebaseClient.auth.me();
      setCurrentUser(user);

      const profiles = await firebaseClient.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      } else {
        // Auto-create profile for new user
        const emailValue = (user.email || '').toLowerCase();
        const inferredGender = emailValue.includes('female') || emailValue.includes('girl') || emailValue.includes('woman') ? 'female' : emailValue.includes('male') || emailValue.includes('boy') || emailValue.includes('man') ? 'male' : 'other';
        const displayNameStyle = inferredGender === 'female' ? 'ms' : inferredGender === 'male' ? 'mr' : 'mx';
        const avatarSeed = `${inferredGender}-${encodeURIComponent(user.email)}`;
        const newProfile = await firebaseClient.entities.UserProfile.create({
          user_email: user.email,
          first_name: user.full_name?.split(' ')[0] || 'User',
          last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
          gender: inferredGender,
          display_name_style: displayNameStyle,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
          trust_stars: 3.0,
          wallet_balance: 0,
          is_verified: false,
          verification_status: 'none',
          total_ratings: 0,
          rating_sum: 0,
          friends: [],
        });
        setProfile(newProfile);
      }
    } catch (err) {
      // Not authenticated yet, or transient error — the router will redirect to /login.
      console.warn('useProfile:', err?.message || err);
      setCurrentUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const refreshProfile = async () => {
    if (!currentUser) return;
    try {
      const profiles = await firebaseClient.entities.UserProfile.filter({ user_email: currentUser.email });
      if (profiles.length > 0) setProfile(profiles[0]);
    } catch (err) {
      console.warn('refreshProfile:', err?.message || err);
    }
  };

  return { currentUser, profile, loading, refreshProfile, setProfile };
}
