// app/src/components/templates/TemplatePreview.tsx
import { render } from '@react-email/render';
import { useState, useEffect } from 'react';
import { EmailTemplate } from '@/types/template';
import { DynamicEmailTemplate } from '@/emails/DynamicEmailTemplate';

interface TemplatePreviewProps {
  template: EmailTemplate;
  data?: Record<string, any>;
}

export function TemplatePreview({ template, data }: TemplatePreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generatePreview = async () => {
      setLoading(true);
      try {
        const html = await render(
          DynamicEmailTemplate({ 
            template, 
            data: data || mockPropertyData 
          })
        );
        setHtmlContent(html);
      } catch (error) {
        console.error('Error generating preview:', error);
        setHtmlContent('<p>Error generating preview</p>');
      } finally {
        setLoading(false);
      }
    };

    generatePreview();
  }, [template, data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Generating preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <iframe
          srcDoc={htmlContent}
          className="w-full h-[800px] border-0"
          title="Email Preview"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}

const mockPropertyData = {
  id: '123',
  title: 'Beautiful Land in Austin, TX',
  streetAddress: '123 Property Lane',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  county: 'Travis',
  askingPrice: 45000,
  sqft: 21154,
  acre: 0.5,
  zoning: 'Residential',
  financing: 'Available',
  monthlyPaymentOne: 299,
  loanAmountOne: 35000,
  downPaymentOne: 10000,
  interestOne: 9.5,
  tax: 1200,
  serviceFee: 35,
  imageUrls: '[]'
};