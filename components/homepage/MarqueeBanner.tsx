'use client'

export function MarqueeBanner() {
  return (
    <div className="bg-slate-900 py-2.5 sm:py-3.5 overflow-hidden relative z-20 border-y border-slate-800">
      <div className="flex w-[200%] animate-scroll hover:[animation-play-state:paused] cursor-default">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="whitespace-nowrap flex items-center gap-4 sm:gap-8 mx-2 sm:mx-4">
            <span className="text-white/80 text-[10px] sm:text-xs font-bold font-sans-body tracking-wider sm:tracking-widest uppercase">
              $39 / month &bull; Ready in 7 days &bull; Hosting + SSL included &bull; Add-ons &amp; Edits Available
            </span>
            <span className="text-[#C3F53C]">&bull;</span>
          </div>
        ))}
      </div>
    </div>
  )
}
