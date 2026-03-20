/**
 * Video Renderer
 *
 * Renders AniMaker scenes to video files using Canvas and FFmpeg
 */

import { Scene } from '../src'
import { createWriteStream, mkdirSync, existsSync, unlinkSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { createCanvas } from 'canvas'

export interface VideoRenderConfig {
  output: string
  fps?: number
  format?: 'webm' | 'mp4' | 'gif'
  quality?: 'low' | 'medium' | 'high'
  onProgress?: (progress: number, frame: number, total: number) => void
}

export class VideoRenderer {
  private scenes: Scene[]
  private fps: number
  private width: number
  private height: number

  constructor(scenes: Scene[], config: { fps: number; width: number; height: number }) {
    this.scenes = scenes
    this.fps = config.fps
    this.width = config.width
    this.height = config.height
  }

  async render(config: VideoRenderConfig): Promise<string> {
    const fps = config.fps || this.fps
    const format = config.format || 'webm'
    const quality = config.quality || 'high'
    const outputPath = config.output

    // Calculate total frames
    const totalDuration = this.scenes.reduce((sum, s) => sum + s.duration, 0)
    const totalFrames = Math.ceil(totalDuration * fps)

    // Create temp directory for frames
    const tempDir = join(process.cwd(), '.temp-frames')
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true })
    }

    // Clean existing frames
    const existingFrames = readdirSync(tempDir).filter(f => f.endsWith('.png'))
    for (const f of existingFrames) {
      unlinkSync(join(tempDir, f))
    }

    // Create canvas
    const canvas = this.createCanvas()
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to get 2d context')
    }

    console.log(`\n🎬 Starting render...`)
    console.log(`   Resolution: ${this.width}x${this.height}`)
    console.log(`   FPS: ${fps}`)
    console.log(`   Total frames: ${totalFrames}`)
    console.log(`   Duration: ${totalDuration}s\n`)

    let frameIndex = 0

    // Render all scenes
    for (let sceneIndex = 0; sceneIndex < this.scenes.length; sceneIndex++) {
      const scene = this.scenes[sceneIndex]
      const sceneFrames = Math.ceil(scene.duration * fps)

      console.log(`📹 Rendering scene ${sceneIndex + 1}/${this.scenes.length} (${scene.duration}s, ${sceneFrames} frames)`)

      for (let i = 0; i < sceneFrames; i++) {
        const time = i / fps
        scene.render(ctx, time)

        // Save frame
        const framePath = join(tempDir, `frame_${String(frameIndex).padStart(6, '0')}.png`)
        await this.saveFrame(canvas, framePath)

        frameIndex++

        // Progress callback
        if (config.onProgress) {
          config.onProgress(frameIndex / totalFrames, frameIndex, totalFrames)
        }

        // Log progress every 60 frames
        if (frameIndex % 60 === 0) {
          console.log(`   Progress: ${((frameIndex / totalFrames) * 100).toFixed(1)}% (${frameIndex}/${totalFrames})`)
        }
      }
    }

    console.log(`\n✅ Frames rendered: ${frameIndex}`)
    console.log(`\n🔄 Encoding video...`)

    // Encode with FFmpeg
    const output = await this.encodeVideo(tempDir, outputPath, fps, format, quality)

    // Cleanup temp frames
    console.log(`\n🧹 Cleaning up...`)
    for (let i = 0; i < frameIndex; i++) {
      const framePath = join(tempDir, `frame_${String(i).padStart(6, '0')}.png`)
      if (existsSync(framePath)) {
        unlinkSync(framePath)
      }
    }

    console.log(`\n✨ Video saved: ${output}`)

    return output
  }

  private createCanvas(): any {
    return createCanvas(this.width, this.height)
  }

  private async saveFrame(canvas: any, path: string): Promise<void> {
    const buffer = canvas.toBuffer('image/png')
    writeFileSync(path, buffer)
  }

  private async encodeVideo(
    tempDir: string,
    output: string,
    fps: number,
    format: string,
    quality: string
  ): Promise<string> {
    const qualityPresets = {
      low: { crf: 28, preset: 'faster' },
      medium: { crf: 23, preset: 'medium' },
      high: { crf: 18, preset: 'slow' },
    }

    const preset = qualityPresets[quality as keyof typeof qualityPresets]
    const inputPattern = join(tempDir, 'frame_%06d.png')

    return new Promise((resolve, reject) => {
      const args =
        format === 'gif'
          ? [
              '-framerate',
              String(fps),
              '-i',
              inputPattern,
              '-vf',
              'fps=30,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
              '-loop',
              '0',
              output,
            ]
          : [
              '-y',
              '-framerate',
              String(fps),
              '-i',
              inputPattern,
              '-c:v',
              format === 'mp4' ? 'libx264' : 'libvpx-vp9',
              '-crf',
              String(preset.crf),
              '-preset',
              preset.preset,
              '-pix_fmt',
              'yuv420p',
              output,
            ]

      const ffmpeg = spawn('ffmpeg', args)

      let stderr = ''
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(output)
        } else {
          reject(new Error(`FFmpeg failed with code ${code}:\n${stderr}`))
        }
      })

      ffmpeg.on('error', (err) => {
        reject(new Error(`Failed to start FFmpeg: ${err.message}`))
      })
    })
  }
}

/**
 * Quick render function
 */
export async function renderVideo(
  scenes: Scene | Scene[],
  config: VideoRenderConfig & { fps: number; width: number; height: number }
): Promise<string> {
  const sceneArray = Array.isArray(scenes) ? scenes : [scenes]
  const renderer = new VideoRenderer(sceneArray, {
    fps: config.fps,
    width: config.width,
    height: config.height,
  })
  return renderer.render(config)
}
