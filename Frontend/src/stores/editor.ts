import { defineStore } from 'pinia'
import type { EditorState, ColorChange, CanvasObject } from '../types/editor'

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
  }),
  actions: {
    setUploadedFile(file: string, type: string) {
      this.uploadedFile = file
      this.fileType = type
    },
    addColorChange(color: ColorChange) {
      if (!this.selectedColors.some(c => c.original === color.original)) {
        this.selectedColors.push(color)
        this.colorHistory.push({ ...color })
      }
    },
    removeColorChange(originalColor: string) {
      this.selectedColors = this.selectedColors.filter(c => c.original !== originalColor)
    },
    async applyPreset(preset: any) {
      if (this.activeLayerId) {
        const obj = this.canvasObjects.find(o => o.id === this.activeLayerId)
        if (obj && obj.type === 'text') {
          const { name, category, ...styleProps } = JSON.parse(JSON.stringify(preset))
          Object.assign(obj, styleProps)
        }
      }
    },
    updateCanvasObjects(objects: CanvasObject[]) {
      this.canvasObjects = objects
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
        stroke: { color: '#000000', width: 2, enabled: false },
        gradient: undefined,
        letterSpacing: 0,
        lineHeight: 1.2
      })
      this.activeLayerId = id
    },
    toggleLock(id: string) {
      const obj = this.canvasObjects.find(o => o.id === id)
      if (obj) obj.locked = !obj.locked
    },
    toggleVisibility(id: string) {
      const obj = this.canvasObjects.find(o => o.id === id)
      if (obj) obj.visible = !obj.visible
    },
    deleteLayer(id: string) {
      this.canvasObjects = this.canvasObjects.filter(o => o.id !== id)
      if (this.activeLayerId === id) this.activeLayerId = null
    },
    moveLayerUp(id: string) {
      const idx = this.canvasObjects.findIndex(o => o.id === id)
      if (idx < this.canvasObjects.length - 1) {
        const temp = this.canvasObjects[idx]
        this.canvasObjects[idx] = this.canvasObjects[idx + 1]
        this.canvasObjects[idx + 1] = temp
      }
    },
    moveLayerDown(id: string) {
      const idx = this.canvasObjects.findIndex(o => o.id === id)
      if (idx > 0) {
        const temp = this.canvasObjects[idx]
        this.canvasObjects[idx] = this.canvasObjects[idx - 1]
        this.canvasObjects[idx - 1] = temp
      }
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
    }
  },
  persist: true
})
