export type UserRole = 'super-admin' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  businessId?: string
  phone?: string
  avatar?: string
}

export interface Business {
  id: string
  name: string
  ownerName: string
  contact: string
  email: string
  plan: 'basic' | 'professional' | 'enterprise'
  status: 'active' | 'paused' | 'inactive'
  serviceType?: string
  forwardingNumber?: string
  address?: string
  googleMapLink?: string
  createdAt: string
}

export type ProductStatus = 'draft' | 'active' | 'available' | 'reserved' | 'sold' | 'inactive'

export interface ProductImage {
  id: string
  productId: string
  imageUrl: string
  altText?: string
  isPrimary?: boolean
  sortOrder?: number
}

export interface Product {
  id: string
  name: string
  price: number
  businessId: string
  businessName?: string
  features: Feature[]
  status?: ProductStatus
  stockQuantity?: number
  primaryImageUrl?: string | null
  images?: ProductImage[]
  createdAt: string
}

export interface Feature {
  key: string
  value: string
}

export interface CallLead {
  id: string
  fromNumber: string
  businessId: string
  businessName: string
  status: 'read' | 'unread'
  transcript?: string
  summary?: string
  duration: number
  createdAt: string
}

export interface Order {
  id: string
  customerNumber: string
  businessId: string
  businessName: string
  productId: string
  productName: string
  status: 'pending' | 'accepted' | 'rejected'
  summary?: string
  transcript?: string
  createdAt: string
}

export interface CallbackRequest {
  id: string
  customerNumber: string
  businessId: string
  businessName: string
  status: 'called' | 'not-called'
  summary?: string
  transcript?: string
  createdAt: string
}

export interface DashboardStats {
  totalBusinesses?: number
  totalProducts?: number
  totalCalls: number
  totalOrders: number
  callsRemaining?: number
  planInfo?: string
}

export type WhatsAppMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed'

export interface WhatsAppMessage {
  id: string
  businessId: string
  callId?: string
  customerPhone: string
  direction: 'inbound' | 'outbound'
  messageType: 'text' | 'interactive' | 'image'
  body?: string
  buttonPayload?: Record<string, unknown>
  providerMessageId?: string
  status: WhatsAppMessageStatus
  errorMessage?: string
  createdAt: string
  updatedAt: string
}
