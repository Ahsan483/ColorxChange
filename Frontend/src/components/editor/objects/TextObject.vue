<script setup lang="ts">
import { computed } from 'vue'
import { getWarpPath } from '@/utils/warpPaths'

const props = defineProps<{
  obj: any;
  patternImages: Record<string, HTMLImageElement>;
}>()

defineEmits(['transformend'])
</script>

<template>
  <v-group
    :config="{
      x: obj.x || 0,
      y: obj.y || 0,
      rotation: obj.rotation || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      draggable: !obj.locked,
      name: obj.id,
      visible: obj.visible,
      opacity: obj.opacity,
      globalCompositeOperation: obj.blendMode || 'source-over',
      listening: !obj.locked,
      clipX: obj.crop?.x || 0,
      clipY: obj.crop?.y || 0,
      clipWidth: obj.crop?.width || 9999,
      clipHeight: obj.crop?.height || 9999
    }"
    @transformend="$emit('transformend', $event)"
    @dragend="$emit('transformend', $event)"
  >
    <!-- NORMAL TEXT RENDERING -->
    <template v-if="!obj.warp || obj.warp.style === 'none'">
      <!-- 1. Background Shadows -->
      <v-text
        v-for="(shadow, index) in obj.shadows"
        :key="`shadow-${index}`"
        :config="{
          text: obj.text,
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          fontStyle: obj.fontStyle,
          textDecoration: obj.textDecoration,
          align: obj.align,
          width: obj.width,
          letterSpacing: obj.letterSpacing,
          lineHeight: obj.lineHeight,
          fill: 'transparent',
          shadowColor: shadow.color,
          shadowBlur: shadow.blur,
          shadowOffsetX: shadow.offsetX,
          shadowOffsetY: shadow.offsetY,
          shadowOpacity: shadow.opacity ?? 1,
          shadowEnabled: true,
          opacity: shadow.opacity ?? 1,
          listening: false
        }"
      />
      <!-- 2. Strokes -->
      <v-text
        v-for="(stroke, index) in obj.strokes"
        :key="`stroke-${index}`"
        :config="{
          text: obj.text,
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          fontStyle: obj.fontStyle,
          textDecoration: obj.textDecoration,
          align: obj.align,
          width: obj.width,
          letterSpacing: obj.letterSpacing,
          lineHeight: obj.lineHeight,
          stroke: stroke.color,
          strokeWidth: stroke.width,
          fill: 'transparent',
          opacity: stroke.opacity ?? 1,
          listening: false,
          perfectDrawEnabled: true
        }"
      />
      <!-- 3. Main Text -->
      <v-text
        :config="{
          text: obj.text,
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          fontStyle: obj.fontStyle,
          textDecoration: obj.textDecoration,
          width: obj.width,
          fillPriority: obj.fillType === 'pattern' ? 'pattern' : (obj.fillType === 'gradient' ? (obj.gradient?.type === 'linear' ? 'linear-gradient' : 'radial-gradient') : 'color'),
          fill: obj.fill || '#000000',
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: obj.gradient ? { 
            x: (obj.width || 200) * Math.cos((obj.gradient.rotation || 0) * Math.PI / 180), 
            y: (obj.height || 50) * Math.sin((obj.gradient.rotation || 0) * Math.PI / 180) 
          } : { x: 0, y: 0 },
          fillLinearGradientColorStops: obj.gradient?.stops ? obj.gradient.stops.flatMap((s: any) => [s.offset, s.color]) : [],
          fillPatternImage: patternImages[obj.id] || null,
          fillPatternRepeat: obj.pattern?.repeat || 'repeat',
          fillPatternScaleX: obj.pattern?.scaleX || 1,
          fillPatternScaleY: obj.pattern?.scaleY || 1,
          fillPatternRotation: obj.pattern?.rotation || 0,
          filters: obj.noise && obj.noise > 0 ? [(window as any).Konva.Filters.Noise] : [],
          noise: obj.noise || 0,
          letterSpacing: obj.letterSpacing || 0,
          lineHeight: obj.lineHeight || 1.2,
          align: obj.align || 'left',
          listening: true
        }"
      />
    </template>

    <!-- WARP RENDERING -->
    <template v-else>
      <v-text-path
        :config="{
          data: getWarpPath(obj.warp.style, obj.width || 300, obj.height || 50, obj.warp.amount),
          text: obj.text,
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          fontStyle: obj.fontStyle,
          textDecoration: obj.textDecoration,
          align: 'center',
          fillPriority: obj.fillType === 'pattern' ? 'pattern' : (obj.fillType === 'gradient' ? 'linear-gradient' : 'color'),
          fill: obj.fill || '#000000',
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: obj.fontSize },
          fillLinearGradientColorStops: obj.gradient?.stops ? obj.gradient.stops.flatMap((s: any) => [s.offset, s.color]) : [],
          fillPatternImage: patternImages[obj.id] || null,
          listening: true
        }"
      />
    </template>
  </v-group>
</template>
