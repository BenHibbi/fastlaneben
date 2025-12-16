'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, CheckCircle } from 'lucide-react'
import type { Client } from '@/types/database'

interface VoiceBriefRecorderProps {
  client: Client
  onComplete: () => void
  onUpdate: () => void
}

export function VoiceBriefRecorder({
  client,
  onComplete,
  onUpdate
}: VoiceBriefRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const MAX_RECORDING_TIME = 120 // 2 minutes

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Microphone error:', err)
      setError('Could not access microphone. Please allow microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const resetRecording = () => {
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setRecordingTime(0)
  }

  const submitRecording = async () => {
    if (!audioBlob) return

    setIsSubmitting(true)
    setError('')

    try {
      // Step 1: Upload and transcribe
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('clientId', client.id)

      const uploadRes = await fetch('/api/voice-brief', {
        method: 'POST',
        body: formData
      })

      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Failed to upload')
      }

      // Step 2: Analyze transcript automatically
      const analyzeRes = await fetch('/api/voice-brief/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          voiceBriefId: uploadData.voiceBrief.id
        })
      })

      const analyzeData = await analyzeRes.json()

      if (!analyzeRes.ok) {
        throw new Error(analyzeData.error || 'Failed to analyze')
      }

      // Done!
      setIsComplete(true)
      onUpdate()

      // Auto-continue after short delay
      setTimeout(() => {
        onComplete()
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show completion state
  if (isComplete || client.creative_brief_status === 'brief_generated') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-medium text-slate-900 mb-2">Voice note submitted!</h3>
          <p className="text-slate-500 mb-6">Your recording has been processed and sent to our team.</p>
          <button
            onClick={onComplete}
            className="py-3 px-6 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-serif-display text-slate-900 mb-2">
          Optional voice note (max 2 minutes)
        </h2>
        <p className="text-slate-500 mb-4">
          Help us better understand your business tone and priorities.
        </p>
        <div className="text-left text-sm text-slate-600 bg-slate-50 rounded-xl p-4">
          <p className="font-medium text-slate-700 mb-2">Speak naturally about:</p>
          <ul className="space-y-1 ml-4">
            <li>• what your business does</li>
            <li>• who your customers are</li>
            <li>• the image you want to project (professional, friendly, premium, etc.)</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500 italic">
            This helps us refine copy and visual tone — it does not change the structure, scope, or features of your website.
          </p>
        </div>
      </div>

      {/* Recording UI */}
      <div className="flex flex-col items-center">
        {!audioBlob ? (
          <>
            {/* Record button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {isRecording ? (
                <Square className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>

            {/* Timer */}
            <div className="mt-4 text-2xl font-mono text-slate-600">
              {formatTime(recordingTime)}
              {isRecording && (
                <span className="text-sm text-slate-400 ml-2">
                  / {formatTime(MAX_RECORDING_TIME)}
                </span>
              )}
            </div>

            {/* Instructions */}
            <p className="mt-4 text-sm text-slate-500">
              {isRecording
                ? 'Click to stop recording'
                : 'Click to start recording'}
            </p>
          </>
        ) : (
          <>
            {/* Playback */}
            <div className="w-full mb-6">
              <audio src={audioUrl || undefined} controls className="w-full" />
              <p className="text-center text-sm text-slate-500 mt-2">
                Recording: {formatTime(recordingTime)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <button
                onClick={resetRecording}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Record Again
              </button>
              <button
                onClick={submitRecording}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <span>ℹ️</span> Tips (keep it short)
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Describe your business in simple terms</li>
          <li>• Explain what matters most to your customers</li>
          <li>• Mention the overall vibe you want (not specific designs)</li>
        </ul>
      </div>

      {/* Warning */}
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
          <span>🚫</span> Please do not use this voice note to request:
        </h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• new features</li>
          <li>• extra pages</li>
          <li>• layout changes</li>
          <li>• ongoing updates</li>
        </ul>
        <p className="mt-3 text-xs text-amber-700 font-medium">
          All website structure and features are defined by your selected Fastlane package.
        </p>
      </div>

      {/* Skip button */}
      <button
        onClick={onComplete}
        disabled={isSubmitting}
        className="mt-6 w-full py-3 px-4 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        Skip this step
      </button>
    </div>
  )
}
