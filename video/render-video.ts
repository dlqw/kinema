/**
 * 视频渲染入口
 *
 * 运行: npx ts-node video/render-video.ts
 */

import { createIntroScene } from './scenes/01-intro'
import { createIntroductionScene } from './scenes/02-introduction'
import { createCoreDemoScene } from './scenes/03-core-demo'
import { createTypeSafetyScene } from './scenes/04-type-safety'
import { createUseCasesScene } from './scenes/05-use-cases'
import { createComparisonScene } from './scenes/06-comparison'
import { VideoRenderer } from './render'

async function main() {
  console.log('🎬 AniMaker 视频渲染器\n')

  // 视频配置
  const config = {
    width: 1920,
    height: 1080,
    fps: 60,
  }

  // 创建所有场景
  console.log('📦 创建场景...')
  const scenes = [
    createIntroScene(),
    createIntroductionScene(),
    createCoreDemoScene(),
    createTypeSafetyScene(),
    createUseCasesScene(),
    createComparisonScene(),
  ]

  console.log(`   已创建 ${scenes.length} 个场景\n`)

  // 计算总时长
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0)
  console.log(`⏱️  总时长: ${totalDuration}秒 (${Math.floor(totalDuration / 60)}分${totalDuration % 60}秒)`)
  console.log(`🖼️  总帧数: ${totalDuration * config.fps}帧\n`)

  // 创建渲染器
  const renderer = new VideoRenderer(scenes, config)

  // 渲染视频
  const outputPath = 'output/animaker-intro.mp4'

  try {
    await renderer.render({
      output: outputPath,
      format: 'mp4',
      quality: 'high',
      onProgress: (progress, frame, total) => {
        // 进度显示
      },
    })

    console.log('\n🎉 渲染完成!')
    console.log(`📁 输出文件: ${outputPath}`)
  } catch (error: any) {
    console.error('\n❌ 渲染失败:', error.message)

    if (error.message.includes('FFmpeg')) {
      console.log('\n💡 提示: 请确保已安装 FFmpeg 并添加到 PATH')
      console.log('   下载地址: https://ffmpeg.org/download.html')
    }

    if (error.message.includes('canvas')) {
      console.log('\n💡 提示: 请安装 canvas 包:')
      console.log('   npm install canvas')
    }

    process.exit(1)
  }
}

main().catch(console.error)
