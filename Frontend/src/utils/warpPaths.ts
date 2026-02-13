export const getWarpPath = (style: string, width: number, height: number, amount: number): string => {
  // Amount is -100 to 100. Normalize to useful range.
  // We use the object width as the base chord length.
  
  if (style === 'none' || amount === 0) return ''

  switch (style) {
    case 'arc':
      return getArcPath(width, amount)
    case 'arc-lower':
      return getArcLowerPath(width, amount)
    case 'arch':
      return getArchPath(width, height, amount)
    case 'wave':
      return getWavePath(width, height, amount)
    default:
      return ''
  }
}

// 1. Arc (Curve Up/Down)
// A simple circular arc.
// If amount > 0, curves up (smile). If < 0, curves down (frown).
const getArcPath = (width: number, amount: number): string => {
  // Logic: Calculate a circle segment.
  // For simplicity and robustness with Konva TextPath, we can use a Quadratic Bezier or an Arc command.
  // Let's use a Quadratic Bezier (Q) for smoother "bend".
  // M startX startY Q controlX controlY endX endY
  
  const bend = -amount * 2 // Invert because canvas Y is down
  const startX = 0
  const startY = 0
  const endX = width
  const endY = 0
  
  const controlX = width / 2
  const controlY = bend
  
  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`
}

// 2. Arc Lower (Bulge? Or simply curve the baseline differently?)
// Let's make this strictly "Bulge" or "Curve Down" if user wants distinct behavior.
// Actually, 'arc' with negative amount is 'arc-lower' visually (frown). 
// But if 'arc' preserves top straight, that's 'arch'.
// Let's treat 'arc-lower' as a distinct curve if needed, otherwise alias to negative arc.
// Implementation: Simple lower curve.
const getArcLowerPath = (width: number, amount: number): string => {
   // Just an alias for now, or maybe specific logic later.
   return getArcPath(width, -amount) 
}

// 3. Arch (Squeeze top? No, TextPath only follows ONE baseline path.)
// So "Arch" usually means following a semi-circle.
const getArchPath = (width: number, height: number, amount: number): string => {
  // A steeper arch than 'arc'.
  // We can use a semi-circle approximation.
  const r = (width / 2) + ((100 - Math.abs(amount)) * 2)
  // For now, let's stick to Bezier but with higher control point.
  const bend = -amount * 4
  return `M 0 0 Q ${width / 2} ${bend} ${width} 0`
}

// 4. Wave (Sine)
const getWavePath = (width: number, height: number, amount: number): string => {
  // Cubic Bezier (C) to create an S-curve.
  // M 0 0 C cp1x cp1y, cp2x cp2y, endx endy
  const amp = amount * 1.5
  
  const cp1x = width * 0.25
  const cp1y = -amp
  
  const cp2x = width * 0.75
  const cp2y = amp
  
  return `M 0 0 C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${width} 0`
}
