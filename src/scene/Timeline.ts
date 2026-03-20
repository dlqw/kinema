/**
 * Timeline - Animation controller
 */

export interface AnimationKeyframe {
  target: any
  startTime: number
  duration: number
  property: string
  from: number
  to: number
  easing: (t: number) => number
  repeat?: number
  yoyo?: boolean
}

export class Timeline {
  animations: AnimationKeyframe[]

  constructor() {
    this.animations = []
  }

  add(keyframe: Omit<AnimationKeyframe, 'easing'> & { easing: (t: number) => number; yoyo?: boolean }): void {
    this.animations.push(keyframe as AnimationKeyframe)
  }

  applyAnimations(time: number): void {
    for (const anim of this.animations) {
      const endTime = anim.startTime + anim.duration

      if (time < anim.startTime) {
        // Before animation starts
        this.setProperty(anim.target, anim.property, anim.from)
      } else if (time >= endTime) {
        // After animation ends - handle repeat
        if (anim.repeat === -1) {
          // Infinite repeat - loop the animation
          const loopTime = (time - anim.startTime) % anim.duration
          const cycle = Math.floor((time - anim.startTime) / anim.duration)
          let progress = loopTime / anim.duration

          // Handle yoyo (ping-pong)
          if (anim.yoyo && cycle % 2 === 1) {
            progress = 1 - progress
          }

          const easedProgress = anim.easing(progress)
          const value = anim.from + (anim.to - anim.from) * easedProgress
          this.setProperty(anim.target, anim.property, value)
        } else if (anim.repeat && anim.repeat > 0) {
          const totalDuration = anim.duration * (anim.repeat + 1)
          if (time < anim.startTime + totalDuration) {
            const loopTime = (time - anim.startTime) % anim.duration
            const cycle = Math.floor((time - anim.startTime) / anim.duration)
            let progress = loopTime / anim.duration

            // Handle yoyo (ping-pong)
            if (anim.yoyo && cycle % 2 === 1) {
              progress = 1 - progress
            }

            const easedProgress = anim.easing(progress)
            const value = anim.from + (anim.to - anim.from) * easedProgress
            this.setProperty(anim.target, anim.property, value)
          } else {
            this.setProperty(anim.target, anim.property, anim.to)
          }
        } else {
          this.setProperty(anim.target, anim.property, anim.to)
        }
      } else {
        // During animation
        const progress = (time - anim.startTime) / anim.duration
        const easedProgress = anim.easing(progress)
        const value = anim.from + (anim.to - anim.from) * easedProgress
        this.setProperty(anim.target, anim.property, value)
      }
    }
  }

  private setProperty(target: any, property: string, value: number): void {
    if (target && property in target) {
      target[property] = value
    }
  }

  clear(): void {
    this.animations = []
  }
}
