import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Truck, MapPin, Barcode } from 'lucide-react';
import { RouteItem } from '../types/logistics';
import { REAL_WAREHOUSE_ZONES } from '../data/warehouseMapData';

interface RouteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoute: (route: RouteItem) => void;
  existingRoute?: RouteItem | null;
  existingZones: string[];
}

export const RouteEditorModal: React.FC<RouteEditorModalProps> = ({
  isOpen,
  onClose,
  onSaveRoute,
  existingRoute,
  existingZones,
}) => {
  const [ruta, setRuta] = useState('');
  const [codigo, setCodigo] = useState('');
  const [texto, setTexto] = useState('');
  const [zona, setZona] = useState('zona 127E00');
  const [newZoneName, setNewZoneName] = useState('');
  const [isCreatingNewZone, setIsCreatingNewZone] = useState(false);
  const [muelleId, setMuelleId] = useState('127E00');
  const [tipoVehiculo, setTipoVehiculo] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  const [instrucciones, setInstrucciones] = useState('');

  useEffect(() => {
    if (existingRoute) {
      setRuta(existingRoute.ruta);
      setCodigo(existingRoute.codigo);
      setTexto(existingRoute.texto);
      setZona(existingRoute.zona);
      setMuelleId(existingRoute.muelleId || '127E00');
      setTipoVehiculo(existingRoute.tipoVehiculo || '');
      setHoraSalida(existingRoute.horaSalida || '');
      setInstrucciones(existingRoute.instrucciones || '');
      setIsCreatingNewZone(false);
    } else {
      setRuta('');
      setCodigo('');
      setTexto('');
      setZona(existingZones[0] || 'zona 127E00');
      setMuelleId('127E00');
      setTipoVehiculo('');
      setHoraSalida('');
      setInstrucciones('');
      setIsCreatingNewZone(false);
    }
  }, [existingRoute, existingZones, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruta.trim() || !codigo.trim()) return;

    const selectedZoneArea = REAL_WAREHOUSE_ZONES.find((z) => z.code === muelleId || z.id === muelleId) || REAL_WAREHOUSE_ZONES[7]; // 127E00
    const finalZone = isCreatingNewZone && newZoneName.trim() ? newZoneName.trim() : zona;

    const newRouteItem: RouteItem = {
      id: existingRoute ? existingRoute.id : `${finalZone}-${ruta.trim()}-${Date.now()}`,
      ruta: ruta.trim().toUpperCase(),
      codigo: codigo.trim(),
      texto: texto.trim() || `${ruta.trim()} ${finalZone}`,
      zona: finalZone,
      muelleId: selectedZoneArea.code,
      muelleNombre: selectedZoneArea.dockLabel,
      bahia: `Sector ${selectedZoneArea.code}`,
      tipoVehiculo: tipoVehiculo.trim(),
      horaSalida: horaSalida.trim(),
      instrucciones: instrucciones.trim(),
      estado: existingRoute?.estado || 'espera',
    };

    onSaveRoute(newRouteItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {existingRoute ? `Editar Ruta ${existingRoute.ruta}` : 'Registrar Nueva Ruta'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Número de Ruta *
              </label>
              <input
                type="text"
                required
                value={ruta}
                onChange={(e) => setRuta(e.target.value)}
                placeholder="Ej. 55043 o R0810"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Código de Bulto *
              </label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej. 134001000"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
              Descripción / Destino
            </label>
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ej. 55043 LANZADERA LOGROÑO"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Zona Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Zona Logística
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNewZone(!isCreatingNewZone)}
                className="text-[11px] text-amber-400 hover:underline"
              >
                {isCreatingNewZone ? 'Seleccionar existente' : '+ Crear nueva zona'}
              </button>
            </div>
            {isCreatingNewZone ? (
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="Ej. zona 131E00 NAVARRA"
                className="w-full px-3 py-2 bg-slate-950 border border-amber-500/50 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
              />
            ) : (
              <select
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
              >
                {existingZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Muelle Asignado Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
              Muelle de Carga Asignado
            </label>
            <select
              value={muelleId}
              onChange={(e) => setMuelleId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
            >
              {REAL_WAREHOUSE_ZONES.map((z) => (
                <option key={z.id} value={z.code}>
                  {z.dockLabel} — {z.wall === 'bottom' ? 'Pared Inferior' : z.wall === 'left' ? 'Pared Izquierda' : 'Pared Superior'} ({z.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Tipo Vehículo
              </label>
              <input
                type="text"
                value={tipoVehiculo}
                onChange={(e) => setTipoVehiculo(e.target.value)}
                placeholder="Tráiler 24t / Rígido"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Hora Salida
              </label>
              <input
                type="text"
                value={horaSalida}
                onChange={(e) => setHoraSalida(e.target.value)}
                placeholder="06:30"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
              Instrucciones para el Operador
            </label>
            <textarea
              rows={2}
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
              placeholder="Ej. Palet europeo con precinto verde. Dejar en pulmón A."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Ruta</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
