import type {
  AuthResponse,
  Business,
  CallRecord,
  CallsAnalytics,
  Faq,
  Lead,
  Plan,
  PublicCallStartResponse,
  Product,
  ProductImage,
  ServiceEntry,
  BusinessUpdate,
  TestCallStartResponse,
  TestCallTurnResponse,
  UserRecord,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private token: string | null = localStorage.getItem("ai-call-token");

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("ai-call-token", token);
    } else {
      localStorage.removeItem("ai-call-token");
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const isFormData = options?.body instanceof FormData;

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(options?.headers ?? {}),
      },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        typeof payload.message === "string"
          ? payload.message
          : Array.isArray(payload.message)
            ? payload.message.join(", ")
          : typeof payload.error === "string"
            ? payload.error
            : "Request failed";
      throw new ApiError(message, response.status);
    }

    return payload as T;
  }

  register(input: { name: string; email: string; password: string }) {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  login(input: { email: string; password: string }) {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  resetPasswordByEmail(input: { email: string; newPassword: string }) {
    return this.request<{ updated: boolean; userId: string; email: string; updatedAt: string }>(
      "/auth/dev/reset-password-by-email",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  }

  me() {
    return this.request<{ id: string; name: string; email: string }>("/auth/me");
  }

  health() {
    return this.request<{ ok: boolean; service: string; timestamp: string }>("/health");
  }

  listBusinesses() {
    return this.request<Business[]>("/businesses");
  }

  createBusiness(input: {
    name: string;
    slug: string;
    description?: string;
    businessPhoneNumber: string;
    virtualPhoneNumber?: string;
    planCode: "starter" | "growth" | "pro";
    settings?: {
      serviceType?: "car_dealer" | "appliance_store" | "electronics_store" | "mixed_inventory" | "other";
      primaryEmail?: string;
      primaryMobile?: string;
      city?: string;
      state?: string;
      address?: string;
      [key: string]: unknown;
    };
  }) {
    return this.request<Business>("/businesses", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  getBusiness(businessId: string) {
    return this.request<Business>(`/businesses/${businessId}`);
  }

  listBusinessUsers(businessId: string) {
    return this.request<UserRecord[]>(`/businesses/${businessId}/users`);
  }

  listProducts(businessId: string) {
    return this.request<Product[]>(`/businesses/${businessId}/products`);
  }

  createProduct(
    businessId: string,
    input: {
      name: string;
      slug: string;
      description?: string;
      category: "car" | "bike" | "scooter" | "fridge" | "ac" | "washing_machine" | "tv" | "mobile" | "furniture" | "other";
      price: number;
      condition?: "new" | "used" | "refurbished";
      status?: "draft" | "available" | "reserved" | "sold" | "inactive";
      sku?: string;
      brand?: string;
      model?: string;
      variant?: string;
      discountPrice?: number;
      stockQuantity?: number;
      color?: string;
      locationCity?: string;
      locationState?: string;
      conditionNotes?: string;
    },
  ) {
    return this.request<Product>(`/businesses/${businessId}/products`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  listProductImages(businessId: string, productId: string) {
    return this.request<ProductImage[]>(`/businesses/${businessId}/products/${productId}/images`);
  }

  addProductImage(
    businessId: string,
    productId: string,
    input: { imageUrl: string; altText?: string; isPrimary?: boolean; sortOrder?: number },
  ) {
    return this.request<ProductImage>(`/businesses/${businessId}/products/${productId}/images`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  listFaqs(businessId: string) {
    return this.request<Faq[]>(`/businesses/${businessId}/knowledge-base/faqs`);
  }

  addFaq(businessId: string, input: { question: string; answer: string }) {
    return this.request<Faq>(`/businesses/${businessId}/knowledge-base/faqs`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  listServices(businessId: string) {
    return this.request<ServiceEntry[]>(`/businesses/${businessId}/knowledge-base/services`);
  }

  addService(businessId: string, input: { title: string; content: string }) {
    return this.request<ServiceEntry>(`/businesses/${businessId}/knowledge-base/services`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  getCallsAnalytics(businessId: string) {
    return this.request<CallsAnalytics>(`/businesses/${businessId}/calls/analytics/overview`);
  }

  listCalls(businessId: string) {
    return this.request<CallRecord[]>(`/businesses/${businessId}/calls`);
  }

  getCall(businessId: string, callId: string) {
    return this.request<CallRecord>(`/businesses/${businessId}/calls/${callId}`);
  }

  listLeads(businessId: string) {
    return this.request<Lead[]>(`/businesses/${businessId}/leads`);
  }

  createLead(
    businessId: string,
    input: { name?: string; phone: string; intent?: string; notes?: string },
  ) {
    return this.request<Lead>(`/businesses/${businessId}/leads`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  listPlans() {
    return this.request<Plan[]>("/plans");
  }

  startTestCall(businessId: string) {
    return this.request<TestCallStartResponse>("/telephony/test-call/start", {
      method: "POST",
      body: JSON.stringify({ businessId }),
    });
  }

  startPublicCall(input: { fromNumber: string; toNumber: string }) {
    return this.request<PublicCallStartResponse>("/telephony/public/test-call/start", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  publicCallTurn(callId: string, customerText: string) {
    return this.request<TestCallTurnResponse>(`/telephony/public/test-call/${callId}/turn`, {
      method: "POST",
      body: JSON.stringify({ customerText }),
    });
  }

  publicCompleteCall(callId: string) {
    return this.request<{ call: CallRecord }>(`/telephony/public/test-call/${callId}/complete`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  transcribePublicCallAudio(callId: string, audioBlob: Blob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "public-test-call.webm");

    return this.request<{ text: string; error?: string; statusCode?: number }>(
      `/telephony/public/test-call/${callId}/transcribe`,
      {
        method: "POST",
        body: formData,
      },
    );
  }

  testCallTurn(callId: string, businessId: string, customerText: string) {
    return this.request<TestCallTurnResponse>(`/telephony/test-call/${callId}/turn`, {
      method: "POST",
      body: JSON.stringify({ businessId, customerText }),
    });
  }

  completeTestCall(callId: string, input: { businessId?: string; customerPhone?: string; notes?: string }) {
    return this.request<{ call: CallRecord }>(`/telephony/test-call/${callId}/complete`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  transcribeTestCallAudio(businessId: string, audioBlob: Blob) {
    const formData = new FormData();
    formData.append("businessId", businessId);
    formData.append("audio", audioBlob, "test-call.webm");

    return this.request<{ text: string; error?: string; statusCode?: number }>("/telephony/test-call/transcribe", {
      method: "POST",
      body: formData,
    });
  }

  aiReply(businessId: string, customerText: string) {
    return this.request<{ inputText: string; replyText: string; audioBase64: string | null }>(`/businesses/${businessId}/ai/reply`, {
      method: "POST",
      body: JSON.stringify({ customerText }),
    });
  }

  listUpdates(businessId: string) {
    return this.request<BusinessUpdate[]>(`/businesses/${businessId}/updates`);
  }

  approveUpdate(businessId: string, updateId: string, input: { approvalNote?: string }) {
    return this.request<{ update: BusinessUpdate }>(`/businesses/${businessId}/updates/${updateId}/approve`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  markCallbackCompleted(businessId: string, updateId: string, input?: { note?: string }) {
    return this.request<{ id: string }>(`/businesses/${businessId}/updates/${updateId}/callback-completed`, {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    });
  }
}

export const api = new ApiClient();
