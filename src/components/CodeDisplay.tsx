import React, { useEffect, useRef, useState } from 'react';
import { 
  Barcode, 
  QrCode, 
  Maximize2, 
  Minimize2, 
  Printer, 
  Copy, 
  Check, 
  MapPin, 
  Volume2, 
  ArrowRight,
  ShieldAlert,
  Clock,
  Layers,
  Box
} from 'lucide-react';
import { RouteItem } from '../types/logistics';
import { renderBarcodeSvg, generateQrDataUrl, playScannerBeep } from '../services/barcodeService';

interface CodeDisplayProps {
  route: RouteItem | null;
  onNavigateToMap: () => void;
  onOpenPrintLabel: () => void;
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({
  route,
  onNavigateToMap,
  onOpenPrintLabel,
}) => {
  const barcodeSvgRef = useRef<SVGSVGElement>(null);
  const fullScreenBarcodeSvgRef = useRef<SVGSVGElement>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'both' | 'barcode' | 'qr'>('both');
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (!route) return;

    // Render Barcode
    renderBarcodeSvg(barcodeSvgRef.current, route.codigo, {
      height: 85,
      width: 2.2,
      displayValue: true,
      fontSize: 16,
    });

    if (isFullScreen) {
      renderBarcodeSvg(fullScreenBarcodeSvgRef.current, route.codigo, {
        height: 140,
        width: 3.2,
        displayValue: true,
        fontSize: 22,
      });
    }

    // Render QR
    generateQrDataUrl(route.codigo, { width: 320 }).then((url) => {
      setQrUrl(url);
    });
  }, [route, isFullScreen]);

  const handleCopy = () => {
    if (!route) return;
    navigator.clipboard.writeText(route.codigo);
    setCopied(true);
    playScannerBeep('success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSoundTest = () => {
    playScannerBeep('success');
  };

  if (!route) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-4 border border-slate-700">
          <Barcode className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Ninguna ruta seleccionada</h3>
        <p className="text-sm text-slate-400 max-w-sm mb-4">
          Escribe un número de ruta o haz clic en cualquiera de las rutas de prueba para generar sus códigos y ver su muelle asignado.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-6 border-b border-slate-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-mono font-black text-lg tracking-wider shadow">
                  RUTA {route.ruta}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {route.zona}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    route.estado === 'en_carga'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : route.estado === 'completado'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {route.estado === 'en_carga' ? 'En Carga' : route.estado === 'completado' ? 'Completado' : 'Pendiente'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {route.texto}
              </h2>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullScreen(true)}
                title="Modo Pistola / Pantalla Completa"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold shadow hover:text-white transition"
              >
                <Maximize2 className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Modo Pistola</span>
              </button>
              <button
                onClick={onOpenPrintLabel}
                title="Imprimir etiqueta de envío"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold shadow hover:text-white transition"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Etiqueta</span>
              </button>
            </div>
          </div>

          {/* Numerical Code Card */}
          <div className="mt-4 p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Código Numérico de Bulto / Albarán
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-wider">
                  {route.codigo}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleSoundTest}
                title="Probar sonido de escáner"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold font-mono transition shadow ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab switch for Barcode / QR display */}
        <div className="px-4 sm:px-6 pt-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveCodeTab('both')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition ${
                activeCodeTab === 'both'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Ambos Códigos (1D + 2D)
            </button>
            <button
              onClick={() => setActiveCodeTab('barcode')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
                activeCodeTab === 'barcode'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Barcode className="w-4 h-4" />
              Solo Código de Barras
            </button>
            <button
              onClick={() => setActiveCodeTab('qr')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
                activeCodeTab === 'qr'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4" />
              Solo Código QR
            </button>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Formato: Code 128 & QR Estándar ISO
          </span>
        </div>

        {/* Codes Display Canvas / SVG Area */}
        <div className="p-4 sm:p-6 bg-slate-950/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Barcode Box */}
            {(activeCodeTab === 'both' || activeCodeTab === 'barcode') && (
              <div
                className={`p-4 rounded-xl bg-white flex flex-col items-center justify-center border-4 border-slate-200 shadow-lg text-slate-950 ${
                  activeCodeTab === 'barcode' ? 'md:col-span-2 py-8' : ''
                }`}
              >
                <div className="w-full flex items-center justify-between mb-2 text-slate-500 text-[11px] font-mono uppercase tracking-wider">
                  <span className="font-bold flex items-center gap-1 text-slate-800">
                    <Barcode className="w-4 h-4 text-amber-600" />
                    Código de Barras 1D (Code 128)
                  </span>
                  <span>Escáner Láser PDA</span>
                </div>
                <div className="w-full flex justify-center overflow-x-auto py-2">
                  <svg ref={barcodeSvgRef} className="max-w-full h-auto" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Lectura instantánea compatible con pistolas Honeywell, Zebra, Datalogic
                </p>
              </div>
            )}

            {/* QR Code Box */}
            {(activeCodeTab === 'both' || activeCodeTab === 'qr') && (
              <div
                className={`p-4 rounded-xl bg-white flex flex-col items-center justify-center border-4 border-slate-200 shadow-lg text-slate-950 ${
                  activeCodeTab === 'qr' ? 'md:col-span-2 py-8' : ''
                }`}
              >
                <div className="w-full flex items-center justify-between mb-2 text-slate-500 text-[11px] font-mono uppercase tracking-wider">
                  <span className="font-bold flex items-center gap-1 text-slate-800">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    Código QR 2D
                  </span>
                  <span>Cámara / Terminal 2D</span>
                </div>
                {qrUrl ? (
                  <div className="p-2 bg-white rounded-lg">
                    <img
                      src={qrUrl}
                      alt={`QR Code ${route.codigo}`}
                      className="w-40 h-40 sm:w-44 sm:h-44 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                    Generando QR...
                  </div>
                )}
                <span className="font-mono font-bold text-sm text-slate-900 mt-2">
                  {route.codigo}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Dock Card & Real Excel Data Banner */}
        <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Dock Highlight Box */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-gradient-to-r from-blue-950/60 to-slate-850 border border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                  <MapPin className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                    Ubicación de Muelle
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    {route.muelleNombre ? (
                      <>
                        {route.muelleNombre}
                        {route.bahia && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            {route.bahia}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 text-lg font-bold">
                        Pendiente de plano de la nave
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {route.instrucciones || (route.muelleNombre ? 'Depositar bulto en el muelle indicado.' : 'La asignación del muelle se activará cuando entregues el plano del almacén.')}
                  </p>
                </div>
              </div>

              <button
                onClick={onNavigateToMap}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-wide shadow flex items-center justify-center gap-2 shrink-0 transition"
              >
                <span>Ver Mapa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Real Excel Attributes */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Zona / Área:</span>
                <span className="font-semibold text-amber-300">{route.zona}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nº de Ruta:</span>
                <span className="font-mono font-bold text-white">{route.ruta}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Código de Bulto:</span>
                <span className="font-mono font-bold text-amber-400">{route.codigo}</span>
              </div>
              {route.tipoVehiculo ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tipo Vehículo:</span>
                  <span className="font-semibold text-white">{route.tipoVehiculo}</span>
                </div>
              ) : null}
              {route.horaSalida ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Salida:</span>
                  <span className="font-mono font-bold text-white">{route.horaSalida}</span>
                </div>
              ) : null}
            </div>

          </div>
        </div>
      </div>

      {/* FULLSCREEN PISTOL / SCANNER MODE MODAL */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-white text-slate-950 flex flex-col items-center justify-between p-6 sm:p-10 select-none">
          <div className="w-full flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded bg-black text-white font-mono font-black text-xl">
                RUTA {route.ruta}
              </span>
              <span className="text-lg font-bold text-slate-800">{route.texto}</span>
            </div>
            <button
              onClick={() => setIsFullScreen(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center gap-2 hover:bg-slate-800"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Cerrar Pantalla Completa</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center my-auto w-full max-w-4xl text-center space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 font-bold text-sm uppercase tracking-wider">
              Modo Pistola de Alta Visibilidad (Cero Reflejos)
            </div>

            {/* Giant Monospace Code */}
            <div className="text-4xl sm:text-6xl font-mono font-black tracking-widest text-black">
              {route.codigo}
            </div>

            {/* Large Crisp Barcode */}
            <div className="w-full flex justify-center py-4 bg-white">
              <svg ref={fullScreenBarcodeSvgRef} className="max-w-full" />
            </div>

            {/* QR side by side or below */}
            {qrUrl && (
              <div className="flex items-center gap-4">
                <img src={qrUrl} alt="QR" className="w-44 h-44 border-4 border-black p-2" />
                {route.muelleNombre ? (
                  <div className="text-left">
                    <div className="text-xs uppercase font-bold text-slate-500">Muelle de destino:</div>
                    <div className="text-3xl font-black text-blue-700">{route.muelleNombre}</div>
                    {route.bahia && <div className="text-sm font-semibold text-slate-700">{route.bahia}</div>}
                  </div>
                ) : (
                  <div className="text-left">
                    <div className="text-xs uppercase font-bold text-slate-500">Zona / Área:</div>
                    <div className="text-2xl font-black text-slate-800">{route.zona}</div>
                    <div className="text-xs text-slate-500">Muelle pendiente de plano</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-full text-center text-xs text-slate-500 border-t pt-3">
            Pulsa ESC o el botón Cerrar para volver a la aplicación
          </div>
        </div>
      )}
    </>
  );
};
