<script setup lang="ts">
import { ref } from 'vue'
import Toolbar from './Toolbar.vue'
import Sidebar from './Sidebar.vue'
import CanvasWorkspace from './CanvasWorkspace.vue'
import PropertiesPanel from './PropertiesPanel.vue'
import LayersPanel from './LayersPanel.vue'

const showSidebar = ref(true)
const showProperties = ref(true)
</script>

<template>
  <div class="editor-skeleton">
    <!-- Top Navigation / Toolbar Area -->
    <header class="top-bar">
      <div class="logo-area">
        <span class="logo-text">ColorX</span>
      </div>
      <div class="toolbar-area">
        <Toolbar />
      </div>
      <div class="user-area">
        <!-- Placeholder for user profile or extra actions -->
      </div>
    </header>

    <div class="main-content">
      <!-- Left Tools Dock -->
      <aside v-if="showSidebar" class="left-sidebar">
        <Sidebar />
      </aside>

      <!-- Central Canvas Workspace -->
      <main class="workspace">
        <div class="canvas-wrapper">
          <CanvasWorkspace />
        </div>
      </main>

      <!-- Right Properties Panel -->
      <aside v-if="showProperties" class="right-panel">
        <div class="panel-header">
          <h3>Properties</h3>
        </div>
        <div class="scrollable-content">
           <PropertiesPanel />
        </div>
        
        <div class="panel-divider"></div>
        
        <div class="panel-header">
          <h3>Layers</h3>
        </div>
        <div class="layers-section">
          <LayersPanel />
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.editor-skeleton {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-app);
  color: var(--text-primary);
  overflow: hidden;
}

.top-bar {
  height: var(--header-height);
  background-color: var(--bg-panel);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 24px;
  z-index: 50;
  box-shadow: var(--shadow-sm);
  justify-content: space-between;
}

.logo-area {
  width: 200px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 20px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.toolbar-area {
  flex: 1;
  display: flex;
  justify-content: center;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.left-sidebar {
  width: var(--sidebar-width);
  background-color: var(--bg-panel);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 24px;
  z-index: 40;
}

.workspace {
  flex: 1;
  position: relative;
  background-color: var(--bg-app);
  /* Dot grid pattern for professional feel */
  background-image: radial-gradient(var(--border-active) 1px, transparent 1px);
  background-size: 24px 24px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.02);
}

.right-panel {
  width: var(--properties-width);
  background-color: var(--bg-panel);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  z-index: 40;
  box-shadow: var(--shadow-lg);
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h3 {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  margin: 0;
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.panel-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 0;
}

.layers-section {
  height: 300px; /* Fixed height for layers for now */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
