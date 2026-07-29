'use client';

import { useState } from 'react';
import { Compass, Download, Share, SquarePlus, X } from 'lucide-react';

import { useInstall, type InstallPlatform } from '@/hooks/use-install';
import { VolleyballIcon } from './logo';

/**
 * Convite para instalar o app.
 * No Android/desktop dispara o prompt nativo; no iOS o Safari não expõe API
 * nenhuma, então o jeito é ensinar o caminho do menu Compartilhar.
 */
export function InstallBanner() {
  const { shouldOffer, platform, canPrompt, inAppBrowser, install, dismiss } =
    useInstall();
  const [showSteps, setShowSteps] = useState(false);

  if (!shouldOffer) return null;

  async function handleClick() {
    // Android/desktop: diálogo nativo. iOS (e Android sem prompt): instruções.
    const done = canPrompt && (await install());
    if (!done) setShowSteps(true);
  }

  return (
    <>
      <div className="panel mb-4 border-brand/60 bg-brand/10 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand text-canvas">
            <VolleyballIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="heading text-sm">Use como app</p>
            <p className="mt-0.5 text-xs text-fg-muted">
              Na tela inicial ele abre direto, em tela cheia, e é assim que os avisos
              de pelada chegam no celular.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Agora não"
            className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center text-fg-dim hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleClick}
          className="btn-primary mt-3 w-full text-xs"
        >
          <Download className="h-4 w-4" />
          Instalar na tela inicial
        </button>
      </div>

      {showSteps && (
        <InstallSteps
          platform={platform}
          inAppBrowser={inAppBrowser}
          onClose={() => setShowSteps(false)}
        />
      )}
    </>
  );
}

/** Botão permanente (fica no Perfil, para quem dispensou o banner). */
export function InstallButton() {
  const { installed, platform, canPrompt, inAppBrowser, install } = useInstall();
  const [showSteps, setShowSteps] = useState(false);

  if (installed) {
    return (
      <p className="badge-go">Instalado — você já está usando pelo app</p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          const done = canPrompt && (await install());
          if (!done) setShowSteps(true);
        }}
        className="btn-ghost w-full"
      >
        <Download className="h-4 w-4" /> Instalar na tela inicial
      </button>

      {showSteps && (
        <InstallSteps
          platform={platform}
          inAppBrowser={inAppBrowser}
          onClose={() => setShowSteps(false)}
        />
      )}
    </>
  );
}

/** Link discreto para a tela de login — quem chega pelo WhatsApp começa por lá. */
export function InstallHint() {
  const { installed, platform, canPrompt, inAppBrowser, install } = useInstall();
  const [showSteps, setShowSteps] = useState(false);

  if (installed) return null;

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          const done = canPrompt && (await install());
          if (!done) setShowSteps(true);
        }}
        className="mx-auto flex min-h-[44px] items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-fg-dim hover:text-brand"
      >
        <Download className="h-3.5 w-3.5" />
        Usar como app no celular
      </button>

      {showSteps && (
        <InstallSteps
          platform={platform}
          inAppBrowser={inAppBrowser}
          onClose={() => setShowSteps(false)}
        />
      )}
    </>
  );
}

function InstallSteps({
  platform,
  inAppBrowser,
  onClose,
}: {
  platform: InstallPlatform;
  inAppBrowser: boolean;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Como instalar o app"
      className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/85 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="panel safe-bottom w-full max-w-lg animate-slide-up p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading text-lg">Instalar o Bola Alta</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center text-fg-dim hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {inAppBrowser ? (
          <Step
            icon={<Compass className="h-5 w-5" />}
            number={1}
            title="Abra no navegador do celular"
            text="Você entrou por dentro de outro app. Toque nos três pontinhos e escolha “Abrir no Safari” (ou no Chrome) — só de lá dá para instalar."
          />
        ) : platform === 'ios' ? (
          <ol className="space-y-4">
            <Step
              icon={<Share className="h-5 w-5" />}
              number={1}
              title="Toque em Compartilhar"
              text="É o ícone do quadrado com a seta para cima, na barra de baixo do Safari."
            />
            <Step
              icon={<SquarePlus className="h-5 w-5" />}
              number={2}
              title="Escolha “Adicionar à Tela de Início”"
              text="Role a lista de opções até achar. Se não aparecer, confirme que você está no Safari."
            />
            <Step
              icon={<VolleyballIcon className="h-5 w-5" />}
              number={3}
              title="Confirme em “Adicionar”"
              text="Pronto: o ícone do Bola Alta vai para a tela inicial e abre em tela cheia, com os avisos de pelada."
            />
          </ol>
        ) : (
          <ol className="space-y-4">
            <Step
              icon={<Download className="h-5 w-5" />}
              number={1}
              title="Abra o menu do navegador"
              text="Toque nos três pontinhos no canto da tela."
            />
            <Step
              icon={<SquarePlus className="h-5 w-5" />}
              number={2}
              title="Escolha “Instalar app” ou “Adicionar à tela inicial”"
              text="O nome muda conforme o navegador, mas a opção é essa."
            />
          </ol>
        )}

        <button type="button" onClick={onClose} className="btn-primary mt-5 w-full">
          Entendi
        </button>
      </div>
    </div>
  );
}

function Step({
  icon,
  number,
  title,
  text,
}: {
  icon: React.ReactNode;
  number: number;
  title: string;
  text: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-brand bg-brand/15 text-brand">
        {icon}
      </span>
      <div>
        <p className="heading text-sm">
          <span className="text-brand">{number}.</span> {title}
        </p>
        <p className="mt-0.5 text-sm text-fg-muted">{text}</p>
      </div>
    </li>
  );
}
