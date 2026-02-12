<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { textPresets } from '@/data/textPresets'
import { Search, LayoutGrid } from 'lucide-vue-next'

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
</script>

<template>
  <div class="preset-browser">
    <div class="sticky-header">
      <div class="search-bar">
        <div class="input-wrapper">
          <Search :size="14" class="search-icon" />
          <input v-model="searchQuery" placeholder="Search 1,100+ styles..." />
        </div>
        <button class="random-btn" @click="generateRandomStyle" title="Style Randomizer (🪄)">
          <Sparkles :size="16" />
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
      <div class="preset-grid">
        <div 
          v-for="preset in filteredPresets" 
          :key="preset.name" 
          class="style-card"
          @click="applyPreset(preset)"
        >
          <div class="style-preview" :style="{ 
            fontFamily: preset.fontFamily,
            color: (preset.gradient && preset.gradient.colors) ? preset.gradient.colors[0].color : preset.fill,
            textShadow: preset.shadow ? `${preset.shadow.offsetX/2}px ${preset.shadow.offsetY/2}px ${preset.shadow.blur/2}px ${preset.shadow.color}` : 'none',
            letterSpacing: (preset.letterSpacing || 0) / 2 + 'px'
          }">
            ABC
          </div>
          <span class="style-name">{{ preset.name.replace(/^(Neon|Luxury|Space|Nature|Pastel|Modern|Kids|Fashion|Wedding|Corporate|Effects)\s+/, '') }}</span>
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
}

.search-bar { 
  padding: 16px; 
  display: flex; 
  gap: 12px; 
}

.input-wrapper { 
  position: relative; 
  flex: 1; 
  background: var(--bg-app); 
  border: 1px solid var(--border-color); 
  border-radius: 20px; 
  display: flex; 
  align-items: center; 
  padding: 0 16px; 
  transition: all 0.2s;
}

.input-wrapper:focus-within { 
  border-color: var(--primary); 
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1); 
  background: var(--bg-panel);
}

.search-icon { color: var(--text-muted); margin-right: 10px; }

.input-wrapper input { 
  background: none; 
  border: none; 
  color: var(--text-primary); 
  font-size: 13px; 
  width: 100%; 
  height: 40px; 
  outline: none; 
}

.random-btn {
  background: var(--primary);
  border: none;
  border-radius: 50%;
  color: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-md);
}

.random-btn:hover {
  transform: scale(1.05) rotate(15deg);
  background: var(--primary-hover);
}

.category-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 16px 16px 16px;
  scrollbar-width: none;
}
.category-strip::-webkit-scrollbar { display: none; }

.cat-tag {
  font-size: 12px;
  font-weight: 500;
  padding: 6px 16px;
  background: var(--bg-app);
  color: var(--text-secondary);
  border-radius: 20px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.cat-tag:hover { 
  border-color: var(--primary); 
  color: var(--primary); 
  background: var(--bg-hover);
}

.cat-tag.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
  box-shadow: var(--shadow-sm);
}

.preset-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--bg-app);
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.style-card {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.style-card:hover {
  border-color: var(--primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.style-preview {
  height: 80px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 12px;
  pointer-events: none;
}

.style-name {
  font-size: 12px;
  color: var(--text-primary);
  text-align: center;
  font-weight: 600;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}
</style>
