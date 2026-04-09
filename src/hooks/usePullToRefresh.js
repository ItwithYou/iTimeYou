import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const THRESHOLD = 70;

/**
 * Pull-to-refresh hook.
 * @param {Function} onRefresh - async callback to call when threshold is reached
 * @param {string} activePath - the route path this hook should be active on
 */
export default function usePullToRefresh(onRefresh, activePath) {
  const location = useLocation();
  const isActive = location.pathname === activePath;

  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startYRef = useRef(null);
  const pullDistRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!isActive) {
      setPullDistance(0);
      startYRef.current = null;
      return;
    }

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (startYRef.current === null) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0 && window.scrollY === 0) {
        const dist = Math.min(delta * 0.5, THRESHOLD * 1.5);
        pullDistRef.current = dist;
        setPullDistance(dist);
      } else {
        startYRef.current = null;
        setPullDistance(0);
        pullDistRef.current = 0;
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistRef.current >= THRESHOLD) {
        setRefreshing(true);
        await onRefreshRef.current();
        setRefreshing(false);
      }
      pullDistRef.current = 0;
      setPullDistance(0);
      startYRef.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isActive]);

  return { refreshing, pullDistance, threshold: THRESHOLD };
}