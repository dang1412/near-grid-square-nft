import { useEffect, useRef } from 'react'

import { GameEngine, iterateSelect, type SelectionRect, GameSceneViewport } from '../../../lib'
import { loadMock } from '../utils'

const PIXEL_SIZE = 20
const WORLD_SIZE = 30
const MAP_WIDTH = 600
const MAP_HEIGHT = 600

function xyToIndex(x: number, y: number): number {
  return y * WORLD_SIZE + x
}

function indexToXY(index: number): [number, number] {
  const y = Math.floor(index / WORLD_SIZE)
  const x = index % WORLD_SIZE

  return [x, y]
}

export const DisplayDemo = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) { return }

    const engine = new GameEngine(canvas, { width: MAP_WIDTH, height: MAP_HEIGHT })

    // Map scene
    const displayDemoScene = new GameSceneViewport(engine, {
      pixelSize: PIXEL_SIZE,
      worldWidthPixel: WORLD_SIZE,
      worldHeightPixel: WORLD_SIZE,
      viewWidth: MAP_WIDTH,
      viewHeight: MAP_HEIGHT,
    })

    engine.changeScene(displayDemoScene.sceneIndex)

    loadMock(displayDemoScene)

    return () => {
      engine.destroy()
    }

  }, [])

  return (
    <div style={{textAlign: 'center', margin: '40px 0'}}>
      <canvas ref={(_c) => canvasRef.current = _c} /><br/>
      <span>Scroll mouse to zoom, press W S A D to move</span>
    </div>
  )
}