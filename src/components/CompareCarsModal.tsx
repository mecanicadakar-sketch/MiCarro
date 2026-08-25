import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CarListing } from '../types';
import {
  X,
  Car,
  Check,
  Fuel,
  Gauge,
  Calendar,
  DollarSign,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Trash2,
  GitCompare,
  Plus,
  Zap,
  Printer,
  ChevronDown,
  Info,
} from 'lucide-react';

interface CompareCarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCar?: (car: any) => void;
}

export const CompareCarsModal: React.FC<CompareCarsModalProps> = ({
  isOpen,
  onClose,
  onSelectCar,
}) => {
  const {
    comparedCarIds,
    carListings,
    addCarToCompare,
    removeCarFromCompare,
    clearCompareCars,
    openWhatsappForCar,
    formatPrice,
  } = useApp();

  const [selectedAddCarId, setSelectedAddCarId] = useState<string>('');

  if (!isOpen) return null;

  const comparedCars = carListings.filter((c) => comparedCarIds.includes(c.id));
  const availableToAdd = carListings.filter((c) => !comparedCarIds.includes(c.id));

  // Determine best attributes for highlighting
  const minPrice = comparedCars.length > 1 ? Math.min(...comparedCars.map((c) => c.price)) : null;
  const maxYear = comparedCars.length > 1 ? Math.max(...comparedCars.map((c) => c.year)) : null;
  const minMileage = comparedCars.length > 1 ? Math.min(...comparedCars.map((c) => c.mileage)) : null;

  const handleAddCar = (carId: string) => {
    if (!carId) return;
    addCarToCompare(carId);
    setSelectedAddCarId('');
  };

  const handleConsultAllWhatsapp = () => {
    if (comparedCars.length === 0) return;
    const carsTitles = comparedCars.map((c) => `${c.title} (${c.currency} ${c.price.toLocaleString('es-ES')})`).join(' vs ');
    const text = `¡Hola! 👋 Estoy comparando estos vehículos en MiCarro:\n\n👉 *${carsTitles}*\n\n¿Podrían brindarme asesoramiento técnico y condiciones de financiación/permuta para decidir cuál se adapta mejor a mis necesidades?`;
    
    // Open with first agency phone or default
    openWhatsappForCar(comparedCars[0], text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-700/20 shrink-0">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Comparador de Especificaciones Técnicas
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
                  {comparedCars.length} / 3
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Análisis comparativo de prestaciones mecánicas, precios, kilometraje y condiciones comerciales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {comparedCars.length >= 2 && (
              <button
                onClick={handleConsultAllWhatsapp}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
                title="Consultar por todos estos autos por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span className="hidden sm:inline">Consultar Comparativa</span>
                <span className="sm:hidden">WhatsApp</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors hidden sm:flex items-center justify-center"
              title="Imprimir Comparativa"
            >
              <Printer className="w-4 h-4" />
            </button>

            {comparedCars.length > 0 && (
              <button
                onClick={clearCompareCars}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1"
                title="Vaciar comparativa"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          {comparedCars.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <GitCompare className="w-8 h-8 opacity-60" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No hay vehículos seleccionados para comparar</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Haz clic en el botón <strong className="text-blue-700">"Comparar"</strong> en las tarjetas de autos del catálogo para contrastar hasta 3 modelos simultáneos.
                </p>
              </div>

              {availableToAdd.length > 0 && (
                <div className="max-w-sm mx-auto pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    O selecciona directamente un auto para comenzar:
                  </label>
                  <select
                    onChange={(e) => handleAddCar(e.target.value)}
                    defaultValue=""
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:border-blue-600"
                  >
                    <option value="" disabled>Seleccionar un vehículo...</option>
                    {availableToAdd.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.year} {car.make} {car.model} - {car.currency} {car.price.toLocaleString('es-ES')} ({car.agencyName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold shadow hover:bg-blue-800 transition-colors"
                >
                  Explorar Catálogo de Autos
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                {/* Table Header: Photos & Quick Actions */}
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 w-44 min-w-36 font-bold text-slate-400 uppercase tracking-wider align-bottom">
                      Vehículo
                    </th>
                    {comparedCars.map((car) => {
                      const isLowestPrice = minPrice !== null && car.price === minPrice;
                      const isNewest = maxYear !== null && car.year === maxYear;
                      const isLowestMileage = minMileage !== null && car.mileage === minMileage;

                      return (
                        <th key={car.id} className="p-3 min-w-64 max-w-xs align-top">
                          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white group shadow-sm">
                            <div className="relative h-36 bg-slate-100">
                              <img
                                src={car.photos[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500'}
                                alt={car.title}
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => removeCarFromCompare(car.id)}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors shadow"
                                title="Quitar de la comparativa"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>

                              {/* Highlight Badges on Image */}
                              <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                                {isLowestPrice && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider shadow">
                                    💰 Menor Precio
                                  </span>
                                )}
                                {isNewest && (
                                  <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider shadow">
                                    ✨ Más Nuevo
                                  </span>
                                )}
                                {isLowestMileage && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow">
                                    ⚡ Menor Km
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-3.5 space-y-2 bg-white">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {car.agencyName}
                              </span>
                              <h4 className="font-black text-slate-900 text-sm leading-snug line-clamp-2">
                                {car.title}
                              </h4>
                              <div className="text-base font-black text-blue-700 font-mono">
                                {formatPrice(car.price, car.currency)}
                              </div>
                              <div className="pt-1 flex gap-2">
                                <button
                                  onClick={() => openWhatsappForCar(car)}
                                  className="flex-1 py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm transition-colors"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </button>
                                {onSelectCar && (
                                  <button
                                    onClick={() => {
                                      onSelectCar(car);
                                      onClose();
                                    }}
                                    className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                                  >
                                    Ver Ficha
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </th>
                      );
                    })}

                    {/* Empty Slots to complete 3 cars */}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, idx) => (
                      <th key={`empty-${idx}`} className="p-3 min-w-60 align-top">
                        <div className="h-64 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center p-4 text-center text-slate-500 space-y-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                            <Plus className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-700 block">Espacio Disponible ({comparedCars.length + idx + 1}/3)</span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">
                              Agrega otro auto para contrastar
                            </span>
                          </div>

                          {availableToAdd.length > 0 && (
                            <select
                              onChange={(e) => handleAddCar(e.target.value)}
                              defaultValue=""
                              className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                            >
                              <option value="" disabled>+ Seleccionar auto...</option>
                              {availableToAdd.map((car) => (
                                <option key={car.id} value={car.id}>
                                  {car.year} {car.make} {car.model} ({car.currency} {car.price.toLocaleString('es-ES')})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body: Specifications */}
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {/* Category: Principales */}
                  <tr className="bg-blue-50/70">
                    <td colSpan={4} className="p-2.5 font-black text-blue-900 uppercase tracking-wider text-[11px]">
                      1. Datos Principales
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Marca / Modelo</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="p-3 font-bold text-slate-900 text-xs">
                        {c.make} {c.model}
                      </td>
                    ))}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Versión / Acabado</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="p-3 font-medium text-slate-800">
                        {c.version || '-'}
                      </td>
                    ))}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Año de Fabricación</td>
                    {comparedCars.map((c) => {
                      const isNewest = maxYear !== null && c.year === maxYear;
                      return (
                        <td key={c.id} className="p-3 font-mono font-bold text-slate-900">
                          <span className={isNewest ? 'text-blue-700 font-black' : ''}>
                            {c.year}
                          </span>
                          {isNewest && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-sans font-bold">
                              Más Nuevo
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Kilometraje</td>
                    {comparedCars.map((c) => {
                      const isLowest = minMileage !== null && c.mileage === minMileage;
                      return (
                        <td key={c.id} className="p-3 font-mono font-semibold text-slate-800">
                          <span className={isLowest ? 'text-emerald-700 font-bold' : ''}>
                            {c.mileage === 0 ? '0 KM (A estrenar)' : `${c.mileage.toLocaleString('es-ES')} km`}
                          </span>
                          {isLowest && c.mileage > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-sans font-bold">
                              Menor Uso
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Condición</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="p-3">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          c.condition === '0km'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.condition === 'Certificado'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {c.condition}
                        </span>
                      </td>
                    ))}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Agencia / Concesionaria</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="p-3 font-medium text-slate-800">
                        {c.agencyName}
                      </td>
                    ))}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>

                  {/* Category: Mecánica & Motor */}
                  <tr className="bg-blue-50/70">
                    <td colSpan={4} className="p-2.5 font-black text-blue-900 uppercase tracking-wider text-[11px]">
                      2. Motorización & Prestaciones
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Motor / Cilindrada</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="p-3 font-semibold text-slate-800">
                        {c.engine || c.version || 'Consultar'}
                      </td>
                    ))}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Transmisión</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="p-3 font-semibold text-slate-800">
                        {c.transmission}
                      </td>
                    ))}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Combustible</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="p-3 font-semibold text-slate-800">
                        {c.fuelType}
                      </td>
                    ))}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Tracción</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="p-3 font-mono font-bold text-slate-800">
                        {c.traction || '4x2'}
                      </td>
                    ))}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Carrocería / Puertas</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="p-3 text-slate-800">
                        {c.bodyType} • {c.doors} puertas
                      </td>
                    ))}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>

                  {/* Category: Financiación & Permuta */}
                  <tr className="bg-blue-50/70">
                    <td colSpan={4} className="p-2.5 font-black text-blue-900 uppercase tracking-wider text-[11px]">
                      3. Condiciones Comerciales & Garantía
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Permuta (Toma Usados)</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="p-3">
                        {c.acceptsTradeIn ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Sí, acepta permuta
                          </span>
                        ) : (
                          <span className="text-slate-400">Sólo contado</span>
                        )}
                      </td>
                    ))}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Financiación en Cuotas</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="p-3">
                        {c.financingAvailable ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Disponible
                          </span>
                        ) : (
                          <span className="text-slate-400">No disponible</span>
                        )}
                      </td>
                    ))}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500">Garantía Mecánica</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="p-3 font-semibold text-blue-700">
                        {c.warrantyMonths ? `${c.warrantyMonths} meses oficial` : 'Consultar'}
                      </td>
                    ))}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>

                  {/* Category: Equipamiento Destacado */}
                  <tr className="bg-blue-50/70">
                    <td colSpan={4} className="p-2.5 font-black text-blue-900 uppercase tracking-wider text-[11px]">
                      4. Equipamiento & Confort
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-500 align-top">Equipamiento</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="p-3 align-top">
                        <ul className="space-y-1.5">
                          {c.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-slate-700 text-[11px]">
                              <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                    {Array.from({ length: 3 - comparedCars.length }).map((_, i) => (
                      <td key={i} className="p-3 text-slate-300">-</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
