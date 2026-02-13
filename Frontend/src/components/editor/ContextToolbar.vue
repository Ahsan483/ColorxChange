<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Trash2,
  Type,
  Wand2,
  Crop
} from 'lucide-vue-next'

const store = useEditorStore()
const toolbarRef = ref<HTMLElement | null>(null)

const activeObject = computed(() => {
  return store.canvasObjects.find(o => o.id === store.activeLayerId)
})

const position = computed(() => {
  if (!activeObject.value) return { top: '-9999px', left: '-9999px' }
  
  // We need to access the stage to get absolute position
  const stage = (window as any).stageInstance
  if (!stage) return { top: '-9999px', left: '-9999px' }

  const node = stage.findOne('.' + activeObject.value.id)
  if (!node) return { top: '-9999px', left: '-9999px' }

  const tr = stage.findOne('Transformer')
  const box = tr ? tr.getClientRect() : node.getClientRect()
  
  return {
    top: `${box.y - 60}px`,
    left: `${box.x + box.width / 2}px`
  }
})

const toggleStyle = (style: 'bold' | 'italic') => {
  if (!activeObject.value || activeObject.value.type !== 'text') return
  
  const currentStyle = activeObject.value.fontStyle || ''
  let newStyle = currentStyle

  if (style === 'bold') {
    newStyle = currentStyle.includes('bold') 
      ? currentStyle.replace('bold', '').trim() 
      : `${currentStyle} bold`.trim()
  } else if (style === 'italic') {
    newStyle = currentStyle.includes('italic') 
      ? currentStyle.replace('italic', '').trim() 
      : `${currentStyle} italic`.trim()
  }
  
  activeObject.value.fontStyle = newStyle
  store.saveState()
}

const toggleDecoration = () => {
  if (!activeObject.value || activeObject.value.type !== 'text') return
  activeObject.value.textDecoration = activeObject.value.textDecoration === 'underline' ? '' : 'underline'
  store.saveState()
}

const setAlign = (align: 'left' | 'center' | 'right') => {
  if (!activeObject.value || activeObject.value.type !== 'text') return
  activeObject.value.align = align
  store.saveState()
}
</script>

<template>
  <div 
    v-if="activeObject && activeObject.type === 'text'"
    ref="toolbarRef"
    class="context-toolbar"
    :style="{ top: position.top, left: position.left }"
  >
    <div class="toolbar-section">
      <button 
        class="icon-btn" 
        :class="{ active: activeObject.fontStyle?.includes('bold') }"
        @click="toggleStyle('bold')"
        title="Bold"
      >
        <Bold :size="16" />
      </button>
      <button 
        class="icon-btn" 
        :class="{ active: activeObject.fontStyle?.includes('italic') }"
        @click="toggleStyle('italic')"
        title="Italic"
      >
        <Italic :size="16" />
      </button>
      <button 
        class="icon-btn" 
        :class="{ active: activeObject.textDecoration === 'underline' }"
        @click="toggleDecoration"
        title="Underline"
      >
        <Underline :size="16" />
      </button>
    </div>

    <div class="divider"></div>

    <div class="toolbar-section">
      <button 
        class="icon-btn" 
        :class="{ active: activeObject.align === 'left' }"
        @click="setAlign('left')"
      >
        <AlignLeft :size="16" />
      </button>
      <button 
        class="icon-btn" 
        :class="{ active: activeObject.align === 'center' }"
        @click="setAlign('center')"
      >
        <AlignCenter :size="16" />
      </button>
      <button 
        class="icon-btn" 
        :class="{ active: activeObject.align === 'right' }"
        @click="setAlign('right')"
      >
        <AlignRight :size="16" />
      </button>
    </div>

    <div class="divider"></div>

    <div class="toolbar-section">
      <input 
        type="color" 
        v-model="activeObject.fill" 
        class="color-picker-mini"
        @change="store.saveState()"
      />
    </div>

    <button class="delete-btn" @click="store.deleteLayer(activeObject.id)">
      <Trash2 :size="16" />
    </button>
  </div>

  <!-- Image Specific Toolbar -->
  <div 
    v-else-if="activeObject && activeObject.type === 'image'"
    ref="toolbarRef"
    class="context-toolbar"
    :style="{ top: position.top, left: position.left }"
  >
    <div class="toolbar-section">
      <button 
        class="icon-btn" 
        @click="store.removeBackground(activeObject.id)"
        title="Remove Background (Auto & Precise)"
      >
        <Wand2 :size="16" color="#8b5cf6" />
        <span class="btn-label" v-if="store.isSaving">Processing...</span>
      </button>
      
      <button 
        class="icon-btn" 
        @click="store.selectedTool = 'crop'"
        title="Crop Image"
      >
        <Crop :size="16" />
      </button>
    </div>

    <div class="divider"></div>

    <button class="delete-btn" @click="store.deleteLayer(activeObject.id)">
      <Trash2 :size="16" />
    </button>
  </div>
</template>

<style scoped>
.context-toolbar {
  position: absolute;
  transform: translateX(-50%);
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  pointer-events: auto;
  animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toolbar-section {
  display: flex;
  gap: 2px;
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background-color: var(--bg-hover);
  color: var(--primary);
}

.icon-btn.active {
  background-color: var(--bg-active);
  color: var(--primary);
}

.divider {
  width: 1px;
  height: 20px;
  background-color: var(--border-color);
}

.color-picker-mini {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  padding: 0;
  cursor: pointer;
  background: none;
}

.delete-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  padding: 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-left: 4px;
}

.delete-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.btn-label {
  font-size: 11px;
  margin-left: 4px;
  font-weight: 600;
  color: var(--primary);
}

@keyframes popIn {
  from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.9); }
  to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}
</style>
