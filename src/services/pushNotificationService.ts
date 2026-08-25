import { AgencyNotification, PushNotificationSettings } from '../types';

export const DEFAULT_PUSH_SETTINGS: PushNotificationSettings = {
  browserPushEnabled: true,
  soundEnabled: true,
  soundTone: 'modern_chime',
  toastAlertsEnabled: true,
  vibrateEnabled: true,
  notifyOnWhatsappInquiry: true,
  notifyOnQuoteInquiry: true,
  notifyOnPrivateOffer: true,
  notifyOnFinancingRequest: true,
  sellerSpecificOnly: false,
};

const SETTINGS_STORAGE_KEY = 'micarro_push_settings_v2';

// Load stored settings
export const getStoredPushSettings = (): PushNotificationSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PUSH_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback to defaults
  }
  return DEFAULT_PUSH_SETTINGS;
};

// Save push settings
export const savePushSettings = (settings: PushNotificationSettings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save push settings', err);
  }
};

// Audio synthesis for different chime tones
export const playChimeTone = (tone: PushNotificationSettings['soundTone'] = 'modern_chime') => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (tone === 'modern_chime') {
      // Crisp 2-note glass chime (D5 -> A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.18, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain2.gain.setValueAtTime(0.22, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.6);
    } else if (tone === 'subtle_bell') {
      // Warm hotel reception bell
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } else if (tone === 'marimba') {
      // 3-note upbeat marimba arpeggio (C5 -> E5 -> G5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + index * 0.08;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } else if (tone === 'cash_register') {
      // Sale / Deal closed chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.12); // E6
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.7);
    }
  } catch {
    // Gracefully ignore audio context autoplay restrictions
  }
};

// Check current browser permission
export const getBrowserPushPermission = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Request Browser Push permission
export const requestBrowserPushPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission', err);
    return Notification.permission;
  }
};

// Dispatch a native browser notification
export const sendBrowserPushNotification = (notification: AgencyNotification) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const title = notification.title || '¡Nueva consulta en MiCarro!';
    const options: NotificationOptions = {
      body: `${notification.clientName ? `${notification.clientName}: ` : ''}${notification.message}`,
      icon: notification.photoUrl || '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      silent: true, // We trigger custom sound through Web Audio API
    };

    const nativeNotif = new Notification(title, options);

    nativeNotif.onclick = () => {
      window.focus();
      nativeNotif.close();
      if (notification.clientWhatsapp) {
        const text = `¡Hola ${notification.clientName}! 👋 Te escribo de la concesionaria respecto a tu consulta por el ${notification.carTitle || 'vehículo'}.`;
        window.open(`https://wa.me/${notification.clientWhatsapp}?text=${encodeURIComponent(text)}`, '_blank');
      }
    };
  } catch (err) {
    console.warn('Native notification failed or restricted in iframe environment', err);
  }
};

// Global push alert listener bus
type PushAlertSubscriber = (notification: AgencyNotification) => void;
const subscribers: Set<PushAlertSubscriber> = new Set();

export const subscribeToPushAlerts = (callback: PushAlertSubscriber) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

// Main trigger function for push notifications
export const triggerAgencyPushNotification = (notification: AgencyNotification) => {
  const settings = getStoredPushSettings();

  // 1. Play Sound Chime if enabled
  if (settings.soundEnabled) {
    playChimeTone(settings.soundTone);
  }

  // 2. Vibrate mobile device if supported
  if (settings.vibrateEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([150, 80, 150]);
    } catch {
      // ignore
    }
  }

  // 3. Native Browser Push
  if (settings.browserPushEnabled && getBrowserPushPermission() === 'granted') {
    sendBrowserPushNotification(notification);
  }

  // 4. Notify all active React in-app subscribers / toasts
  subscribers.forEach((sub) => {
    try {
      sub(notification);
    } catch (err) {
      console.warn('Error in push alert subscriber', err);
    }
  });

  // 5. Update browser document title temporarily
  if (typeof document !== 'undefined') {
    const originalTitle = document.title;
    document.title = `🔔 ¡Nueva Consulta! - MiCarro`;
    setTimeout(() => {
      document.title = originalTitle;
    }, 8000);
  }
};
