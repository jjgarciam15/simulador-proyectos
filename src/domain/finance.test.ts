import { describe,it,expect } from 'vitest';
import { npv,irr,annuity,metrics,payback,hhi,random } from './finance';
describe('Indicadores financieros',()=>{
 it('calcula VPN, TIR, B/C, CAUE y paybacks con valores conocidos',()=>{const m=metrics([100,0,0],[0,60,60],.1);expect(m.npv).toBeCloseTo(4.132231405);expect(m.irr).toBeCloseTo(.130662386);expect(m.bc).toBeCloseTo(1.041322314);expect(m.caue).toBeCloseTo(57.6190476);expect(m.payback).toBeCloseTo(1.6666667);expect(m.discountedPayback).toBeCloseTo(1.9166667)});
 it('maneja tasa cero, pérdida, horizonte insuficiente y flujos no convencionales',()=>{expect(npv([-100,40,40],0)).toBe(-20);expect(annuity(100,0,5)).toBe(20);expect(payback([-100,40,40])).toBeNull();expect(irr([-100,-20])).toBeNull();expect(irr([-100,230,-132])).toBe('multiple');expect(irr([-100,50])).toBeCloseTo(-.5);expect(metrics([0,0],[0,10],0).bc).toBeNull()});
 it('conserva concentración y aleatoriedad reproducible',()=>{expect(hhi([70,20,10])).toBe(5400);expect(hhi([25,25,25,25])).toBe(2500);expect(random('PROY-1','shock')).toBe(random('PROY-1','shock'));expect(random('PROY-2','shock')).not.toBe(random('PROY-1','shock'))});
});
