import type { TextPreset } from './textPresets'

const COLORS = {
  luxury: ['#BF953F', '#FCF6BA', '#B3812E', '#FBF5B7', '#AA771C'],
  neon: ['#ff00ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000', '#ff5e00'],
  pastel: ['#ffb3ba', '#bae1ff', '#baffc9', '#ffffba', '#ffdfba', '#e0bbff'],
  modern: ['#1a1a1a', '#ffffff', '#2980b9', '#27ae60', '#e74c3c'],
  nature: ['#2d5a27', '#8b4513', '#4682b4', '#556b2f', '#f4a460'],
  space: ['#0f0c29', '#302b63', '#24243e', '#7f00ff', '#e100ff'],
  wedding: ['#f8f9fa', '#ffeef2', '#e9ecef', '#ffd1dc', '#f3e5f5'],
  corporate: ['#003366', '#004080', '#0059b3', '#0073e6', '#0080ff'],
  kids: ['#ff6f61', '#6b5b95', '#88b04b', '#f7cac9', '#92a8d1'],
  fashion: ['#2e2a2b', '#c2185b', '#7b1fa2', '#512da8', '#303f9f']
}

const FONTS = {
  Gaming: ['Orbitron', 'Russo One', 'Bungee', 'Press Start 2P', 'Staatliches', 'Alfa Slab One', 'Titan One'],
  Luxury: ['Cinzel', 'Playfair Display', 'Abril Fatface', 'Cinzel Decorative', 'Cormorant Garamond', 'Great Vibes'],
  Modern: ['Inter', 'Montserrat', 'Roboto', 'Oswald', 'Poppins', 'Lato'],
  Retro: ['Righteous', 'Permanent Marker', 'Monoton', 'Lobster', 'Pacifico', 'Shadows Into Light'],
  Business: ['Source Sans Pro', 'Merriweather', 'PT Serif', 'Lora'],
}

export function generateProceduralPresets(): TextPreset[] {
  const presets: TextPreset[] = []

  // Helper to get random item
  const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const categories = Object.keys(COLORS) as Array<keyof typeof COLORS>
  
  // Create 100 presets per category to reach 1000+
  categories.forEach(cat => {
    for (let i = 0; i < 110; i++) {
      const color = random(COLORS[cat])
      const fontCat = cat === 'luxury' ? 'Luxury' : 
                     (cat === 'neon' || cat === 'space') ? 'Gaming' :
                     (cat === 'corporate' || cat === 'modern') ? 'Modern' : 
                     (cat === 'kids' || cat === 'pastel') ? 'Retro' : 'Modern'
      const font = random(FONTS[fontCat as keyof typeof FONTS] || FONTS.Modern)
      
      const preset: TextPreset = {
        name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} ${font} ${i + 1}`,
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
        fontFamily: font,
        fill: color,
        shadow: { color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 3, offsetY: 3, opacity: 1 },
        stroke: { color: '#ffffff', width: 0, enabled: false },
        letterSpacing: Math.random() > 0.8 ? 5 : 0
      }

      // Add special effects based on category
      if (cat === 'neon') {
        preset.shadow = { color: color, blur: 25, offsetX: 0, offsetY: 0, opacity: 1 }
        preset.stroke = { color: '#ffffff', width: 1, enabled: true }
      } else if (cat === 'luxury') {
        preset.gradient = {
          type: 'linear',
          angle: 45,
          colors: [
            { offset: 0, color: color },
            { offset: 0.5, color: '#ffffff' },
            { offset: 1, color: color }
          ]
        }
      } else if (cat === 'space') {
        preset.gradient = {
          type: 'linear',
          angle: 90,
          colors: [
            { offset: 0, color: color },
            { offset: 1, color: '#000000' }
          ]
        }
        preset.shadow = { color: color, blur: 15, offsetX: 0, offsetY: 0, opacity: 0.8 }
      }

      presets.push(preset)
    }
  })

  return presets
}
