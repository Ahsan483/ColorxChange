<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { Eye, EyeOff, Lock, Unlock, Trash2, ChevronUp, ChevronDown } from 'lucide-vue-next'

const store = useEditorStore()
</script>

<template>
  <div class="layers-container">
    <div class="layers-header">
      <span>LAYERS</span>
    </div>
    
    <div class="layers-list">
      <!-- Background Image Layer (Always at bottom) -->
      <div 
        v-if="store.uploadedFile"
        class="layer-item"
        :class="{ active: store.activeLayerId === 'main-image' }"
        @click="store.activeLayerId = 'main-image'"
      >
        <div class="layer-info">
          <span class="layer-name">Background Image</span>
        </div>
      </div>

      <!-- Functional Layers -->
      <div 
        v-for="(layer, index) in [...store.canvasObjects].reverse()" 
        :key="layer.id"
        class="layer-item"
        :class="{ active: store.activeLayerId === layer.id }"
        @click="store.activeLayerId = layer.id"
      >
        <div class="layer-icon">{{ layer.type === 'text' ? 'T' : 'S' }}</div>
        
        <div class="layer-info">
          <span class="layer-name">{{ layer.text ? layer.text.substring(0, 15) + (layer.text.length > 15 ? '...' : '') : 'Object' }}</span>
        </div>

        <div class="layer-actions">
          <button 
            class="action-btn" 
            @click.stop="store.toggleVisibility(layer.id)"
            :title="layer.visible ? 'Hide' : 'Show'"
          >
            <component :is="layer.visible ? Eye : EyeOff" :size="14" />
          </button>
          
          <button 
            class="action-btn" 
            @click.stop="store.toggleLock(layer.id)"
            :title="layer.locked ? 'Unlock' : 'Lock'"
          >
            <component :is="layer.locked ? Lock : Unlock" :size="14" :color="layer.locked ? '#8b5cf6' : '#666'" />
          </button>

          <button class="action-btn delete" @click.stop="store.deleteLayer(layer.id)">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Z-Order Controls -->
    <div v-if="store.activeLayerId && store.activeLayerId !== 'main-image'" class="layer-order-controls">
      <button class="order-btn" @click="store.moveLayerDown(store.activeLayerId!)">
        <ChevronUp :size="16" />
      </button>
      <button class="order-btn" @click="store.moveLayerUp(store.activeLayerId!)">
        <ChevronDown :size="16" />
      </button>
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

.layer-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0 8px;
  border-radius: var(--radius-sm);
}

.layer-item:hover {
  background-color: var(--bg-hover);
}

.layer-item.active {
  background-color: var(--bg-active);
  position: relative;
}

.layer-item.active::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background-color: var(--primary);
  border-radius: 2px;
}

.layer-icon {
  width: 28px;
  height: 28px;
  background-color: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  margin-right: 12px;
  color: var(--primary);
}

.layer-info {
  flex: 1;
  min-width: 0;
}

.layer-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.layer-item.active .layer-name {
  color: var(--primary);
  font-weight: 600;
}

.layer-actions {
  display: flex;
  gap: 4px;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.layer-item:hover .layer-actions {
  opacity: 1;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 6px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: var(--bg-app);
  color: var(--primary);
}

.action-btn.delete:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.layer-order-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 12px;
  background-color: var(--bg-app);
  border-top: 1px solid var(--border-color);
}

.order-btn {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 6px 16px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.order-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
}
</style>
