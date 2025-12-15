'use client'

export function StatusBar() {
  return (
    <div className="bg-[#1a1a1a] border-t border-white/10 py-3 sm:py-4 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-center md:justify-between items-center gap-2 sm:gap-4 text-[8px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-medium text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#C3F53C] animate-pulse"></div>
          STATUS: Accepting projects
        </div>
        <div className="hidden sm:block">TURNAROUND: 7 days</div>
        <div className="hidden sm:block">AVAILABILITY: Limited slots</div>
      </div>
    </div>
  )
}
