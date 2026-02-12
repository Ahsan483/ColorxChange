<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { textPresets } from '@/data/textPresets'
import { Sparkles, Palette, Sliders, Type, Grid3X3, Wand2 } from 'lucide-vue-next'
import PresetBrowser from './PresetBrowser.vue'

const store = useEditorStore()
const activeTab = ref('text')
const originalFont = ref('')

const activeObject = computed(() => {
  return store.canvasObjects.find(o => o.id === store.activeLayerId) || null
})

const previewFont = (font: string) => {
  if (activeObject.value && activeObject.value.type === 'text') {
    if (!originalFont.value) {
      originalFont.value = activeObject.value.fontFamily || 'Inter'
    }
    activeObject.value.fontFamily = font
  }
}

const restoreFont = () => {
  if (activeObject.value && activeObject.value.type === 'text' && originalFont.value) {
    activeObject.value.fontFamily = originalFont.value
    originalFont.value = ''
  }
}

const selectFont = (font: string) => {
  if (activeObject.value && activeObject.value.type === 'text') {
    activeObject.value.fontFamily = font
    originalFont.value = '' // Clear so mouseleave doesn't overwrite the selection
  }
}

const fonts = [
  'Inter', 'Roboto', 'Oswald', 'Playfair Display', 'Bebas Neue', 'Montserrat', 
  'Abril Fatface', 'Lobster', 'Pacifico', 'Anton', 'Dancing Script', 'Shadows Into Light',
  'Righteous', 'Russo One', 'Bungee', 'Permanent Marker', 'Orbitron', 'Cinzel',
  'Kaushan Script', 'Satisfy', 'Monoton', 'Press Start 2P', 'Staatliches', 'Alfa Slab One',
  'Titan One', 'Luckiest Guy', 'Bangers', 'Creepster', 'Fascinate', 'Modak', 'Silkscreen'
]

const applyEffect = async (effectType: string) => {
  const result = await store.processImage('effect', { effectType, intensity: 1 })
  if (result && (result as any).type === 'effect_applied') {
    updateImageFromPixels((result as any).imageData)
  }
}

const updateImageFromPixels = (pixels: Uint8ClampedArray) => {
  const img = new Image()
  img.src = store.uploadedFile!
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    const imgData = ctx.createImageData(canvas.width, canvas.height)
    imgData.data.set(pixels)
    ctx.putImageData(imgData, 0, 0)
    store.uploadedFile = canvas.toDataURL('image/png')
  }
}

const effects = [
  { id: 'thermal', name: 'Thermal', icon: '🔥' },
  { id: 'glitch', name: 'Digital Glitch', icon: '👾' },
  { id: 'vintage', name: 'Vintage 90s', icon: '📷' },
]
</script>

<template>
  <div class="panel">
    <div class="tabs">
      <div class="tab" :class="{ active: activeTab === 'presets' }" @click="activeTab = 'presets'"><Grid3X3 :size="16" /></div>
      <div class="tab" :class="{ active: activeTab === 'text' }" @click="activeTab = 'text'"><Type :size="16" /></div>
      <div class="tab" :class="{ active: activeTab === 'style' }" @click="activeTab = 'style'"><Wand2 :size="16" /></div>
      <div class="tab" :class="{ active: activeTab === 'colors' }" @click="activeTab = 'colors'"><Palette :size="16" /></div>
      <div class="tab" :class="{ active: activeTab === 'effects' }" @click="activeTab = 'effects'"><Sparkles :size="16" /></div>
      <div class="tab" :class="{ active: activeTab === 'adjust' }" @click="activeTab = 'adjust'"><Sliders :size="16" /></div>
    </div>

    <div class="panel-content">
      <!-- PRESETS BROWSER -->
      <div v-if="activeTab === 'presets'" class="preset-section">
        <PresetBrowser />
      </div>

      <!-- TEXT STYLES -->
      <div v-if="activeTab === 'text'">
        <h3 class="panel-title">Typography</h3>
        <div v-if="activeObject && activeObject.type === 'text'" class="section">
          <!-- (Keep existing fonts list...) -->
           <div class="control">
            <label class="label-row">Font Family</label>
            <div class="font-dropdown-container">
              <div class="font-list-custom">
                <div 
                  v-for="font in fonts" 
                  :key="font" 
                  class="font-option"
                  :class="{ active: activeObject.fontFamily === font }"
                  :style="{ fontFamily: font }"
                  @mouseenter="previewFont(font)"
                  @mouseleave="restoreFont()"
                  @click="selectFont(font)"
                >
                  {{ font }}
                </div>
              </div>
            </div>
          </div>
          <div class="control">
            <div class="label-row"><label>Font Size</label><span>{{ activeObject.fontSize }}px</span></div>
            <input type="range" v-model="activeObject.fontSize" min="10" max="150" />
          </div>
          <div class="control">
            <div class="label-row"><label>Spacing</label><span>{{ activeObject.letterSpacing || 0 }}</span></div>
            <input type="range" v-model="activeObject.letterSpacing" min="-5" max="50" />
          </div>
          <div class="control">
            <label class="label-row">Color</label>
            <input type="color" v-model="activeObject.fill" class="full-color-input" />
          </div>
        </div>
        <div v-else class="empty-note">
          Select text to edit.
        </div>
      </div>

      <!-- ADVANCED ENGINE STYLING -->
      <div v-if="activeTab === 'style'">
        <h3 class="panel-title">Styling Engine</h3>
        <div v-if="activeObject && activeObject.type === 'text'" class="section">
          <!-- Shadow / Glow -->
          <div v-if="activeObject.shadow" class="style-group">
            <div class="label-row">Shadow & Glow</div>
            <div class="control indent">
              <label class="label-row">Blur <input type="number" v-model="activeObject.shadow.blur" class="mini-num"/></label>
              <input type="range" v-model="activeObject.shadow.blur" min="0" max="100" />
            </div>
            <div class="control indent">
              <label class="label-row">X Offset <input type="number" v-model="activeObject.shadow.offsetX" class="mini-num"/></label>
              <input type="range" v-model="activeObject.shadow.offsetX" min="-100" max="100" />
            </div>
            <div class="control indent">
              <label class="label-row">Y Offset <input type="number" v-model="activeObject.shadow.offsetY" class="mini-num"/></label>
              <input type="range" v-model="activeObject.shadow.offsetY" min="-100" max="100" />
            </div>
            <div class="control indent">
              <label class="label-row">Color</label>
              <input type="color" v-model="activeObject.shadow.color" class="full-color-input" />
            </div>
          </div>

          <!-- Stroke -->
          <div v-if="activeObject.stroke" class="style-group">
            <div class="label-row">
              Stroke 
              <input type="checkbox" v-model="activeObject.stroke.enabled" />
            </div>
            <div v-if="activeObject.stroke.enabled" class="control indent">
              <label class="label-row">Width</label>
              <input type="range" v-model="activeObject.stroke.width" min="0" max="50" />
              <input type="color" v-model="activeObject.stroke.color" class="full-color-input mt-2" />
            </div>
          </div>
          
          <!-- Gradient Toggle -->
          <div class="style-group">
            <div class="label-row">
              Gradient Effect
              <button class="mini-btn" @click="activeObject.gradient ? activeObject.gradient = undefined : store.applyPreset(textPresets[3])">
                {{ activeObject.gradient ? 'Remove' : 'Add' }}
              </button>
            </div>
          </div>

          <!-- Opacity -->
          <div class="style-group">
            <div class="label-row">Layer Opacity ({{ Math.round(activeObject.opacity * 100) }}%)</div>
            <input type="range" v-model="activeObject.opacity" min="0" max="1" step="0.01" />
          </div>
        </div>
        <div v-else class="empty-note">Select text to style.</div>
      </div>

      <!-- IMAGE ADJUSTMENTS -->
      <div v-if="activeTab === 'adjust'">
        <h3 class="panel-title">Global Adjustments</h3>
        <div class="section">
          <div class="control">
            <div class="label-row"><label>Brightness</label><span>{{ store.brightness }}</span></div>
            <input type="range" v-model="store.brightness" min="-100" max="100" />
          </div>
          <div class="control">
            <div class="label-row"><label>Contrast</label><span>{{ store.contrast }}</span></div>
            <input type="range" v-model="store.contrast" min="-100" max="100" />
          </div>
        </div>
        <div v-if="activeObject" class="section transform-section">
          <h3 class="panel-title sub">Transform</h3>
          <div class="grid-controls">
            <div class="small-control"><label>X</label><input type="number" v-model="activeObject.x" /></div>
            <div class="small-control"><label>Y</label><input type="number" v-model="activeObject.y" /></div>
            <div class="small-control"><label>ROT</label><input type="number" v-model="activeObject.rotation" /></div>
          </div>
        </div>
      </div>

      <!-- COLOR REPLACEMENT -->
      <div v-if="activeTab === 'colors'">
        <h3 class="panel-title">Pro Color Replacement</h3>
        <div v-if="store.selectedColors.length" class="section">
          <div class="color-list">
            <div v-for="color in store.selectedColors" :key="color.original" class="color-item">
              <div :style="{ backgroundColor: color.original }" class="color-swatch"></div>
              <input type="color" v-model="color.newColor" class="color-picker-mini" />
              <button class="remove-btn" @click="store.removeColorChange(color.original)">×</button>
            </div>
          </div>
          <button class="apply-btn primary" @click="store.processImage('apply')">Apply Changes</button>
        </div>
        <p v-else class="empty-note">Click with Color Picker tool to modify colors.</p>
      </div>

      <!-- EFFECTS -->
      <div v-if="activeTab === 'effects'">
        <h3 class="panel-title">Advanced Effects</h3>
        <div class="effects-grid">
          <div v-for="effect in effects" :key="effect.id" class="effect-card" @click="applyEffect(effect.id)">
            <div class="effect-icon">{{ effect.icon }}</div>
            <span class="effect-name">{{ effect.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
  background: transparent; /* Background handled by parent skeleton */
}

/* Tabs */
.tabs {
  display: flex;
  background-color: var(--bg-panel);
  height: 48px;
  border-bottom: 1px solid var(--border-color);
  padding: 0 4px;
  gap: 4px;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
  position: relative;
  border-radius: var(--radius-sm);
  margin: 4px 0;
}

.tab:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.tab.active {
  color: var(--primary);
  background-color: var(--bg-active);
}

.tab.active::after {
  display: none; /* Removed the gradient underline for a button-like tab */
}

.panel-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preset-section {
  margin: -20px;
  flex: 1;
  min-height: 0;
}

/* Section Styling */
.style-group {
  background: var(--bg-app);
  padding: 16px;
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.indent {
  padding-left: 8px;
  margin-top: 12px;
}

.mini-num {
  width: 50px;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  font-family: var(--font-body);
  font-size: 12px;
  text-align: center;
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  padding: 4px;
}

.mini-num:focus {
  outline: 2px solid var(--primary);
  border-color: transparent;
}

.mt-2 { margin-top: 12px; }

.panel-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 16px;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
}

.panel-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 14px;
  background-color: var(--primary);
  margin-right: 8px;
  border-radius: 2px;
}

.panel-title.sub {
  margin-top: 20px;
  color: var(--text-muted);
  border-left: none;
  padding-left: 0;
}
.panel-title.sub::before { display: none; }

.section { margin-bottom: 24px; }
.control { margin-bottom: 16px; }

.label-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

/* Font Dropdown */
.font-dropdown-container {
  height: 240px;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.font-list-custom {
  height: 100%;
  overflow-y: auto;
}

.font-option {
  padding: 12px 16px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid var(--border-color);
}

.font-option:hover {
  background-color: var(--bg-hover);
  color: var(--primary);
}

.font-option.active {
  background-color: var(--bg-active);
  color: var(--primary);
  font-weight: 600;
}

/* Inputs */
.full-color-input {
  width: 100%;
  height: 40px;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 4px;
}

input[type="range"] {
  width: 100%;
  accent-color: var(--primary);
  height: 6px;
  border-radius: 3px;
  -webkit-appearance: none;
  background: var(--border-active);
}

/* Grid Controls */
.grid-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.small-control input {
  width: 100%;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 6px;
  color: var(--text-primary);
  font-size: 12px;
}

.small-control label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  font-weight: 600;
}

/* Colors List */
.color-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.color-item {
  background-color: var(--bg-panel);
  padding: 12px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
}

.apply-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.apply-btn:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.mini-btn {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  color: var(--primary);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.mini-btn:hover {
  background: var(--bg-hover);
  border-color: var(--primary);
}

/* Effects Grid */
.effects-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.effect-card {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.effect-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  background-color: var(--bg-hover);
}

.effect-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 10px;
}

.empty-note {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  margin-top: 40px;
  padding: 20px;
  background: var(--bg-generated); /* Fallback or new var */
  border-radius: var(--radius-md);
  border: 1x dashed var(--border-color);
}

.remove-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 18px;
  transition: color 0.2s;
}

.remove-btn:hover {
  color: #ef4444; /* Red-500 */
}
</style>
