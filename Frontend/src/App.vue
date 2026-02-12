<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useEditorStore } from './stores/editor'
import EditorSkeleton from './components/editor/EditorSkeleton.vue'
import '@/css/main.css'

const store = useEditorStore()
const showDebug = ref(false)

// Sync theme with DOM
const applyTheme = () => {
  document.documentElement.setAttribute('data-theme', store.theme)
}

watch(() => store.theme, applyTheme)

onMounted(() => {
  applyTheme()
})

const logStore = () => {
  console.log('CURRENT STORE STATE:', JSON.parse(JSON.stringify(store.$state)))
}
</script>

<template>
  <div class="app-container">
    <EditorSkeleton />
    
    <!-- Floating Debug Button -->
    <button class="debug-toggle" @click="showDebug = !showDebug">🛠️</button>
    
    <div v-if="showDebug" class="debug-panel">
      <h4>System Diagnostic</h4>
      <p>File loaded: {{ !!store.uploadedFile }}</p>
      <p>Colors selected: {{ store.selectedColors.length }}</p>
      <p>Objects: {{ store.canvasObjects.length }}</p>
      <button @click="logStore">Dump State to Console</button>
      <button @click="store.resetEditor">Factory Reset</button>
    </div>
  </div>
</template>

<style>
body, html, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: #000;
}

.app-container {
  height: 100%;
  width: 100%;
  position: relative;
}

.debug-toggle {
  position: fixed;
  bottom: 30px;
  right: 10px;
  z-index: 9999;
  background: #333;
  border: 1px solid #555;
  color: white;
  padding: 5px;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.5;
}
.debug-toggle:hover { opacity: 1; }

.debug-panel {
  position: fixed;
  bottom: 70px;
  right: 10px;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #8b5cf6;
  color: #fff;
  padding: 15px;
  border-radius: 8px;
  font-size: 11px;
  width: 200px;
}
.debug-panel h4 { margin: 0 0 10px 0; color: #8b5cf6; }
.debug-panel button { width: 100%; margin-top: 5px; background: #333; color: white; border: 1px solid #444; padding: 4px; cursor: pointer; }
</style>
