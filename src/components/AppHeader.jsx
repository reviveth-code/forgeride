import { ArrowLeft } from 'lucide-react';

const LOGO_URL = "https://media.base44.com/images/public/6a1573c7d7c314d5744004ba/e7cf22d08_ForgeRideIcon.png";

/**
 * Shared navigation header.
 * - Root screens (no onBack): shows brand logo + title
 * - Child screens (with onBack): shows back button + title
 * - All touch targets meet 44x44px minimum
 * - Uses semantic color tokens for WCAG 2.1 AA contrast in light & dark modes
 */
export default function AppHeader({ title, subtitle, onBack, right, variant = 'light' }) {
  const isDark = variant === 'dark';

  return (
    <header
      role="banner"
      className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'bg-forge-navy border-white/10' : 'bg-card border-border'}`}
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Go back"
            className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-muted hover:bg-muted/80'}`}
          >
            <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-foreground'}`} aria-hidden="true" />
          </button>
        ) : (
          <img src={LOGO_URL} alt="ForgeRide" className="w-9 h-9 flex-shrink-0 rounded-lg" />
        )}
        <div className="flex-1 min-w-0">
          <h1 className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-foreground'}`}>{title}</h1>
          {subtitle && <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-white/60' : 'text-muted-foreground'}`}>{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
    </header>
  );
}