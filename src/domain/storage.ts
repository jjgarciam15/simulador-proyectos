import {validSavedBudgetLines} from './budgetLines';
import {validChallenge} from './challenges';
import {validNegotiationSave} from './negotiations';
import type {CampaignVault} from './recognition';
import type { GameState } from './types';
import { scenarioById } from '../data/scenarios';
// Browser QA uses a separate save slot, so testing never replaces a user's game.
const KEY=typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('qa')==='1'?'proyecta-qa-v1':'proyecta-v1';
export interface SaveData {suspended?:GameState[];campaign?:CampaignVault;version:1;active:GameState|null;history:GameState[]}
export const emptySave:SaveData={version:1,active:null,history:[]};
export function decode(raw:string|null):SaveData{if(!raw)return structuredClone(emptySave);const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.history)||(data.suspended!==undefined&&!Array.isArray(data.suspended)))throw new Error('Formato de partida no compatible.');for(const g of [data.active,...data.history,...(data.suspended??[])].filter(Boolean)){if(g.version!==1||(!Number.isInteger(g.contentVersion)||g.contentVersion<1||g.contentVersion>scenarioById(g.scenarioId).version)||!Array.isArray(g.journal)||!Number.isFinite(g.cash)||!g.truth||!g.assumptions||!Array.isArray(g.studies))throw new Error('La partida guardada no es compatible o está incompleta.');if(g.v2&&(g.v2.version!==2||!Array.isArray(g.v2.completed)||!Array.isArray(g.v2.chain)||!Array.isArray(g.v2.connections)||!Array.isArray(g.v2.changes)||!g.v2.reviews||!g.v2.assessments||!g.v2.regulatory||!g.v2.sdgReasons||!g.v2.actorMap||!Number.isFinite(g.v2.initialCash)||!Number.isFinite(g.v2.planner)))throw new Error('Estado V2 incompleto.');if(!validSavedBudgetLines(g))throw new Error('Detalle presupuestal inválido.');if(!validChallenge(g))throw new Error('Configuración del reto inválida.');if(!validNegotiationSave(g))throw new Error('Registro de negociación inválido.');}return data;}
export function load():SaveData{return decode(localStorage.getItem(KEY))}
export function save(data:SaveData){const previous=localStorage.getItem(KEY);if(previous){try{decode(previous);}catch{localStorage.setItem(KEY+':unreadable',previous);}}localStorage.setItem(KEY,JSON.stringify(data));}
