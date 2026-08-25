import { CarListing, Agency } from '../types';

export interface ExportColumnOption {
  key: string;
  label: string;
  category: 'basic' | 'technical' | 'commercial' | 'metrics_media';
  getValue: (car: CarListing, agency?: Agency) => string | number;
}

export const INVENTORY_EXPORT_COLUMNS: ExportColumnOption[] = [
  // Datos Básicos
  { key: 'id', label: 'ID', category: 'basic', getValue: (c) => c.id },
  { key: 'title', label: 'Título Publicación', category: 'basic', getValue: (c) => c.title },
  { key: 'make', label: 'Marca', category: 'basic', getValue: (c) => c.make },
  { key: 'model', label: 'Modelo', category: 'basic', getValue: (c) => c.model },
  { key: 'version', label: 'Versión', category: 'basic', getValue: (c) => c.version || '' },
  { key: 'year', label: 'Año', category: 'basic', getValue: (c) => c.year },
  { key: 'mileage', label: 'Kilometraje (km)', category: 'basic', getValue: (c) => c.mileage },
  { key: 'price', label: 'Precio', category: 'basic', getValue: (c) => c.price },
  { key: 'currency', label: 'Moneda', category: 'basic', getValue: (c) => c.currency },
  {
    key: 'status',
    label: 'Estado',
    category: 'basic',
    getValue: (c) => {
      switch (c.status) {
        case 'available':
          return 'Disponible';
        case 'reserved':
          return 'Reservado';
        case 'sold':
          return 'Vendido';
        case 'draft':
          return 'Borrador';
        default:
          return c.status;
      }
    },
  },
  { key: 'condition', label: 'Condición', category: 'basic', getValue: (c) => c.condition },

  // Datos Técnicos
  { key: 'transmission', label: 'Transmisión', category: 'technical', getValue: (c) => c.transmission },
  { key: 'fuelType', label: 'Combustible', category: 'technical', getValue: (c) => c.fuelType },
  { key: 'bodyType', label: 'Carrocería', category: 'technical', getValue: (c) => c.bodyType },
  { key: 'color', label: 'Color', category: 'technical', getValue: (c) => c.color },
  { key: 'doors', label: 'Puertas', category: 'technical', getValue: (c) => c.doors },
  { key: 'engine', label: 'Motor / Cilindrada', category: 'technical', getValue: (c) => c.engine },
  { key: 'traction', label: 'Tracción', category: 'technical', getValue: (c) => c.traction },
  { key: 'plateEnding', label: 'Terminación Chapa / Placa', category: 'technical', getValue: (c) => c.plateEnding || '' },

  // Datos Comerciales
  { key: 'isFeatured', label: 'Destacado en Portada', category: 'commercial', getValue: (c) => (c.isFeatured ? 'SÍ' : 'NO') },
  { key: 'acceptsTradeIn', label: 'Acepta Permuta / Usado', category: 'commercial', getValue: (c) => (c.acceptsTradeIn ? 'SÍ' : 'NO') },
  { key: 'financingAvailable', label: 'Financiación Disponible', category: 'commercial', getValue: (c) => (c.financingAvailable ? 'SÍ' : 'NO') },
  { key: 'financingDetails', label: 'Detalles Financiación', category: 'commercial', getValue: (c) => c.financingDetails || '' },
  { key: 'warrantyMonths', label: 'Meses de Garantía', category: 'commercial', getValue: (c) => c.warrantyMonths || 0 },
  { key: 'sellerName', label: 'Vendedor Asignado', category: 'commercial', getValue: (c) => c.sellerName || 'General Concesionaria' },
  { key: 'sellerWhatsapp', label: 'WhatsApp Asesor', category: 'commercial', getValue: (c) => c.sellerWhatsapp || c.agencyWhatsapp || '' },
  { key: 'agencyName', label: 'Concesionaria', category: 'commercial', getValue: (c, ag) => c.agencyName || ag?.name || '' },
  { key: 'agencyCity', label: 'Ciudad / Sucursal', category: 'commercial', getValue: (c, ag) => c.agencyCity || ag?.city || '' },

  // Métricas y Multimedia
  { key: 'viewsCount', label: 'Visitas Recibidas', category: 'metrics_media', getValue: (c) => c.viewsCount || 0 },
  { key: 'whatsappInquiriesCount', label: 'Consultas WhatsApp', category: 'metrics_media', getValue: (c) => c.whatsappInquiriesCount || 0 },
  { key: 'photosCount', label: 'Cantidad de Fotos', category: 'metrics_media', getValue: (c) => c.photos?.length || 0 },
  { key: 'coverPhotoUrl', label: 'URL Foto Principal', category: 'metrics_media', getValue: (c) => c.photos?.[0] || '' },
  {
    key: 'features',
    label: 'Equipamiento y Extras',
    category: 'metrics_media',
    getValue: (c) => (Array.isArray(c.features) ? c.features.join(' | ') : ''),
  },
  {
    key: 'description',
    label: 'Descripción Comercial',
    category: 'metrics_media',
    getValue: (c) => c.description?.replace(/[\r\n]+/g, ' ') || '',
  },
  { key: 'createdAt', label: 'Fecha de Carga', category: 'metrics_media', getValue: (c) => c.createdAt || '' },
  { key: 'updatedAt', label: 'Última Actualización', category: 'metrics_media', getValue: (c) => c.updatedAt || '' },
];

export interface ExportCsvOptions {
  delimiter?: ';' | ',' | '\t';
  selectedColumnKeys?: string[];
  agency?: Agency;
  filename?: string;
}

/**
 * Escapes a cell value for CSV formatting according to RFC 4180
 */
function escapeCsvCell(val: string | number, delimiter: string): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If contains delimiter, double quote, or newline, enclose in quotes and escape internal quotes
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates CSV content string with UTF-8 BOM for full compatibility with Excel and Sheets
 */
export function generateInventoryCsvString(
  cars: CarListing[],
  options: ExportCsvOptions = {}
): string {
  const delimiter = options.delimiter || ';'; // Default to semicolon for Spanish Excel
  const activeColumns = options.selectedColumnKeys
    ? INVENTORY_EXPORT_COLUMNS.filter((col) => options.selectedColumnKeys?.includes(col.key))
    : INVENTORY_EXPORT_COLUMNS;

  // Header row
  const headerRow = activeColumns.map((col) => escapeCsvCell(col.label, delimiter)).join(delimiter);

  // Data rows
  const dataRows = cars.map((car) => {
    return activeColumns
      .map((col) => escapeCsvCell(col.getValue(car, options.agency), delimiter))
      .join(delimiter);
  });

  // UTF-8 BOM prefix (\uFEFF) ensures Excel reads accented characters (ñ, á, é, í, ó, ú) seamlessly
  return `\uFEFF${[headerRow, ...dataRows].join('\r\n')}`;
}

/**
 * Triggers the browser download of the generated CSV file
 */
export function downloadInventoryCsv(
  cars: CarListing[],
  options: ExportCsvOptions = {}
): { filename: string; rowCount: number } {
  const csvContent = generateInventoryCsvString(cars, options);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const agencyNameSanitized = (options.agency?.name || 'Agencia')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const finalFilename = options.filename || `Inventario_${agencyNameSanitized}_${dateStr}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', finalFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    filename: finalFilename,
    rowCount: cars.length,
  };
}
