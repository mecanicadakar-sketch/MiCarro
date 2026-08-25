import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  SubscriptionPlan,
  PaymentGatewayConfig,
  AgencyInvoice,
  Agency,
  CurrencyCode,
  CarListing,
} from '../types';
import {
  ShieldCheck,
  DollarSign,
  Building2,
  Car,
  Receipt,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Save,
  Check,
  RefreshCw,
  ExternalLink,
  Calendar,
  Layers,
  Lock,
  KeyRound,
  LogOut,
  Download,
  Upload,
  Activity,
  Users,
  Search,
  Filter,
  Ban,
  Eye,
} from 'lucide-react';
import { AdminAuthView } from './AdminAuthView';
import { SubscriptionCodesManager } from './SubscriptionCodesManager';
import { LiveActivityMonitor } from './LiveActivityMonitor';
import { AgencyLogo } from './AgencyLogo';
import { ConfirmationModal } from './ConfirmationModal';

export const AdminSaasPanelView: React.FC = () => {
  const {
    subscriptionPlans,
    updateSubscriptionPlan,
    addSubscriptionPlan,
    paymentGateways,
    updatePaymentGateway,
    invoices,
    addInvoice,
    markInvoicePaid,
    updateInvoiceStatus,
    agencies,
    updateAgency,
    addAgency,
    carListings,
    deleteCarListing,
    formatPrice,
    formatPlanPrice,
    exchangeRateUsdToPyg,
    accessCodes,
    isAdminAuthenticated,
    logoutAdmin,
    exportDatabaseJson,
    importDatabaseJson,
    resetToSampleData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'codes' | 'activity' | 'plans' | 'gateways' | 'invoices' | 'agencies' | 'inventory' | 'backup'>('codes');

  // Confirmation Modal State (for deleting cars, cancelling subscriptions, etc.)
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    iconType?: 'trash' | 'cancel' | 'warning' | 'ban';
    itemName?: string;
    itemDetails?: string;
    warningNote?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Global Inventory Management Filters
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryAgencyFilter, setInventoryAgencyFilter] = useState('all');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('all');

  // Editing Plan Modal / State
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // New Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    agencyId: agencies[0]?.id || '',
    planId: subscriptionPlans[1]?.id || '',
    period: 'Septiembre 2026',
    billingCycle: 'monthly' as const,
    amount: 69,
    currency: 'USD' as CurrencyCode,
    dueDate: '2026-09-10',
    notes: 'Abono mensual servicio MiCarro SaaS',
  });

  // Editing Gateway State
  const [editingGateway, setEditingGateway] = useState<PaymentGatewayConfig | null>(null);

  // New Agency Modal State
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [newAgencyData, setNewAgencyData] = useState({
    name: '',
    slug: '',
    logoUrl: '/logo.png',
    ownerName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    city: 'Buenos Aires',
    provinceOrState: 'CABA',
    verified: true,
    subscriptionPlanId: 'plan-pro',
    subscriptionStatus: 'active' as const,
    subscriptionExpiresAt: '2027-01-01',
    billingCycle: 'monthly' as const,
    rating: 5.0,
    reviewsCount: 1,
    about: 'Concesionaria oficial multimarca.',
  });

  // If admin is not logged in, show the secure access view (TallerYa style with anti-brute force)
  if (!isAdminAuthenticated) {
    return <AdminAuthView />;
  }

  // SaaS Master Financial Metrics
  const activeAgencies = agencies.filter((a) => a.subscriptionStatus === 'active');
  const trialAgencies = agencies.filter((a) => a.subscriptionStatus === 'trial');

  // Monthly Recurring Revenue (MRR)
  const mrr = activeAgencies.reduce((sum, agency) => {
    const plan = subscriptionPlans.find((p) => p.id === agency.subscriptionPlanId);
    if (!plan) return sum;
    return sum + (agency.billingCycle === 'yearly' ? plan.yearlyPrice / 12 : plan.monthlyPrice);
  }, 0);

  const totalInvoicedThisMonth = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Handler for Deleting a Car with Confirmation Dialog Modal
  const handleRequestDeleteCar = (car: CarListing) => {
    const agency = agencies.find((a) => a.id === car.agencyId);
    setConfirmModalConfig({
      isOpen: true,
      title: '¿Eliminar auto del inventario?',
      description: 'Esta acción dará de baja definitivamente el vehículo de la base de datos y del catálogo público de la plataforma.',
      itemName: `${car.title} (${car.year})`,
      itemDetails: `Concesionaria: ${agency?.name || 'Sede Central'} • Precio: ${formatPrice(car.price, car.currency)} • Km: ${car.mileage.toLocaleString('es-ES')} km`,
      warningNote: 'El vehículo ya no estará disponible para cotizaciones ni consultas de compradores.',
      confirmText: 'Sí, Eliminar Auto',
      cancelText: 'Cancelar / Mantener',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        deleteCarListing(car.id);
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handler for Cancelling / Suspending an Agency Subscription with Confirmation Dialog Modal
  const handleRequestCancelSubscription = (
    agency: Agency,
    newStatus: Agency['subscriptionStatus'] = 'cancelled'
  ) => {
    const plan = subscriptionPlans.find((p) => p.id === agency.subscriptionPlanId);
    const agencyCars = carListings.filter((c) => c.agencyId === agency.id);

    const isSuspending = newStatus === 'suspended';
    const actionName = isSuspending ? 'Suspender' : 'Cancelar';

    setConfirmModalConfig({
      isOpen: true,
      title: `¿${actionName} suscripción de ${agency.name}?`,
      description: isSuspending
        ? `Al suspender la suscripción, los vendedores no podrán acceder a cargar nuevos autos hasta regularizar la cuenta.`
        : `Al cancelar la suscripción, la concesionaria perderá el acceso a la plataforma y todos sus vendedores quedarán bloqueados.`,
      itemName: `Concesionaria: ${agency.name}`,
      itemDetails: `Plan actual: ${plan?.name || 'Sin plan'} • Stock activo: ${agencyCars.length} autos • WhatsApp: ${agency.whatsappNumber}`,
      warningNote: `⛔ Consecuencia: Todos los vendedores vinculados a esta concesionaria verán bloqueado su inicio de sesión en MiCarro.`,
      confirmText: `Sí, ${actionName} Suscripción`,
      cancelText: 'Mantener Activa',
      variant: 'danger',
      iconType: 'cancel',
      onConfirm: () => {
        updateAgency(agency.id, { subscriptionStatus: newStatus });
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Filtered Global Inventory for the Inventory tab
  const filteredGlobalCars = carListings.filter((car) => {
    const matchesSearch =
      inventorySearch === '' ||
      car.title.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      car.make.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      car.model.toLowerCase().includes(inventorySearch.toLowerCase());

    const matchesAgency =
      inventoryAgencyFilter === 'all' || car.agencyId === inventoryAgencyFilter;

    const matchesStatus =
      inventoryStatusFilter === 'all' || car.status === inventoryStatusFilter;

    return matchesSearch && matchesAgency && matchesStatus;
  });

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    updateSubscriptionPlan(editingPlan.id, editingPlan);
    setEditingPlan(null);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAgency = agencies.find((a) => a.id === newInvoice.agencyId) || agencies[0];
    const targetPlan = subscriptionPlans.find((p) => p.id === newInvoice.planId) || subscriptionPlans[0];

    addInvoice({
      invoiceNumber: `FAC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      agencyId: targetAgency.id,
      agencyName: targetAgency.name,
      planId: targetPlan.id,
      planName: targetPlan.name,
      period: newInvoice.period,
      billingCycle: newInvoice.billingCycle,
      amount: Number(newInvoice.amount),
      currency: newInvoice.currency,
      status: 'pending',
      paymentMethod: 'Por Definir',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: newInvoice.dueDate,
      notes: newInvoice.notes,
    });

    setIsInvoiceModalOpen(false);
  };

  const handleCreateAgency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgencyData.name.trim() || !newAgencyData.whatsappNumber.trim()) return;

    addAgency({
      ...newAgencyData,
      slug: newAgencyData.name.toLowerCase().replace(/\s+/g, '-'),
    });

    setIsAgencyModalOpen(false);
  };

  const handleDownloadBackup = () => {
    const dataStr = exportDatabaseJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `micarro-database-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDatabaseJson(content);
        if (success) {
          alert('¡Base de datos restaurada correctamente!');
        } else {
          alert('El archivo de respaldo no es válido.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* SaaS Admin Banner in Crisp Light Theme */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Panel de Administración Master • MiCarro SaaS</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                🛡️ Protección Anti-Fuerza Bruta Activa
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Control de Concesionarias, Códigos y Cobros
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Sesión activa de administrador: <strong className="text-blue-900 font-mono">mecanicadakar@gmail.com</strong>.
              Generá códigos de un solo acceso (tipo TallerYa), administrá pasarelas y controlá planes de membresía.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-700/20 transition-transform active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Emitir Cobro</span>
            </button>

            <button
              onClick={() => setIsAgencyModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-4 h-4 text-blue-700" />
              <span>+ Concesionaria</span>
            </button>

            <button
              onClick={logoutAdmin}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1.5 transition-colors"
              title="Cerrar sesión de administrador"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI SaaS Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold">MRR Mensual</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            USD {Math.round(mrr).toLocaleString('es-ES')}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Ingresos recurrentes</p>
        </div>

        {/* Live Users Counter */}
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className="bg-gradient-to-br from-slate-900 to-blue-950 text-white border border-sky-400/40 rounded-2xl p-4 sm:p-5 shadow-md text-left transition-transform active:scale-98 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-blue-200 text-xs mb-2">
            <span className="font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>En Línea Ahora</span>
            </span>
            <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            14 personas
          </p>
          <p className="text-[10px] text-sky-200 mt-1 flex items-center gap-1">
            <span>Ver telemetría en vivo</span>
            <span>&rarr;</span>
          </p>
        </button>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold">Concesionarias</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{agencies.length}</p>
          <p className="text-[10px] text-slate-500 mt-1">
            <strong className="text-emerald-700">{activeAgencies.length} activas</strong> • {trialAgencies.length} prueba
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-4 sm:p-5 shadow-sm text-left transition-all group active:scale-98"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold group-hover:text-blue-700 transition-colors">Autos Catálogo</span>
            <Car className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{carListings.length}</p>
          <p className="text-[10px] text-blue-600 mt-1 font-semibold flex items-center gap-1">
            <span>Gestionar inventario</span>
            <span>&rarr;</span>
          </p>
        </button>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold">Códigos de Canje</span>
            <KeyRound className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{accessCodes.length}</p>
          <p className="text-[10px] text-slate-500 mt-1">
            <strong className="text-emerald-700">{accessCodes.filter((c) => c.status === 'active').length} listos</strong>
          </p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 text-xs sm:text-sm font-bold overflow-x-auto no-scrollbar gap-1">
        <button
          onClick={() => setActiveTab('codes')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all shrink-0 rounded-t-xl ${
            activeTab === 'codes'
              ? 'border-blue-700 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Códigos de Suscripción</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-900">
            {accessCodes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all shrink-0 rounded-t-xl ${
            activeTab === 'activity'
              ? 'border-blue-700 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>📡 Usuarios en Vivo & Telemetría</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            En Vivo
          </span>
        </button>

        <button
          onClick={() => setActiveTab('agencies')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all shrink-0 rounded-t-xl ${
            activeTab === 'agencies'
              ? 'border-blue-700 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Concesionarias ({agencies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all shrink-0 rounded-t-xl ${
            activeTab === 'inventory'
              ? 'border-blue-700 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Inventario Global ({carListings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all shrink-0 rounded-t-xl ${
            activeTab === 'plans'
              ? 'border-blue-700 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Planes & Tarifas ({subscriptionPlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gateways')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all shrink-0 rounded-t-xl ${
            activeTab === 'gateways'
              ? 'border-blue-700 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Medios de Cobro</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all shrink-0 rounded-t-xl ${
            activeTab === 'invoices'
              ? 'border-blue-700 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Facturación ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all shrink-0 rounded-t-xl ${
            activeTab === 'backup'
              ? 'border-blue-700 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Respaldos & Datos</span>
        </button>
      </div>

      {/* TAB 0: CODES MANAGER (TallerYa Style) */}
      {activeTab === 'codes' && <SubscriptionCodesManager />}

      {/* TAB: LIVE TELEMETRY & ACTIVITY MONITOR */}
      {activeTab === 'activity' && <LiveActivityMonitor />}

      {/* TAB 1: PLANS & PRICING CONFIGURATION */}
      {activeTab === 'plans' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Planes de Suscripción para Dueños de Concesionarias</h3>
              <p className="text-slate-500 mt-0.5">
                Definí el precio mensual/anual y los límites de autos que cada agencia puede publicar en MiCarro.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white border rounded-3xl p-6 flex flex-col justify-between space-y-6 relative shadow-sm ${
                  plan.isPopular ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200'
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-700 text-white font-black text-[10px] tracking-wider shadow-md">
                    PLAN MÁS ELEGIDO
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] text-blue-700 font-bold uppercase tracking-wider block">
                      {plan.badge}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">{plan.name}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{plan.description}</p>
                  </div>

                  {/* Pricing Box in USD and PYG */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                          USD {plan.monthlyPrice}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">/ mes</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-mono">
                        ₲ {(plan.monthlyPricePyg || plan.monthlyPrice * exchangeRateUsdToPyg).toLocaleString('es-PY')} / mes
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span>Plan Anual USD: ${plan.yearlyPrice}</span>
                      <span className="text-emerald-700 font-semibold">
                        ₲ {(plan.yearlyPricePyg || plan.yearlyPrice * exchangeRateUsdToPyg).toLocaleString('es-PY')} / año
                      </span>
                    </div>
                  </div>

                  {/* Limits and Capabilities List */}
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Hasta <b>{plan.maxCars} autos simultáneos</b></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Hasta <b>{plan.maxPhotosPerCar} fotos</b> por auto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><b>{plan.featuredSlots} cupos</b> destacados en portada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Contacto directo vía WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.allowsPrivateOffersAccess ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={plan.allowsPrivateOffersAccess ? '' : 'text-slate-400'}>
                        Acceso a ofertas de particulares
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.allowsAiDescriptionGenerator ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={plan.allowsAiDescriptionGenerator ? '' : 'text-slate-400'}>
                        Generador de textos con Inteligencia Artificial
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setEditingPlan(plan)}
                  className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Modificar Precio y Límites</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT GATEWAYS (PARAGUAY FOCUS) */}
      {activeTab === 'gateways' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                  🇵🇾 Configuración Paraguay
                </span>
                <span className="text-[11px] text-slate-500 font-medium">SIPAP 24/7 • Tarjetas Bancard • Efectivo & Billeteras</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-1">Configuración de Pasarelas & Medios de Cobro</h3>
              <p className="text-slate-500 mt-0.5 text-xs">
                Administra las cuentas bancarias paraguayas, links de pago y sedes que se muestran a las agencias.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paymentGateways.map((gw) => (
              <div
                key={gw.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{gw.name}</h4>
                      <span className="text-[10px] uppercase font-mono text-slate-500">
                        {gw.type === 'bank_transfer'
                          ? 'Transferencia Bancaria SIPAP'
                          : gw.type === 'card'
                          ? 'Tarjetas en Guaraníes (₲) & USD ($)'
                          : gw.type === 'cash'
                          ? 'Cobro Presencial en Sede'
                          : 'Billetera Digital'}
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gw.isEnabled}
                      onChange={(e) => updatePaymentGateway(gw.id, { isEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      {gw.isEnabled ? '🟢 Habilitado' : '⚪ Inactivo'}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-700 text-[11px] font-semibold mb-1">Nombre Visible al Cliente:</label>
                  <input
                    type="text"
                    value={gw.name}
                    onChange={(e) => updatePaymentGateway(gw.id, { name: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2 border border-slate-200 text-xs font-semibold"
                  />
                </div>

                {gw.type === 'bank_transfer' && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-700 text-[11px] font-semibold mb-1">Banco(s) en Paraguay:</label>
                      <input
                        type="text"
                        value={gw.bankName || ''}
                        onChange={(e) => updatePaymentGateway(gw.id, { bankName: e.target.value })}
                        placeholder="Banco Itau"
                        className="w-full bg-slate-50 text-slate-900 rounded-xl p-2 border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] font-semibold mb-1">Titular de la Cuenta:</label>
                      <input
                        type="text"
                        value={gw.accountHolder || ''}
                        onChange={(e) => updatePaymentGateway(gw.id, { accountHolder: e.target.value })}
                        placeholder="Camila Ayelen Torres"
                        className="w-full bg-slate-50 text-slate-900 rounded-xl p-2 border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] font-semibold mb-1">N° de Cuentas (Gs. / USD):</label>
                      <input
                        type="text"
                        value={gw.accountNumber || ''}
                        onChange={(e) => updatePaymentGateway(gw.id, { accountNumber: e.target.value })}
                        placeholder="620011158"
                        className="w-full bg-slate-50 text-blue-900 font-bold rounded-xl p-2 border border-slate-200 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] font-semibold mb-1">Alias SIPAP / CBU:</label>
                      <input
                        type="text"
                        value={gw.cbuOrAlias || ''}
                        onChange={(e) => updatePaymentGateway(gw.id, { cbuOrAlias: e.target.value })}
                        placeholder="7226273"
                        className="w-full bg-slate-50 text-emerald-800 font-bold rounded-xl p-2 border border-slate-200 text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-700 text-[11px] font-semibold mb-1">RUC / Identificación Fiscal (Paraguay):</label>
                      <input
                        type="text"
                        value={gw.cuitOrTaxId || ''}
                        onChange={(e) => updatePaymentGateway(gw.id, { cuitOrTaxId: e.target.value })}
                        placeholder="7.226.273-7"
                        className="w-full bg-slate-50 text-slate-900 rounded-xl p-2 border border-slate-200 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {gw.type === 'card' && (
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-slate-700 text-[11px] font-semibold mb-1">
                        Link de Pago o Pasarela (Red Bancard / Vpos):
                      </label>
                      <input
                        type="text"
                        value={gw.paymentLink || ''}
                        onChange={(e) => updatePaymentGateway(gw.id, { paymentLink: e.target.value })}
                        placeholder="https://vpos.bancard.com.py/..."
                        className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] font-semibold mb-1">Monedas Aceptadas:</label>
                      <input
                        type="text"
                        value={gw.currencyAccepted || ''}
                        onChange={(e) => updatePaymentGateway(gw.id, { currencyAccepted: e.target.value })}
                        placeholder="Guaraníes (PYG) y Dólares (USD)"
                        className="w-full bg-slate-50 text-slate-900 rounded-xl p-2 border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                )}

                {gw.type === 'cash' && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="col-span-2">
                      <label className="block text-slate-700 text-[11px] font-semibold mb-1">Ubicación / Sede de Cobro:</label>
                      <input
                        type="text"
                        value={gw.locationOrOffice || ''}
                        onChange={(e) => updatePaymentGateway(gw.id, { locationOrOffice: e.target.value })}
                        placeholder="Av. Santa Teresa y Aviadores del Chaco, Asunción, Paraguay"
                        className="w-full bg-slate-50 text-slate-900 rounded-xl p-2 border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] font-semibold mb-1">Monedas Aceptadas en Efectivo:</label>
                      <input
                        type="text"
                        value={gw.currencyAccepted || ''}
                        onChange={(e) => updatePaymentGateway(gw.id, { currencyAccepted: e.target.value })}
                        placeholder="Efectivo en Guaraníes (₲) o Dólares (USD)"
                        className="w-full bg-slate-50 text-slate-900 rounded-xl p-2 border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] font-semibold mb-1">Responsable / Caja:</label>
                      <input
                        type="text"
                        value={gw.accountHolder || ''}
                        onChange={(e) => updatePaymentGateway(gw.id, { accountHolder: e.target.value })}
                        placeholder="Administración MiCarro"
                        className="w-full bg-slate-50 text-slate-900 rounded-xl p-2 border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                )}

                {gw.type === 'billetera' && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-700 text-[11px] font-semibold mb-1">Línea de Giros / Billetera:</label>
                      <input
                        type="text"
                        value={gw.accountNumber || ''}
                        onChange={(e) => updatePaymentGateway(gw.id, { accountNumber: e.target.value })}
                        placeholder="0981-489055"
                        className="w-full bg-slate-50 text-slate-900 rounded-xl p-2 border border-slate-200 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] font-semibold mb-1">Titular:</label>
                      <input
                        type="text"
                        value={gw.accountHolder || ''}
                        onChange={(e) => updatePaymentGateway(gw.id, { accountHolder: e.target.value })}
                        placeholder="MiCarro Paraguay"
                        className="w-full bg-slate-50 text-slate-900 rounded-xl p-2 border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 text-[11px] font-semibold mb-1">Instrucciones al Cliente:</label>
                  <textarea
                    rows={2}
                    value={gw.instructions || ''}
                    onChange={(e) => updatePaymentGateway(gw.id, { instructions: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INVOICES & BILLING CONTROL */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Control de Cobros & Facturación a Concesionarias</h3>
              <p className="text-slate-500 mt-0.5">
                Seguimiento de cobros de suscripción emitidos con estado en tiempo real.
              </p>
            </div>

            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Emitir Nueva Factura</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">N° Recibo</th>
                    <th className="p-3.5">Agencia / Concesionaria</th>
                    <th className="p-3.5">Plan / Concepto</th>
                    <th className="p-3.5">Período</th>
                    <th className="p-3.5">Monto</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5">Vencimiento</th>
                    <th className="p-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-blue-50/30">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{inv.agencyName}</td>
                      <td className="p-3.5 text-slate-600">{inv.planName}</td>
                      <td className="p-3.5 text-slate-600">{inv.period}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {formatPrice(inv.amount, inv.currency)}
                      </td>
                      <td className="p-3.5">
                        <select
                          value={inv.status}
                          onChange={(e) => updateInvoiceStatus(inv.id, e.target.value as any)}
                          className={`text-xs font-bold rounded-lg p-1 border focus:outline-none ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                              : inv.status === 'pending'
                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                              : 'bg-rose-100 border-rose-300 text-rose-800'
                          }`}
                        >
                          <option value="paid">PAGADO</option>
                          <option value="pending">PENDIENTE</option>
                          <option value="overdue">VENCIDO</option>
                          <option value="cancelled">ANULADO</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">{inv.dueDate}</td>
                      <td className="p-3.5 text-right">
                        {inv.status === 'pending' ? (
                          <button
                            onClick={() => markInvoicePaid(inv.id, 'Transferencia Bancaria')}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          >
                            Registrar Cobro
                          </button>
                        ) : (
                          <button
                            onClick={() => window.print()}
                            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                          >
                            Imprimir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AGENCIES DIRECTORY */}
      {activeTab === 'agencies' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Directorio de Concesionarias Clientes</h3>
              <p className="text-slate-500 mt-0.5">Control de cuentas, membresías vigentes y estado de suscripción.</p>
            </div>
            <button
              onClick={() => setIsAgencyModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nueva Concesionaria</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agencies.map((agency) => {
              const plan = subscriptionPlans.find((p) => p.id === agency.subscriptionPlanId);
              const agencyCars = carListings.filter((c) => c.agencyId === agency.id);
              const isSubscriptionActive = agency.subscriptionStatus === 'active' || agency.subscriptionStatus === 'trial';

              return (
                <div key={agency.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                      <AgencyLogo
                        logoUrl={agency.logoUrl}
                        name={agency.name}
                        size="md"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{agency.name}</h4>
                        <p className="text-xs text-slate-500">{agency.city}, {agency.provinceOrState}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <select
                        value={agency.subscriptionStatus}
                        onChange={(e) => {
                          const newSt = e.target.value as Agency['subscriptionStatus'];
                          if (newSt === 'cancelled' || newSt === 'suspended') {
                            handleRequestCancelSubscription(agency, newSt);
                          } else {
                            updateAgency(agency.id, { subscriptionStatus: newSt });
                          }
                        }}
                        className={`text-xs font-bold rounded-xl px-2.5 py-1 border focus:outline-none cursor-pointer ${
                          agency.subscriptionStatus === 'active'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                            : agency.subscriptionStatus === 'trial'
                            ? 'bg-sky-100 border-sky-300 text-sky-800'
                            : agency.subscriptionStatus === 'past_due'
                            ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-rose-100 border-rose-300 text-rose-800'
                        }`}
                      >
                        <option value="active">🟢 Activa (Vendedores Habilitados)</option>
                        <option value="trial">🔵 Prueba (Vendedores Habilitados)</option>
                        <option value="past_due">🟡 Mora (Vendedores Bloqueados)</option>
                        <option value="suspended">🔴 Suspendida (Vendedores Bloqueados)</option>
                        <option value="cancelled">⚪ Cancelada (Vendedores Bloqueados)</option>
                      </select>
                      <span className="text-[10px] text-slate-500">
                        {isSubscriptionActive
                          ? '✅ Vendedores autorizados a loguearse'
                          : '⛔ Logueo de vendedores bloqueado'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-slate-500 text-[11px]">Plan Asignado:</p>
                      <p className="font-bold text-slate-900">{plan?.name || 'Sin Plan'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">Vencimiento:</p>
                      <p className="font-bold text-slate-900 font-mono">{agency.subscriptionExpiresAt}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">Autos Publicados:</p>
                      <p className="font-bold text-slate-900">{agencyCars.length} / {plan?.maxCars || '∞'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">WhatsApp:</p>
                      <p className="font-bold text-blue-700 font-mono">{agency.whatsappNumber}</p>
                    </div>
                  </div>

                  {/* Actions on Agency Card */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setInventoryAgencyFilter(agency.id);
                        setActiveTab('inventory');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Car className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ver Stock ({agencyCars.length})</span>
                    </button>

                    {isSubscriptionActive ? (
                      <button
                        type="button"
                        onClick={() => handleRequestCancelSubscription(agency, 'cancelled')}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center gap-1.5 transition-colors"
                        title="Abrir confirmación para cancelar suscripción"
                      >
                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cancelar Suscripción</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateAgency(agency.id, { subscriptionStatus: 'active' })}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Reactivar Suscripción</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: GLOBAL INVENTORY MANAGEMENT & CAR DELETION */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-700" />
                <span>Inventario Global de Vehículos ({carListings.length} en plataforma)</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                Panel maestro de supervisión y eliminación controlada de vehículos publicados por concesionarias.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl font-bold font-mono">
                {filteredGlobalCars.length} vehículos filtrados
              </span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Text Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar marca, modelo o versión..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Agency Filter */}
              <div>
                <select
                  value={inventoryAgencyFilter}
                  onChange={(e) => setInventoryAgencyFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="all">🏢 Todas las Concesionarias ({agencies.length})</option>
                  {agencies.map((a) => {
                    const count = carListings.filter((c) => c.agencyId === a.id).length;
                    return (
                      <option key={a.id} value={a.id}>
                        {a.name} ({count} autos)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={inventoryStatusFilter}
                  onChange={(e) => setInventoryStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="available">🟢 Disponible</option>
                  <option value="reserved">🟣 Reservado</option>
                  <option value="sold">🔴 Vendido</option>
                  <option value="draft">⚪ Borrador</option>
                </select>
              </div>
            </div>

            {/* Active filters reset */}
            {(inventorySearch || inventoryAgencyFilter !== 'all' || inventoryStatusFilter !== 'all') && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Filtros aplicados</span>
                <button
                  type="button"
                  onClick={() => {
                    setInventorySearch('');
                    setInventoryAgencyFilter('all');
                    setInventoryStatusFilter('all');
                  }}
                  className="text-blue-700 font-bold hover:underline"
                >
                  Restablecer filtros
                </button>
              </div>
            )}
          </div>

          {/* Cars List Table */}
          {filteredGlobalCars.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3 shadow-sm">
              <Car className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">No se encontraron autos</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay vehículos que coincidan con los filtros seleccionados de búsqueda o concesionaria.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Vehículo</th>
                      <th className="p-3.5">Concesionaria</th>
                      <th className="p-3.5">Precio</th>
                      <th className="p-3.5">Kilometraje</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5">Interacciones</th>
                      <th className="p-3.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGlobalCars.map((car) => {
                      const agency = agencies.find((a) => a.id === car.agencyId);
                      return (
                        <tr key={car.id} className="hover:bg-blue-50/30 transition-colors">
                          {/* Vehicle Photo & Title */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={car.images?.[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400'}
                                alt={car.title}
                                className="w-12 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{car.title}</h4>
                                <span className="text-[11px] text-slate-500">
                                  {car.year} • {car.transmission} • {car.fuelType}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Agency */}
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-800 block">
                              {agency?.name || 'Sede Central'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {agency?.city || 'Paraguay'}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-slate-900 block">
                              {formatPrice(car.price, car.currency)}
                            </span>
                            {car.currency === 'USD' && (
                              <span className="text-[10px] text-emerald-700 font-mono">
                                ₲ {Math.round(car.price * exchangeRateUsdToPyg).toLocaleString('es-PY')}
                              </span>
                            )}
                          </td>

                          {/* Mileage */}
                          <td className="p-3.5 font-mono text-slate-600">
                            {car.mileage.toLocaleString('es-ES')} km
                          </td>

                          {/* Status */}
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                car.status === 'available'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : car.status === 'reserved'
                                  ? 'bg-purple-100 text-purple-800'
                                  : car.status === 'sold'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {car.status === 'available'
                                ? 'Disponible'
                                : car.status === 'reserved'
                                ? 'Reservado'
                                : car.status === 'sold'
                                ? 'Vendido'
                                : 'Borrador'}
                            </span>
                          </td>

                          {/* Views & Inquiries */}
                          <td className="p-3.5 text-slate-500 text-[11px] font-mono">
                            <div>👁️ {car.viewsCount || 0} vistas</div>
                            <div>💬 {car.whatsappInquiriesCount || 0} chats</div>
                          </td>

                          {/* Delete Button with Confirmation Dialog */}
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRequestDeleteCar(car)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 ml-auto transition-colors active:scale-98 shadow-xs"
                              title={`Eliminar ${car.title} con confirmación previa`}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Eliminar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BACKUP & DATABASE TOOLS */}
      {activeTab === 'backup' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-lg font-black text-slate-900">Respaldo y Seguridad de Base de Datos</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Descargá una copia íntegra en JSON de todos los autos, concesionarias, vendedores y códigos de suscripción para guardarlo en tu computadora o restaurarlo en cualquier momento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-bold text-blue-950 text-sm">Exportar Respaldo Completo (JSON)</h4>
                <p className="text-xs text-blue-800 mt-1">
                  Genera un archivo con todo el estado actual del sistema para guardarlo de manera segura.
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Base de Datos (.JSON)</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Restaurar Respaldo desde Archivo</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Carga un archivo JSON previo para reestablecer todo el catálogo y concesionarias.
                </p>
              </div>
              <label className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Seleccionar Archivo JSON</span>
                <input type="file" accept=".json" onChange={handleFileRestore} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Editar Plan: {editingPlan.name}</h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Precio Mensual (USD)</label>
                  <input
                    type="number"
                    value={editingPlan.monthlyPrice}
                    onChange={(e) => {
                      const usd = Number(e.target.value);
                      setEditingPlan({
                        ...editingPlan,
                        monthlyPrice: usd,
                        monthlyPricePyg: usd * exchangeRateUsdToPyg,
                      });
                    }}
                    className="w-full bg-slate-50 text-slate-900 font-bold rounded-xl p-2.5 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Precio Mensual (PYG ₲)</label>
                  <input
                    type="number"
                    step="10000"
                    value={editingPlan.monthlyPricePyg || editingPlan.monthlyPrice * exchangeRateUsdToPyg}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        monthlyPricePyg: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 text-emerald-900 font-bold font-mono rounded-xl p-2.5 border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Precio Anual (USD)</label>
                  <input
                    type="number"
                    value={editingPlan.yearlyPrice}
                    onChange={(e) => {
                      const usd = Number(e.target.value);
                      setEditingPlan({
                        ...editingPlan,
                        yearlyPrice: usd,
                        yearlyPricePyg: usd * exchangeRateUsdToPyg,
                      });
                    }}
                    className="w-full bg-slate-50 text-slate-900 font-bold rounded-xl p-2.5 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Precio Anual (PYG ₲)</label>
                  <input
                    type="number"
                    step="50000"
                    value={editingPlan.yearlyPricePyg || editingPlan.yearlyPrice * exchangeRateUsdToPyg}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        yearlyPricePyg: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 text-emerald-900 font-bold font-mono rounded-xl p-2.5 border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between">
                <span>Tipo de cambio actual: <strong>1 USD = {exchangeRateUsdToPyg.toLocaleString('es-PY')} PYG</strong></span>
                <span className="text-[10px] text-emerald-600 font-semibold">Conversión automática activa</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Límite de Autos</label>
                  <input
                    type="number"
                    value={editingPlan.maxCars}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxCars: Number(e.target.value) })}
                    className="w-full bg-slate-50 text-slate-900 font-bold rounded-xl p-2.5 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Cupos Destacados</label>
                  <input
                    type="number"
                    value={editingPlan.featuredSlots}
                    onChange={(e) => setEditingPlan({ ...editingPlan, featuredSlots: Number(e.target.value) })}
                    className="w-full bg-slate-50 text-slate-900 font-bold rounded-xl p-2.5 border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Emitir Factura de Software a Concesionaria</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Agencia Destino</label>
                <select
                  value={newInvoice.agencyId}
                  onChange={(e) => setNewInvoice({ ...newInvoice, agencyId: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                >
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-700 mb-1 font-semibold">Moneda</label>
                  <select
                    value={newInvoice.currency}
                    onChange={(e) => setNewInvoice({ ...newInvoice, currency: e.target.value as CurrencyCode })}
                    className="w-full bg-slate-50 text-slate-900 font-bold rounded-xl p-2.5 border border-slate-200"
                  >
                    <option value="PYG">PYG (Gs. Guaraníes)</option>
                    <option value="USD">USD ($ Dólares)</option>
                    <option value="ARS">ARS ($ Pesos Arg.)</option>
                    <option value="EUR">EUR (€ Euros)</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-slate-700 mb-1 font-semibold">Monto</label>
                  <input
                    type="number"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 text-blue-900 font-bold font-mono rounded-xl p-2.5 border border-slate-200"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-slate-700 mb-1 font-semibold">Período</label>
                  <input
                    type="text"
                    value={newInvoice.period}
                    onChange={(e) => setNewInvoice({ ...newInvoice, period: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold"
                >
                  Emitir Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE AGENCY MODAL */}
      {isAgencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Registrar Nueva Concesionaria</h3>
              <button onClick={() => setIsAgencyModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAgency} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Nombre de la Agencia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. AutoSur Concesionaria"
                  value={newAgencyData.name}
                  onChange={(e) => setNewAgencyData({ ...newAgencyData, name: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Titular / Dueño</label>
                  <input
                    type="text"
                    value={newAgencyData.ownerName}
                    onChange={(e) => setNewAgencyData({ ...newAgencyData, ownerName: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Número WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 5491122334455"
                    value={newAgencyData.whatsappNumber}
                    onChange={(e) => setNewAgencyData({ ...newAgencyData, whatsappNumber: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAgencyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold"
                >
                  Dar de Alta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DESTRUCTIVE ACTIONS */}
      <ConfirmationModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        description={confirmModalConfig.description}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        variant={confirmModalConfig.variant}
        iconType={confirmModalConfig.iconType}
        itemName={confirmModalConfig.itemName}
        itemDetails={confirmModalConfig.itemDetails}
        warningNote={confirmModalConfig.warningNote}
      />
    </div>
  );
};
