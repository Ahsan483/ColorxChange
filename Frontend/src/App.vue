<script setup lang="ts">
import { ref, onMounted } from 'vue'
import '@/css/App.css'

const messages = [
  { text: 'Welcome to ColorXChange!', color: '#8b5cf6' },
  { text: 'Zoom & pick colors!', color: '#8b5cf6' },
  { text: 'Edit like a pro.', color: '#8b5cf6' },
  { text: 'Free and fun!', color: '#8b5cf6' },
  { text: 'Unleash creativity!', color: '#8b5cf6' },
]

const currentMessageIndex = ref(0)
const uploadedFile = ref<string | null>(null)
const fileType = ref<string | null>(null)
const extractedColors = ref<{ rgb: string; hex: string }[]>([])
const selectedColors = ref<
  { original: string; newColor: string; transparent: boolean; brightness: number }[]
>([])
const colorHistory = ref<
  { original: string; newColor: string; transparent: boolean; brightness: number }[]
>([])
const isLoading = ref(false)
const loadingMessage = ref('Processing...')
const modifiedFile = ref<string | null>(null)
const showAllColors = ref(false)
const zoomLevel = ref(1)
const tolerance = ref(15)
const realTimePreview = ref(false)
const undoStack = ref<string[]>([])
const redoStack = ref<string[]>([])
const savedPresets = ref<{ name: string; colors: typeof selectedColors.value }[]>([])
const originalImageData = ref<Uint8ClampedArray | null>(null)
const brightness = ref(0)
const contrast = ref(0)
const saturation = ref(100)
const isDrawingMode = ref(false)
const brushColor = ref('#ff0000')

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
let previewCanvas: HTMLCanvasElement
let previewCtx: CanvasRenderingContext2D

// Handle file upload
const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  fileType.value = file.type
  const reader = new FileReader()
  reader.onload = (e) => {
    if (e.target?.result) {
      uploadedFile.value = e.target.result as string
      selectedColors.value = []
      modifiedFile.value = null
      setupCanvas()
    }
  }
  reader.readAsDataURL(file)
}

// Setup canvas
const setupCanvas = async () => {
  isLoading.value = true
  loadingMessage.value = 'Loading media...'
  canvas = document.createElement('canvas')
  ctx = canvas.getContext('2d')!
  previewCanvas = document.createElement('canvas')
  previewCtx = previewCanvas.getContext('2d')!
  if (!ctx || !previewCtx) {
    isLoading.value = false
    return
  }

  const media = fileType.value?.startsWith('video') ? document.createElement('video') : new Image()
  media.src = uploadedFile.value!

  if (fileType.value?.startsWith('video')) {
    ;(media as HTMLVideoElement).currentTime = 0
    await new Promise((resolve) => ((media as HTMLVideoElement).onseeked = resolve))
  } else {
    await new Promise((resolve) => (media.onload = resolve))
  }

  const maxSize = 600
  const scale = Math.min(maxSize / media.width, maxSize / media.height, 1)
  canvas.width = media.width * scale
  canvas.height = media.height * scale
  ctx.drawImage(media, 0, 0, canvas.width, canvas.height)

  previewCanvas.width = canvas.width
  previewCanvas.height = canvas.height
  previewCtx.drawImage(media, 0, 0, canvas.width, canvas.height)

  originalImageData.value = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  modifiedFile.value = canvas.toDataURL('image/png')
  undoStack.value = [modifiedFile.value]
  redoStack.value = []
  isLoading.value = false
}

// Zoom with mouse scroll
const handleZoom = (event: WheelEvent) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.min(Math.max(zoomLevel.value + delta, 1), 3)
  zoomLevel.value = newZoom
}

// Pick color on click
const pickColor = (event: MouseEvent) => {
  if (!ctx || !canvas) return

  const canvasRect = (event.target as HTMLImageElement).getBoundingClientRect()
  const scaleX = canvas.width / canvasRect.width
  const scaleY = canvas.height / canvasRect.height
  const x = Math.floor((event.clientX - canvasRect.left) * scaleX)
  const y = Math.floor((event.clientY - canvasRect.top) * scaleY)

  const pixelData = ctx.getImageData(x, y, 1, 1).data
  const rgb = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`
  const hex = `#${((pixelData[0] << 16) | (pixelData[1] << 8) | pixelData[2]).toString(16).padStart(6, '0')}`

  if (!selectedColors.value.some((c) => c.original === rgb)) {
    selectedColors.value.push({
      original: rgb,
      newColor: '#ffffff',
      transparent: false,
      brightness: 0,
    })
    colorHistory.value.push({
      original: rgb,
      newColor: '#ffffff',
      transparent: false,
      brightness: 0,
    })
    if (realTimePreview.value) applyColorChange()
  }
}

// Extract all prominent colors
const extractAllColors = () => {
  if (!originalImageData.value || showAllColors.value) return

  isLoading.value = true
  loadingMessage.value = 'Extracting all colors...'
  worker.onmessage = (e) => {
    if (e.data.type === 'image' || e.data.type === 'video') {
      extractedColors.value = e.data.colors
      showAllColors.value = true
      isLoading.value = false
    }
  }
  worker.postMessage({
    type: fileType.value?.startsWith('video') ? 'video' : 'image',
    data: originalImageData.value,
  })
}

// Select color from extracted colors or history
const selectColor = (color: { rgb?: string; hex?: string; original?: string }) => {
  const colorValue = color.rgb || color.original || ''
  if (!selectedColors.value.some((c) => c.original === colorValue)) {
    selectedColors.value.push({
      original: colorValue,
      newColor: '#ffffff',
      transparent: false,
      brightness: 0,
    })
    colorHistory.value.push({
      original: colorValue,
      newColor: '#ffffff',
      transparent: false,
      brightness: 0,
    })
    if (realTimePreview.value) applyColorChange()
  }
}

// Remove selected color
const removeColor = (color: string) => {
  selectedColors.value = selectedColors.value.filter((c) => c.original !== color)
  if (realTimePreview.value) applyColorChange()
}

const applyColorChange = () => {
  if (!selectedColors.value.length || !originalImageData.value || !ctx || !canvas || !previewCtx)
    return

  isLoading.value = true
  loadingMessage.value = 'Applying changes...'

  const newData = new Uint8ClampedArray(originalImageData.value)
  const width = canvas.width
  const height = canvas.height

  // Apply color changes with tolerance
  selectedColors.value.forEach(({ original, newColor, transparent, brightness }) => {
    const [rOld, gOld, bOld] = original.replace('rgb(', '').replace(')', '').split(',').map(Number)
    const [rNew, gNew, bNew] = transparent
      ? [0, 0, 0]
      : newColor
          .replace('#', '')
          .match(/.{1,2}/g)!
          .map((x) => parseInt(x, 16))

    for (let i = 0; i < newData.length; i += 4) {
      const r = newData[i]
      const g = newData[i + 1]
      const b = newData[i + 2]
      if (
        Math.abs(r - rOld) <= tolerance.value &&
        Math.abs(g - gOld) <= tolerance.value &&
        Math.abs(b - bOld) <= tolerance.value
      ) {
        newData[i] = transparent ? 0 : rNew
        newData[i + 1] = transparent ? 0 : gNew
        newData[i + 2] = transparent ? 0 : bNew
        newData[i + 3] = transparent ? 0 : 255
      }
    }
  })

  // Apply global brightness, contrast, and saturation to all pixels
  for (let i = 0; i < newData.length; i += 4) {
    let r = newData[i]
    let g = newData[i + 1]
    let b = newData[i + 2]

    // Brightness: Use a very subtle linear scaling with a small multiplier
    const brightnessAdjustment = brightness.value * 0.5 // Scale down to ±25 for smoother, subtler changes
    r = Math.min(255, Math.max(0, r + brightnessAdjustment))
    g = Math.min(255, Math.max(0, g + brightnessAdjustment))
    b = Math.min(255, Math.max(0, b + brightnessAdjustment))

    // Contrast: Use a sigmoidal curve for very gentle contrast adjustment
    const contrastFactor = 1 + (contrast.value / 200) * 0.2 // Scales -50 to 50 to roughly 0.95 to 1.1, very subtle
    r = Math.min(255, Math.max(0, ((r / 255 - 0.5) * contrastFactor + 0.5) * 255))
    g = Math.min(255, Math.max(0, ((g / 255 - 0.5) * contrastFactor + 0.5) * 255))
    b = Math.min(255, Math.max(0, ((b / 255 - 0.5) * contrastFactor + 0.5) * 255))

    // Saturation: Use a gradual scaling with blending for subtle changes
    const rgbToHsl = (r: number, g: number, b: number) => {
      r /= 255
      g /= 255
      b /= 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h = 0,
        s = 0,
        l = (max + min) / 2

      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0)
            break
          case g:
            h = (b - r) / d + 2
            break
          case b:
            h = (r - g) / d + 4
            break
        }
        h /= 6
      }

      return [h, s, l]
    }

    const hslToRgb = (h: number, s: number, l: number) => {
      const saturationScale = Math.min(1.2, saturation.value / 100) // Limit to 120% for very subtle max saturation
      const adjustedS = s * saturationScale // Scale saturation gently
      let r, g, b
      const q = l < 0.5 ? l * (1 + adjustedS) : l + adjustedS - l * adjustedS
      const p = 2 * l - q
      r = hueToRgb(p, q, h + 1 / 3)
      g = hueToRgb(p, q, h)
      b = hueToRgb(p, q, h - 1 / 3)

      // Blend with original saturation for a very subtle effect
      const originalRgb = [r * 255, g * 255, b * 255]
      const [origH, origS, origL] = rgbToHsl(r * 255, g * 255, b * 255)
      const blendFactor = 0.7 // Blend 70% original, 30% adjusted for very subtle changes
      r = originalRgb[0] * blendFactor + r * 255 * (1 - blendFactor)
      g = originalRgb[1] * blendFactor + g * 255 * (1 - blendFactor)
      b = originalRgb[2] * blendFactor + b * 255 * (1 - blendFactor)

      return [r, g, b]
    }

    const hueToRgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const [h, s, l] = rgbToHsl(r, g, b)
    ;[r, g, b] = hslToRgb(h, s, l)

    // Apply the adjusted values back to the pixel data
    newData[i] = r
    newData[i + 1] = g
    newData[i + 2] = b
  }

  // Update the canvas with the new pixel data
  ctx.putImageData(new ImageData(newData, width, height), 0, 0)
  previewCtx.putImageData(new ImageData(newData, width, height), 0, 0)

  modifiedFile.value = canvas.toDataURL('image/png')
  undoStack.value.push(modifiedFile.value)
  redoStack.value = []
  setTimeout(() => (isLoading.value = false), 500)
}

// Undo/Redo
const undo = () => {
  if (undoStack.value.length <= 1) return
  redoStack.value.push(undoStack.value.pop()!)
  modifiedFile.value = undoStack.value[undoStack.value.length - 1]
  const img = new Image()
  img.src = modifiedFile.value!
  img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
}

const redo = () => {
  if (redoStack.value.length === 0) return
  const redoImage = redoStack.value.pop()!
  undoStack.value.push(redoImage)
  modifiedFile.value = redoImage
  const img = new Image()
  img.src = modifiedFile.value!
  img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
}

// Reset changes
const resetChanges = () => {
  if (!ctx || !canvas || !uploadedFile.value) return
  selectedColors.value = []
  extractedColors.value = []
  showAllColors.value = false
  brightness.value = 0
  contrast.value = 0
  saturation.value = 100
  undoStack.value = [uploadedFile.value]
  redoStack.value = []
  modifiedFile.value = uploadedFile.value
  const img = new Image()
  img.src = uploadedFile.value
  img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
}

// Save preset
const savePreset = () => {
  const presetName = prompt('Enter preset name:')
  if (presetName) {
    savedPresets.value.push({ name: presetName, colors: [...selectedColors.value] })
  }
}

// Load preset
const loadPreset = (preset: { name: string; colors: typeof selectedColors.value } | undefined) => {
  if (!preset) return
  selectedColors.value = [...preset.colors]
  if (realTimePreview.value) applyColorChange()
}

// Drawing mode
const toggleDrawingMode = () => {
  isDrawingMode.value = !isDrawingMode.value
}

const drawOnCanvas = (event: MouseEvent) => {
  if (!isDrawingMode.value || !ctx || !canvas) return

  const canvasRect = (event.target as HTMLImageElement).getBoundingClientRect()
  const scaleX = canvas.width / canvasRect.width
  const scaleY = canvas.height / canvasRect.height
  const x = Math.floor((event.clientX - canvasRect.left) * scaleX)
  const y = Math.floor((event.clientY - canvasRect.top) * scaleY)

  ctx.fillStyle = brushColor.value
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fill()
  modifiedFile.value = canvas.toDataURL('image/png')
}

// Download modified file
const downloadFile = () => {
  if (!modifiedFile.value) return
  const link = document.createElement('a')
  link.href = modifiedFile.value
  link.download = fileType.value?.startsWith('video') ? 'modified-frame.png' : 'modified-image.png'
  link.click()
}

// Export Color Palette
const exportPalette = () => {
  const palette = selectedColors.value
    .map((c) => `${c.original} -> ${c.newColor}${c.transparent ? ' (Transparent)' : ''}`)
    .join('\n')
  const blob = new Blob([palette], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'color_palette.txt'
  link.click()
  URL.revokeObjectURL(url)
}

// Invert Colors
const invertColors = () => {
  if (!ctx || !canvas) return
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]
    data[i + 1] = 255 - data[i + 1]
    data[i + 2] = 255 - data[i + 2]
  }
  ctx.putImageData(imageData, 0, 0)
  modifiedFile.value = canvas.toDataURL('image/png')
  undoStack.value.push(modifiedFile.value)
}

// Grayscale
const grayscale = () => {
  if (!ctx || !canvas) return
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
    data[i] = avg
    data[i + 1] = avg
    data[i + 2] = avg
  }
  ctx.putImageData(imageData, 0, 0)
  modifiedFile.value = canvas.toDataURL('image/png')
  undoStack.value.push(modifiedFile.value)
}

// Color Swap
const swapColors = () => {
  if (selectedColors.value.length < 2) return
  const temp = selectedColors.value[0].newColor
  selectedColors.value[0].newColor = selectedColors.value[1].newColor
  selectedColors.value[1].newColor = temp
  if (realTimePreview.value) applyColorChange()
}

// Randomize Colors
const randomizeColors = () => {
  selectedColors.value.forEach((color) => {
    color.newColor = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')}`
  })
  if (realTimePreview.value) applyColorChange()
}

const changeMessage = () => {
  currentMessageIndex.value = (currentMessageIndex.value + 1) % messages.length
}

onMounted(() => {
  setInterval(changeMessage, 3000)
})
</script>

<template>
  <div class="app">
    <header class="header">
      <img alt="ColorXChange logo" class="logo" src="@/assets/logo.png" />
      <h1 :style="{ color: messages[currentMessageIndex].color }" class="title">
        {{ messages[currentMessageIndex].text }}
      </h1>
    </header>

    <div class="main-container">
      <!-- Upload Area -->
      <div v-if="!uploadedFile" class="upload-area">
        <label for="file-upload" class="upload-btn">Upload Image or Video</label>
        <input
          id="file-upload"
          type="file"
          accept="image/*,video/*"
          @change="handleFileUpload"
          hidden
        />
      </div>

      <!-- Loader -->
      <div v-if="isLoading" class="loader-overlay">
        <div class="loader">
          <div class="spinner"></div>
          <p>{{ loadingMessage }}</p>
        </div>
      </div>

      <!-- Editor -->
      <div v-if="uploadedFile && !isLoading" class="editor">
        <div class="preview-section">
          <div class="zoom-container" @wheel="handleZoom">
            <img
              v-if="fileType?.startsWith('image')"
              :src="modifiedFile || uploadedFile"
              alt="Preview"
              class="preview-media"
              @click="pickColor"
              @mousemove="isDrawingMode && drawOnCanvas($event)"
              :style="{ transform: `scale(${zoomLevel})` }"
            />
            <video
              v-else
              :src="uploadedFile"
              controls
              class="preview-media"
              @click="pickColor"
              @mousemove="isDrawingMode && drawOnCanvas($event)"
              :style="{ transform: `scale(${zoomLevel})` }"
            ></video>
          </div>
          <p v-if="fileType?.startsWith('video')" class="note">First frame edited only</p>
          <button @click="extractAllColors" class="all-colors-btn">Show All Colors</button>
        </div>

        <div class="control-section">
          <!-- Extracted Colors -->
          <div v-if="showAllColors && extractedColors.length" class="color-palette">
            <h3>More Colors</h3>
            <div class="color-grid">
              <div
                v-for="color in extractedColors"
                :key="color.hex"
                @click="selectColor(color)"
                :style="{ backgroundColor: color.rgb }"
                class="color-swatch"
                :class="{ selected: selectedColors.some((c) => c.original === color.rgb) }"
              ></div>
            </div>
          </div>

          <!-- Selected Colors -->
          <div v-if="selectedColors.length" class="edit-panel">
            <h3>Edit Colors</h3>
            <div class="edit-grid">
              <div v-for="color in selectedColors" :key="color.original" class="edit-item">
                <div :style="{ backgroundColor: color.original }" class="original-swatch"></div>
                <span class="arrow">➜</span>
                <input
                  type="color"
                  v-model="color.newColor"
                  class="color-input"
                  @input="realTimePreview && applyColorChange()"
                />
                <input
                  type="range"
                  v-model="color.brightness"
                  min="-100"
                  max="100"
                  step="1"
                  class="brightness-slider"
                  @input="realTimePreview && applyColorChange()"
                />
                <label class="transparent-toggle">
                  <input
                    type="checkbox"
                    v-model="color.transparent"
                    @change="realTimePreview && applyColorChange()"
                  />
                  Transparent
                </label>
                <button @click="removeColor(color.original)" class="remove-btn">×</button>
              </div>
            </div>
            <div class="tolerance-control">
              <label>Tolerance: {{ tolerance }}</label>
              <input
                type="range"
                v-model="tolerance"
                min="5"
                max="50"
                @change="realTimePreview && applyColorChange()"
              />
            </div>
            <div class="global-adjustments">
              <label>Brightness: {{ brightness }}</label>
              <input
                type="range"
                v-model="brightness"
                min="-50"
                max="50"
                step="1"
                @change="applyColorChange"
              />
              <label>Contrast: {{ contrast }}</label>
              <input
                type="range"
                v-model="contrast"
                min="-50"
                max="50"
                step="1"
                @change="applyColorChange"
              />
              <label>Saturation: {{ saturation }}</label>
              <input
                type="range"
                v-model="saturation"
                min="0"
                max="150"
                step="1"
                @change="applyColorChange"
              />
            </div>
            <div class="action-buttons">
              <button @click="applyColorChange" class="apply-btn" :disabled="realTimePreview">
                Apply
              </button>
              <button @click="undo" class="undo-btn" :disabled="undoStack.length <= 1">Undo</button>
              <button @click="redo" class="redo-btn" :disabled="redoStack.length === 0">
                Redo
              </button>
              <button @click="resetChanges" class="reset-btn">Reset</button>
              <button @click="savePreset" class="preset-btn">Save Preset</button>
              <select
                v-if="savedPresets.length"
                @change="
                  loadPreset(
                    savedPresets.find(
                      (p) => p.name === ($event.target as HTMLSelectElement).value,
                    ) || savedPresets[0],
                  )
                "
              >
                <option value="">Load Preset</option>
                <option v-for="preset in savedPresets" :key="preset.name" :value="preset.name">
                  {{ preset.name }}
                </option>
              </select>
              <label class="realtime-toggle">
                <input type="checkbox" v-model="realTimePreview" />
                Real-Time
              </label>
              <button
                @click="toggleDrawingMode"
                class="draw-btn"
                :class="{ active: isDrawingMode }"
              >
                Draw
              </button>
              <input type="color" v-model="brushColor" v-if="isDrawingMode" class="brush-color" />
              <button @click="exportPalette" class="export-btn">Export Palette</button>
              <button @click="invertColors" class="invert-btn">Invert</button>
              <button @click="grayscale" class="grayscale-btn">Grayscale</button>
              <button @click="swapColors" class="swap-btn" :disabled="selectedColors.length < 2">
                Swap
              </button>
              <button @click="randomizeColors" class="random-btn">Randomize</button>
              <button @click="downloadFile" class="download-btn" :disabled="!modifiedFile">
                Download
              </button>
            </div>
          </div>

          <!-- Color History -->
          <div v-if="colorHistory.length" class="history-panel">
            <h3>History</h3>
            <div class="color-grid">
              <div
                v-for="color in colorHistory"
                :key="color.original"
                @click="selectColor(color)"
                :style="{ backgroundColor: color.original }"
                class="color-swatch"
                :class="{ selected: selectedColors.some((c) => c.original === color.original) }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
