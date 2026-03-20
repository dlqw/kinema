/**
 * Shape factory functions
 */

let objectId = 0

function generateId(): string {
  return `obj_${++objectId}`
}

export interface CircleConfig {
  x: number
  y: number
  radius: number
  color?: string
  strokeColor?: string
  strokeWidth?: number
  opacity?: number
  scale?: number
  rotation?: number
}

export function Circle(config: CircleConfig) {
  return {
    id: generateId(),
    type: 'circle',
    x: config.x,
    y: config.y,
    radius: config.radius,
    color: config.color || '#ffffff',
    strokeColor: config.strokeColor,
    strokeWidth: config.strokeWidth || 1,
    opacity: config.opacity ?? 1,
    scale: config.scale ?? 1,
    rotation: config.rotation ?? 0,
    visible: true,
  }
}

export interface RectangleConfig {
  x: number
  y: number
  width: number
  height: number
  color?: string
  cornerRadius?: number | number[]
  border?: { color: string; width?: number }
  opacity?: number
  scale?: number
  rotation?: number
}

export function Rectangle(config: RectangleConfig) {
  return {
    id: generateId(),
    type: 'rectangle',
    x: config.x,
    y: config.y,
    width: config.width,
    height: config.height,
    color: config.color || '#ffffff',
    cornerRadius: config.cornerRadius,
    border: config.border,
    opacity: config.opacity ?? 1,
    scale: config.scale ?? 1,
    rotation: config.rotation ?? 0,
    visible: true,
  }
}

export interface TextConfig {
  x: number
  y: number
  content: string
  fontSize?: number
  fontFamily?: string
  color?: string
  opacity?: number
  scale?: number
  rotation?: number
}

export function Text(config: TextConfig) {
  return {
    id: generateId(),
    type: 'text',
    x: config.x,
    y: config.y,
    content: config.content,
    fontSize: config.fontSize || 16,
    fontFamily: config.fontFamily || 'Arial, sans-serif',
    color: config.color || '#ffffff',
    opacity: config.opacity ?? 1,
    scale: config.scale ?? 1,
    rotation: config.rotation ?? 0,
    visible: true,
  }
}

export interface LineConfig {
  x1: number
  y1: number
  x2: number
  y2: number
  color?: string
  width?: number
  opacity?: number
  scale?: number
  rotation?: number
}

export function Line(config: LineConfig) {
  // Center point is the position
  const cx = (config.x1 + config.x2) / 2
  const cy = (config.y1 + config.y2) / 2

  return {
    id: generateId(),
    type: 'line',
    x: cx,
    y: cy,
    x1: config.x1,
    y1: config.y1,
    x2: config.x2,
    y2: config.y2,
    color: config.color || '#ffffff',
    width: config.width || 1,
    opacity: config.opacity ?? 1,
    scale: config.scale ?? 1,
    rotation: config.rotation ?? 0,
    visible: true,
  }
}

export interface ArcConfig {
  x: number
  y: number
  radius: number
  startAngle: number
  endAngle: number
  color?: string
  strokeColor?: string
  strokeWidth?: number
  opacity?: number
  scale?: number
  rotation?: number
}

export function Arc(config: ArcConfig) {
  return {
    id: generateId(),
    type: 'arc',
    x: config.x,
    y: config.y,
    radius: config.radius,
    startAngle: config.startAngle,
    endAngle: config.endAngle,
    color: config.color || 'transparent',
    strokeColor: config.strokeColor || '#ffffff',
    strokeWidth: config.strokeWidth || 1,
    opacity: config.opacity ?? 1,
    scale: config.scale ?? 1,
    rotation: config.rotation ?? 0,
    visible: true,
  }
}

export interface GroupConfig {
  x?: number
  y?: number
  opacity?: number
  scale?: number
  rotation?: number
}

export interface GroupObject {
  id: string
  type: 'group'
  x: number
  y: number
  opacity: number
  scale: number
  rotation: number
  visible: boolean
  children: any[]
  add: (child: any) => void
  getChildren: () => any[]
}

export function Group(config?: GroupConfig): GroupObject {
  const children: any[] = []

  return {
    id: generateId(),
    type: 'group',
    x: config?.x ?? 0,
    y: config?.y ?? 0,
    opacity: config?.opacity ?? 1,
    scale: config?.scale ?? 1,
    rotation: config?.rotation ?? 0,
    visible: true,
    children,

    add(child: any): void {
      children.push(child)
    },

    getChildren(): any[] {
      return children
    },
  }
}
