<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { Eye, EyeOff, Lock, Unlock, Trash2 } from 'lucide-vue-next'

const store = useEditorStore()
const draggedId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

// Display layers in reverse order (Top layer first in list)
const displayLayers = computed(() => [...store.canvasObjects].reverse())

const onDragStart = (e: DragEvent, id: string) => {
  draggedId.value = id
  if (e.dataTransfer) {
     e.dataTransfer.effectAllowed = 'move'
     e.dataTransfer.dropEffect = 'move'
  }
}

const onDrop = () => {
  if (draggedId.value && dragOverId.value && draggedId.value !== dragOverId.value) {
     // Find real indices in the store (which is bottom-up)
     // displayLayers is top-down
     const fromIndex = store.canvasObjects.findIndex(o => o.id === draggedId.value)
     const toIndex = store.canvasObjects.findIndex(o => o.id === dragOverId.value)
     
     if (fromIndex !== -1 && toIndex !== -1) {
       store.moveLayer(fromIndex, toIndex)
     }
  }
  draggedId.value = null
  dragOverId.value = null
}
</script>

<template>
  <div class="layers-container">
    <div class="layers-header">
      <span>LAYERS</span>
    </div>
    
    <div class="layers-list" @dragover.prevent @drop="onDrop">
      <!-- Functional Layers (Reversed order for display: Top layer first) -->
      <div 
        v-for="(layer, index) in displayLayers" 
        :key="layer.id"
        class="layer-item"
        :class="{ active: store.activeLayerId === layer.id, dragging: draggedId === layer.id }"
        @click="store.activeLayerId = layer.id"
        draggable="true"
        @dragstart="onDragStart($event, layer.id)"
        @dragenter.prevent="dragOverId = layer.id"
      >
        <div class="drag-handle">⋮⋮</div>
        <div class="layer-icon">{{ layer.type === 'text' ? 'T' : (layer.type === 'image' ? 'IMG' : 'S') }}</div>
        
        <div class="layer-content">
           <div class="layer-top-row">
              <span class="layer-name">{{ layer.text ? layer.text.substring(0, 15) : (layer.type + ' ' + index) }}</span>
              <div class="layer-actions">
                <button class="action-btn" @click.stop="store.toggleVisibility(layer.id)">
                   <component :is="layer.visible ? Eye : EyeOff" :size="14" />
                </button>
                <button class="action-btn" @click.stop="store.toggleLock(layer.id)">
                   <component :is="layer.locked ? Lock : Unlock" :size="14" :color="layer.locked ? '#8b5cf6' : '#666'" />
                </button>
                <button class="action-btn delete" @click.stop="store.deleteLayer(layer.id)"><Trash2 :size="14" /></button>
              </div>
           </div>
           
           <!-- Extended Controls (Only for active layer) -->
           <div v-if="store.activeLayerId === layer.id" class="layer-details" @click.stop>
              <div class="control-row">
                 <select v-model="layer.blendMode" @change="store.saveState()" class="mini-select">
                    <option value="normal">Normal</option>
                    <option value="multiply">Multiply</option>
                    <option value="screen">Screen</option>
                    <option value="overlay">Overlay</option>
                    <option value="darken">Darken</option>
                    <option value="lighten">Lighten</option>
                    <option value="color-dodge">Color Dodge</option>
                    <option value="color-burn">Color Burn</option>
                    <option value="hard-light">Hard Light</option>
                    <option value="soft-light">Soft Light</option>
                    <option value="difference">Difference</option>
                    <option value="exclusion">Exclusion</option>
                    <option value="hue">Hue</option>
                    <option value="saturation">Saturation</option>
                    <option value="color">Color</option>
                    <option value="luminosity">Luminosity</option>
                 </select>
                 <input type="range" v-model.number="layer.opacity" min="0" max="1" step="0.05" class="mini-range" @change="store.saveState()" />
              </div>
           </div>
        </div>
      </div>
      
      <!-- Background Image Layer (Always at bottom) -->
      <div 
        v-if="store.uploadedFile"
        class="layer-item static"
        :class="{ active: store.activeLayerId === 'main-image' }"
        @click="store.activeLayerId = 'main-image'"
      >
        <div class="layer-icon">IMG</div>
        <div class="layer-info"><span class="layer-name">Background</span></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layers-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-panel);
  /* border-top handled by parent */
}

/* Header is also handled by skeleton usually, but we keep this for internal structure */
.layers-header {
  padding: 12px 16px;
  background-color: var(--bg-panel);
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-color);
  display: none; /* Hidden because Skeleton has a header now */
}

.layers-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

/* ... existing styles ... */
.layer-item {
  display: flex;
  flex-direction: column; /* Changed to allow details expansion */
  padding: 0;
  border-bottom: 1px solid var(--border-color);
  margin: 0 8px 8px 8px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-panel);
  border: 1px solid var(--border-color);
  transition: border-color 0.2s;
}

.layer-item.dragging {
  opacity: 0.5;
  border: 2px dashed var(--primary);
}

.layer-top-row {
  display: flex;
  align-items: center;
  padding: 8px;
  width: 100%;
}

.layer-content {
  flex: 1;
  min-width: 0;
}

.drag-handle {
  cursor: grab;
  color: var(--text-muted);
  font-size: 10px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  height: 100%;
}

.layer-details {
  padding: 8px;
  background-color: var(--bg-app);
  border-top: 1px solid var(--border-color);
}

.control-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mini-select {
  flex: 1;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 4px;
  font-size: 11px;
  border-radius: 4px;
}

.mini-range {
  flex: 1;
  height: 4px;
}

.layer-icon {
  width: 24px;
  height: 24px;
  background-color: var(--bg-hover);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  margin-right: 8px;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.layer-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.layer-actions {
  display: flex;
  gap: 2px;
}

.layer-item.active {
  border-color: var(--primary);
  background-color: var(--bg-panel); /* Reset bg, use border for active */
}

.layer-item.static {
  opacity: 0.8;
  border-style: dashed;
}

/* Remove old styles matching these selectors if they conflict */
.layer-info, .layer-item::before {
  display: none; /* Hide old active indicator */
}
</style>
