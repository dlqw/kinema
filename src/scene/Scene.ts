/**
 * Scene - The main container for animations
 */

import { Timeline } from './Timeline'

export interface SceneConfig {
  width: number
  height: number
  backgroundColor?: string
  fps?: number
  duration?: number
}

export interface RenderObject {
  id: string
  type: string
  x: number
  y: number
  opacity: number
  scale: number
  rotation: number
  visible: boolean
  [key: string]: any
}

export class Scene {
  width: number
  height: number
  backgroundColor: string
  fps: number
  duration: number
  timeline: Timeline
  children: RenderObject[]

  constructor(config: SceneConfig) {
    this.width = config.width
    this.height = config.height
    this.backgroundColor = config.backgroundColor || '#0D1117'
    this.fps = config.fps || 60
    this.duration = config.duration || 60
    this.timeline = new Timeline()
    this.children = []
  }

  add(...objects: RenderObject[]): void {
    this.children.push(...objects)
  }

  remove(object: RenderObject): void {
    const index = this.children.indexOf(object)
    if (index > -1) {
      this.children.splice(index, 1)
    }
  }

  clear(): void {
    this.children = []
  }

  render(ctx: CanvasRenderingContext2D, time: number): void {
    // Apply timeline animations
    this.timeline.applyAnimations(time)

    // Clear and fill background
    ctx.fillStyle = this.backgroundColor
    ctx.fillRect(0, 0, this.width, this.height)

    // Render all children
    for (const child of this.children) {
      this.renderObject(ctx, child)
    }
  }

  private renderObject(ctx: CanvasRenderingContext2D, obj: RenderObject): void {
    if (!obj.visible || obj.opacity <= 0) return

    ctx.save()

    // Apply transformations
    ctx.globalAlpha = obj.opacity
    ctx.translate(obj.x, obj.y)
    ctx.rotate((obj.rotation * Math.PI) / 180)
    ctx.scale(obj.scale, obj.scale)

    // Render based on type
    switch (obj.type) {
      case 'circle':
        this.renderCircle(ctx, obj)
        break
      case 'rectangle':
        this.renderRectangle(ctx, obj)
        break
      case 'text':
        this.renderText(ctx, obj)
        break
      case 'line':
        this.renderLine(ctx, obj)
        break
      case 'arc':
        this.renderArc(ctx, obj)
        break
    }

    ctx.restore()
  }

  private renderCircle(ctx: CanvasRenderingContext2D, obj: any): void {
    ctx.beginPath()
    ctx.arc(0, 0, obj.radius, 0, Math.PI * 2)

    if (obj.color && obj.color !== 'transparent') {
      ctx.fillStyle = obj.color
      ctx.fill()
    }

    if (obj.strokeColor) {
      ctx.strokeStyle = obj.strokeColor
      ctx.lineWidth = obj.strokeWidth || 1
      ctx.stroke()
    }
  }

  private renderRectangle(ctx: CanvasRenderingContext2D, obj: any): void {
    const x = -obj.width / 2
    const y = -obj.height / 2

    if (obj.cornerRadius) {
      this.roundRect(ctx, x, y, obj.width, obj.height, obj.cornerRadius)
    } else {
      ctx.beginPath()
      ctx.rect(x, y, obj.width, obj.height)
    }

    if (obj.color && obj.color !== 'transparent') {
      ctx.fillStyle = obj.color
      ctx.fill()
    }

    if (obj.border) {
      ctx.strokeStyle = obj.border.color
      ctx.lineWidth = obj.border.width || 1
      ctx.stroke()
    }
  }

  private renderText(ctx: CanvasRenderingContext2D, obj: any): void {
    ctx.font = `${obj.fontSize || 16}px ${obj.fontFamily || 'Arial'}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = obj.color || '#ffffff'
    ctx.fillText(obj.content, 0, 0)
  }

  private renderLine(ctx: CanvasRenderingContext2D, obj: any): void {
    ctx.beginPath()
    ctx.moveTo(obj.x1 - obj.x, obj.y1 - obj.y)
    ctx.lineTo(obj.x2 - obj.x, obj.y2 - obj.y)
    ctx.strokeStyle = obj.color || '#ffffff'
    ctx.lineWidth = obj.width || 1
    ctx.stroke()
  }

  private renderArc(ctx: CanvasRenderingContext2D, obj: any): void {
    ctx.beginPath()
    ctx.arc(
      0,
      0,
      obj.radius,
      (obj.startAngle * Math.PI) / 180,
      (obj.endAngle * Math.PI) / 180
    )

    if (obj.color && obj.color !== 'transparent') {
      ctx.fillStyle = obj.color
      ctx.fill()
    }

    if (obj.strokeColor) {
      ctx.strokeStyle = obj.strokeColor
      ctx.lineWidth = obj.strokeWidth || 1
      ctx.stroke()
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number | number[]
  ): void {
    let r: number[]

    if (typeof radius === 'number') {
      r = [radius, radius, radius, radius]
    } else if (radius.length === 2) {
      r = [radius[0], radius[1], radius[0], radius[1]]
    } else if (radius.length === 4) {
      r = radius
    } else {
      r = [0, 0, 0, 0]
    }

    ctx.beginPath()
    ctx.moveTo(x + r[0], y)
    ctx.lineTo(x + width - r[1], y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + r[1])
    ctx.lineTo(x + width, y + height - r[2])
    ctx.quadraticCurveTo(x + width, y + height, x + width - r[2], y + height)
    ctx.lineTo(x + r[3], y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - r[3])
    ctx.lineTo(x, y + r[0])
    ctx.quadraticCurveTo(x, y, x + r[0], y)
    ctx.closePath()
  }
}
