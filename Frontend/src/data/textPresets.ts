import type { CanvasObject } from '../types/editor'
import { generateProceduralPresets } from './presetGenerator'

export interface TextPreset extends Partial<CanvasObject> {
  name: string;
  category: string;
}

const proceduralPresets = generateProceduralPresets()

export const textPresets: TextPreset[] = [
  // HERO PRESETS (Artisanal)
  {
    name: 'Liquid Silver',
    category: 'Luxury',
    fontFamily: 'Cinzel',
    fill: '#C0C0C0',
    gradient: {
      type: 'linear',
      rotation: 90,
      stops: [
        { offset: 0, color: '#e3e4e5' },
        { offset: 0.5, color: '#7d7e80' },
        { offset: 1, color: '#e3e4e5' }
      ]
    },
    shadow: { color: 'rgba(0,0,0,0.5)', blur: 15, offsetX: 5, offsetY: 5, opacity: 1 },
    stroke: undefined,
    strokes: [{ id: '1', color: '#ffffff', width: 1, opacity: 1 }]
  },
  {
    name: 'Electric Neon',
    category: 'Neon',
    fontFamily: 'Orbitron',
    fill: '#fff',
    shadow: { color: '#00f2ff', blur: 30, offsetX: 0, offsetY: 0, opacity: 1 },
    stroke: undefined,
    strokes: [{ id: '1', color: '#00f2ff', width: 2, opacity: 1 }]
  },
  ...proceduralPresets,
  // ... (keep existing handcrafted ones)
  // ... (keep existing 2-139) ...
  {
    name: 'Gamer Red',
    category: 'Gaming',
    fontFamily: 'Bangers',
    fill: '#ff0000',
    shadow: { color: '#000000', blur: 0, offsetX: 5, offsetY: 5, opacity: 1 },
    stroke: undefined,
    strokes: [{ id: '1', color: '#ffffff', width: 2, opacity: 1 }]
  },
  {
    name: 'Cyber Glitch',
    category: 'Gaming',
    fontFamily: 'Russo One',
    fill: '#00ffff',
    shadow: { color: '#ff00ff', blur: 0, offsetX: -4, offsetY: 0, opacity: 0.8 },
    stroke: undefined,
    strokes: [{ id: '1', color: '#ffffff', width: 1, opacity: 1 }]
  },

  // LUXURY & PREMIUM
  {
    name: 'Royal Gold',
    category: 'Luxury',
    fontFamily: 'Cinzel',
    fill: '#D4AF37',
    gradient: {
      type: 'linear',
      rotation: 45,
      stops: [
        { offset: 0, color: '#BF953F' },
        { offset: 0.5, color: '#FCF6BA' },
        { offset: 1, color: '#AA771C' }
      ]
    },
    shadow: { color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 4, offsetY: 4, opacity: 1 },
    fontStyle: '700'
  },
  {
    name: 'Platinum Elite',
    category: 'Luxury',
    fontFamily: 'Playfair Display',
    fill: '#E5E4E2',
    letterSpacing: 5,
    fontStyle: 'italic 700',
    shadow: { color: 'rgba(0,0,0,0.2)', blur: 2, offsetX: 1, offsetY: 1, opacity: 1 }
  },

  // NATURE & SPACE (New Collections)
  {
    name: 'Deep Forest',
    category: 'Nature',
    fontFamily: 'Great Vibes',
    fill: '#2d5a27',
    shadow: { color: '#000', blur: 15, offsetX: 0, offsetY: 0, opacity: 0.5 }
  },
  {
    name: 'Interstellar',
    category: 'Space',
    fontFamily: 'Orbitron',
    fill: '#ffffff',
    gradient: {
      type: 'linear',
      rotation: 0,
      stops: [
        { offset: 0, color: '#000046' },
        { offset: 1, color: '#1cb5e0' }
      ]
    },
    shadow: { color: '#00ffff', blur: 20, offsetX: 0, offsetY: 0, opacity: 0.8 }
  },

  // RETRO & VINTAGE
  {
    name: 'Miami 80s',
    category: 'Retro',
    fontFamily: 'Righteous',
    fill: '#ff00ff',
    gradient: {
      type: 'linear',
      rotation: 90,
      stops: [
        { offset: 0, color: '#00ffff' },
        { offset: 1, color: '#ff00ff' }
      ]
    },
    shadow: { color: '#000', blur: 0, offsetX: 4, offsetY: 4, opacity: 1 }
  },
  {
    name: 'VHS Static',
    category: 'Retro',
    fontFamily: 'Press Start 2P',
    fill: '#fff',
    stroke: undefined,
    strokes: [{ id: '1', color: '#000', width: 2, opacity: 1 }],
    shadow: { color: '#ff0000', blur: 0, offsetX: 2, offsetY: 0, opacity: 0.5 }
  }
]
