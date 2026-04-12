export type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export type Business = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  businessPhoneNumber: string;
  virtualPhoneNumber?: string | null;
  exotelNumber?: string | null;
  serviceType?: "car_dealer" | "appliance_store" | "electronics_store" | "mixed_inventory" | "other";
  primaryEmail?: string | null;
  primaryMobile?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  isActive?: boolean;
  planCode: "starter" | "growth" | "pro";
  settings: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type Faq = {
  id: string;
  businessId?: string;
  question: string;
  answer: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ServiceEntry = {
  id: string;
  businessId?: string;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CallRecord = {
  id: string;
  businessId?: string;
  fromNumber: string;
  toNumber: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  transcript?: string | null;
  summary?: string | null;
  durationSeconds?: number | null;
  createdAt: string;
  updatedAt?: string;
  meta: Record<string, unknown>;
};

export type CallsAnalytics = {
  totalCalls: number;
  completedCalls: number;
  inProgressCalls: number;
  failedCalls: number;
  averageDurationSeconds: number;
  recentCalls: CallRecord[];
};

export type TestCallStartResponse = {
  callId: string;
  businessId: string;
  businessName: string;
  greeting: string;
  note: string;
};

export type TestCallTurnResponse = {
  callId: string;
  businessId: string;
  businessName: string;
  greeting: string;
  customerText: string;
  aiReply: {
    inputText: string;
    replyText: string;
    audioBase64: string | null;
  };
};

export type PublicCallStartResponse = {
  callId: string;
  businessId: string;
  businessName: string;
  greeting: string;
};

export type Lead = {
  id: string;
  businessId?: string;
  callId?: string;
  name?: string | null;
  phone: string;
  intent?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
};

export type UserRecord = {
  id: string;
  businessId: string;
  email: string;
  mobile: string;
  name: string;
  role: "owner" | "admin" | "staff";
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description?: string | null;
  category: "car" | "bike" | "scooter" | "fridge" | "ac" | "washing_machine" | "tv" | "mobile" | "furniture" | "other";
  condition: "new" | "used" | "refurbished";
  status: "draft" | "available" | "reserved" | "sold" | "inactive";
  sku?: string | null;
  brand?: string | null;
  model?: string | null;
  variant?: string | null;
  price: string;
  discountPrice?: string | null;
  currency: string;
  stockQuantity: number;
  manufactureYear?: number | null;
  registrationYear?: number | null;
  purchaseYear?: number | null;
  mileageKm?: number | null;
  fuelType?: "petrol" | "diesel" | "electric" | "hybrid" | "cng" | "lpg" | "other" | null;
  transmission?: "manual" | "automatic" | "semi_automatic" | "other" | null;
  color?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  conditionNotes?: string | null;
  searchTags: string[];
  specifications: Record<string, unknown>;
  isFeatured: boolean;
  soldAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductImage = {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BusinessUpdate = {
  id: string;
  businessId: string;
  callId: string;
  fromNumber: string;
  customerName?: string;
  customerMobile?: string;
  summary: string;
  requestType: "order" | "preorder" | "book_table" | "callback_request" | "general";
  status: "pending" | "approved" | "rejected" | "callback_scheduled" | "callback_completed";
  createdAt: string;
  approvedAt?: string;
  approvalNote?: string;
  messagedToCustomer?: boolean;
  messagedAt?: string;
  calledBack?: boolean;
  calledBackAt?: string;
};

export type Plan = {
  code: "starter" | "growth" | "pro";
  priceInr: number;
  includedCalls: number;
  extraCallPriceInr: number;
  estimatedProfitRangeInr: [number, number];
};
