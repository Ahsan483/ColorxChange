// src/worker.ts
self.onmessage = (e) => {
  const { type, data } = e.data

  if (type === 'image' || type === 'video') {
    // Count frequency of colors
    const colorCount = new Map<string, number>()
    const tolerance = 50

    const processData = (pixelData: Uint8ClampedArray) => {
      for (let i = 0; i < pixelData.length; i += 4) {
        const r = Math.round(pixelData[i] / tolerance) * tolerance
        const g = Math.round(pixelData[i + 1] / tolerance) * tolerance
        const b = Math.round(pixelData[i + 2] / tolerance) * tolerance
        const rgb = `${r},${g},${b}`
        colorCount.set(rgb, (colorCount.get(rgb) || 0) + 1)
      }
    }

    if (type === 'image') {
      processData(data)
    } else if (type === 'video') {
      for (const frame of data) {
        processData(frame)
      }
    }

    // Sort by frequency and take top 10 prominent colors
    const sortedColors = Array.from(colorCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([rgb]) => {
        const [r, g, b] = rgb.split(',').map(Number)
        const hex = `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
        return { rgb: `rgb(${rgb})`, hex }
      })

    self.postMessage({ type, colors: sortedColors })
  }
}
