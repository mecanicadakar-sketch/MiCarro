import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  CarListing,
  CurrencyCode,
  CarCondition,
  Transmission,
  FuelType,
  BodyType,
} from '../types';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  Sparkles,
  Plus,
  Car,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Link,
  ChevronDown,
} from 'lucide-react';
import { getAllBrands, getModelsForBrand } from '../data/carBrandsData';
import { formatNumberWithDots, parseNumberFromFormatted, getMillionsDescription } from '../utils/currencyUtils';

interface CarFormModalProps {
  isOpen?: boolean;
  initialCar?: CarListing | null;
  carToEdit?: CarListing | null;
  onClose: () => void;
}

const COMMON_FEATURES = [
  'Climatizador digital bizona',
  'Cámara de visión 360°',
  'Sensores de estacionamiento del/tras',
  'Tapizados de cuero',
  'Techo solar panorámico',
  'Apple CarPlay y Android Auto',
  'Control de velocidad crucero adaptativo',
  'Frenado autónomo de emergencia',
  'Llantas de aleación',
  'Cargador inalámbrico de celular',
  'Acceso y arranque sin llave (Keyless)',
  'Faros Full LED direccionales',
  'Alerta de punto ciego',
  'Tracción 4x4 con reductora',
];

export const CarFormModal: React.FC<CarFormModalProps> = ({
  isOpen = true,
  initialCar,
  carToEdit,
  onClose,
}) => {
  const targetInitialCar = initialCar || carToEdit;
  const { currentAgency, currentAgencyId, agencies, carListings, subscriptionPlans, addCarListing, updateCarListing, users, currentUser } = useApp();

  const [agencyId, setAgencyId] = useState<string>(
    targetInitialCar?.agencyId || currentAgencyId || (agencies && agencies[0]?.id) || 'agency-dakar'
  );

  // Seller assigned
  const [sellerId, setSellerId] = useState<string>(
    targetInitialCar?.createdBySellerId || currentUser?.id || ''
  );

  const [title, setTitle] = useState(targetInitialCar?.title || '');
  const [make, setMake] = useState(targetInitialCar?.make || 'Toyota');
  const [model, setModel] = useState(targetInitialCar?.model || 'Hilux');
  const [version, setVersion] = useState(targetInitialCar?.version || '2.8 TDI SRX 4x4 AT');
  const [year, setYear] = useState<number>(targetInitialCar?.year || 2023);
  const [mileage, setMileage] = useState<number>(targetInitialCar?.mileage || 25000);
  const [price, setPrice] = useState<number>(targetInitialCar?.price || 38000);
  const [currency, setCurrency] = useState<CurrencyCode>(targetInitialCar?.currency || 'USD');
  const [priceInputStr, setPriceInputStr] = useState<string>(
    targetInitialCar?.price ? formatNumberWithDots(targetInitialCar.price) : '38.000'
  );
  const [condition, setCondition] = useState<CarCondition>(targetInitialCar?.condition || 'Usado');
  const [transmission, setTransmission] = useState<Transmission>(targetInitialCar?.transmission || 'Automática');
  const [fuelType, setFuelType] = useState<FuelType>(targetInitialCar?.fuelType || 'Diésel');
  const [bodyType, setBodyType] = useState<BodyType>(targetInitialCar?.bodyType || 'Pickup');
  const [color, setColor] = useState(targetInitialCar?.color || 'Blanco');
  const [doors, setDoors] = useState<number>(targetInitialCar?.doors || 4);
  const [engine, setEngine] = useState(targetInitialCar?.engine || '2.8 Turbo Diésel 204cv');
  const [traction, setTraction] = useState<'4x2' | '4x4' | 'AWD' | 'FWD' | 'RWD'>(targetInitialCar?.traction || '4x4');
  const [plateEnding, setPlateEnding] = useState(targetInitialCar?.plateEnding || '');
  const [warrantyMonths, setWarrantyMonths] = useState<number | ''>(targetInitialCar?.warrantyMonths || 12);

  const [photos, setPhotos] = useState<string[]>(
    targetInitialCar?.photos || [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop&q=80',
    ]
  );
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [features, setFeatures] = useState<string[]>(
    targetInitialCar?.features || [
      'Climatizador digital bizona',
      'Apple CarPlay y Android Auto',
      'Cámara de visión 360°',
      'Tapizados de cuero',
    ]
  );
  const [customFeature, setCustomFeature] = useState('');

  const [description, setDescription] = useState(
    targetInitialCar?.description ||
      'Excelente unidad seleccionada. Único dueño, services oficiales al día. Documentación lista para transferir.'
  );

  const [acceptsTradeIn, setAcceptsTradeIn] = useState(targetInitialCar?.acceptsTradeIn ?? true);
  const [financingAvailable, setFinancingAvailable] = useState(targetInitialCar?.financingAvailable ?? true);
  const [financingDetails, setFinancingDetails] = useState(
    targetInitialCar?.financingDetails || 'Financiación hasta 50% en cuotas fijas o UVA con mínimos requisitos.'
  );

  const [isFeatured, setIsFeatured] = useState(targetInitialCar?.isFeatured || false);
  const [status, setStatus] = useState<CarListing['status']>(targetInitialCar?.status || 'available');

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset form when targetInitialCar changes
  useEffect(() => {
    if (targetInitialCar) {
      setAgencyId(targetInitialCar.agencyId);
      setSellerId(targetInitialCar.createdBySellerId || currentUser?.id || '');
      setTitle(targetInitialCar.title);
      setMake(targetInitialCar.make);
      setModel(targetInitialCar.model);
      setVersion(targetInitialCar.version);
      setYear(targetInitialCar.year);
      setMileage(targetInitialCar.mileage);
      setPrice(targetInitialCar.price);
      setCurrency(targetInitialCar.currency);
      setPriceInputStr(formatNumberWithDots(targetInitialCar.price));
      setCondition(targetInitialCar.condition);
      setTransmission(targetInitialCar.transmission);
      setFuelType(targetInitialCar.fuelType);
      setBodyType(targetInitialCar.bodyType);
      setColor(targetInitialCar.color);
      setDoors(targetInitialCar.doors);
      setEngine(targetInitialCar.engine);
      setTraction(targetInitialCar.traction);
      setPlateEnding(targetInitialCar.plateEnding || '');
      setWarrantyMonths(targetInitialCar.warrantyMonths || 12);
      setPhotos(targetInitialCar.photos);
      setFeatures(targetInitialCar.features);
      setDescription(targetInitialCar.description);
      setAcceptsTradeIn(targetInitialCar.acceptsTradeIn ?? true);
      setFinancingAvailable(targetInitialCar.financingAvailable ?? true);
      setFinancingDetails(targetInitialCar.financingDetails || '');
      setIsFeatured(targetInitialCar.isFeatured || false);
      setStatus(targetInitialCar.status || 'available');
    }
  }, [targetInitialCar]);

  // Auto-generate title if empty
  useEffect(() => {
    if (!initialCar && make && model && !title) {
      setTitle(`${make} ${model} ${version} ${year}`);
    }
  }, [make, model, version, year, initialCar]);

  if (!isOpen) return null;

  // Client-side image compressor for lightweight, lightning-fast storage & zero quota crashes
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 900;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(loadEvt.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(loadEvt.target?.result as string);
        img.src = loadEvt.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Handle Photo File Upload (multi-file support with automatic compression)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhotos(true);
    setErrorMsg('');

    try {
      const fileList: File[] = Array.from(files);
      const compressedUrls: string[] = [];

      for (const file of fileList) {
        const compressed = await compressImageFile(file);
        if (compressed) {
          compressedUrls.push(compressed);
        }
      }

      setPhotos((prev) => [...prev, ...compressedUrls]);
    } catch (err) {
      console.error('Error procesando fotos:', err);
      setErrorMsg('Ocurrió un error al procesar las fotos. Prueba agregando una URL o una foto más liviana.');
    } finally {
      setIsUploadingPhotos(false);
      // Reset input value
      e.target.value = '';
    }
  };

  const handleAddPhotoUrl = () => {
    if (photoUrlInput.trim()) {
      setPhotos((prev) => [...prev, photoUrlInput.trim()]);
      setPhotoUrlInput('');
    }
  };

  const handleAddPresetPhoto = (url: string) => {
    setPhotos((prev) => [...prev, url]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetCoverPhoto = (index: number) => {
    setPhotos((prev) => {
      const item = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [item, ...rest];
    });
  };

  const handleToggleFeature = (feat: string) => {
    if (features.includes(feat)) {
      setFeatures(features.filter((f) => f !== feat));
    } else {
      setFeatures([...features, feat]);
    }
  };

  const handleAddCustomFeature = () => {
    if (customFeature.trim() && !features.includes(customFeature.trim())) {
      setFeatures([...features, customFeature.trim()]);
      setCustomFeature('');
    }
  };

  // Generate description with Gemini AI
  const handleGenerateAiDescription = async () => {
    setIsGeneratingAi(true);
    try {
      const targetAgency = agencies.find((a) => a.id === agencyId) || currentAgency;
      const res = await fetch('/api/gemini/generate-car-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car: {
            make,
            model,
            version,
            year,
            mileage,
            price,
            currency,
            transmission,
            fuelType,
            color,
            features,
            acceptsTradeIn,
            financingAvailable,
            warrantyMonths: warrantyMonths || undefined,
            agencyName: targetAgency?.name,
          },
        }),
      });

      const data = await res.json();
      if (data.webDescription) {
        setDescription(data.webDescription);
      }
      if (data.highlights && Array.isArray(data.highlights)) {
        // Add new unique features
        const combined = Array.from(new Set([...features, ...data.highlights]));
        setFeatures(combined.slice(0, 10));
      }
    } catch (err) {
      console.error(err);
      setDescription(
        `🚗 ${make} ${model} ${version} (${year})\n\n✨ Kilometraje: ${mileage.toLocaleString('es-ES')} km\n✨ Transmisión: ${transmission} | Combustible: ${fuelType}\n\n🛡️ Garantía de ${warrantyMonths || 12} meses con peritaje mecánico oficial.\n🏦 Financiación a sola firma y tomamos tu usado en parte de pago.\n\n📲 ¡Consúltanos por WhatsApp para coordinar una prueba de manejo!`
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !make.trim() || !model.trim()) {
      setErrorMsg('Por favor completa el título, marca y modelo.');
      return;
    }

    if (photos.length === 0) {
      setErrorMsg('Agrega al menos una foto del vehículo.');
      return;
    }

    try {
      const targetAgency =
        agencies.find((a) => a.id === agencyId) ||
        currentAgency ||
        agencies[0] || {
          id: 'agency-dakar',
          name: 'Mecánica Dakar Autos & Concesionaria',
          whatsappNumber: '5491148905500',
          city: 'Asunción',
        };

      // Check max car limit for new additions (Agency salon limit: 30 vehicles)
      if (!initialCar && !carToEdit) {
        const agencyCurrentCars = carListings.filter((c) => c.agencyId === targetAgency.id);
        const agencyPlan = subscriptionPlans.find((p) => p.id === targetAgency.subscriptionPlanId);
        const maxAllowed = agencyPlan?.maxCars || 30;

        if (agencyCurrentCars.length >= maxAllowed) {
          setErrorMsg(
            `⛔ Límite alcanzado: La concesionaria "${targetAgency.name}" tiene actualmente ${agencyCurrentCars.length} de ${maxAllowed} vehículos cargados en su salón. Para publicar más, debes eliminar o marcar como vendido algún auto existente o ampliar el cupo del plan.`
          );
          return;
        }
      }

      const targetSeller = users.find((u) => u.id === sellerId);

      const carData = {
        agencyId: targetAgency.id,
        agencyName: targetAgency.name,
        agencyWhatsapp: targetAgency.whatsappNumber,
        agencyCity: targetAgency.city,
        createdBySellerId: targetSeller ? targetSeller.id : currentUser?.id || 'admin',
        sellerName: targetSeller ? targetSeller.name : currentUser?.name || 'Ventas MiCarro',
        sellerWhatsapp: targetSeller ? targetSeller.whatsappNumber : currentUser?.whatsappNumber || targetAgency.whatsappNumber,
        title: title.trim(),
        make: make.trim(),
        model: model.trim(),
        version: version.trim(),
        year: Number(year),
        mileage: Number(mileage),
        price: Number(price),
        currency,
        condition,
        transmission,
        fuelType,
        bodyType,
        color: color.trim(),
        doors: Number(doors),
        engine: engine.trim(),
        traction,
        plateEnding: plateEnding.trim() || undefined,
        status,
        isFeatured,
        acceptsTradeIn,
        financingAvailable,
        financingDetails: financingAvailable ? financingDetails.trim() : undefined,
        photos,
        features,
        description: description.trim(),
        warrantyMonths: warrantyMonths ? Number(warrantyMonths) : undefined,
      };

      if (initialCar) {
        updateCarListing(initialCar.id, carData);
      } else {
        addCarListing(carData);
      }

      onClose();
    } catch (err: any) {
      console.error('Error guardando vehículo:', err);
      setErrorMsg('Hubo un inconveniente al guardar el auto. Intenta nuevamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full shadow-2xl my-6 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialCar ? 'Editar Vehículo en Venta' : 'Cargar Nuevo Auto para la Venta'}
              </h2>
              <p className="text-xs text-slate-400">Inventario de Concesionaria • MiCarro</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 0: Agency & Vendedor Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Concesionaria / Agencia Asignada:
              </label>
              <select
                value={agencyId}
                onChange={(e) => setAgencyId(e.target.value)}
                className="w-full bg-slate-900 text-white rounded-xl p-2.5 border border-slate-700 text-xs font-medium focus:outline-none focus:border-amber-500"
              >
                {(agencies || []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Vendedor / Asesor Comercial a Cargo:
              </label>
              <select
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                className="w-full bg-slate-900 text-amber-400 font-semibold rounded-xl p-2.5 border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Concesionaria General (Sin vendedor fijo) --</option>
                {(users || [])
                  .filter((u) => u.agencyId === agencyId || u.agencyId === 'all')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      👤 {u.name} ({u.role === 'seller' ? 'Vendedor' : 'Gerente'}) - WA: {u.whatsappNumber}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Section 1: Multi-Photo Manager */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>Fotos del Vehículo ({photos.length} cargadas)</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  La primera foto será la portada principal. Puedes subir varios archivos o pegar enlaces.
                </p>
              </div>
            </div>

            {/* Photo Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((photo, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-xl overflow-hidden h-28 border-2 group bg-slate-950 ${
                    idx === 0 ? 'border-amber-500' : 'border-slate-800'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />

                  {idx === 0 && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black tracking-wide">
                      PORTADA
                    </span>
                  )}

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetCoverPhoto(idx)}
                        className="p-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400"
                        title="Hacer Foto de Portada"
                      >
                        <Star className="w-3.5 h-3.5 fill-slate-950" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500"
                      title="Eliminar Foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Upload Drop Zone / Button */}
              <label className="h-28 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500/80 bg-slate-950/60 flex flex-col items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors p-2 text-center relative overflow-hidden">
                {isUploadingPhotos ? (
                  <div className="flex flex-col items-center justify-center space-y-1 text-amber-400 animate-pulse">
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span className="text-[11px] font-bold">Comprimiendo...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mb-1 text-amber-400" />
                    <span className="text-[11px] font-bold">Subir Fotos</span>
                    <span className="text-[9px] text-slate-500">JPG, PNG o WebP</span>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploadingPhotos}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick URL Input & Preset Images */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="O pegar URL directa de imagen (https://...)"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddPhotoUrl}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Agregar URL
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                <span>Fotos de muestra rápida:</span>
                <button
                  type="button"
                  onClick={() => handleAddPresetPhoto('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  + Pickup 4x4
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPresetPhoto('https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  + Coupé Deportivo
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPresetPhoto('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  + Sedán Ejecutivo
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPresetPhoto('https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1000')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  + SUV Familiar
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Core Vehicle Data */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Datos Principales del Vehículo
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-3">
                <label className="block text-slate-400 mb-1 font-semibold">Título de la Publicación *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Toyota Hilux 2.8 TDI SRX 4x4 Automática"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-700 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Marca *</label>
                <input
                  type="text"
                  required
                  list="modal-car-makes"
                  placeholder="Ej. Toyota, Volkswagen, Ford"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                />
                <datalist id="modal-car-makes">
                  {getAllBrands().map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Modelo *</label>
                <input
                  type="text"
                  required
                  list="modal-car-models"
                  placeholder="Ej. Hilux, Golf, Cronos"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                />
                <datalist id="modal-car-models">
                  {getModelsForBrand(make).map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Versión / Motor</label>
                <input
                  type="text"
                  placeholder="Ej. 2.8 TDI SRX 204cv"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Año *</label>
                <input
                  type="number"
                  required
                  min="1980"
                  max="2030"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-700 text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Kilometraje (km) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={mileage}
                  onChange={(e) => setMileage(Number(e.target.value))}
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-700 text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Condición</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as CarCondition)}
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="Usado">Usado Seleccionado</option>
                  <option value="0km">0 KM Entrega Inmediata</option>
                  <option value="Certificado">Certificado con Garantía</option>
                  <option value="Consignación">En Consignación</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Carrocería</label>
                <select
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value as BodyType)}
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="SUV">SUV</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Sedán">Sedán</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Coupé">Coupé</option>
                  <option value="Monovolumen">Monovolumen</option>
                  <option value="Furgón / Utilitario">Furgón / Utilitario</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Transmisión</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value as Transmission)}
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="Automática">Automática</option>
                  <option value="Manual">Manual</option>
                  <option value="Secuencial">Secuencial</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Combustible</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as FuelType)}
                  className="w-full bg-slate-950 text-white rounded-xl p-2.5 border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="Nafta/Gasolina">Nafta/Gasolina</option>
                  <option value="Diésel">Diésel</option>
                  <option value="Híbrido (HEV)">Híbrido</option>
                  <option value="Eléctrico (EV)">Eléctrico</option>
                  <option value="GNC / GLP">GNC / GLP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Financing Options */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Precio y Condiciones Comerciales
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 font-semibold">Precio de Venta Contado *</label>
                <div className="flex gap-2">
                  <select
                    value={currency}
                    onChange={(e) => {
                      const newCurr = e.target.value as CurrencyCode;
                      if (newCurr === 'PYG' && currency === 'USD' && price < 500000) {
                        const converted = Math.round((price * 7900) / 1000000) * 1000000 || 85000000;
                        setPrice(converted);
                        setPriceInputStr(formatNumberWithDots(converted));
                      } else if (newCurr === 'USD' && currency === 'PYG' && price >= 1000000) {
                        const converted = Math.round(price / 7900);
                        setPrice(converted);
                        setPriceInputStr(formatNumberWithDots(converted));
                      } else {
                        setPriceInputStr(formatNumberWithDots(price));
                      }
                      setCurrency(newCurr);
                    }}
                    className="w-28 bg-slate-900 text-white rounded-xl p-2.5 border border-slate-700 text-xs font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="PYG">Gs. (PYG)</option>
                    <option value="ARS">ARS ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder={currency === 'PYG' ? 'Ej. 85.000.000' : 'Ej. 35.000'}
                    value={priceInputStr}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const num = parseNumberFromFormatted(raw);
                      setPrice(num);
                      setPriceInputStr(raw === '' ? '' : formatNumberWithDots(num));
                    }}
                    className="flex-1 bg-slate-900 text-white rounded-xl p-2.5 border border-slate-700 text-sm font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Garantía Mecánica (Meses)</label>
                <input
                  type="number"
                  placeholder="Ej. 12"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-900 text-white rounded-xl p-2.5 border border-slate-700 text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Helper para Guaraníes con formato de millones y 2 puntos entre los 6 ceros */}
            {currency === 'PYG' && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Unidad de Millón (2 puntos entre los 6 ceros):
                  </span>
                  <span className="font-mono font-black text-white bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/40 text-xs">
                    {price > 0 ? `Gs. ${formatNumberWithDots(price)}` : 'Gs. 0'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {price >= 1_000_000
                    ? `Valor actual: ${(price / 1_000_000).toLocaleString('es-PY', { maximumFractionDigits: 2 })} Millones de Guaraníes (con dos puntos: ${formatNumberWithDots(price)} Gs.)`
                    : 'Podés escribir directamente con o sin puntos (ej: 85.000.000 o 85000000), o sumar millones rápidamente:'}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const n = (price || 0) + 10_000_000;
                      setPrice(n);
                      setPriceInputStr(formatNumberWithDots(n));
                    }}
                    className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-[11px] font-bold rounded-lg border border-emerald-600/40 transition-colors"
                  >
                    +10 Millones
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const n = (price || 0) + 50_000_000;
                      setPrice(n);
                      setPriceInputStr(formatNumberWithDots(n));
                    }}
                    className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-[11px] font-bold rounded-lg border border-emerald-600/40 transition-colors"
                  >
                    +50 Millones
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const n = (price || 0) + 100_000_000;
                      setPrice(n);
                      setPriceInputStr(formatNumberWithDots(n));
                    }}
                    className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-[11px] font-bold rounded-lg border border-emerald-600/40 transition-colors"
                  >
                    +100 Millones
                  </button>
                  <div className="h-4 w-px bg-emerald-700/50 mx-1 hidden sm:block" />
                  <span className="text-[10px] text-slate-400 font-semibold hidden md:inline">Comunes:</span>
                  {[65000000, 85000000, 120000000, 180000000, 250000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setPrice(preset);
                        setPriceInputStr(formatNumberWithDots(preset));
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-mono font-semibold rounded-lg border border-slate-700 transition-colors"
                    >
                      {formatNumberWithDots(preset)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Checkboxes: Trade-in & Financing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                <input
                  type="checkbox"
                  checked={acceptsTradeIn}
                  onChange={(e) => setAcceptsTradeIn(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <span className="font-bold text-white block">Acepta Permuta de Usados</span>
                  <span className="text-[10px] text-slate-400">Permite a los clientes ofrecer su auto actual</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                <input
                  type="checkbox"
                  checked={financingAvailable}
                  onChange={(e) => setFinancingAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-white block">Ofrece Financiación / Cuotas</span>
                  <span className="text-[10px] text-slate-400">Muestra el simulador de cuotas bancarias</span>
                </div>
              </label>
            </div>

            {financingAvailable && (
              <div>
                <label className="block text-slate-400 mb-1 text-xs font-semibold">
                  Detalles de Financiación (Requisitos y Plazos):
                </label>
                <input
                  type="text"
                  placeholder="Ej. Financiamos hasta 50% en 12, 24 o 36 cuotas fijas en pesos con DNI."
                  value={financingDetails}
                  onChange={(e) => setFinancingDetails(e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-xl p-2.5 border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* Section 4: Equipment Chips */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-white">
              Equipamiento y Características Seleccionadas ({features.length})
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-950 rounded-2xl border border-slate-800">
              {COMMON_FEATURES.map((feat) => {
                const isSelected = features.includes(feat);
                return (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => handleToggleFeature(feat)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {feat}
                  </button>
                );
              })}
            </div>

            {/* Custom Feature Add */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Agregar otro equipamiento personalizado (ej. Gancho de remolque Bracco)..."
                value={customFeature}
                onChange={(e) => setCustomFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomFeature();
                  }
                }}
                className="flex-1 bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800 text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddCustomFeature}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Section 5: Description with AI Generator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-white">
                Descripción Comercial de la Publicación
              </label>

              <button
                type="button"
                onClick={handleGenerateAiDescription}
                disabled={isGeneratingAi}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-all hover:scale-102"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingAi ? 'Redactando con IA...' : '✨ Redactar con IA'}</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 text-white rounded-xl p-3 border border-slate-700 text-xs leading-relaxed focus:outline-none focus:border-amber-500"
              placeholder="Describe el estado general del auto, mantenimiento, procedencia y facilidades de compra..."
            />
          </div>

          {/* Section 6: Publishing Options */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <label className="font-semibold text-slate-400">Estado:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="bg-slate-900 text-white rounded-lg p-2 border border-slate-700 font-bold"
              >
                <option value="available">🟢 Disponible para Venta</option>
                <option value="reserved">🟣 Reservado (Seña Recibida)</option>
                <option value="sold">🔴 Vendido</option>
                <option value="draft">⚪ Borrador Oculto</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
              />
              <span className="font-bold text-amber-400">⭐ Destacar en Portada Principal</span>
            </label>
          </div>

          {/* Submit Button Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-102"
            >
              {initialCar ? 'Guardar Cambios del Auto' : '🚀 Publicar Auto en la Agencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
