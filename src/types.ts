export type CurrencyCode = 'USD' | 'PYG' | 'EUR' | 'ARS' | 'MXN' | 'CLP' | 'COP';

export type CarCondition = '0km' | 'Usado' | 'Certificado' | 'Consignación';
export type Transmission = 'Automática' | 'Manual' | 'Secuencial';
export type FuelType = 'Nafta/Gasolina' | 'Diésel' | 'Híbrido (HEV)' | 'Híbrido Enchufable (PHEV)' | 'Eléctrico (EV)' | 'GNC / GLP';
export type BodyType = 'SUV' | 'Sedán' | 'Hatchback' | 'Pickup' | 'Coupé' | 'Monovolumen' | 'Furgón / Utilitario' | 'Convertible';
export type ListingStatus = 'available' | 'reserved' | 'sold' | 'draft';
export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'cancelled' | 'suspended';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
export type PrivateOfferStatus = 'pending' | 'reviewed' | 'agency_interested' | 'consigned' | 'rejected';
export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

export type UserRole = 'seller' | 'agency_admin' | 'super_admin';

export interface AppUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  agencyId: string;
  agencyName: string;
  phone: string;
  whatsappNumber: string;
  avatarUrl: string;
  password?: string;
  isActive: boolean;
  commissionRate?: number;
  carsLoadedCount?: number;
  carsSoldCount?: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface PredefinedWhatsappMessage {
  id: string;
  title: string;
  category: 'car_inquiry' | 'financing' | 'trade_in' | 'test_drive' | 'general' | 'reservation';
  text: string;
  isDefault?: boolean;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  bannerUrl?: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsappNumber: string; // e.g. "5491133445566"
  whatsappBusinessNumber?: string; // Dedicated WhatsApp Business line
  whatsappCarInquiryTemplate?: string; // Custom template for car listing inquiries
  whatsappFinancingTemplate?: string; // Custom template for financing inquiries
  whatsappTradeInTemplate?: string; // Custom template for trade-in / appraisal requests
  whatsappTestDriveTemplate?: string; // Custom template for test drive booking
  whatsappPredefinedMessages?: PredefinedWhatsappMessage[]; // Quick preset responses library
  address: string;
  city: string;
  provinceOrState: string;
  cuitOrTaxId?: string; // RUC, CUIT or Tax ID
  bankInfo?: string; // Default Bank account / Alias for quotes
  defaultWarranty?: string; // Default warranty terms for quotes
  defaultSellerName?: string;
  defaultSellerPhone?: string;
  defaultTransferFees?: number;
  defaultMonthlyInterestRate?: number;
  defaultInstallmentsCount?: number;
  defaultQuoteNotes?: string;
  website?: string;
  verified: boolean;
  subscriptionPlanId: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: string;
  billingCycle: BillingCycle;
  rating: number;
  reviewsCount: number;
  about?: string;
  openingHours?: string;
  createdAt: string;
}

export interface CarListing {
  id: string;
  agencyId: string;
  agencyName: string;
  agencyWhatsapp: string;
  agencyCity: string;
  title: string;
  make: string;
  model: string;
  version: string;
  year: number;
  mileage: number;
  price: number;
  currency: CurrencyCode;
  condition: CarCondition;
  transmission: Transmission;
  fuelType: FuelType;
  bodyType: BodyType;
  color: string;
  doors: number;
  engine: string;
  traction: '4x2' | '4x4' | 'AWD' | 'FWD' | 'RWD';
  plateEnding?: string;
  status: ListingStatus;
  isFeatured: boolean;
  acceptsTradeIn: boolean;
  financingAvailable: boolean;
  financingDetails?: string;
  photos: string[]; // List of photo URLs/base64 strings
  features: string[];
  description: string;
  warrantyMonths?: number;
  viewsCount: number;
  whatsappInquiriesCount: number;
  createdBySellerId?: string;
  sellerName?: string;
  sellerWhatsapp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrivateCarOffer {
  id: string;
  contactName: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
  city: string;
  make: string;
  model: string;
  version?: string;
  year: number;
  mileage: number;
  expectedPrice: number;
  currency: CurrencyCode;
  transmission: Transmission;
  fuelType: FuelType;
  conditionNotes: string;
  photos: string[];
  preferredAgencyId?: string; // or 'all'
  status: PrivateOfferStatus;
  assignedAgencyId?: string;
  agencyNotes?: string;
  submittedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  badge: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPricePyg?: number;
  yearlyPricePyg?: number;
  currency: CurrencyCode;
  maxCars: number;
  maxPhotosPerCar: number;
  featuredSlots: number;
  allowsDirectWhatsapp: boolean;
  allowsPrivateOffersAccess: boolean;
  allowsAiDescriptionGenerator: boolean;
  allowsCustomWatermark: boolean;
  prioritySupport: boolean;
  isPopular?: boolean;
  isActive: boolean;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  type: 'bank_transfer' | 'card' | 'cash' | 'billetera' | 'sipap' | 'mercadopago' | 'stripe';
  isEnabled: boolean;
  accountHolder?: string;
  accountNumber?: string;
  cbuOrAlias?: string; // SIPAP Alias / CBU
  bankName?: string;
  cuitOrTaxId?: string; // RUC / CI (Paraguay)
  instructions?: string;
  paymentLink?: string;
  currencyAccepted?: string; // e.g. "Guaraníes (PYG) y Dólares (USD)"
  locationOrOffice?: string;
  qrCodeUrl?: string;
}

export interface AgencyInvoice {
  id: string;
  invoiceNumber: string;
  agencyId: string;
  agencyName: string;
  planId: string;
  planName: string;
  period: string;
  billingCycle: BillingCycle;
  amount: number;
  currency: CurrencyCode;
  status: InvoiceStatus;
  paymentMethod: string;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
}

export interface LeadInquiry {
  id: string;
  carId: string;
  carTitle: string;
  agencyId: string;
  agencyName: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  channel: 'whatsapp' | 'web_form' | 'financing_quote';
  message: string;
  tradeInVehicle?: string;
  status: 'new' | 'contacted' | 'negotiating' | 'sold' | 'discarded';
  assignedSellerId?: string;
  assignedSellerName?: string;
  sellerNotes?: string;
  createdAt: string;
}

export interface SubscriptionAccessCode {
  id: string;
  code: string; // e.g. "MICARRO-PRO-9842-X7K"
  planId: string;
  planName: string;
  targetAgencyId?: string; // specific agency or any agency
  targetAgencyName?: string;
  targetEmail?: string;
  durationMonths: number; // e.g. 1, 3, 6, 12, or 999 for lifetime
  maxCarsOverride?: number;
  discountPercentage?: number;
  status: 'active' | 'redeemed' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt: string;
  redeemedAt?: string;
  redeemedByAgencyId?: string;
  redeemedByAgencyName?: string;
  redeemedByUserEmail?: string;
  createdByEmail: string; // "mecanicadakar@gmail.com"
  notes?: string;
}

export interface EmailVerificationSession {
  email: string;
  code: string;
  purpose: 'admin_login' | 'redeem_code' | 'grant_access';
  expiresAt: number;
  attemptsLeft: number;
}

export interface AppFilterState {
  search: string;
  agencyId: string;
  make: string;
  model: string;
  bodyType: string;
  condition: string;
  transmission: string;
  fuelType: string;
  minYear: number | '';
  maxYear: number | '';
  minPrice: number | '';
  maxPrice: number | '';
  minMileage: number | '';
  maxMileage: number | '';
  onlyFeatured: boolean;
  onlyFinancing: boolean;
  onlyTradeIn: boolean;
  sortBy: 'featured' | 'price_asc' | 'price_desc' | 'year_desc' | 'mileage_asc' | 'recent';
}

export type NotificationType =
  | 'whatsapp_inquiry'
  | 'quote_inquiry'
  | 'financing_request'
  | 'private_seller'
  | 'test_drive_request'
  | 'car_compare';

export interface PushNotificationSettings {
  browserPushEnabled: boolean;
  soundEnabled: boolean;
  soundTone: 'modern_chime' | 'subtle_bell' | 'marimba' | 'cash_register';
  toastAlertsEnabled: boolean;
  vibrateEnabled: boolean;
  notifyOnWhatsappInquiry: boolean;
  notifyOnQuoteInquiry: boolean;
  notifyOnPrivateOffer: boolean;
  notifyOnFinancingRequest: boolean;
  sellerSpecificOnly: boolean;
}

export interface AgencyNotification {
  id: string;
  agencyId: string;
  type: NotificationType;
  title: string;
  message: string;
  clientName: string;
  clientPhone: string;
  clientWhatsapp: string;
  clientEmail?: string;
  carId?: string;
  carTitle?: string;
  offerId?: string;
  vehicleSummary?: string;
  amountOrPrice?: string;
  photoUrl?: string;
  timestamp: string;
  isRead: boolean;
  priority?: 'high' | 'normal';
  assignedSellerId?: string;
  assignedSellerName?: string;
  channel?: 'whatsapp' | 'web_quote' | 'trade_in' | 'form';
}
