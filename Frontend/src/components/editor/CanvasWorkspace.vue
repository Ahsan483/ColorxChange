<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const stageConfig = ref({
  width: 800,
  height: 600,
  draggable: true,
})

const container = ref<HTMLElement | null>(null)
const mainImage = ref<HTMLImageElement | null>(null)
const transformer = ref<any>(null)
const stageRef = ref<any>(null)
const isEditing = ref(false)
const editingText = ref('')
const editingPos = ref({ x: 0, y: 0 })
const editingId = ref('')

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

watch(() => store.uploadedFile, (newVal) => {
  if (newVal) {
    const img = new Image()
    img.src = newVal
    img.onload = () => {
      mainImage.value = img
    }
  } else {
    mainImage.value = null
  }
}, { immediate: true })

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

const handleCanvasClick = (e: any) => {
  if (isEditing.value) return

  const stage = e.target.getStage()
  const target = e.target
  
  if (target === stage) {
    store.activeLayerId = null
    updateTransformer()
    
    if (store.selectedTool === 'text') {
      const pos = stage.getRelativePointerPosition()
      store.addTextObject(pos.x, pos.y)
    }
    return
  }

  const objId = target.name()
  const obj = store.canvasObjects.find(o => o.id === objId)
  
  if (obj?.locked) return

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
  const selectedNode = stage.findOne('.' + store.activeLayerId)

  if (selectedNode) {
    tr.nodes([selectedNode])
  } else {
    tr.nodes([])
  }
}

const handleDblClick = (e: any) => {
  const target = e.target
  const objId = target.name()
  const obj = store.canvasObjects.find(o => o.id === objId)

  if (obj && obj.type === 'text' && !obj.locked) {
    isEditing.value = true
    editingId.value = objId
    editingText.value = obj.text || ''
    
    const stage = target.getStage()
    const textPosition = target.getAbsolutePosition()
    const stageBox = stage.container().getBoundingClientRect()
    
    editingPos.value = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y
    }
  }
}

const finalizeTextEdit = () => {
  if (!isEditing.value) return
  const obj = store.canvasObjects.find(o => o.id === editingId.value)
  if (obj) {
    obj.text = editingText.value
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
    >
      <v-layer>
        <v-image 
          v-if="imageConfig" 
          :config="imageConfig" 
        />
        
        <v-text
          v-for="obj in store.canvasObjects"
          :key="obj.id"
          :config="{
            ...obj,
            name: obj.id,
            visible: obj.visible,
            opacity: obj.opacity,
            draggable: !obj.locked,
            
            // Fill & Gradient Logic (High Priority)
            fill: (obj.gradient && obj.gradient.colors && obj.gradient.colors.length > 0) ? undefined : (obj.fill || '#ffffff'),
            fillPriority: (obj.gradient && obj.gradient.colors && obj.gradient.colors.length > 0) ? 'linear-gradient' : 'color',
            fillLinearGradientStartPoint: obj.gradient ? { x: 0, y: 0 } : undefined,
            fillLinearGradientEndPoint: obj.gradient ? { 
              x: (obj.fontSize || 36) * 10 * Math.cos((obj.gradient.angle || 0) * Math.PI / 180), 
              y: (obj.fontSize || 36) * 10 * Math.sin((obj.gradient.angle || 0) * Math.PI / 180) 
            } : undefined,
            fillLinearGradientColorStops: obj.gradient ? obj.gradient.colors.flatMap(c => [c.offset, c.color]) : undefined,
            
            // Shadow Logic (Flattened Props for max compatibility)
            shadowColor: obj.shadow?.color || '#000000',
            shadowBlur: obj.shadow?.blur || 0,
            shadowOffsetX: obj.shadow?.offsetX || 0,
            shadowOffsetY: obj.shadow?.offsetY || 0,
            shadowOpacity: obj.shadow?.opacity ?? 1,
            shadowEnabled: true, // Let blur/offset determine visibility
            shadowForStroke: false, 

            // Stroke Logic
            stroke: (obj.stroke?.enabled && obj.stroke.width > 0) ? obj.stroke.color : undefined,
            strokeWidth: (obj.stroke?.enabled && obj.stroke.width > 0) ? obj.stroke.width : 0,
            strokeScaleEnabled: false,
            
            // Layout & Polish
            letterSpacing: obj.letterSpacing || 0,
            lineHeight: obj.lineHeight || 1.2,
            align: 'left',
            
            listening: !obj.locked,
            perfectDrawEnabled: true
          }"
          @transformend="handleTransformEnd"
          @dragend="handleTransformEnd"
        />

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
    </v-stage>

    <!-- Inline Text Editor -->
    <textarea
      v-if="isEditing"
      v-model="editingText"
      class="inline-editor"
      :style="{
        top: editingPos.y + 'px',
        left: editingPos.x + 'px'
      }"
      :ref="(el: any) => el?.focus()"
      @blur="finalizeTextEdit"
    ></textarea>
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
  background: white;
  color: black;
  border: 1px solid #8b5cf6;
  outline: none;
  padding: 4px;
  font-family: inherit;
  font-size: 16px;
  min-width: 100px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
</style>
