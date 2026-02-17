import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Node Axis",
  description: "Window host for framed apps"
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
