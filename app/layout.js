import './globals.css'

export const metadata = {
  title: 'Good Friday Evening Service',
  description: 'Good Friday Evening Service',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  )
}
