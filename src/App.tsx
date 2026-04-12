import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { ApiError, api } from "./api";
import { AnalyticsPanel } from "./components/AnalyticsPanel";
import { AiPlaygroundPanel } from "./components/AiPlaygroundPanel";
import { AuthPanel } from "./components/AuthPanel";
import { BusinessesPanel } from "./components/BusinessesPanel";
import { BusinessSetupPanel } from "./components/BusinessSetupPanel";
import { DevToolsPanel } from "./components/DevToolsPanel";
import { HealthPanel } from "./components/HealthPanel";
import { KnowledgeBasePanel } from "./components/KnowledgeBasePanel";
import { LeadsPanel } from "./components/LeadsPanel";
import { MessagingPanel } from "./components/MessagingPanel";
import { PlansPanel } from "./components/PlansPanel";
import { PublicCallSimulatorPanel } from "./components/PublicCallSimulatorPanel";
import { SchemaDataPanel } from "./components/SchemaDataPanel";
import { TestCallPanel } from "./components/TestCallPanel";
import { UpdatesPanel } from "./components/UpdatesPanel";
import type { Business, BusinessUpdate, CallRecord, CallsAnalytics, Faq, Lead, Plan, Product, ProductImage, ServiceEntry, UserRecord } from "./types";

type User = {
  id: string;
  name: string;
  email: string;
};

export default function App() {
  return (
    <BrowserRouter>
      <RoutedApp />
    </BrowserRouter>
  );
}

function RoutedApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [analytics, setAnalytics] = useState<CallsAnalytics | null>(null);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [health, setHealth] = useState<{ ok: boolean; service: string; timestamp: string } | null>(null);
  const [businessUsers, setBusinessUsers] = useState<UserRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [updates, setUpdates] = useState<BusinessUpdate[]>([]);
  const [status, setStatus] = useState("Loading...");

  const businessIdFromPath = extractBusinessId(location.pathname);
  const selectedBusiness = useMemo(
    () => businesses.find((business) => business.id === businessIdFromPath) ?? null,
    [businesses, businessIdFromPath],
  );

  useEffect(() => {
    void loadPlans();
    void loadHealth();
  }, []);

  useEffect(() => {
    if (!api.getToken()) {
      setStatus("Please sign in");
      return;
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!businessIdFromPath || !user || businessIdFromPath === "new") {
      return;
    }

    void Promise.all([
      loadKnowledgeBase(businessIdFromPath),
      loadAnalytics(businessIdFromPath),
      loadCalls(businessIdFromPath),
      loadLeads(businessIdFromPath),
      loadBusinessUsers(businessIdFromPath),
      loadProducts(businessIdFromPath),
      loadUpdates(businessIdFromPath),
    ]).catch(handleAsyncError);
  }, [businessIdFromPath, user]);

  async function loadPlans() {
    try {
      const planCatalog = await api.listPlans();
      setPlans(planCatalog);
    } catch (error) {
      handleAsyncError(error);
    }
  }

  async function loadHealth() {
    try {
      const healthResponse = await api.health();
      setHealth(healthResponse);
    } catch (error) {
      handleAsyncError(error);
    }
  }

  async function bootstrap() {
    try {
      const me = await api.me();
      setUser(me);
      await refreshBusinesses();
      setStatus("Ready");
    } catch (error) {
      handleAsyncError(error);
    }
  }

  async function refreshBusinesses() {
    const businessList = await api.listBusinesses();
    setBusinesses(businessList);
  }

  async function loadKnowledgeBase(businessId: string) {
    const [faqItems, serviceItems] = await Promise.all([api.listFaqs(businessId), api.listServices(businessId)]);
    setFaqs(faqItems);
    setServices(serviceItems);
  }

  async function loadAnalytics(businessId: string) {
    const overview = await api.getCallsAnalytics(businessId);
    setAnalytics(overview);
  }

  async function loadCalls(businessId: string) {
    const items = await api.listCalls(businessId);
    setCalls(items);
    const callId = extractCallId(location.pathname);
    const matchedCall = callId ? items.find((item) => item.id === callId) ?? null : items[0] ?? null;
    setSelectedCall(matchedCall);
  }

  async function loadLeads(businessId: string) {
    const items = await api.listLeads(businessId);
    setLeads(items);
  }

  async function loadBusinessUsers(businessId: string) {
    const items = await api.listBusinessUsers(businessId);
    setBusinessUsers(items);
  }

  async function loadProducts(businessId: string) {
    const items = await api.listProducts(businessId);
    setProducts(items);
    if (!selectedProductId) {
      setSelectedProductId(items[0]?.id ?? null);
      if (items[0]?.id) {
        const images = await api.listProductImages(businessId, items[0].id);
        setProductImages(images);
      } else {
        setProductImages([]);
      }
      return;
    }

    const stillExists = items.some((item) => item.id === selectedProductId);
    if (!stillExists) {
      const next = items[0]?.id ?? null;
      setSelectedProductId(next);
      if (next) {
        const images = await api.listProductImages(businessId, next);
        setProductImages(images);
      } else {
        setProductImages([]);
      }
      return;
    }

    const images = await api.listProductImages(businessId, selectedProductId);
    setProductImages(images);
  }

  async function loadUpdates(businessId: string) {
    const items = await api.listUpdates(businessId);
    setUpdates(items);
  }

  async function handleLogin(input: { email: string; password: string }) {
    const response = await api.login(input);
    api.setToken(response.accessToken);
    setUser(response.user);
    await refreshBusinesses();
    navigate("/dashboard", { replace: true });
  }

  async function handleRegister(input: { name: string; email: string; password: string }) {
    const response = await api.register(input);
    api.setToken(response.accessToken);
    setUser(response.user);
    await refreshBusinesses();
    navigate("/dashboard", { replace: true });
  }

  async function handleResetPassword(input: { email: string; newPassword: string }) {
    const response = await api.resetPasswordByEmail(input);
    return { email: response.email };
  }

  async function handleCreateBusiness(input: {
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
    const createdBusiness = await api.createBusiness(input);
    await refreshBusinesses();
    navigate(`/businesses/${createdBusiness.id}`, { replace: true });
  }

  async function handleAddFaq(input: { question: string; answer: string }) {
    if (!selectedBusiness) {
      return;
    }
    await api.addFaq(selectedBusiness.id, input);
    await loadKnowledgeBase(selectedBusiness.id);
  }

  async function handleAddService(input: { title: string; content: string }) {
    if (!selectedBusiness) {
      return;
    }
    await api.addService(selectedBusiness.id, input);
    await loadKnowledgeBase(selectedBusiness.id);
  }

  async function handleCreateLead(input: { name?: string; phone: string; intent?: string; notes?: string }) {
    if (!selectedBusiness) {
      return;
    }
    await api.createLead(selectedBusiness.id, input);
    await loadLeads(selectedBusiness.id);
  }

  async function handleCallCompleted(call: CallRecord) {
    if (!selectedBusiness) {
      return;
    }
    await Promise.all([loadCalls(selectedBusiness.id), loadAnalytics(selectedBusiness.id), loadLeads(selectedBusiness.id)]);
    const refreshed = await api.getCall(selectedBusiness.id, call.id);
    setSelectedCall(refreshed);
    navigate(`/businesses/${selectedBusiness.id}/calls/${call.id}`);
  }

  async function handleSelectProduct(productId: string | null) {
    setSelectedProductId(productId);
    if (!selectedBusiness || !productId) {
      setProductImages([]);
      return;
    }
    const images = await api.listProductImages(selectedBusiness.id, productId);
    setProductImages(images);
  }

  async function handleCreateProduct(input: {
    name: string;
    slug: string;
    description?: string;
    category: "car" | "bike" | "scooter" | "fridge" | "ac" | "washing_machine" | "tv" | "mobile" | "furniture" | "other";
    price: number;
  }) {
    if (!selectedBusiness) {
      return;
    }
    const created = await api.createProduct(selectedBusiness.id, input);
    await loadProducts(selectedBusiness.id);
    await handleSelectProduct(created.id);
  }

  async function handleAddProductImage(input: { imageUrl: string; altText?: string; isPrimary?: boolean; sortOrder?: number }) {
    if (!selectedBusiness || !selectedProductId) {
      return;
    }
    await api.addProductImage(selectedBusiness.id, selectedProductId, input);
    const images = await api.listProductImages(selectedBusiness.id, selectedProductId);
    setProductImages(images);
  }

  function handleAsyncError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      api.setToken(null);
      setUser(null);
      setBusinesses([]);
      setStatus("Session expired. Please sign in again.");
      navigate("/login", { replace: true });
      return;
    }

    const message = error instanceof Error ? error.message : "Request failed";
    setStatus(message);
  }

  function logout() {
    api.setToken(null);
    setUser(null);
    setBusinesses([]);
    setFaqs([]);
    setServices([]);
    setAnalytics(null);
    setCalls([]);
    setSelectedCall(null);
    setLeads([]);
    setBusinessUsers([]);
    setProducts([]);
    setSelectedProductId(null);
    setProductImages([]);
    setUpdates([]);
    navigate("/login", { replace: true });
  }

  return (
    <Routes>
      <Route path="/" element={<PublicPage title="Call Simulator"><PublicCallSimulatorPanel /></PublicPage>} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPanel onLogin={handleLogin} onRegister={handleRegister} />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <AuthPanel onLogin={handleLogin} onRegister={handleRegister} />} />
      <Route path="/plans" element={<PublicPage title="Pricing Plans"><PlansPanel plans={plans} /></PublicPage>} />
      <Route path="/health" element={<PublicPage title="System Health"><HealthPanel health={health} /></PublicPage>} />

      <Route
        path="*"
        element={
          <ProtectedRoute user={user}>
            <DashboardLayout businesses={businesses} user={user} status={status} onLogout={logout} />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<OverviewPage businesses={businesses} plans={plans} />} />
        <Route path="dev-tools" element={<DevToolsPanel onResetPassword={handleResetPassword} />} />
        <Route path="businesses" element={<BusinessesPanel businesses={businesses} />} />
        <Route path="businesses/new" element={<BusinessSetupPanel onCreateBusiness={handleCreateBusiness} />} />
        <Route
          path="businesses/:businessId/schema-data"
          element={
            <BusinessPageShell business={selectedBusiness}>
              {selectedBusiness ? (
                <SchemaDataPanel
                  business={selectedBusiness}
                  users={businessUsers}
                  products={products}
                  selectedProductId={selectedProductId}
                  images={productImages}
                  onSelectProduct={(productId) => void handleSelectProduct(productId)}
                  onCreateProduct={handleCreateProduct}
                  onAddImage={handleAddProductImage}
                />
              ) : null}
            </BusinessPageShell>
          }
        />
        <Route
          path="businesses/:businessId"
          element={
            <BusinessPageShell business={selectedBusiness}>
              <BusinessOverviewPage business={selectedBusiness} analytics={analytics} faqs={faqs} services={services} />
            </BusinessPageShell>
          }
        />
        <Route
          path="businesses/:businessId/knowledge-base"
          element={
            <BusinessPageShell business={selectedBusiness}>
              <KnowledgeBasePanel
                faqs={faqs}
                services={services}
                onAddFaq={handleAddFaq}
                onAddService={handleAddService}
              />
            </BusinessPageShell>
          }
        />
        <Route
          path="businesses/:businessId/calls"
          element={
            <BusinessPageShell business={selectedBusiness}>
              <AnalyticsPanel analytics={analytics} calls={calls} selectedCall={selectedCall} onSelectCall={setSelectedCall} />
            </BusinessPageShell>
          }
        />
        <Route
          path="businesses/:businessId/calls/:callId"
          element={
            <BusinessPageShell business={selectedBusiness}>
              <AnalyticsPanel analytics={analytics} calls={calls} selectedCall={selectedCall} onSelectCall={setSelectedCall} />
            </BusinessPageShell>
          }
        />
        <Route
          path="businesses/:businessId/leads"
          element={
            <BusinessPageShell business={selectedBusiness}>
              <LeadsPanel leads={leads} onCreateLead={handleCreateLead} />
            </BusinessPageShell>
          }
        />
        <Route
          path="businesses/:businessId/updates"
          element={
            <BusinessPageShell business={selectedBusiness}>
              {selectedBusiness ? (
                <UpdatesPanel
                  business={selectedBusiness}
                  updates={updates}
                  onReload={() => loadUpdates(selectedBusiness.id)}
                />
              ) : null}
            </BusinessPageShell>
          }
        />
        <Route
          path="businesses/:businessId/test-call"
          element={
            <BusinessPageShell business={selectedBusiness}>
              {selectedBusiness ? <TestCallPanel business={selectedBusiness} onCallCompleted={handleCallCompleted} /> : null}
            </BusinessPageShell>
          }
        />
        <Route
          path="businesses/:businessId/ai"
          element={
            <BusinessPageShell business={selectedBusiness}>
              {selectedBusiness ? <AiPlaygroundPanel business={selectedBusiness} /> : null}
            </BusinessPageShell>
          }
        />
        <Route
          path="businesses/:businessId/messaging"
          element={
            <BusinessPageShell business={selectedBusiness}>
              {selectedBusiness ? <MessagingPanel businessName={selectedBusiness.name} /> : null}
            </BusinessPageShell>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function ProtectedRoute({ user, children }: { user: User | null; children: JSX.Element }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicPage({ title, children }: { title: string; children: JSX.Element }) {
  return (
    <main className="standalone-page">
      <div className="panel card">
        <div className="panel-head">
          <h2>{title}</h2>
          <p>Public route</p>
        </div>
        {children}
      </div>
    </main>
  );
}

function DashboardLayout({
  businesses,
  user,
  status,
  onLogout,
}: {
  businesses: Business[];
  user: User | null;
  status: string;
  onLogout: () => void;
}) {
  const location = useLocation();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="eyebrow">Control Room</span>
          <h1>AI Call Handling</h1>
          <p>{status}</p>
        </div>

        {user ? (
          <div className="user-chip">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        ) : null}

        <nav className="tab-list">
          <Link className={location.pathname === "/dashboard" ? "active" : ""} to="/dashboard">Dashboard</Link>
          <Link className={location.pathname === "/businesses" ? "active" : ""} to="/businesses">Businesses</Link>
          <Link className={location.pathname === "/businesses/new" ? "active" : ""} to="/businesses/new">New Business</Link>
          <Link className={location.pathname === "/dev-tools" ? "active" : ""} to="/dev-tools">Dev Tools</Link>
          <Link className={location.pathname === "/plans" ? "active" : ""} to="/plans">Plans</Link>
          <Link className={location.pathname === "/health" ? "active" : ""} to="/health">Health</Link>
        </nav>

        <div className="business-list">
          <div className="section-title">Business routes</div>
          {businesses.map((business) => (
            <Link key={business.id} className="business-pill" to={`/businesses/${business.id}`}>
              <strong>{business.name}</strong>
              <span>{business.businessPhoneNumber}</span>
            </Link>
          ))}
        </div>

        <button className="ghost-button" type="button" onClick={onLogout}>
          Log out
        </button>
      </aside>

      <main className="main-stage">
        <Outlet />
      </main>
    </div>
  );
}

function OverviewPage({ businesses, plans }: { businesses: Business[]; plans: Plan[] }) {
  return (
    <section className="panel-grid">
      <div className="panel card">
        <div className="panel-head">
          <h3>Coverage overview</h3>
          <p>Every current feature now has a dedicated route.</p>
        </div>
        <ul className="feature-list">
          <li>`/dashboard` for system overview</li>
          <li>`/` public call simulator route for caller/business test flow</li>
          <li>`/businesses` and `/businesses/new` for onboarding</li>
          <li>business-level overview, knowledge base, calls, call detail, leads, test call, AI sandbox, and messaging routes</li>
          <li>`/plans` and `/health` for public pricing and health</li>
        </ul>
      </div>
      <div className="panel card">
        <div className="panel-head">
          <h3>Snapshot</h3>
          <p>Quick inventory of configured data.</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><span>Businesses</span><strong>{businesses.length}</strong></div>
          <div className="stat-card"><span>Plans</span><strong>{plans.length}</strong></div>
        </div>
      </div>
    </section>
  );
}

function BusinessPageShell({ business, children }: { business: Business | null; children: JSX.Element | null }) {
  if (!business) {
    return (
      <section className="empty-state card">
        <h2>Business not found</h2>
        <p>Create a business first or choose a valid route from the sidebar.</p>
      </section>
    );
  }

  return (
    <>
      <section className="hero-strip card">
        <div>
          <span className="eyebrow">Selected business</span>
          <h2>{business.name}</h2>
          <p>{business.description || "No description yet."}</p>
          <p className="muted">
            {business.city || business.state
              ? `${business.city ?? ""}${business.city && business.state ? ", " : ""}${business.state ?? ""}`
              : typeof business.settings.address === "string"
                ? business.settings.address
                : "Location not set"}
          </p>
        </div>
        <div className="hero-metrics">
          <div><span>Business no.</span><strong>{business.businessPhoneNumber}</strong></div>
          <div><span>Forward to</span><strong>{business.virtualPhoneNumber || "Central agent"}</strong></div>
          <div><span>Plan</span><strong>{business.planCode}</strong></div>
          <div><span>Service type</span><strong>{business.serviceType || "mixed_inventory"}</strong></div>
        </div>
      </section>

      <nav className="subnav">
        <Link to={`/businesses/${business.id}`}>Overview</Link>
        <Link to={`/businesses/${business.id}/schema-data`}>Schema Data</Link>
        <Link to={`/businesses/${business.id}/knowledge-base`}>Knowledge Base</Link>
        <Link to={`/businesses/${business.id}/calls`}>Calls</Link>
        <Link to={`/businesses/${business.id}/leads`}>Leads</Link>
        <Link to={`/businesses/${business.id}/updates`}>Updates</Link>
        <Link to={`/businesses/${business.id}/test-call`}>Test Call</Link>
        <Link to={`/businesses/${business.id}/ai`}>AI Sandbox</Link>
        <Link to={`/businesses/${business.id}/messaging`}>Messaging</Link>
      </nav>

      {children}
    </>
  );
}

function BusinessOverviewPage({
  business,
  analytics,
  faqs,
  services,
}: {
  business: Business | null;
  analytics: CallsAnalytics | null;
  faqs: Faq[];
  services: ServiceEntry[];
}) {
  if (!business) {
    return null;
  }

  return (
    <section className="panel-grid">
      <div className="panel card">
        <div className="panel-head">
          <h3>System overview</h3>
          <p>Current backend coverage based on your updated flows.</p>
        </div>
        <ul className="feature-list">
          <li>Central agent routing using original dialed business number.</li>
          <li>Public caller simulator at root route with business number matching.</li>
          <li>Business login, onboarding, FAQs, services, analytics, and leads.</li>
          <li>Post-call updates queue with approve and WhatsApp actions.</li>
          <li>Browser speech test call flow with spoken AI replies.</li>
          <li>Stored transcripts, summaries, and extracted leads.</li>
          <li>WhatsApp confirmations are sent on approved updates.</li>
        </ul>
      </div>
      <div className="panel card">
        <div className="panel-head">
          <h3>Quick health</h3>
          <p>Latest activity snapshot from the selected business.</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><span>FAQs</span><strong>{faqs.length}</strong></div>
          <div className="stat-card"><span>Services</span><strong>{services.length}</strong></div>
          <div className="stat-card"><span>Calls</span><strong>{analytics?.totalCalls ?? 0}</strong></div>
          <div className="stat-card"><span>Completed</span><strong>{analytics?.completedCalls ?? 0}</strong></div>
        </div>
      </div>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="empty-state card">
      <h2>Page not found</h2>
      <p>This route does not exist yet.</p>
    </section>
  );
}

function extractBusinessId(pathname: string) {
  const match = pathname.match(/\/businesses\/([^/]+)/);
  return match?.[1] ?? null;
}

function extractCallId(pathname: string) {
  const match = pathname.match(/\/calls\/([^/]+)/);
  return match?.[1] ?? null;
}
