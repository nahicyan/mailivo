// app/src/components/templates/TemplatePreview.tsx
import { render } from '@react-email/render';
import { useState, useEffect } from 'react';
import { EmailTemplate } from '@/types/template';
import { DynamicEmailTemplate } from '@/emails/DynamicEmailTemplate';
import { LandivoProperty } from '@/types/landivo';

interface TemplatePreviewProps {
  template: EmailTemplate;
  data?: Record<string, any>;
}

export function TemplatePreview({ template, data }: TemplatePreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [propertyData, setPropertyData] = useState<LandivoProperty | null>(null);

  // Fetch real property data from Landivo API
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const response = await fetch('https://api.landivo.com/residency/allresd');
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        const properties: LandivoProperty[] = await response.json();
        
        // Use the first property if available
        if (properties && properties.length > 0) {
          setPropertyData(properties[0]);
        }
      } catch (error) {
        console.error('Error fetching property data:', error);
        // Fallback to null if API fails
        setPropertyData(null);
      }
    };

    fetchPropertyData();
  }, []);

  useEffect(() => {
    const generatePreview = async () => {
      setLoading(true);
      try {
        // Use real property data if available, otherwise use provided data
        const templateData = propertyData || data || {};
        
        const html = await render(
          DynamicEmailTemplate({ 
            template, 
            data: templateData
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

    // Only generate preview after property data is loaded or if we have fallback data
    if (propertyData || data) {
      generatePreview();
    } else if (!propertyData) {
      // Still loading property data
      setLoading(true);
    }
  }, [template, propertyData, data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            {!propertyData ? 'Loading property data...' : 'Generating preview...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Property info header for debugging */}
        {propertyData && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-700">
            Using real property: {propertyData.title} in {propertyData.city}, {propertyData.state}
          </div>
        )}
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