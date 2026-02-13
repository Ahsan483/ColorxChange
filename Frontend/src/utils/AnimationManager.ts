import gsap from 'gsap'

export interface AnimationKeyframe {
  time: number // in seconds
  properties: {
    x?: number
    y?: number
    rotation?: number
    scaleX?: number
    scaleY?: number
    opacity?: number
  }
}

export interface AnimationTimeline {
  duration: number
  keyframes: AnimationKeyframe[]
  loop: boolean
  easing: string
}

export class AnimationManager {
  private timeline: gsap.core.Timeline | null = null
  
  createTimeline(objectId: string, animation: AnimationTimeline): gsap.core.Timeline {
    this.timeline = gsap.timeline({
      repeat: animation.loop ? -1 : 0,
      ease: animation.easing || 'power2.inOut'
    })
    
    return this.timeline
  }
  
  addKeyframe(target: any, keyframe: AnimationKeyframe): void {
    if (!this.timeline) return
    
    this.timeline.to(target, {
      ...keyframe.properties,
      duration: 0.5, // Default duration between keyframes
      ease: 'power2.inOut'
    }, keyframe.time)
  }
  
  play(): void {
    this.timeline?.play()
  }
  
  pause(): void {
    this.timeline?.pause()
  }
  
  stop(): void {
    this.timeline?.pause()
    this.timeline?.seek(0)
  }
  
  destroy(): void {
    this.timeline?.kill()
    this.timeline = null
  }
  
  // Preset animations
  static fadeIn(target: any, duration: number = 1): gsap.core.Timeline {
    return gsap.timeline().from(target, {
      opacity: 0,
      duration,
      ease: 'power2.out'
    })
  }
  
  static slideIn(target: any, direction: 'left' | 'right' | 'top' | 'bottom', duration: number = 1): gsap.core.Timeline {
    const offset = 100
    const props: any = { duration, ease: 'power2.out' }
    
    switch (direction) {
      case 'left':
        props.x = `-=${offset}`
        break
      case 'right':
        props.x = `+=${offset}`
        break
      case 'top':
        props.y = `-=${offset}`
        break
      case 'bottom':
        props.y = `+=${offset}`
        break
    }
    
    return gsap.timeline().from(target, props)
  }
  
  static bounce(target: any, duration: number = 1): gsap.core.Timeline {
    return gsap.timeline().to(target, {
      y: '-=50',
      duration: duration / 2,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1
    })
  }
  
  static rotate(target: any, degrees: number = 360, duration: number = 2): gsap.core.Timeline {
    return gsap.timeline().to(target, {
      rotation: degrees,
      duration,
      ease: 'power1.inOut'
    })
  }
}
