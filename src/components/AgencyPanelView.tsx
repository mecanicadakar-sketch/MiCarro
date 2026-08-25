import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CarListing, PrivateCarOffer, AgencyInvoice, AppUser } from '../types';
import {
  Building2,
  Car,
  Plus,
  Edit,
  Trash2,
  Eye,
  MessageCircle,
  Sparkles,
  DollarSign,
  TrendingUp,
  Tag,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Phone,
  PhoneCall,
  MapPin,
  AlertTriangle,
  Receipt,
  FileText,
  UserCheck,
  X,
  Users,
  UserPlus,
  KeyRound,
  Lock,
  Filter,
  Search,
  SlidersHorizontal,
  Star,
  Copy,
  Check,
  Lightbulb,
  Upload,
  ImageIcon,
  Camera,
  Save,
  Globe,
  Bot,
  Landmark,
  FileSpreadsheet,
  Download,
  Bell,
  BellRing,
  BarChart3,
} from 'lucide-react';
import { UploadTutorialBanner } from './UploadTutorialBanner';
import { CarQuotePdfModal } from './CarQuotePdfModal';
import { ExportInventoryModal } from './ExportInventoryModal';
import { downloadInventoryCsv } from '../utils/exportInventoryUtils';
import { CarBrandStrip } from './CarBrandIcons';
import { getAllBrands, getModelsForBrand } from '../data/carBrandsData';
import { AgencyNotificationPanel } from './AgencyNotificationPanel';
import { AgencyStatsView } from './AgencyStatsView';
import { AgencyOnboardingTutorial } from './AgencyOnboardingTutorial';
import { AgencyWhatsAppSettings } from './AgencyWhatsAppSettings';
import { AgencyLogo } from './AgencyLogo';
import { ConfirmationModal } from './ConfirmationModal';

interface AgencyPanelViewProps {
  onOpenCarForm: (car?: CarListing) => void;
  onOpenCarDetail: (car: CarListing) => void;
  onGoToSaasAdmin: () => void;
  onOpenRedeemCode?: () => void;
}

export const AgencyPanelView: React.FC<AgencyPanelViewProps> = ({
  onOpenCarForm,
  onOpenCarDetail,
  onGoToSaasAdmin,
  onOpenRedeemCode,
}) => {
  const {
    currentAgency,
    agencies,
    updateAgency,
    carListings,
    deleteCarListing,
    toggleCarFeatured,
    updateCarStatus,
    privateOffers,
    updatePrivateOfferStatus,
    leads,
    updateLeadStatus,
    invoices,
    subscriptionPlans,
    paymentGateways,
    formatPrice,
    formatPlanPrice,
    exchangeRateUsdToPyg,
    openWhatsappForCar,
    markInvoicePaid,
    currentUser,
    users,
    addUser,
    updateUser,
    deleteUser,
    setIsAuthModalOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'inventory' | 'analytics' | 'sellers' | 'offers' | 'leads' | 'company' | 'whatsapp' | 'subscription' | 'notifications'>('inventory');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedSellerFilter, setSelectedSellerFilter] = useState<string>('all');

  // Car Deletion Confirmation Modal State
  const [carToDelete, setCarToDelete] = useState<CarListing | null>(null);
  const [selectedMakeFilter, setSelectedMakeFilter] = useState<string>('');
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Smooth tab switching handler that scrolls directly to the tab content section
  const handleSwitchTab = (tab: 'inventory' | 'analytics' | 'sellers' | 'offers' | 'leads' | 'company' | 'whatsapp' | 'subscription' | 'notifications') => {
    setActiveTab(tab);
    setTimeout(() => {
      const el = document.getElementById('agency-tab-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
  };

  const [selectedOffer, setSelectedOffer] = useState<PrivateCarOffer | null>(null);
  const [agencyNoteInput, setAgencyNoteInput] = useState('');
  const [copiedCarId, setCopiedCarId] = useState<string | null>(null);
  const [copiedPaymentText, setCopiedPaymentText] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [plansCycleView, setPlansCycleView] = useState<'monthly' | 'yearly'>('monthly');

  // PDF Quote Modal State
  const [quoteCar, setQuoteCar] = useState<CarListing | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // Inventory CSV/Excel Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [quickExportSuccess, setQuickExportSuccess] = useState(false);

  const handleOpenQuoteModal = (car: CarListing) => {
    setQuoteCar(car);
    setIsQuoteModalOpen(true);
  };

  const handleQuickExportCsv = () => {
    if (filteredCars.length === 0 && agencyCars.length === 0) return;
    const carsToExport = filteredCars.length > 0 ? filteredCars : agencyCars;
    downloadInventoryCsv(carsToExport, {
      delimiter: ';',
      agency: currentAgency,
    });
    setQuickExportSuccess(true);
    setTimeout(() => setQuickExportSuccess(false), 3000);
  };

  const handleCopyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Company Profile State (Datos de Empresa para Membrete & PDF)
  const [companyName, setCompanyName] = useState(currentAgency?.name || '');
  const [companyLogo, setCompanyLogo] = useState(currentAgency?.logoUrl || '');
  const [companyBanner, setCompanyBanner] = useState(currentAgency?.bannerUrl || '');
  const [companyOwnerName, setCompanyOwnerName] = useState(currentAgency?.ownerName || '');
  const [companyTaxId, setCompanyTaxId] = useState(currentAgency?.cuitOrTaxId || '7.226.273-7');
  const [companyAddress, setCompanyAddress] = useState(currentAgency?.address || '');
  const [companyCity, setCompanyCity] = useState(currentAgency?.city || '');
  const [companyProvince, setCompanyProvince] = useState(currentAgency?.provinceOrState || '');
  const [companyPhone, setCompanyPhone] = useState(currentAgency?.phone || '');
  const [companyWhatsapp, setCompanyWhatsapp] = useState(currentAgency?.whatsappNumber || '');
  const [companyEmail, setCompanyEmail] = useState(currentAgency?.email || '');
  const [companyWebsite, setCompanyWebsite] = useState(currentAgency?.website || 'https://www.micarro.com');
  const [companyBankInfo, setCompanyBankInfo] = useState(
    currentAgency?.bankInfo || 'Banco Itaú / Continental • Cta Cte Gs: 620011158 • Alias SIPAP: 7226273'
  );
  const [companyDefaultWarranty, setCompanyDefaultWarranty] = useState(
    currentAgency?.defaultWarranty || 'Garantía mecánica escrita de 6 meses o 10.000 km (motor y caja). Chequeo de 100 puntos.'
  );
  const [companyOpeningHours, setCompanyOpeningHours] = useState(
    currentAgency?.openingHours || 'Lunes a Viernes de 08:00 a 18:30 | Sábados de 08:30 a 13:00'
  );
  const [companyAbout, setCompanyAbout] = useState(
    currentAgency?.about || 'Concesionaria líder en venta de vehículos seleccionados, 0km y usados garantizados.'
  );
  const [companySavedAlert, setCompanySavedAlert] = useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(true);

  // Sync form states when currentAgency updates
  useEffect(() => {
    if (currentAgency) {
      setCompanyName(currentAgency.name);
      setCompanyLogo(currentAgency.logoUrl);
      setCompanyBanner(currentAgency.bannerUrl || '');
      setCompanyOwnerName(currentAgency.ownerName);
      setCompanyTaxId(currentAgency.cuitOrTaxId || '7.226.273-7');
      setCompanyAddress(currentAgency.address);
      setCompanyCity(currentAgency.city);
      setCompanyProvince(currentAgency.provinceOrState);
      setCompanyPhone(currentAgency.phone);
      setCompanyWhatsapp(currentAgency.whatsappNumber);
      setCompanyEmail(currentAgency.email);
      setCompanyWebsite(currentAgency.website || 'https://www.micarro.com');
      setCompanyBankInfo(
        currentAgency.bankInfo || 'Banco Itaú / Continental • Cta Cte Gs: 620011158 • Alias SIPAP: 7226273'
      );
      setCompanyDefaultWarranty(
        currentAgency.defaultWarranty || 'Garantía mecánica escrita de 6 meses o 10.000 km (motor y caja). Chequeo de 100 puntos.'
      );
      setCompanyOpeningHours(
        currentAgency.openingHours || 'Lunes a Viernes de 08:00 a 18:30 | Sábados de 08:30 a 13:00'
      );
      setCompanyAbout(
        currentAgency.about || 'Concesionaria líder en venta de vehículos seleccionados, 0km y usados garantizados.'
      );
    }
  }, [currentAgency?.id, currentAgency?.name, currentAgency?.logoUrl]);

  // Handle Logo Upload from device
  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentAgency) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const logoData = reader.result;
          setCompanyLogo(logoData);
          updateAgency(currentAgency.id, {
            logoUrl: logoData,
          });
          setCompanySavedAlert(true);
          setTimeout(() => setCompanySavedAlert(false), 4000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Save Company Profile
  const handleSaveCompanyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAgency) return;

    updateAgency(currentAgency.id, {
      name: companyName.trim() || currentAgency.name,
      logoUrl: companyLogo,
      bannerUrl: companyBanner,
      ownerName: companyOwnerName.trim(),
      cuitOrTaxId: companyTaxId.trim(),
      address: companyAddress.trim(),
      city: companyCity.trim(),
      provinceOrState: companyProvince.trim(),
      phone: companyPhone.trim(),
      whatsappNumber: companyWhatsapp.trim().replace(/[^0-9]/g, ''),
      email: companyEmail.trim(),
      website: companyWebsite.trim(),
      bankInfo: companyBankInfo.trim(),
      defaultWarranty: companyDefaultWarranty.trim(),
      openingHours: companyOpeningHours.trim(),
      about: companyAbout.trim(),
    });

    setCompanySavedAlert(true);
    setTimeout(() => setCompanySavedAlert(false), 4000);
  };

  // New Seller Modal State
  const [isAddSellerOpen, setIsAddSellerOpen] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerUsername, setNewSellerUsername] = useState('');
  const [newSellerEmail, setNewSellerEmail] = useState('');
  const [newSellerPhone, setNewSellerPhone] = useState('');
  const [newSellerWhatsapp, setNewSellerWhatsapp] = useState('');
  const [newSellerPassword, setNewSellerPassword] = useState('');
  const [newSellerCommission, setNewSellerCommission] = useState<number>(1.5);
  const [sellerFormError, setSellerFormError] = useState('');

  if (!currentAgency) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
        No hay ninguna concesionaria seleccionada actualmente.
      </div>
    );
  }

  // Cars of this agency
  const agencyCars = carListings.filter((c) => c.agencyId === currentAgency.id);
  const availableCars = agencyCars.filter((c) => c.status === 'available');
  const reservedCars = agencyCars.filter((c) => c.status === 'reserved');
  const soldCars = agencyCars.filter((c) => c.status === 'sold');

  // Filtered cars based on user filters
  const filteredCars = agencyCars.filter((car) => {
    if (selectedStatusFilter !== 'all' && car.status !== selectedStatusFilter) return false;
    if (selectedSellerFilter !== 'all' && car.createdBySellerId !== selectedSellerFilter) return false;
    if (selectedMakeFilter && car.make.trim().toLowerCase() !== selectedMakeFilter.trim().toLowerCase()) return false;
    if (selectedModelFilter) {
      const carMod = car.model.trim().toLowerCase();
      const filterMod = selectedModelFilter.trim().toLowerCase();
      if (carMod !== filterMod && !carMod.includes(filterMod) && !filterMod.includes(carMod)) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${car.make} ${car.model} ${car.version} ${car.year} ${car.color}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  // Distinct makes and models coordinating canonical dictionary with agency stock
  const agencyMakes = getAllBrands(agencyCars);
  const agencyModels = getModelsForBrand(selectedMakeFilter, agencyCars);

  // Sellers of this agency
  const agencySellers = users.filter((u) => u.agencyId === currentAgency.id);

  // Total valuation of current available stock
  const totalStockValueUsd = availableCars.reduce(
    (sum, c) => sum + (c.currency === 'USD' ? c.price : c.price / 1200),
    0
  );
  const totalWhatsappClicks = agencyCars.reduce((sum, c) => sum + (c.whatsappInquiriesCount || 0), 0);

  // Private offers targeted to this agency or to all
  const relevantOffers = privateOffers.filter(
    (o) =>
      o.preferredAgencyId === currentAgency.id ||
      o.preferredAgencyId === 'all' ||
      o.assignedAgencyId === currentAgency.id
  );

  // Agency subscription plan
  const agencyPlan =
    subscriptionPlans.find((p) => p.id === currentAgency.subscriptionPlanId) || subscriptionPlans[1];
  const maxCarsAllowed = agencyPlan ? agencyPlan.maxCars : 30;
  const capacityPercent = Math.min(Math.round((agencyCars.length / maxCarsAllowed) * 100), 100);

  // Invoices of this agency
  const agencyInvoices = invoices.filter((i) => i.agencyId === currentAgency.id);

  // Leads for this agency
  const agencyLeads = leads.filter((l) => l.agencyId === currentAgency.id);
  const unreadLeadsCount = agencyLeads.filter((l) => l.status === 'new').length;
  const unreadOffersCount = relevantOffers.filter((o) => o.status === 'pending').length;
  const totalUnreadNotifs = unreadLeadsCount + unreadOffersCount;

  // Copy quick WhatsApp sales pitch to clipboard
  const handleCopyPitch = (car: CarListing) => {
    const text = `🚗 *${car.make} ${car.model} ${car.version}* (${car.year})\n💰 Precio: ${car.currency} ${car.price.toLocaleString('es-ES')}\n⚡ Kilometraje: ${car.mileage.toLocaleString('es-ES')} km | Transmisión: ${car.transmission}\n🛡️ Garantía oficial con peritaje mecánico.\n📲 ¡Consultame ahora por WhatsApp para más detalles!`;
    navigator.clipboard.writeText(text);
    setCopiedCarId(car.id);
    setTimeout(() => setCopiedCarId(null), 2000);
  };

  const handleCreateSeller = (e: React.FormEvent) => {
    e.preventDefault();
    setSellerFormError('');

    if (!newSellerName.trim() || !newSellerUsername.trim() || !newSellerEmail.trim() || !newSellerPassword) {
      setSellerFormError('Por favor completa todos los campos obligatorios.');
      return;
    }

    const exists = users.some(
      (u) =>
        u.username.toLowerCase() === newSellerUsername.trim().toLowerCase() ||
        u.email.toLowerCase() === newSellerEmail.trim().toLowerCase()
    );

    if (exists) {
      setSellerFormError('El nombre de usuario o correo ya está registrado.');
      return;
    }

    addUser({
      name: newSellerName.trim(),
      username: newSellerUsername.trim().toLowerCase(),
      email: newSellerEmail.trim().toLowerCase(),
      phone: newSellerPhone.trim() || currentAgency.phone,
      whatsappNumber: newSellerWhatsapp.trim().replace(/[^0-9]/g, '') || currentAgency.whatsappNumber,
      agencyId: currentAgency.id,
      agencyName: currentAgency.name,
      role: 'seller',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`,
      password: newSellerPassword,
      isActive: true,
      commissionRate: Number(newSellerCommission) || 1.5,
      carsLoadedCount: 0,
      carsSoldCount: 0,
    });

    setIsAddSellerOpen(false);
    setNewSellerName('');
    setNewSellerUsername('');
    setNewSellerEmail('');
    setNewSellerPhone('');
    setNewSellerWhatsapp('');
    setNewSellerPassword('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Welcome Bar with Seller Info & Fast Actions (Sport Car with Azul Celeste background) */}
      <div className="relative rounded-3xl p-6 sm:p-7 shadow-xl overflow-hidden border border-sky-400/30 text-white bg-slate-950">
        {/* Background Sports Car Image with Azul Celeste / Sky Blue Glow */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=1600&auto=format&fit=crop&q=85"
            alt="Fondo automóvil deportivo Portal Carga"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-right sm:object-right-center opacity-40 scale-105 filter saturate-150 contrast-110"
          />
          {/* Subtle directional gradients for azul celeste atmosphere and impeccable text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 sm:via-slate-950/70 to-sky-950/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-sky-900/30"></div>
        </div>

        {/* Ambient celeste/cyan light flares */}
        <div className="absolute -top-10 right-10 w-72 h-72 bg-sky-400/20 rounded-full blur-3xl pointer-events-none z-0"></div>
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none z-0"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Agency & Seller Profile Info */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <AgencyLogo
                logoUrl={currentAgency.logoUrl}
                name={currentAgency.name}
                size="xl"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white drop-shadow-sm">{currentAgency.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-400/20 text-sky-200 border border-sky-400/40 backdrop-blur-md">
                  {agencyPlan.name}
                </span>
                {currentAgency.verified && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 backdrop-blur-md">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verificada
                  </span>
                )}
              </div>

              {/* Logged in seller tag */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-sky-100/90 pt-0.5">
                {currentUser ? (
                  <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-sky-400/30 backdrop-blur-md">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-4 h-4 rounded-full object-cover border border-sky-400"
                    />
                    <span>
                      Sesión activa: <strong className="text-sky-300 font-bold">{currentUser.name}</strong> (
                      {currentUser.role === 'seller' ? 'Vendedor' : 'Gerente'})
                    </span>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="text-sky-300 hover:text-white underline text-[11px] ml-1 font-semibold"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors shadow-md shadow-sky-500/20"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Iniciar Sesión de Vendedor</span>
                  </button>
                )}

                <span className="text-sky-400/60 hidden sm:inline">•</span>
                <span className="text-sky-200/80 hidden sm:inline flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  {currentAgency.address}, {currentAgency.city}
                </span>
              </div>
            </div>
          </div>

          {/* Quick CTAs */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Interactive Onboarding Quick Guide Button */}
            <AgencyOnboardingTutorial
              agencyName={currentAgency.name}
              onOpenNewCarModal={() => onOpenCarForm()}
            />

            <button
              id="hero-alertas-cotizaciones-btn"
              onClick={() => handleSwitchTab('notifications')}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl border backdrop-blur-md transition-all shadow-md active:scale-98 cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black ring-2 ring-amber-300/50'
                  : 'bg-sky-950/80 hover:bg-sky-900/90 text-white font-bold border-sky-400/30'
              }`}
              title="Ver Centro de Notificaciones y Cotizaciones"
            >
              <div className="relative">
                {totalUnreadNotifs > 0 ? (
                  <BellRing className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-slate-950' : 'text-amber-300 animate-bounce'}`} />
                ) : (
                  <Bell className="w-4 h-4 text-sky-300" />
                )}
                {totalUnreadNotifs > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                )}
              </div>
              <span className="text-xs">Alertas & Cotizaciones</span>
              {totalUnreadNotifs > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black font-mono shadow-sm">
                  {totalUnreadNotifs}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (currentAgency.subscriptionStatus !== 'active' && currentAgency.subscriptionStatus !== 'trial') {
                  handleSwitchTab('subscription');
                  alert(`⛔ Suscripción inactiva: La concesionaria "${currentAgency.name}" tiene su membresía suspendida o pendiente de pago. Debe abonar el servicio para habilitar la carga de vehículos y el acceso a los vendedores.`);
                  return;
                }
                onOpenCarForm();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/25 transition-all active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>➕ Cargar Nuevo Auto</span>
            </button>

            <button
              onClick={() => setIsAddSellerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-sky-950/70 hover:bg-sky-900/80 text-white font-bold text-xs border border-sky-400/30 backdrop-blur-md transition-colors"
            >
              <UserPlus className="w-4 h-4 text-sky-300" />
              <span>Nuevo Vendedor</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              title="Exportar base completa a CSV/Excel"
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 font-bold text-xs border border-emerald-400/40 backdrop-blur-md transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Exportar Stock</span>
            </button>
          </div>
        </div>

        {/* Inventory Capacity Bar */}
        <div className="mt-5 pt-4 border-t border-sky-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs relative z-10">
          <div className="flex items-center gap-2 text-sky-100">
            <span>Cupo de Salón ({agencyPlan.name}):</span>
            <strong className="text-amber-300 font-bold font-mono">
              {agencyCars.length} / {maxCarsAllowed} vehículos
            </strong>
          </div>
          <div className="w-full sm:w-64 bg-slate-900/80 rounded-full h-2.5 overflow-hidden border border-sky-400/30">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capacityPercent > 85 ? 'bg-rose-500' : 'bg-sky-400'
              }`}
              style={{ width: `${capacityPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Interactive Car Brand Logos Bar */}
        <div className="mt-4 pt-3.5 border-t border-sky-400/20 relative z-10">
          <CarBrandStrip
            selectedBrand={selectedMakeFilter}
            onSelectBrand={(brandName) => {
              setSelectedMakeFilter(brandName);
              setSelectedModelFilter('');
              handleSwitchTab('inventory');
            }}
            title="Marcas en salón y red de agencias:"
            theme="dark"
          />
        </div>
      </div>

      {/* Agency Subscription Status Alert */}
      {currentAgency.subscriptionStatus !== 'active' && currentAgency.subscriptionStatus !== 'trial' && (
        <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-900 flex items-center gap-2">
                <span>⛔ Concesionaria con Suscripción Inactiva / Pago Pendiente</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-200 text-rose-800 font-bold uppercase font-mono">
                  {currentAgency.subscriptionStatus === 'past_due'
                    ? 'En Mora'
                    : currentAgency.subscriptionStatus === 'suspended'
                    ? 'Suspendida'
                    : 'Inactiva'}
                </span>
              </h3>
              <p className="text-xs text-rose-800 mt-1 max-w-2xl leading-relaxed">
                El acceso para vendedores y la publicación de nuevos vehículos se encuentran bloqueados hasta que el titular de la concesionaria abone el servicio mensual o canjee un código de membresía.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={() => handleSwitchTab('subscription')}
              className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 justify-center w-full md:w-auto"
            >
              <CreditCard className="w-4 h-4" />
              <span>Abonar Plan / Ver Medios de Cobro</span>
            </button>
          </div>
        </div>
      )}

      {/* Prominent Welcome & Quick Guide Card */}
      {showWelcomeGuide && (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 border-2 border-sky-500/40 rounded-3xl p-5 sm:p-6 shadow-xl text-white">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow-lg shadow-amber-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Guía de Inicio Rápido
                  </span>
                  <span className="text-xs text-sky-300 font-medium">3 Pasos Clave</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  ¡Bienvenido al Panel de Control de {currentAgency.name}!
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  Sigue estos 3 pasos para poner en marcha tu salón de ventas y comenzar a recibir consultas directas por WhatsApp:
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWelcomeGuide(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer"
              title="Ocultar bienvenida"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3 Step Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5 relative z-10">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-sky-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 font-black text-xs flex items-center justify-center border border-blue-500/30">
                  1
                </span>
                <Plus className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-white">1. Cargar Auto al Salón</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pulsa el botón amarillo <strong>"+ Cargar Nuevo Auto"</strong> para ingresar marca, modelo, precio, año y kilometraje de la unidad.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">
                  2
                </span>
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-white">2. Fotos y Redacción con IA</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sube fotos del vehículo y haz clic en <strong>"Generar con IA"</strong> para redactar una descripción vendedora al instante.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/30">
                  3
                </span>
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white">3. Cotizaciones y WhatsApp</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Genera fichas técnicas en PDF con tu membrete oficial y recibe consultas de compradores directo a tu WhatsApp.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const btn = document.getElementById('btn-reopen-agency-tutorial');
                  if (btn) btn.click();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Iniciar Tour Interactivo Paso a Paso</span>
              </button>
            </div>

            <p className="text-xs text-sky-200/80">
              💡 Puedes volver a abrir esta guía en cualquier momento pulsando <strong>"Guía de Uso"</strong> en el encabezado.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">En Salón</span>
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{availableCars.length}</p>
          <p className="text-[10px] text-emerald-700 font-semibold">Listos para entrega</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Reservados</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-700">{reservedCars.length}</p>
          <p className="text-[10px] text-slate-500">Seña ingresada</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Vendidos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{soldCars.length}</p>
          <p className="text-[10px] text-emerald-700/80 font-semibold">Operaciones cerradas</p>
        </div>

        <div
          onClick={() => handleSwitchTab('analytics')}
          className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
          title="Ver estadísticas detalladas de clics y visualizaciones"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold group-hover:text-emerald-700 transition-colors">Clics WhatsApp</span>
            <MessageCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{totalWhatsappClicks}</p>
          <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
            <span>Ver gráficos & métricas →</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Vendedores</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700">{agencySellers.length}</p>
          <p className="text-[10px] text-slate-500">Asesores activos</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Valor Salón</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-700 truncate font-mono">
            ${Math.round(totalStockValueUsd).toLocaleString('es-ES')}
          </p>
          <p className="text-[10px] text-slate-500">Stock disponible (USD)</p>
        </div>
      </div>

      {/* Main Navigation Tabs Section */}
      <div id="agency-tab-section" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 text-xs font-semibold">
          <button
            id="tab-btn-notifications"
            onClick={() => handleSwitchTab('notifications')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md ring-2 ring-amber-300'
                : 'text-slate-700 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <BellRing className={`w-4 h-4 ${totalUnreadNotifs > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-600'}`} />
            <span>Notificaciones & Alertas</span>
            {totalUnreadNotifs > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black font-mono">
                {totalUnreadNotifs} nuevas
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold font-mono">
                {agencyLeads.length + relevantOffers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleSwitchTab('inventory')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-blue-700 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Salón de Autos ({agencyCars.length})</span>
          </button>

          <button
            id="tab-btn-agency-analytics"
            onClick={() => handleSwitchTab('analytics')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-blue-700 text-white font-bold shadow-sm ring-2 ring-blue-400/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-blue-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span>Estadísticas & Gráficos</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
              {totalWhatsappClicks} chats
            </span>
          </button>

          <button
            onClick={() => handleSwitchTab('sellers')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'sellers'
                ? 'bg-blue-700 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Equipo de Vendedores ({agencySellers.length})</span>
          </button>

          <button
            onClick={() => handleSwitchTab('leads')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'leads'
                ? 'bg-blue-700 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Prospectos & CRM ({agencyLeads.length})</span>
          </button>

          <button
            onClick={() => handleSwitchTab('offers')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'offers'
                ? 'bg-blue-700 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Toma de Usados ({relevantOffers.length})</span>
          </button>

          <button
            id="tab-btn-whatsapp-settings"
            onClick={() => handleSwitchTab('whatsapp')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white font-black shadow-md ring-2 ring-emerald-400/40'
                : 'text-slate-700 hover:text-slate-900 hover:bg-emerald-50'
            }`}
          >
            <MessageCircle className={`w-4 h-4 ${activeTab === 'whatsapp' ? 'text-white fill-white' : 'text-emerald-600'}`} />
            <span>WhatsApp Business & Mensajes</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
              Auto
            </span>
          </button>

          <button
            onClick={() => handleSwitchTab('company')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'company'
                ? 'bg-blue-700 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Datos de Empresa</span>
          </button>

          <button
            onClick={() => handleSwitchTab('subscription')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'subscription'
                ? 'bg-blue-700 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Planes & Medios de Pago</span>
          </button>
        </div>

        {/* TAB 0: NOTIFICATIONS & COMMERCIAL ALERTS */}
        {activeTab === 'notifications' && (
          <div className="animate-fadeIn">
            <AgencyNotificationPanel
              onOpenCarDetail={onOpenCarDetail}
              onOpenQuotePdf={handleOpenQuoteModal}
              onNavigateToTab={(t) => handleSwitchTab(t)}
            />
          </div>
        )}

        {/* TAB: ANALYTICS & RECHARTS STATS */}
        {activeTab === 'analytics' && (
          <div className="animate-fadeIn">
            <AgencyStatsView
              agency={currentAgency}
              cars={agencyCars}
              sellers={agencySellers}
              formatPrice={formatPrice}
              onOpenCarDetail={onOpenCarDetail}
              onOpenQuotePdf={handleOpenQuoteModal}
            />
          </div>
        )}
      </div>

      {/* TAB 1: INVENTORY & SALON */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Quick Interactive Upload Tutorial Banner */}
          <UploadTutorialBanner onStartUpload={() => onOpenCarForm()} />

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 text-xs shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por marca, modelo, versión..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                {/* Make Dropdown */}
                <select
                  value={selectedMakeFilter}
                  onChange={(e) => {
                    setSelectedMakeFilter(e.target.value);
                    setSelectedModelFilter('');
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="">Todas las Marcas</option>
                  {agencyMakes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                {/* Model Dropdown */}
                <select
                  value={selectedModelFilter}
                  onChange={(e) => setSelectedModelFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="">
                    {selectedMakeFilter ? `Todos los ${selectedMakeFilter}` : 'Todos los Modelos'}
                  </option>
                  {agencyModels.map((mod) => (
                    <option key={mod} value={mod}>
                      {mod}
                    </option>
                  ))}
                </select>

                {/* Seller Filter */}
                <select
                  value={selectedSellerFilter}
                  onChange={(e) => setSelectedSellerFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="all">Todos los Vendedores</option>
                  {currentUser && (
                    <option value={currentUser.id}>👤 Mis Autos ({currentUser.name})</option>
                  )}
                  {agencySellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role === 'seller' ? 'Vendedor' : 'Gerente'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 self-end lg:self-auto shrink-0 flex-wrap">
                <span className="text-slate-500 text-xs font-semibold">{filteredCars.length} autos</span>

                {/* Export CSV / Excel Button */}
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  title="Exportar inventario a archivo CSV / Excel para gestión externa"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Exportar CSV / Excel</span>
                </button>

                <button
                  onClick={() => onOpenCarForm()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Cargar Auto</span>
                </button>
              </div>
            </div>

            {/* Status Filter Tabs & Active Filter indicators */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'available', label: 'Disponibles' },
                  { id: 'reserved', label: 'Reservados' },
                  { id: 'sold', label: 'Vendidos' },
                  { id: 'draft', label: 'Borrador' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStatusFilter(st.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      selectedStatusFilter === st.id
                        ? 'bg-blue-700 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Reset active filters */}
              {(selectedMakeFilter || selectedModelFilter || selectedSellerFilter !== 'all' || selectedStatusFilter !== 'all' || searchQuery) && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedMakeFilter && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-[11px]">
                      Marca: {selectedMakeFilter}
                      <button
                        onClick={() => {
                          setSelectedMakeFilter('');
                          setSelectedModelFilter('');
                        }}
                        className="hover:text-blue-950 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedModelFilter && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-[11px]">
                      Modelo: {selectedModelFilter}
                      <button
                        onClick={() => setSelectedModelFilter('')}
                        className="hover:text-blue-950 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedMakeFilter('');
                      setSelectedModelFilter('');
                      setSelectedSellerFilter('all');
                      setSelectedStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline flex items-center gap-0.5 ml-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Limpiar filtros</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cars List Grid */}
          {filteredCars.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3 shadow-sm">
              <Car className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No hay autos con los filtros seleccionados</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Probá cambiando los filtros o cargá tu primer vehículo al salón para comenzar a recibir consultas por WhatsApp.
              </p>
              <button
                onClick={() => onOpenCarForm()}
                className="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-2 mt-2 shadow"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Cargar Primer Auto</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCars.map((car) => {
                const isCopied = copiedCarId === car.id;
                return (
                  <div
                    key={car.id}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden shadow-sm flex flex-col group transition-all"
                  >
                    {/* Photo Banner with Badges */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      <img
                        src={car.photos[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'}
                        alt={car.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                              car.status === 'available'
                                ? 'bg-emerald-600 text-white'
                                : car.status === 'reserved'
                                ? 'bg-purple-600 text-white'
                                : car.status === 'sold'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-600 text-white'
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
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-800 border border-slate-200 shadow-sm">
                            {car.year}
                          </span>
                        </div>

                        <button
                          onClick={() => toggleCarFeatured(car.id)}
                          title="Destacar en portada"
                          className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                            car.isFeatured
                              ? 'bg-amber-400 text-slate-950 shadow-md'
                              : 'bg-white/80 text-slate-600 hover:text-amber-500'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>

                      {/* Price Pill */}
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md text-slate-900 font-black text-sm border border-slate-200 shadow-sm font-mono">
                          {formatPrice(car.price, car.currency)}
                        </span>
                      </div>

                      {/* WhatsApp Clicks Pill */}
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 shadow-sm">
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>{car.whatsappInquiriesCount || 0} clics</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3
                          onClick={() => onOpenCarDetail(car)}
                          className="font-bold text-slate-900 text-sm hover:text-blue-700 cursor-pointer line-clamp-1"
                        >
                          {car.title}
                        </h3>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-medium">
                          <span>{car.mileage.toLocaleString('es-ES')} km</span>
                          <span>•</span>
                          <span>{car.transmission}</span>
                          <span>•</span>
                          <span>{car.fuelType}</span>
                        </div>

                        {/* Seller assigned badge */}
                        <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                          <UserCheck className="w-3 h-3 text-blue-700 shrink-0" />
                          <span className="truncate">
                            Vendedor: <strong className="text-slate-900">{car.sellerName || 'Concesionaria'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                          {/* Change status quick dropdown */}
                          <select
                            value={car.status}
                            onChange={(e) => updateCarStatus(car.id, e.target.value as any)}
                            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold"
                          >
                            <option value="available">🟢 Disponible</option>
                            <option value="reserved">🟣 Reservado</option>
                            <option value="sold">🔴 Vendido</option>
                            <option value="draft">⚪ Borrador</option>
                          </select>

                          {/* Quick pitch copy button */}
                          <button
                            onClick={() => handleCopyPitch(car)}
                            title="Copiar texto de venta para WhatsApp"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenQuoteModal(car)}
                            title="Generar Cotización Proforma en PDF"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center gap-1 text-[11px] font-bold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">PDF</span>
                          </button>

                          <button
                            onClick={() => onOpenCarForm(car)}
                            title="Editar datos del auto"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openWhatsappForCar(car)}
                            title="Probar enlace de WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setCarToDelete(car)}
                            title="Eliminar auto del inventario"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SELLERS TEAM MANAGEMENT */}
      {activeTab === 'sellers' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-700" />
                <span>Equipo de Vendedores y Asesores de {currentAgency.name}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cada vendedor tiene su usuario y contraseña para cargar autos, responder cotizaciones y atender WhatsApp.
              </p>
            </div>

            <button
              onClick={() => setIsAddSellerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Registrar Nuevo Vendedor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agencySellers.map((seller) => {
              const loadedCarsCount = carListings.filter((c) => c.createdBySellerId === seller.id).length;
              const soldCarsCount = carListings.filter(
                (c) => c.createdBySellerId === seller.id && c.status === 'sold'
              ).length;

              return (
                <div
                  key={seller.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm flex flex-col justify-between space-y-4 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={seller.avatarUrl}
                      alt={seller.name}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-blue-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{seller.name}</h3>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            seller.role === 'agency_admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {seller.role === 'agency_admin' ? 'Gerente' : 'Vendedor'}
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 font-mono">@{seller.username}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{seller.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-slate-500 text-[11px]">Autos Cargados:</p>
                      <p className="font-bold text-slate-900">{loadedCarsCount} unidades</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">Ventas Cerradas:</p>
                      <p className="font-bold text-emerald-700">{soldCarsCount} ventas</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">WhatsApp Directo:</p>
                      <p className="font-bold text-blue-700 font-mono">{seller.whatsappNumber}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">Comisión Pactada:</p>
                      <p className="font-bold text-slate-900">{seller.commissionRate || 1.5}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">
                      Estado: <strong className="text-emerald-700">Activo</strong>
                    </span>
                    <button
                      onClick={() => {
                        const phone = seller.whatsappNumber.replace(/[^0-9]/g, '');
                        window.open(`https://wa.me/${phone}`, '_blank');
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LEADS & CRM */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-700" />
              <span>Prospectos y Consultas Recibidas (CRM)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Clientes que hicieron clic en WhatsApp o enviaron formularios de consulta por vehículos de tu salón.
            </p>
          </div>

          {agencyLeads.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-500 shadow-sm">
              No hay prospectos registrados aún para esta concesionaria.
            </div>
          ) : (
            <div className="space-y-3">
              {agencyLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm space-y-3 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {lead.clientName} • <span className="text-blue-700">{lead.carTitle}</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Tel: {lead.clientPhone} {lead.clientEmail && `• ${lead.clientEmail}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold"
                      >
                        <option value="new">🟢 Nuevo</option>
                        <option value="contacted">🔵 Contactado</option>
                        <option value="test_drive_scheduled">🟣 Prueba Agendada</option>
                        <option value="reserved">🟡 Con Seña</option>
                        <option value="sold">⭐ Vendido</option>
                        <option value="discarded">⚪ Descartado</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <p className="text-slate-700 italic">"{lead.message}"</p>
                    {lead.tradeInVehicle && (
                      <p className="text-[11px] text-amber-800 font-bold pt-1">
                        🚘 Entrega Usado en Permuta: {lead.tradeInVehicle}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">
                      {new Date(lead.createdAt).toLocaleString('es-ES')}
                    </span>

                    <div className="flex items-center gap-2">
                      {lead.carId && (
                        <button
                          onClick={() => {
                            const foundCar = carListings.find((c) => c.id === lead.carId);
                            if (foundCar) {
                              handleOpenQuoteModal(foundCar);
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                          title="Generar Cotización Proforma en PDF para este cliente"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Cotización PDF</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const phone = lead.clientPhone.replace(/[^0-9]/g, '');
                          const msg = `¡Hola ${lead.clientName}! 👋 Te escribo de *${currentAgency.name}* sobre tu consulta por el *${lead.carTitle}*. ¿Cómo estás?`;
                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Abrir Chat de WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRIVATE OFFERS / TOMA DE USADOS */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-700" />
              <span>Autos Ofrecidos por Particulares para Toma Directa o Consignación</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Particulares que completaron el formulario "Vender Mi Auto" seleccionando tu agencia o la red general.
            </p>
          </div>

          {relevantOffers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-500 shadow-sm">
              No hay ofertas de particulares registradas aún.
            </div>
          ) : (
            <div className="space-y-3">
              {relevantOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm space-y-4 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">
                          {offer.make} {offer.model} {offer.version} ({offer.year})
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                          Pretende: {offer.currency} {offer.expectedPrice.toLocaleString('es-ES')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {offer.mileage.toLocaleString('es-ES')} km • {offer.transmission} • {offer.fuelType} • {offer.city}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={offer.status}
                        onChange={(e) => updatePrivateOfferStatus(offer.id, e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold"
                      >
                        <option value="pending">🟡 Pendiente de Revisión</option>
                        <option value="agency_interested">🟢 Nos Interesa (Contactar)</option>
                        <option value="consigned">🟣 En Consignación</option>
                        <option value="rejected">🔴 Descartar</option>
                      </select>

                      <button
                        onClick={() => {
                          const phone = offer.contactWhatsapp.replace(/[^0-9]/g, '');
                          const msg = `¡Hola ${offer.contactName}! 👋 Te escribo de la concesionaria *${currentAgency.name}*. Vimos la publicación de tu *${offer.make} ${offer.model} ${offer.year}* en MiCarro. Nos interesa coordinar un peritaje para evaluarlo. ¿Te queda bien esta semana?`;
                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Propietario</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                    <p>
                      <strong>Contacto:</strong> {offer.contactName} ({offer.contactPhone}) • {offer.contactEmail}
                    </p>
                    <p className="mt-1 text-slate-500">
                      <strong>Detalles:</strong> {offer.conditionNotes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SUBSCRIPTION, PLANS & PAYMENT METHODS (PARAGUAY) */}
      {activeTab === 'subscription' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-lg border border-blue-800/40">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Estado: {currentAgency.subscriptionStatus === 'active' ? 'Membresía Activa' : 'Período de Prueba'}</span>
                </span>
                <span className="text-xs text-blue-200 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  Vigencia: <strong className="text-white">{currentAgency.subscriptionExpiresAt || '2027-01-01'}</strong>
                </span>
                <span className="text-xs text-blue-200 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  Capacidad: <strong className="text-white">{agencyCars.length} / {maxCarsAllowed}</strong> autos cargados
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                <span>{agencyPlan.name}</span>
                <span className="text-sm font-semibold px-2.5 py-0.5 rounded-lg bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Tu Plan Actual
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/80 max-w-2xl leading-relaxed">
                {agencyPlan.description}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {onOpenRedeemCode && (
                <button
                  onClick={onOpenRedeemCode}
                  className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95"
                >
                  <KeyRound className="w-4 h-4 text-slate-950" />
                  <span>Canjear Código</span>
                </button>
              )}

              <a
                href={`https://wa.me/595975635770?text=${encodeURIComponent(
                  `¡Hola Administración MiCarro! 👋 Adjunto el comprobante de pago de la membresía para la concesionaria *${currentAgency.name}* (RUC: ${currentAgency.cuitOrTaxId || 'Consultar'}) correspondiente al plan *${agencyPlan.name}*.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Notificar Pago</span>
              </a>
            </div>
          </div>

          {/* SECCIÓN 1: PLANES Y TARIFAS OFICIALES (SOLO LECTURA) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
                    Tarifario Oficial MiCarro
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> Solo Lectura
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-1">
                  Planes de Suscripción & Tarifas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conoce las opciones disponibles para escalar tu agencia. Todos los valores están fijados por la administración oficial.
                </p>
              </div>

              {/* Cycle Toggle: Monthly / Yearly */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setPlansCycleView('monthly')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    plansCycleView === 'monthly'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setPlansCycleView('yearly')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    plansCycleView === 'yearly'
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Anual</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500 text-white text-[10px] font-extrabold uppercase">
                    2 Meses Gratis
                  </span>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => {
                const isCurrent = plan.id === currentAgency.subscriptionPlanId || plan.id === agencyPlan.id;
                const formatted = formatPlanPrice(plan, plansCycleView);

                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative ${
                      isCurrent
                        ? 'bg-blue-50/50 border-2 border-blue-600 shadow-md ring-4 ring-blue-100'
                        : plan.isRecommended
                        ? 'bg-white border-2 border-amber-300 shadow-sm'
                        : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {isCurrent ? (
                        <span className="px-3 py-1 rounded-full bg-blue-700 text-white text-[11px] font-bold shadow-sm flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> Tu Plan Actual
                        </span>
                      ) : plan.isRecommended ? (
                        <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-bold shadow-sm flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> Recomendado
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          Plan Oficial
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 font-medium">
                        Hasta {plan.maxCars} autos
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-black text-slate-900">{plan.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {plan.description}
                        </p>
                      </div>

                      {/* Pricing Box (USD & Guaraníes) */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-black text-slate-900 font-mono">
                            {formatted.usd}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            / {plansCycleView === 'yearly' ? 'año' : 'mes'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center justify-between font-mono">
                          <span>Equivalente en Guaraníes:</span>
                          <span className="font-extrabold">{formatted.pyg}</span>
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span><strong>{plan.maxCars} autos</strong> en salón simultáneo</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Hasta <strong>{plan.maxPhotosPerCar} fotos HD</strong> por auto</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span><strong>{plan.featuredSlots} cupos destacados</strong> en portada</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Contacto directo WhatsApp de vendedores</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Acceso a ofertas de particulares (Toma de usados)</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Redacción de fichas con Inteligencia Artificial</span>
                        </div>
                        {plan.customWatermark && (
                          <div className="flex items-center gap-2 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Marca de agua con logo de la agencia</span>
                          </div>
                        )}
                        {plan.prioritySupport && (
                          <div className="flex items-center gap-2 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Soporte prioritario VIP 24/7</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-6 mt-4 border-t border-slate-100">
                      {isCurrent ? (
                        <div className="w-full py-2.5 rounded-xl bg-blue-100 text-blue-800 font-bold text-xs text-center border border-blue-200">
                          ✓ Plan Actualmente Contratado
                        </div>
                      ) : (
                        <a
                          href={`https://wa.me/595975635770?text=${encodeURIComponent(
                            `¡Hola Administración MiCarro! 👋 Desde la concesionaria *${currentAgency.name}* (RUC: ${currentAgency.cuitOrTaxId || 'Consultar'}) queremos solicitar el cambio/ascenso al *${plan.name}* (${formatted.usd} / ${formatted.pyg}).`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-blue-700 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <span>Solicitar Cambio a este Plan</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 2: MEDIOS DE PAGO & TRANSFERENCIAS DIRECTAS */}
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    🇵🇾 Canales Oficiales
                  </span>
                  <span className="text-xs text-slate-500">Acreditación Directa & Soporte</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Medios de Pago Habilitados & Transferencias Directas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Para tu seguridad y asignarte la cuenta bancaria adecuada (Gs. o USD), solicitá el Alias SIPAP directamente con nuestro equipo.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                <a
                  href={`https://wa.me/595975635770?text=${encodeURIComponent(
                    `¡Hola Administración MiCarro! 👋 Desde la concesionaria *${currentAgency.name}* (RUC: ${currentAgency.cuitOrTaxId || 'Consultar'}) queremos solicitar el Alias SIPAP / datos bancarios o coordinar el pago de nuestra suscripción (${agencyPlan.name}).`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>WhatsApp: +595 975 635 770</span>
                </a>

                <a
                  href="tel:+595975635770"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Llamar</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('+595 975 635 770');
                    setCopiedPaymentText(true);
                    setTimeout(() => setCopiedPaymentText(false), 3000);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                >
                  {copiedPaymentText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span className="text-emerald-700 font-bold">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copiar N°</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Prominent Bank Transfer / SIPAP / CBU Protected Box with Direct Action Buttons */}
            <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                        Canal Principal Recomendado
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Lock className="w-3 h-3 text-slate-400" /> Protección de Datos & Factura Legal
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 mt-0.5">
                      Pagos por Transferencia Bancaria (SIPAP / CBU / Alias)
                    </h4>
                    <p className="text-xs text-slate-600 max-w-2xl mt-1 leading-relaxed">
                      Por motivos de seguridad y para proveerte la cuenta bancaria o Alias SIPAP correspondiente a tu moneda (Guaraníes o Dólares) y timbrado fiscal, solicitá los datos de pago al instante mediante <strong>llamada telefónica</strong> o <strong>WhatsApp directo</strong>.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start md:self-auto flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Acreditación Inmediata
                </span>
              </div>

              {/* ACTION BUTTONS: WhatsApp & Llamada Telefónica Directa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Botón WhatsApp para pedir Alias / Cuentas */}
                <a
                  href={`https://wa.me/595975635770?text=${encodeURIComponent(
                    `¡Hola Administración MiCarro! 👋 Desde la concesionaria *${currentAgency.name}* (RUC: ${currentAgency.cuitOrTaxId || 'Consultar'}) queremos solicitar el *Alias SIPAP / datos bancarios* para realizar el pago de la suscripción (${agencyPlan.name}).`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white tracking-wider">
                      Respuesta Inmediata
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-emerald-100 font-semibold">Solicitar por WhatsApp</p>
                    <p className="text-base font-black text-white mt-0.5">Pedir Alias / Datos Bancarios</p>
                    <p className="text-[11px] text-emerald-100 font-mono mt-1">+595 975 635 770</p>
                  </div>
                </a>

                {/* Botón Llamada Directa */}
                <a
                  href="tel:+595975635770"
                  className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 text-slate-300 tracking-wider">
                      Línea Directa
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PhoneCall className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-slate-400 font-semibold">Atención Telefónica</p>
                    <p className="text-base font-black text-white mt-0.5">Llamar para Transferencias</p>
                    <p className="text-[11px] text-slate-300 font-mono mt-1">+595 975 635 770</p>
                  </div>
                </a>

                {/* Botón Enviar Comprobante */}
                <a
                  href={`https://wa.me/595975635770?text=${encodeURIComponent(
                    `¡Hola Administración MiCarro! 👋 Adjunto el comprobante de transferencia bancaria de la concesionaria *${currentAgency.name}* (RUC: ${currentAgency.cuitOrTaxId || 'Consultar'}) para el plan *${agencyPlan.name}*.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-950 transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 tracking-wider">
                      Habilitación &lt; 5 min
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-blue-200/70 text-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Receipt className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-blue-700 font-semibold">¿Ya transferiste?</p>
                    <p className="text-base font-bold text-blue-950 mt-0.5">Enviar Comprobante de Pago</p>
                    <p className="text-[11px] text-blue-700 font-mono mt-1">+595 975 635 770</p>
                  </div>
                </a>
              </div>

              {/* Guía Rápida & Políticas de Acreditación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Cuentas Seguras</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Disponibles en Guaraníes (₲) y Dólares (USD $).</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Horario de Pagos</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Lun a Vie 08:00 a 19:00 | Sáb 08:30 a 13:00</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Factura Oficial</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Emisión con timbrado fiscal y recibo legal.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Activación Rápida</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Acreditación y alta de cupos al instante.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Payment Gateways Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paymentGateways
                .filter((gw) => gw.isEnabled && gw.type !== 'bank_transfer')
                .map((gw) => (
                  <div
                    key={gw.id}
                    className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                          {gw.type === 'card'
                            ? 'Mercado Pago (Checkout Pro & QR)'
                            : gw.type === 'cash'
                            ? 'Cobro Presencial en Sede'
                            : 'Billetera Digital'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Oficial</span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{gw.name}</h4>

                      {gw.type === 'billetera' && (
                        <div className="text-xs text-slate-700 space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                          <p className="font-semibold text-slate-700">Línea de Giros & Billeteras:</p>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-slate-900 font-black text-sm">+595 975 635 770</span>
                          </div>
                          <div className="pt-1">
                            <a
                              href="https://wa.me/595975635770?text=Hola!%20Quisiera%20hacer%20un%20giro/pago%20por%20billetera%20electr%C3%B3nica%20(Tigo%20Money%20/%20Personal%20Pay)."
                              target="_blank"
                              rel="noreferrer"
                              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
                            >
                              <MessageCircle className="w-4 h-4 fill-white" />
                              <span>WhatsApp: +595 975 635 770</span>
                            </a>
                          </div>
                          {gw.currencyAccepted && <p className="text-[11px] text-slate-500">Moneda: {gw.currencyAccepted}</p>}
                        </div>
                      )}

                      {gw.locationOrOffice && (
                        <div className="text-xs text-slate-700 space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                          <p className="flex items-start gap-1.5 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>{gw.locationOrOffice}</span>
                          </p>
                          {gw.currencyAccepted && (
                            <p className="text-[11px] text-slate-500"><strong>Monedas:</strong> {gw.currencyAccepted}</p>
                          )}
                          <p className="text-[11px] text-slate-500"><strong>Horario:</strong> Lunes a Viernes 08:30 a 18:00 hs</p>
                          <div className="pt-1">
                            <a
                              href="https://wa.me/595975635770?text=Hola!%20Quisiera%20coordinar%20un%20pago%20presencial%20en%20sede%20para%20la%20suscripci%C3%B3n%20MiCarro."
                              target="_blank"
                              rel="noreferrer"
                              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm"
                            >
                              <MessageCircle className="w-4 h-4 fill-white" />
                              <span>Coordinar por WhatsApp (+595 975 635 770)</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {gw.paymentLink && (
                        <div className="space-y-2 pt-1">
                          <a
                            href={gw.paymentLink}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-sm"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pagar con Mercado Pago</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href="https://wa.me/595975635770?text=Hola!%20Tengo%20una%20consulta%20sobre%20el%20pago%20con%20tarjeta%20en%20MiCarro."
                            target="_blank"
                            rel="noreferrer"
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition-colors border border-emerald-200"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ayuda por WhatsApp: +595 975 635 770</span>
                          </a>
                        </div>
                      )}

                      {gw.instructions && (
                        <p className="text-[11px] text-slate-600 leading-relaxed italic">
                          {gw.instructions}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aceptación Garantizada
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* SECCIÓN 3: NOTIFICACIÓN DE PAGO & CONTACTO DIRECTO */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-emerald-700/40">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30">
                  Activación Rápida
                </span>
                <span className="text-xs text-emerald-200">Facturación con Timbrado Oficial</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-emerald-400" />
                <span>¿Realizaste tu transferencia o pago? Envíanos tu comprobante</span>
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                Adjunta la captura o comprobante bancario por WhatsApp al <strong>+595 975 635 770</strong> con el número de factura para habilitación inmediata.
              </p>

              {/* Direct Contact Numbers & Email */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-emerald-200 font-medium">
                <a
                  href="tel:+595975635770"
                  className="flex items-center gap-1.5 hover:text-white bg-white/10 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp / Tel: <strong>+595 975 635 770</strong></span>
                </a>
                <a
                  href="mailto:mecanicadakar@gmail.com"
                  className="flex items-center gap-1.5 hover:text-white bg-white/10 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Email: <strong>mecanicadakar@gmail.com</strong></span>
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <a
                href={`https://wa.me/595975635770?text=${encodeURIComponent(
                  `¡Hola Administración MiCarro! 👋 Adjunto el comprobante de pago de la membresía para la concesionaria *${currentAgency.name}* (RUC: ${currentAgency.cuitOrTaxId || 'Consultar'}) para el plan *${agencyPlan.name}*.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2.5 transition-transform active:scale-95"
              >
                <MessageCircle className="w-5 h-5 fill-slate-950" />
                <span>Enviar Comprobante por WhatsApp</span>
              </a>

              {onOpenRedeemCode && (
                <button
                  type="button"
                  onClick={onOpenRedeemCode}
                  className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-white/20"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Canjear Código de Suscripción</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DATOS DE EMPRESA & MEMBRETE PARA COTIZACIONES PDF */}
      {activeTab === 'company' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Info Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-800/40">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold border border-blue-400/30">
                <Building2 className="w-3.5 h-3.5" />
                <span>Perfil Corporativo & Membrete Oficial</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Datos de Empresa & Encabezado de Cotizaciones
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Personalizá la información fiscal, logo oficial, teléfonos de contacto y cuentas bancarias.
                Estos datos se sincronizan automáticamente en el encabezado y pie de página de las cotizaciones en PDF y en la ficha de tu agencia.
              </p>
            </div>

            {agencyCars.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenQuoteModal(agencyCars[0])}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-transform active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>Ver Ejemplo de Cotización PDF</span>
              </button>
            )}
          </div>

          {/* Success Save Alert Notification */}
          {companySavedAlert && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>¡Datos de la empresa guardados y actualizados exitosamente! Ya se aplicaron al membrete y PDF.</span>
              </div>
              <button
                type="button"
                onClick={() => setCompanySavedAlert(false)}
                className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSaveCompanyProfile} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Visual Identity & Logo */}
              <div className="space-y-6">
                <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-700" />
                    <span>Logo & Marca de la Agencia</span>
                  </h3>

                  {/* Logo Preview */}
                  <div className="flex flex-col items-center p-5 bg-slate-50/80 rounded-3xl border border-slate-200/80 text-center">
                    <div className="mb-3 flex items-center justify-center">
                      <AgencyLogo
                        logoUrl={companyLogo}
                        name={companyName || currentAgency.name}
                        size="2xl"
                      />
                    </div>
                    <span className="font-bold text-slate-900 text-sm">{companyName || currentAgency.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      RUC: {companyTaxId || '7.226.273-7'}
                    </span>
                  </div>

                  {/* File Upload Button */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Subir Logo desde tu dispositivo:
                    </label>
                    <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Seleccionar imagen (PNG / JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCompanyLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">Recomendado: imagen cuadrada o con fondo transparente.</p>
                  </div>

                  {/* Direct Logo URL Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      O pegar URL directa de la imagen:
                    </label>
                    <input
                      type="url"
                      value={companyLogo}
                      onChange={(e) => setCompanyLogo(e.target.value)}
                      placeholder="https://ejemplo.com/logo.png"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  {/* Direct Banner URL */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Banner de Portada (Opcional):
                    </label>
                    <input
                      type="url"
                      value={companyBanner}
                      onChange={(e) => setCompanyBanner(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Quick Help Card */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>¿Dónde se reflejan estos datos?</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900">
                    <li>En el encabezado oficial de todas las cotizaciones proforma PDF.</li>
                    <li>En el pie de página con tus datos de transferencia para reservas.</li>
                    <li>En el perfil público de la concesionaria ante los compradores.</li>
                    <li>En los botones de contacto directo por WhatsApp.</li>
                  </ul>
                </div>
              </div>

              {/* Center & Right Column: Business & Contact Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* General Business Information */}
                <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Building2 className="w-4 h-4 text-blue-700" />
                    <span>Información Comercial & Fiscal</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nombre Comercial / Razón Social *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ej: Concesionaria Central Automotores"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        RUC / CUIT / Identificación Tributaria *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyTaxId}
                        onChange={(e) => setCompanyTaxId(e.target.value)}
                        placeholder="Ej: 7.226.273-7"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Titular / Responsable Comercial
                      </label>
                      <input
                        type="text"
                        value={companyOwnerName}
                        onChange={(e) => setCompanyOwnerName(e.target.value)}
                        placeholder="Ej: Marcelo Castro"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Sitio Web Oficial
                      </label>
                      <input
                        type="url"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="https://www.tuagencia.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Contact Channels */}
                <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>Ubicación del Salón & Canales de Contacto</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Dirección del Salón de Ventas *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="Ej: Avda. Eusebio Ayala 4520 c/ De la Victoria"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyCity}
                        onChange={(e) => setCompanyCity(e.target.value)}
                        placeholder="Ej: Asunción"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Departamento / Provincia *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyProvince}
                        onChange={(e) => setCompanyProvince(e.target.value)}
                        placeholder="Ej: Central"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700">
                          WhatsApp Oficial de Ventas *
                        </label>
                        <button
                          type="button"
                          onClick={() => handleSwitchTab('whatsapp')}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>Configurar WhatsApp Business & Mensajes →</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={companyWhatsapp}
                          onChange={(e) => setCompanyWhatsapp(e.target.value)}
                          placeholder="595975635770"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Con código de país (Ej: 595975635770 sin + ni guiones)</p>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Teléfono Directo / PBX
                      </label>
                      <input
                        type="text"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="+595 21 680 120"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Correo Electrónico de Contacto *
                      </label>
                      <input
                        type="email"
                        required
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="ventas@concesionaria.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* PDF Quote Data: Bank Accounts & Warranty */}
                <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Landmark className="w-4 h-4 text-emerald-600" />
                    <span>Datos Bancarios & Garantía para Cotizaciones PDF</span>
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Cuentas Bancarias & Alias para Reservas (Aparece en el pie de la cotización)
                      </label>
                      <textarea
                        rows={2}
                        value={companyBankInfo}
                        onChange={(e) => setCompanyBankInfo(e.target.value)}
                        placeholder="Banco Itaú / Continental • Cta Cte Gs: 620011158 • Alias SIPAP: 7226273 • Titular: Agencia"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Términos de Garantía por Defecto en Cotizaciones
                      </label>
                      <input
                        type="text"
                        value={companyDefaultWarranty}
                        onChange={(e) => setCompanyDefaultWarranty(e.target.value)}
                        placeholder="Garantía oficial por escrito de 6 meses o 10.000 km (motor y caja). Chequeo de 100 puntos."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Horarios de Atención
                        </label>
                        <input
                          type="text"
                          value={companyOpeningHours}
                          onChange={(e) => setCompanyOpeningHours(e.target.value)}
                          placeholder="Lunes a Viernes de 08:00 a 18:30 | Sábados de 08:30 a 13:00"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Descripción o Slogan de la Concesionaria
                        </label>
                        <input
                          type="text"
                          value={companyAbout}
                          onChange={(e) => setCompanyAbout(e.target.value)}
                          placeholder="Especialistas en 0km y seminuevos garantizados"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Changes Button Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 text-white shadow-xl">
                  <div className="text-xs text-slate-300">
                    <p className="font-bold text-white">¿Listo para aplicar los cambios?</p>
                    <p className="text-[11px] text-slate-400">Los cambios se guardan de inmediato en el estado central y localStorage.</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Datos de Empresa</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 8: WHATSAPP BUSINESS & PREDEFINED MESSAGES SETTINGS */}
      {activeTab === 'whatsapp' && (
        <div className="animate-fadeIn">
          <AgencyWhatsAppSettings agency={currentAgency} agencyCars={agencyCars} />
        </div>
      )}

      {/* Modal: Add New Seller */}
      {isAddSellerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Registrar Nuevo Vendedor</h3>
                  <p className="text-[11px] text-slate-500">{currentAgency.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddSellerOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sellerFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {sellerFormError}
              </div>
            )}

            <form onSubmit={handleCreateSeller} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newSellerName}
                  onChange={(e) => setNewSellerName(e.target.value)}
                  placeholder="Ej: Marcelo Castro"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Usuario de Acceso *</label>
                  <input
                    type="text"
                    required
                    value={newSellerUsername}
                    onChange={(e) => setNewSellerUsername(e.target.value)}
                    placeholder="marcelo.castro"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contraseña *</label>
                  <input
                    type="password"
                    required
                    value={newSellerPassword}
                    onChange={(e) => setNewSellerPassword(e.target.value)}
                    placeholder="vendedor123"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={newSellerEmail}
                  onChange={(e) => setNewSellerEmail(e.target.value)}
                  placeholder="marcelo@concesionaria.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WhatsApp de Atención *</label>
                  <input
                    type="text"
                    required
                    value={newSellerWhatsapp}
                    onChange={(e) => setNewSellerWhatsapp(e.target.value)}
                    placeholder="5491148905501"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">% Comisión por Venta</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSellerCommission}
                    onChange={(e) => setNewSellerCommission(Number(e.target.value))}
                    placeholder="1.5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSellerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow"
                >
                  Guardar Vendedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Professional PDF Quote Modal */}
      <CarQuotePdfModal
        car={quoteCar}
        isOpen={isQuoteModalOpen}
        onClose={() => {
          setIsQuoteModalOpen(false);
          setQuoteCar(null);
        }}
      />

      {/* CSV / Excel Inventory Export Modal */}
      <ExportInventoryModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allAgencyCars={agencyCars}
        filteredCars={filteredCars}
        agency={currentAgency}
      />

      {/* Confirmation Modal for deleting cars */}
      <ConfirmationModal
        isOpen={!!carToDelete}
        onClose={() => setCarToDelete(null)}
        onConfirm={() => {
          if (carToDelete) {
            deleteCarListing(carToDelete.id);
            setCarToDelete(null);
          }
        }}
        title="¿Eliminar vehículo del inventario?"
        description="El auto será eliminado permanentemente de tu inventario y del catálogo público. Los compradores ya no podrán consultarlo."
        itemName={carToDelete ? `${carToDelete.title} (${carToDelete.year})` : undefined}
        itemDetails={
          carToDelete
            ? `Precio: ${formatPrice(carToDelete.price, carToDelete.currency)} • Km: ${carToDelete.mileage.toLocaleString('es-ES')} km • Combustible: ${carToDelete.fuelType}`
            : undefined
        }
        warningNote="Esta acción es irreversible. Se cancelarán las solicitudes y cotizaciones pendientes vinculadas a este auto."
        confirmText="Sí, Eliminar Auto"
        cancelText="Cancelar"
        variant="danger"
        iconType="trash"
      />
    </div>
  );
};
