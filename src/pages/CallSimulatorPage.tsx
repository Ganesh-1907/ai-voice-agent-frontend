import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Phone, PhoneOff, Loader2, Volume2 } from 'lucide-react'
import type {
  CallState,
  StartCallResponse,
  TranscribeAudioResponse,
  ProcessTurnResponse,
} from '@/types/call-simulator'

export function CallSimulatorPage() {
  const [fromNumber, setFromNumber] = useState('')
  const [toNumber, setToNumber] = useState('')
  const [callState, setCallState] = useState<CallState>({
    callId: null,
    isActive: false,
    isRecording: false,
    isProcessing: false,
    isSpeaking: false,
    transcript: [],
    businessName: '',
    greeting: '',
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isListeningRef = useRef(false)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const callIdRef = useRef<string | null>(null)

  const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api'
  const SILENCE_THRESHOLD = 1500 // 1.5 seconds of silence to stop recording
  const SOUND_THRESHOLD = 20 // Lower threshold to detect sound more easily
  const MIN_RECORDING_TIME = 1000 // Minimum 1 second before checking for silence

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
    }
  }, [])

  const startCall = async () => {
    if (!fromNumber || !toNumber) {
      alert('Please enter both phone numbers')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/telephony/public/test-call/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromNumber, toNumber }),
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let error: any = {}

        if (contentType?.includes('application/json')) {
          try {
            error = await response.json()
          } catch {
            error = { message: `HTTP ${response.status}: ${response.statusText}` }
          }
        } else {
          const text = await response.text()
          error = { message: text || `HTTP ${response.status}: ${response.statusText}` }
        }

        throw new Error(error.message || 'Failed to start call')
      }

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid response format from server')
      }

      const data: StartCallResponse = await response.json()

      if (!data.callId || !data.businessName) {
        throw new Error('Invalid response data from server')
      }

      setCallState((prev) => ({
        ...prev,
        callId: data.callId,
        isActive: true,
        businessName: data.businessName,
        greeting: data.greeting,
        transcript: [
          {
            speaker: 'agent',
            text: data.greeting,
            timestamp: new Date(),
          },
        ],
      }))
      
      callIdRef.current = data.callId

      // Speak the greeting
      speakText(data.greeting)
    } catch (error) {
      console.error('Failed to start call:', error)
      alert(error instanceof Error ? error.message : 'Failed to start call')
    }
  }

  const startListening = async () => {
    if (isListeningRef.current) {
      console.log('Already listening, skipping...')
      return
    }

    try {
      console.log('Starting to listen...')
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        }
      })
      streamRef.current = stream
      isListeningRef.current = true

      // Setup audio context for sound detection
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...')
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        console.log('Audio blob size:', audioBlob.size)
        if (audioBlob.size > 0) {
          await processAudio(audioBlob)
        }
      }

      mediaRecorder.start()
      setCallState((prev) => ({ ...prev, isRecording: true }))
      console.log('Recording started')

      // Monitor for silence
      monitorSilence(analyser)
    } catch (error) {
      console.error('Failed to start listening:', error)
      alert('Failed to access microphone. Please grant permission.')
      isListeningRef.current = false
    }
  }

  const monitorSilence = (analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    let silenceCount = 0
    let recordingStartTime = Date.now()
    let hasDetectedSound = false
    let lastSoundTime = Date.now()

    const checkSilence = () => {
      if (!isListeningRef.current) return

      analyser.getByteFrequencyData(dataArray)

      // Calculate average frequency
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length

      // Check if we have sound
      if (average > SOUND_THRESHOLD) {
        silenceCount = 0
        hasDetectedSound = true
        lastSoundTime = Date.now()
        console.log('🎤 Sound detected:', average.toFixed(2))
      } else {
        silenceCount++
      }

      // Calculate time since last sound
      const timeSinceSoundMs = Date.now() - lastSoundTime
      const recordingDuration = Date.now() - recordingStartTime
      const silenceDuration = silenceCount * 100

      // Log every 1 second for debugging
      if (silenceCount % 10 === 0) {
        console.log(
          `⏱️ Recording: ${recordingDuration}ms | Silence: ${silenceDuration}ms | Sound detected: ${hasDetectedSound}`
        )
      }

      // Stop if:
      // 1. We've been recording for at least MIN_RECORDING_TIME
      // 2. We detected sound at some point
      // 3. We've had 3 seconds (SILENCE_THRESHOLD) of silence
      if (recordingDuration > MIN_RECORDING_TIME && hasDetectedSound && silenceDuration > SILENCE_THRESHOLD) {
        console.log(
          `✅ Stopping recording - 3 seconds of silence detected (${silenceDuration}ms total silence)`
        )
        stopListening()
        return
      }

      silenceTimeoutRef.current = setTimeout(checkSilence, 100)
    }

    checkSilence()
  }

  const stopListening = () => {
    console.log('Stopping listening...')
    isListeningRef.current = false

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setCallState((prev) => ({ ...prev, isRecording: false, isProcessing: true }))
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    const currentCallId = callIdRef.current
    if (!currentCallId) return

    try {
      console.log('📝 Starting audio processing...')
      console.log('Audio blob size:', audioBlob.size, 'bytes')

      // Step 1: Transcribe audio
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      console.log('🚀 Sending audio to backend for transcription...')
      const transcribeStartTime = Date.now()

      const transcribeResponse = await fetch(
        `${API_BASE}/telephony/public/test-call/${currentCallId}/transcribe`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const transcribeTime = Date.now() - transcribeStartTime
      console.log(`⏱️ Transcription took ${transcribeTime}ms`)

      if (!transcribeResponse.ok) {
        const contentType = transcribeResponse.headers.get('content-type')
        let error: any = {}

        if (contentType?.includes('application/json')) {
          try {
            error = await transcribeResponse.json()
          } catch {
            error = { message: `HTTP ${transcribeResponse.status}: ${transcribeResponse.statusText}` }
          }
        } else {
          const text = await transcribeResponse.text()
          error = { message: text || `HTTP ${transcribeResponse.status}` }
        }

        throw new Error(error.message || 'Failed to transcribe audio')
      }

      const contentType = transcribeResponse.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid transcription response format')
      }

      const transcribeData: TranscribeAudioResponse = await transcribeResponse.json()
      const userText = transcribeData.text || transcribeData.transcription || ''

      console.log('✅ Transcribed text:', userText)

      if (!userText.trim()) {
        console.log('⚠️ No speech detected in audio')
        setCallState((prev) => ({ ...prev, isProcessing: false }))
        // Continue listening if no speech detected
        setTimeout(() => startListening(), 500)
        return
      }

      // Add user message to transcript
      setCallState((prev) => ({
        ...prev,
        transcript: [
          ...prev.transcript,
          {
            speaker: 'user',
            text: userText,
            timestamp: new Date(),
          },
        ],
      }))

      console.log('🤖 Sending to AI for response...')
      const aiStartTime = Date.now()

      // Step 2: Get AI response
      const turnResponse = await fetch(
        `${API_BASE}/telephony/public/test-call/${currentCallId}/turn`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerText: userText }),
        }
      )

      const aiTime = Date.now() - aiStartTime
      console.log(`⏱️ AI response took ${aiTime}ms`)

      if (!turnResponse.ok) {
        const contentType = turnResponse.headers.get('content-type')
        let error: any = {}

        if (contentType?.includes('application/json')) {
          try {
            error = await turnResponse.json()
          } catch {
            error = { message: `HTTP ${turnResponse.status}: ${turnResponse.statusText}` }
          }
        } else {
          const text = await turnResponse.text()
          error = { message: text || `HTTP ${turnResponse.status}` }
        }

        throw new Error(error.message || 'Failed to get AI response')
      }

      const contentType2 = turnResponse.headers.get('content-type')
      if (!contentType2?.includes('application/json')) {
        throw new Error('Invalid AI response format')
      }

      const turnData: ProcessTurnResponse = await turnResponse.json()
      const agentReply = turnData.aiReply?.replyText || ''

      console.log('✅ AI Response:', agentReply)

      const shouldEndCall = /(goodbye|have a great day|thank you for calling|bye bye|talk to you soon|take care)/i.test(agentReply) || (/\b(bye|goodbye|thank you)\b/i.test(userText) && userText.length < 15)

      // Add agent response to transcript
      setCallState((prev) => ({
        ...prev,
        transcript: [
          ...prev.transcript,
          {
            speaker: 'agent',
            text: agentReply,
            timestamp: new Date(),
          },
        ],
        isProcessing: false,
      }))

      // Step 3: Play audio response
      if (turnData.aiReply?.audioBase64) {
        console.log('🔊 Playing audio response...')
        playAudioFromBase64(turnData.aiReply.audioBase64, shouldEndCall)
      } else {
        console.log('🔊 Using text-to-speech...')
        speakText(agentReply, shouldEndCall)
      }
    } catch (error) {
      console.error('❌ Failed to process audio:', error)
      setCallState((prev) => ({ ...prev, isProcessing: false }))
      // Continue listening on error
      setTimeout(() => startListening(), 1000)
    }
  }

  const playAudioFromBase64 = (base64Audio: string, isEnding = false) => {
    try {
      setCallState((prev) => ({ ...prev, isSpeaking: true }))

      const audioData = atob(base64Audio)
      const arrayBuffer = new ArrayBuffer(audioData.length)
      const view = new Uint8Array(arrayBuffer)
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i)
      }
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)

      if (audioRef.current) {
        audioRef.current.pause()
      }

      const audio = new Audio(url)
      audioRef.current = audio
      audio.play()

      audio.onended = () => {
        URL.revokeObjectURL(url)
        setCallState((prev) => ({ ...prev, isSpeaking: false }))
        if (isEnding) {
          endCall()
        } else {
          setTimeout(() => startListening(), 500)
        }
      }
    } catch (error) {
      console.error('Failed to play audio:', error)
      setCallState((prev) => ({ ...prev, isSpeaking: false }))
      if (isEnding) {
        endCall()
      } else {
        setTimeout(() => startListening(), 500)
      }
    }
  }

  const speakText = (text: string, isEnding = false) => {
    if ('speechSynthesis' in window) {
      setCallState((prev) => ({ ...prev, isSpeaking: true }))

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.onend = () => {
        setCallState((prev) => ({ ...prev, isSpeaking: false }))
        if (isEnding) {
          endCall()
        } else {
          setTimeout(() => startListening(), 500)
        }
      }
      window.speechSynthesis.speak(utterance)
    } else {
      console.log('Speech synthesis not supported, starting to listen directly...')
      if (isEnding) {
        endCall()
      } else {
        setTimeout(() => startListening(), 500)
      }
    }
  }

  const endCall = async () => {
    // Stop any ongoing speech or audio
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    const currentCallId = callIdRef.current
    if (!currentCallId) return

    try {
      isListeningRef.current = false

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }

      const response = await fetch(`${API_BASE}/telephony/public/test-call/${currentCallId}/complete`, {
        method: 'POST',
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let error: any = {}

        if (contentType?.includes('application/json')) {
          try {
            error = await response.json()
          } catch {
            error = { message: `HTTP ${response.status}` }
          }
        } else {
          error = { message: `HTTP ${response.status}` }
        }

        console.error('Failed to complete call:', error)
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      setCallState({
        callId: null,
        isActive: false,
        isRecording: false,
        isProcessing: false,
        isSpeaking: false,
        transcript: callState.transcript,
        businessName: '',
        greeting: '',
      })
      callIdRef.current = null
    } catch (error) {
      console.error('Failed to end call:', error)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      setCallState({
        callId: null,
        isActive: false,
        isRecording: false,
        isProcessing: false,
        isSpeaking: false,
        transcript: callState.transcript,
        businessName: '',
        greeting: '',
      })
      callIdRef.current = null
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Call Simulator</h1>
          <p className="text-gray-600">Natural conversation with automatic voice detection</p>
        </div>

        {/* Call Setup */}
        {!callState.isActive && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Start a Test Call</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Phone Number
                </label>
                <input
                  type="tel"
                  value={fromNumber}
                  onChange={(e) => setFromNumber(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Business Number
                </label>
                <input
                  type="tel"
                  value={toNumber}
                  onChange={(e) => setToNumber(e.target.value)}
                  placeholder="+919123456789"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 bg-white"
                />
              </div>
              <button
                onClick={startCall}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Start Call
              </button>
            </div>
          </div>
        )}

        {/* Active Call Interface */}
        {callState.isActive && (
          <div className="space-y-6">
            {/* Call Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {callState.businessName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {callState.isSpeaking
                      ? 'AI is speaking...'
                      : callState.isRecording
                        ? 'Listening...'
                        : callState.isProcessing
                          ? 'Processing...'
                          : 'Call in progress'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {callState.isRecording && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-600">Recording</span>
                    </div>
                  )}
                  {callState.isSpeaking && (
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span className="text-sm text-gray-600">Speaking</span>
                    </div>
                  )}
                  {!callState.isRecording && !callState.isSpeaking && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-600">Active</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex gap-4">
                {callState.isRecording && (
                  <button
                    onClick={stopListening}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all flex items-center justify-center gap-2 animate-pulse"
                  >
                    <MicOff className="w-5 h-5" />
                    Stop Speaking (or wait for silence)
                  </button>
                )}
                
                <button
                  onClick={endCall}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <PhoneOff className="w-5 h-5" />
                  End Call
                </button>
              </div>

              {/* Status Info */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <Mic className="w-4 h-4 inline mr-2" />
                  The microphone is always listening. Just speak naturally - the AI will respond automatically.
                </p>
              </div>
            </div>

            {/* Transcript */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Conversation</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {callState.transcript.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        entry.speaker === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold opacity-90">
                          {entry.speaker === 'user' ? 'You' : 'AI Agent'}
                        </span>
                        <span className="text-xs opacity-75">{formatTime(entry.timestamp)}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{entry.text}</p>
                    </div>
                  </div>
                ))}

                {callState.isRecording && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-700 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 animate-pulse" />
                        <span className="text-sm">Listening...</span>
                      </div>
                    </div>
                  </div>
                )}

                {callState.isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-700 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Processing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!callState.isActive && callState.transcript.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Enter your phone number and the business number</li>
              <li>Click "Start Call" to begin</li>
              <li>Listen to the AI greeting</li>
              <li>Speak naturally - the microphone is always listening</li>
              <li>The AI will automatically detect when you finish speaking</li>
              <li>The AI responds and waits for your next message</li>
              <li>Continue the conversation naturally</li>
              <li>Click "End Call" when finished</li>
            </ol>
          </div>
        )}

        {/* Previous Call Summary */}
        {!callState.isActive && callState.transcript.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">Call Completed</h3>
            <p className="text-green-800 mb-4">
              Your test call has ended. You can start a new call or review the transcript above.
            </p>
            <button
              onClick={() => {
                setCallState({
                  callId: null,
                  isActive: false,
                  isRecording: false,
                  isProcessing: false,
                  isSpeaking: false,
                  transcript: [],
                  businessName: '',
                  greeting: '',
                })
                callIdRef.current = null
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all"
            >
              Start New Call
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
