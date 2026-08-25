import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CarListing } from '../types';
import { CarQuotePdfModal } from './CarQuotePdfModal';
import {
  X,
  MessageCircle,
  ShieldCheck,
  Building2,
  Calendar,
  Gauge,
  Fuel,
  Car,
  CreditCard,
  RefreshCw,
  Printer,
  Share2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  DollarSign,
  Calculator,
  FileText,
  GitCompare,
} from 'lucide-react';

interface CarDetailModalProps {
  car: CarListing | null;
  onClose: () => void;
  onEditCar?: (car: CarListing) => void;
}

export const CarDetailModal: React.FC<CarDetailModalProps> = ({ car, onClose, onEditCar }) => {
  const {
    formatPrice,
    openWhatsappForCar,
    generateWhatsappLink,
    currentAgency,
    comparedCarIds,
    toggleCompareCar,
    setIsCompareModalOpen,
  } = useApp();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'specs' | 'financing' | 'tradein'>('specs');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // Financing Calculator State
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(30);
  const [loanTermMonths, setLoanTermMonths] = useState<number>(24);
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(45);

  // Trade-in state
  const [tradeInCar, setTradeInCar] = useState({
    makeModel: '',
    year: 2019,
    mileage: 65000,
    condition: 'Muy Bueno',
  });

  if (!car) return null;

  const photos = car.photos && car.photos.length > 0
    ? car.photos
    : ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000'];

  // Financing calculations
  const downPaymentAmount = Math.round((car.price * downPaymentPercent) / 100);
  const amountToFinance = car.price - downPaymentAmount;
  const monthlyRate = annualInterestRate / 100 / 12;
  const monthlyPayment = amountToFinance > 0
    ? Math.round(
        (amountToFinance * monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
          (Math.pow(1 + monthlyRate, loanTermMonths) - 1)
      )
    : 0;

  const handleNextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleSendFinancingQuoteToWhatsapp = () => {
    const text = `¡Hola ${car.agencyName}! 👋 Me interesa financiar el *${car.title}* (#${car.id}) con un anticipo de ${car.currency} ${downPaymentAmount.toLocaleString('es-ES')} (${downPaymentPercent}%) y el saldo en *${loanTermMonths} cuotas* estimadas de ${car.currency} ${monthlyPayment.toLocaleString('es-ES')}. ¿Podrían confirmarme los requisitos para la aprobación?`;
    openWhatsappForCar(car, text);
  };

  const handleSendTradeInOfferToWhatsapp = () => {
    const text = `¡Hola ${car.agencyName}! 👋 Quisiera consultar si toman mi vehículo en parte de pago por el *${car.title}* (${car.currency} ${car.price.toLocaleString('es-ES')}). Mi auto es un *${tradeInCar.makeModel || 'vehículo usado'}*, Año ${tradeInCar.year}, con ${tradeInCar.mileage.toLocaleString('es-ES')} km en estado ${tradeInCar.condition}. ¿Podrían hacerme una cotización preliminar?`;
    openWhatsappForCar(car, text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-mono font-bold text-slate-600">REF #{car.id}</span>
            <span className="text-xs font-semibold text-slate-800">• {car.agencyName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleCompareCar(car.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                comparedCarIds.includes(car.id)
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
              title="Comparar especificaciones técnicas con otros autos"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{comparedCarIds.includes(car.id) ? 'En Comparativa' : 'Comparar'}</span>
            </button>

            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
              title="Generar Cotización Proforma en PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📄 Cotización PDF</span>
            </button>
            {onEditCar && (
              <button
                onClick={() => onEditCar(car)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-200 flex items-center gap-1.5 transition-colors"
                title="Editar este auto"
              >
                <span>✏️ Editar Auto</span>
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              title="Imprimir Ficha PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
          {/* Main Photo Gallery */}
          <div className="space-y-2">
            <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
              <img
                src={photos[activePhotoIndex]}
                alt={`${car.title} - Foto ${activePhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Photo Navigation arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {car.isFeatured && (
                  <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    DESTACADO
                  </span>
                )}
                <span className="px-3 py-1 rounded-xl bg-white/95 backdrop-blur-sm text-slate-900 font-bold text-xs border border-slate-200 shadow-sm">
                  {car.condition}
                </span>
                {car.warrantyMonths && (
                  <span className="px-3 py-1 rounded-xl bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Garantía {car.warrantyMonths} meses
                  </span>
                )}
              </div>

              {/* Counter pill */}
              <div className="absolute bottom-4 right-4 px-3 py-1 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white text-xs font-mono font-medium">
                {activePhotoIndex + 1} / {photos.length} Fotos
              </div>
            </div>

            {/* Thumbnails row */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {photos.map((ph, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      activePhotoIndex === idx ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-slate-200 opacity-60'
                    }`}
                  >
                    <img src={ph} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Price Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{car.title}</h2>
              <p className="text-sm text-slate-600 mt-1">
                {car.version || `${car.make} ${car.model}`} • Color: {car.color || 'No especificado'}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-500 block font-semibold">Precio Contado</span>
              <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {formatPrice(car.price, car.currency)}
              </span>
            </div>
          </div>

          {/* Key Specs Pills Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Año</span>
                <strong className="text-sm text-slate-900 font-mono">{car.year}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <Gauge className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Kilómetros</span>
                <strong className="text-sm text-slate-900 font-mono">{car.mileage.toLocaleString('es-ES')} km</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <Car className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Transmisión</span>
                <strong className="text-sm text-slate-900 truncate block">{car.transmission}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <Fuel className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Combustible</span>
                <strong className="text-sm text-slate-900 truncate block">{car.fuelType}</strong>
              </div>
            </div>
          </div>

          {/* Interactive Tabs */}
          <div className="space-y-4">
            <div className="flex border-b border-slate-200 text-xs font-bold gap-2">
              <button
                onClick={() => setSelectedTab('specs')}
                className={`py-2.5 px-4 border-b-2 transition-colors ${
                  selectedTab === 'specs'
                    ? 'border-blue-700 text-blue-700 font-black'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Ficha Técnica & Equipamiento
              </button>

              <button
                onClick={() => setSelectedTab('financing')}
                className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
                  selectedTab === 'financing'
                    ? 'border-blue-700 text-blue-700 font-black'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Simulador de Financiación</span>
              </button>

              <button
                onClick={() => setSelectedTab('tradein')}
                className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
                  selectedTab === 'tradein'
                    ? 'border-blue-700 text-blue-700 font-black'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Entregar Mi Auto (Permuta)</span>
              </button>
            </div>

            {/* TAB: SPECS */}
            {selectedTab === 'specs' && (
              <div className="space-y-4 text-xs animate-fadeIn">
                {car.description && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 leading-relaxed text-slate-700">
                    <p className="whitespace-pre-line">{car.description}</p>
                  </div>
                )}

                {car.features && car.features.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-2">Equipamiento Destacado</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {car.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: FINANCING CALCULATOR */}
            {selectedTab === 'financing' && (
              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4 text-xs animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-blue-700" />
                    <span>Calculadora de Cuotas Personalizada</span>
                  </h4>
                  <span className="text-[11px] text-blue-800 font-semibold">TNA estimada: {annualInterestRate}%</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Anticipo Inicial: {downPaymentPercent}% ({car.currency} {downPaymentAmount.toLocaleString('es-ES')})
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      step={5}
                      value={downPaymentPercent}
                      onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                      className="w-full accent-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Plazo en Cuotas: {loanTermMonths} meses
                    </label>
                    <div className="flex gap-2">
                      {[12, 24, 36, 48, 60].map((term) => (
                        <button
                          key={term}
                          onClick={() => setLoanTermMonths(term)}
                          className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors ${
                            loanTermMonths === term
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {term}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <span className="text-slate-500 text-xs block">Cuota mensual estimada:</span>
                    <strong className="text-2xl font-black text-blue-900 font-mono">
                      {car.currency} {monthlyPayment.toLocaleString('es-ES')} / mes
                    </strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sujeto a verificación crediticia de la agencia</p>
                  </div>

                  <button
                    onClick={handleSendFinancingQuoteToWhatsapp}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Pedir Aprobación por WhatsApp</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: TRADE-IN */}
            {selectedTab === 'tradein' && (
              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4 text-xs animate-fadeIn">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    <span>Cotizá tu Auto Usado en Parte de Pago</span>
                  </h4>
                  <p className="text-slate-600 text-xs mt-0.5">
                    Completá los datos de tu vehículo y enviale una solicitud directa al vendedor de {car.agencyName}.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Marca y Modelo de tu Auto</label>
                    <input
                      type="text"
                      placeholder="Ej: Ford Ka SE 1.5"
                      value={tradeInCar.makeModel}
                      onChange={(e) => setTradeInCar({ ...tradeInCar, makeModel: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Año</label>
                    <input
                      type="number"
                      value={tradeInCar.year}
                      onChange={(e) => setTradeInCar({ ...tradeInCar, year: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Kilometraje Estimado</label>
                    <input
                      type="number"
                      value={tradeInCar.mileage}
                      onChange={(e) => setTradeInCar({ ...tradeInCar, mileage: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSendTradeInOfferToWhatsapp}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar Propuesta de Permuta por WhatsApp</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Agency Direct Contact Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{car.agencyName}</h4>
                <p className="text-xs text-slate-500">Concesionaria Oficial Verificada</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => setIsQuoteModalOpen(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98"
              >
                <FileText className="w-4 h-4" />
                <span>Generar Cotización PDF</span>
              </button>

              <button
                onClick={() => openWhatsappForCar(car)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Chatear por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional PDF Quote Modal */}
      <CarQuotePdfModal
        car={car}
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
};
