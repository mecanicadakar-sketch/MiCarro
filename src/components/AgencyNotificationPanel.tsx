import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CarListing, PrivateCarOffer, LeadInquiry, AgencyNotification, PushNotificationSettings } from '../types';
import {
  Bell,
  BellRing,
  MessageCircle,
  Car,
  FileText,
  CheckCircle2,
  Clock,
  Trash2,
  CheckCheck,
  ExternalLink,
  Sparkles,
  Volume2,
  VolumeX,
  Plus,
  AlertCircle,
  Tag,
  DollarSign,
  Send,
  Phone,
  User,
  ShieldCheck,
  Eye,
  Filter,
  X,
  Smartphone,
  Laptop,
  Check,
  Vibrate,
  Sliders,
  Settings2,
  HelpCircle,
  Play,
  Share2,
} from 'lucide-react';
import {
  getBrowserPushPermission,
  requestBrowserPushPermission,
  sendBrowserPushNotification,
  playChimeTone,
  subscribeToPushAlerts,
  triggerAgencyPushNotification,
} from '../services/pushNotificationService';

interface AgencyNotificationPanelProps {
  onOpenCarDetail?: (car: CarListing) => void;
  onOpenQuotePdf?: (car: CarListing) => void;
  onNavigateToTab?: (tab: 'inventory' | 'sellers' | 'offers' | 'leads' | 'company' | 'subscription' | 'notifications') => void;
}

export const AgencyNotificationPanel: React.FC<AgencyNotificationPanelProps> = ({
  onOpenCarDetail,
  onOpenQuotePdf,
  onNavigateToTab,
}) => {
  const {
    currentAgency,
    carListings,
    leads,
    privateOffers,
    addLead,
    addPrivateOffer,
    formatPrice,
    users,
    currentUser,
    pushSettings,
    updatePushSettings,
  } = useApp();

  const storageKey = `micarro_agency_notifs_v3_${currentAgency?.id || 'demo'}`;

  const [notifications, setNotifications] = useState<AgencyNotification[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'whatsapp' | 'quotes' | 'sellers' | 'unread'>('all');
  const [selectedSellerFilter, setSelectedSellerFilter] = useState<string>('all');
  const [activeToast, setActiveToast] = useState<AgencyNotification | null>(null);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [permissionRequestedSuccess, setPermissionRequestedSuccess] = useState<string | null>(null);

  // Initialize browser permission status
  useEffect(() => {
    setBrowserPermission(getBrowserPushPermission());
  }, []);

  // Subscribe to live push alerts emitted anywhere in the app
  useEffect(() => {
    const unsubscribe = subscribeToPushAlerts((newNotif) => {
      // Check if notification belongs to this agency or global
      if (!currentAgency || newNotif.agencyId === currentAgency.id || newNotif.agencyId === 'all') {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          const updated = [newNotif, ...prev];
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch {}
          return updated;
        });

        if (pushSettings.toastAlertsEnabled) {
          setActiveToast(newNotif);
          setTimeout(() => {
            setActiveToast((curr) => (curr?.id === newNotif.id ? null : curr));
          }, 8000);
        }
      }
    });

    return () => unsubscribe();
  }, [currentAgency?.id, pushSettings.toastAlertsEnabled, storageKey]);

  // Load and sync notifications from real leads and private offers
  useEffect(() => {
    if (!currentAgency) return;

    const savedNotifsRaw = localStorage.getItem(storageKey);
    let savedNotifs: AgencyNotification[] = [];
    if (savedNotifsRaw) {
      try {
        savedNotifs = JSON.parse(savedNotifsRaw);
      } catch {
        savedNotifs = [];
      }
    }

    // Build synthesized notifications from leads
    const agencyLeads = leads.filter((l) => l.agencyId === currentAgency.id);
    const leadNotifs: AgencyNotification[] = agencyLeads.map((l) => {
      const foundCar = carListings.find((c) => c.id === l.carId);
      const isQuoteType =
        l.channel === 'financing_quote' ||
        l.message.toLowerCase().includes('cotiz') ||
        l.message.toLowerCase().includes('cuota') ||
        l.message.toLowerCase().includes('precio');
      const isWhatsApp = l.channel === 'whatsapp';

      const existing = savedNotifs.find((s) => s.id === `lead-${l.id}`);

      let title = `Consulta de Cliente: ${l.carTitle}`;
      if (isWhatsApp) {
        title = `Consulta por WhatsApp: ${l.carTitle}`;
      } else if (isQuoteType) {
        title = `Solicitud de Cotización: ${l.carTitle}`;
      }

      return {
        id: `lead-${l.id}`,
        agencyId: currentAgency.id,
        type: isWhatsApp ? 'whatsapp_inquiry' : isQuoteType ? 'quote_inquiry' : 'financing_request',
        title,
        message: l.message,
        clientName: l.clientName,
        clientPhone: l.clientPhone,
        clientWhatsapp: l.clientPhone.replace(/[^0-9]/g, ''),
        clientEmail: l.clientEmail,
        carId: l.carId,
        carTitle: l.carTitle,
        vehicleSummary: foundCar ? `${foundCar.make} ${foundCar.model} ${foundCar.year}` : l.carTitle,
        amountOrPrice: foundCar ? `${foundCar.currency} ${foundCar.price.toLocaleString('es-ES')}` : undefined,
        photoUrl: foundCar?.photos?.[0],
        timestamp: l.createdAt,
        isRead: existing ? existing.isRead : l.status !== 'new',
        priority: 'high',
        assignedSellerId: l.assignedSellerId || foundCar?.createdBySellerId,
        assignedSellerName: l.assignedSellerName || foundCar?.sellerName,
        channel: isWhatsApp ? 'whatsapp' : 'web_quote',
      };
    });

    // Build synthesized notifications from private offers
    const agencyOffers = privateOffers.filter(
      (o) =>
        o.preferredAgencyId === currentAgency.id ||
        o.preferredAgencyId === 'all' ||
        o.assignedAgencyId === currentAgency.id
    );

    const offerNotifs: AgencyNotification[] = agencyOffers.map((o) => {
      const existing = savedNotifs.find((s) => s.id === `offer-${o.id}`);
      return {
        id: `offer-${o.id}`,
        agencyId: currentAgency.id,
        type: 'private_seller',
        title: `Particular ofrece vender: ${o.make} ${o.model} (${o.year})`,
        message: o.conditionNotes || 'Vehículo ofrecido por particular para toma directa o consignación.',
        clientName: o.contactName,
        clientPhone: o.contactPhone,
        clientWhatsapp: o.contactWhatsapp.replace(/[^0-9]/g, '') || o.contactPhone.replace(/[^0-9]/g, ''),
        clientEmail: o.contactEmail,
        offerId: o.id,
        vehicleSummary: `${o.make} ${o.model} ${o.version || ''} (${o.year}) - ${o.mileage.toLocaleString('es-ES')} km`,
        amountOrPrice: `Pretende: ${o.currency} ${o.expectedPrice.toLocaleString('es-ES')}`,
        photoUrl: o.photos?.[0],
        timestamp: o.submittedAt,
        isRead: existing ? existing.isRead : o.status !== 'pending',
        priority: 'high',
        channel: 'trade_in',
      };
    });

    const customOnly = savedNotifs.filter(
      (s) => !leadNotifs.some((ln) => ln.id === s.id) && !offerNotifs.some((on) => on.id === s.id)
    );

    const combined = [...leadNotifs, ...offerNotifs, ...customOnly].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setNotifications(combined);
  }, [currentAgency?.id, leads, privateOffers, carListings, storageKey]);

  // Persist notifications
  const persistNotifications = (updated: AgencyNotification[]) => {
    setNotifications(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save notifications to localStorage', e);
    }
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    persistNotifications(updated);
  };

  const handleToggleRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n));
    persistNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    persistNotifications(updated);
  };

  const handleDeleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    persistNotifications(updated);
  };

  // Request browser push permissions
  const handleRequestPushPermission = async () => {
    const perm = await requestBrowserPushPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      updatePushSettings({ browserPushEnabled: true });
      setPermissionRequestedSuccess('¡Permiso Concedido! Las alertas push se mostrarán en tu escritorio y móvil.');
      setTimeout(() => setPermissionRequestedSuccess(null), 5000);
      playChimeTone(pushSettings.soundTone);
    } else if (perm === 'denied') {
      setPermissionRequestedSuccess('El navegador bloqueó las notificaciones. Puedes habilitarlas en el icono de candado del navegador.');
      setTimeout(() => setPermissionRequestedSuccess(null), 6000);
    }
  };

  // TEST 1: Live Browser Push Test
  const handleSendTestPush = () => {
    const testNotif: AgencyNotification = {
      id: `test-${Date.now()}`,
      agencyId: currentAgency?.id || 'demo',
      type: 'whatsapp_inquiry',
      title: '🔔 ¡Prueba de Notificación Push Exitosa!',
      message: 'El servicio de alertas push y timbre comercial está configurado y funcionando perfectamente.',
      clientName: 'Prueba de Sistema',
      clientPhone: '+595 981 000 000',
      clientWhatsapp: '595981000000',
      carTitle: 'Toyota Hilux 4x4 SRV (2023)',
      vehicleSummary: 'Toyota Hilux 4x4 SRV • USD 42.000',
      amountOrPrice: 'USD 42.000',
      photoUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400',
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'high',
      channel: 'whatsapp',
    };

    triggerAgencyPushNotification(testNotif);
    setNotifications((prev) => [testNotif, ...prev]);
    setActiveToast(testNotif);
    setTimeout(() => setActiveToast(null), 7000);
  };

  // SIMULATOR 1: WhatsApp Inquiry Simulation (Buyer in Showroom)
  const handleSimulateWhatsAppInquiry = () => {
    if (!currentAgency) return;
    const agencyCars = carListings.filter((c) => c.agencyId === currentAgency.id && c.status === 'available');
    const targetCar = agencyCars[Math.floor(Math.random() * agencyCars.length)] || carListings[0];

    const sampleClients = [
      { name: 'Lucas Aranda', phone: '+595 981 445 221', msg: '¡Hola! Vi el auto publicado en MiCarro. ¿Sigue disponible para verlo hoy por la tarde en el salón?' },
      { name: 'Sofía Caballero', phone: '+595 972 889 110', msg: 'Buenas tardes. Me interesa coordinar una prueba de manejo y saber si toman usado como parte de pago.' },
      { name: 'Martín Villalba', phone: '+595 983 661 554', msg: 'Hola, quisiera consultar si tienen entrega inmediata y planes de financiación bancaria sin entrega inicial.' },
      { name: 'Carolina Giménez', phone: '+595 991 332 778', msg: '¡Hola! ¿Cuál es el precio final al contado por transferencia SIPAP? Me interesa cerrar esta semana.' },
    ];
    const client = sampleClients[Math.floor(Math.random() * sampleClients.length)];

    const assignedSeller = targetCar.sellerName || (currentUser?.name ? currentUser.name : 'Equipo de Ventas');

    // Add to CRM leads
    addLead({
      carId: targetCar ? targetCar.id : 'car-demo',
      carTitle: targetCar ? `${targetCar.make} ${targetCar.model} (${targetCar.year})` : 'Vehículo',
      agencyId: currentAgency.id,
      agencyName: currentAgency.name,
      clientName: client.name,
      clientPhone: client.phone,
      clientEmail: `${client.name.toLowerCase().replace(' ', '.')}@gmail.com`,
      channel: 'whatsapp',
      message: client.msg,
      status: 'new',
      assignedSellerId: targetCar.createdBySellerId,
      assignedSellerName: assignedSeller,
    });

    const notif: AgencyNotification = {
      id: `lead-wa-sim-${Date.now()}`,
      agencyId: currentAgency.id,
      type: 'whatsapp_inquiry',
      title: `⚡ ¡Nueva Consulta WhatsApp! ${targetCar ? `${targetCar.make} ${targetCar.model}` : 'Vehículo'}`,
      message: client.msg,
      clientName: client.name,
      clientPhone: client.phone,
      clientWhatsapp: client.phone.replace(/[^0-9]/g, ''),
      clientEmail: `${client.name.toLowerCase().replace(' ', '.')}@gmail.com`,
      carId: targetCar?.id,
      carTitle: targetCar?.title,
      vehicleSummary: targetCar ? `${targetCar.make} ${targetCar.model} (${targetCar.year})` : 'Vehículo',
      amountOrPrice: targetCar ? `${targetCar.currency} ${targetCar.price.toLocaleString('es-ES')}` : undefined,
      photoUrl: targetCar?.photos?.[0],
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'high',
      assignedSellerId: targetCar?.createdBySellerId,
      assignedSellerName: assignedSeller,
      channel: 'whatsapp',
    };

    triggerAgencyPushNotification(notif);
    const updated = [notif, ...notifications];
    persistNotifications(updated);
    setActiveToast(notif);
    setTimeout(() => setActiveToast(null), 8000);
  };

  // SIMULATOR 2: Inbound Quote Simulation
  const handleSimulateQuoteLead = () => {
    if (!currentAgency) return;
    const agencyCars = carListings.filter((c) => c.agencyId === currentAgency.id && c.status === 'available');
    const targetCar = agencyCars[Math.floor(Math.random() * agencyCars.length)] || carListings[0];

    const sampleNames = ['Rodrigo Benítez', 'Camila Duarte', 'Esteban Galeano', 'Mariana Sosa', 'Alejandro Morales'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomPhone = `+595 981 ${Math.floor(100000 + Math.random() * 900000)}`;
    const randomWhatsapp = randomPhone.replace(/[^0-9]/g, '');

    const downPayment = targetCar ? Math.round(targetCar.price * 0.3) : 5000;
    const installmentAmount = targetCar ? Math.round((targetCar.price * 0.7) / 24) : 450;

    const message = `Solicitud de Cotización Proforma formal: Anticipo de USD ${downPayment.toLocaleString('es-ES')} y saldo en 24 cuotas de aprox. USD ${installmentAmount.toLocaleString('es-ES')}.`;

    addLead({
      carId: targetCar ? targetCar.id : 'car-demo',
      carTitle: targetCar ? targetCar.title : 'Toyota Corolla Cross',
      agencyId: currentAgency.id,
      agencyName: currentAgency.name,
      clientName: randomName,
      clientPhone: randomPhone,
      clientEmail: `${randomName.toLowerCase().replace(' ', '.')}@gmail.com`,
      channel: 'financing_quote',
      message: message,
      status: 'new',
      assignedSellerId: targetCar?.createdBySellerId,
      assignedSellerName: targetCar?.sellerName,
    });

    const newNotif: AgencyNotification = {
      id: `lead-quote-sim-${Date.now()}`,
      agencyId: currentAgency.id,
      type: 'quote_inquiry',
      title: `📄 Solicitud de Cotización: ${targetCar ? targetCar.title : 'Vehículo'}`,
      message: message,
      clientName: randomName,
      clientPhone: randomPhone,
      clientWhatsapp: randomWhatsapp,
      clientEmail: `${randomName.toLowerCase().replace(' ', '.')}@gmail.com`,
      carId: targetCar?.id,
      carTitle: targetCar?.title,
      vehicleSummary: targetCar ? `${targetCar.make} ${targetCar.model} ${targetCar.year}` : 'Vehículo',
      amountOrPrice: targetCar ? `${targetCar.currency} ${targetCar.price.toLocaleString('es-ES')}` : undefined,
      photoUrl: targetCar?.photos?.[0],
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'high',
      assignedSellerId: targetCar?.createdBySellerId,
      assignedSellerName: targetCar?.sellerName,
      channel: 'web_quote',
    };

    triggerAgencyPushNotification(newNotif);
    const updated = [newNotif, ...notifications];
    persistNotifications(updated);
    setActiveToast(newNotif);
    setTimeout(() => setActiveToast(null), 8000);
  };

  // SIMULATOR 3: Private Owner Offering a Car
  const handleSimulatePrivateOffer = () => {
    if (!currentAgency) return;

    const sampleSellers = [
      {
        name: 'Guillermo Valdez',
        phone: '+595 971 450 820',
        city: 'Asunción, Paraguay',
        make: 'Toyota',
        model: 'Vitz RS',
        year: 2019,
        km: 48000,
        price: 9200,
        currency: 'USD' as const,
        notes: 'Impecable estado, volante original, cubiertas nuevas y mantenimiento al día. Busco venta directa al contado en agencia.',
        photo: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Valeria Bogado',
        phone: '+595 982 315 990',
        city: 'San Lorenzo, Central',
        make: 'Volkswagen',
        model: 'T-Cross Highline',
        year: 2022,
        km: 32000,
        price: 18500,
        currency: 'USD' as const,
        notes: 'Único dueño, service en Diesa oficial con garantía de fábrica vigente. Busco entregar en parte de pago o venta.',
        photo: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
      },
    ];

    const sample = sampleSellers[Math.floor(Math.random() * sampleSellers.length)];

    addPrivateOffer({
      contactName: sample.name,
      contactPhone: sample.phone,
      contactWhatsapp: sample.phone.replace(/[^0-9]/g, ''),
      contactEmail: `${sample.name.toLowerCase().replace(' ', '.')}@hotmail.com`,
      city: sample.city,
      make: sample.make,
      model: sample.model,
      year: sample.year,
      mileage: sample.km,
      expectedPrice: sample.price,
      currency: sample.currency,
      transmission: 'Automática',
      fuelType: 'Nafta/Gasolina',
      conditionNotes: sample.notes,
      photos: [sample.photo],
      preferredAgencyId: currentAgency.id,
    });
  };

  // Filtered list
  const agencySellers = users.filter((u) => u.agencyId === currentAgency?.id || u.agencyId === 'all');

  const filteredNotifications = notifications.filter((n) => {
    // Seller filter
    if (selectedSellerFilter !== 'all' && n.assignedSellerId !== selectedSellerFilter) {
      return false;
    }
    if (selectedFilter === 'unread') return !n.isRead;
    if (selectedFilter === 'whatsapp') return n.type === 'whatsapp_inquiry';
    if (selectedFilter === 'quotes') return n.type === 'quote_inquiry' || n.type === 'financing_request';
    if (selectedFilter === 'sellers') return n.type === 'private_seller';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const whatsappCount = notifications.filter((n) => n.type === 'whatsapp_inquiry').length;
  const quoteCount = notifications.filter((n) => n.type === 'quote_inquiry' || n.type === 'financing_request').length;
  const sellerCount = notifications.filter((n) => n.type === 'private_seller').length;

  return (
    <div className="space-y-6">
      {/* FLOATING PUSH TOAST ALERT (POPUP IN-APP) */}
      {activeToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full animate-fadeIn">
          <div className="p-4 rounded-3xl bg-slate-950/95 border-2 border-emerald-400 text-white shadow-2xl backdrop-blur-xl space-y-3 ring-4 ring-emerald-400/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                    activeToast.type === 'whatsapp_inquiry'
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300/40'
                      : activeToast.type === 'private_seller'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {activeToast.type === 'whatsapp_inquiry' ? (
                    <MessageCircle className="w-5 h-5 fill-current" />
                  ) : activeToast.type === 'private_seller' ? (
                    <Car className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-mono">
                      {activeToast.type === 'whatsapp_inquiry'
                        ? '⚡ Alerta WhatsApp en Vivo'
                        : activeToast.type === 'private_seller'
                        ? '🚗 Toma de Usados'
                        : '📄 Solicitud de Cotización'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">{activeToast.title}</h4>
                </div>
              </div>

              <button
                onClick={() => setActiveToast(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vehicle mini preview inside toast */}
            {activeToast.vehicleSummary && (
              <div className="flex items-center gap-2.5 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
                {activeToast.photoUrl && (
                  <img
                    src={activeToast.photoUrl}
                    alt={activeToast.vehicleSummary}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-200 truncate">{activeToast.vehicleSummary}</p>
                  {activeToast.assignedSellerName && (
                    <p className="text-[10px] text-emerald-300 font-semibold truncate">
                      👤 Vendedor asignado: {activeToast.assignedSellerName}
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-300 line-clamp-2 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              "{activeToast.message}"
            </p>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-emerald-300 font-bold font-mono truncate">
                {activeToast.clientName} ({activeToast.clientPhone})
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    handleMarkAsRead(activeToast.id);
                    const phone = activeToast.clientWhatsapp || activeToast.clientPhone.replace(/[^0-9]/g, '');
                    const text =
                      activeToast.type === 'whatsapp_inquiry'
                        ? `¡Hola ${activeToast.clientName}! 👋 Te escribo de la concesionaria *${currentAgency?.name}* respecto a tu consulta por el *${activeToast.carTitle || 'auto'}*. ¿Cómo estás? Te confirmo que está disponible para verlo en el salón.`
                        : `¡Hola ${activeToast.clientName}! 👋 Te escribo de *${currentAgency?.name}*. Recibimos tus datos en MiCarro y nos gustaría avanzar.`;
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                    setActiveToast(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>Responder</span>
                </button>

                <button
                  onClick={() => {
                    handleMarkAsRead(activeToast.id);
                    setActiveToast(null);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PUSH STATUS BANNER & BROWSER PERMISSION HEADER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 border border-sky-400/30 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm font-mono">
              <BellRing className="w-3.5 h-3.5" /> Servicio Push en Tiempo Real
            </span>

            {/* Browser Permission Status Badge */}
            {browserPermission === 'granted' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Push Navegador: Activo
              </span>
            ) : browserPermission === 'denied' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-bold">
                ⛔ Push Navegador: Bloqueado
              </span>
            ) : (
              <button
                onClick={handleRequestPushPermission}
                className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-bold hover:bg-amber-400/30 transition-colors cursor-pointer"
              >
                ⚠️ Activar Push en este Navegador
              </button>
            )}

            {unreadCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/30 border border-rose-400/40 text-rose-300 text-xs font-bold animate-pulse font-mono">
                {unreadCount} {unreadCount === 1 ? 'alerta sin leer' : 'alertas sin leer'}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                ✓ Todo atendido
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Alertas Comerciales & Consultas por WhatsApp</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Alerta inmediata para el vendedor cuando un cliente presiona <strong>"Consultar por WhatsApp"</strong>, solicita una cotización proforma o un particular ofrece un usado para toma directa.
          </p>

          {permissionRequestedSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-400/40 text-emerald-200 text-xs font-bold animate-fadeIn flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{permissionRequestedSuccess}</span>
            </div>
          )}
        </div>

        {/* Quick Simulator & Sound Control Tools */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <button
            type="button"
            onClick={() => {
              const next = !pushSettings.soundEnabled;
              updatePushSettings({ soundEnabled: next });
              if (next) playChimeTone(pushSettings.soundTone);
            }}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              pushSettings.soundEnabled
                ? 'bg-sky-950/80 border-sky-400/40 text-sky-300 hover:bg-sky-900'
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={pushSettings.soundEnabled ? 'Sonido comercial activado' : 'Sonido silenciado'}
          >
            {pushSettings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span>{pushSettings.soundEnabled ? 'Timbre ON' : 'Timbre OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Configurar tonos de timbre, vibración y canales de push"
          >
            <Settings2 className="w-4 h-4 text-amber-400" />
            <span>Ajustes Push</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateWhatsAppInquiry}
            className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer"
            title="Simular un comprador en el catálogo consultando por WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>+ Simular WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateQuoteLead}
            className="px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer"
            title="Simular solicitud de cotización formal"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>+ Cotización</span>
          </button>

          <button
            type="button"
            onClick={handleSendTestPush}
            className="px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs border border-sky-400/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Enviar notificación push de prueba al navegador"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Probar Push</span>
          </button>
        </div>
      </div>

      {/* METRIC COUNTERS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setSelectedFilter('whatsapp')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            selectedFilter === 'whatsapp'
              ? 'bg-emerald-50 border-emerald-400 shadow-md ring-2 ring-emerald-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Consultas WhatsApp</span>
            <MessageCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-800 mt-1">{whatsappCount}</p>
          <p className="text-[11px] text-emerald-700 font-semibold">Leads directos al vendedor</p>
        </div>

        <div
          onClick={() => setSelectedFilter('quotes')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            selectedFilter === 'quotes'
              ? 'bg-blue-50 border-blue-400 shadow-md ring-2 ring-blue-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Cotizaciones Proforma</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-900 mt-1">{quoteCount}</p>
          <p className="text-[11px] text-blue-700 font-semibold">Solicitudes de precio & cuotas</p>
        </div>

        <div
          onClick={() => setSelectedFilter('sellers')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            selectedFilter === 'sellers'
              ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Toma de Usados</span>
            <Tag className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900 mt-1">{sellerCount}</p>
          <p className="text-[11px] text-amber-700 font-semibold">Particulares que venden</p>
        </div>

        <div
          onClick={() => setSelectedFilter('unread')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            selectedFilter === 'unread'
              ? 'bg-rose-50 border-rose-400 shadow-md ring-2 ring-rose-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Sin Atender</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-1">{unreadCount}</p>
          <p className="text-[11px] text-slate-500">Requieren respuesta comercial</p>
        </div>
      </div>

      {/* FILTER BAR & SELLER SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todas ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('whatsapp')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedFilter === 'whatsapp'
                ? 'bg-emerald-700 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp ({whatsappCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('quotes')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedFilter === 'quotes'
                ? 'bg-blue-700 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Cotizaciones ({quoteCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('sellers')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedFilter === 'sellers'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Particulares ({sellerCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('unread')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedFilter === 'unread'
                ? 'bg-rose-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>No Leídas ({unreadCount})</span>
          </button>
        </div>

        {/* Seller Filter and Actions */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {agencySellers.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedSellerFilter}
                onChange={(e) => setSelectedSellerFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">Todos los Vendedores</option>
                {agencySellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name} ({seller.role === 'agency_admin' ? 'Admin' : 'Ventas'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Marcar leídas</span>
            </button>
          )}
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      {filteredNotifications.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No hay notificaciones en este filtro</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Cuando un comprador consulte un vehículo por WhatsApp en el catálogo o solicite cotización, sonará el timbre y aparecerá aquí en tiempo real.
          </p>
          <div className="pt-2 flex justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSimulateWhatsAppInquiry}
              className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Simular Consulta WhatsApp
            </button>
            <button
              type="button"
              onClick={handleSimulateQuoteLead}
              className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Simular Cotización
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isWhatsApp = notif.type === 'whatsapp_inquiry';
            const isQuote = notif.type === 'quote_inquiry' || notif.type === 'financing_request';
            const foundCar = notif.carId ? carListings.find((c) => c.id === notif.carId) : null;

            return (
              <div
                key={notif.id}
                className={`p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden shadow-sm hover:shadow-md ${
                  !notif.isRead
                    ? isWhatsApp
                      ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                      : isQuote
                      ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-200'
                      : 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left accent color bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    !notif.isRead
                      ? isWhatsApp
                        ? 'bg-emerald-500'
                        : isQuote
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                      : 'bg-transparent'
                  }`}
                />

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Photo/Icon, Badges, Content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Vehicle Photo or Event Icon */}
                    {notif.photoUrl ? (
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-sm">
                        <img src={notif.photoUrl} alt={notif.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                          isWhatsApp
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : isQuote
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isWhatsApp ? (
                          <MessageCircle className="w-6 h-6" />
                        ) : isQuote ? (
                          <FileText className="w-6 h-6" />
                        ) : (
                          <Car className="w-6 h-6" />
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono ${
                            isWhatsApp
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isQuote
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isWhatsApp
                            ? '⚡ Consulta por WhatsApp'
                            : isQuote
                            ? '💬 Cotización / Financiación'
                            : '🚗 Particular Vende Auto'}
                        </span>

                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="No leída" />
                        )}

                        {notif.assignedSellerName && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            👤 {notif.assignedSellerName}
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.timestamp).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{notif.title}</h3>

                      {notif.vehicleSummary && (
                        <p className="text-xs text-blue-800 font-semibold flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{notif.vehicleSummary}</span>
                          {notif.amountOrPrice && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold font-mono text-[11px]">
                              {notif.amountOrPrice}
                            </span>
                          )}
                        </p>
                      )}

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 italic">
                        "{notif.message}"
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 pt-1 flex-wrap font-mono">
                        <span>
                          <strong>Cliente:</strong> {notif.clientName}
                        </span>
                        <span>•</span>
                        <span>{notif.clientPhone}</span>
                        {notif.clientEmail && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{notif.clientEmail}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* WhatsApp Action Button */}
                    <button
                      type="button"
                      onClick={() => {
                        handleMarkAsRead(notif.id);
                        const phone = notif.clientWhatsapp || notif.clientPhone.replace(/[^0-9]/g, '');
                        const msg = isWhatsApp
                          ? `¡Hola ${notif.clientName}! 👋 Te escribo de la concesionaria *${currentAgency?.name}* respecto a tu consulta de WhatsApp por el *${notif.carTitle || 'vehículo'}*. ¿Cómo estás? Te confirmo que está disponible en salón para coordinar una visita.`
                          : isQuote
                          ? `¡Hola ${notif.clientName}! 👋 Te escribo de la concesionaria *${currentAgency?.name}* respecto a tu solicitud de cotización por el *${notif.carTitle || 'vehículo'}*. Te preparé la propuesta con facilidades.`
                          : `¡Hola ${notif.clientName}! 👋 Te escribo de la concesionaria *${currentAgency?.name}*. Recibimos los datos de tu *${notif.vehicleSummary || 'auto'}* que ofreciste. Nos interesa tasarlo. ¿Cuándo te queda bien acercarlo?`;
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>Responder WhatsApp</span>
                    </button>

                    {/* View Car Detail if Car exists */}
                    {foundCar && onOpenCarDetail && (
                      <button
                        type="button"
                        onClick={() => {
                          handleMarkAsRead(notif.id);
                          onOpenCarDetail(foundCar);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-300" />
                        <span>Ver Ficha del Auto</span>
                      </button>
                    )}

                    {/* PDF Quote Button if Car exists */}
                    {foundCar && onOpenQuotePdf && (
                      <button
                        type="button"
                        onClick={() => {
                          handleMarkAsRead(notif.id);
                          onOpenQuotePdf(foundCar);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Cotización PDF</span>
                      </button>
                    )}

                    {/* Offer Tab Navigation if it's a private seller */}
                    {notif.type === 'private_seller' && onNavigateToTab && (
                      <button
                        type="button"
                        onClick={() => {
                          handleMarkAsRead(notif.id);
                          onNavigateToTab('offers');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Tag className="w-3.5 h-3.5 text-amber-300" />
                        <span>Ver en Toma de Usados</span>
                      </button>
                    )}

                    {/* Secondary Actions: Toggle Read / Delete */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleRead(notif.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title={notif.isRead ? 'Marcar como no leída' : 'Marcar como leída'}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${notif.isRead ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="text-[11px]">{notif.isRead ? 'Atendida' : 'Marcar atendida'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar notificación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PUSH SETTINGS & PREFERENCES MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Configuración de Notificaciones Push</h3>
                  <p className="text-xs text-slate-500">Personaliza timbres sonoros, alertas de navegador y canales</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Browser Push Toggle & Permission */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Notificaciones Push del Navegador</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Muestra ventanas emergentes nativas en Windows, Mac, Linux o Android aún con la pestaña en segundo plano.
                  </p>
                </div>
                {browserPermission === 'granted' ? (
                  <button
                    onClick={() => updatePushSettings({ browserPushEnabled: !pushSettings.browserPushEnabled })}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      pushSettings.browserPushEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                        pushSettings.browserPushEnabled ? 'left-6.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                ) : (
                  <button
                    onClick={handleRequestPushPermission}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    Habilitar
                  </button>
                )}
              </div>

              {/* Sound & Chime Tone Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Timbre Sonoro Comercial</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !pushSettings.soundEnabled;
                      updatePushSettings({ soundEnabled: next });
                      if (next) playChimeTone(pushSettings.soundTone);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      pushSettings.soundEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                        pushSettings.soundEnabled ? 'left-6.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {pushSettings.soundEnabled && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Tono de alerta acustica:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'modern_chime' as const, name: 'Cristal Moderno (D5-A5)' },
                        { id: 'subtle_bell' as const, name: 'Campana de Recepción' },
                        { id: 'marimba' as const, name: 'Marimba Arpegio' },
                        { id: 'cash_register' as const, name: 'Caja Registradora / Venta' },
                      ].map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            updatePushSettings({ soundTone: t.id });
                            playChimeTone(t.id);
                          }}
                          className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            pushSettings.soundTone === t.id
                              ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950 ring-1 ring-emerald-300'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span className="truncate">{t.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playChimeTone(t.id);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600"
                            title="Probar sonido"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Toast & Vibration Toggles */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Toast en Pantalla</p>
                    <p className="text-[10px] text-slate-500">Banner emergente</p>
                  </div>
                  <button
                    onClick={() => updatePushSettings({ toastAlertsEnabled: !pushSettings.toastAlertsEnabled })}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      pushSettings.toastAlertsEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                        pushSettings.toastAlertsEnabled ? 'left-5.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Vibración Móvil</p>
                    <p className="text-[10px] text-slate-500">Haptic en celulares</p>
                  </div>
                  <button
                    onClick={() => updatePushSettings({ vibrateEnabled: !pushSettings.vibrateEnabled })}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      pushSettings.vibrateEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                        pushSettings.vibrateEnabled ? 'left-5.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSendTestPush}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Laptop className="w-3.5 h-3.5 text-blue-600" />
                <span>Probar Notificación Ahora</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
