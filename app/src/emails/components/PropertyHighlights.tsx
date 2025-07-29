// app/src/emails/components/PropertyHighlights.tsx
import { Section } from '@react-email/components';

interface HighlightItem {
  icon: string;
  value: string;
  label: string;
}

interface PropertyHighlightsProps {
  highlights: HighlightItem[];
  backgroundColor?: string;
}

export function PropertyHighlights({ highlights, backgroundColor = 'white' }: PropertyHighlightsProps) {
  return (
    <Section className="px-6 py-6" style={{ backgroundColor }}>
      <div className="grid grid-cols-4 gap-2">
        {highlights.map((highlight, index) => (
          <div key={index} className="text-center p-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <span className="text-xl">{highlight.icon}</span>
            </div>
            <div className="text-lg font-bold text-gray-900 mb-1">
              {highlight.value}
            </div>
            <div className="text-xs text-gray-600">{highlight.label}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}