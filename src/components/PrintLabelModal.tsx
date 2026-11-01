import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, Truck, CheckSquare, Calendar, MapPin, Barcode } from 'lucide-react';
import { RouteItem } from '../types/logistics';
import { renderBarcodeSvg, generateQrDataUrl } from '../services/barcodeService';

interface PrintLabelModalProps {
  route: RouteItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintLabelModal: React.FC<PrintLabelModalProps> = ({
  route,
  isOpen,
  onClose,
}) => {
  const barcodePrintRef = useRef<SVGSVGElement>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  useEffect(() => {
    if (!isOpen || !route) return;

    renderBarcodeSvg(barcodePrintRef.current, route.codigo, {
      height: 60,
      width: 2.0,
      displayValue: true,
      fontSize: 14,
    });

    generateQrDataUrl(route.codigo, { width: 160 }).then((url) => {
      setQrUrl(url);
    });
  }, [isOpen, route]);

  if (!isOpen || !route) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:text-black">
        
        {/* Modal Top Bar (hidden on print) */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Imprimir Etiqueta Térmica de Bulto / Muelle
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Container */}
        <div className="p-6 bg-slate-950/40 flex items-center justify-center print:p-0">
          
          {/* Physical Label (100x150mm style standard shipping label) */}
          <div 
            id="logistics-label" 
            className="w-full max-w-sm bg-white text-slate-950 border-4 border-slate-950 p-4 rounded-md shadow-2xl print:border-2 print:shadow-none font-sans"
          >
            {/* Header / Brand */}
            <div className="flex items-center justify-between border-b-2 border-slate-950 pb-2 mb-2">
              <div className="flex items-center gap-1.5 font-black text-sm tracking-tighter">
                <Truck className="w-4 h-4" />
                <span>CROSS-DOCK LOGÍSTICA</span>
              </div>
              <div className="text-[10px] font-mono font-bold text-slate-600">
                {currentDate} • {currentTime}
              </div>
            </div>

            {/* Giant Target Dock or Zone Box */}
            <div className="bg-slate-950 text-white p-2.5 text-center rounded-sm mb-2">
              <div className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                {route.muelleNombre ? 'MUELLE DE CARGA ASIGNADO' : 'ZONA / ÁREA'}
              </div>
              <div className="text-2xl font-black font-mono tracking-tight text-white">
                {route.muelleNombre ? route.muelleNombre.toUpperCase() : route.zona.toUpperCase()}
              </div>
              {route.bahia && (
                <div className="text-xs font-bold text-slate-200">
                  {route.bahia}
                </div>
              )}
            </div>

            {/* Route & Destination */}
            <div className="border border-slate-950 p-2 mb-2">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">RUTA</span>
                <span className="text-xl font-black font-mono text-slate-950">
                  {route.ruta}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 leading-tight">
                {route.texto}
              </div>
              <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                Zona / Área: <strong className="text-slate-900">{route.zona}</strong>
              </div>
            </div>

            {/* Barcode & QR Grid */}
            <div className="border-t-2 border-slate-950 pt-2 flex flex-col items-center">
              <div className="w-full flex justify-center py-1">
                <svg ref={barcodePrintRef} className="max-w-full" />
              </div>
              <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-slate-300">
                <div className="text-left text-[10px] space-y-0.5">
                  <div>CÓDIGO: <strong className="font-mono">{route.codigo}</strong></div>
                  {route.muelleNombre && <div>MUELLE: <strong>{route.muelleNombre}</strong></div>}
                  {route.horaSalida && <div>SALIDA: <strong className="font-mono">{route.horaSalida}</strong></div>}
                  {route.tipoVehiculo && <div>VEHÍCULO: <strong>{route.tipoVehiculo}</strong></div>}
                </div>
                {qrUrl && (
                  <img src={qrUrl} alt="QR" className="w-16 h-16 border border-slate-950 p-0.5" />
                )}
              </div>
            </div>

            {/* Operator Checklist Checkboxes */}
            <div className="mt-3 pt-2 border-t border-dashed border-slate-400 grid grid-cols-2 gap-2 text-[9px] text-slate-700">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 border border-slate-950 rounded-sm"></div>
                <span>Bultos Validados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 border border-slate-950 rounded-sm"></div>
                <span>Ubicado en Muelle</span>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Actions (hidden on print) */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-400">
            Formato optimizado para impresoras térmicas Zebra / Honeywell
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
