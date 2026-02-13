// src/worker.ts

/**
 * CIELAB color space utilities for 100% accurate color replacement
 */

// RGB to XYZ
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  let _r = r / 255
  let _g = g / 255
  let _b = b / 255

  _r = (_r > 0.04045 ? Math.pow((_r + 0.055) / 1.055, 2.4) : _r / 12.92) * 100
  _g = (_g > 0.04045 ? Math.pow((_g + 0.055) / 1.055, 2.4) : _g / 12.92) * 100
  _b = (_b > 0.04045 ? Math.pow((_b + 0.055) / 1.055, 2.4) : _b / 12.92) * 100

  const x = _r * 0.4124 + _g * 0.3576 + _b * 0.1805
  const y = _r * 0.2126 + _g * 0.7152 + _b * 0.0722
  const z = _r * 0.0193 + _g * 0.1192 + _b * 0.9505

  return [x, y, z]
}

// XYZ to CIELAB (D65 illuminant)
function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  let _x = x / 95.047
  let _y = y / 100.0
  let _z = z / 108.883

  _x = _x > 0.008856 ? Math.pow(_x, 1 / 3) : 7.787 * _x + 16 / 116
  _y = _y > 0.008856 ? Math.pow(_y, 1 / 3) : 7.787 * _y + 16 / 116
  _z = _z > 0.008856 ? Math.pow(_z, 1 / 3) : 7.787 * _z + 16 / 116

  const l = 116 * _y - 16
  const a = 500 * (_x - _y)
  const b = 200 * (_y - _z)

  return [l, a, b]
}

// CIELAB to XYZ
function labToXyz(l: number, a: number, b: number): [number, number, number] {
  let _y = (l + 16) / 116
  let _x = a / 500 + _y
  let _z = _y - b / 200

  _x = Math.pow(_x, 3) > 0.008856 ? Math.pow(_x, 3) : (_x - 16 / 116) / 7.787
  _y = Math.pow(_y, 3) > 0.008856 ? Math.pow(_y, 3) : (_y - 16 / 116) / 7.787
  _z = Math.pow(_z, 3) > 0.008856 ? Math.pow(_z, 3) : (_z - 16 / 116) / 7.787

  const x = _x * 95.047
  const y = _y * 100.0
  const z = _z * 108.883

  return [x, y, z]
}

// XYZ to RGB
function xyzToRgb(x: number, y: number, z: number): [number, number, number] {
  let _x = x / 100
  let _y = y / 100
  let _z = z / 100

  let _r = _x * 3.2406 + _y * -1.5372 + _z * -0.4986
  let _g = _x * -0.9689 + _y * 1.8758 + _z * 0.0415
  let _b = _x * 0.0557 + _y * -0.204 + _z * 1.057

  _r = (_r > 0.0031308 ? 1.055 * Math.pow(_r, 1 / 2.4) - 0.055 : 12.92 * _r) * 255
  _g = (_g > 0.0031308 ? 1.055 * Math.pow(_g, 1 / 2.4) - 0.055 : 12.92 * _g) * 255
  _b = (_b > 0.0031308 ? 1.055 * Math.pow(_b, 1 / 2.4) - 0.055 : 12.92 * _b) * 255

  return [
    Math.min(255, Math.max(0, Math.round(_r))),
    Math.min(255, Math.max(0, Math.round(_g))),
    Math.min(255, Math.max(0, Math.round(_b)))
  ]
}

// DeltaE CIE76 (Euclidean in LAB space)
function deltaE76(lab1: [number, number, number], lab2: [number, number, number]) {
  return Math.sqrt(
    Math.pow(lab1[0] - lab2[0], 2) +
    Math.pow(lab1[1] - lab2[1], 2) +
    Math.pow(lab1[2] - lab2[2], 2)
  )
}

self.onmessage = (e) => {
  const { type, data } = e.data

  if (type === 'extract') {
    const colorCount = new Map<string, number>()
    const pixelData = data as Uint8ClampedArray
    const step = 4
    for (let i = 0; i < pixelData.length; i += 4 * step) {
      const r = pixelData[i]
      const g = pixelData[i + 1]
      const b = pixelData[i + 2]
      const rgb = `${r},${g},${b}`
      colorCount.set(rgb, (colorCount.get(rgb) || 0) + 1)
    }

    const sortedColors = Array.from(colorCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([rgb]) => {
        const [r, g, b] = rgb.split(',').map(Number)
        return { rgb: `rgb(${rgb})`, hex: `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}` }
      })

    self.postMessage({ type: 'extracted', colors: sortedColors })
  }

  if (type === 'apply') {
    const { imageData, replacements, tolerance } = data
    const pixels = new Uint8ClampedArray(imageData)
    
    const replacementLabs = replacements.map((r: any) => {
      const [oR, oG, oB] = r.original.replace('rgb(', '').replace(')', '').split(',').map(Number)
      const nR = parseInt(r.newColor.slice(1, 3), 16)
      const nG = parseInt(r.newColor.slice(3, 5), 16)
      const nB = parseInt(r.newColor.slice(5, 7), 16)
      
      const xyzOrig = rgbToXyz(oR, oG, oB)
      const labOrig = xyzToLab(xyzOrig[0], xyzOrig[1], xyzOrig[2])
      
      const xyzNew = rgbToXyz(nR, nG, nB)
      const labNew = xyzToLab(xyzNew[0], xyzNew[1], xyzNew[2])

      return {
        originalLab: labOrig,
        newLab: labNew,
        transparent: r.transparent
      }
    })

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      
      const xyz = rgbToXyz(r, g, b)
      const currentLab = xyzToLab(xyz[0], xyz[1], xyz[2])

      for (const trans of replacementLabs) {
        const diff = deltaE76(currentLab, trans.originalLab)
        
        if (diff <= tolerance) {
          if (trans.transparent) {
            pixels[i + 3] = 0
          } else {
            const finalXyz = labToXyz(currentLab[0], trans.newLab[1], trans.newLab[2])
            const finalRgb = xyzToRgb(finalXyz[0], finalXyz[1], finalXyz[2])
            
            pixels[i] = finalRgb[0]
            pixels[i + 1] = finalRgb[1]
            pixels[i + 2] = finalRgb[2]
          }
          break
        }
      }
    }

    self.postMessage({ type: 'applied', imageData: pixels }, { transfer: [pixels.buffer] } as any)
  }

  if (type === 'effect') {
    const { imageData, effectType, intensity } = data
    const pixels = new Uint8ClampedArray(imageData)

    if (effectType === 'thermal') {
      for (let i = 0; i < pixels.length; i += 4) {
        const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
        pixels[i] = avg > 128 ? 255 : avg * 2
        pixels[i + 1] = avg
        pixels[i + 2] = 255 - avg
      }
    } else if (effectType === 'glitch') {
      const shift = Math.floor(intensity * 10)
      for (let i = 0; i < pixels.length - shift * 4; i += 4) {
        if (Math.random() < 0.05 * intensity) {
          pixels[i] = pixels[i + shift * 4]
          pixels[i + 2] = pixels[Math.max(0, i - shift * 4)]
        }
      }
    } else if (effectType === 'vintage') {
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = pixels[i] * 0.9 + 30
        pixels[i + 1] = pixels[i + 1] * 0.7 + 10
        pixels[i + 2] = pixels[i + 2] * 0.5
      }
    }

    self.postMessage({ type: 'effect_applied', imageData: pixels }, { transfer: [pixels.buffer] } as any)
  }

  if (type === 'background_removal') {
    const { imageData, tolerance = 30 } = data
    const pixels = new Uint8ClampedArray(imageData)
    
    // Sample corners for potential background colors
    const samples = [
      { r: pixels[0], g: pixels[1], b: pixels[2] }, // Top-left
      { r: pixels[pixels.length - 4], g: pixels[pixels.length - 3], b: pixels[pixels.length - 2] } // Bottom-right
    ]
    
    const bgLabs = samples.map(s => {
      const xyz = rgbToXyz(s.r, s.g, s.b)
      return xyzToLab(xyz[0], xyz[1], xyz[2])
    })

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const a = pixels[i + 3]
      
      if (a === 0) continue

      const xyz = rgbToXyz(r, g, b)
      const currentLab = xyzToLab(xyz[0], xyz[1], xyz[2])

      for (const bgLab of bgLabs) {
        const diff = deltaE76(currentLab, bgLab)
        if (diff <= tolerance) {
          pixels[i + 3] = 0 // Transparent
          break
        }
      }
    }

    self.postMessage({ type: 'bg_removed', imageData: pixels }, { transfer: [pixels.buffer] } as any)
  }
}
