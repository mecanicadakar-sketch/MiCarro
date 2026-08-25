import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CarListing, Agency, CurrencyCode } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  X,
  FileText,
  Download,
  Printer,
  Share2,
  Copy,
  CheckCircle2,
  Building2,
  User,
  Calendar,
  DollarSign,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Percent,
  FileCheck,
  Loader2,
  AlertCircle,
  Eye,
  Sliders,
  Landmark,
  Upload,
  ImageIcon,
  Save,
  Check,
  MessageCircle,
} from 'lucide-react';
import { AgencyLogo } from './AgencyLogo';
import { formatNumberWithDots, parseNumberFromFormatted, getMillionsDescription } from '../utils/currencyUtils';

interface CarQuotePdfModalProps {
  car: CarListing | null;
  isOpen: boolean;
  onClose: () => void;
}

// LocalStorage Persistence Helper per Agency
const getAgencyLocalStorageKey = (agencyId: string) => `car_quote_agency_settings_${agencyId}`;

interface SavedAgencyPdfConfig {
  companyName: string;
  companyLogo: string;
  companyRuc: string;
  companyAddress: string;
  companyCity: string;
  companyPhone: string;
  companyEmail: string;
  companyWhatsapp: string;
  sellerName?: string;
  sellerPhone?: string;
  warrantyText?: string;
  bankInfo?: string;
  notes?: string;
  transferFees?: number;
  includeTransferFees?: boolean;
  monthlyInterestRate?: number;
  installmentsCount?: number;
  enableFinancing?: boolean;
  lastSavedAt?: string;
}

const loadSavedAgencyConfig = (ag: Agency): SavedAgencyPdfConfig | null => {
  if (!ag || !ag.id) return null;
  try {
    const raw = localStorage.getItem(getAgencyLocalStorageKey(ag.id));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading agency quote settings from localStorage:', e);
  }
  return null;
};

export const CarQuotePdfModal: React.FC<CarQuotePdfModalProps> = ({ car, isOpen, onClose }) => {
  const { agencies, currentAgencyId, currentUser, formatPrice, updateAgency } = useApp();
  const quoteSheetRef = useRef<HTMLDivElement>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'customize'>('preview');

  // Agency data
  const agency: Agency = (car ? agencies.find((a) => a.id === car.agencyId) : null) ||
    agencies.find((a) => a.id === currentAgencyId) ||
    agencies[0] || {
      id: 'agency-demo',
      name: 'Agencia Demo',
      slug: 'agencia-demo',
      logoUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200',
      ownerName: 'Gerencia Comercial',
      email: 'contacto@agenciademo.com',
      phone: '+595 975 635 770',
      whatsappNumber: '595975635770',
      address: 'Av. España y Sacramento',
      city: 'Asunción',
      provinceOrState: 'Central',
      cuitOrTaxId: '7.226.273-7',
      bankInfo: 'Banco Itaú / Continental • Cta Cte Gs: 620011158 • Alias SIPAP: 7226273',
      defaultWarranty: 'Garantía escrita de 6 meses o 10.000 km (motor y caja). Chequeo de 100 puntos.',
      verified: true,
      subscriptionPlanId: 'plan-pro',
      subscriptionStatus: 'active',
      subscriptionExpiresAt: '2027-01-01',
      billingCycle: 'yearly',
      rating: 4.9,
      reviewsCount: 38,
      createdAt: '2026-01-01',
    };

  // Initial config load from localStorage (if exists)
  const initialCached = loadSavedAgencyConfig(agency);

  // Editable Dealership / Company Profile States
  const [companyName, setCompanyName] = useState(initialCached?.companyName || agency.name);
  const [companyLogo, setCompanyLogo] = useState(initialCached?.companyLogo || agency.logoUrl);
  const [companyRuc, setCompanyRuc] = useState(initialCached?.companyRuc || agency.cuitOrTaxId || '7.226.273-7');
  const [companyAddress, setCompanyAddress] = useState(initialCached?.companyAddress || agency.address);
  const [companyCity, setCompanyCity] = useState(initialCached?.companyCity || agency.city);
  const [companyPhone, setCompanyPhone] = useState(initialCached?.companyPhone || agency.phone);
  const [companyEmail, setCompanyEmail] = useState(initialCached?.companyEmail || agency.email);
  const [companyWhatsapp, setCompanyWhatsapp] = useState(initialCached?.companyWhatsapp || agency.whatsappNumber);
  const [companySavedSuccess, setCompanySavedSuccess] = useState(false);
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(initialCached?.lastSavedAt || null);

  // Expiration date (Default: 7 days)
  const defaultValidDate = new Date();
  defaultValidDate.setDate(defaultValidDate.getDate() + 7);
  const defaultValidDateStr = defaultValidDate.toISOString().split('T')[0];

  // Customization Form State
  const [clientName, setClientName] = useState('Mariano Fernández');
  const [clientPhone, setClientPhone] = useState('+595 981 123 456');
  const [clientEmail, setClientEmail] = useState('mariano.fernandez@gmail.com');
  const [clientDoc, setClientDoc] = useState('4.890.123');

  const [sellerName, setSellerName] = useState(
    initialCached?.sellerName || agency.defaultSellerName || currentUser?.name || 'Juan Pérez (Asesor Comercial)'
  );
  const [sellerPhone, setSellerPhone] = useState(
    initialCached?.sellerPhone || agency.defaultSellerPhone || currentUser?.phone || agency.phone
  );

  const [customPrice, setCustomPrice] = useState<number>(car?.price || 0);
  const [quoteCurrency, setQuoteCurrency] = useState<CurrencyCode>(car?.currency || 'USD');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [transferFees, setTransferFees] = useState<number>(
    initialCached?.transferFees ?? agency.defaultTransferFees ?? 550
  );
  const [includeTransferFees, setIncludeTransferFees] = useState(initialCached?.includeTransferFees ?? true);

  // Financing options
  const [enableFinancing, setEnableFinancing] = useState(initialCached?.enableFinancing ?? true);
  const [downPaymentAmount, setDownPaymentAmount] = useState<number>(
    car ? Math.round(car.price * 0.35) : 5000
  );
  const [installmentsCount, setInstallmentsCount] = useState<number>(
    initialCached?.installmentsCount ?? agency.defaultInstallmentsCount ?? 24
  );
  const [monthlyInterestRate, setMonthlyInterestRate] = useState<number>(
    initialCached?.monthlyInterestRate ?? agency.defaultMonthlyInterestRate ?? 2.5
  );

  // Trade-in vehicle
  const [enableTradeIn, setEnableTradeIn] = useState(false);
  const [tradeInMakeModel, setTradeInMakeModel] = useState('Toyota Allion 1.8');
  const [tradeInYear, setTradeInYear] = useState('2016');
  const [tradeInValuation, setTradeInValuation] = useState<number>(6500);

  // Additional Commercial terms
  const [validUntilDate, setValidUntilDate] = useState(defaultValidDateStr);
  const [warrantyText, setWarrantyText] = useState(
    initialCached?.warrantyText ||
      agency.defaultWarranty ||
      'Garantía mecánica escrita de 6 meses o 10.000 km (motor y caja).'
  );
  const [bankInfo, setBankInfo] = useState(
    initialCached?.bankInfo ||
      agency.bankInfo ||
      'Banco Itaú / Continental • Cta Cte Gs: 620011158 • Alias SIPAP: 7226273 • Titular: Agencia Demo'
  );
  const [notes, setNotes] = useState(
    initialCached?.notes ||
      agency.defaultQuoteNotes ||
      'Vehículo peritado con chequeo de 100 puntos mecánicos. Documentación al día y listo para transferir en el acto.'
  );

  // Sync with agency / localStorage when agency changes
  useEffect(() => {
    if (!agency?.id) return;
    const cached = loadSavedAgencyConfig(agency);
    if (cached) {
      setCompanyName(cached.companyName || agency.name);
      setCompanyLogo(cached.companyLogo || agency.logoUrl);
      setCompanyRuc(cached.companyRuc || agency.cuitOrTaxId || '7.226.273-7');
      setCompanyAddress(cached.companyAddress || agency.address);
      setCompanyCity(cached.companyCity || agency.city);
      setCompanyPhone(cached.companyPhone || agency.phone);
      setCompanyEmail(cached.companyEmail || agency.email);
      setCompanyWhatsapp(cached.companyWhatsapp || agency.whatsappNumber);
      if (cached.bankInfo) setBankInfo(cached.bankInfo);
      if (cached.warrantyText) setWarrantyText(cached.warrantyText);
      if (cached.sellerName) setSellerName(cached.sellerName);
      if (cached.sellerPhone) setSellerPhone(cached.sellerPhone);
      if (cached.transferFees !== undefined) setTransferFees(cached.transferFees);
      if (cached.includeTransferFees !== undefined) setIncludeTransferFees(cached.includeTransferFees);
      if (cached.installmentsCount !== undefined) setInstallmentsCount(cached.installmentsCount);
      if (cached.monthlyInterestRate !== undefined) setMonthlyInterestRate(cached.monthlyInterestRate);
      if (cached.enableFinancing !== undefined) setEnableFinancing(cached.enableFinancing);
      if (cached.notes) setNotes(cached.notes);
      if (cached.lastSavedAt) setLastAutoSavedTime(cached.lastSavedAt);
    } else {
      setCompanyName(agency.name);
      setCompanyLogo(agency.logoUrl);
      setCompanyRuc(agency.cuitOrTaxId || '7.226.273-7');
      setCompanyAddress(agency.address);
      setCompanyCity(agency.city);
      setCompanyPhone(agency.phone);
      setCompanyEmail(agency.email);
      setCompanyWhatsapp(agency.whatsappNumber);
      if (agency.bankInfo) setBankInfo(agency.bankInfo);
      if (agency.defaultWarranty) setWarrantyText(agency.defaultWarranty);
      if (agency.defaultSellerName) setSellerName(agency.defaultSellerName);
      if (agency.defaultSellerPhone) setSellerPhone(agency.defaultSellerPhone);
      if (agency.defaultTransferFees !== undefined) setTransferFees(agency.defaultTransferFees);
      if (agency.defaultInstallmentsCount !== undefined) setInstallmentsCount(agency.defaultInstallmentsCount);
      if (agency.defaultMonthlyInterestRate !== undefined) setMonthlyInterestRate(agency.defaultMonthlyInterestRate);
      if (agency.defaultQuoteNotes) setNotes(agency.defaultQuoteNotes);
    }
  }, [agency.id, agency.name, agency.logoUrl]);

  // Automatic localStorage persistence per agency on any template modification
  useEffect(() => {
    if (!agency?.id || !isOpen) return;

    const timer = setTimeout(() => {
      const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const payload: SavedAgencyPdfConfig = {
        companyName: companyName.trim(),
        companyLogo,
        companyRuc: companyRuc.trim(),
        companyAddress: companyAddress.trim(),
        companyCity: companyCity.trim(),
        companyPhone: companyPhone.trim(),
        companyEmail: companyEmail.trim(),
        companyWhatsapp: companyWhatsapp.trim(),
        sellerName: sellerName.trim(),
        sellerPhone: sellerPhone.trim(),
        warrantyText: warrantyText.trim(),
        bankInfo: bankInfo.trim(),
        notes: notes.trim(),
        transferFees,
        includeTransferFees,
        monthlyInterestRate,
        installmentsCount,
        enableFinancing,
        lastSavedAt: now,
      };

      try {
        localStorage.setItem(getAgencyLocalStorageKey(agency.id), JSON.stringify(payload));
        setLastAutoSavedTime(now);
      } catch (e) {
        console.error('Error auto-saving quote settings to localStorage:', e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    agency.id,
    isOpen,
    companyName,
    companyLogo,
    companyRuc,
    companyAddress,
    companyCity,
    companyPhone,
    companyEmail,
    companyWhatsapp,
    sellerName,
    sellerPhone,
    warrantyText,
    bankInfo,
    notes,
    transferFees,
    includeTransferFees,
    monthlyInterestRate,
    installmentsCount,
    enableFinancing,
  ]);

  // Unique quote serial
  const quoteNumber = useRef(`COT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`).current;
  const issueDateFormatted = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Sync state when car prop changes
  useEffect(() => {
    if (car) {
      setCustomPrice(car.price || 0);
      setQuoteCurrency(car.currency || 'USD');
      setDownPaymentAmount(Math.round((car.price || 0) * 0.35));
    }
  }, [car]);

  // Handle Logo Upload from device
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCompanyLogo(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Company & Quote template defaults permanently to Agency and LocalStorage
  const handleSaveAgencyDefaults = () => {
    const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const payload: SavedAgencyPdfConfig = {
      companyName: companyName.trim() || agency.name,
      companyLogo,
      companyRuc: companyRuc.trim(),
      companyAddress: companyAddress.trim(),
      companyCity: companyCity.trim(),
      companyPhone: companyPhone.trim(),
      companyEmail: companyEmail.trim(),
      companyWhatsapp: companyWhatsapp.trim().replace(/[^0-9]/g, ''),
      bankInfo: bankInfo.trim(),
      warrantyText: warrantyText.trim(),
      sellerName: sellerName.trim(),
      sellerPhone: sellerPhone.trim(),
      transferFees: transferFees,
      includeTransferFees: includeTransferFees,
      monthlyInterestRate: monthlyInterestRate,
      installmentsCount: installmentsCount,
      enableFinancing: enableFinancing,
      notes: notes.trim(),
      lastSavedAt: now,
    };

    try {
      localStorage.setItem(getAgencyLocalStorageKey(agency.id), JSON.stringify(payload));
      setLastAutoSavedTime(now);
    } catch (e) {
      console.error('Error saving quote settings to localStorage:', e);
    }

    updateAgency(agency.id, {
      name: companyName.trim() || agency.name,
      logoUrl: companyLogo,
      cuitOrTaxId: companyRuc.trim(),
      address: companyAddress.trim(),
      city: companyCity.trim(),
      phone: companyPhone.trim(),
      email: companyEmail.trim(),
      whatsappNumber: companyWhatsapp.trim().replace(/[^0-9]/g, ''),
      bankInfo: bankInfo.trim(),
      defaultWarranty: warrantyText.trim(),
      defaultSellerName: sellerName.trim(),
      defaultSellerPhone: sellerPhone.trim(),
      defaultTransferFees: transferFees,
      defaultMonthlyInterestRate: monthlyInterestRate,
      defaultInstallmentsCount: installmentsCount,
      defaultQuoteNotes: notes.trim(),
    });
    setCompanySavedSuccess(true);
    setCopiedNotification('¡Plantilla y datos de la concesionaria guardados exitosamente!');
    setTimeout(() => {
      setCompanySavedSuccess(false);
      setCopiedNotification(null);
    }, 3500);
  };

  if (!isOpen || !car) return null;

  // Commercial Math
  const currencySymbol = quoteCurrency === 'PYG' ? 'Gs.' : quoteCurrency === 'EUR' ? '€' : quoteCurrency === 'ARS' ? '$' : 'USD';
  const formatQuoteMoney = (amount: number) => {
    if (quoteCurrency === 'PYG') {
      return `Gs. ${amount.toLocaleString('es-PY')}`;
    } else if (quoteCurrency === 'EUR') {
      return `${amount.toLocaleString('es-ES')} €`;
    } else if (quoteCurrency === 'ARS') {
      return `$ ${amount.toLocaleString('es-ES')}`;
    }
    return `USD ${amount.toLocaleString('es-ES')}`;
  };

  const netVehiclePrice = Math.max(0, customPrice - discountAmount);
  const effectiveTransferFees = includeTransferFees ? transferFees : 0;
  const effectiveTradeIn = enableTradeIn ? tradeInValuation : 0;
  const finalCashTotal = Math.max(0, netVehiclePrice + effectiveTransferFees - effectiveTradeIn);

  // Financing Math
  const financedPrincipal = Math.max(0, netVehiclePrice - downPaymentAmount - effectiveTradeIn);
  const r = monthlyInterestRate / 100;
  const monthlyInstallmentAmount =
    financedPrincipal > 0 && installmentsCount > 0
      ? r > 0
        ? Math.round(
            (financedPrincipal * (r * Math.pow(1 + r, installmentsCount))) /
              (Math.pow(1 + r, installmentsCount) - 1)
          )
        : Math.round(financedPrincipal / installmentsCount)
      : 0;

  // PDF Generation via html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!quoteSheetRef.current) return;
    setIsGeneratingPdf(true);

    try {
      // Small pause to ensure rendering
      await new Promise((resolve) => setTimeout(resolve, 150));

      const element = quoteSheetRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      } else {
        // Multi-page slicing if content overflows single A4 page
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      }

      const sanitizedClient = (clientName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedCar = `${car.make}_${car.model}`.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Cotizacion_${sanitizedCar}_${sanitizedClient}_${quoteNumber}.pdf`;

      pdf.save(fileName);

      setCopiedNotification('¡PDF generado y descargado correctamente!');
      setTimeout(() => setCopiedNotification(null), 4000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback: trigger browser print
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyEmailText = () => {
    const text = `PROFORMA DE COTIZACIÓN OFICIAL
Nro: ${quoteNumber} | Fecha: ${issueDateFormatted}
Concesionaria: ${agency.name} (${agency.phone} - ${agency.email})
Asesor Comercial: ${sellerName}

--- DATOS DEL CLIENTE ---
Nombre: ${clientName}
Teléfono: ${clientPhone}
Email: ${clientEmail}
Documento: ${clientDoc}

--- VEHÍCULO SELECCIONADO ---
Auto: ${car.title}
Año: ${car.year} | Km: ${car.mileage.toLocaleString('es-ES')} km
Transmisión: ${car.transmission} | Combustible: ${car.fuelType}
Color: ${car.color} | Estado: ${car.condition}

--- PROPUESTA COMERCIAL ---
Precio de Lista: ${currencySymbol} ${quoteCurrency === 'PYG' ? customPrice.toLocaleString('es-PY') : customPrice.toLocaleString('es-ES')}
${discountAmount > 0 ? `Descuento Especial: - ${currencySymbol} ${quoteCurrency === 'PYG' ? discountAmount.toLocaleString('es-PY') : discountAmount.toLocaleString('es-ES')}\n` : ''}${
      includeTransferFees ? `Gastos de Transferencia y Gestoría: ${currencySymbol} ${quoteCurrency === 'PYG' ? transferFees.toLocaleString('es-PY') : transferFees.toLocaleString('es-ES')}\n` : ''
    }${
      enableTradeIn
        ? `Toma de Usado (${tradeInMakeModel} ${tradeInYear}): - ${currencySymbol} ${quoteCurrency === 'PYG' ? tradeInValuation.toLocaleString('es-PY') : tradeInValuation.toLocaleString('es-ES')}\n`
        : ''
    }TOTAL CONTADO A PAGAR: ${currencySymbol} ${quoteCurrency === 'PYG' ? finalCashTotal.toLocaleString('es-PY') : finalCashTotal.toLocaleString('es-ES')}

${
  enableFinancing
    ? `--- PLAN DE FINANCIACIÓN SUGERIDO ---
Anticipo / Entrega Inicial: ${currencySymbol} ${quoteCurrency === 'PYG' ? downPaymentAmount.toLocaleString('es-PY') : downPaymentAmount.toLocaleString('es-ES')}
Saldo a Financiar: ${currencySymbol} ${quoteCurrency === 'PYG' ? financedPrincipal.toLocaleString('es-PY') : financedPrincipal.toLocaleString('es-ES')}
Cuotas: ${installmentsCount} pagos mensuales de ${currencySymbol} ${quoteCurrency === 'PYG' ? monthlyInstallmentAmount.toLocaleString('es-PY') : monthlyInstallmentAmount.toLocaleString('es-ES')} aprox.
`
    : ''
}
--- CONDICIONES ---
Validez de la oferta: Hasta el ${validUntilDate}
Garantía: ${warrantyText}
Cuentas para reserva: ${bankInfo}
Observaciones: ${notes}

Saludos cordiales,
${agency.name} • ${agency.address}, ${agency.city}`;

    navigator.clipboard.writeText(text);
    setCopiedNotification('¡Texto de cotización copiado al portapapeles!');
    setTimeout(() => setCopiedNotification(null), 4000);
  };

  const handleSendWhatsApp = async () => {
    const cleanClientPhone = clientPhone.replace(/[^0-9]/g, '');
    const formattedPriceStr = quoteCurrency === 'PYG' ? `${customPrice.toLocaleString('es-PY')} Gs.` : `${currencySymbol} ${customPrice.toLocaleString('es-ES')}`;
    const formattedTotalStr = quoteCurrency === 'PYG' ? `${finalCashTotal.toLocaleString('es-PY')} Gs.` : `${currencySymbol} ${finalCashTotal.toLocaleString('es-ES')}`;
    const formattedDownPayment = quoteCurrency === 'PYG' ? `${downPaymentAmount.toLocaleString('es-PY')} Gs.` : `${currencySymbol} ${downPaymentAmount.toLocaleString('es-ES')}`;
    const formattedMonthly = quoteCurrency === 'PYG' ? `${monthlyInstallmentAmount.toLocaleString('es-PY')} Gs.` : `${currencySymbol} ${monthlyInstallmentAmount.toLocaleString('es-ES')}`;

    let msg = `📄 *COTIZACIÓN PROFORMA - ${companyName || agency.name}*\n`;
    msg += `🔢 *Nº:* ${quoteNumber} | 📅 *Fecha:* ${issueDateFormatted}\n\n`;
    msg += `👤 *Cliente:* ${clientName || 'Estimado/a Cliente'}\n`;
    msg += `🚗 *Vehículo:* ${car.title} (${car.year})\n`;
    msg += `📊 *Kilometraje:* ${car.mileage.toLocaleString('es-ES')} km | Transmisión: ${car.transmission}\n\n`;
    msg += `💰 *Precio:* ${formattedPriceStr}\n`;
    if (discountAmount > 0) {
      msg += `🎁 *Descuento Especial:* -${quoteCurrency === 'PYG' ? `${discountAmount.toLocaleString('es-PY')} Gs.` : `${currencySymbol} ${discountAmount.toLocaleString('es-ES')}`}\n`;
    }
    if (enableTradeIn) {
      msg += `🔄 *Toma de Usado (${tradeInMakeModel}):* -${quoteCurrency === 'PYG' ? `${tradeInValuation.toLocaleString('es-PY')} Gs.` : `${currencySymbol} ${tradeInValuation.toLocaleString('es-ES')}`}\n`;
    }
    msg += `✅ *TOTAL A PAGAR:* ${formattedTotalStr}\n\n`;

    if (enableFinancing) {
      msg += `💳 *PLAN DE FINANCIACIÓN:*\n`;
      msg += `• Entrega / Anticipo: ${formattedDownPayment}\n`;
      msg += `• Cuotas: ${installmentsCount} pagos de ${formattedMonthly} aprox.\n\n`;
    }

    msg += `🛡️ *Garantía:* ${warrantyText}\n`;
    msg += `⏳ *Validez:* Hasta el ${validUntilDate}\n`;
    msg += `🏦 *Cuentas para reserva:* ${bankInfo}\n\n`;
    msg += `👨‍💼 *Asesor:* ${sellerName} (${sellerPhone || companyPhone})\n`;
    msg += `📍 *Ubicación:* ${companyAddress || agency.address}, ${companyCity || agency.city}`;

    const encodedMsg = encodeURIComponent(msg);
    let whatsappUrl = '';
    if (cleanClientPhone && cleanClientPhone.length >= 8) {
      whatsappUrl = `https://wa.me/${cleanClientPhone}?text=${encodedMsg}`;
    } else {
      whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMsg}`;
    }

    // Try Web Share API with PDF file if on supported mobile device
    if (navigator.share && quoteSheetRef.current && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      try {
        const element = quoteSheetRef.current;
        const canvas = await html2canvas(element, { scale: 1.5, useCORS: true, allowTaint: true, logging: false });
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
        const pdfBlob = pdf.output('blob');
        const sanitizedCar = `${car.make}_${car.model}`.replace(/[^a-zA-Z0-9]/g, '_');
        const file = new File([pdfBlob], `Cotizacion_${sanitizedCar}_${quoteNumber}.pdf`, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Cotización ${car.title}`,
            text: msg,
            files: [file],
          });
          setCopiedNotification('¡Cotización compartida con éxito!');
          setTimeout(() => setCopiedNotification(null), 4000);
          return;
        }
      } catch (err) {
        console.log('Falling back to WhatsApp URL:', err);
      }
    }

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setCopiedNotification('¡Abriendo WhatsApp con la cotización formateada!');
    setTimeout(() => setCopiedNotification(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-6xl w-full shadow-2xl my-4 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header Modal Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Generador de Cotización Proforma PDF
                </h2>
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                  {quoteNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Documento comercial profesional con logo de {agency.name} y datos listos para enviar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch for mobile / smaller screens */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white text-blue-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Vista Previa PDF</span>
              </button>
              <button
                onClick={() => setActiveTab('customize')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'customize'
                    ? 'bg-white text-blue-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Personalizar Valores</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification pill */}
        {copiedNotification && (
          <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* Content Body: Split Layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* LEFT: Customization Controls (Visible on large screens or when customize tab is active) */}
          <div
            className={`lg:col-span-5 bg-slate-50 border-r border-slate-200 p-5 overflow-y-auto space-y-5 text-xs ${
              activeTab === 'customize' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-700" />
                    <span>Ajustar Datos de la Propuesta & Membrete</span>
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Vinculado a: <strong className="text-slate-700">{agency.name}</strong>
                  </p>
                </div>
              </div>

              {/* Banner informativo de carga automática y guardado con LocalStorage */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11px] text-slate-700 leading-relaxed">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Almacenamiento Local por Concesionaria
                    </span>
                    Tus ajustes de membrete, cuentas bancarias, garantía y asesor se guardan automáticamente en tu navegador para <strong>{agency.name}</strong>.
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 bg-white/80 px-2.5 py-1.5 rounded-lg border border-blue-100">
                  <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Auto-guardado activo en este dispositivo
                  </span>
                  {lastAutoSavedTime && (
                    <span className="font-mono text-slate-400">
                      Último guardado: {lastAutoSavedTime}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveAgencyDefaults}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                    companySavedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-700 hover:bg-blue-800 text-white'
                  }`}
                >
                  {companySavedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>¡Plantilla guardada como predeterminada!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>💾 Guardar Cambios como Plantilla por Defecto</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 0. DEALERSHIP / COMPANY PROFILE CUSTOMIZATION */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-blue-200/80 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>🏢 Membrete y Datos de la Empresa</span>
                </span>
                <span className="text-[10px] text-blue-700 bg-blue-50 font-bold px-2 py-0.5 rounded-md border border-blue-200">
                  Logo & RUC
                </span>
              </div>

              {/* Logo Preview & Upload */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  {companyLogo ? (
                    <img src={companyLogo} alt="Logo" className="w-full h-full object-contain filter drop-shadow-xs" crossOrigin="anonymous" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Logo de la Concesionaria</label>
                  <div className="flex items-center gap-2">
                    <label className="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow-sm transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>Subir Imagen</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-slate-400">PNG, JPG, WebP</span>
                  </div>
                </div>
              </div>

              {/* Company Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej: Dakar Autos"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">RUC / CUIT / ID Fiscal</label>
                  <input
                    type="text"
                    value={companyRuc}
                    onChange={(e) => setCompanyRuc(e.target.value)}
                    placeholder="Ej: 7.226.273-7"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dirección del Salón</label>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Av. España 1234"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    placeholder="Asunción"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={companyPhone}
                    onChange={(e) => {
                      setCompanyPhone(e.target.value);
                      setCompanyWhatsapp(e.target.value);
                    }}
                    placeholder="+595 975 635 770"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Oficial</label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="ventas@concesionaria.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Save defaults button */}
              <button
                type="button"
                onClick={handleSaveAgencyDefaults}
                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  companySavedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-blue-700 text-white'
                }`}
              >
                {companySavedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>¡Guardado como predeterminado de la empresa!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>💾 Guardar como datos oficiales de la concesionaria</span>
                  </>
                )}
              </button>
            </div>

            {/* 1. Client Info */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-sm">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Datos del Cliente
              </span>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Marcelo Castro"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teléfono / Celular</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+54 9 11..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">DNI / CUIT / RUC</label>
                  <input
                    type="text"
                    value={clientDoc}
                    onChange={(e) => setClientDoc(e.target.value)}
                    placeholder="34.890.123"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email del Cliente</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="cliente@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>

            {/* 2. Commercial Pricing & Discounts */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Precio y Moneda ({currencySymbol})
                </span>
                <select
                  value={quoteCurrency}
                  onChange={(e) => {
                    const newCurr = e.target.value as CurrencyCode;
                    if (newCurr === 'PYG' && quoteCurrency === 'USD' && customPrice < 500000) {
                      const converted = Math.round((customPrice * 7900) / 1000000) * 1000000 || 85000000;
                      setCustomPrice(converted);
                      setDownPaymentAmount(Math.round(converted * 0.35));
                    } else if (newCurr === 'USD' && quoteCurrency === 'PYG' && customPrice >= 1000000) {
                      const converted = Math.round(customPrice / 7900);
                      setCustomPrice(converted);
                      setDownPaymentAmount(Math.round(converted * 0.35));
                    }
                    setQuoteCurrency(newCurr);
                  }}
                  className="bg-slate-50 text-slate-900 font-bold border border-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="PYG">Gs. (PYG)</option>
                  <option value="ARS">ARS ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Precio Base ({currencySymbol})</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customPrice ? formatNumberWithDots(customPrice) : ''}
                    onChange={(e) => setCustomPrice(parseNumberFromFormatted(e.target.value))}
                    placeholder={quoteCurrency === 'PYG' ? 'Ej. 85.000.000' : '0'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Descuento Especial ({currencySymbol})</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={discountAmount ? formatNumberWithDots(discountAmount) : ''}
                    onChange={(e) => setDiscountAmount(parseNumberFromFormatted(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-rose-600 font-semibold font-mono"
                  />
                </div>
              </div>

              {/* Unidad de Millón shortcuts para cotización en Guaraníes */}
              {quoteCurrency === 'PYG' && (
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-blue-900 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      Unidad de Millón (2 puntos entre los 6 ceros):
                    </span>
                    <span className="font-mono font-black text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                      Gs. {formatNumberWithDots(customPrice)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setCustomPrice((prev) => (prev || 0) + 10_000_000)}
                      className="px-2 py-0.5 bg-white hover:bg-blue-100 text-blue-800 text-[10px] font-bold rounded border border-blue-300 shadow-2xs"
                    >
                      +10 Millones
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomPrice((prev) => (prev || 0) + 50_000_000)}
                      className="px-2 py-0.5 bg-white hover:bg-blue-100 text-blue-800 text-[10px] font-bold rounded border border-blue-300 shadow-2xs"
                    >
                      +50 Millones
                    </button>
                    {[65000000, 85000000, 120000000, 160000000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCustomPrice(preset)}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-mono rounded border border-slate-300"
                      >
                        {formatNumberWithDots(preset)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-1 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTransferFees}
                    onChange={(e) => setIncludeTransferFees(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-700 font-medium">Incluir Gastos de Transferencia</span>
                </label>
                {includeTransferFees && (
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500">{currencySymbol}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={transferFees ? formatNumberWithDots(transferFees) : ''}
                      onChange={(e) => setTransferFees(parseNumberFromFormatted(e.target.value))}
                      className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono font-semibold"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 3. Trade-in Vehicle */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  Toma de Usado en Parte de Pago
                </span>
                <input
                  type="checkbox"
                  checked={enableTradeIn}
                  onChange={(e) => setEnableTradeIn(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
              </div>

              {enableTradeIn && (
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Vehículo del Cliente</label>
                    <input
                      type="text"
                      value={tradeInMakeModel}
                      onChange={(e) => setTradeInMakeModel(e.target.value)}
                      placeholder="Ej: Toyota Etios XLS 1.5"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Año</label>
                      <input
                        type="text"
                        value={tradeInYear}
                        onChange={(e) => setTradeInYear(e.target.value)}
                        placeholder="2018"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Tasación ({currencySymbol})
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={tradeInValuation ? formatNumberWithDots(tradeInValuation) : ''}
                        onChange={(e) => setTradeInValuation(parseNumberFromFormatted(e.target.value))}
                        placeholder={quoteCurrency === 'PYG' ? 'Ej. 35.000.000' : '0'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-700 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Financing Plan */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  Plan de Financiación Cuotificado
                </span>
                <input
                  type="checkbox"
                  checked={enableFinancing}
                  onChange={(e) => setEnableFinancing(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
              </div>

              {enableFinancing && (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Anticipo Inicial ({currencySymbol})
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={downPaymentAmount ? formatNumberWithDots(downPaymentAmount) : ''}
                        onChange={(e) => setDownPaymentAmount(parseNumberFromFormatted(e.target.value))}
                        placeholder={quoteCurrency === 'PYG' ? 'Ej. 30.000.000' : '0'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cantidad de Cuotas</label>
                      <select
                        value={installmentsCount}
                        onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                      >
                        <option value={12}>12 Cuotas Mensuales</option>
                        <option value={18}>18 Cuotas Mensuales</option>
                        <option value={24}>24 Cuotas Mensuales</option>
                        <option value={36}>36 Cuotas Mensuales</option>
                        <option value={48}>48 Cuotas Mensuales</option>
                        <option value={60}>60 Cuotas Mensuales</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-700 block">Cuota Mensual Estimada</span>
                      <span className="text-sm font-black text-indigo-950">
                        {currencySymbol} {quoteCurrency === 'PYG' ? monthlyInstallmentAmount.toLocaleString('es-PY') : monthlyInstallmentAmount.toLocaleString('es-ES')} / mes
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200 font-semibold">
                      {installmentsCount} meses
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Terms & Seller Info */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-sm">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-slate-700" />
                Vigencia y Cuentas Bancarias
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Válido Hasta</label>
                  <input
                    type="date"
                    value={validUntilDate}
                    onChange={(e) => setValidUntilDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Asesor Firmante</label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="Nombre del asesor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cuentas Bancarias para Seña</label>
                <textarea
                  rows={2}
                  value={bankInfo}
                  onChange={(e) => setBankInfo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Garantía / Observaciones</label>
                <input
                  type="text"
                  value={warrantyText}
                  onChange={(e) => setWarrantyText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleSaveAgencyDefaults}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                    companySavedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-blue-700 text-white'
                  }`}
                >
                  {companySavedSuccess ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>¡Plantilla guardada para futuros PDFs!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>💾 Guardar Plantilla Predeterminada de {agency.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick switch to preview on mobile */}
            <div className="lg:hidden">
              <button
                onClick={() => setActiveTab('preview')}
                className="w-full py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs shadow"
              >
                Ver Documento Proforma Listo
              </button>
            </div>
          </div>

          {/* RIGHT: Live Printable Proforma Sheet (A4 Canvas) */}
          <div
            className={`lg:col-span-7 p-4 sm:p-6 bg-slate-200/60 overflow-y-auto flex flex-col items-center justify-start ${
              activeTab === 'preview' ? 'block' : 'hidden lg:flex'
            }`}
          >
            {/* Top Export Actions Toolbar */}
            <div className="w-full max-w-[680px] mb-4 flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-2xl border border-slate-300/80 shadow-sm">
              <span className="text-xs font-bold text-slate-700 pl-1 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-700" />
                <span>Hoja A4 Oficial</span>
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleCopyEmailText}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
                  title="Copiar texto formateado para email"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copiar Texto</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
                  title="Imprimir o Guardar como PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir</span>
                </button>

                <button
                  onClick={handleSendWhatsApp}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all active:scale-98"
                  title="Enviar propuesta por WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="px-4 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-bold flex items-center gap-2 shadow transition-all active:scale-98"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* A4 PAPER CONTAINER: Exactly styled for high-resolution canvas snapshot and print */}
            <div
              ref={quoteSheetRef}
              id="quote-pdf-sheet"
              className="bg-white text-slate-900 shadow-xl rounded-xl w-full max-w-[680px] p-6 sm:p-8 border border-slate-300 space-y-5 select-text"
              style={{ minHeight: '880px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {/* Proforma Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3.5">
                  <AgencyLogo
                    logoUrl={companyLogo || agency.logoUrl}
                    name={companyName || agency.name}
                    size="lg"
                  />
                  <div>
                    <h1 className="text-lg font-black text-slate-950 tracking-tight">{companyName || agency.name}</h1>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {companyAddress || agency.address}, {companyCity || agency.city} • RUC: {companyRuc || '7.226.273-7'}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Tel/WhatsApp: {companyPhone || agency.phone} • Email: {companyEmail || agency.email}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-mono font-bold tracking-wider mb-1">
                    COTIZACIÓN / PROFORMA
                  </div>
                  <p className="text-xs font-mono font-bold text-blue-700">{quoteNumber}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Fecha: {issueDateFormatted}</p>
                  <p className="text-[10px] text-slate-500">Vigencia: Hasta {validUntilDate}</p>
                </div>
              </div>

              {/* Client & Commercial Advisor Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    Preparado Para (Cliente)
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{clientName || 'Cliente Particular'}</p>
                  <p className="text-[11px] text-slate-600">Doc / CUIT: {clientDoc || 'S/D'}</p>
                  <p className="text-[11px] text-slate-600">Tel: {clientPhone || 'S/D'}</p>
                  <p className="text-[11px] text-slate-600 truncate">Email: {clientEmail || 'S/D'}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    Asesor Comercial Designado
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{sellerName}</p>
                  <p className="text-[11px] text-slate-600">Concesionaria: {companyName || agency.name}</p>
                  <p className="text-[11px] text-slate-600">Atención Directa: {sellerPhone}</p>
                  <p className="text-[11px] text-emerald-700 font-semibold">Estado: Concesionaria Oficial</p>
                </div>
              </div>

              {/* Selected Vehicle Card */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-900 text-white px-3.5 py-1.5 flex items-center justify-between text-xs font-bold">
                  <span>DETALLE DEL VEHÍCULO COTIZADO</span>
                  <span className="text-amber-400 font-mono">REF #{car.id}</span>
                </div>

                <div className="p-3.5 grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-4 h-24 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={car.photos[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500'}
                      alt={car.title}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>

                  <div className="col-span-8 space-y-1 text-xs">
                    <h3 className="font-extrabold text-slate-950 text-sm">{car.title}</h3>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[11px] text-slate-600 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Año</span>
                        <strong className="text-slate-900">{car.year}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Kilometraje</span>
                        <strong className="text-slate-900">{car.mileage.toLocaleString('es-ES')} km</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Condición</span>
                        <strong className="text-slate-900">{car.condition}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Transmisión</span>
                        <strong className="text-slate-900">{car.transmission}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Combustible</span>
                        <strong className="text-slate-900">{car.fuelType}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Color</span>
                        <strong className="text-slate-900">{car.color}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commercial Breakdown Table */}
              <div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-y border-slate-300">
                      <th className="py-1.5 px-3 text-left font-bold">Concepto Comercial</th>
                      <th className="py-1.5 px-3 text-right font-bold">Importe ({currencySymbol})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2 px-3 text-slate-800">
                        Valor de Lista Vehículo ({car.make} {car.model} {car.year})
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900">
                        {currencySymbol} {quoteCurrency === 'PYG' ? customPrice.toLocaleString('es-PY') : customPrice.toLocaleString('es-ES')}
                      </td>
                    </tr>

                    {discountAmount > 0 && (
                      <tr className="text-rose-700 bg-rose-50/40">
                        <td className="py-1.5 px-3 font-semibold">
                          Bonificación Comercial / Descuento Especial
                        </td>
                        <td className="py-1.5 px-3 text-right font-bold">
                          - {currencySymbol} {quoteCurrency === 'PYG' ? discountAmount.toLocaleString('es-PY') : discountAmount.toLocaleString('es-ES')}
                        </td>
                      </tr>
                    )}

                    {includeTransferFees && (
                      <tr>
                        <td className="py-1.5 px-3 text-slate-700">
                          Gastos Estimados de Transferencia, Certificados y Gestoría
                        </td>
                        <td className="py-1.5 px-3 text-right font-semibold text-slate-900">
                          + {currencySymbol} {quoteCurrency === 'PYG' ? transferFees.toLocaleString('es-PY') : transferFees.toLocaleString('es-ES')}
                        </td>
                      </tr>
                    )}

                    {enableTradeIn && (
                      <tr className="bg-emerald-50/40 text-emerald-800">
                        <td className="py-1.5 px-3 font-semibold">
                          Toma de Usado en Parte de Pago: {tradeInMakeModel} ({tradeInYear})
                        </td>
                        <td className="py-1.5 px-3 text-right font-bold">
                          - {currencySymbol} {quoteCurrency === 'PYG' ? tradeInValuation.toLocaleString('es-PY') : tradeInValuation.toLocaleString('es-ES')}
                        </td>
                      </tr>
                    )}

                    <tr className="bg-slate-900 text-white font-black text-sm">
                      <td className="py-2.5 px-3">SALDO FINAL CONTADO A PAGAR</td>
                      <td className="py-2.5 px-3 text-right text-amber-400">
                        {currencySymbol} {quoteCurrency === 'PYG' ? finalCashTotal.toLocaleString('es-PY') : finalCashTotal.toLocaleString('es-ES')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financing Plan Highlight */}
              {enableFinancing && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                      Plan de Financiación Flexible
                    </span>
                    <span className="text-blue-800 font-bold font-mono">
                      {installmentsCount} Cuotas Fijas / UVAs
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-slate-800">
                    <div className="bg-white p-2 rounded-lg border border-blue-100">
                      <span className="text-slate-400 text-[10px] block">Anticipo / Entrega</span>
                      <strong className="text-slate-900 font-bold">
                        {currencySymbol} {quoteCurrency === 'PYG' ? downPaymentAmount.toLocaleString('es-PY') : downPaymentAmount.toLocaleString('es-ES')}
                      </strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-blue-100">
                      <span className="text-slate-400 text-[10px] block">Saldo Financiado</span>
                      <strong className="text-slate-900 font-bold">
                        {currencySymbol} {quoteCurrency === 'PYG' ? financedPrincipal.toLocaleString('es-PY') : financedPrincipal.toLocaleString('es-ES')}
                      </strong>
                    </div>
                    <div className="bg-blue-700 text-white p-2 rounded-lg shadow-sm">
                      <span className="text-blue-200 text-[10px] block font-semibold">Valor Cuota Aprox.</span>
                      <strong className="text-white font-black">
                        {currencySymbol} {quoteCurrency === 'PYG' ? monthlyInstallmentAmount.toLocaleString('es-PY') : monthlyInstallmentAmount.toLocaleString('es-ES')} / mes
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Transfer & Reservation Details */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-slate-600" />
                  Datos Bancarios para Reserva y Transferencia:
                </p>
                <p className="font-mono text-slate-800 bg-white p-1.5 rounded border border-slate-200 text-[10px]">
                  {bankInfo}
                </p>
                <p className="text-slate-500 text-[10px]">
                  * Para efectivizar la reserva del vehículo se solicita el comprobante bancario vía WhatsApp al {companyWhatsapp || agency.whatsappNumber}.
                </p>
              </div>

              {/* Warranty and Terms */}
              <div className="text-[10px] text-slate-500 space-y-0.5 border-t border-slate-200 pt-2 leading-relaxed">
                <p><strong>Garantía Oficial:</strong> {warrantyText}</p>
                <p><strong>Notas:</strong> {notes}</p>
                <p className="italic">
                  Documento emitido con fines informativos y de cotización previa. Sujeto a disponibilidad de inventario al momento de la reserva.
                </p>
              </div>

              {/* Signatures Footer */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs text-slate-600 border-t border-slate-200">
                <div>
                  <div className="w-40 border-b border-slate-400 mx-auto mb-1"></div>
                  <p className="font-bold text-slate-800">{sellerName}</p>
                  <p className="text-[10px] text-slate-500">Firma Asesor Comercial • {companyName || agency.name}</p>
                </div>

                <div>
                  <div className="w-40 border-b border-slate-400 mx-auto mb-1"></div>
                  <p className="font-bold text-slate-800">{clientName || 'Cliente'}</p>
                  <p className="text-[10px] text-slate-500">Conformidad del Cliente</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="flex flex-wrap items-center justify-between p-4 border-t border-slate-100 bg-slate-50 gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Formato Proforma Estándar Internacional homologado por {companyName || agency.name}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors"
            >
              Cerrar
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-98"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-transform active:scale-98"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Cotización PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
