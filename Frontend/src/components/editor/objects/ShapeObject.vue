<script setup lang="ts">
const props = defineProps<{
  obj: any;
}>()

defineEmits(['transformend'])
</script>

<template>
  <v-rect
    :config="{
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      fill: obj.fill || '#ff0000',
      opacity: obj.opacity || 1,
      rotation: obj.rotation || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      name: obj.id,
      draggable: !obj.locked,
      listening: !obj.locked,
      clipX: obj.crop?.x || 0,
      clipY: obj.crop?.y || 0,
      clipWidth: obj.crop?.width || 9999,
      clipHeight: obj.crop?.height || 9999
    }"
    @transformend="$emit('transformend', $event)"
    @dragend="$emit('transformend', $event)"
  />
</template>
