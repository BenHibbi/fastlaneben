'use client'

import { Play, Pause, Mic, Image as ImageIcon, FileText, Sparkles } from 'lucide-react'
import { useState, useRef } from 'react'
import type { VoiceBrief, ReferenceScreenshot } from '@/types/database'

interface CreativeBriefSectionProps {
  voiceBrief: VoiceBrief | null
  referenceScreenshots: ReferenceScreenshot[]
}

export default function CreativeBriefSection({
  voiceBrief,
  referenceScreenshots
}: CreativeBriefSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const structuredBrief = voiceBrief?.structured_brief as Record<string, unknown> | null

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const hasContent = voiceBrief || referenceScreenshots.length > 0

  if (!hasContent) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="font-medium text-slate-900 mb-4">Creative Brief</h2>
        <p className="text-slate-500 text-sm">Client has not submitted their creative brief yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="font-medium text-slate-900 mb-4">Creative Brief</h2>

      {/* Voice Recording */}
      {voiceBrief && (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
            <Mic className="w-4 h-4 text-purple-600" />
            Voice Recording
          </div>

          {/* Audio player */}
          {voiceBrief.audio_url && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg mb-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>
              <div className="flex-1">
                <audio
                  ref={audioRef}
                  src={voiceBrief.audio_url}
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
                <div className="text-sm font-medium text-purple-900">
                  Voice Brief Recording
                </div>
                <div className="text-xs text-purple-600">
                  {voiceBrief.duration_seconds
                    ? `${Math.floor(voiceBrief.duration_seconds / 60)}:${String(voiceBrief.duration_seconds % 60).padStart(2, '0')}`
                    : 'Duration unknown'}
                </div>
              </div>
            </div>
          )}

          {/* Transcript */}
          {voiceBrief.transcript && (
            <div className="mb-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
                <FileText className="w-3 h-3" />
                Transcript
              </div>
              <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                {voiceBrief.transcript}
              </div>
            </div>
          )}

          {/* Structured Brief */}
          {structuredBrief && !structuredBrief.parse_error && (
            <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 text-xs font-medium text-purple-600 mb-3">
                <Sparkles className="w-3 h-3" />
                AI-Generated Brief
              </div>

              <div className="space-y-3 text-sm">
                {typeof structuredBrief.summary === 'string' && (
                  <div>
                    <span className="font-medium text-slate-700">Summary: </span>
                    <span className="text-slate-600">{structuredBrief.summary}</span>
                  </div>
                )}

                {typeof structuredBrief.target_audience === 'string' && (
                  <div>
                    <span className="font-medium text-slate-700">Target Audience: </span>
                    <span className="text-slate-600">{structuredBrief.target_audience}</span>
                  </div>
                )}

                {Array.isArray(structuredBrief.brand_personality) && (
                  <div>
                    <span className="font-medium text-slate-700">Brand Personality: </span>
                    <span className="text-slate-600">{structuredBrief.brand_personality.join(', ')}</span>
                  </div>
                )}

                {Array.isArray(structuredBrief.key_features) && (
                  <div>
                    <span className="font-medium text-slate-700">Key Features:</span>
                    <ul className="mt-1 list-disc list-inside text-slate-600">
                      {(structuredBrief.key_features as string[]).map((f, i) => (
                        <li key={i}>{String(f)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {typeof structuredBrief.tone_of_voice === 'string' && (
                  <div>
                    <span className="font-medium text-slate-700">Tone: </span>
                    <span className="text-slate-600 capitalize">{structuredBrief.tone_of_voice}</span>
                  </div>
                )}

                {typeof structuredBrief.color_preferences === 'string' && (
                  <div>
                    <span className="font-medium text-slate-700">Color Preferences: </span>
                    <span className="text-slate-600">{structuredBrief.color_preferences}</span>
                  </div>
                )}

                {Array.isArray(structuredBrief.content_sections) && (
                  <div>
                    <span className="font-medium text-slate-700">Sections: </span>
                    <span className="text-slate-600">{(structuredBrief.content_sections as string[]).join(', ')}</span>
                  </div>
                )}

                {Array.isArray(structuredBrief.special_requests) && structuredBrief.special_requests.length > 0 && (
                  <div>
                    <span className="font-medium text-slate-700">Special Requests:</span>
                    <ul className="mt-1 list-disc list-inside text-slate-600">
                      {(structuredBrief.special_requests as string[]).map((r, i) => (
                        <li key={i}>{String(r)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(structuredBrief.questions_for_client) && structuredBrief.questions_for_client.length > 0 && (
                  <div className="pt-2 border-t border-purple-200">
                    <span className="font-medium text-amber-700">Questions to Clarify:</span>
                    <ul className="mt-1 list-disc list-inside text-amber-600">
                      {(structuredBrief.questions_for_client as string[]).map((q, i) => (
                        <li key={i}>{String(q)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reference Screenshots */}
      {referenceScreenshots.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            Reference Screenshots ({referenceScreenshots.length})
          </div>
          <div className="grid grid-cols-3 gap-2">
            {referenceScreenshots.map((screenshot) => (
              <a
                key={screenshot.id}
                href={screenshot.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-video bg-slate-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
              >
                <img
                  src={screenshot.url}
                  alt="Reference"
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
