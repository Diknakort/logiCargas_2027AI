import { RouteItem } from '../types/logistics';
import { REAL_WAREHOUSE_ZONES } from './warehouseMapData';

export const INITIAL_RAW_CSV = `texto,codigo,ruta
zona 127E00,,
55043 LANZADERA LOG,134001000,55043
55211 INTER SAZASA,134002000,55211
21192 RECOGE ZGZ,138005000,21192
R0810 RECOGE LOGROÑO,130010000,R0810
C0830 LOGROÑO (803-804),130009000,C0830
C0820 LOGROÑO (802-809),130008000,C0820
C0810 CD LOGROÑO (801-805),130007000,C0810
R0820 RECOGE CALAHORRA,130011000,R0820
43081 RUTA RIOJA,130002000,43081
43082 CALAHORRA,130019000,43082`;

// Linked to real handwritten area '127E00' on the blueprint
export const INITIAL_ROUTES: RouteItem[] = [
  {
    id: '127E00-55043',
    ruta: '55043',
    codigo: '134001000',
    texto: '55043 LANZADERA LOG',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-55211',
    ruta: '55211',
    codigo: '134002000',
    texto: '55211 INTER SAZASA',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-21192',
    ruta: '21192',
    codigo: '138005000',
    texto: '21192 RECOGE ZGZ',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-R0810',
    ruta: 'R0810',
    codigo: '130010000',
    texto: 'R0810 RECOGE LOGROÑO',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-C0830',
    ruta: 'C0830',
    codigo: '130009000',
    texto: 'C0830 LOGROÑO (803-804)',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-C0820',
    ruta: 'C0820',
    codigo: '130008000',
    texto: 'C0820 LOGROÑO (802-809)',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-C0810',
    ruta: 'C0810',
    codigo: '130007000',
    texto: 'C0810 CD LOGROÑO (801-805)',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-R0820',
    ruta: 'R0820',
    codigo: '130011000',
    texto: 'R0820 RECOGE CALAHORRA',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-43081',
    ruta: '43081',
    codigo: '130002000',
    texto: '43081 RUTA RIOJA',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-43082',
    ruta: '43082',
    codigo: '130019000',
    texto: '43082 CALAHORRA',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
];
