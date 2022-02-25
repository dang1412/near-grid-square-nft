import Head from 'next/head'
import { RecoilRoot } from 'recoil'
import type { AppProps } from 'next/app'

import Container from '@mui/material/Container'

import '../styles/globals.css'
import styles from '../styles/Home.module.css'
import { TopBar } from '../components/TopBar'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RecoilRoot>
      <Head>
        <title>PixelLand</title>
      </Head>
      <TopBar />
      <Container maxWidth="md" style={{fontFamily: '"Roboto","Helvetica","Arial",sans-serif'}}>
        <Component {...pageProps} />
      </Container>
      <footer style={{ textAlign: 'center', margin: 20 }}>
        Created by author of <a href='https://codetube.vn/articles/' target="_blank" rel="noreferrer">codetube.vn</a>
      </footer>
    </RecoilRoot>
  )
}

export default MyApp
