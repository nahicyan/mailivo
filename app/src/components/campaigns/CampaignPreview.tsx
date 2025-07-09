import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LandivoProperty, LandivoBuyer } from '@/types/landivo';
import { formatCurrency } from '@/lib/utils';
import { Mail, MapPin, Square, Zap, Users, Home, Droplets, Clock, AlertCircle, Send } from 'lucide-react';
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
  const [selectedPlan, setSelectedPlan] = useState("1");
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [emailContent, setEmailContent] = useState<EmailContent | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

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

  const getPlanData = () => {
    switch (selectedPlan) {
      case "2":
        return {
          monthlyPayment: property.monthlyPaymentTwo,
          downPayment: property.downPaymentTwo,
          loanAmount: property.loanAmountTwo,
          interest: property.interestTwo,
        };
      case "3":
        return {
          monthlyPayment: property.monthlyPaymentThree,
          downPayment: property.downPaymentThree,
          loanAmount: property.loanAmountThree,
          interest: property.interestThree,
        };
      default:
        return {
          monthlyPayment: property.monthlyPaymentOne,
          downPayment: property.downPaymentOne,
          loanAmount: property.loanAmountOne,
          interest: property.interestOne,
        };
    }
  };

  const planData = getPlanData();

  // Safe currency formatter that handles undefined values
  const safeCurrency = (amount: number | undefined): string => {
    return formatCurrency(amount || 0);
  };

  // Generate HTML content for email
  const generateEmailContent = async (): Promise<EmailContent> => {
    const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
    
    const html = await render(
      PropertyCampaignEmail({ 
        property, 
        selectedPlan,
        serverURL 
      })
    );

    // Generate text version
    const text = `
New Land Available - ${property.streetAddress}

${property.title}

Location: ${property.streetAddress}, ${property.city}, ${property.state} ${property.zip}
Status: ${property.status}
Size: ${property.sqft?.toLocaleString()} sqft (${property.acre} acres)
Zoning: ${property.zoning}

${selectedPlan === "1" ? "Plan 1" : selectedPlan === "2" ? "Plan 2" : "Plan 3"} Financing:
Monthly Payment: $${planData.monthlyPayment?.toLocaleString()}/mo
Down Payment: $${planData.downPayment?.toLocaleString()}
Interest Rate: ${planData.interest}% APR

View full details at: https://landivo.com/properties/${property.id}

${property.description?.substring(0, 400)}...

To unsubscribe: ${serverURL}/unsubscribe
    `;

    return { html, text };
  };

  // Generate email content when component mounts or selectedPlan changes
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
  }, [selectedPlan, property]); // Regenerate when plan or property changes

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
            {/* Campaign Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Buyers</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{buyers.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Qualified</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{qualifiedBuyers.length}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Property Size</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{property.acre} acres</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Price</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(property.askingPrice)}</p>
              </div>
            </div>

            {/* Financing Plan Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Financing Plan for Campaign:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPlan("1")}
                  className={`px-4 py-2 text-sm rounded ${selectedPlan === "1" ? 'bg-green-600 text-white' : 'bg-gray-100 border'}`}
                  disabled={isGeneratingEmail}
                >
                  Plan 1
                </button>
                {property.monthlyPaymentTwo && (
                  <button
                    onClick={() => setSelectedPlan("2")}
                    className={`px-4 py-2 text-sm rounded ${selectedPlan === "2" ? 'bg-green-600 text-white' : 'bg-gray-100 border'}`}
                    disabled={isGeneratingEmail}
                  >
                    Plan 2
                  </button>
                )}
                {property.monthlyPaymentThree && (
                  <button
                    onClick={() => setSelectedPlan("3")}
                    className={`px-4 py-2 text-sm rounded ${selectedPlan === "3" ? 'bg-green-600 text-white' : 'bg-gray-100 border'}`}
                    disabled={isGeneratingEmail}
                  >
                    Plan 3
                  </button>
                )}
              </div>
            </div>

            {/* Email Preview */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Subject:</strong> New Land Available - {property.streetAddress}
              </div>
              
              {isGeneratingEmail ? (
                <div className="bg-white border rounded p-4 text-sm flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="h-4 w-4 animate-spin" />
                    Generating email preview...
                  </div>
                </div>
              ) : (
                <div className="bg-white border rounded p-4 text-sm">
                  <div className="space-y-3">
                    {propertyImage && (
                      <img 
                        src={propertyImage} 
                        alt="Property" 
                        className="w-full h-48 object-cover rounded"
                      />
                    )}
                    
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">{property.status}</Badge>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(property.askingPrice)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{property.city}, {property.state} {property.zip}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Square className="h-4 w-4" />
                        <span>{property.acre} acres</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        <span>{property.water || 'No water'}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="font-medium mb-2">Financing Plan {selectedPlan}</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Monthly: {safeCurrency(planData.monthlyPayment)}</div>
                        <div>Down: {safeCurrency(planData.downPayment)}</div>
                        <div>Loan: {safeCurrency(planData.loanAmount)}</div>
                        <div>Rate: {planData.interest || 0}%</div>
                      </div>
                    </div>
                    
                    <Button className="w-full" size="sm">
                      View Property Details
                    </Button>
                  </div>
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
            subject: `New Land Available - ${property.streetAddress}`,
            htmlContent: emailContent.html,
            textContent: emailContent.text,
          }}
        />
      )}
    </>
  );
}