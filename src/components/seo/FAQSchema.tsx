import { useMemo } from 'react';
import { JsonLd } from './JsonLd';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQ[];
}

export function FAQSchema({ faqs }: FAQSchemaProps) {
  const data = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  }), [faqs]);

  return <JsonLd data={data} />;
}
