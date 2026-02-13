<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useDebounceFn } from '@vueuse/core'
import ContextToolbar from './ContextToolbar.vue'
import AuthModal from '@/components/auth/AuthModal.vue'

// Atomic Objects for Professional & Scalable Architecture
import TextObject from './objects/TextObject.vue'
import ImageObject from './objects/ImageObject.vue'
import ShapeObject from './objects/ShapeObject.vue'

const store = useEditorStore()

// Autosave Logic
const triggerAutosave = useDebounceFn(() => {
  store.saveProject()
}, 3000)

watch(() => store.canvasObjects, () => {
  // Only autosave if we are in a project (handled by store)
  triggerAutosave()
}, { deep: true })

const stageConfig = ref({
  width: 800,
  height: 600,
  draggable: false, // Disabled global drag to fix "moving both" issue
})

const container = ref<HTMLElement | null>(null)
const mainImage = ref<HTMLImageElement | null>(null)
const transformer = ref<any>(null)
const stageRef = ref<any>(null)
const isEditing = ref(false)
const editingText = ref('')
const editingPos = ref({ x: 0, y: 0 })
const editingId = ref('')

// Crop State
const isCropping = computed(() => store.selectedTool === 'crop' && store.activeLayerId && !store.activeLayerId.startsWith('line'))
const activeObject = computed(() => store.canvasObjects.find(o => o.id === store.activeLayerId))

const handleCropDrag = (e: any, anchor: string) => {
  if (!activeObject.value || !stageRef.value) return
  const obj = activeObject.value
  const stage = stageRef.value.getNode()
  
  // Get pointer position relative to the object's parent (the layer/world)
  const pos = stage.getRelativePointerPosition()
  if (!pos) return

  // Initialize crop if missing
  if (!obj.crop) {
    const initialWidth = obj.width || (obj.type === 'image' && loadedImages.value[obj.id]?.width) || 200
    const initialHeight = obj.height || (obj.type === 'image' && loadedImages.value[obj.id]?.height) || 50
    obj.crop = { x: 0, y: 0, width: initialWidth, height: initialHeight }
    obj.width = initialWidth
    obj.height = initialHeight
  }

  // To properly crop, we need to find the change in the object's LOCAL coordinate system
  // We use the inverse of the object's transform
  const rad = (obj.rotation || 0) * Math.PI / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  // Calculate mouse position relative to object origin [obj.x, obj.y]
  const dx_world = pos.x - obj.x
  const dy_world = pos.y - obj.y

  // Rotate world delta back to local space
  // x' = x*cos + y*sin
  // y' = -x*sin + y*cos
  const localX = (dx_world * cos + dy_world * sin) / (obj.scaleX || 1)
  const localY = (-dx_world * sin + dy_world * cos) / (obj.scaleY || 1)

  // The localX/localY now tell us where the mouse is RELATIVE to the top-left of the original UN-CROPPED image origin (at obj.x, obj.y)
  // But wait, obj.x/y IS the top-left of the CURRENT crop.
  // We want to avoid cumulative errors, so we'd ideally store the 'start' state.
  // For now, let's use movement deltas but in LOCAL space.
  
  const moveX = (e.evt.movementX / (store.zoomLevel || 1))
  const moveY = (e.evt.movementY / (store.zoomLevel || 1))
  
  // Local deltas
  const ldx = (moveX * cos + moveY * sin) / (obj.scaleX || 1)
  const ldy = (-moveX * sin + moveY * cos) / (obj.scaleY || 1)

  if (anchor.includes('top')) {
    obj.crop.y += ldy
    obj.crop.height -= ldy
    obj.height = obj.crop.height
    obj.x += ldy * (obj.scaleY || 1) * -sin
    obj.y += ldy * (obj.scaleY || 1) * cos
  }
  if (anchor.includes('bottom')) {
    obj.crop.height += ldy
    obj.height = obj.crop.height
  }
  if (anchor.includes('left')) {
    obj.crop.x += ldx
    obj.crop.width -= ldx
    obj.width = obj.crop.width
    obj.x += ldx * (obj.scaleX || 1) * cos
    obj.y += ldx * (obj.scaleX || 1) * sin
  }
  if (anchor.includes('right')) {
    obj.crop.width += ldx
    obj.width = obj.crop.width
  }

  // Clamping
  obj.crop.width = Math.max(1, obj.crop.width)
  obj.crop.height = Math.max(1, obj.crop.height)
  obj.width = obj.crop.width
  obj.height = obj.crop.height

  // Prevent handles from moving their own X/Y (they are placed reactively)
  if (e.target) {
    e.target.x(0)
    e.target.y(0)
  }
}

// Enhanced Crop Initialization with Node Measurement
const initializeCropForObject = (obj: any) => {
  if (!obj || obj.crop) return

  const stage = stageRef.value?.getNode()
  const node = stage?.findOne('.' + obj.id)
  
  if (obj.type === 'image') {
    const img = loadedImages.value[obj.id]
    if (img) {
      obj.crop = { x: 0, y: 0, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height }
      obj.width = img.naturalWidth || img.width
      obj.height = img.naturalHeight || img.height
      return true
    }
    return false // Wait for image load
  }

  // For Text and Shapes, use the node's bounding box if available
  let w = obj.width
  let h = obj.height

  if (node && (!w || !h)) {
    const box = node.getClientRect({ relativeTo: node.getParent() })
    w = box.width / (obj.scaleX || 1)
    h = box.height / (obj.scaleY || 1)
  }

  obj.width = w || 200
  obj.height = h || 50
  obj.crop = { x: 0, y: 0, width: obj.width, height: obj.height }
  return true
}

// Watchers for robust Crop tool initialization
watch([() => store.activeLayerId, () => store.selectedTool], ([id, tool]) => {
  if (tool === 'crop' && id) {
    const obj = store.canvasObjects.find(o => o.id === id)
    if (obj && !obj.crop) {
      // Small tick to ensure Konva nodes are rendered for measurement
      nextTick(() => {
        initializeCropForObject(obj)
      })
    }
  }
  updateTransformer() 
}, { immediate: true })

watch(() => loadedImages.value, (imgs) => {
  if (store.selectedTool === 'crop' && store.activeLayerId) {
    const obj = store.canvasObjects.find(o => o.id === store.activeLayerId)
    if (obj && obj.type === 'image' && !obj.crop && imgs[obj.id]) {
      initializeCropForObject(obj)
    }
  }
}, { deep: true })

const handleResetCrop = () => {
  if (!activeObject.value) return
  const obj = activeObject.value
  delete obj.crop
  initializeCropForObject(obj)
  store.saveState()
}

const handleUndoCrop = () => {
  store.undo()
}

let resizeObserver: ResizeObserver | null = null

const updateSize = () => {
  if (container.value) {
    const width = container.value.offsetWidth
    const height = container.value.offsetHeight
    if (width > 0 && height > 0) {
      stageConfig.value.width = width
      stageConfig.value.height = height
    }
  }
}

onMounted(() => {
  updateSize()
  resizeObserver = new ResizeObserver(() => {
    updateSize()
  })
  if (container.value) {
    resizeObserver.observe(container.value)
  }
  // Expose stage for global export
  if (stageRef.value) {
    (window as any).stageInstance = stageRef.value.getNode()
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

const patternImages = ref<Record<string, HTMLImageElement>>({})

const loadedImages = ref<Record<string, HTMLImageElement>>({})

// Optimized image/pattern loading logic to prevent lag during property changes (like color/drag)
watch(() => store.canvasObjects, (objects) => {
  objects.forEach(obj => {
    // Only process if it's a pattern or image that hasn't been cached yet or has changed source
    if (obj.fillType === 'pattern' && obj.pattern?.source) {
      if (!patternImages.value[obj.id] || patternImages.value[obj.id].src !== obj.pattern.source) {
        const img = new Image()
        img.src = obj.pattern.source
        img.onload = () => { patternImages.value[obj.id] = img }
      }
    }
    if (obj.type === 'image' && obj.src) {
      if (!loadedImages.value[obj.id] || loadedImages.value[obj.id].src !== obj.src) {
        const img = new Image()
        img.src = obj.src
        img.onload = () => { loadedImages.value[obj.id] = img }
      }
    }
  })
}, { deep: false }) // Use shallow watch, color changes inside objects won't trigger this anymore

// Explicitly watch for SRC or TYPE changes to reload images
watch(() => store.canvasObjects.map(o => o.id + (o.type === 'image' ? o.src : (o.type === 'text' && o.fillType === 'pattern' ? o.pattern?.source : ''))), () => {
    // Re-check loading logic when structure or sources change
    store.canvasObjects.forEach(obj => {
        if (obj.fillType === 'pattern' && obj.pattern?.source) {
            if (!patternImages.value[obj.id] || patternImages.value[obj.id].src !== obj.pattern.source) {
                const img = new Image()
                img.src = obj.pattern.source
                img.onload = () => { patternImages.value[obj.id] = img }
            }
        }
        if (obj.type === 'image' && obj.src) {
            if (!loadedImages.value[obj.id] || loadedImages.value[obj.id].src !== obj.src) {
                const img = new Image()
                img.src = obj.src
                img.onload = () => { loadedImages.value[obj.id] = img }
            }
        }
    })
}, { deep: false })

const imageConfig = computed(() => {
  if (!mainImage.value) return null
  
  const stageW = stageConfig.value.width
  const stageH = stageConfig.value.height
  const imgW = mainImage.value.width
  const imgH = mainImage.value.height

  const scale = Math.min((stageW * 0.9) / imgW, (stageH * 0.9) / imgH, 1)

  return {
    image: mainImage.value,
    x: stageW / 2 - (imgW * scale) / 2,
    y: stageH / 2 - (imgH * scale) / 2,
    scaleX: scale,
    scaleY: scale,
    draggable: !store.isDrawingMode,
    name: 'main-image'
  }
})

const isDrawing = ref(false)

const handleMouseDown = (e: any) => {
  const stage = e.target.getStage()
  if (store.selectedTool === 'brush' || store.selectedTool === 'eraser') {
    isDrawing.value = true
    const pos = stage.getRelativePointerPosition()
    const id = 'line-' + Date.now()
    
    store.canvasObjects.push({
      id,
      type: 'line',
      x: 0,
      y: 0,
      points: [pos.x, pos.y, pos.x, pos.y],
      stroke: store.selectedTool === 'eraser' ? '#ffffff' : store.brushColor,
      strokeWidth: store.selectedTool === 'eraser' ? 20 : 5,
      tension: 0.5,
      lineCap: 'round',
      lineJoin: 'round',
      draggable: false,
      visible: true,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      locked: false,
      // Eraser logic often needs globalCompositeOperation, but simple white overlay works for now
      // Or we can use destination-out if we render heavily
    })
    store.activeLayerId = id
  } else if (store.selectedTool === 'shape') {
     // Start shape logic
     const pos = stage.getRelativePointerPosition()
     const id = 'rect-' + Date.now()
     store.canvasObjects.push({
       id,
       type: 'shape',
       x: pos.x,
       y: pos.y,
       width: 1,
       height: 1,
       fill: store.brushColor || 'red',
       draggable: true,
       visible: true,
       opacity: 1,
       scaleX: 1,
       scaleY: 1,
       rotation: 0,
       locked: false
     })
     store.activeLayerId = id
     isDrawing.value = true // reusing flag for shape drag
  }
}

const handleMouseMove = (e: any) => {
  if (!isDrawing.value) return
  
  const stage = e.target.getStage()
  const point = stage.getRelativePointerPosition()
  
  if (store.selectedTool === 'brush' || store.selectedTool === 'eraser') {
    const lastLine = store.canvasObjects[store.canvasObjects.length - 1]
    // append points
    if (lastLine && lastLine.type === 'line' && lastLine.points) {
      const newPoints = lastLine.points.concat([point.x, point.y])
      lastLine.points = newPoints
    }
  } else if (store.selectedTool === 'shape') {
     const lastShape = store.canvasObjects[store.canvasObjects.length - 1]
     if (lastShape && lastShape.type === 'shape') {
       lastShape.width = point.x - lastShape.x
       lastShape.height = point.y - lastShape.y
     }
  }
}

const handleMouseUp = () => {
  if (isDrawing.value) {
    store.saveState()
  }
  isDrawing.value = false
}

const handleCanvasClick = (e: any) => {
  if (isEditing.value || isDrawing.value) return

  const stage = e.target.getStage()
  let target = e.target
  
  // If clicked on stage background
  if (target === stage) {
    store.activeLayerId = null
    updateTransformer()
    
    if (store.selectedTool === 'text') {
      const pos = stage.getRelativePointerPosition()
      store.addTextObject(pos.x, pos.y)
    }
    return
  }

  // Find the named group or object
  let objId = target.name()
  
  // Traverse up to find the object ID (Groups have the name)
  let current = target
  while (current && !objId && current !== stage) {
    if (current.name()) {
      objId = current.name()
    } else {
      current = current.getParent()
    }
  }

  const obj = store.canvasObjects.find(o => o.id === objId)
  
  // If object is locked or logic failed, deselect
  if (!obj || obj.locked) {
     if (target !== stage) {
       // If we clicked something but it's not a valid/unlocked object, 
       // let the event potentially pass through or deselect
       store.activeLayerId = null
       updateTransformer()
     }
     return
  }

  // Select the object
  store.activeLayerId = objId
  updateTransformer()
  
  if (store.selectedTool === 'picker') {
    onPickColor(e)
  }
}

const updateTransformer = () => {
  const tr = transformer.value?.getNode()
  if (!tr) return

  const stage = stageRef.value?.getNode()
  // Transformer should find the GROUP which has the name = activeLayerId
  const selectedNode = stage.findOne('.' + store.activeLayerId)

  if (selectedNode && store.selectedTool !== 'crop') {
    tr.nodes([selectedNode])
  } else {
    tr.nodes([])
  }
}

const handleDblClick = (e: any) => {
  let target = e.target
  let objId = target.name()
  
  if (!objId && target.getParent && target.getParent().name()) {
    objId = target.getParent().name()
    target = target.getParent()
  }

  const obj = store.canvasObjects.find(o => o.id === objId)

  if (obj && obj.type === 'text' && !obj.locked) {
    // Hide original node to avoid overlap while typing
    const node = target
    node.hide()

    isEditing.value = true
    editingId.value = objId
    editingText.value = obj.text || ''
    
    const stage = target.getStage()
    const textPosition = target.getAbsolutePosition()
    const stageBox = stage.container().getBoundingClientRect()
    
    // Pass styles to the textarea to match canvas text perfectly
    const zoom = stage.scaleX()
    editingPos.value = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
      width: (obj.width || 200) * (obj.scaleX || 1) * zoom,
      fontSize: (obj.fontSize || 36) * (obj.scaleY || 1) * zoom,
      fontFamily: obj.fontFamily || 'Inter',
      color: obj.fill || '#000',
      rotation: obj.rotation || 0,
      align: obj.align || 'left'
    }
  }
}

const finalizeTextEdit = () => {
  if (!isEditing.value) return
  const obj = store.canvasObjects.find(o => o.id === editingId.value)
  if (obj) {
    if (obj.text !== editingText.value) {
      obj.text = editingText.value
      store.saveState()
    }

    // Show the node again
    const stage = stageRef.value?.getNode()
    const node = stage?.findOne('.' + editingId.value)
    if (node) node.show()
  }
  isEditing.value = false
  editingId.value = ''
}

const onPickColor = (e: any) => {
  if (!mainImage.value || !imageConfig.value) return
  
  const stage = e.target.getStage()
  const pos = stage.getRelativePointerPosition()
  
  const canvas = document.createElement('canvas')
  canvas.width = mainImage.value.width
  canvas.height = mainImage.value.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(mainImage.value, 0, 0)
  
  const imgConf = imageConfig.value
  const imgX = (pos.x - imgConf.x) / imgConf.scaleX
  const imgY = (pos.y - imgConf.y) / imgConf.scaleY
  
  if (imgX >= 0 && imgX < canvas.width && imgY >= 0 && imgY < canvas.height) {
    const pixel = ctx.getImageData(Math.floor(imgX), Math.floor(imgY), 1, 1).data
    const rgb = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`
    store.addColorChange({
      original: rgb,
      newColor: '#ffffff',
      transparent: false,
      brightness: 0
    })
    // addColorChange calls saveState
  }
}

const handleTransformEnd = (e: any) => {
  const node = e.target
  const obj = store.canvasObjects.find(o => o.id === node.name())
  if (obj) {
    obj.x = node.x()
    obj.y = node.y()
    obj.scaleX = node.scaleX()
    obj.scaleY = node.scaleY()
    obj.rotation = node.rotation()
    store.saveState()
  }
}

const handleWheel = (e: any) => {
  const scaleBy = 1.1
  const stage = e.target.getStage()
  const oldScale = stage.scaleX()
  const pointer = stage.getPointerPosition()

  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  }

  const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
  stage.scale({ x: newScale, y: newScale })
  store.zoomLevel = newScale

  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  }
  stage.position(newPos)
}
</script>

<template>
  <div ref="container" class="canvas-container">
    <v-stage 
      ref="stageRef"
      :config="stageConfig" 
      @wheel="handleWheel"
      @click="handleCanvasClick"
      @dblclick="handleDblClick"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @touchstart="handleMouseDown"
      @touchmove="handleMouseMove"
      @touchend="handleMouseUp"
    >
      <v-layer>
        <!-- DYNAMIC PROJECT OBJECTS -->
        <template v-for="obj in store.canvasObjects" :key="obj.id">
          <!-- Text Layer -->
          <TextObject 
            v-if="obj.type === 'text'"
            :obj="obj"
            :pattern-images="patternImages"
            @transformend="handleTransformEnd"
          />

          <!-- Image Layer -->
          <ImageObject 
            v-else-if="obj.type === 'image'"
            :obj="obj"
            :loaded-image="loadedImages[obj.id]"
            @transformend="handleTransformEnd"
          />

          <!-- Shape Layer -->
          <ShapeObject 
            v-else-if="obj.type === 'shape'"
            :obj="obj"
            @transformend="handleTransformEnd"
          />

          <!-- Line/Brush -->
          <v-line
            v-else-if="obj.type === 'line'"
            :config="{
              points: obj.points,
              stroke: obj.stroke as string,
              strokeWidth: obj.strokeWidth,
              tension: obj.tension,
              lineCap: obj.lineCap,
              lineJoin: obj.lineJoin,
              name: obj.id,
              draggable: !obj.locked,
              listening: !obj.locked
            }"
            @transformend="handleTransformEnd"
            @dragend="handleTransformEnd"
          />
        </template>

        <v-transformer 
          ref="transformer"
          :config="{
            rotateEnabled: true,
            enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'left-middle', 'right-middle']
          }"
        />

        <v-text 
          v-if="!store.uploadedFile" 
          :config="{ 
            text: 'COLORXCHANGE PRO\n\nDrag images here or use the folder icon.\nDouble-click text to edit. Use handles to resize.', 
            fontSize: 16, 
            fill: '#444', 
            width: stageConfig.width,
            align: 'center',
            verticalAlign: 'middle',
            y: stageConfig.height / 2 - 50,
            fontFamily: 'Inter',
            fontStyle: '800'
          }" 
        />
      </v-layer>

    <!-- Crop Overlay Layer (Topmost) -->
    <v-layer v-if="isCropping && activeObject">
        <!-- Professional Dimmed Mask -->
        <v-shape
          :config="{
            sceneFunc: (context: any, shape: any) => {
              const stage = shape.getStage();
              const width = stage.width();
              const height = stage.height();
              
              context.beginPath();
              context.rect(0, 0, width, height);
              
              // Define the cutout area
              const cx = activeObject.x;
              const cy = activeObject.y;
              const cw = (activeObject.width || 200) * activeObject.scaleX;
              const ch = (activeObject.height || 50) * activeObject.scaleY;
              
              // We rotate the cutout context
              context.save();
              context.translate(cx, cy);
              context.rotate(activeObject.rotation * Math.PI / 180);
              context.rect(0, 0, cw, ch);
              context.restore();
              
              context.closePath();
              context.fillShape(shape);
            },
            fill: 'rgba(0,0,0,0.6)',
            fillRule: 'evenodd',
            listening: false
          }"
        />
        
        <!-- Crop Boundary -->
        <v-rect
          :config="{
            x: activeObject.x,
            y: activeObject.y,
            width: (activeObject.width || 100) * activeObject.scaleX,
            height: (activeObject.height || 100) * activeObject.scaleY,
            stroke: '#ffffff',
            strokeWidth: 2,
            dash: [10, 5],
            rotation: activeObject.rotation,
            listening: false
          }"
        />

        <!-- 8 Precision Handles -->
        <v-group
          v-for="anchor in [
            'top-left', 'top-center', 'top-right', 
            'middle-left', 'middle-right', 
            'bottom-left', 'bottom-center', 'bottom-right'
          ]"
          :key="anchor"
          :config="{
            x: activeObject.x,
            y: activeObject.y,
            rotation: activeObject.rotation,
            listening: true
          }"
        >
          <v-rect
            :config="{
              x: anchor.includes('left') ? 0 : (anchor.includes('right') ? (activeObject.width || 100) * activeObject.scaleX : ((activeObject.width || 100) * activeObject.scaleX) / 2),
              y: anchor.includes('top') ? 0 : (anchor.includes('bottom') ? (activeObject.height || 100) * activeObject.scaleY : ((activeObject.height || 100) * activeObject.scaleY) / 2),
              offsetX: 6,
              offsetY: 6,
              width: 12,
              height: 12,
              fill: '#8b5cf6',
              stroke: 'white',
              strokeWidth: 2,
              draggable: true,
              name: 'crop-handle-' + anchor
            }"
            @dragmove="(e: any) => handleCropDrag(e, anchor)"
            @dragend="store.saveState"
          />
        </v-group>
    </v-layer>
  </v-stage>

  <!-- Apply Crop Button -->
  <div v-if="isCropping" class="crop-actions">
    <button class="crop-btn secondary" @click="handleUndoCrop">
      <i class="fas fa-undo"></i> Undo
    </button>
    <button class="crop-btn secondary" @click="handleResetCrop">
      <i class="fas fa-sync-alt"></i> Reset
    </button>
    <button class="apply-crop-btn" @click="store.selectedTool = 'select'">
      <i class="fas fa-check"></i> Apply Crop
    </button>
  </div>

    <!-- Inline Text Editor -->
    <textarea
      v-if="isEditing"
      v-model="editingText"
      class="inline-editor"
      :style="{
        top: editingPos.y + 'px',
        left: editingPos.x + 'px',
        width: editingPos.width + 'px',
        fontSize: editingPos.fontSize + 'px',
        fontFamily: editingPos.fontFamily,
        color: editingPos.color,
        textAlign: editingPos.align,
        transform: `rotate(${editingPos.rotation}deg)`,
        transformOrigin: 'top left'
      }"
      :ref="(el: any) => el?.focus()"
      @blur="finalizeTextEdit"
      @keyup.enter.shift="finalizeTextEdit"
    ></textarea>

    <!-- Floating Tools -->
    <ContextToolbar />
    
    <AuthModal 
      :is-open="store.isAuthModalOpen" 
      @close="store.isAuthModalOpen = false" 
    />
  </div>
</template>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: transparent;
}

.inline-editor {
  position: fixed;
  z-index: 1000;
  background: transparent;
  color: black;
  border: 1px solid rgba(139, 92, 246, 0.5);
  outline: none;
  padding: 0;
  margin: 0;
  min-width: 50px;
  overflow: hidden;
  resize: none;
  line-height: 1.1;
  white-space: pre-wrap;
}
.crop-actions {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  gap: 12px;
}

.crop-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 99px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.crop-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.apply-crop-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 99px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.apply-crop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
  background: #7c3aed;
}

.apply-crop-btn:active {
  transform: translateY(0);
}
</style>
