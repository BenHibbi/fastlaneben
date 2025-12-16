'use client'

import { ONBOARDING_PHASE_CONFIG, type OnboardingPhase } from '@/types/database'

interface PhaseProgressProps {
  phases: OnboardingPhase[]
  currentPhase: OnboardingPhase
  completedPhases?: OnboardingPhase[]
  onPrevious?: () => void
  onNext?: () => void
}

export function PhaseProgress({
  phases,
  currentPhase,
  completedPhases = [],
  onPrevious,
  onNext
}: PhaseProgressProps) {
  const currentIndex = phases.indexOf(currentPhase)
  const canGoPrevious = currentIndex > 0 && onPrevious
  const canGoNext = onNext && completedPhases.includes(phases[currentIndex])

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-4">
        {phases.map((phase, index) => {
          const isCompleted = completedPhases.includes(phase) || index < currentIndex
          const isCurrent = index === currentIndex
          const config = ONBOARDING_PHASE_CONFIG[phase]

          return (
            <div key={phase} className="flex items-center flex-1">
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span
                  className={`text-xs mt-1 hidden sm:block ${
                    isCurrent ? 'text-slate-900 font-medium' : 'text-slate-400'
                  }`}
                >
                  {config.label}
                </span>
              </div>

              {/* Connector line */}
              {index < phases.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Navigation and description */}
      <div className="flex items-center justify-between">
        {/* Previous button */}
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            canGoPrevious
              ? 'text-slate-600 hover:bg-slate-100'
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Current phase description */}
        <p className="text-sm text-slate-500">
          Step {currentIndex + 1} of {phases.length}:{' '}
          <span className="font-medium text-slate-700">
            {ONBOARDING_PHASE_CONFIG[currentPhase].description}
          </span>
        </p>

        {/* Next button */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            canGoNext
              ? 'text-slate-600 hover:bg-slate-100'
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
