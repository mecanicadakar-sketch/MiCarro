import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Check,
  X,
  Copy,
  Table,
  CheckSquare,
  Square,
  Sparkles,
  SlidersHorizontal,
  Info,
  Layers,
  ArrowDownToLine,
  FileText,
} from 'lucide-react';
import { CarListing, Agency } from '../types';
import {
  INVENTORY_EXPORT_COLUMNS,
  ExportColumnOption,
  generateInventoryCsvString,
  downloadInventoryCsv,
} from '../utils/exportInventoryUtils';

interface ExportInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAgencyCars: CarListing[];
  filteredCars: CarListing[];
  agency: Agency;
}

export const ExportInventoryModal: React.FC<ExportInventoryModalProps> = ({
  isOpen,
  onClose,
  allAgencyCars,
  filteredCars,
  agency,
}) => {
  // Scope of cars to export
  const [exportScope, setExportScope] = useState<'all' | 'filtered' | 'available_only'>('all');

  // CSV Delimiter
  const [delimiter, setDelimiter] = useState<';' | ',' | '\t'>(';');

  // Selected Columns
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(
    INVENTORY_EXPORT_COLUMNS.map((c) => c.key)
  );

  // UI States
  const [isCopied, setIsCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'basic' | 'technical' | 'commercial' | 'metrics_media'>('all');
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);

  // Compute cars list according to selected scope
  const targetCars = useMemo(() => {
    if (exportScope === 'filtered') {
      return filteredCars;
    }
    if (exportScope === 'available_only') {
      return allAgencyCars.filter((c) => c.status === 'available');
    }
    return allAgencyCars;
  }, [exportScope, allAgencyCars, filteredCars]);

  if (!isOpen) return null;

  // Toggle single column selection
  const handleToggleColumn = (key: string) => {
    setSelectedColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Select all columns
  const handleSelectAllColumns = () => {
    setSelectedColumnKeys(INVENTORY_EXPORT_COLUMNS.map((c) => c.key));
  };

  // Select essential columns preset
  const handleSelectEssentialColumns = () => {
    const essential = [
      'title',
      'make',
      'model',
      'version',
      'year',
      'mileage',
      'price',
      'currency',
      'status',
      'condition',
      'sellerName',
      'sellerWhatsapp',
    ];
    setSelectedColumnKeys(essential);
  };

  // Select technical preset
  const handleSelectTechnicalColumns = () => {
    const technical = [
      'title',
      'make',
      'model',
      'year',
      'engine',
      'transmission',
      'fuelType',
      'bodyType',
      'traction',
      'color',
      'doors',
      'plateEnding',
      'mileage',
      'price',
      'currency',
      'status',
    ];
    setSelectedColumnKeys(technical);
  };

  // Handle Download CSV
  const handleDownload = () => {
    if (targetCars.length === 0) return;
    downloadInventoryCsv(targetCars, {
      delimiter,
      selectedColumnKeys,
      agency,
    });
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 3000);
  };

  // Handle Copy CSV
  const handleCopyClipboard = () => {
    if (targetCars.length === 0) return;
    const csv = generateInventoryCsvString(targetCars, {
      delimiter,
      selectedColumnKeys,
      agency,
    });
    navigator.clipboard.writeText(csv);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Group columns by category
  const categorizedColumns = {
    basic: INVENTORY_EXPORT_COLUMNS.filter((c) => c.category === 'basic'),
    technical: INVENTORY_EXPORT_COLUMNS.filter((c) => c.category === 'technical'),
    commercial: INVENTORY_EXPORT_COLUMNS.filter((c) => c.category === 'commercial'),
    metrics_media: INVENTORY_EXPORT_COLUMNS.filter((c) => c.category === 'metrics_media'),
  };

  const displayedColumns =
    activeCategoryFilter === 'all'
      ? INVENTORY_EXPORT_COLUMNS
      : INVENTORY_EXPORT_COLUMNS.filter((c) => c.category === activeCategoryFilter);

  // Preview of the first 3 cars
  const previewCars = targetCars.slice(0, 3);
  const activeColumnDefs = INVENTORY_EXPORT_COLUMNS.filter((col) =>
    selectedColumnKeys.includes(col.key)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl my-4 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:px-6 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Exportación de Datos
                </span>
                <span className="text-xs text-sky-200 font-medium font-mono">
                  {agency.name}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                Exportar Inventario a CSV / Excel
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 flex-1">
          {/* Top Scope Cards Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-700" />
              <span>1. Selecciona qué vehículos exportar:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: All agency stock */}
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  exportScope === 'all'
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Todo el Salón</span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    exportScope === 'all' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  }`}>
                    {exportScope === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-blue-900 font-mono">
                    {allAgencyCars.length}
                  </span>
                  <span className="text-[11px] text-slate-500">vehículos totales</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Incluye disponibles, reservados, vendidos y borradores.
                </p>
              </button>

              {/* Option 2: Filtered view */}
              <button
                type="button"
                onClick={() => setExportScope('filtered')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  exportScope === 'filtered'
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Filtros Actuales</span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    exportScope === 'filtered' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  }`}>
                    {exportScope === 'filtered' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-blue-900 font-mono">
                    {filteredCars.length}
                  </span>
                  <span className="text-[11px] text-slate-500">según búsqueda</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Respeta la marca, modelo o estado que estás viendo en pantalla.
                </p>
              </button>

              {/* Option 3: Available Only */}
              <button
                type="button"
                onClick={() => setExportScope('available_only')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  exportScope === 'available_only'
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Solo Disponibles</span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    exportScope === 'available_only' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  }`}>
                    {exportScope === 'available_only' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-emerald-700 font-mono">
                    {allAgencyCars.filter((c) => c.status === 'available').length}
                  </span>
                  <span className="text-[11px] text-slate-500">listos para venta</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Ideal para enviar lista de stock a revendedores o clientes.
                </p>
              </button>
            </div>
          </div>

          {/* Delimiter & Compatibility Settings */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-700" />
                  <span>2. Formato y Delimitador de Columnas</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Optimizado con codificación UTF-8 BOM para acentos y tildes en Excel y Google Sheets.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDelimiter(';')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    delimiter === ';'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Punto y coma (;): Recomendado para Microsoft Excel en español"
                >
                  Excel Español ( ; )
                </button>
                <button
                  type="button"
                  onClick={() => setDelimiter(',')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    delimiter === ','
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Coma (,): Estándar internacional para Google Sheets, Notion y CRMs"
                >
                  Google Sheets / Int ( , )
                </button>
                <button
                  type="button"
                  onClick={() => setDelimiter('\t')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    delimiter === '\t'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tabuladores (TSV)"
                >
                  Tabulado (TSV)
                </button>
              </div>
            </div>
          </div>

          {/* Column Presets & Customizer */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-blue-700" />
                  <span>3. Columnas a exportar ({selectedColumnKeys.length} de {INVENTORY_EXPORT_COLUMNS.length} seleccionadas)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Elige una plantilla rápida o personaliza los campos que necesitas.
                </p>
              </div>

              {/* Presets buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleSelectAllColumns}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors"
                >
                  Todas ({INVENTORY_EXPORT_COLUMNS.length})
                </button>
                <button
                  type="button"
                  onClick={handleSelectEssentialColumns}
                  className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-bold transition-colors"
                >
                  Resumen Comercial (12)
                </button>
                <button
                  type="button"
                  onClick={handleSelectTechnicalColumns}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors"
                >
                  Ficha Técnica (16)
                </button>
                <button
                  type="button"
                  onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                    showColumnCustomizer
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>{showColumnCustomizer ? 'Ocultar Detalle' : 'Ajustar Campos'}</span>
                </button>
              </div>
            </div>

            {/* Expandable Column Selection Checkbox Grid */}
            {showColumnCustomizer && (
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 animate-fadeIn">
                {/* Category filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      activeCategoryFilter === 'all'
                        ? 'bg-blue-700 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Todos los Campos
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('basic')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      activeCategoryFilter === 'basic'
                        ? 'bg-blue-700 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Básicos ({categorizedColumns.basic.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('technical')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      activeCategoryFilter === 'technical'
                        ? 'bg-blue-700 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Técnicos ({categorizedColumns.technical.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('commercial')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      activeCategoryFilter === 'commercial'
                        ? 'bg-blue-700 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Comerciales ({categorizedColumns.commercial.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('metrics_media')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      activeCategoryFilter === 'metrics_media'
                        ? 'bg-blue-700 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Métricas & Fotos ({categorizedColumns.metrics_media.length})
                  </button>
                </div>

                {/* Checkboxes grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {displayedColumns.map((col) => {
                    const isChecked = selectedColumnKeys.includes(col.key);
                    return (
                      <button
                        type="button"
                        key={col.key}
                        onClick={() => handleToggleColumn(col.key)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs transition-colors border ${
                          isChecked
                            ? 'bg-white border-blue-500 text-slate-900 font-semibold shadow-2xs'
                            : 'bg-slate-100/80 border-transparent text-slate-500 hover:bg-white'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{col.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mini Live Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Vista Previa ({targetCars.length} registros listos para descargar)</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Mostrando primeras {Math.min(3, targetCars.length)} filas
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <div className="overflow-x-auto max-h-40">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold sticky top-0">
                    <tr>
                      {activeColumnDefs.slice(0, 8).map((col) => (
                        <th key={col.key} className="px-3 py-2 whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                      {activeColumnDefs.length > 8 && (
                        <th className="px-3 py-2 text-slate-400 italic">
                          +{activeColumnDefs.length - 8} cols más...
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                    {previewCars.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-slate-400">
                          No hay vehículos en esta selección para exportar.
                        </td>
                      </tr>
                    ) : (
                      previewCars.map((car) => (
                        <tr key={car.id} className="hover:bg-slate-50">
                          {activeColumnDefs.slice(0, 8).map((col) => (
                            <td key={col.key} className="px-3 py-1.5 whitespace-nowrap font-medium">
                              {String(col.getValue(car, agency))}
                            </td>
                          ))}
                          {activeColumnDefs.length > 8 && (
                            <td className="px-3 py-1.5 text-slate-400 italic">...</td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>
              Generando archivo: <strong className="text-slate-800 font-mono">Inventario_{agency.slug || 'agencia'}_{new Date().toISOString().split('T')[0]}.csv</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleCopyClipboard}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Copiar texto CSV al portapapeles"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span className="text-emerald-700">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={targetCars.length === 0 || selectedColumnKeys.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white'
                  : targetCars.length === 0 || selectedColumnKeys.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-700 hover:bg-blue-800 text-white active:scale-98'
              }`}
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡Descargado con Éxito!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo CSV ({targetCars.length} autos)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
