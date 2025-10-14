import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ADOPT A YOUNG PARENT - Supporting Young Families in Michigan",
  description:
    "ADOPT A YOUNG PARENT is a Michigan nonprofit dedicated to empowering young parents through comprehensive support, resources, and community engagement.",
  keywords: [
    "nonprofit",
    "young parents",
    "Michigan",
    "family support",
    "charitable giving",
  ],
  authors: [{ name: "ADOPT A YOUNG PARENT" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://adoptayoungparent.org",
    siteName: "ADOPT A YOUNG PARENT",
    title: "ADOPT A YOUNG PARENT - Supporting Young Families",
    description:
      "Empowering young parents through comprehensive support and community engagement.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ADOPT A YOUNG PARENT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ADOPT A YOUNG PARENT",
    description: "Supporting young families in Michigan",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
