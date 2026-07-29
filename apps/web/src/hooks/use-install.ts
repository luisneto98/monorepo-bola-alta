'use client';

import { useCallback, useEffect, useState } from 'react';

const DISMISS_KEY = 'ba-install-dismissed-at';
/** Depois de dispensar, só volta a aparecer daqui a uma semana. */
const SNOOZE_DAYS = 7;

export type InstallPlatform = 'ios' | 'android' | 'desktop';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectPlatform(): InstallPlatform {
  const ua = navigator.userAgent;
  // iPadOS 13+ se declara como Mac — o toque é o que entrega.
  const isIOS =
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

/**
 * No iOS o app só instala pelo Safari. Se o link foi aberto dentro do
 * navegador do WhatsApp/Instagram, o menu "Adicionar à Tela de Início" não existe
 * — a pessoa precisa abrir no Safari antes.
 */
function detectInAppBrowser() {
  const ua = navigator.userAgent;
  return /FBAN|FBAV|Instagram|Line|Twitter|WhatsApp/i.test(ua);
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari no iOS usa esta propriedade não-padrão.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function useInstall() {
  const [platform, setPlatform] = useState<InstallPlatform>('desktop');
  const [installed, setInstalled] = useState(true);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [snoozed, setSnoozed] = useState(true);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());
    setInAppBrowser(detectInAppBrowser());

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    setSnoozed(Date.now() - dismissedAt < SNOOZE_DAYS * 86_400_000);

    const onPrompt = (event: Event) => {
      // Segura o banner nativo do Chrome para disparar no nosso botão.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setSnoozed(true);
  }, []);

  /** Chrome/Edge: abre o diálogo nativo. Devolve false quando não há prompt. */
  const install = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === 'accepted') setInstalled(true);
    return outcome === 'accepted';
  }, [deferred]);

  return {
    platform,
    installed,
    inAppBrowser,
    /** Tem o prompt nativo disponível (Android/desktop). */
    canPrompt: !!deferred,
    /** Deve aparecer o convite discreto? */
    shouldOffer: !installed && !snoozed,
    install,
    dismiss,
  };
}
