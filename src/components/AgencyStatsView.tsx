import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Eye,
  MessageCircle,
  Percent,
  Car,
  Award,
  Sparkles,
  ArrowUpDown,
  Filter,
  FileText,
  ExternalLink,
  Flame,
  Users,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import { CarListing, Agency, AppUser } from '../types';
import { downloadInventoryCsv } from '../utils/exportInventoryUtils';

interface AgencyStatsViewProps {
  agency: Agency;
  cars: CarListing[];
  sellers: AppUser[];
  formatPrice: (amount: number, currency?: any) => string;
  onOpenCarDetail: (car: CarListing) => void;
  onOpenQuotePdf?: (car: CarListing) => void;
}

const BRAND_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f97316', // orange
];

export const AgencyStatsView: React.FC<AgencyStatsViewProps> = ({
  agency,
  cars,
  sellers,
  formatPrice,
  onOpenCarDetail,
  onOpenQuotePdf,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('all');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [sortBy, setSortBy] = useState<'views' | 'whatsapp' | 'conversion' | 'price'>('views');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');

  // Filter cars
  const filteredCars = useMemo(() => {
    return cars.filter((c) => {
      if (statusFilter === 'all') return true;
      return c.status === statusFilter;
    });
  }, [cars, statusFilter]);

  // Aggregate KPI metrics
  const totalViews = useMemo(() => {
    return filteredCars.reduce((acc, car) => acc + (car.viewsCount || 0), 0);
  }, [filteredCars]);

  const totalWhatsappClicks = useMemo(() => {
    return filteredCars.reduce((acc, car) => acc + (car.whatsappInquiriesCount || 0), 0);
  }, [filteredCars]);

  const globalConversionRate = useMemo(() => {
    if (totalViews === 0) return 0;
    return ((totalWhatsappClicks / totalViews) * 100).toFixed(2);
  }, [totalViews, totalWhatsappClicks]);

  const avgViewsPerCar = useMemo(() => {
    if (filteredCars.length === 0) return 0;
    return Math.round(totalViews / filteredCars.length);
  }, [filteredCars, totalViews]);

  // Top Performing Car
  const topCar = useMemo(() => {
    if (filteredCars.length === 0) return null;
    return [...filteredCars].sort((a, b) => (b.whatsappInquiriesCount || 0) - (a.whatsappInquiriesCount || 0))[0];
  }, [filteredCars]);

  // Chart Data: Cars with Views & WhatsApp Clicks
  const chartData = useMemo(() => {
    const sorted = [...filteredCars].sort((a, b) => {
      if (sortBy === 'views') return (b.viewsCount || 0) - (a.viewsCount || 0);
      if (sortBy === 'whatsapp') return (b.whatsappInquiriesCount || 0) - (a.whatsappInquiriesCount || 0);
      if (sortBy === 'conversion') {
        const rateA = a.viewsCount ? (a.whatsappInquiriesCount / a.viewsCount) * 100 : 0;
        const rateB = b.viewsCount ? (b.whatsappInquiriesCount / b.viewsCount) * 100 : 0;
        return rateB - rateA;
      }
      return b.price - a.price;
    });

    return sorted.map((car) => {
      const views = car.viewsCount || 0;
      const whatsapp = car.whatsappInquiriesCount || 0;
      const conversion = views > 0 ? parseFloat(((whatsapp / views) * 100).toFixed(1)) : 0;
      const shortName = `${car.make} ${car.model}`.length > 18 ? `${car.make} ${car.model}`.substring(0, 16) + '...' : `${car.make} ${car.model}`;

      return {
        id: car.id,
        fullName: `${car.make} ${car.model} (${car.year})`,
        shortName,
        views,
        whatsapp,
        conversion,
        price: car.price,
        currency: car.currency,
        car,
      };
    });
  }, [filteredCars, sortBy]);

  // Pie Chart: Distribution by Make
  const makeDistribution = useMemo(() => {
    const counts: Record<string, { views: number; whatsapp: number; count: number }> = {};
    filteredCars.forEach((c) => {
      if (!counts[c.make]) {
        counts[c.make] = { views: 0, whatsapp: 0, count: 0 };
      }
      counts[c.make].views += c.viewsCount || 0;
      counts[c.make].whatsapp += c.whatsappInquiriesCount || 0;
      counts[c.make].count += 1;
    });

    return Object.entries(counts)
      .map(([make, data]) => ({
        name: make,
        value: data.whatsapp,
        views: data.views,
        carsCount: data.count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredCars]);

  // Seller Performance
  const sellerStats = useMemo(() => {
    const stats: Record<string, { name: string; carsCount: number; views: number; whatsapp: number }> = {};
    
    // Add default agency owner
    stats['owner'] = {
      name: agency.ownerName || 'Casa Central',
      carsCount: 0,
      views: 0,
      whatsapp: 0,
    };

    sellers.forEach((s) => {
      stats[s.id] = {
        name: s.name,
        carsCount: 0,
        views: 0,
        whatsapp: 0,
      };
    });

    filteredCars.forEach((c) => {
      const sellerId = c.createdBySellerId || 'owner';
      if (!stats[sellerId]) {
        stats[sellerId] = {
          name: c.sellerName || 'Asesor Comercial',
          carsCount: 0,
          views: 0,
          whatsapp: 0,
        };
      }
      stats[sellerId].carsCount += 1;
      stats[sellerId].views += c.viewsCount || 0;
      stats[sellerId].whatsapp += c.whatsappInquiriesCount || 0;
    });

    return Object.values(stats).filter((s) => s.carsCount > 0 || s.whatsapp > 0);
  }, [filteredCars, sellers, agency]);

  return (
    <div id="section-agency-analytics" className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Métricas & Estadísticas de Rendimiento</h2>
              <p className="text-xs text-slate-500">
                Monitoreo de visualizaciones, consultas por WhatsApp y efectividad comercial de {agency.name}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({cars.length})
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'available'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              En Salón
            </button>
            <button
              onClick={() => setStatusFilter('sold')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'sold'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vendidos
            </button>
          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                timeRange === '7d' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                timeRange === '30d' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Días
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                timeRange === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Histórico
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={() =>
              downloadInventoryCsv(filteredCars, {
                delimiter: ';',
                agency,
              })
            }
            title="Exportar inventario y métricas filtradas a CSV / Excel"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar CSV ({filteredCars.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-white border border-blue-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Visualizaciones Totales</span>
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono">{totalViews.toLocaleString('es-ES')}</p>
          <div className="flex items-center gap-1.5 text-xs text-blue-700 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Promedio: {avgViewsPerCar} vistas por auto</span>
          </div>
        </div>

        {/* WhatsApp Clicks */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-white border border-emerald-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Clics en WhatsApp</span>
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-500/30">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-700 font-mono">
            {totalWhatsappClicks.toLocaleString('es-ES')}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Consultas directas a vendedores</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-white to-white border border-indigo-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Tasa de Conversión</span>
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/30">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-indigo-950 font-mono">{globalConversionRate}%</p>
          <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Visitas convertidas en chat</span>
          </div>
        </div>

        {/* Top Performer */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-white border border-amber-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Auto Más Solicitado</span>
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          {topCar ? (
            <div>
              <p className="text-base font-extrabold text-slate-900 truncate">
                {topCar.make} {topCar.model}
              </p>
              <div className="flex items-center gap-2 text-xs text-amber-800 font-bold mt-1 font-mono">
                <span>{topCar.whatsappInquiriesCount} chats</span>
                <span>•</span>
                <span>{topCar.viewsCount} vistas</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Sin publicaciones</p>
          )}
        </div>
      </div>

      {/* Main Interactive Chart: Views & WhatsApp per Car */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Visualizaciones vs Clics de WhatsApp por Vehículo
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                {chartData.length} Vehículos
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Compara el alcance publicitario (vistas) frente a la intención real de compra (chats de WhatsApp)
            </p>
          </div>

          {/* Chart Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="views">Más Vistas</option>
                <option value="whatsapp">Más WhatsApps</option>
                <option value="conversion">Mayor Conversión %</option>
                <option value="price">Mayor Precio</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  chartType === 'bar'
                    ? 'bg-white text-blue-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Barras
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  chartType === 'area'
                    ? 'bg-white text-blue-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Área Continua
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Main Graph */}
        {chartData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Car className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-medium">No hay vehículos registrados para mostrar estadísticas</p>
          </div>
        ) : (
          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="shortName"
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 11, fill: '#475569' }}
                  />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" tick={{ fontSize: 11, fill: '#3b82f6' }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#10b981"
                    tick={{ fontSize: 11, fill: '#10b981' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === 'Visualizaciones') return [`${value} vistas`, '👁️ Visualizaciones'];
                      if (name === 'Clics WhatsApp') return [`${value} consultas`, '💬 Clics WhatsApp'];
                      return [value, name];
                    }}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]?.payload) {
                        const item = payload[0].payload;
                        return `${item.fullName} • ${formatPrice(item.price, item.currency)}`;
                      }
                      return '';
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar
                    yAxisId="left"
                    dataKey="views"
                    name="Visualizaciones"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="whatsapp"
                    name="Clics WhatsApp"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorWhatsapp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="shortName"
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 11, fill: '#475569' }}
                  />
                  <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fontSize: 11, fill: '#3b82f6' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 11, fill: '#10b981' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="views"
                    name="Visualizaciones"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="whatsapp"
                    name="Clics WhatsApp"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorWhatsapp)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Secondary Graphs: Make Distribution & Seller Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Make Popularity (Pie Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Interés por Marca (Consultas WhatsApp)</h3>
              <p className="text-xs text-slate-500">Distribución de clientes según la marca que consultan</p>
            </div>
            <Award className="w-4 h-4 text-amber-500" />
          </div>

          {makeDistribution.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">Sin datos de marcas</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <div className="w-48 h-48 sm:w-56 sm:h-56 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={makeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {makeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val} clics WhatsApp`, 'Interés']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-2 w-full text-xs">
                {makeDistribution.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: BRAND_COLORS[idx % BRAND_COLORS.length] }}
                      />
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="text-[10px] text-slate-500">({item.carsCount} autos)</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono font-bold">
                      <span className="text-slate-600">{item.views} vistas</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                        {item.value} chats
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Seller Lead Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Rendimiento por Vendedor / Asesor</h3>
              <p className="text-xs text-slate-500">Chats generados hacia el número WhatsApp de cada asesor</p>
            </div>
            <Users className="w-4 h-4 text-blue-600" />
          </div>

          <div className="space-y-3 pt-1">
            {sellerStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No hay vendedores asignados a vehículos</p>
            ) : (
              sellerStats.map((seller, idx) => {
                const percentage =
                  totalWhatsappClicks > 0 ? Math.round((seller.whatsapp / totalWhatsappClicks) * 100) : 0;

                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                          {seller.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{seller.name}</p>
                          <p className="text-[10px] text-slate-500">{seller.carsCount} vehículos asignados</p>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-sm font-black text-emerald-700">{seller.whatsapp} chats</span>
                        <p className="text-[10px] text-slate-500 font-semibold">{seller.views} visualizaciones</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Detailed Vehicles Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tabla de Rendimiento Individual por Auto</h3>
            <p className="text-xs text-slate-500">Métricas exactas de clics e interacciones de cada unidad</p>
          </div>
          <div className="text-xs text-slate-600 font-medium">
            Total listado: <span className="font-bold text-slate-900 font-mono">{filteredCars.length} autos</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Vehículo</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3">Precio</th>
                <th className="py-3 px-3 text-center">Visualizaciones</th>
                <th className="py-3 px-3 text-center">Clics WhatsApp</th>
                <th className="py-3 px-3 text-center">Tasa Conversión</th>
                <th className="py-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chartData.map(({ car, views, whatsapp, conversion }) => (
                <tr key={car.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={car.photos[0] || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=200'}
                        alt={car.title}
                        className="w-12 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                          {car.make} {car.model}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {car.year} • {car.mileage.toLocaleString('es-ES')} km • {car.version || car.bodyType}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        car.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : car.status === 'reserved'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {car.status === 'available' ? 'En Salón' : car.status === 'reserved' ? 'Reservado' : 'Vendido'}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                    {formatPrice(car.price, car.currency)}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-100">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{views.toLocaleString('es-ES')}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold text-xs border border-emerald-200">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{whatsapp}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center font-mono">
                    <span
                      className={`font-bold ${
                        conversion >= 3
                          ? 'text-emerald-700'
                          : conversion >= 1.5
                          ? 'text-blue-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {conversion}%
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenCarDetail(car)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Ver detalle del auto"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      {onOpenQuotePdf && (
                        <button
                          onClick={() => onOpenQuotePdf(car)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Generar cotización PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
