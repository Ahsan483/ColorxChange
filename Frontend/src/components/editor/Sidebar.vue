<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { 
  MousePointer2, 
  Pipette, 
  Type, 
  Image as ImageIcon, 
  Sparkles, 
  Pencil 
} from 'lucide-vue-next'

const store = useEditorStore()

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'picker', icon: Pipette, label: 'Color Picker' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'image', icon: ImageIcon, label: 'Image Overlay' },
  { id: 'effect', icon: Sparkles, label: 'Effects' },
  { id: 'draw', icon: Pencil, label: 'Draw' },
]

const selectTool = (id: string) => {
  store.selectedTool = id
}
</script>

<template>
  <div class="sidebar-tools">
    <div 
      v-for="tool in tools" 
      :key="tool.id"
      class="tool-item"
      :class="{ active: store.selectedTool === tool.id }"
      @click="selectTool(tool.id)"
      :title="tool.label"
    >
      <component :is="tool.icon" :size="20" />
    </div>
  </div>
</template>

<style scoped>
.sidebar-tools {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 0 12px;
}

.tool-item {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.tool-item:hover {
  background-color: var(--bg-hover);
  color: var(--primary);
  transform: translateY(-1px);
}

.tool-item.active {
  background: var(--bg-active);
  color: var(--primary);
  box-shadow: inset 0 0 0 1px var(--primary);
}

.tool-item.active::after {
  content: '';
  position: absolute;
  right: -13px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background-color: var(--primary);
  border-radius: 4px 0 0 4px;
}
</style>
