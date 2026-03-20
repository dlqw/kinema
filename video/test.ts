/**
 * 视频集成测试
 * 验证所有场景能正确导入和运行
 */

import { createIntroScene } from './scenes/01-intro'
import { createIntroductionScene } from './scenes/02-introduction'
import { createCoreDemoScene } from './scenes/03-core-demo'
import { createTypeSafetyScene } from './scenes/04-type-safety'
import { createUseCasesScene } from './scenes/05-use-cases'
import { createComparisonScene } from './scenes/06-comparison'

console.log('🎬 AniMaker 视频集成测试\n')

// 视频配置
const videoConfig = {
  width: 1920,
  height: 1080,
  fps: 60,
  duration: 330, // 5分30秒
}

// 测试各场景
const tests = [
  { name: '01-intro', create: createIntroScene, duration: 30 },
  { name: '02-introduction', create: createIntroductionScene, duration: 60 },
  { name: '03-core-demo', create: createCoreDemoScene, duration: 120 },
  { name: '04-type-safety', create: createTypeSafetyScene, duration: 60 },
  { name: '05-use-cases', create: createUseCasesScene, duration: 30 },
  { name: '06-comparison', create: createComparisonScene, duration: 30 },
]

let totalDuration = 0
let passed = 0
let failed = 0

console.log('📋 视频配置:')
console.log(`   分辨率: ${videoConfig.width}x${videoConfig.height}`)
console.log(`   帧率: ${videoConfig.fps}fps`)
console.log(`   预计时长: ${videoConfig.duration}秒\n`)

console.log('🧪 场景测试:\n')

tests.forEach((test) => {
  try {
    const scene = test.create()
    totalDuration += test.duration
    console.log(`   ✅ ${test.name}: ${test.duration}秒`)
    passed++
  } catch (error: any) {
    console.log(`   ❌ ${test.name}: ${error?.message || error}`)
    failed++
  }
})

console.log('\n' + '='.repeat(50))
console.log(`📊 测试结果: ${passed}/${tests.length} 通过`)
console.log(`⏱️ 总时长: ${totalDuration}秒 (${Math.floor(totalDuration / 60)}分${totalDuration % 60}秒)`)
console.log(`🎬 帧数: ${totalDuration * videoConfig.fps}帧`)

if (failed === 0) {
  console.log('\n✨ 所有场景测试通过！')
  console.log('\n🚀 下一步: 运行 npm run video:render 开始渲染')
} else {
  console.log(`\n⚠️ 有 ${failed} 个场景需要修复。`)
}

export { tests, videoConfig }
