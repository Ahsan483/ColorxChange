<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'

const props = defineProps<{
  obj: any;
  loadedImage: HTMLImageElement | undefined;
}>()

const store = useEditorStore()

defineEmits(['transformend'])
</script>

<template>
  <v-image
    v-if="loadedImage"
    :config="{
      image: loadedImage,
      x: obj.x,
      y: obj.y,
      width: obj.width || loadedImage.width,
      height: obj.height || loadedImage.height,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      rotation: obj.rotation,
      draggable: !obj.locked && store.selectedTool !== 'crop',
      listening: !obj.locked,
      name: obj.id,
      visible: obj.visible,
      opacity: obj.opacity,
      crop: obj.crop || { x: 0, y: 0, width: loadedImage.width, height: loadedImage.height }
    }"
    @transformend="$emit('transformend', $event)"
    @dragend="$emit('transformend', $event)"
  />
</template>
