import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          box-sizing: border-box;
        }
        *, *::before, *::after {
          box-sizing: inherit;
        }
        #__next {
          height: 100%;
          width: 100%;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  )
}
