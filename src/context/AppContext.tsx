import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Agency,
  CarListing,
  PrivateCarOffer,
  SubscriptionPlan,
  PaymentGatewayConfig,
  AgencyInvoice,
  LeadInquiry,
  AppFilterState,
  CurrencyCode,
  AppUser,
  SubscriptionAccessCode,
  AgencyNotification,
  PushNotificationSettings,
} from '../types';
import {
  INITIAL_AGENCIES,
  INITIAL_CAR_LISTINGS,
  INITIAL_SUBSCRIPTION_PLANS,
  INITIAL_PAYMENT_GATEWAYS,
  INITIAL_INVOICES,
  INITIAL_PRIVATE_OFFERS,
  INITIAL_LEADS,
  INITIAL_USERS,
  INITIAL_ACCESS_CODES,
} from '../data/mockData';
import {
  getStoredPushSettings,
  savePushSettings,
  triggerAgencyPushNotification,
} from '../services/pushNotificationService';

interface AppContextType {
  // Navigation & View
  currentView: 'catalog' | 'agency-panel' | 'sell-my-car' | 'admin-panel' | 'ai-tools';
  setCurrentView: (view: 'catalog' | 'agency-panel' | 'sell-my-car' | 'admin-panel' | 'ai-tools') => void;

  // Authentication & Sellers System
  currentUser: AppUser | null;
  users: AppUser[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (usernameOrEmail: string, password: string) => { success: boolean; message?: string };
  loginAsDemoUser: (userId: string) => { success: boolean; message?: string };
  logout: () => void;
  addUser: (userData: Omit<AppUser, 'id' | 'createdAt'>) => string;
  updateUser: (id: string, data: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;

  // Selected Car Detail Modal
  selectedCar: CarListing | null;
  setSelectedCar: (car: CarListing | null) => void;

  // Active Agency for Agency Panel
  currentAgencyId: string;
  setCurrentAgencyId: (id: string) => void;
  currentAgency: Agency | null;
  agencies: Agency[];
  addAgency: (agencyData: Omit<Agency, 'id' | 'createdAt'>) => string;
  updateAgency: (id: string, data: Partial<Agency>) => void;
  deleteAgency: (id: string) => void;

  // Car Listings
  carListings: CarListing[];
  addCarListing: (carData: Omit<CarListing, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'whatsappInquiriesCount'>) => string;
  updateCarListing: (id: string, data: Partial<CarListing>) => void;
  deleteCarListing: (id: string) => void;
  toggleCarFeatured: (id: string) => void;
  updateCarStatus: (id: string, status: CarListing['status']) => void;
  incrementWhatsappInquiries: (id: string) => void;

  // Private Car Offers (Particulares)
  privateOffers: PrivateCarOffer[];
  addPrivateOffer: (offerData: Omit<PrivateCarOffer, 'id' | 'submittedAt' | 'status'>) => string;
  updatePrivateOfferStatus: (id: string, status: PrivateCarOffer['status'], agencyNotes?: string, assignedAgencyId?: string) => void;
  deletePrivateOffer: (id: string) => void;

  // SaaS Plans & Pricing (Tipo MiTaller)
  subscriptionPlans: SubscriptionPlan[];
  updateSubscriptionPlan: (id: string, data: Partial<SubscriptionPlan>) => void;
  addSubscriptionPlan: (plan: Omit<SubscriptionPlan, 'id'>) => void;

  // Single-Use Subscription Access Codes & One-Time Tokens (Igual a TallerYa)
  accessCodes: SubscriptionAccessCode[];
  generateAccessCode: (codeData: Omit<SubscriptionAccessCode, 'id' | 'createdAt' | 'status'>) => SubscriptionAccessCode;
  revokeAccessCode: (id: string) => void;
  deleteAccessCode: (id: string) => void;
  redeemAccessCode: (code: string, agencyId?: string, userEmail?: string) => { success: boolean; message: string; codeDetails?: SubscriptionAccessCode };

  // Email OTP Verification
  lastGeneratedOtp: { email: string; code: string; timestamp: number; purpose: string } | null;
  sendEmailVerificationCode: (email: string, purpose?: string) => { success: boolean; code: string; message: string };
  verifyEmailCode: (email: string, code: string) => { success: boolean; message: string };

  // Admin Security (Protección Anti-Fuerza Bruta igual a TallerYa)
  isAdminAuthenticated: boolean;
  adminFailedAttempts: number;
  adminLockoutUntil: number | null;
  authenticateAdmin: (email: string, pinOrPass: string) => { success: boolean; message: string; locked?: boolean; remainingAttempts?: number };
  logoutAdmin: () => void;
  unlockAdminDirectly: () => void;

  // Payment Gateways (Configuración de Cobros)
  paymentGateways: PaymentGatewayConfig[];
  updatePaymentGateway: (id: string, data: Partial<PaymentGatewayConfig>) => void;

  // Invoices & Billing
  invoices: AgencyInvoice[];
  addInvoice: (invoice: Omit<AgencyInvoice, 'id'>) => void;
  markInvoicePaid: (id: string, paymentMethod?: string) => void;
  updateInvoiceStatus: (id: string, status: AgencyInvoice['status']) => void;

  // Leads & CRM
  leads: LeadInquiry[];
  addLead: (lead: Omit<LeadInquiry, 'id' | 'createdAt'>) => void;
  updateLeadStatus: (id: string, status: LeadInquiry['status'], sellerNotes?: string, assignedSellerId?: string) => void;

  // Vehicle Comparison (Hasta 3 vehículos)
  comparedCarIds: string[];
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleCompareCar: (carId: string) => { added: boolean; limitReached: boolean };
  addCarToCompare: (carId: string) => boolean;
  removeCarFromCompare: (carId: string) => void;
  clearCompareCars: () => void;
  isCarCompared: (carId: string) => boolean;

  // Filters
  filters: AppFilterState;
  setFilters: React.Dispatch<React.SetStateAction<AppFilterState>>;
  resetFilters: () => void;

  // Push Notifications Service & Settings
  pushSettings: PushNotificationSettings;
  updatePushSettings: (settings: Partial<PushNotificationSettings>) => void;
  triggerPushNotification: (notification: AgencyNotification) => void;

  // Currency & Plan Pricing Helpers
  exchangeRateUsdToPyg: number;
  formatPrice: (amount: number, currency?: CurrencyCode) => string;
  formatPlanPrice: (
    plan: SubscriptionPlan,
    cycle?: 'monthly' | 'yearly'
  ) => { usd: string; pyg: string; combined: string; monthlyUsd: number; monthlyPyg: number };
  formatWhatsappTemplate: (template: string, car: CarListing) => string;
  generateWhatsappLink: (car: CarListing, customText?: string) => string;
  openWhatsappForCar: (car: CarListing, customText?: string) => void;

  // Backup & Reset
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonStr: string) => boolean;
  resetToSampleData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'micarro_platform_db_v6';

const INITIAL_FILTERS: AppFilterState = {
  search: '',
  agencyId: '',
  make: '',
  model: '',
  bodyType: '',
  condition: '',
  transmission: '',
  fuelType: '',
  minYear: '',
  maxYear: '',
  minPrice: '',
  maxPrice: '',
  minMileage: '',
  maxMileage: '',
  onlyFeatured: false,
  onlyFinancing: false,
  onlyTradeIn: false,
  sortBy: 'featured',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<'catalog' | 'agency-panel' | 'sell-my-car' | 'admin-panel' | 'ai-tools'>('agency-panel');
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Users & Sellers State
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.users && parsed.users.length > 0) return parsed.users;
      } catch {}
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const savedUser = localStorage.getItem('micarro_current_user_v5');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {}
    }
    // Default to Juan Perez (Vendedor Demo) so the user experiences the seller dashboard immediately
    return INITIAL_USERS[0];
  });

  // Core State with LocalStorage persistence
  const [agencies, setAgencies] = useState<Agency[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.agencies && parsed.agencies.length > 0) {
          return parsed.agencies.map((ag: Agency) => {
            if (ag.logoUrl && ag.logoUrl.includes('1599305445671-ac291c95aaa9')) {
              return { ...ag, logoUrl: '/logo.png' };
            }
            return ag;
          });
        }
      } catch {}
    }
    return INITIAL_AGENCIES;
  });

  const [currentAgencyId, setCurrentAgencyId] = useState<string>(() => {
    if (currentUser && currentUser.agencyId && currentUser.agencyId !== 'all') {
      return currentUser.agencyId;
    }
    return INITIAL_AGENCIES[0]?.id || 'agency-demo';
  });

  const [carListings, setCarListings] = useState<CarListing[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.carListings && parsed.carListings.length > 0) return parsed.carListings;
      } catch {}
    }
    return INITIAL_CAR_LISTINGS;
  });

  const [privateOffers, setPrivateOffers] = useState<PrivateCarOffer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.privateOffers) return parsed.privateOffers;
      } catch {}
    }
    return INITIAL_PRIVATE_OFFERS;
  });

  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.subscriptionPlans) return parsed.subscriptionPlans;
      } catch {}
    }
    return INITIAL_SUBSCRIPTION_PLANS;
  });

  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.paymentGateways) return parsed.paymentGateways;
      } catch {}
    }
    return INITIAL_PAYMENT_GATEWAYS;
  });

  const [invoices, setInvoices] = useState<AgencyInvoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.invoices) return parsed.invoices;
      } catch {}
    }
    return INITIAL_INVOICES;
  });

  const [leads, setLeads] = useState<LeadInquiry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.leads) return parsed.leads;
      } catch {}
    }
    return INITIAL_LEADS;
  });

  const [accessCodes, setAccessCodes] = useState<SubscriptionAccessCode[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.accessCodes && parsed.accessCodes.length > 0) return parsed.accessCodes;
      } catch {}
    }
    return INITIAL_ACCESS_CODES;
  });

  // Admin Security & Anti-Brute Force (igual a TallerYa)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('micarro_admin_auth') === 'true';
  });
  const [adminFailedAttempts, setAdminFailedAttempts] = useState<number>(() => {
    const saved = localStorage.getItem('micarro_admin_failed_attempts');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [adminLockoutUntil, setAdminLockoutUntil] = useState<number | null>(() => {
    const saved = localStorage.getItem('micarro_admin_lockout_until');
    if (saved) {
      const until = parseInt(saved, 10);
      if (until > Date.now()) return until;
    }
    return null;
  });

  // Email OTP verification state
  const [lastGeneratedOtp, setLastGeneratedOtp] = useState<{
    email: string;
    code: string;
    timestamp: number;
    purpose: string;
  } | null>(null);

  // Vehicle Comparison State (hasta 3 vehículos)
  const [comparedCarIds, setComparedCarIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('micarro_compared_cars');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 3);
      }
    } catch {}
    return [];
  });
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('micarro_compared_cars', JSON.stringify(comparedCarIds));
    } catch {}
  }, [comparedCarIds]);

  const isCarCompared = (carId: string) => comparedCarIds.includes(carId);

  const addCarToCompare = (carId: string): boolean => {
    if (comparedCarIds.includes(carId)) return true;
    if (comparedCarIds.length >= 3) return false;
    setComparedCarIds((prev) => [...prev, carId]);
    return true;
  };

  const removeCarFromCompare = (carId: string) => {
    setComparedCarIds((prev) => prev.filter((id) => id !== carId));
  };

  const toggleCompareCar = (carId: string): { added: boolean; limitReached: boolean } => {
    if (comparedCarIds.includes(carId)) {
      removeCarFromCompare(carId);
      return { added: false, limitReached: false };
    }
    if (comparedCarIds.length >= 3) {
      return { added: false, limitReached: true };
    }
    setComparedCarIds((prev) => [...prev, carId]);
    return { added: true, limitReached: false };
  };

  const clearCompareCars = () => {
    setComparedCarIds([]);
  };

  // Push Notifications Settings & Service State
  const [pushSettings, setPushSettings] = useState<PushNotificationSettings>(() => {
    return getStoredPushSettings();
  });

  const updatePushSettings = (newSettings: Partial<PushNotificationSettings>) => {
    setPushSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      savePushSettings(updated);
      return updated;
    });
  };

  const triggerPushNotification = (notification: AgencyNotification) => {
    triggerAgencyPushNotification(notification);
  };

  const [filters, setFilters] = useState<AppFilterState>(INITIAL_FILTERS);

  // Sync to LocalStorage safely (with quota overflow protection)
  useEffect(() => {
    try {
      const dataToSave = {
        users,
        agencies,
        currentAgencyId,
        carListings,
        privateOffers,
        subscriptionPlans,
        paymentGateways,
        invoices,
        leads,
        accessCodes,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (storageErr) {
      console.warn('LocalStorage quota reached or storage restricted; app state maintained in memory.', storageErr);
    }
  }, [users, agencies, currentAgencyId, carListings, privateOffers, subscriptionPlans, paymentGateways, invoices, leads, accessCodes]);

  // Sync admin security state
  useEffect(() => {
    localStorage.setItem('micarro_admin_auth', isAdminAuthenticated ? 'true' : 'false');
  }, [isAdminAuthenticated]);

  useEffect(() => {
    localStorage.setItem('micarro_admin_failed_attempts', adminFailedAttempts.toString());
  }, [adminFailedAttempts]);

  useEffect(() => {
    if (adminLockoutUntil) {
      localStorage.setItem('micarro_admin_lockout_until', adminLockoutUntil.toString());
    } else {
      localStorage.removeItem('micarro_admin_lockout_until');
    }
  }, [adminLockoutUntil]);

  // Sync current user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('micarro_current_user_v5', JSON.stringify(currentUser));
      if (currentUser.agencyId && currentUser.agencyId !== 'all') {
        setCurrentAgencyId(currentUser.agencyId);
      }
    } else {
      localStorage.removeItem('micarro_current_user_v5');
    }
  }, [currentUser]);

  const currentAgency = agencies.find((a) => a.id === currentAgencyId) || agencies[0] || null;

  // Helper to validate agency subscription status for sellers
  const checkUserAgencyEligibility = (user: AppUser): { allowed: boolean; message?: string } => {
    // Super admins bypass agency checks
    if (user.role === 'super_admin' || user.agencyId === 'all') {
      return { allowed: true };
    }

    const assignedAgency = agencies.find((a) => a.id === user.agencyId);
    if (!assignedAgency) {
      return {
        allowed: false,
        message: '⛔ Acceso denegado: La concesionaria asignada a esta cuenta no existe o fue deshabilitada del sistema.',
      };
    }

    // Check if subscription status is active or trial
    const isStatusActive = assignedAgency.subscriptionStatus === 'active' || assignedAgency.subscriptionStatus === 'trial';
    if (!isStatusActive) {
      return {
        allowed: false,
        message: `⛔ Acceso suspendido: La concesionaria "${assignedAgency.name}" tiene su membresía inactiva (${assignedAgency.subscriptionStatus === 'past_due' ? 'pago pendiente' : assignedAgency.subscriptionStatus === 'suspended' ? 'suspendida' : 'inactiva'}). Cuando el titular abone el servicio de la app o canjee un código, se habilitará el acceso a los vendedores.`,
      };
    }

    // Check expiration date
    if (assignedAgency.subscriptionExpiresAt) {
      const expDate = new Date(assignedAgency.subscriptionExpiresAt).getTime();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expDate < today.getTime()) {
        return {
          allowed: false,
          message: `⛔ Suscripción vencida: El plan de "${assignedAgency.name}" venció el ${assignedAgency.subscriptionExpiresAt}. El titular debe renovar el abono para habilitar a su equipo de ventas.`,
        };
      }
    }

    return { allowed: true };
  };

  // Authentication methods
  const login = (usernameOrEmail: string, password: string): { success: boolean; message?: string } => {
    const cleanIdentifier = usernameOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();

    const foundUser = users.find(
      (u) =>
        (u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier) &&
        (!u.password || u.password === cleanPass)
    );

    if (!foundUser) {
      // Check if identifier matched but password was wrong
      const userExists = users.some(
        (u) => u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier
      );
      if (userExists) {
        return { success: false, message: 'La contraseña ingresada es incorrecta.' };
      }
      return { success: false, message: 'Usuario o correo electrónico no encontrado.' };
    }

    if (!foundUser.isActive) {
      return { success: false, message: 'Esta cuenta de vendedor ha sido pausada o desactivada por la agencia.' };
    }

    // GATING: Verify that the seller's agency has an active paid subscription
    const agencyCheck = checkUserAgencyEligibility(foundUser);
    if (!agencyCheck.allowed) {
      return { success: false, message: agencyCheck.message };
    }

    const updatedUser = {
      ...foundUser,
      lastLoginAt: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    if (updatedUser.agencyId && updatedUser.agencyId !== 'all') {
      setCurrentAgencyId(updatedUser.agencyId);
    }

    return { success: true };
  };

  const loginAsDemoUser = (userId: string): { success: boolean; message?: string } => {
    const foundUser = users.find((u) => u.id === userId);
    if (!foundUser) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    // GATING: Verify that the seller's agency has an active paid subscription
    const agencyCheck = checkUserAgencyEligibility(foundUser);
    if (!agencyCheck.allowed) {
      return { success: false, message: agencyCheck.message };
    }

    const updatedUser = {
      ...foundUser,
      lastLoginAt: new Date().toISOString(),
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (updatedUser.agencyId && updatedUser.agencyId !== 'all') {
      setCurrentAgencyId(updatedUser.agencyId);
    }
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addUser = (userData: Omit<AppUser, 'id' | 'createdAt'>): string => {
    const newId = `user-${Date.now()}`;
    const newUser: AppUser = {
      ...userData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    return newId;
  };

  const updateUser = (id: string, data: Partial<AppUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
    if (currentUser && currentUser.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
    }
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser && currentUser.id === id) {
      logout();
    }
  };

  // Official / Market exchange rate reference (1 USD ~ 7.900 PYG Guaraníes)
  const exchangeRateUsdToPyg = 7900;

  // Format currency
  const formatPrice = (amount: number, currency: CurrencyCode = 'USD'): string => {
    if (currency === 'USD') {
      return `USD ${amount.toLocaleString('es-ES')}`;
    } else if (currency === 'PYG') {
      return `Gs. ${amount.toLocaleString('es-PY')}`;
    } else if (currency === 'EUR') {
      return `${amount.toLocaleString('es-ES')} €`;
    } else if (currency === 'ARS') {
      return `$ ${amount.toLocaleString('es-ES')}`;
    }
    return `${currency} ${amount.toLocaleString('es-ES')}`;
  };

  // Dual Currency Plan Price Formatter (USD & Guaraníes PYG)
  const formatPlanPrice = (
    plan: SubscriptionPlan,
    cycle: 'monthly' | 'yearly' = 'monthly'
  ) => {
    const isYearly = cycle === 'yearly';
    const usdAmount = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    
    // Calculate PYG either from plan custom price or default exchange rate
    const pygAmount = isYearly
      ? plan.yearlyPricePyg || (plan.monthlyPricePyg ? plan.monthlyPricePyg * 10 : Math.round(plan.yearlyPrice * exchangeRateUsdToPyg))
      : plan.monthlyPricePyg || Math.round(plan.monthlyPrice * exchangeRateUsdToPyg);

    const usdFormatted = `USD $${usdAmount}`;
    const pygFormatted = `₲ ${pygAmount.toLocaleString('es-PY')} Gs`;

    return {
      usd: usdFormatted,
      pyg: pygFormatted,
      combined: `${usdFormatted} / ${pygFormatted}`,
      monthlyUsd: isYearly ? Math.round(usdAmount / 12) : usdAmount,
      monthlyPyg: isYearly ? Math.round(pygAmount / 12) : pygAmount,
    };
  };

  // Helper to replace template tags with car and agency details
  const formatWhatsappTemplate = (template: string, car: CarListing): string => {
    if (!template) return '';
    const sellerGreeting = car.sellerName ? ` (Atención: ${car.sellerName})` : '';
    const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://micarro.app';
    const carUrl = `${originUrl}/?car=${car.id}`;
    const priceFormatted = `${car.currency} ${car.price.toLocaleString('es-ES')}`;

    return template
      .replace(/{agencia}/gi, car.agencyName || 'la concesionaria')
      .replace(/{auto}/gi, `${car.make} ${car.model}`)
      .replace(/{marca}/gi, car.make)
      .replace(/{modelo}/gi, car.model)
      .replace(/{version}/gi, car.version || `${car.make} ${car.model}`)
      .replace(/{año}/gi, String(car.year))
      .replace(/{anio}/gi, String(car.year))
      .replace(/{precio}/gi, priceFormatted)
      .replace(/{moneda}/gi, car.currency)
      .replace(/{codigo}/gi, car.id)
      .replace(/{id}/gi, car.id)
      .replace(/{km}/gi, `${car.mileage.toLocaleString('es-ES')} km`)
      .replace(/{kilometraje}/gi, `${car.mileage.toLocaleString('es-ES')} km`)
      .replace(/{transmision}/gi, car.transmission || '')
      .replace(/{combustible}/gi, car.fuelType || '')
      .replace(/{vendedor}/gi, sellerGreeting)
      .replace(/{vendedor_nombre}/gi, car.sellerName || 'Ventas')
      .replace(/{ciudad}/gi, car.agencyCity || '')
      .replace(/{link}/gi, carUrl)
      .replace(/{url}/gi, carUrl);
  };

  // WhatsApp Link Generator
  const generateWhatsappLink = (car: CarListing, customText?: string): string => {
    const agency = agencies.find((a) => a.id === car.agencyId) || currentAgency;
    // Prefer seller phone if assigned, then agency WhatsApp Business number, then agency whatsappNumber, then car.agencyWhatsapp
    const rawPhone =
      car.sellerWhatsapp ||
      agency?.whatsappBusinessNumber ||
      agency?.whatsappNumber ||
      car.agencyWhatsapp ||
      '5491148905500';
    const phone = rawPhone.replace(/[^0-9]/g, '');

    let message = '';
    if (customText) {
      message = customText;
    } else if (agency?.whatsappCarInquiryTemplate) {
      message = formatWhatsappTemplate(agency.whatsappCarInquiryTemplate, car);
    } else {
      const sellerGreeting = car.sellerName ? ` (Atención: ${car.sellerName})` : '';
      message = `¡Hola ${car.agencyName}${sellerGreeting}! 👋 Vi en MiCarro su publicación del *${car.make} ${car.model}* (${car.year} - ${car.currency} ${car.price.toLocaleString('es-ES')}) con código *#${car.id}*. ¿Sigue disponible para coordinar una visita y conocer facilidades de pago o permuta?`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const openWhatsappForCar = (car: CarListing, customText?: string) => {
    incrementWhatsappInquiries(car.id);
    const link = generateWhatsappLink(car, customText);

    // Auto-record Lead in CRM
    const newLead: LeadInquiry = {
      id: `lead-${Date.now()}`,
      carId: car.id,
      carTitle: `${car.make} ${car.model} ${car.version || ''} (${car.year})`,
      agencyId: car.agencyId,
      agencyName: car.agencyName,
      clientName: 'Cliente Web / WhatsApp',
      clientPhone: car.agencyWhatsapp || 'Consulta Directa',
      channel: 'whatsapp',
      message: customText || `Consulta directa por WhatsApp por ${car.make} ${car.model} (${car.year})`,
      status: 'new',
      assignedSellerId: car.createdBySellerId,
      assignedSellerName: car.sellerName,
      createdAt: new Date().toISOString(),
    };
    setLeads((prev) => [newLead, ...prev]);

    // Dispatch Push Notification Alert to the Agency & Seller
    const sellerTag = car.sellerName ? ` • Asignado a: ${car.sellerName}` : '';
    const notif: AgencyNotification = {
      id: `notif-wa-${Date.now()}`,
      agencyId: car.agencyId,
      type: 'whatsapp_inquiry',
      title: `⚡ ¡Nueva Consulta por WhatsApp!`,
      message: `Un comprador solicitó información sobre el ${car.make} ${car.model} (${car.year})${sellerTag}`,
      clientName: 'Cliente Web / WhatsApp',
      clientPhone: car.agencyWhatsapp || '+595 (Consulta Directa)',
      clientWhatsapp: (car.agencyWhatsapp || '').replace(/[^0-9]/g, ''),
      carId: car.id,
      carTitle: `${car.make} ${car.model} ${car.year}`,
      vehicleSummary: `${car.make} ${car.model} ${car.year} • ${car.currency} ${car.price.toLocaleString('es-ES')}`,
      amountOrPrice: `${car.currency} ${car.price.toLocaleString('es-ES')}`,
      photoUrl: car.photos?.[0],
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'high',
      assignedSellerId: car.createdBySellerId,
      assignedSellerName: car.sellerName,
      channel: 'whatsapp',
    };
    triggerAgencyPushNotification(notif);

    window.open(link, '_blank');
  };

  // Agency Operations
  const addAgency = (agencyData: Omit<Agency, 'id' | 'createdAt'>): string => {
    const newId = `agency-${Date.now()}`;
    const newAgency: Agency = {
      ...agencyData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setAgencies((prev) => [...prev, newAgency]);
    setCurrentAgencyId(newId);
    return newId;
  };

  const updateAgency = (id: string, data: Partial<Agency>) => {
    setAgencies((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  };

  const deleteAgency = (id: string) => {
    setAgencies((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      if (currentAgencyId === id && filtered.length > 0) {
        setCurrentAgencyId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Car Listings Operations
  const addCarListing = (
    carData: Omit<CarListing, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'whatsappInquiriesCount'>
  ): string => {
    const newId = `car-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Auto-assign seller if logged in and not specified
    const sellerId = carData.createdBySellerId || currentUser?.id;
    const sellerName = carData.sellerName || (sellerId && currentUser?.id === sellerId ? currentUser.name : undefined);
    const sellerWhatsapp = carData.sellerWhatsapp || (sellerId && currentUser?.id === sellerId ? currentUser.whatsappNumber : undefined);

    const newCar: CarListing = {
      ...carData,
      id: newId,
      createdBySellerId: sellerId,
      sellerName: sellerName,
      sellerWhatsapp: sellerWhatsapp,
      viewsCount: 1,
      whatsappInquiriesCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    setCarListings((prev) => [newCar, ...prev]);

    // Increment seller counter
    if (sellerId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === sellerId ? { ...u, carsLoadedCount: (u.carsLoadedCount || 0) + 1 } : u
        )
      );
    }

    return newId;
  };

  const updateCarListing = (id: string, data: Partial<CarListing>) => {
    const now = new Date().toISOString();
    setCarListings((prev) =>
      prev.map((car) => (car.id === id ? { ...car, ...data, updatedAt: now } : car))
    );
    if (selectedCar && selectedCar.id === id) {
      setSelectedCar((prev) => (prev ? { ...prev, ...data, updatedAt: now } : null));
    }
  };

  const deleteCarListing = (id: string) => {
    setCarListings((prev) => prev.filter((car) => car.id !== id));
    if (selectedCar && selectedCar.id === id) {
      setSelectedCar(null);
    }
  };

  const toggleCarFeatured = (id: string) => {
    setCarListings((prev) =>
      prev.map((car) => (car.id === id ? { ...car, isFeatured: !car.isFeatured } : car))
    );
  };

  const updateCarStatus = (id: string, status: CarListing['status']) => {
    setCarListings((prev) =>
      prev.map((car) => {
        if (car.id === id) {
          // If status changes to sold and car has a seller, update seller's sold count
          if (status === 'sold' && car.status !== 'sold' && car.createdBySellerId) {
            setUsers((userList) =>
              userList.map((u) =>
                u.id === car.createdBySellerId ? { ...u, carsSoldCount: (u.carsSoldCount || 0) + 1 } : u
              )
            );
          }
          return { ...car, status };
        }
        return car;
      })
    );
  };

  const incrementWhatsappInquiries = (id: string) => {
    setCarListings((prev) =>
      prev.map((car) =>
        car.id === id ? { ...car, whatsappInquiriesCount: (car.whatsappInquiriesCount || 0) + 1 } : car
      )
    );
  };

  // Private Car Offers Operations
  const addPrivateOffer = (offerData: Omit<PrivateCarOffer, 'id' | 'submittedAt' | 'status'>): string => {
    const newId = `offer-${Date.now()}`;
    const newOffer: PrivateCarOffer = {
      ...offerData,
      id: newId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    setPrivateOffers((prev) => [newOffer, ...prev]);

    // Dispatch Push Notification
    const notif: AgencyNotification = {
      id: `notif-offer-${Date.now()}`,
      agencyId: offerData.preferredAgencyId || currentAgencyId || 'all',
      type: 'private_seller',
      title: `🚗 Particular ofrece vehículo: ${offerData.make} ${offerData.model} (${offerData.year})`,
      message: `${offerData.contactName} ofrece ${offerData.make} ${offerData.model} en ${offerData.city}. Pretende: ${offerData.currency} ${offerData.expectedPrice.toLocaleString('es-ES')}`,
      clientName: offerData.contactName,
      clientPhone: offerData.contactPhone,
      clientWhatsapp: (offerData.contactWhatsapp || offerData.contactPhone).replace(/[^0-9]/g, ''),
      clientEmail: offerData.contactEmail,
      offerId: newId,
      vehicleSummary: `${offerData.make} ${offerData.model} (${offerData.year}) • ${offerData.mileage.toLocaleString('es-ES')} km`,
      amountOrPrice: `${offerData.currency} ${offerData.expectedPrice.toLocaleString('es-ES')}`,
      photoUrl: offerData.photos?.[0],
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'high',
      channel: 'trade_in',
    };
    triggerAgencyPushNotification(notif);

    return newId;
  };

  const updatePrivateOfferStatus = (
    id: string,
    status: PrivateCarOffer['status'],
    agencyNotes?: string,
    assignedAgencyId?: string
  ) => {
    setPrivateOffers((prev) =>
      prev.map((offer) =>
        offer.id === id
          ? {
              ...offer,
              status,
              agencyNotes: agencyNotes !== undefined ? agencyNotes : offer.agencyNotes,
              assignedAgencyId: assignedAgencyId !== undefined ? assignedAgencyId : offer.assignedAgencyId,
            }
          : offer
      )
    );
  };

  const deletePrivateOffer = (id: string) => {
    setPrivateOffers((prev) => prev.filter((o) => o.id !== id));
  };

  // SaaS Plans Operations
  const updateSubscriptionPlan = (id: string, data: Partial<SubscriptionPlan>) => {
    setSubscriptionPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const addSubscriptionPlan = (plan: Omit<SubscriptionPlan, 'id'>) => {
    const newPlan: SubscriptionPlan = {
      ...plan,
      id: `plan-${Date.now()}`,
    };
    setSubscriptionPlans((prev) => [...prev, newPlan]);
  };

  // Payment Gateways
  const updatePaymentGateway = (id: string, data: Partial<PaymentGatewayConfig>) => {
    setPaymentGateways((prev) => prev.map((g) => (g.id === id ? { ...g, ...data } : g)));
  };

  // Invoices & Billing Operations
  const addInvoice = (invoice: Omit<AgencyInvoice, 'id'>) => {
    const newInv: AgencyInvoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
    };
    setInvoices((prev) => [newInv, ...prev]);
  };

  const markInvoicePaid = (id: string, paymentMethod?: string) => {
    const today = new Date().toISOString().split('T')[0];
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              status: 'paid',
              paidAt: today,
              paymentMethod: paymentMethod || inv.paymentMethod,
            }
          : inv
      )
    );
  };

  const updateInvoiceStatus = (id: string, status: AgencyInvoice['status']) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status } : inv)));
  };

  // Leads CRM Operations
  const addLead = (lead: Omit<LeadInquiry, 'id' | 'createdAt'>) => {
    const newLead: LeadInquiry = {
      ...lead,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setLeads((prev) => [newLead, ...prev]);
  };

  const updateLeadStatus = (
    id: string,
    status: LeadInquiry['status'],
    sellerNotes?: string,
    assignedSellerId?: string
  ) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const sellerObj = assignedSellerId ? users.find((u) => u.id === assignedSellerId) : undefined;
          return {
            ...l,
            status,
            sellerNotes: sellerNotes !== undefined ? sellerNotes : l.sellerNotes,
            assignedSellerId: assignedSellerId !== undefined ? assignedSellerId : l.assignedSellerId,
            assignedSellerName: sellerObj ? sellerObj.name : l.assignedSellerName,
          };
        }
        return l;
      })
    );
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // Database Backup / Restore
  const exportDatabaseJson = (): string => {
    const data = {
      version: 'MiCarro-2.0',
      exportedAt: new Date().toISOString(),
      users,
      agencies,
      currentAgencyId,
      carListings,
      privateOffers,
      subscriptionPlans,
      paymentGateways,
      invoices,
      leads,
    };
    return JSON.stringify(data, null, 2);
  };

  const importDatabaseJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.carListings && Array.isArray(parsed.carListings)) {
        if (parsed.users) setUsers(parsed.users);
        if (parsed.agencies) setAgencies(parsed.agencies);
        if (parsed.carListings) setCarListings(parsed.carListings);
        if (parsed.privateOffers) setPrivateOffers(parsed.privateOffers);
        if (parsed.subscriptionPlans) setSubscriptionPlans(parsed.subscriptionPlans);
        if (parsed.paymentGateways) setPaymentGateways(parsed.paymentGateways);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.leads) setLeads(parsed.leads);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Single-Use Subscription Codes (Igual a TallerYa)
  const generateAccessCode = (codeData: Omit<SubscriptionAccessCode, 'id' | 'createdAt' | 'status'>): SubscriptionAccessCode => {
    const newId = `code-${Date.now()}`;
    const newCode: SubscriptionAccessCode = {
      ...codeData,
      id: newId,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setAccessCodes((prev) => [newCode, ...prev]);
    return newCode;
  };

  const revokeAccessCode = (id: string) => {
    setAccessCodes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'revoked' } : c))
    );
  };

  const deleteAccessCode = (id: string) => {
    setAccessCodes((prev) => prev.filter((c) => c.id !== id));
  };

  const redeemAccessCode = (
    inputCode: string,
    targetAgencyId?: string,
    userEmail?: string
  ): { success: boolean; message: string; codeDetails?: SubscriptionAccessCode } => {
    const cleanCode = inputCode.trim().toUpperCase();
    const found = accessCodes.find((c) => c.code.trim().toUpperCase() === cleanCode);

    if (!found) {
      return { success: false, message: 'Código de suscripción no válido o inexistente.' };
    }

    if (found.status === 'redeemed') {
      return {
        success: false,
        message: `Este código de un solo acceso ya fue utilizado el ${new Date(found.redeemedAt || '').toLocaleDateString('es-AR')}${found.redeemedByAgencyName ? ` por ${found.redeemedByAgencyName}` : ''}.`,
      };
    }

    if (found.status === 'revoked') {
      return { success: false, message: 'Este código de acceso ha sido revocado por la administración.' };
    }

    // Check expiration date
    if (new Date(found.expiresAt).getTime() < Date.now()) {
      return { success: false, message: 'Este código de suscripción ha expirado.' };
    }

    // Identify target agency
    const agencyToUpdateId = targetAgencyId || currentAgencyId;
    const agencyObj = agencies.find((a) => a.id === agencyToUpdateId);

    if (!agencyObj) {
      return { success: false, message: 'No se encontró la concesionaria para aplicar la membresía.' };
    }

    // Calculate new expiration date for the agency
    const currentExp = new Date(agencyObj.subscriptionExpiresAt);
    const baseDate = currentExp.getTime() > Date.now() ? currentExp : new Date();
    const newExpDate = new Date(baseDate);
    if (found.durationMonths >= 900) {
      // Lifetime / 10 years
      newExpDate.setFullYear(newExpDate.getFullYear() + 10);
    } else {
      newExpDate.setMonth(newExpDate.getMonth() + (found.durationMonths || 1));
    }
    const newExpStr = newExpDate.toISOString().split('T')[0];

    // Update Agency Plan and Expiration
    updateAgency(agencyObj.id, {
      subscriptionPlanId: found.planId,
      subscriptionStatus: 'active',
      subscriptionExpiresAt: newExpStr,
    });

    // Mark code as redeemed
    const redeemedCode: SubscriptionAccessCode = {
      ...found,
      status: 'redeemed',
      redeemedAt: new Date().toISOString(),
      redeemedByAgencyId: agencyObj.id,
      redeemedByAgencyName: agencyObj.name,
      redeemedByUserEmail: userEmail || currentUser?.email || 'admin@micarro.com',
    };

    setAccessCodes((prev) => prev.map((c) => (c.id === found.id ? redeemedCode : c)));

    return {
      success: true,
      message: `¡Código canjeado con éxito! Se activó el ${found.planName} hasta el ${newExpDate.toLocaleDateString('es-AR')}.`,
      codeDetails: redeemedCode,
    };
  };

  // Email OTP Delivery & Verification (Resend.com + Local Safety fallback)
  const sendEmailVerificationCode = (email: string, purpose = 'Acceso Administrador Seguro'): { success: boolean; code: string; message: string } => {
    // Generate 6-digit random number
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpSession = {
      email,
      code,
      timestamp: Date.now(),
      purpose,
    };
    setLastGeneratedOtp(otpSession);

    // Call backend endpoint to trigger Resend API email delivery
    fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        code,
        purposeTitle: purpose,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.delivered) {
          console.log(`[Resend OTP Sent]: Correo enviado con ID ${data.emailId}`);
        } else if (data.resendError) {
          console.warn(`[Resend OTP Warning]:`, data.resendError);
        }
      })
      .catch((err) => {
        console.warn('[Resend API Network Catch]:', err);
      });

    return {
      success: true,
      code,
      message: `Código de verificación [${code}] enviado al correo ${email}.`,
    };
  };

  const verifyEmailCode = (email: string, code: string): { success: boolean; message: string } => {
    if (!lastGeneratedOtp) {
      return { success: false, message: 'No hay ningún código activo. Solicite un nuevo código.' };
    }

    // Check expiration (5 minutes)
    if (Date.now() - lastGeneratedOtp.timestamp > 5 * 60 * 1000) {
      return { success: false, message: 'El código de verificación ha expirado. Solicite uno nuevo.' };
    }

    if (
      lastGeneratedOtp.email.toLowerCase() === email.toLowerCase() &&
      lastGeneratedOtp.code.trim() === code.trim()
    ) {
      return { success: true, message: 'Código de verificación verificado correctamente.' };
    }

    return { success: false, message: 'Código de seguridad incorrecto. Intente nuevamente.' };
  };

  // Admin Security / Anti-Brute Force (igual a TallerYa)
  const authenticateAdmin = (
    email: string,
    pinOrPass: string
  ): { success: boolean; message: string; locked?: boolean; remainingAttempts?: number } => {
    // Check if currently locked out
    if (adminLockoutUntil && adminLockoutUntil > Date.now()) {
      const minutesLeft = Math.ceil((adminLockoutUntil - Date.now()) / (60 * 1000));
      return {
        success: false,
        locked: true,
        message: `Acceso bloqueado por seguridad anti-fuerza bruta. Espere ${minutesLeft} minutos para volver a intentar.`,
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pinOrPass.trim();

    // Valid admin emails and PINs/passwords
    // mecanicadakar@gmail.com / admin@micarro.com with password/PIN "Fierro010368#"
    const isValidAdmin =
      (cleanEmail === 'mecanicadakar@gmail.com' && cleanPin === 'Fierro010368#') ||
      (cleanEmail === 'admin@micarro.com' && cleanPin === 'Fierro010368#') ||
      cleanPin === 'Fierro010368#';

    if (isValidAdmin) {
      setAdminFailedAttempts(0);
      setAdminLockoutUntil(null);
      setIsAdminAuthenticated(true);
      return { success: true, message: 'Identidad de Administrador verificada con éxito.' };
    } else {
      const newFailed = adminFailedAttempts + 1;
      setAdminFailedAttempts(newFailed);

      if (newFailed >= 3) {
        const lockoutTime = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
        setAdminLockoutUntil(lockoutTime);
        return {
          success: false,
          locked: true,
          message: 'Se superó el límite estricto de 3 intentos. Acceso bloqueado temporalmente por 15 minutos.',
        };
      }

      const remaining = 3 - newFailed;
      return {
        success: false,
        remainingAttempts: remaining,
        message: `Credenciales incorrectas. Te quedan ${remaining} intento(s) antes del bloqueo de seguridad.`,
      };
    }
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
  };

  const unlockAdminDirectly = () => {
    setIsAdminAuthenticated(true);
    setAdminFailedAttempts(0);
    setAdminLockoutUntil(null);
  };

  const resetToSampleData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setAgencies(INITIAL_AGENCIES);
    setCurrentAgencyId(INITIAL_AGENCIES[0].id);
    setCarListings(INITIAL_CAR_LISTINGS);
    setPrivateOffers(INITIAL_PRIVATE_OFFERS);
    setSubscriptionPlans(INITIAL_SUBSCRIPTION_PLANS);
    setPaymentGateways(INITIAL_PAYMENT_GATEWAYS);
    setInvoices(INITIAL_INVOICES);
    setLeads(INITIAL_LEADS);
    setAccessCodes(INITIAL_ACCESS_CODES);
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentUser,
        users,
        isAuthModalOpen,
        setIsAuthModalOpen,
        login,
        loginAsDemoUser,
        logout,
        addUser,
        updateUser,
        deleteUser,
        selectedCar,
        setSelectedCar,
        currentAgencyId,
        setCurrentAgencyId,
        currentAgency,
        agencies,
        addAgency,
        updateAgency,
        deleteAgency,
        carListings,
        addCarListing,
        updateCarListing,
        deleteCarListing,
        toggleCarFeatured,
        updateCarStatus,
        incrementWhatsappInquiries,
        privateOffers,
        addPrivateOffer,
        updatePrivateOfferStatus,
        deletePrivateOffer,
        subscriptionPlans,
        updateSubscriptionPlan,
        addSubscriptionPlan,
        accessCodes,
        generateAccessCode,
        revokeAccessCode,
        deleteAccessCode,
        redeemAccessCode,
        lastGeneratedOtp,
        sendEmailVerificationCode,
        verifyEmailCode,
        isAdminAuthenticated,
        adminFailedAttempts,
        adminLockoutUntil,
        authenticateAdmin,
        logoutAdmin,
        unlockAdminDirectly,
        paymentGateways,
        updatePaymentGateway,
        invoices,
        addInvoice,
        markInvoicePaid,
        updateInvoiceStatus,
        leads,
        addLead,
        updateLeadStatus,
        comparedCarIds,
        isCompareModalOpen,
        setIsCompareModalOpen,
        toggleCompareCar,
        addCarToCompare,
        removeCarFromCompare,
        clearCompareCars,
        isCarCompared,
        filters,
        setFilters,
        resetFilters,
        pushSettings,
        updatePushSettings,
        triggerPushNotification,
        exchangeRateUsdToPyg,
        formatPrice,
        formatPlanPrice,
        formatWhatsappTemplate,
        generateWhatsappLink,
        openWhatsappForCar,
        exportDatabaseJson,
        importDatabaseJson,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
