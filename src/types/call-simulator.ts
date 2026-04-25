export interface TranscriptEntry {
  speaker: 'user' | 'agent'
  text: string
  timestamp: Date
}

export interface CallState {
  callId: string | null
  isActive: boolean
  isRecording: boolean
  isProcessing: boolean
  isSpeaking: boolean
  transcript: TranscriptEntry[]
  businessName: string
  greeting: string
}

export interface StartCallRequest {
  fromNumber: string
  toNumber: string
}

export interface StartCallResponse {
  callId: string
  businessId: string
  businessName: string
  greeting: string
}

export interface TranscribeAudioResponse {
  text: string
  transcription?: string
  duration?: number
}

export interface ProcessTurnRequest {
  customerText: string
}

export interface AIReply {
  replyText: string
  audioBase64?: string
  inputText?: string
}

export interface ProcessTurnResponse {
  callId: string
  businessId: string
  businessName: string
  customerText: string
  aiReply: AIReply
  greeting?: string
}

export interface CompleteCallResponse {
  call: {
    id: string
    status: string
    transcript?: string
    summary?: string
  }
  lead?: {
    id: string
    name?: string
    phone?: string
    intent?: string
  }
  update?: {
    id: string
    summary: string
  }
  whatsappDisabled?: boolean
}
