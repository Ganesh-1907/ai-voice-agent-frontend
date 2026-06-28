import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { Business, Feature, Product, ProductImage, ProductStatus, CallLead, Order, CallbackRequest, WhatsAppMessage } from '@/types'
import { apiRequest } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type DashboardStatsResponse = {
  totalBusinesses: number
  totalProducts: number
  totalCalls: number
  totalOrders: number
}

type ProductApiResponse = {
  id: string
  businessId: string
  name: string
  price: number | string
  status?: ProductStatus
  stockQuantity?: number
  primaryImageUrl?: string | null
  images?: Array<{
    id: string
    productId: string
    imageUrl: string
    altText?: string | null
    isPrimary?: boolean
    sortOrder?: number
  }>
  features?: Array<{ key?: string; value?: string; featureName?: string; featureValue?: string }>
  createdAt: string
}

type ProductMutationInput = {
  name: string
  price: number
  businessId: string
  features: Feature[]
  status?: ProductStatus
  stockQuantity?: number
  imageUrl?: string
  imageAltText?: string
}

type ProductUpdateInput = Partial<ProductMutationInput>

function buildProductSlug(name: string, suffix: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product'
  return `${base}-${suffix}`
}

function mapProductImage(image: NonNullable<ProductApiResponse['images']>[number], fallbackProductId: string): ProductImage {
  return {
    id: String(image.id),
    productId: String(image.productId ?? fallbackProductId),
    imageUrl: image.imageUrl,
    altText: image.altText ?? undefined,
    isPrimary: image.isPrimary ?? false,
    sortOrder: image.sortOrder ?? 0,
  }
}

function mapProductResponse(product: ProductApiResponse, businessName: string): Product {
  return {
    id: String(product.id),
    name: product.name,
    price: Number(product.price),
    businessId: String(product.businessId),
    businessName,
    features: Array.isArray(product.features)
      ? product.features.map((feature) => ({
          key: feature.key ?? feature.featureName ?? '',
          value: feature.value ?? feature.featureValue ?? '',
        }))
      : [],
    status: product.status ?? 'available',
    stockQuantity: Number(product.stockQuantity ?? 0),
    primaryImageUrl: product.primaryImageUrl ?? null,
    images: Array.isArray(product.images)
      ? product.images.map((image) => mapProductImage(image, String(product.id)))
      : [],
    createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : new Date().toISOString(),
  }
}

async function uploadProductImage(
  token: string,
  businessId: string,
  productId: string,
  imageUrl: string | undefined,
  imageAltText: string | undefined,
  productName: string,
) {
  if (!imageUrl) {
    return
  }

  await apiRequest(`/businesses/${businessId}/products/${productId}/images`, {
    method: 'POST',
    token,
    body: JSON.stringify({
      imageUrl,
      altText: imageAltText?.trim() || productName,
      isPrimary: true,
      sortOrder: 0,
    }),
  })
}

interface DbState {
  businesses: Business[]
  products: Product[]
  callLeads: CallLead[]
  orders: Order[]
  callbackRequests: CallbackRequest[]
  whatsappMessages: WhatsAppMessage[]
  whatsappConfigured: boolean
  dashboardStats: DashboardStatsResponse | null
  hydrateAll: () => Promise<void>

  // Business CRUD
  addBusiness: (business: Business) => Promise<void>
  updateBusiness: (id: string, data: Partial<Business>) => Promise<void>
  deleteBusiness: (id: string) => Promise<void>

  // Product CRUD
  addProduct: (product: ProductMutationInput) => Promise<void>
  updateProduct: (id: string, data: ProductUpdateInput) => Promise<void>
  deleteProduct: (id: string) => Promise<void>

  // Call Lead operations
  updateCallLead: (id: string, data: Partial<CallLead>) => Promise<void>

  // Order operations
  updateOrder: (id: string, data: Partial<Order>) => Promise<void>

  // Callback Request operations
  updateCallbackRequest: (id: string, data: Partial<CallbackRequest>) => Promise<void>

  // WhatsApp operations
  hydrateWhatsAppMessages: () => Promise<void>
  resendWhatsAppMessage: (businessId: string, messageId: string) => Promise<void>

  // Get business name by id
  getBusinessName: (id: string) => string
}

export const useDbStore = create<DbState>()(
  persist(
    (set, get) => ({
      businesses: [],
      products: [],
      callLeads: [],
      orders: [],
      callbackRequests: [],
      whatsappMessages: [],
      whatsappConfigured: true,
      dashboardStats: null,
      hydrateAll: async () => {
        const { token, user } = useAuthStore.getState()
        if (!token || !user) return

        const businessScope = user.role === 'admin' && user.businessId ? `?businessId=${user.businessId}` : ''
        const [businessesRaw, callLeadsRaw, ordersRaw, callbacksRaw, stats] = await Promise.all([
          apiRequest<any[]>('/businesses', { token }),
          apiRequest<any[]>(`/call-leads${businessScope}`, { token }),
          apiRequest<any[]>(`/orders${businessScope}`, { token }),
          apiRequest<any[]>(`/callbacks${businessScope}`, { token }),
          apiRequest<DashboardStatsResponse>(`/dashboard/stats${businessScope}`, { token }),
        ])

        const businesses = businessesRaw.map((b) => ({
          id: b.id,
          name: b.name,
          ownerName: b.name,
          contact: b.businessPhoneNumber,
          email: b.primaryEmail ?? '',
          plan: (b.planCode === 'enterprise' ? 'enterprise' : b.planCode === 'professional' ? 'professional' : 'basic') as
            | 'basic'
            | 'professional'
            | 'enterprise',
          status: b.isActive ? 'active' : 'inactive',
          serviceType: b.serviceType ?? undefined,
          forwardingNumber: b.virtualPhoneNumber ?? undefined,
          address: b.address ?? undefined,
          googleMapLink: b.googleMapLink ?? undefined,
          createdAt: new Date(b.createdAt).toISOString(),
        })) as Business[]

        const businessById = new Map(businesses.map((b) => [b.id, b.name]))
        const productPromises = businesses.map((b) => apiRequest<any[]>(`/businesses/${b.id}/products`, { token }))
        const productResult = await Promise.all(productPromises)
        const products = productResult.flatMap((items, index) =>
          items.map((product) => mapProductResponse(product as ProductApiResponse, businesses[index].name)),
        )

        set({
          businesses,
          products,
          callLeads: callLeadsRaw.map((l) => ({
            id: l.id,
            fromNumber: l.fromNumber,
            businessId: l.businessId,
            businessName: businessById.get(l.businessId) ?? 'Unknown Business',
            status: l.status,
            transcript: l.transcript ?? undefined,
            summary: l.summary ?? undefined,
            duration: l.duration ?? 0,
            createdAt: l.createdAt,
          })),
          orders: ordersRaw.map((o) => ({
            id: o.id,
            customerNumber: o.customerNumber,
            businessId: o.businessId,
            businessName: businessById.get(o.businessId) ?? 'Unknown Business',
            productId: o.productId ?? '',
            productName: products.find((p) => p.id === o.productId)?.name ?? 'Unknown Product',
            status: o.status,
            summary: o.summary ?? undefined,
            transcript: o.transcript ?? undefined,
            createdAt: o.createdAt,
          })),
          callbackRequests: callbacksRaw.map((c) => ({
            id: c.id,
            customerNumber: c.customerNumber,
            businessId: c.businessId,
            businessName: businessById.get(c.businessId) ?? 'Unknown Business',
            status: c.status === 'not_called' ? 'not-called' : 'called',
            summary: c.summary ?? undefined,
            transcript: c.transcript ?? undefined,
            createdAt: c.createdAt,
          })),
          dashboardStats: stats,
        })

        // Hydrate WhatsApp messages in parallel (non-blocking)
        get().hydrateWhatsAppMessages().catch(() => {})
      },

      // Business CRUD
      addBusiness: async (business) => {
        const { token } = useAuthStore.getState()
        if (!token) return
        const slug = business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        await apiRequest('/businesses', {
          method: 'POST',
          token,
          body: JSON.stringify({
            name: business.name,
            slug: `${slug}-${Date.now()}`,
            businessPhoneNumber: business.contact,
            virtualPhoneNumber: business.forwardingNumber ?? business.contact,
            planCode: business.plan === 'professional' ? 'pro' : business.plan === 'enterprise' ? 'pro' : 'starter',
            settings: {
              address: business.address,
              googleMapLink: business.googleMapLink,
              primaryEmail: business.email,
            },
          }),
        })
        await get().hydrateAll()
      },
      updateBusiness: async (id, data) => {
        const { token } = useAuthStore.getState()
        if (!token) return
        const current = get().businesses.find((b) => b.id === id)
        if (!current) return
        const next = { ...current, ...data }
        await apiRequest(`/businesses/${id}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({
            name: next.name,
            slug: next.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            businessPhoneNumber: next.contact,
            virtualPhoneNumber: next.forwardingNumber ?? next.contact,
            planCode: next.plan === 'professional' ? 'pro' : next.plan === 'enterprise' ? 'pro' : 'starter',
            settings: {
              address: next.address,
              googleMapLink: next.googleMapLink,
              primaryEmail: next.email,
            },
          }),
        })
        await get().hydrateAll()
      },
      deleteBusiness: async (id) => {
        set((state) => ({
          businesses: state.businesses.filter((b) => b.id !== id),
        }))
      },

      // Product CRUD
      addProduct: async (product) => {
        const { token } = useAuthStore.getState()
        if (!token) return
        const business = get().businesses.find((b) => b.id === product.businessId)
        const serviceTypeToCategory: Record<string, string> = {
          car_dealer: 'car',
          appliance_store: 'other',
          electronics_store: 'other',
          restaurant: 'restaurant',
          fashion: 'fashion',
          furniture: 'furniture',
        }
        const category = business?.serviceType ? (serviceTypeToCategory[business.serviceType] ?? 'other') : 'other'
        const created = await apiRequest<ProductApiResponse>(`/businesses/${product.businessId}/products`, {
          method: 'POST',
          token,
          body: JSON.stringify({
            name: product.name,
            slug: buildProductSlug(product.name, String(Date.now())),
            price: product.price,
            category,
            status: product.status ?? 'available',
            stockQuantity: product.stockQuantity ?? 1,
            features: product.features,
          }),
        })
        await uploadProductImage(
          token,
          product.businessId,
          String(created.id),
          product.imageUrl,
          product.imageAltText,
          product.name,
        )
        await get().hydrateAll()
      },
      updateProduct: async (id, data) => {
        const { token } = useAuthStore.getState()
        if (!token) return
        const current = get().products.find((p) => p.id === id)
        if (!current) return
        const next = { ...current, ...data }
        await apiRequest(`/businesses/${next.businessId}/products/${id}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({
            name: next.name,
            slug: buildProductSlug(next.name, id),
            price: next.price,
            category: 'other',
            status: next.status ?? 'available',
            stockQuantity: next.stockQuantity ?? 1,
            features: next.features ?? [],
          }),
        })
        await uploadProductImage(
          token,
          next.businessId,
          id,
          data.imageUrl,
          data.imageAltText,
          next.name,
        )
        await get().hydrateAll()
      },
      deleteProduct: async (id) => {
        const { token } = useAuthStore.getState()
        if (!token) return
        const current = get().products.find((p) => p.id === id)
        if (!current) return
        await apiRequest(`/businesses/${current.businessId}/products/${id}`, {
          method: 'DELETE',
          token,
        })
        await get().hydrateAll()
      },

      // Call Lead operations
      updateCallLead: async (id, data) => {
        const { token } = useAuthStore.getState()
        if (!token) return
        if (data.status) {
          await apiRequest(`/call-leads/${id}/status`, {
            method: 'PATCH',
            token,
            body: JSON.stringify({ status: data.status }),
          })
        }
        await get().hydrateAll()
      },

      // Order operations
      updateOrder: async (id, data) => {
        const { token } = useAuthStore.getState()
        if (!token || !data.status) return
        await apiRequest(`/orders/${id}/status`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({ status: data.status }),
        })
        await get().hydrateAll()
      },

      // Callback Request operations
      updateCallbackRequest: async (id, data) => {
        const { token } = useAuthStore.getState()
        if (!token || !data.status) return
        await apiRequest(`/callbacks/${id}/status`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({ status: data.status === 'not-called' ? 'not_called' : 'called' }),
        })
        await get().hydrateAll()
      },

      // Helper
      getBusinessName: (id) => {
        const business = get().businesses.find((b) => b.id === id)
        return business?.name || 'Unknown Business'
      },

      // WhatsApp operations
      hydrateWhatsAppMessages: async () => {
        const { token, user } = useAuthStore.getState()
        if (!token || !user) return

        const businesses = get().businesses
        if (businesses.length === 0) return

        const targetBusinesses = user.role === 'admin' && user.businessId
          ? businesses.filter((b) => b.id === user.businessId)
          : businesses

        const allMessages: WhatsAppMessage[] = []
        let isConfigured = true

        for (const biz of targetBusinesses) {
          try {
            const msgs = await apiRequest<WhatsAppMessage[]>(
              `/businesses/${biz.id}/messaging/whatsapp/history?limit=100`,
              { token },
            )
            allMessages.push(...msgs)

            // Since config is global right now, checking the first one is enough, but we can check any
            const config = await apiRequest<{ configured: boolean }>(
              `/businesses/${biz.id}/messaging/whatsapp/config`,
              { token },
            )
            isConfigured = config.configured
          } catch {
            // Individual business fetch failure is non-critical
          }
        }

        allMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        set({ whatsappMessages: allMessages, whatsappConfigured: isConfigured })
      },

      resendWhatsAppMessage: async (businessId, messageId) => {
        const { token } = useAuthStore.getState()
        if (!token) return
        await apiRequest(`/businesses/${businessId}/messaging/whatsapp/${messageId}/resend`, {
          method: 'POST',
          token,
        })
        await get().hydrateWhatsAppMessages()
      },
    }),
    {
      name: 'callai-db',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        businesses: state.businesses,
        products: state.products,
        callLeads: state.callLeads,
        orders: state.orders,
        callbackRequests: state.callbackRequests,
        whatsappMessages: state.whatsappMessages,
        dashboardStats: state.dashboardStats,
      }),
    }
  )
)
