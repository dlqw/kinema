/**
 * AniMaker 产品介绍视频
 *
 * 时长: 5分30秒 (330秒)
 * 分辨率: 1920x1080
 * 帧率: 60fps
 */

import { Scene } from '../src'
import { VideoRenderer } from './render'

// 视频配置
export const videoConfig = {
  width: 1920,
  height: 1080,
  fps: 60,
  duration: 330, // 5分30秒
  backgroundColor: '#0D1117',
}

// 颜色方案
export const colors = {
  background: '#0D1117',
  brand: '#58A6FF',
  success: '#3FB950',
  warning: '#F0883E',
  error: '#F85149',
  code: {
    background: '#161B22',
    text: '#E6EDF3',
    keyword: '#FF7B72',
    string: '#A5D6FF',
    number: '#79C0FF',
    function: '#D2A8FF',
    variable: '#FFA657',
    type: '#7EE787',
    comment: '#8B949E',
  },
  text: {
    primary: '#E6EDF3',
    secondary: '#8B949E',
    accent: '#58A6FF',
  }
}

// 导入各场景
import { createIntroScene } from './scenes/01-intro'
import { createIntroductionScene } from './scenes/02-introduction'
import { createCoreDemoScene } from './scenes/03-core-demo'
import { createTypeSafetyScene } from './scenes/04-type-safety'
import { createUseCasesScene } from './scenes/05-use-cases'
import { createComparisonScene } from './scenes/06-comparison'

// 获取所有场景
export function getScenes() {
  return [
    createIntroScene(),
    createIntroductionScene(),
    createCoreDemoScene(),
    createTypeSafetyScene(),
    createUseCasesScene(),
    createComparisonScene(),
  ]
}

// 渲染视频
export async function renderVideo(outputPath: string = 'output/animaker-intro.mp4') {
  const scenes = getScenes()
  const renderer = new VideoRenderer(scenes, {
    width: videoConfig.width,
    height: videoConfig.height,
    fps: videoConfig.fps,
  })

  return renderer.render({
    output: outputPath,
    format: 'mp4',
    quality: 'high',
  })
}
