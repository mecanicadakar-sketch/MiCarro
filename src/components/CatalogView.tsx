import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CarListing, BodyType, CarCondition } from '../types';
import { CarQuotePdfModal } from './CarQuotePdfModal';
import { CarBrandStrip } from './CarBrandIcons';
import { getAllBrands, getModelsForBrand } from '../data/carBrandsData';
import { BrandLogo } from './BrandLogo';
import { AdvancedCarSearchFilter } from './AdvancedCarSearchFilter';
import {
  Search,
  Filter,
  Car,
  MessageCircle,
  Eye,
  Sparkles,
  ShieldCheck,
  Fuel,
  Gauge,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  Building2,
  CreditCard,
  RefreshCw,
  Share2,
  ChevronRight,
  Zap,
  GitCompare,
  Check,
  FileText,
  X,
} from 'lucide-react';

interface CatalogViewProps {
  onOpenCarDetail?: (car: CarListing) => void;
  onSelectCar?: (car: CarListing) => void;
  onOpenCarForm?: () => void;
  onOpenAgencyPanel?: () => void;
  onGoToSellCar?: () => void;
  onOpenSellCar?: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  onOpenCarDetail,
  onSelectCar,
  onOpenCarForm,
  onOpenAgencyPanel,
  onGoToSellCar,
  onOpenSellCar,
}) => {
  const handleSelectCar = (car: CarListing) => {
    if (onSelectCar) onSelectCar(car);
    else if (onOpenCarDetail) onOpenCarDetail(car);
  };

  const handleSellCar = () => {
    if (onOpenSellCar) onOpenSellCar();
    else if (onGoToSellCar) onGoToSellCar();
  };

  const handleAgencyPanel = () => {
    if (onOpenAgencyPanel) onOpenAgencyPanel();
    else if (onOpenCarForm) onOpenCarForm();
  };

  const {
    carListings,
    agencies,
    filters,
    setFilters,
    resetFilters,
    formatPrice,
    openWhatsappForCar,
    setSelectedCar,
    comparedCarIds,
    toggleCompareCar,
    setIsCompareModalOpen,
  } = useApp();

  const [selectedQuickCategory, setSelectedQuickCategory] = useState<string>('all');
  const [quoteCar, setQuoteCar] = useState<CarListing | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [compareLimitWarning, setCompareLimitWarning] = useState<string | null>(null);

  const handleToggleCompare = (carId: string) => {
    const res = toggleCompareCar(carId);
    if (res.limitReached) {
      setCompareLimitWarning('¡Límite alcanzado! Puedes seleccionar hasta 3 vehículos simultáneos para la comparativa técnica.');
      setTimeout(() => {
        setCompareLimitWarning(null);
      }, 5000);
    } else {
      setCompareLimitWarning(null);
    }
  };

  // Filter listings
  const filteredListings = carListings.filter((car) => {
    // Search query
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = car.title.toLowerCase().includes(q);
      const matchMake = car.make.toLowerCase().includes(q);
      const matchModel = car.model.toLowerCase().includes(q);
      const matchAgency = car.agencyName.toLowerCase().includes(q);
      if (!matchTitle && !matchMake && !matchModel && !matchAgency) return false;
    }

    // Make (Brand) Filter
    if (filters.make && car.make.trim().toLowerCase() !== filters.make.trim().toLowerCase()) return false;

    // Model Filter
    if (filters.model) {
      const carMod = car.model.trim().toLowerCase();
      const filterMod = filters.model.trim().toLowerCase();
      if (carMod !== filterMod && !carMod.includes(filterMod) && !filterMod.includes(carMod)) {
        return false;
      }
    }

    // Agency
    if (filters.agencyId && car.agencyId !== filters.agencyId) return false;

    // Body Type
    if (filters.bodyType && car.bodyType !== filters.bodyType) return false;

    // Condition
    if (filters.condition && car.condition !== filters.condition) return false;

    // Transmission
    if (filters.transmission && car.transmission !== filters.transmission) return false;

    // Fuel Type
    if (filters.fuelType && car.fuelType !== filters.fuelType) return false;

    // Quick Category
    if (selectedQuickCategory === 'pickup' && car.bodyType !== 'Pickup') return false;
    if (selectedQuickCategory === 'suv' && car.bodyType !== 'SUV') return false;
    if (selectedQuickCategory === '0km' && car.condition !== '0km') return false;
    if (selectedQuickCategory === 'financing' && !car.financingAvailable) return false;
    if (selectedQuickCategory === 'trade_in' && !car.acceptsTradeIn) return false;

    // Min / Max Price
    if (filters.minPrice && car.price < filters.minPrice) return false;
    if (filters.maxPrice && car.price > filters.maxPrice) return false;

    // Min / Max Year
    if (filters.minYear && car.year < filters.minYear) return false;
    if (filters.maxYear && car.year > filters.maxYear) return false;

    // Min / Max Mileage (Kilometraje)
    if (filters.minMileage !== '' && filters.minMileage !== undefined && car.mileage < Number(filters.minMileage)) return false;
    if (filters.maxMileage !== '' && filters.maxMileage !== undefined && car.mileage > Number(filters.maxMileage)) return false;

    // Featured only
    if (filters.onlyFeatured && !car.isFeatured) return false;

    // Features
    if (filters.acceptsTradeIn && !car.acceptsTradeIn) return false;
    if (filters.financingAvailable && !car.financingAvailable) return false;

    return true;
  });

  // Sort
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (filters.sortBy === 'featured') {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (filters.sortBy === 'price_asc') return a.price - b.price;
    if (filters.sortBy === 'price_desc') return b.price - a.price;
    if (filters.sortBy === 'year_desc') return b.year - a.year;
    if (filters.sortBy === 'mileage_asc') return a.mileage - b.mileage;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Distinct makes and models coordinating canonical dictionary with catalog
  const allMakes = getAllBrands(carListings);
  
  // Available models dynamically coordinated with selected brand
  const availableModels = getModelsForBrand(filters.make, carListings);

  const bodyTypes: BodyType[] = ['SUV', 'Pickup', 'Sedán', 'Hatchback', 'Coupé', 'Monovolumen', 'Furgón / Utilitario'];

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.make ||
    filters.model ||
    filters.agencyId ||
    filters.bodyType ||
    filters.condition ||
    filters.transmission ||
    filters.fuelType ||
    filters.minYear ||
    filters.maxYear ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.acceptsTradeIn ||
    filters.financingAvailable ||
    selectedQuickCategory !== 'all'
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Showcase Banner in Light Mode with Subtle Car Background Image */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-sky-400/20 p-6 sm:p-8 lg:p-10 shadow-2xl text-white">
        {/* Background Sports Car Image (Crisp, striking, and prominent with celeste/cyan highlights) */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600&auto=format&fit=crop&q=85"
            alt="Fondo automóvil deportivo MiCarro"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-right-bottom sm:object-right opacity-60 scale-100 filter brightness-105 contrast-110 saturate-125 transition-opacity duration-700"
          />
          {/* Subtle directional gradients for supreme legibility while keeping the car vividly visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 sm:via-slate-950/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-sky-950/40"></div>
        </div>

        {/* Ambient celeste & cyan glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none -mt-20 z-0"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none z-0"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-bold backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Red Oficial de Concesionarias & Vehículos Garantizados</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              Encontrá tu próximo auto con <span className="text-amber-300">trato directo</span>
            </h1>
            <p className="text-sm sm:text-base text-sky-100/90 leading-relaxed drop-shadow-sm max-w-xl">
              Explorá el catálogo de agencias verificadas, compará especificaciones, consultá al instante por <strong className="text-emerald-300">WhatsApp</strong> con el vendedor y cotizá tu permuta o financiación.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={handleSellCar}
                className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/25 flex items-center gap-2 transition-transform active:scale-98 cursor-pointer"
              >
                <span>Vender o Entregar Mi Auto en Agencia</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
              <button
                onClick={handleAgencyPanel}
                className="px-5 py-3 rounded-xl bg-sky-950/60 hover:bg-sky-900/80 text-white font-bold text-xs sm:text-sm border border-sky-300/30 flex items-center gap-2 backdrop-blur-md transition-colors shadow-md cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-sky-300" />
                <span>Portal para Vendedores y Agencias</span>
              </button>
            </div>

            {/* Interactive Car Brands Strip inside Hero */}
            <div className="pt-3 border-t border-sky-400/20">
              <CarBrandStrip
                selectedBrand={filters.make || ''}
                onSelectBrand={(brandName) =>
                  setFilters((prev) => ({
                    ...prev,
                    make: brandName,
                    model: '', // Reset model on make change
                  }))
                }
                title="Buscar por marca oficial:"
                theme="dark"
              />
            </div>
          </div>

          {/* Right-side Official MiCarro Verified Network Showcase Card */}
          <div className="hidden lg:flex flex-col items-center justify-center shrink-0 self-center">
            <div className="relative group">
              {/* Outer decorative halo glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/40 via-sky-400/30 to-amber-400/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-90 transition duration-700 pointer-events-none"></div>
              
              <div className="relative w-64 bg-slate-900/80 backdrop-blur-md border border-sky-400/30 rounded-3xl p-5 shadow-2xl space-y-4">
                {/* Header with Emblem */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <BrandLogo size="md" className="shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-white tracking-tight">MiCarro</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">OFICIAL</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Red Multiconcesionaria</p>
                  </div>
                </div>

                {/* Key Pillars */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-200">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-[11px]">Agencias 100% Verificadas</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-200">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-[11px]">Contacto Directo WhatsApp</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-200">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-[11px]">0km y Usados Garantizados</span>
                  </div>
                </div>

                {/* Footer Pill */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-sky-300/90 font-mono">
                  <span>Trato transparente</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    En Línea
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning / Limit Toast Notification */}
      {compareLimitWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg bg-amber-500 text-slate-950 px-4 py-3 rounded-2xl shadow-xl border border-amber-400 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <GitCompare className="w-5 h-5 shrink-0" />
            <p className="text-xs font-bold leading-tight">{compareLimitWarning}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setCompareLimitWarning(null);
                setIsCompareModalOpen(true);
              }}
              className="px-3 py-1 rounded-xl bg-slate-950 text-white text-xs font-black hover:bg-slate-900 transition-colors"
            >
              Abrir
            </button>
            <button
              onClick={() => setCompareLimitWarning(null)}
              className="p-1 rounded-lg hover:bg-amber-600/30 text-slate-950 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Advanced Search & Filtering Component */}
      <AdvancedCarSearchFilter
        totalCount={carListings.length}
        filteredCount={sortedListings.length}
        onResetAll={() => {
          resetFilters();
          setSelectedQuickCategory('all');
        }}
      />

      {/* Quick Category Fast-Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { id: 'all', label: '🚗 Todos los Autos' },
          { id: 'pickup', label: '🛻 Pickups 4x4 / Utilitarios' },
          { id: 'suv', label: '🚙 SUVs & Crossovers' },
          { id: '0km', label: '✨ 0 KM Entrega Inmediata' },
          { id: 'financing', label: '💳 Con Financiación' },
          { id: 'trade_in', label: '🔄 Acepta Permuta' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedQuickCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap font-medium transition-all text-xs flex items-center gap-1.5 ${
              selectedQuickCategory === cat.id
                ? 'bg-blue-700 text-white font-bold shadow-sm ring-2 ring-blue-700/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <p>
          Mostrando <strong className="text-slate-900 font-bold">{sortedListings.length}</strong> vehículos disponibles
        </p>
        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Stock verificado en tiempo real</span>
        </div>
      </div>

      {/* Car Grid Showcase */}
      {sortedListings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto text-blue-700">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No se encontraron autos con estos filtros</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            Probá ajustando los criterios de búsqueda o limpiando los filtros para ver todo el inventario disponible.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition-colors"
          >
            Ver Todos los Autos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedListings.map((car) => {
            const hasMultiplePhotos = car.photos && car.photos.length > 1;
            const coverPhoto = car.photos[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800';

            return (
              <div
                key={car.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col group"
              >
                {/* Photo Header */}
                <div
                  className="relative h-52 bg-slate-100 overflow-hidden cursor-pointer"
                  onClick={() => handleSelectCar(car)}
                >
                  <img
                    src={coverPhoto}
                    alt={car.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Photo Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    {car.isFeatured && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] tracking-wide flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3" />
                        DESTACADO
                      </span>
                    )}
                    {car.condition === '0km' && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] shadow-sm">
                        0 KM
                      </span>
                    )}
                    {car.condition === 'Certificado' && (
                      <span className="px-2 py-0.5 rounded-lg bg-blue-700 text-white font-bold text-[10px] shadow-sm flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        CERTIFICADO
                      </span>
                    )}
                    {car.status === 'reserved' && (
                      <span className="px-2 py-0.5 rounded-lg bg-purple-600 text-white font-bold text-[10px] shadow-sm">
                        RESERVADO
                      </span>
                    )}
                  </div>

                  {/* Quick Compare Button on Card Photo */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCompare(car.id);
                    }}
                    className={`absolute top-3 right-3 z-10 py-1.5 px-2.5 rounded-xl backdrop-blur-md transition-all shadow-md flex items-center gap-1.5 text-[11px] font-bold ${
                      comparedCarIds.includes(car.id)
                        ? 'bg-blue-600 text-white ring-2 ring-white shadow-blue-600/40'
                        : 'bg-slate-950/75 hover:bg-slate-950 text-white hover:text-sky-300'
                    }`}
                    title={comparedCarIds.includes(car.id) ? 'Quitar de la comparativa' : 'Comparar con otros vehículos (hasta 3)'}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>
                      {comparedCarIds.includes(car.id)
                        ? `✓ Comparando (${comparedCarIds.indexOf(car.id) + 1}/3)`
                        : 'Comparar'}
                    </span>
                  </button>

                  {/* Multi-Photo Indicator */}
                  {hasMultiplePhotos && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-mono font-medium flex items-center gap-1">
                      <span>📸 {car.photos.length} fotos</span>
                    </div>
                  )}

                  {/* Agency Tag */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm border border-slate-200 text-slate-900 text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                    <Building2 className="w-3 h-3 text-blue-700" />
                    <span className="truncate max-w-[150px]">{car.agencyName}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Title & Version */}
                    <h3
                      onClick={() => handleSelectCar(car)}
                      className="font-bold text-base text-slate-900 hover:text-blue-700 transition-colors cursor-pointer line-clamp-1"
                    >
                      {car.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">
                      {car.version || `${car.make} ${car.model}`}
                    </p>

                    {/* Key Specs Pills */}
                    <div className="grid grid-cols-3 gap-2 mt-3 p-2 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Año</span>
                        <span className="font-bold text-slate-800 font-mono">{car.year}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Kilómetros</span>
                        <span className="font-bold text-slate-800 font-mono">{car.mileage.toLocaleString('es-ES')} km</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Caja</span>
                        <span className="font-bold text-slate-800 truncate block">{car.transmission}</span>
                      </div>
                    </div>

                    {/* Features tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {car.acceptsTradeIn && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5 text-amber-600" />
                          Permuta
                        </span>
                      )}
                      {car.financingAvailable && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                          <CreditCard className="w-2.5 h-2.5 text-emerald-600" />
                          Financia
                        </span>
                      )}
                      {car.fuelType && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium">
                          {car.fuelType}
                        </span>
                      )}
                    </div>

                    {/* Inline Compare Toggle Row */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCompare(car.id);
                        }}
                        className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                          comparedCarIds.includes(car.id)
                            ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <GitCompare className={`w-3.5 h-3.5 ${comparedCarIds.includes(car.id) ? 'text-blue-700' : 'text-slate-400'}`} />
                        <span>
                          {comparedCarIds.includes(car.id)
                            ? 'En Comparativa Técnica'
                            : 'Comparar con otros autos'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Price and Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Precio Contado</span>
                        <span className="text-xl font-black text-slate-900 tracking-tight">
                          {formatPrice(car.price, car.currency)}
                        </span>
                      </div>
                      {car.financingAvailable && (
                        <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          Cuotas fijas
                        </span>
                      )}
                    </div>

                    {/* Action Buttons: WhatsApp, PDF Quote & View Details */}
                    <div className="grid grid-cols-12 gap-1.5">
                      <button
                        onClick={() => handleSelectCar(car)}
                        className="col-span-5 py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors border border-slate-200"
                        title="Ver ficha técnica completa"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ficha</span>
                      </button>

                      <button
                        onClick={() => {
                          setQuoteCar(car);
                          setIsQuoteModalOpen(true);
                        }}
                        className="col-span-3 py-2.5 px-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors border border-blue-200"
                        title="Generar Cotización Proforma en PDF"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => openWhatsappForCar(car)}
                        className="col-span-4 py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-transform active:scale-98"
                        title="Chatear por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Comparison Dock (when cars are selected) */}
      {comparedCarIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-slate-950/95 text-white border border-blue-500/30 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-blue-600/30">
              <GitCompare className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-white">Comparador de Autos</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold font-mono border border-blue-400/30">
                  {comparedCarIds.length} / 3
                </span>
              </div>

              {/* Selected Vehicles Mini Previews */}
              <div className="flex items-center gap-2 mt-1.5 overflow-x-auto no-scrollbar py-0.5">
                {comparedCarIds.map((id) => {
                  const car = carListings.find((c) => c.id === id);
                  if (!car) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg pl-1 pr-2 py-0.5 shrink-0"
                    >
                      <img
                        src={car.photos[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=100'}
                        alt={car.title}
                        className="w-5 h-5 rounded object-cover"
                      />
                      <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[90px]">
                        {car.make} {car.model}
                      </span>
                      <button
                        onClick={() => handleToggleCompare(id)}
                        className="text-slate-400 hover:text-rose-400 p-0.5 rounded"
                        title="Quitar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              <span>Ver Comparativa ({comparedCarIds.length}/3)</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
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
    </div>
  );
};
