import AppShell from "@/components/AppShell"
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/seo"

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    inLanguage: "th-TH",
    headline: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    audience: {
      "@type": "Audience",
      audienceType: "เกษตรกรผู้ปลูกทุเรียน",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <AppShell />
    </>
  )
}
