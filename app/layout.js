import './globals.css'
import { Noto_Serif_TC } from 'next/font/google'
import BackgroundMusic from '../components/BackgroundMusic'

const notoSerifTC = Noto_Serif_TC({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  display: 'swap',
})

export const metadata = {
  title: 'Good Friday Evening Service',
  description: 'Good Friday Evening Service',
  icons: { icon: [] },
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body className={notoSerifTC.className}>
        <BackgroundMusic />
        {children}
      </body>
    </html>
  )
}
