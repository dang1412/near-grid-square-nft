import dynamic from 'next/dynamic'

const DisplayDemoLoad = () => import('./DisplayDemo').then(mod => mod.DisplayDemo)
export const DisplayDemoLazy = dynamic(DisplayDemoLoad, {ssr: false})
