/**
 * Loading fallback for Suspense boundaries.
 * fullScreen=true — covers entire viewport (for standalone pages).
 * fullScreen=false — fits within content area (for layout child pages).
 */
export default function PageLoader({ fullScreen = true }) {
  return (
    <div className={fullScreen
      ? "fixed inset-0 flex items-center justify-center bg-background"
      : "flex-1 flex items-center justify-center min-h-[40vh]"}>
      <div className="w-8 h-8 border-4 border-slate-200 border-t-forge-orange rounded-full animate-spin" />
    </div>
  );
}