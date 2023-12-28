import { SocketIOProvider } from '@/context/SocketIOContext'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SocketIOProvider>
      <Component {...pageProps} />
    </SocketIOProvider>
  )
}
