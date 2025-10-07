// packages/landivo/email-template/src/components/Gap.tsx
import React from 'react';
import { Section } from '@react-email/components';
import { Minus } from 'lucide-react';
import { EmailComponentMetadata } from '../types/component-metadata';

interface GapProps {
  className?: string;
  backgroundColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  spacing?: number;
  height?: number;
  showLine?: boolean;
  lineColor?: string;
  lineWidth?: number;
}

export function Gap({
  className = '',
  backgroundColor = 'transparent',
  borderRadius = 0,
  showBorder = false,
  spacing = 0,
  height = 20,
  showLine = false,
  lineColor = '#e5e7eb',
  lineWidth = 1
}: GapProps) {

  const containerStyle = {
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: showBorder ? '1px solid #e5e7eb' : 'none',
    padding: `${spacing}px`,
    margin: '0 auto',
    maxWidth: '600px',
    width: '100%',
    height: `${height}px`,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const lineStyle = {
    width: '100%',
    height: `${lineWidth}px`,
    backgroundColor: lineColor,
    border: 'none',
    margin: '0',
  };

  return (
    <Section className={className}>
      <div style={containerStyle}>
        {showLine && <hr style={lineStyle} />}
      </div>
    </Section>
  );
}

// Component metadata for the template builder
export const gapMetadata: EmailComponentMetadata = {
  type: 'gap',
  templateType: 'any',
  name: 'gap',
  displayName: 'Gap/Spacer',
  version: 'v1.0',
  icon: <Minus className="w-5 h-5" />,
  description: 'Add customizable spacing between email components',
  category: 'layout',
  available: true,
  defaultProps: {
    className: '',
    backgroundColor: 'transparent',
    borderRadius: 0,
    showBorder: false,
    spacing: 0,
    height: 20,
    showLine: false,
    lineColor: '#e5e7eb',
    lineWidth: 1
  },
  configFields: [
    {
      key: 'height',
      label: 'Gap Height',
      type: 'number',
      defaultValue: 20,
      description: 'Height of the gap in pixels'
    },
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: 'transparent',
      description: 'Background color of the gap area'
    },
    {
      key: 'showLine',
      label: 'Show Line',
      type: 'toggle',
      defaultValue: false,
      description: 'Display a horizontal divider line'
    },
    {
      key: 'lineColor',
      label: 'Line Color',
      type: 'color',
      defaultValue: '#e5e7eb',
      description: 'Color of the divider line'
    },
    {
      key: 'lineWidth',
      label: 'Line Width',
      type: 'number',
      defaultValue: 1,
      description: 'Thickness of the line in pixels'
    },
    {
      key: 'borderRadius',
      label: 'Border Radius',
      type: 'number',
      defaultValue: 0,
      description: 'Corner radius in pixels'
    },
    {
      key: 'showBorder',
      label: 'Show Border',
      type: 'toggle',
      defaultValue: false,
      description: 'Display border around the gap'
    },
    {
      key: 'spacing',
      label: 'Container Padding',
      type: 'number',
      defaultValue: 0,
      description: 'Internal padding in pixels'
    },
    {
      key: 'className',
      label: 'CSS Classes',
      type: 'text',
      placeholder: 'Additional CSS classes',
      description: 'Add custom Tailwind classes for styling'
    }
  ],
  component: Gap
};

export default Gap;