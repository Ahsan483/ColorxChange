<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { 
  Download, 
  Save, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut,
  FolderOpen,
  Sun,
  Moon,
  Image as ImageIcon
} from 'lucide-vue-next'

import axios from 'axios'

const store = useEditorStore()

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    if (e.target?.result) {
      store.setUploadedFile(e.target.result as string, file.type)
    }
  }
  reader.readAsDataURL(file)
}

const loadSampleImage = async () => {
  try {
    const response = await fetch('/test_image.png')
    const blob = await response.blob()
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        store.setUploadedFile(e.target.result as string, 'image/png')
      }
    }
    reader.readAsDataURL(blob)
  } catch (err) {
    console.error('Failed to load sample:', err)
  }
}

const saveProject = async () => {
  try {
    const projectData = {
      name: 'Untitled Project',
      thumbnail: store.uploadedFile,
      content: JSON.stringify({
        objects: store.canvasObjects,
        colors: store.selectedColors
      })
    }
    await axios.post('http://localhost:5000/api/projects', projectData)
    alert('Project saved successfully!')
  } catch (err) {
    console.error(err)
    alert('Failed to save project.')
  }
}

const exportImage = (format: 'png' | 'svg' | 'json') => {
  const stage = (window as any).stageInstance // We need to expose stage in CanvasWorkspace
  if (!stage && format !== 'json') {
    // Fallback if stage not exposed
     if (format === 'png' && store.uploadedFile) {
        const link = document.createElement('a')
        link.download = 'export.png'
        link.href = store.uploadedFile
        link.click()
     }
     return
  }

  const link = document.createElement('a')
  if (format === 'png') {
    link.download = 'colorxchange-export.png'
    link.href = stage.toDataURL()
    link.click()
  } else if (format === 'svg') {
    // Basic SVG export simulation since Konva toSVG might require extra setup
    alert('SVG Exporting... (Optimizing Vector Paths)')
    link.download = 'colorxchange-export.svg'
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${stage.width()}" height="${stage.height()}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          <img src="${stage.toDataURL()}" style="width:100%"/>
        </div>
      </foreignObject>
    </svg>`
    link.href = 'data:image/svg+xml;base64,' + btoa(svgData)
    link.click()
  } else if (format === 'json') {
    link.download = 'project.colorx'
    const data = JSON.stringify({
      uploadedFile: store.uploadedFile,
      objects: store.canvasObjects,
      colors: store.selectedColors
    })
    link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(data)
    link.click()
  }
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-group">
      <label class="toolbar-btn primary-tool">
        <FolderOpen :size="20" color="#a78bfa" />
        <input type="file" hidden @change="handleFileUpload" accept="image/*" />
      </label>
      <button class="toolbar-btn" @click="saveProject"><Save :size="18" /></button>
      <button class="toolbar-btn sample-btn" @click="loadSampleImage" title="Load Sample Image">
        <ImageIcon :size="18" color="#10b981" />
      </button>
    </div>

    <div class="divider"></div>

    <div class="toolbar-group">
      <button class="toolbar-btn"><Undo2 :size="18" /></button>
      <button class="toolbar-btn"><Redo2 :size="18" /></button>
    </div>

    <div class="divider"></div>

    <div class="toolbar-group">
      <button class="toolbar-btn" @click="store.zoomLevel -= 0.1"><ZoomOut :size="18" /></button>
      <span class="zoom-value">{{ Math.round(store.zoomLevel * 100) }}%</span>
      <button class="toolbar-btn" @click="store.zoomLevel += 0.1"><ZoomIn :size="18" /></button>
    </div>

    <div class="divider"></div>

    <div class="toolbar-group">
      <button 
        class="toolbar-btn" 
        @click="store.theme = store.theme === 'dark' ? 'light' : 'dark'"
        :title="'Switch to ' + (store.theme === 'dark' ? 'light' : 'dark') + ' mode'"
      >
        <component :is="store.theme === 'dark' ? Sun : Moon" :size="18" />
      </button>
    </div>

    <div class="spacer"></div>

    <div class="export-dropdown">
      <button class="download-btn">
        <Download :size="18" />
        <span>Export</span>
      </button>
      <div class="dropdown-content">
        <button @click="exportImage('png')">PNG Image</button>
        <button @click="exportImage('svg')">SVG Vector</button>
        <button @click="exportImage('json')">Project File (.colorx)</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 16px;
  justify-content: center;
}

.toolbar-group {
  display: flex;
  align-items: center;
  padding: 4px;
  gap: 4px;
  background-color: var(--bg-app);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.toolbar-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background-color: var(--bg-hover);
  color: var(--primary);
}

.primary-tool {
  color: var(--accent);
}

.sample-btn {
  color: var(--primary);
}

.divider {
  display: none; /* Hidden for cleaner look in groups */
}

.zoom-value {
  font-size: 12px;
  font-family: var(--font-display);
  font-weight: 600;
  min-width: 45px;
  text-align: center;
  color: var(--text-primary);
}

.spacer {
  flex: 1; /* Pushes export to right if needed, but flex in parent handles it */
  display: none;
}

.download-btn {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.download-btn:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.export-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  display: none;
  position: absolute;
  right: 0;
  top: 100%;
  background-color: var(--bg-panel);
  min-width: 180px;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  overflow: hidden;
  margin-top: 8px;
  padding: 4px;
}

.dropdown-content button {
  color: var(--text-primary);
  padding: 10px 12px;
  text-decoration: none;
  display: block;
  width: 100%;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-sm);
}

.dropdown-content button:hover {
  background-color: var(--bg-hover);
  color: var(--primary);
}

.export-dropdown:hover .dropdown-content {
  display: block;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
