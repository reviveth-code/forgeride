import { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Reusable pull-to-refresh wrapper.
 * Usage:
 *   <PullToRefresh onRefresh={async () => { await loadData(); }}>
 *     <YourContent />
 *   </PullToRefresh>
 */
export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(null);
  const containerRef = useRef(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
    setPullY(0);
  };

  const onTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const onTouchMove = (e) => {
    if (touchStartY.current == null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setPullY(Math.min(delta * 0.4, 60));
  };

  const onTouchEnd = () => {
    if (pullY > 40) handleRefresh();
    else setPullY(0);
    touchStartY.current = null;
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-background ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {(pullY > 0 || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: refreshing ? 48 : pullY }}
        >
          <RefreshCw className={`w-5 h-5 text-forge-orange ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      )}
      {children}
    </div>
  );
}