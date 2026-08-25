import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CarListing, BodyType, CarCondition, CurrencyCode } from '../types';
import { getAllBrands, getModelsForBrand } from '../data/carBrandsData';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Calendar,
  DollarSign,
  Gauge,
  Car,
  Fuel,
  ShieldCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Check,
  Zap,
  CreditCard,
  RefreshCw,
  Sliders,
  Filter,
} from 'lucide-react';

interface AdvancedCarSearchFilterProps {
  onApplyFilters?: () => void;
  className?: string;
  isCompact?: boolean;
}

export const AdvancedCarSearchFilter: React.FC<AdvancedCarSearchFilterProps> = ({
  onApplyFilters,
  className = '',
  isCompact = false,
}) => {
  const {
    carListings,
    agencies,
    filters,
    setFilters,
    resetFilters,
    formatPrice,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(!isCompact);
  const [activeTab, setActiveTab] = useState<'main' | 'technical' | 'financial'>('main');

  // Calculate distinct counts per brand and model in current inventory
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    carListings.forEach((car) => {
      const b = car.make.trim();
      counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [carListings]);

  const allMakes = useMemo(() => getAllBrands(carListings), [carListings]);

  const availableModels = useMemo(
    () => getModelsForBrand(filters.make, carListings),
    [filters.make, carListings]
  );

  const modelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    carListings.forEach((car) => {
      if (!filters.make || car.make.toLowerCase() === filters.make.toLowerCase()) {
        const m = car.model.trim();
        counts[m] = (counts[m] || 0) + 1;
      }
    });
    return counts;
  }, [carListings, filters.make]);

  // Year range extremes
  const currentYear = new Date().getFullYear();
  const yearYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear + 1; y >= 2005; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Real-time matching count calculation based on current filter state
  const matchingCount = useMemo(() => {
    return carListings.filter((car) => {
      // Search text
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchTitle = car.title.toLowerCase().includes(q);
        const matchMake = car.make.toLowerCase().includes(q);
        const matchModel = car.model.toLowerCase().includes(q);
        const matchAgency = car.agencyName.toLowerCase().includes(q);
        if (!matchTitle && !matchMake && !matchModel && !matchAgency) return false;
      }

      // Make
      if (filters.make && car.make.trim().toLowerCase() !== filters.make.trim().toLowerCase()) {
        return false;
      }

      // Model
      if (filters.model) {
        const carMod = car.model.trim().toLowerCase();
        const filterMod = filters.model.trim().toLowerCase();
        if (carMod !== filterMod && !carMod.includes(filterMod) && !filterMod.includes(carMod)) {
          return false;
        }
      }

      // Year Range
      if (filters.minYear && car.year < Number(filters.minYear)) return false;
      if (filters.maxYear && car.year > Number(filters.maxYear)) return false;

      // Price Range
      if (filters.minPrice && car.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && car.price > Number(filters.maxPrice)) return false;

      // Mileage Range
      if (filters.minMileage !== '' && filters.minMileage !== undefined && car.mileage < Number(filters.minMileage)) return false;
      if (filters.maxMileage !== '' && filters.maxMileage !== undefined && car.mileage > Number(filters.maxMileage)) return false;

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

      // Financing
      if (filters.onlyFinancing && !car.financingAvailable) return false;
      if (filters.financingAvailable && !car.financingAvailable) return false;

      // Trade-In
      if (filters.onlyTradeIn && !car.acceptsTradeIn) return false;
      if (filters.acceptsTradeIn && !car.acceptsTradeIn) return false;

      // Featured
      if (filters.onlyFeatured && !car.isFeatured) return false;

      return true;
    }).length;
  }, [carListings, filters]);

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.make) count++;
    if (filters.model) count++;
    if (filters.agencyId) count++;
    if (filters.minYear) count++;
    if (filters.maxYear) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.minMileage !== '' && filters.minMileage !== undefined) count++;
    if (filters.maxMileage !== '' && filters.maxMileage !== undefined) count++;
    if (filters.bodyType) count++;
    if (filters.condition) count++;
    if (filters.transmission) count++;
    if (filters.fuelType) count++;
    if (filters.financingAvailable || filters.onlyFinancing) count++;
    if (filters.acceptsTradeIn || filters.onlyTradeIn) count++;
    if (filters.onlyFeatured) count++;
    return count;
  }, [filters]);

  const hasFilters = activeFiltersCount > 0;

  // Price preset handler
  const setPriceRange = (min: number | '', max: number | '') => {
    setFilters((prev) => ({
      ...prev,
      minPrice: min,
      maxPrice: max,
    }));
  };

  // Year preset handler
  const setYearRange = (min: number | '', max: number | '') => {
    setFilters((prev) => ({
      ...prev,
      minYear: min,
      maxYear: max,
    }));
  };

  // Mileage preset handler
  const setMileageRange = (min: number | '', max: number | '') => {
    setFilters((prev) => ({
      ...prev,
      minMileage: min,
      maxMileage: max,
    }));
  };

  const bodyTypes: BodyType[] = [
    'SUV',
    'Pickup',
    'Sedán',
    'Hatchback',
    'Coupé',
    'Monovolumen',
    'Furgón / Utilitario',
  ];

  return (
    <div
      id="advanced-car-search-panel"
      className={`bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-sm transition-all overflow-hidden ${className}`}
    >
      {/* Header & Quick Search Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/30 text-blue-300 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Búsqueda Avanzada de Vehículos
                </h3>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                    {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro activo' : 'filtros activos'}
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-200/80">
                Filtrá por marca, año, precio, kilometraje y condiciones comerciales
              </p>
            </div>
          </div>

          {/* Quick controls: Matching count badge + Expand toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-sky-100 flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                <strong className="text-white font-bold">{matchingCount}</strong> disponibles
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isExpanded ? 'Contraer' : 'Expandir Filtros'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Primary Input Bar (Keyword + Brand + Model + Price Quick) */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5">
          {/* Keyword Search */}
          <div className="sm:col-span-2 md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por marca, modelo, versión o palabra clave..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-sky-400 focus:bg-slate-800 transition-colors"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters({ ...filters, search: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Make (Marca) Select */}
          <div className="sm:col-span-1 md:col-span-3">
            <select
              value={filters.make || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  make: e.target.value,
                  model: '', // Reset model on make change
                })
              }
              className={`w-full py-2.5 px-3 rounded-xl border text-xs sm:text-sm focus:outline-none focus:border-sky-400 font-medium transition-colors ${
                filters.make
                  ? 'bg-blue-600 text-white border-blue-400 font-bold'
                  : 'bg-slate-800/90 border-slate-700 text-slate-200'
              }`}
            >
              <option value="" className="bg-slate-900 text-white">
                🏢 Todas las Marcas ({allMakes.length})
              </option>
              {allMakes.map((make) => {
                const count = brandCounts[make] || 0;
                return (
                  <option key={make} value={make} className="bg-slate-900 text-white">
                    {make} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Model Select */}
          <div className="sm:col-span-1 md:col-span-2">
            <select
              value={filters.model || ''}
              onChange={(e) => setFilters({ ...filters, model: e.target.value })}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs sm:text-sm focus:outline-none focus:border-sky-400 font-medium transition-colors ${
                filters.model
                  ? 'bg-blue-600 text-white border-blue-400 font-bold'
                  : 'bg-slate-800/90 border-slate-700 text-slate-200'
              }`}
            >
              <option value="" className="bg-slate-900 text-white">
                {filters.make ? `🚗 Modelos de ${filters.make}` : '🚗 Todos los Modelos'}
              </option>
              {availableModels.map((model) => {
                const count = modelCounts[model] || 0;
                return (
                  <option key={model} value={model} className="bg-slate-900 text-white">
                    {model} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-2 md:col-span-2">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-sky-400 font-medium"
            >
              <option value="featured" className="bg-slate-900 text-white">⭐ Destacados</option>
              <option value="price_asc" className="bg-slate-900 text-white">💵 Menor Precio</option>
              <option value="price_desc" className="bg-slate-900 text-white">💎 Mayor Precio</option>
              <option value="year_desc" className="bg-slate-900 text-white">📅 Más Nuevos</option>
              <option value="mileage_asc" className="bg-slate-900 text-white">⚡ Menor Kilometraje</option>
              <option value="recent" className="bg-slate-900 text-white">🕒 Recientes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6 bg-slate-50/50 border-t border-slate-200 animate-fadeIn">
          {/* Filter Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('main')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'main'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Año, Precio & Kilometraje</span>
              {(filters.minYear || filters.maxYear || filters.minPrice || filters.maxPrice || filters.minMileage !== '' || filters.maxMileage !== '') && (
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('technical')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'technical'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Carrocería, Motor & Transmisión</span>
              {(filters.bodyType || filters.condition || filters.transmission || filters.fuelType) && (
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('financial')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'financial'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Financiación, Permuta & Agencia</span>
              {(filters.agencyId || filters.financingAvailable || filters.acceptsTradeIn || filters.onlyFeatured) && (
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </button>
          </div>

          {/* TAB 1: AÑO, PRECIO & KILOMETRAJE */}
          {activeTab === 'main' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. RANGO DE AÑOS */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        Rango de Año
                      </span>
                    </div>
                    {(filters.minYear || filters.maxYear) && (
                      <button
                        type="button"
                        onClick={() => setYearRange('', '')}
                        className="text-[11px] text-rose-600 font-semibold hover:underline"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {/* Min / Max Year Selectors */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Desde (Mín)
                      </label>
                      <select
                        value={filters.minYear}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            minYear: e.target.value ? Number(e.target.value) : '',
                          })
                        }
                        className="w-full py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                      >
                        <option value="">Cualquier año</option>
                        {yearYears.map((yr) => (
                          <option key={`min-yr-${yr}`} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Hasta (Máx)
                      </label>
                      <select
                        value={filters.maxYear}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            maxYear: e.target.value ? Number(e.target.value) : '',
                          })
                        }
                        className="w-full py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                      >
                        <option value="">Cualquier año</option>
                        {yearYears.map((yr) => (
                          <option key={`max-yr-${yr}`} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick Year Range Presets */}
                  <div className="pt-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1.5">
                      Filtros rápidos de año:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '0 KM / 2024-2026', min: 2024, max: 2026 },
                        { label: '2020 a 2023', min: 2020, max: 2023 },
                        { label: '2015 a 2019', min: 2015, max: 2019 },
                        { label: 'Hasta 2015', min: '', max: 2015 },
                      ].map((preset, idx) => {
                        const isSelected =
                          filters.minYear === preset.min && filters.maxYear === preset.max;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              isSelected
                                ? setYearRange('', '')
                                : setYearRange(preset.min as any, preset.max as any)
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-700 text-white font-bold'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. RANGO DE PRECIO */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        Rango de Precio (USD)
                      </span>
                    </div>
                    {(filters.minPrice || filters.maxPrice) && (
                      <button
                        type="button"
                        onClick={() => setPriceRange('', '')}
                        className="text-[11px] text-rose-600 font-semibold hover:underline"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {/* Min / Max Price Inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Mínimo ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="1000"
                          value={filters.minPrice}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              minPrice: e.target.value ? Number(e.target.value) : '',
                            })
                          }
                          className="w-full pl-6 pr-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Máximo ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="Sin límite"
                          min="0"
                          step="1000"
                          value={filters.maxPrice}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              maxPrice: e.target.value ? Number(e.target.value) : '',
                            })
                          }
                          className="w-full pl-6 pr-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Price Range Presets */}
                  <div className="pt-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1.5">
                      Rangos populares:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Menos de $15k', min: '', max: 15000 },
                        { label: '$15k a $25k', min: 15000, max: 25000 },
                        { label: '$25k a $40k', min: 25000, max: 40000 },
                        { label: '+$40k', min: 40000, max: '' },
                      ].map((preset, idx) => {
                        const isSelected =
                          filters.minPrice === preset.min && filters.maxPrice === preset.max;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              isSelected
                                ? setPriceRange('', '')
                                : setPriceRange(preset.min as any, preset.max as any)
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-700 text-white font-bold'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. RANGO DE KILOMETRAJE */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                        <Gauge className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        Kilometraje (KM)
                      </span>
                    </div>
                    {(filters.minMileage !== '' || filters.maxMileage !== '') && (
                      <button
                        type="button"
                        onClick={() => setMileageRange('', '')}
                        className="text-[11px] text-rose-600 font-semibold hover:underline"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {/* Min / Max Mileage Inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Desde (km)
                      </label>
                      <input
                        type="number"
                        placeholder="0 km"
                        min="0"
                        step="5000"
                        value={filters.minMileage ?? ''}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            minMileage: e.target.value ? Number(e.target.value) : '',
                          })
                        }
                        className="w-full py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Hasta (km)
                      </label>
                      <input
                        type="number"
                        placeholder="Sin tope"
                        min="0"
                        step="5000"
                        value={filters.maxMileage ?? ''}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            maxMileage: e.target.value ? Number(e.target.value) : '',
                          })
                        }
                        className="w-full py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Quick Mileage Range Presets */}
                  <div className="pt-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1.5">
                      Opciones por kilometraje:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '0 KM (Nuevo)', min: 0, max: 100 },
                        { label: 'Hasta 30.000 km', min: '', max: 30000 },
                        { label: 'Hasta 60.000 km', min: '', max: 60000 },
                        { label: 'Hasta 100.000 km', min: '', max: 100000 },
                        { label: '+100.000 km', min: 100000, max: '' },
                      ].map((preset, idx) => {
                        const isSelected =
                          filters.minMileage === preset.min && filters.maxMileage === preset.max;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              isSelected
                                ? setMileageRange('', '')
                                : setMileageRange(preset.min as any, preset.max as any)
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CARROCERÍA, MOTOR & TRANSMISIÓN */}
          {activeTab === 'technical' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
              {/* Carrocería */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
                <label className="block text-xs font-bold text-slate-800">
                  Tipo de Carrocería
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, bodyType: '' })}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                      !filters.bodyType
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>Todas las Carrocerías</span>
                    {!filters.bodyType && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {bodyTypes.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setFilters({ ...filters, bodyType: b })}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                        filters.bodyType === b
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{b}</span>
                      {filters.bodyType === b && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condición */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
                <label className="block text-xs font-bold text-slate-800">
                  Estado / Condición
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: '', label: 'Cualquier Estado' },
                    { id: '0km', label: '0 KM (A Estrenar)' },
                    { id: 'Usado', label: 'Usado Seleccionado' },
                    { id: 'Certificado', label: 'Certificado con Garantía' },
                  ].map((cond) => (
                    <button
                      key={cond.id}
                      type="button"
                      onClick={() => setFilters({ ...filters, condition: cond.id as any })}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                        filters.condition === cond.id
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{cond.label}</span>
                      {filters.condition === cond.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transmisión */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
                <label className="block text-xs font-bold text-slate-800">
                  Caja de Cambios
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: '', label: 'Todas las transmisiones' },
                    { id: 'Automática', label: 'Automática / Secuencial' },
                    { id: 'Manual', label: 'Manual' },
                  ].map((trans) => (
                    <button
                      key={trans.id}
                      type="button"
                      onClick={() => setFilters({ ...filters, transmission: trans.id as any })}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                        filters.transmission === trans.id
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{trans.label}</span>
                      {filters.transmission === trans.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Combustible */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
                <label className="block text-xs font-bold text-slate-800">
                  Combustible / Motorización
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: '', label: 'Todos los combustibles' },
                    { id: 'Nafta/Gasolina', label: 'Nafta / Gasolina' },
                    { id: 'Diésel', label: 'Diésel' },
                    { id: 'Híbrido', label: 'Híbrido (HEV/PHEV)' },
                    { id: 'Eléctrico', label: '100% Eléctrico (EV)' },
                    { id: 'Flex', label: 'Flex' },
                  ].map((fuel) => (
                    <button
                      key={fuel.id}
                      type="button"
                      onClick={() => setFilters({ ...filters, fuelType: fuel.id as any })}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                        filters.fuelType === fuel.id
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{fuel.label}</span>
                      {filters.fuelType === fuel.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIACIÓN, PERMUTA & AGENCIA */}
          {activeTab === 'financial' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              {/* Concesionaria / Agencia */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Concesionaria Oficial
                  </span>
                </div>
                <select
                  value={filters.agencyId}
                  onChange={(e) => setFilters({ ...filters, agencyId: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-600"
                >
                  <option value="">Todas las Agencias ({agencies.length})</option>
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name} ({agency.city})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Todas las agencias cuentan con WhatsApp de contacto directo y atención comercial personalizada.
                </p>
              </div>

              {/* Facilidades y Condiciones Especiales */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <span className="block font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Beneficios Comerciales
                </span>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80">
                    <input
                      type="checkbox"
                      checked={Boolean(filters.financingAvailable)}
                      onChange={(e) =>
                        setFilters({ ...filters, financingAvailable: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Con Financiación Disponible</span>
                      <span className="text-[11px] text-slate-500">
                        Planes en cuotas fijas, créditos prendarios o financiación de la casa.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80">
                    <input
                      type="checkbox"
                      checked={Boolean(filters.acceptsTradeIn)}
                      onChange={(e) =>
                        setFilters({ ...filters, acceptsTradeIn: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Acepta Permuta / Usado</span>
                      <span className="text-[11px] text-slate-500">
                        Posibilidad de entregar tu vehículo actual en parte de pago.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80">
                    <input
                      type="checkbox"
                      checked={Boolean(filters.onlyFeatured)}
                      onChange={(e) =>
                        setFilters({ ...filters, onlyFeatured: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Solo Vehículos Destacados</span>
                      <span className="text-[11px] text-slate-500">
                        Unidades con precios de oferta especial y máxima prioridad.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Action Bar inside Expanded Drawer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Todo</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (onApplyFilters) onApplyFilters();
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-700/20 flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
            >
              <span>Ver {matchingCount} Vehículos Encontrados</span>
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* Active Filter Chips Bar */}
      {hasFilters && (
        <div className="px-4 py-3 bg-slate-100/80 border-t border-slate-200 flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-500 font-semibold mr-1">Filtros activos:</span>

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-bold">
              Texto: "{filters.search}"
              <button
                type="button"
                onClick={() => setFilters({ ...filters, search: '' })}
                className="hover:text-blue-950 ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.make && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-bold">
              Marca: {filters.make}
              <button
                type="button"
                onClick={() => setFilters({ ...filters, make: '', model: '' })}
                className="hover:text-blue-950 ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.model && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-bold">
              Modelo: {filters.model}
              <button
                type="button"
                onClick={() => setFilters({ ...filters, model: '' })}
                className="hover:text-blue-950 ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(filters.minYear || filters.maxYear) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-bold">
              Año: {filters.minYear || 'Min'} - {filters.maxYear || 'Máx'}
              <button
                type="button"
                onClick={() => setYearRange('', '')}
                className="hover:text-indigo-950 ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(filters.minPrice || filters.maxPrice) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold">
              Precio: {filters.minPrice ? `$${filters.minPrice.toLocaleString()}` : '$0'} -{' '}
              {filters.maxPrice ? `$${filters.maxPrice.toLocaleString()}` : 'Sin tope'}
              <button
                type="button"
                onClick={() => setPriceRange('', '')}
                className="hover:text-emerald-950 ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(filters.minMileage !== '' || filters.maxMileage !== '') && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 font-bold">
              Km: {filters.minMileage !== '' ? `${Number(filters.minMileage).toLocaleString()} km` : '0 km'} -{' '}
              {filters.maxMileage !== '' ? `${Number(filters.maxMileage).toLocaleString()} km` : 'Sin límite'}
              <button
                type="button"
                onClick={() => setMileageRange('', '')}
                className="hover:text-amber-950 ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.bodyType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 font-bold">
              {filters.bodyType}
              <button
                type="button"
                onClick={() => setFilters({ ...filters, bodyType: '' })}
                className="hover:text-purple-950 ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.condition && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 font-bold">
              {filters.condition}
              <button
                type="button"
                onClick={() => setFilters({ ...filters, condition: '' })}
                className="hover:text-sky-950 ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.transmission && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-900 font-bold">
              {filters.transmission}
              <button
                type="button"
                onClick={() => setFilters({ ...filters, transmission: '' })}
                className="hover:text-slate-950 ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.fuelType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold">
              {filters.fuelType}
              <button
                type="button"
                onClick={() => setFilters({ ...filters, fuelType: '' })}
                className="hover:text-amber-950 ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.agencyId && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-900 font-semibold">
              Agencia: {agencies.find((a) => a.id === filters.agencyId)?.name || filters.agencyId}
              <button
                type="button"
                onClick={() => setFilters({ ...filters, agencyId: '' })}
                className="hover:text-slate-950 ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.financingAvailable && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold">
              Financiación
              <button
                type="button"
                onClick={() => setFilters({ ...filters, financingAvailable: false })}
                className="hover:text-emerald-950 ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.acceptsTradeIn && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 font-bold">
              Permuta
              <button
                type="button"
                onClick={() => setFilters({ ...filters, acceptsTradeIn: false })}
                className="hover:text-sky-950 ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={resetFilters}
            className="text-slate-500 hover:text-rose-600 underline font-bold ml-2 cursor-pointer"
          >
            Borrar todos
          </button>
        </div>
      )}
    </div>
  );
};
