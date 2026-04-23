import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { Business, Product, CallLead, Order, CallbackRequest } from '@/types'
import {
  dummyBusinesses,
  dummyProducts,
  dummyCallLeads,
  dummyOrders,
  dummyCallbackRequests,
} from './dummy'

interface DbState {
  businesses: Business[]
  products: Product[]
  callLeads: CallLead[]
  orders: Order[]
  callbackRequests: CallbackRequest[]

  // Business CRUD
  addBusiness: (business: Business) => void
  updateBusiness: (id: string, data: Partial<Business>) => void
  deleteBusiness: (id: string) => void

  // Product CRUD
  addProduct: (product: Product) => void
  updateProduct: (id: string, data: Partial<Product>) => void
  deleteProduct: (id: string) => void

  // Call Lead operations
  updateCallLead: (id: string, data: Partial<CallLead>) => void

  // Order operations
  updateOrder: (id: string, data: Partial<Order>) => void

  // Callback Request operations
  updateCallbackRequest: (id: string, data: Partial<CallbackRequest>) => void

  // Get business name by id
  getBusinessName: (id: string) => string
}

export const useDbStore = create<DbState>()(
  persist(
    (set, get) => ({
      businesses: dummyBusinesses,
      products: dummyProducts,
      callLeads: dummyCallLeads,
      orders: dummyOrders,
      callbackRequests: dummyCallbackRequests,

      // Business CRUD
      addBusiness: (business) =>
        set((state) => ({ businesses: [...state.businesses, business] })),
      updateBusiness: (id, data) =>
        set((state) => ({
          businesses: state.businesses.map((b) =>
            b.id === id ? { ...b, ...data } : b
          ),
        })),
      deleteBusiness: (id) =>
        set((state) => ({
          businesses: state.businesses.filter((b) => b.id !== id),
        })),

      // Product CRUD
      addProduct: (product) =>
        set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, data) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      // Call Lead operations
      updateCallLead: (id, data) =>
        set((state) => ({
          callLeads: state.callLeads.map((l) =>
            l.id === id ? { ...l, ...data } : l
          ),
        })),

      // Order operations
      updateOrder: (id, data) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, ...data } : o
          ),
        })),

      // Callback Request operations
      updateCallbackRequest: (id, data) =>
        set((state) => ({
          callbackRequests: state.callbackRequests.map((r) =>
            r.id === id ? { ...r, ...data } : r
          ),
        })),

      // Helper
      getBusinessName: (id) => {
        const business = get().businesses.find((b) => b.id === id)
        return business?.name || 'Unknown Business'
      },
    }),
    {
      name: 'callai-db',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
