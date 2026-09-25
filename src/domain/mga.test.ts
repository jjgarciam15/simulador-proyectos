import {describe,it,expect} from 'vitest';
import {createGame} from './engine';
import {indicatorReview} from './mga';
import type {Indicator} from './types';
const indicator:Indicator={name:'Personas atendidas',kind:'Resultado',measure:'coverage',unit:'personas',baseline:0,target:100,source:'Registro de prestación',owner:'Operador',frequency:'Mensual'};
describe('Revisión de indicadores MGA',()=>{
 it('acepta una medida consistente sin fabricar observaciones',()=>{expect(indicatorReview({...createGame('agua'),indicators:[indicator]})).toEqual([]);});
 it('detecta confundir gasto con resultado y renombrar unidades',()=>{const notes=indicatorReview({...createGame('agua'),indicators:[{...indicator,measure:'spending'}]});expect(notes).toHaveLength(2);expect(notes.some(n=>n.message.includes('uso de recursos'))).toBe(true);});
 it('detecta metas fuera de población y porcentajes fuera de escala',()=>{const g=createGame('agua');expect(indicatorReview({...g,indicators:[{...indicator,target:g.target+1}]}).some(n=>n.message.includes('población objetivo'))).toBe(true);expect(indicatorReview({...g,indicators:[{...indicator,measure:'progress',kind:'Producto',unit:'%',target:120}]}).some(n=>n.message.includes('0 a 100'))).toBe(true);});
 it('no confunde un beneficio neto negativo con una cantidad imposible',()=>{expect(indicatorReview({...createGame('agua'),indicators:[{...indicator,measure:'benefit',kind:'Impacto',unit:'M COP / año',baseline:-100,target:50}]})).toEqual([]);});
});
