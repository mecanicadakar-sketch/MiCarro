import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Camera,
  Car,
  DollarSign,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  X,
  HelpCircle,
  ArrowRight,
  Lightbulb,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface UploadTutorialBannerProps {
  onStartUpload: () => void;
  className?: string;
}

interface TutorialStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badgeBg: string;
  badgeText: string;
  tip: string;
}

const STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Datos del Vehículo',
    subtitle: 'Marca, Modelo y Especificaciones',
    description:
      'Ingresa la marca, modelo, versión, año de fabricación y kilometraje real. También puedes especificar el tipo de combustible, transmisión y tracción.',
    icon: Car,
    color: 'from-blue-600 to-sky-600',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeText: 'Paso 1 de 4',
    tip: 'Consejo: Completar el equipamiento destacado aumenta las visitas en un 35%.',
  },
  {
    id: 2,
    title: 'Fotos en Alta Calidad',
    subtitle: 'Galería Multi-Foto & Portada',
    description:
      'Sube fotos claras del exterior (frente 3/4, laterales, trasera) y del interior (tablero, asientos). La primera imagen será la foto de portada en el catálogo.',
    icon: Camera,
    color: 'from-purple-600 to-indigo-600',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeText: 'Paso 2 de 4',
    tip: 'Consejo: Puedes arrastrar archivos directamente o pegar URLs de imágenes.',
  },
  {
    id: 3,
    title: 'Precio y Moneda',
    subtitle: 'Fijación en USD $ o Guaraníes (Gs.)',
    description:
      'Establece el precio de venta en Dólares americanos (USD) o Guaraníes (Gs.). La plataforma formatea automáticamente la cotización y permite destacar financiación o permutas.',
    icon: DollarSign,
    color: 'from-emerald-600 to-teal-600',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeText: 'Paso 3 de 4',
    tip: 'Consejo: Puedes indicar si aceptas permutas o vehículos usados como parte de pago.',
  },
  {
    id: 4,
    title: 'Publicación & WhatsApp Directo',
    subtitle: 'Visibilidad Inmediata & Leads',
    description:
      'Al presionar "Publicar Auto", tu vehículo estará disponible de inmediato en el catálogo público con botón de contacto directo a tu WhatsApp.',
    icon: MessageCircle,
    color: 'from-amber-600 to-orange-600',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeText: 'Paso 4 de 4',
    tip: 'Consejo: Cada consulta por WhatsApp queda registrada en tu CRM de Prospectos.',
  },
];

export const UploadTutorialBanner: React.FC<UploadTutorialBannerProps> = ({
  onStartUpload,
  className = '',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Read dismissal state from sessionStorage if preferred
  useEffect(() => {
    const saved = localStorage.getItem('micarro_upload_tutorial_dismissed');
    if (saved === 'true') {
      setIsMinimized(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('micarro_upload_tutorial_dismissed', 'true');
  };

  const handleToggleMinimize = () => {
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    if (nextState) {
      localStorage.setItem('micarro_upload_tutorial_dismissed', 'true');
    } else {
      localStorage.removeItem('micarro_upload_tutorial_dismissed');
    }
  };

  if (isDismissed) {
    return (
      <div className={`flex items-center justify-end ${className}`}>
        <button
          type="button"
          onClick={() => {
            setIsDismissed(false);
            setIsMinimized(false);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>¿Cómo cargar un auto? Ver tutorial</span>
        </button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div
        className={`bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-4 shadow-sm ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Guía Rápida para Cargar Tu Primer Auto</span>
              <span className="px-2 py-0.2 rounded-full bg-blue-200/70 text-blue-800 text-[10px] font-bold">
                4 pasos sencillos
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 hidden sm:block">
              Aprende a publicar vehículos con fotos, precios en USD/₲ y contacto directo por WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleMinimize}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors shadow-xs"
          >
            Abrir Tutorial
          </button>
          <button
            type="button"
            onClick={onStartUpload}
            className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>Cargar Auto</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  return (
    <div
      className={`relative bg-white border-2 border-sky-300 rounded-3xl p-5 sm:p-6 shadow-md overflow-hidden ${className}`}
    >
      {/* Decorative gradient light corner */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-sky-100/70 via-blue-50/40 to-transparent rounded-full blur-2xl pointer-events-none -z-0"></div>

      {/* Header bar of tutorial */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700">
                Tutorial de Carga
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Nuevo en MiCarro
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              ¿Cómo publicar tu primer vehículo en 4 pasos?
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleMinimize}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Minimizar
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar tutorial"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 relative z-10">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStepIndex;
          const isDone = idx < currentStepIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setCurrentStepIndex(idx)}
              className={`p-2.5 rounded-2xl text-left transition-all border flex items-center gap-2.5 ${
                isActive
                  ? 'bg-blue-50 border-blue-400 shadow-xs ring-2 ring-blue-400/20'
                  : isDone
                  ? 'bg-slate-50 border-emerald-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:bg-slate-100/80'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <div className="min-w-0">
                <p className={`text-[11px] font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                  {step.title}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{step.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Detailed Content Card */}
      <div className="mt-4 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-2xl p-4 sm:p-5 border border-slate-200 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentStep.color} text-white flex items-center justify-center shadow-md shrink-0`}
            >
              <StepIcon className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${currentStep.badgeBg}`}>
                  {currentStep.badgeText}
                </span>
                <h4 className="text-sm sm:text-base font-black text-slate-900">
                  {currentStep.title} — {currentStep.subtitle}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                {currentStep.description}
              </p>

              {/* Tip Pill */}
              <div className="pt-1.5 flex items-center gap-1.5 text-xs text-amber-900 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 rounded-xl w-fit">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-medium text-[11px]">{currentStep.tip}</span>
              </div>
            </div>
          </div>

          {/* Navigation Controls inside Step Card */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none text-slate-700 transition-colors"
              title="Paso anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {currentStepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => Math.min(STEPS.length - 1, prev + 1))}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartUpload}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>¡Cargar Ahora!</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs relative z-10">
        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Tus publicaciones cuentan con validación de timbrado fiscal y soporte WhatsApp 24/7.</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onStartUpload}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs transition-all shadow-sm active:scale-98"
          >
            <span>➕ Abrir Formulario de Carga</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
