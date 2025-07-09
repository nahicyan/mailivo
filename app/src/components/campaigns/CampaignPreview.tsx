import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LandivoProperty, LandivoBuyer } from '@/types/landivo';
import { formatCurrency } from '@/lib/utils';
import { Mail, MapPin, Square, Zap, Users, Home, Droplets, Clock, AlertCircle, Send, Eye, Code } from 'lucide-react';
import { useState, useEffect } from 'react';
import { EmailTestModal } from './EmailTestModal';
import { render } from '@react-email/render';
import { PropertyCampaignEmail } from '@/emails/PropertyCampaignEmail';

interface Props {
  property: LandivoProperty;
  buyers: LandivoBuyer[];
}

interface EmailContent {
  html: string;
  text: string;
}

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL;

export function CampaignPreview({ property, buyers }: Props) {
  const qualifiedBuyers = buyers.filter(buyer => buyer.qualified);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [emailContent, setEmailContent] = useState<EmailContent | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [previewMode, setPreviewMode] = useState<'visual' | 'html'>('visual');

  const getPropertyImage = () => {
    if (!property.imageUrls) return null;
    let images = [];
    try {
      images = Array.isArray(property.imageUrls) ? property.imageUrls : JSON.parse(property.imageUrls);
    } catch (error) {
      return null;
    }
    return images.length ? `${serverURL}/${images[0]}` : null;
  };

  const propertyImage = getPropertyImage();

  // Generate HTML content for email
  const generateEmailContent = async (): Promise<EmailContent> => {
    const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
    
    const html = await render(
      PropertyCampaignEmail({ 
        property, 
        serverURL 
      })
    );

    // Generate text version
    const text = `
🔥 Great Lot in ${property.city}, ${property.state} – Act Fast!

${property.title}

Location: ${property.streetAddress}, ${property.city}, ${property.state} ${property.zip}
Status: ${property.status}
Size: ${property.sqft?.toLocaleString()} sqft (${property.acre} acres)
Zoning: ${property.zoning}

Financing Available - Multiple Plans Available

View full details at: https://landivo.com/properties/${property.id}

${property.description?.substring(0, 400)}...

To unsubscribe: ${serverURL}/unsubscribe
    `;

    return { html, text };
  };

  // Generate email content when component mounts
  useEffect(() => {
    const generateContent = async () => {
      setIsGeneratingEmail(true);
      try {
        const content = await generateEmailContent();
        setEmailContent(content);
      } catch (error) {
        console.error('Error generating email content:', error);
      } finally {
        setIsGeneratingEmail(false);
      }
    };

    generateContent();
  }, [property]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Campaign Preview
            </div>
            <Button 
              size="sm" 
              onClick={() => setTestModalOpen(true)}
              className="gap-2"
              disabled={!emailContent || isGeneratingEmail}
            >
              <Send className="h-4 w-4" />
              Test Campaign
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Preview Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <strong>Subject:</strong> 🔥 Great Lot in {property.city}, {property.state} – Act Fast!
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setPreviewMode('visual')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    previewMode === 'visual' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Eye className="h-3 w-3 inline mr-1" />
                  Visual
                </button>
                <button
                  onClick={() => setPreviewMode('html')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    previewMode === 'html' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Code className="h-3 w-3 inline mr-1" />
                  HTML
                </button>
              </div>
            </div>

            {/* Email Preview */}
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              {isGeneratingEmail ? (
                <div className="bg-white border rounded p-4 text-sm flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="h-4 w-4 animate-spin" />
                    Generating email preview...
                  </div>
                </div>
              ) : previewMode === 'visual' ? (
                <div className="bg-white">
                  {emailContent?.html ? (
                    <iframe
                      srcDoc={emailContent.html}
                      className="w-full h-[800px] border-0"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>Email preview not available</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-900 text-green-400 p-4 text-xs font-mono max-h-[800px] overflow-auto">
                  <pre className="whitespace-pre-wrap">
                    {emailContent?.html || 'No HTML content available'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {emailContent && (
        <EmailTestModal
          open={testModalOpen}
          onOpenChange={setTestModalOpen}
          campaignData={{
            subject: `🔥 Great Lot in ${property.city}, ${property.state} – Act Fast!`,
            htmlContent: emailContent.html,
            textContent: emailContent.text,
          }}
        />
      )}
    </>
  );
}