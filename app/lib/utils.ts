import { SelectionRect } from './GameSceneViewport'

function coordDegree(x: number): number {
  return x >= 0 ? x : -x - 1
}

export function coordinateToIndex(x: number, y: number): number {
  const deg = Math.max(coordDegree(x), coordDegree(y))
  const edgeLen = deg * 2 + 1
  let index = (deg * 2) ** 2
  const minCoord = -deg - 1, maxCoord = deg

  // left edge
  if (x == minCoord && y < maxCoord) {
    index += (maxCoord - 1) - y
    return index
  }
  index += edgeLen

  // top edge
  if (y == minCoord) {
    index += x - (minCoord + 1)
    return index
  }
  index += edgeLen

  // right edge
  if (x == maxCoord) {
    index += y - (minCoord + 1)
    return index
  }
  index += edgeLen

  // bottom edge
  return index + (maxCoord - 1) - x
}

export function indexToCoordinate(index: number): [number, number] {
  const deg = Math.floor(Math.sqrt(index) / 2)
  const minCoord = -deg - 1, maxCoord = deg
  const edgeLen = deg * 2 + 1
  const count = index - (deg * 2) ** 2
  const edge = Math.floor(count / edgeLen)  // 0 1 2 3
  const left = count - edge * edgeLen

  // left edge
  if (edge == 0) {
    const x = minCoord
    const y = maxCoord - 1 - left
    return [x, y]
  }

  // top edge
  if (edge == 1) {
    const y = minCoord
    const x = minCoord + 1 + left
    return [x, y]
  }

  // right edge
  if (edge == 2) {
    const x = maxCoord
    const y = minCoord + 1 + left
    return [x, y]
  }

  // bottom edge
  const y = maxCoord
  const x = maxCoord - 1 - left

  return [x, y]
}

export function iterateSelect(select: SelectionRect, cb: (x:number, y: number) => void) {
  const maxX = select.x + select.width
  const maxY = select.y + select.height
  for (let x = select.x; x < maxX; x++) {
    for (let y = select.y; y < maxY; y++) {
      cb(x, y)
    }
  }
}

export function getIndexArray(index: number, width: number, height: number): number[] {
  const indexArray: number[] = []
  const [x, y] = indexToCoordinate(index)
  iterateSelect({x, y, width, height}, (x, y) => {
    const index = coordinateToIndex(x, y)
    indexArray.push(index)
  })

  return indexArray
}
