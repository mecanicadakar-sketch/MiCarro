import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, XCircle, X, ShieldAlert, Ban, CheckCircle2 } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  iconType?: 'trash' | 'cancel' | 'warning' | 'ban';
  itemName?: string;
  itemDetails?: string;
  warningNote?: string;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Volver / Cancelar',
  variant = 'danger',
  iconType = 'trash',
  itemName,
  itemDetails,
  warningNote,
  isLoading = false,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (iconType) {
      case 'trash':
        return <Trash2 className="w-6 h-6 text-rose-600" />;
      case 'cancel':
        return <Ban className="w-6 h-6 text-amber-600" />;
      case 'ban':
        return <XCircle className="w-6 h-6 text-rose-600" />;
      case 'warning':
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
    }
  };

  const getIconContainerClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-100 border-rose-200 text-rose-700';
      case 'warning':
        return 'bg-amber-100 border-amber-200 text-amber-800';
      case 'info':
      default:
        return 'bg-blue-100 border-blue-200 text-blue-700';
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25 focus:ring-rose-500';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25 focus:ring-amber-500';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 focus:ring-blue-500';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative space-y-5 animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          disabled={isLoading}
          aria-label="Cerrar diálogo"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 pr-6">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm ${getIconContainerClass()}`}
          >
            {getIcon()}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Item Info Preview Card */}
        {itemName && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-500 uppercase tracking-wider">
                Elemento seleccionado:
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-bold text-[10px]">
                Afectado
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 font-mono line-clamp-1">
              {itemName}
            </p>
            {itemDetails && (
              <p className="text-xs text-slate-600 leading-normal">
                {itemDetails}
              </p>
            )}
          </div>
        )}

        {/* Warning Note */}
        {warningNote ? (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{warningNote}</span>
          </div>
        ) : (
          variant === 'danger' && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong>Atención:</strong> Esta acción modificará permanentemente los registros del sistema.
              </span>
            </div>
          )
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors order-2 sm:order-1"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 order-1 sm:order-2 ${getConfirmButtonClass()}`}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Procesando...</span>
              </span>
            ) : (
              <>
                {iconType === 'trash' && <Trash2 className="w-4 h-4" />}
                {iconType === 'cancel' && <Ban className="w-4 h-4" />}
                {iconType === 'warning' && <AlertTriangle className="w-4 h-4" />}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
