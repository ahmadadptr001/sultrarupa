import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sultra Rupa | Jelajah Budaya Sulawesi Tenggara",
    template: "%s | Sultra Rupa",
  },
  description:
    "Jelajahi rumah adat, tari, musik, dan cerita masyarakat Sulawesi Tenggara dalam pengalaman 3D Sultra Rupa.",
  applicationName: "Sultra Rupa",
  category: "culture",
  keywords: [
    "Sulawesi Tenggara",
    "budaya Indonesia",
    "rumah adat",
    "tari Lulo",
    "Sultra Rupa",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    title: "Sultra Rupa | Jelajah Budaya Sulawesi Tenggara",
    description:
      "Jelajahi rumah adat, tari, musik, dan cerita masyarakat Sulawesi Tenggara dalam pengalaman 3D.",
    siteName: "Sultra Rupa",
    images: [
      {
        url: "/share/sultrarupa-share.png",
        width: 1200,
        height: 630,
        alt: "Sultra Rupa | Jelajah Budaya Sulawesi Tenggara",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sultra Rupa | Jelajah Budaya Sulawesi Tenggara",
    description:
      "Jelajahi rumah adat, tari, musik, dan cerita masyarakat Sulawesi Tenggara dalam pengalaman 3D.",
    images: ["/share/sultrarupa-share.png"],
  },
  icons: {
    icon: "/icons/favicon_light.svg?v=sultra-icon-20261022",
    apple: "/icons/icon_180.png?v=sultra-icon-20261022",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
