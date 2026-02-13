import { defineStore } from 'pinia'
import type { EditorState, ColorChange, CanvasObject } from '../types/editor'
import api from '@/utils/api'

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({
    uploadedFile: null,
    fileType: null,
    canvasObjects: [],
    selectedColors: [],
    colorHistory: [],
    tolerance: 15,
    brightness: 0,
    contrast: 0,
    saturation: 100,
    zoomLevel: 1,
    isDrawingMode: false,
    brushColor: '#ff0000',
    activeLayerId: null,
    realTimePreview: false,
    selectedTool: 'select',
    theme: 'dark',
    history: [],
    historyIndex: -1,
    
    // Auth & Project State
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    currentProjectId: null as string | null,
    activeProjectName: 'Untitled Project',
    isSaving: false,
    lastSavedAt: null as Date | null,
    isAuthModalOpen: false,
  }),
  actions: {
    // History Actions
    saveState() {
      // Remove any future history if we were in the middle of result stack
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1)
      }

      // Create snapshot
      const snapshot: any = {
        canvasObjects: JSON.parse(JSON.stringify(this.canvasObjects)),
        selectedColors: JSON.parse(JSON.stringify(this.selectedColors)),
        uploadedFile: this.uploadedFile,
        activeLayerId: this.activeLayerId
      }

      this.history.push(snapshot)
      this.historyIndex++
      
      // Limit history size
      if (this.history.length > 50) {
        this.history.shift()
        this.historyIndex--
      }
    },
    undo() {
      if (this.historyIndex > 0) {
        this.historyIndex--
        this.restoreState(this.history[this.historyIndex])
      }
    },
    redo() {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++
        this.restoreState(this.history[this.historyIndex])
      }
    },
    restoreState(state: any) {
      this.canvasObjects = JSON.parse(JSON.stringify(state.canvasObjects))
      this.selectedColors = JSON.parse(JSON.stringify(state.selectedColors))
      this.uploadedFile = state.uploadedFile
      this.activeLayerId = state.activeLayerId
    },

    setUploadedFile(file: string, type: string) {
      this.uploadedFile = file
      this.fileType = type
      
      // Auto-create an image object for the main upload if none exists
      // This bridges the gap between background-mode and layer-mode
      const id = 'img-main-' + Date.now()
      this.canvasObjects.push({
        id,
        type: 'image',
        src: file,
        x: 50,
        y: 50,
        draggable: true,
        scaleX: 0.5,
        scaleY: 0.5,
        rotation: 0,
        locked: false,
        visible: true,
        opacity: 1
      })
      this.activeLayerId = id
      this.saveState() 
    },
    addImageObject(src: string, x = 100, y = 100) {
      const id = 'img-' + Date.now()
      this.canvasObjects.push({
        id,
        type: 'image',
        src,
        x,
        y,
        draggable: true,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        locked: false,
        visible: true,
        opacity: 1
      })
      this.activeLayerId = id
      this.saveState()
    },
    addColorChange(color: ColorChange) {
      if (!this.selectedColors.some(c => c.original === color.original)) {
        this.selectedColors.push(color)
        this.colorHistory.push({ ...color })
        this.saveState()
      }
    },
    removeColorChange(originalColor: string) {
      this.selectedColors = this.selectedColors.filter(c => c.original !== originalColor)
      this.saveState()
    },
    async applyPreset(preset: any) {
      if (this.activeLayerId) {
        const obj = this.canvasObjects.find(o => o.id === this.activeLayerId)
        if (obj && obj.type === 'text') {
          const { name, category, ...styleProps } = JSON.parse(JSON.stringify(preset))
          Object.assign(obj, styleProps)
          this.saveState()
        }
      }
    },
    updateCanvasObjects(objects: CanvasObject[]) {
      this.canvasObjects = objects
      // Note: We don't saveState here automatically to avoid spam during drag. 
      // Components should call saveState() on dragEnd.
    },
    addTextObject(x: number, y: number) {
      const id = 'text-' + Date.now()
      this.canvasObjects.push({
        id,
        type: 'text',
        text: 'DOUBLE CLICK TO EDIT',
        x,
        y,
        fontSize: 36,
        fontFamily: 'Roboto',
        fill: '#ffffff',
        draggable: true,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        locked: false,
        visible: true,
        opacity: 1,
       shadow: { color: '#000000', blur: 0, offsetX: 0, offsetY: 0, opacity: 1 },
        stroke: undefined,
        strokeWidth: 0,
        gradient: undefined,
        letterSpacing: 0,
        lineHeight: 1.2,
        warp: { style: 'none', amount: 0 },
        threeD: { 
          enabled: false, 
          depth: 20, 
          rotationX: 0, 
          rotationY: 0, 
          rotationZ: 0, 
          materialType: 'standard' 
        }
      })
      this.activeLayerId = id
      this.saveState()
    },
    toggleLock(id: string) {
      const obj = this.canvasObjects.find(o => o.id === id)
      if (obj) {
        obj.locked = !obj.locked
        this.saveState()
      }
    },
    toggleVisibility(id: string) {
      const obj = this.canvasObjects.find(o => o.id === id)
      if (obj) {
        obj.visible = !obj.visible
        this.saveState()
      }
    },
    deleteLayer(id: string) {
      this.canvasObjects = this.canvasObjects.filter(o => o.id !== id)
      if (this.activeLayerId === id) this.activeLayerId = null
      this.saveState()
    },
    moveLayerUp(id: string) {
      const idx = this.canvasObjects.findIndex(o => o.id === id)
      if (idx < this.canvasObjects.length - 1) {
        const temp = this.canvasObjects[idx]
        this.canvasObjects[idx] = this.canvasObjects[idx + 1]
        this.canvasObjects[idx + 1] = temp
        this.saveState()
      }
    },
    moveLayerDown(id: string) {
      const idx = this.canvasObjects.findIndex(o => o.id === id)
      if (idx > 0) {
        const temp = this.canvasObjects[idx]
        this.canvasObjects[idx] = this.canvasObjects[idx - 1]
        this.canvasObjects[idx - 1] = temp
        this.saveState()
      }
    },
    moveLayer(fromIndex: number, toIndex: number) {
      if (fromIndex === toIndex) return
      const item = this.canvasObjects.splice(fromIndex, 1)[0]
      this.canvasObjects.splice(toIndex, 0, item)
      this.saveState()
    },
    async processImage(type: 'extract' | 'apply' | 'effect', extraData?: any) {
      if (!this.uploadedFile) return null

      return new Promise((resolve, reject) => {
        try {
          const worker = new Worker(new URL('../worker.ts', import.meta.url), { type: 'module' })
          
          const timeout = setTimeout(() => {
            worker.terminate()
            reject(new Error('Worker timeout'))
          }, 60000)

          worker.onmessage = (e) => {
            clearTimeout(timeout)
            resolve(e.data)
            worker.terminate()
          }

          worker.onerror = (err) => {
            clearTimeout(timeout)
            reject(err)
            worker.terminate()
          }

          const img = new Image()
          img.src = this.uploadedFile!
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0)
            const imageData = ctx.getImageData(0, 0, img.width, img.height)

            if (type === 'extract') {
              worker.postMessage({ 
                type: 'extract', 
                data: { imageData: imageData.data, width: img.width, height: img.height } 
              })
            } else if (type === 'apply') {
              worker.postMessage({ 
                type: 'apply', 
                data: { 
                  imageData: imageData.data, 
                  colorChanges: JSON.parse(JSON.stringify(this.selectedColors)), 
                  tolerance: this.tolerance 
                } 
              })
            } else if (type === 'effect') {
              worker.postMessage({ 
                type: 'effect', 
                data: { 
                  imageData: imageData.data, 
                  effect: extraData.effectType, 
                  intensity: extraData.intensity || 1 
                } 
              })
            }
          }
        } catch (err) {
          reject(err)
        }
      })
    },
    resetEditor() {
      this.uploadedFile = null
      this.fileType = null
      this.selectedColors = []
      this.canvasObjects = []
      this.brightness = 0
      this.contrast = 0
      this.saturation = 100
      this.zoomLevel = 1
      this.selectedTool = 'select'
      this.activeLayerId = null
      this.history = []
      this.historyIndex = -1
    },

    // --- AUTH ACTIONS ---
    async login(email: string, password: string) {
       const res = await api.post('/auth/login', { email, password })
       this.token = res.data.token
       this.user = res.data.user
       localStorage.setItem('token', this.token!)
       localStorage.setItem('user', JSON.stringify(this.user))
    },

    async register(email: string, password: string, name: string) {
       const res = await api.post('/auth/register', { email, password, name })
       this.token = res.data.token
       this.user = res.data.user
       localStorage.setItem('token', this.token!)
       localStorage.setItem('user', JSON.stringify(this.user))
    },

    logout() {
       this.token = null
       this.user = null
       this.currentProjectId = null
       localStorage.removeItem('token')
       localStorage.removeItem('user')
    },

    // --- PROJECT ACTIONS ---
    async createProject(name: string) {
       const res = await api.post('/projects', { name, data: this.canvasObjects, thumbnail: null })
       this.currentProjectId = res.data.id
       this.activeProjectName = res.data.name
       this.isSaving = false
    },

    async loadProject(id: string) {
       try {
          const res = await api.get(`/projects/${id}`)
          this.currentProjectId = res.data.id
          this.activeProjectName = res.data.name
          this.canvasObjects = res.data.data || [] // Ensure data is mapped correctly
          this.saveState() // Initialize history
       } catch (err) {
          console.error(err)
       }
    },

    async saveProject() {
       if (!this.currentProjectId && this.user) {
          // First save, create new
          await this.createProject(this.activeProjectName)
          return
       }

       if (this.currentProjectId) {
          this.isSaving = true
          try {
             await api.put(`/projects/${this.currentProjectId}`, {
                data: this.canvasObjects,
                name: this.activeProjectName
             })
             this.lastSavedAt = new Date()
          } catch (err) {
             console.error('Autosave failed', err)
          } finally {
             this.isSaving = false
          }
       }
    },
    
    // Autosave Trigger
    triggerAutosave() {
      // implementation in setup via debouncedAutosave property injection or similar
      // For now we'll call the immediate save, but in the component/setup we attach debounce
    },

    async removeBackground(objectId: string) {
      const obj = this.canvasObjects.find(o => o.id === objectId)
      if (!obj || obj.type !== 'image' || !obj.src) return

      this.isSaving = true
      
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = obj.src
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        const worker = new Worker(new URL('../worker.ts', import.meta.url), { type: 'module' })
        worker.postMessage({
          type: 'background_removal',
          data: {
            imageData: imageData.data.buffer,
            tolerance: 30
          }
        }, [imageData.data.buffer])

        worker.onmessage = (e) => {
          if (e.data.type === 'bg_removed') {
            const processedData = e.data.imageData
            const newImageData = new ImageData(new Uint8ClampedArray(processedData), canvas.width, canvas.height)
            ctx.putImageData(newImageData, 0, 0)
            
            obj.src = canvas.toDataURL('image/png')
            this.saveState()
            this.isSaving = false
            worker.terminate()
          }
        }
      } catch (err) {
        console.error('BG Removal failed:', err)
        this.isSaving = false
      }
    }
  },
  persist: {
    pick: [
      'uploadedFile', 
      'fileType', 
      'canvasObjects', 
      'selectedColors', 
      'user', 
      'token', 
      'currentProjectId', 
      'activeProjectName',
      'theme',
      'zoomLevel',
      'brushColor'
    ]
  }
})

// Patch the store with a debounced save function
// We need to do this where the store is active, or use a watcher in the App.vue
// Let's add a static property or just rely on the component using useDebounceFn

