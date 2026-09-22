import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font instead of a <link> to Google Fonts: no
// external request/preconnect at render time (one less blocking origin),
// and no more loading JetBrains Mono, which nothing in the app actually
// used — --font-mono in globals.css already points at this same family.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const SITE_URL = "https://www.globalreadyaievals.com";
const SITE_NAME = "Global Ready AIEval";
const SITE_DESCRIPTION =
  "Learn, practice, qualify, and get hired for real-world AI evaluation, training, RLHF, and prompt engineering jobs with realistic simulations and scoring.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Train for Remote AI Evaluation Jobs`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Train for Remote AI Evaluation Jobs`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/assets/images/logos/global-logo.png",
        width: 512,
        height: 512,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — Train for Remote AI Evaluation Jobs`,
    description: SITE_DESCRIPTION,
    images: ["/assets/images/logos/global-logo.png"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/assets/images/logos/global-logo.png`,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
