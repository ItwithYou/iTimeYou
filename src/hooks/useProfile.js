import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function useProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);
    
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    if (profiles.length > 0) {
      setProfile(profiles[0]);
    } else {
      // Auto-create profile for new user
      const newProfile = await base44.entities.UserProfile.create({
        user_email: user.email,
        first_name: user.full_name?.split(' ')[0] || 'User',
        last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`,
        trust_stars: 3.0,
        wallet_balance: 100,
        is_verified: false,
        verification_status: 'none',
        total_ratings: 0,
        rating_sum: 0,
        friends: [],
      });
      setProfile(newProfile);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const refreshProfile = async () => {
    if (!currentUser) return;
    const profiles = await base44.entities.UserProfile.filter({ user_email: currentUser.email });
    if (profiles.length > 0) setProfile(profiles[0]);
  };

  return { currentUser, profile, loading, refreshProfile, setProfile };
}