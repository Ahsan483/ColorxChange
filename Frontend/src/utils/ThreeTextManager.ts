import * as THREE from 'three'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { FontLoader, Font } from 'three/addons/loaders/FontLoader.js'

export class ThreeTextManager {
  private static instance: ThreeTextManager
  private font: Font | null = null
  private loader = new FontLoader()

  private constructor() {
    // Preload a default font (using a standard Three.js font URL or local)
    // For now we load from a CDN or local public path for stability
    this.loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font: Font) => {
      this.font = font
    })
  }

  public static getInstance(): ThreeTextManager {
    if (!ThreeTextManager.instance) {
      ThreeTextManager.instance = new ThreeTextManager()
    }
    return ThreeTextManager.instance
  }

  public async renderTextToCanvas(
    text: string,
    options: {
      depth: number,
      color: string,
      rotationX: number,
      rotationY: number,
      rotationZ: number,
      materialType: 'standard' | 'metal' | 'glass' | 'neon',
      fontSize: number
    }
  ): Promise<HTMLCanvasElement> {
    if (!this.font) {
        // Wait for font if not loaded (simple poll for MVP)
        await new Promise(resolve => setTimeout(resolve, 500))
        if (!this.font) return document.createElement('canvas') // Fallback empty
    }

    const width = 800 // High res canvas
    const height = 600
    
    // 1. Setup Scene
    const scene = new THREE.Scene()
    // Transparent background? No, Three.js canvas is transparent by default if alpha: true
    
    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000)
    camera.position.set(0, 0, 400)

    // 3. Renderer
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)

    // 4. Geometry
    const geometry = new TextGeometry(text, {
      font: this.font,
      size: options.fontSize || 80,
      depth: options.depth * 2, // Extrusion depth (was 'height' in old Three.js)
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 1,
      bevelOffset: 0,
      bevelSegments: 5
    })

    // Center geometry
    geometry.computeBoundingBox()
    const xOffset = -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x)
    const yOffset = -0.5 * (geometry.boundingBox!.max.y - geometry.boundingBox!.min.y)
    geometry.translate(xOffset, yOffset, 0)

    // 5. Material
    let material
    const color = options.color || '#ffffff'
    
    if (options.materialType === 'metal') {
      material = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.2,
      })
    } else if (options.materialType === 'glass') {
       material = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.0,
        roughness: 0.1,
        transmission: 0.9,
        transparent: true
      })
    } else if (options.materialType === 'neon') {
       material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 1.0,
        metalness: 0.1,
        roughness: 0.1
      })
    } else {
      material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.5,
        metalness: 0.1
      })
    }

    // Side material (often darker for contrast)
    const materials = [
      material, // front
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 }) // side
    ]

    const mesh = new THREE.Mesh(geometry, materials)
    
    // 6. Rotation
    mesh.rotation.x = options.rotationX * (Math.PI / 180)
    mesh.rotation.y = options.rotationY * (Math.PI / 180)
    mesh.rotation.z = options.rotationZ * (Math.PI / 180)
    
    scene.add(mesh)

    // 7. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(100, 100, 100)
    scene.add(pointLight)
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
    dirLight.position.set(-100, 100, 50)
    scene.add(dirLight)

    // 8. Render
    renderer.render(scene, camera)
    
    // Cleanup to prevent leaks
    geometry.dispose()
    // Don't dispose renderer immediately? We return the canvas.
    // The canvas is now a bitmap.
    
    return canvas
  }
}
