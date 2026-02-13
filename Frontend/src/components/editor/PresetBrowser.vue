<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { textPresets } from '@/data/textPresets'
import { Search, Sparkles } from 'lucide-vue-next'

const store = useEditorStore()
const searchQuery = ref('')
const activeCategory = ref('All')

const categories = ['All', 'Luxury', 'Neon', 'Pastel', 'Modern', 'Nature', 'Space', 'Wedding', 'Corporate', 'Kids', 'Fashion', 'Effects']

const generateRandomStyle = () => {
  const randomIndex = Math.floor(Math.random() * textPresets.length)
  store.applyPreset(textPresets[randomIndex])
}

const filteredPresets = computed(() => {
  return textPresets.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = activeCategory.value === 'All' || p.category === activeCategory.value
    return matchesSearch && matchesCategory
  })
})

const applyPreset = (preset: any) => {
  store.applyPreset(preset)
}

const getPresetStyle = (preset: any) => {
  const style: any = {
    fontFamily: preset.fontFamily,
    fontWeight: 'bold',
  }

  // Handle Gradient vs Solid Fill
  if (preset.gradient && preset.gradient.colors && preset.gradient.colors.length > 0) {
    const colors = preset.gradient.colors.map((c: any) => `${c.color} ${c.offset * 100}%`).join(', ')
    // Default to linear gradient from top to bottom if not specified
    const type = preset.gradient.type === 'radial' ? 'radial-gradient' : 'linear-gradient'
    const direction = type === 'linear-gradient' ? 'to bottom, ' : 'circle, '
    
    style.backgroundImage = `${type}(${direction}${colors})`
    style.webkitBackgroundClip = 'text'
    style.backgroundClip = 'text'
    style.webkitTextFillColor = 'transparent'
    style.color = 'transparent' // Fallback
  } else {
    style.color = preset.fill
  }

  // Handle Stroke
  if (preset.stroke && preset.stroke.enabled) {
    style.webkitTextStroke = `${preset.stroke.width / 2}px ${preset.stroke.color}`
  }

  // Handle Shadow/Glow
  if (preset.shadow && preset.shadow.opacity > 0) {
    // Scale down shadow for preview
    const s = preset.shadow
    style.textShadow = `${s.offsetX/2}px ${s.offsetY/2}px ${s.blur/2}px ${s.color}`
  }

  return style
}
</script>

<template>
  <div class="preset-browser">
    <div class="sticky-header">
      <div class="search-bar">
        <div class="input-wrapper">
          <Search :size="14" class="search-icon" />
          <input v-model="searchQuery" placeholder="Search styles..." />
        </div>
        <button class="random-btn" @click="generateRandomStyle" title="Randomize">
          <Sparkles :size="14" />
        </button>
      </div>
      
      <div class="category-strip">
        <div 
          v-for="cat in categories" 
          :key="cat"
          class="cat-tag"
          :class="{ active: activeCategory === cat }"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </div>
      </div>
    </div>

    <div class="preset-scroll-area">
      <div class="preset-slider"> 
        <div 
          v-for="preset in filteredPresets" 
          :key="preset.name" 
          class="style-card-compact"
          @click="applyPreset(preset)"
        >
          <div class="style-preview-mini" :style="getPresetStyle(preset)">
            Aa
          </div>
          <span class="style-name-mini">{{ preset.name.replace(/^(Neon|Luxury|Space|Nature|Pastel|Modern|Kids|Fashion|Wedding|Corporate|Effects)\s+/, '') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preset-browser {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-panel);
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
}

.search-bar { 
  padding: 12px 16px; 
  display: flex; 
  gap: 8px; 
}

.input-wrapper { 
  flex: 1; 
  background: var(--bg-app); 
  border: 1px solid var(--border-color); 
  border-radius: 4px; 
  display: flex; 
  align-items: center; 
  padding: 0 10px; 
  transition: all 0.2s;
  height: 32px;
}

.input-wrapper:focus-within { 
  border-color: var(--primary); 
  box-shadow: 0 0 0 1px var(--primary); 
  background: var(--bg-panel);
}

.search-icon { color: var(--text-muted); margin-right: 8px; }

.input-wrapper input { 
  background: none; 
  border: none; 
  color: var(--text-primary); 
  font-size: 12px; 
  width: 100%; 
  height: 100%;
  outline: none; 
}

.random-btn {
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--primary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.random-btn:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.category-strip {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 0 16px;
  scrollbar-width: none;
}
.category-strip::-webkit-scrollbar { display: none; }

.cat-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  border: 1px solid transparent; /* fixed height prevent jump */
}

.cat-tag:hover { 
  color: var(--primary); 
  background: var(--bg-hover);
}

.cat-tag.active {
  background: var(--bg-active);
  color: var(--primary);
  font-weight: 600;
}

.preset-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: var(--bg-app);
}

/* Horizontal Slider Layout */
.preset-slider {
  display: flex;
  flex-direction: column; /* Stack vertically for "list" view or wrap for dense grid */
  gap: 4px;
}

.style-card-compact {
  background: var(--bg-panel);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  display: flex;
  flex-direction: row; /* Horizontal layout for list item */
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.style-card-compact:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-active);
}

.style-preview-mini {
  height: 24px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  margin-right: 12px;
  pointer-events: none;
}

.style-name-mini {
  font-size: 12px;
  color: var(--text-primary);
  text-align: left;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
</style>
