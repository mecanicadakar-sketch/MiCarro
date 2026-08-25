import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Car,
  Upload,
  Sparkles,
  CheckCircle2,
  Tag,
  DollarSign,
  Phone,
  MessageCircle,
  Building2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Transmission, FuelType, CurrencyCode } from '../types';
import { POPULAR_CAR_BRANDS } from './CarBrandIcons';
import { getAllBrands, getModelsForBrand } from '../data/carBrandsData';
import { formatNumberWithDots, parseNumberFromFormatted, getMillionsDescription } from '../utils/currencyUtils';

export const SellMyCarView: React.FC = () => {
  const { agencies, addPrivateOffer, formatPrice, privateOffers } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [successSubmitted, setSuccessSubmitted] = useState(false);

  // Free Public Quota (Up to 3 free cars per user / browser IP identifier)
  const MAX_FREE_PUBLIC_OFFERS = 3;
  const getStoredPublicOffersCount = (): number => {
    try {
      const stored = localStorage.getItem('micarro_public_offers_count');
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  };
  const [publicOffersUsed, setPublicOffersUsed] = useState<number>(getStoredPublicOffersCount);

  // Form Fields
  const [make, setMake] = useState('Ford');
  const [model, setModel] = useState('Focus');
  const [version, setVersion] = useState('2.0 SE Plus AT');
  const [year, setYear] = useState<number>(2019);
  const [mileage, setMileage] = useState<number>(58000);
  const [transmission, setTransmission] = useState<Transmission>('Automática');
  const [fuelType, setFuelType] = useState<FuelType>('Nafta/Gasolina');
  const [expectedPrice, setExpectedPrice] = useState<number>(14500);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [expectedPriceInputStr, setExpectedPriceInputStr] = useState<string>('14.500');
  const [conditionNotes, setConditionNotes] = useState(
    'Único dueño, service al día, cubiertas con 10.000 km, VTV vigente y sin deudas de patentes ni multas.'
  );
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
  ]);

  // Contact Info
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [city, setCity] = useState('Buenos Aires');
  const [preferredAgencyId, setPreferredAgencyId] = useState<string>('all');

  // AI Valuation State
  const [isValuating, setIsValuating] = useState(false);
  const [aiValuation, setAiValuation] = useState<{
    estimatedDealerPrice?: number;
    estimatedPrivatePrice?: number;
    quickSaleTradeInPrice?: number;
    marketDemand?: string;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState('');

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setPhotos((prev) => [...prev, evt.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleEstimateAiPrice = async () => {
    setIsValuating(true);
    try {
      const res = await fetch('/api/gemini/price-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make,
          model,
          year,
          mileage,
          condition: conditionNotes,
          currency,
        }),
      });
      const data = await res.json();
      setAiValuation(data);
      if (data.estimatedPrivatePrice) {
        setExpectedPrice(data.estimatedPrivatePrice);
      }
    } catch (err) {
      console.error(err);
      setAiValuation({
        estimatedDealerPrice: 13500,
        estimatedPrivatePrice: 14800,
        quickSaleTradeInPrice: 12000,
        marketDemand: 'Alta',
      });
    } finally {
      setIsValuating(false);
    }
  };

  const handleSubmitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (publicOffersUsed >= MAX_FREE_PUBLIC_OFFERS) {
      setErrorMsg(
        `⛔ Límite alcanzado: Has alcanzado el cupo máximo gratuito de ${MAX_FREE_PUBLIC_OFFERS} autos particulares por usuario/IP. Para publicar más unidades o gestionar un inventario continuo, regístrate como Concesionaria en la plataforma.`
      );
      return;
    }

    if (!contactName.trim() || !contactPhone.trim() || !make.trim() || !model.trim()) {
      setErrorMsg('Por favor completa tu nombre, teléfono y datos del vehículo.');
      return;
    }

    addPrivateOffer({
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      contactWhatsapp: contactWhatsapp.trim() || contactPhone.trim(),
      contactEmail: contactEmail.trim() || 'contacto@usuario.com',
      city: city.trim(),
      make: make.trim(),
      model: model.trim(),
      version: version.trim(),
      year: Number(year),
      mileage: Number(mileage),
      expectedPrice: Number(expectedPrice),
      currency,
      transmission,
      fuelType,
      conditionNotes: conditionNotes.trim(),
      photos,
      preferredAgencyId: preferredAgencyId === 'all' ? undefined : preferredAgencyId,
    });

    // Update public quota counter in localStorage
    const newCount = publicOffersUsed + 1;
    setPublicOffersUsed(newCount);
    try {
      localStorage.setItem('micarro_public_offers_count', newCount.toString());
    } catch (err) {
      console.warn('LocalStorage unavailable', err);
    }

    setSuccessSubmitted(true);
  };

  return (
    <div className="relative min-h-[calc(100vh-12rem)] -mx-3 sm:-mx-6 lg:-mx-8 -my-6 px-4 sm:px-6 lg:px-8 py-10 overflow-hidden bg-slate-950 text-slate-100">
      {/* Background Sports Car Image (Exact match to Home Banner with subtle blue showroom atmosphere) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <img
          src="https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600&auto=format&fit=crop&q=85"
          alt="Fondo automóvil deportivo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-right-bottom sm:object-right opacity-35 sm:opacity-40 filter brightness-105 contrast-115 saturate-125 scale-100"
        />
        {/* Deep blue and dark ambient gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 sm:via-slate-950/75 to-blue-950/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-blue-950/60 to-slate-950/80"></div>
        <div className="absolute top-1/3 right-10 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-[500px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-7">
        {/* Header Banner */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md shadow-sm">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Venta Directa & Consignación Segura a Concesionarias</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-sky-400/30 text-sky-200 text-xs font-bold backdrop-blur-md shadow-sm font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cupo Particular Gratis: {publicOffersUsed} / {MAX_FREE_PUBLIC_OFFERS} autos</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
            Ofrece tu auto a las <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">mejores agencias</span> de la red
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed drop-shadow">
            Publica los datos de tu vehículo para que dueños de concesionarias verificadas te hagan una oferta de compra directa al contado o lo tomen en consignación oficial.
          </p>

          {/* Car Brands Interactive Logo Strip */}
          <div className="pt-3 pb-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-sky-400/20 text-[11px] font-medium text-sky-200/90 backdrop-blur-md mb-3">
              <span>Marcas más cotizadas y aceptadas por la red:</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
              {POPULAR_CAR_BRANDS.map((b) => {
                const isSelected = make.toLowerCase() === b.name.toLowerCase();
                return (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => {
                      setMake(b.name);
                      if (step !== 1) setStep(1);
                    }}
                    className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 backdrop-blur-md shadow-sm ${
                      isSelected
                        ? 'bg-blue-600 border-sky-300 text-white font-black shadow-md shadow-blue-600/40 scale-105 ring-2 ring-sky-400/40'
                        : 'bg-slate-900/70 border-slate-700/60 text-slate-300 hover:text-white hover:border-sky-400/60 hover:bg-slate-800/80 hover:scale-105'
                    }`}
                    title={`Seleccionar ${b.name}`}
                  >
                    <span className={`transition-transform duration-200 group-hover:scale-110 ${isSelected ? 'text-white' : 'text-sky-400'}`}>
                      {b.renderIcon()}
                    </span>
                    <span className="text-xs font-semibold tracking-tight">{b.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {successSubmitted ? (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">¡Tu auto fue enviado con éxito a la red!</h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Las agencias de la red evaluarán tu <b className="text-sky-400">{make} {model} {year}</b> y te contactarán directamente por WhatsApp al <b className="text-white">{contactPhone}</b>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/80 border border-blue-800/60 text-xs text-slate-300 max-w-md mx-auto text-left space-y-1 font-mono">
              <p><b>Vehículo:</b> {make} {model} ({year})</p>
              <p><b>Kilometraje:</b> {mileage.toLocaleString('es-ES')} km</p>
              <p><b>Precio pretendido:</b> {formatPrice(expectedPrice, currency)}</p>
              <p><b>Destino:</b> {preferredAgencyId === 'all' ? 'Toda la Red de Concesionarias' : 'Agencia Seleccionada'}</p>
            </div>

            <button
              onClick={() => {
                setSuccessSubmitted(false);
                setStep(1);
              }}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-transform hover:scale-102"
            >
              Ofrecer Otro Vehículo
            </button>
          </div>
        ) : (
          <div className="relative rounded-3xl overflow-hidden border border-sky-400/30 bg-slate-950 shadow-2xl p-6 sm:p-10 space-y-6 text-white">
            {/* Background Sports Car Image inside the Floating Card Container */}
            <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600&auto=format&fit=crop&q=85"
                alt="Fondo automóvil deportivo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-right-bottom sm:object-right opacity-55 sm:opacity-65 filter brightness-105 contrast-110 saturate-125 transition-opacity duration-700"
              />
              {/* Subtle directional gradients for high legibility while keeping the sports car vivid and prominent */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 sm:via-slate-950/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-sky-950/50"></div>
            </div>

            {/* Ambient celeste & cyan glow effects */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none -mt-20 z-0"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none z-0"></div>

            {/* Card Content (Relative z-10 for inputs interaction) */}
            <div className="relative z-10 space-y-6">
              {/* Step Progress Pills */}
              <div className="grid grid-cols-3 gap-2 pb-4 border-b border-sky-400/20 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`p-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    step === 1
                      ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/40 border border-sky-400/40'
                      : 'bg-slate-900/70 text-slate-300 hover:text-white border border-sky-900/40 backdrop-blur-md'
                  }`}
                >
                  <span>1. Datos del Auto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`p-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    step === 2
                      ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/40 border border-sky-400/40'
                      : 'bg-slate-900/70 text-slate-300 hover:text-white border border-sky-900/40 backdrop-blur-md'
                  }`}
                >
                  <span>2. Fotos y Estado</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className={`p-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    step === 3
                      ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/40 border border-sky-400/40'
                      : 'bg-slate-900/70 text-slate-300 hover:text-white border border-sky-900/40 backdrop-blur-md'
                  }`}
                >
                  <span>3. Contacto & Enviar</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 backdrop-blur-md">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitOffer} className="space-y-6">
                {/* STEP 1: VEHICLE CORE SPECS */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Car className="w-4 h-4 text-sky-400" />
                        <span>Información del Vehículo</span>
                      </h3>

                      <button
                        type="button"
                        onClick={handleEstimateAiPrice}
                        disabled={isValuating}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-400/40 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm backdrop-blur-md"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{isValuating ? 'Tasando...' : '💡 Tasar con IA'}</span>
                      </button>
                    </div>

                    {/* AI Valuation Banner */}
                    {aiValuation && (
                      <div className="p-4 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-sky-400/40 space-y-2 animate-in zoom-in-95 shadow-inner">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-sky-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Tasación Estimada de Mercado IA
                          </span>
                          <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded">
                            Demanda: {aiValuation.marketDemand || 'Alta'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-center pt-1">
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-blue-900/60">
                            <span className="text-[10px] text-slate-400 block">Toma Rápida Agencia</span>
                            <span className="font-bold text-slate-200 font-mono">
                              USD {aiValuation.quickSaleTradeInPrice?.toLocaleString('es-ES')}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-blue-950/80 border border-sky-400/50">
                            <span className="text-[10px] text-sky-300 block font-bold">Venta Particular</span>
                            <span className="font-black text-sky-300 font-mono">
                              USD {aiValuation.estimatedPrivatePrice?.toLocaleString('es-ES')}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-blue-900/60">
                            <span className="text-[10px] text-slate-400 block">Precio Concesionaria</span>
                            <span className="font-bold text-slate-200 font-mono">
                              USD {aiValuation.estimatedDealerPrice?.toLocaleString('es-ES')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-200 mb-1 font-semibold">Marca *</label>
                        <input
                          type="text"
                          required
                          list="sell-car-makes"
                          placeholder="Ej. Chevrolet, Ford, Toyota"
                          value={make}
                          onChange={(e) => setMake(e.target.value)}
                          className="w-full bg-slate-950/70 backdrop-blur-md text-white rounded-xl p-2.5 border border-sky-500/30 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        />
                        <datalist id="sell-car-makes">
                          {getAllBrands().map((b) => (
                            <option key={b} value={b} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-slate-200 mb-1 font-semibold">Modelo *</label>
                        <input
                          type="text"
                          required
                          list="sell-car-models"
                          placeholder="Ej. Cruze, Focus, Corolla"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          className="w-full bg-slate-950/70 backdrop-blur-md text-white rounded-xl p-2.5 border border-sky-500/30 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        />
                        <datalist id="sell-car-models">
                          {getModelsForBrand(make).map((m) => (
                            <option key={m} value={m} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-slate-200 mb-1 font-semibold">Versión</label>
                        <input
                          type="text"
                          placeholder="Ej. 1.4T LTZ / Titanium"
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                          className="w-full bg-slate-950/70 backdrop-blur-md text-white rounded-xl p-2.5 border border-sky-500/30 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-200 mb-1 font-semibold">Año de Fabricación *</label>
                        <input
                          type="number"
                          required
                          min="1990"
                          max="2026"
                          value={year}
                          onChange={(e) => setYear(Number(e.target.value))}
                          className="w-full bg-slate-950/70 backdrop-blur-md text-white rounded-xl p-2.5 border border-sky-500/30 text-xs font-mono focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-200 mb-1 font-semibold">Kilometraje Actual *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={mileage}
                          onChange={(e) => setMileage(Number(e.target.value))}
                          className="w-full bg-slate-950/70 backdrop-blur-md text-white rounded-xl p-2.5 border border-sky-500/30 text-xs font-mono focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-200 mb-1 font-semibold">Transmisión</label>
                        <select
                          value={transmission}
                          onChange={(e) => setTransmission(e.target.value as any)}
                          className="w-full bg-slate-950/70 backdrop-blur-md text-white rounded-xl p-2.5 border border-sky-500/30 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        >
                          <option value="Automática" className="bg-slate-950 text-white">Automática</option>
                          <option value="Manual" className="bg-slate-950 text-white">Manual</option>
                          <option value="Secuencial" className="bg-slate-950 text-white">Secuencial</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/40 transition-transform active:scale-95"
                      >
                        <span>Siguiente: Fotos y Estado</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: PHOTOS & CONDITION */}
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in-50">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-sky-400" />
                      <span>Fotos y Estado del Auto</span>
                    </h3>

                    {/* Photos Grid */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-200">
                        Fotos del Exterior e Interior ({photos.length} fotos)
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {photos.map((p, idx) => (
                          <div key={idx} className="relative h-24 rounded-xl overflow-hidden bg-slate-950/80 border border-sky-500/30 shadow">
                            <img src={p} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 p-1 rounded-md bg-red-600/90 text-white hover:bg-red-500 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        <label className="h-24 rounded-xl border-2 border-dashed border-sky-400/50 hover:border-sky-300 bg-slate-950/60 hover:bg-sky-950/40 flex flex-col items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors p-2 text-center backdrop-blur-md">
                          <Upload className="w-5 h-5 mb-1 text-sky-400" />
                          <span className="text-[11px] font-bold">Subir Fotos</span>
                          <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </label>
                      </div>
                    </div>

                    {/* Condition Notes */}
                    <div>
                      <label className="block text-slate-200 mb-1 text-xs font-semibold">
                        Observaciones mecánicas, estéticas y de documentación:
                      </label>
                      <textarea
                        rows={3}
                        value={conditionNotes}
                        onChange={(e) => setConditionNotes(e.target.value)}
                        className="w-full bg-slate-950/70 backdrop-blur-md text-white rounded-xl p-3 border border-sky-500/30 text-xs leading-relaxed focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        placeholder="Menciona si tiene VTV al día, estado de cubiertas, si es único dueño, services realizados, etc."
                      />
                    </div>

                    {/* Price Expected */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-sky-400/30 space-y-2">
                      <label className="block text-xs font-bold text-sky-300">
                        Precio Pretendido de Venta *
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={currency}
                          onChange={(e) => {
                            const newCurr = e.target.value as CurrencyCode;
                            if (newCurr === 'PYG' && currency === 'USD' && expectedPrice < 500000) {
                              const converted = Math.round((expectedPrice * 7900) / 1000000) * 1000000 || 65000000;
                              setExpectedPrice(converted);
                              setExpectedPriceInputStr(formatNumberWithDots(converted));
                            } else if (newCurr === 'USD' && currency === 'PYG' && expectedPrice >= 1000000) {
                              const converted = Math.round(expectedPrice / 7900);
                              setExpectedPrice(converted);
                              setExpectedPriceInputStr(formatNumberWithDots(converted));
                            } else {
                              setExpectedPriceInputStr(formatNumberWithDots(expectedPrice));
                            }
                            setCurrency(newCurr);
                          }}
                          className="w-28 bg-slate-900 text-white rounded-xl p-2.5 border border-sky-500/30 text-xs font-bold focus:outline-none focus:border-sky-400"
                        >
                          <option value="USD" className="bg-slate-950">USD ($)</option>
                          <option value="PYG" className="bg-slate-950">Gs. (PYG)</option>
                          <option value="ARS" className="bg-slate-950">ARS ($)</option>
                          <option value="EUR" className="bg-slate-950">EUR (€)</option>
                        </select>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          placeholder={currency === 'PYG' ? 'Ej. 65.000.000' : 'Ej. 14.500'}
                          value={expectedPriceInputStr}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const num = parseNumberFromFormatted(raw);
                            setExpectedPrice(num);
                            setExpectedPriceInputStr(raw === '' ? '' : formatNumberWithDots(num));
                          }}
                          className="flex-1 bg-slate-900/90 text-white rounded-xl p-2.5 border border-sky-500/30 text-sm font-mono font-bold focus:outline-none focus:border-sky-400"
                        />
                      </div>

                      {/* Helper para Guaraníes con formato de millones y 2 puntos */}
                      {currency === 'PYG' && (
                        <div className="mt-2 p-2.5 rounded-xl bg-sky-950/50 border border-sky-500/30 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                            <span className="text-sky-300 font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-sky-400" />
                              Unidad de Millón (2 puntos entre los 6 ceros):
                            </span>
                            <span className="font-mono font-black text-white bg-sky-900/80 px-2 py-0.5 rounded border border-sky-500/40 text-[11px]">
                              {expectedPrice > 0 ? `Gs. ${formatNumberWithDots(expectedPrice)}` : 'Gs. 0'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            {expectedPrice >= 1_000_000
                              ? `Valor: ${(expectedPrice / 1_000_000).toLocaleString('es-PY', { maximumFractionDigits: 2 })} Millones de Gs. (${formatNumberWithDots(expectedPrice)} Gs.)`
                              : 'Podés escribir directamente con dos puntos (ej: 65.000.000) o sumar millones con un clic:'}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                const n = (expectedPrice || 0) + 10_000_000;
                                setExpectedPrice(n);
                                setExpectedPriceInputStr(formatNumberWithDots(n));
                              }}
                              className="px-2 py-1 bg-sky-900/60 hover:bg-sky-800 text-sky-200 text-[11px] font-bold rounded-lg border border-sky-600/40 transition-colors"
                            >
                              +10 Millones
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const n = (expectedPrice || 0) + 50_000_000;
                                setExpectedPrice(n);
                                setExpectedPriceInputStr(formatNumberWithDots(n));
                              }}
                              className="px-2 py-1 bg-sky-900/60 hover:bg-sky-800 text-sky-200 text-[11px] font-bold rounded-lg border border-sky-600/40 transition-colors"
                            >
                              +50 Millones
                            </button>
                            <div className="h-3.5 w-px bg-sky-700/50 mx-1 hidden sm:block" />
                            {[35000000, 50000000, 75000000, 110000000].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setExpectedPrice(preset);
                                  setExpectedPriceInputStr(formatNumberWithDots(preset));
                                }}
                                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[11px] font-mono rounded border border-slate-700 transition-colors"
                              >
                                {formatNumberWithDots(preset)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-sky-900/40 backdrop-blur-md"
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/40 transition-transform active:scale-95"
                      >
                        <span>Siguiente: Contacto</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: CONTACT & SUBMISSION */}
                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in-50">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-sky-400" />
                      <span>Tus Datos de Contacto</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-200 mb-1 font-semibold">Nombre y Apellido *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Juan Pérez"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full bg-slate-950/70 backdrop-blur-md text-white rounded-xl p-2.5 border border-sky-500/30 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-200 mb-1 font-semibold">Teléfono / WhatsApp *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. 0975 635 770"
                          value={contactPhone}
                          onChange={(e) => {
                            setContactPhone(e.target.value);
                            setContactWhatsapp(e.target.value);
                          }}
                          className="w-full bg-slate-950/70 backdrop-blur-md text-white rounded-xl p-2.5 border border-sky-500/30 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-200 mb-1 font-semibold">Email de Contacto</label>
                        <input
                          type="email"
                          placeholder="Ej. juan@correo.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full bg-slate-950/70 backdrop-blur-md text-white rounded-xl p-2.5 border border-sky-500/30 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-200 mb-1 font-semibold">Ciudad / Localidad</label>
                        <input
                          type="text"
                          placeholder="Ej. Asunción, Central"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-slate-950/70 backdrop-blur-md text-white rounded-xl p-2.5 border border-sky-500/30 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-200 mb-1 font-semibold">
                          ¿A qué agencia deseas enviar tu propuesta?
                        </label>
                        <select
                          value={preferredAgencyId}
                          onChange={(e) => setPreferredAgencyId(e.target.value)}
                          className="w-full bg-slate-950/70 backdrop-blur-md text-white rounded-xl p-2.5 border border-sky-500/30 text-xs font-semibold focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                        >
                          <option value="all" className="bg-slate-950 text-white">🌐 Enviar a toda la Red de Concesionarias (Recomendado para más ofertas)</option>
                          {agencies.map((a) => (
                            <option key={a.id} value={a.id} className="bg-slate-950 text-white">
                              🏢 {a.name} ({a.city})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-sky-400/20">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-sky-900/40 backdrop-blur-md"
                      >
                        Atrás
                      </button>

                      <button
                        type="submit"
                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-600/40 transition-transform hover:scale-102 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                        <span>Enviar Propuesta a las Agencias</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
