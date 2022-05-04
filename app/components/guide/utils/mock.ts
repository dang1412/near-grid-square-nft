import { GameSceneViewport, SelectionRect, iterateSelect } from '../../../lib'
// import { Pixel } from '../../services/types'
import { calculateAlpha, reflectMintedPixelXY, reflectPickedXY } from '../../MainLand/utils'

const areas: SelectionRect[] = [
  {x: 16, y: 5, width: 3, height: 3},
  {x: 9, y: 12, width: 2, height: 2},
  {x: 13, y: 18, width: 4, height: 3},
  {x: 15, y: 11, width: 1, height: 1},
  {x: 20, y: 14, width: 3, height: 1},
  {x: 23, y: 4, width: 1, height: 1},
  {x: 18, y: 15, width: 1, height: 1},
  {x: 9, y: 21, width: 1, height: 1},
  {x: 23, y: 19, width: 2, height: 2},
]

const pickAreas: SelectionRect[] = [
  {x: 11, y: 11, width: 2, height: 2},
  {x: 12, y: 12, width: 2, height: 4},
  {x: 13, y: 9, width: 5, height: 4},
  {x: 13, y: 12, width: 3, height: 2},
  {x: 17, y: 8, width: 5, height: 3},
  {x: 20, y: 10, width: 4, height: 4},
  {x: 6, y: 9, width: 4, height: 2},
  {x: 11, y: 12, width: 3, height: 3},
  {x: 17, y: 6, width: 4, height: 3},
  {x: 13, y: 20, width: 4, height: 2},
  {x: 16, y: 8, width: 3, height: 1},
  {x: 5, y: 16, width: 2, height: 2},
  {x: 26, y: 13, width: 1, height: 1},
  {x: 14, y: 24, width: 1, height: 1},
  {x: 23, y: 20, width: 1, height: 2},
  {x: 8, y: 17, width: 2, height: 1},
  {x: 16, y: 16, width: 1, height: 2},
  {x: 13, y: 13, width: 2, height: 2},
  {x: 14, y: 14, width: 2, height: 1},
]

// images
// https://ipfs.infura.io/ipfs/QmV5axZaxkBfm743jDPgszNsfXsKPHBszFqEL6KTFbipJo
const images: { select: SelectionRect, cid: string }[] = [
  {
    select: {x: 12, y: 10, width: 2, height: 2},
    cid: 'QmV5axZaxkBfm743jDPgszNsfXsKPHBszFqEL6KTFbipJo'
  },
  {
    select: {x: 14, y: 14, width: 4, height: 3},
    cid: 'QmQ3iun73Vyb4XykRrvHavXRHqeHskWtKBEX4hmRuEEMg2'
  },
  {
    select: {x: 18, y: 10, width: 6, height: 3},
    cid: 'QmdjxRmV4Pcv46AFU3ZCVM4UR65YqtLiBdaSJ6HdLkZu7N'
  },
  {
    select: {x: 9, y: 16, width: 3, height: 3},
    cid: 'QmaGokGqgjknfa4xnXKnnwC5ZyXzUjQ7p6KEe4D8G5uFFE'
  },
  {
    select: {x: 20, y: 15, width: 3, height: 3},
    cid: 'Qme7uLEoDejM4nRARcm9JogrVsmwwbHM1BzxsyHjbPmowT'
  },
  {
    select: {x: 10, y: 5, width: 6, height: 3},
    cid: 'QmVQ7m15djg4U5Ef3PRkkmXidBwx4tAd6SehsNKkR6xLzK'
  },
  {
    select: {x: 17, y: 19, width: 3, height: 3},
    cid: 'QmPmTdsH6HXgTGb3sVue8GYuRyZa4XoFhnxZTrNoXnaXqB'
  },
]

export function loadMock(scene: GameSceneViewport, move = 0) {
  // minted pixels
  for (const select of areas) {
    iterateSelect(select, (x, y) => {
      reflectMintedPixelXY(scene, x + move, y + move, false)
    })
  }

  // images
  for (const image of images) {
    const url = `https://ipfs.infura.io/ipfs/${image.cid}`
    const select = {...image.select}
    select.x += move
    select.y += move
    scene.addImageURL(select, url)
  }

  // pick
  const coords: [number, number][] = []
  const counts: {[key: string]: number} = {}
  for (const select of pickAreas) {
    iterateSelect(select, (x, y) => {
      x += move
      y += move
      const key = `${x}, ${y}`
      if (!counts[key]) {
        counts[key] = 0
        coords.push([x, y])
      }

      counts[key]++
    })
  }

  for (const [x, y] of coords) {
    const key = `${x}, ${y}`
    const alpha = calculateAlpha(counts[key])

    reflectPickedXY(scene, x, y, alpha, false)
  }
}
