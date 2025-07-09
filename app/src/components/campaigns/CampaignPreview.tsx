import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LandivoProperty, LandivoBuyer } from '@/types/landivo';
import { formatCurrency } from '@/lib/utils';
import { Mail, MapPin, Square, Zap, Users, Home, Droplets, Clock, AlertCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { EmailTestModal } from './EmailTestModal';

interface Props {
  property: LandivoProperty;
  buyers: LandivoBuyer[];
}

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL;

export function CampaignPreview({ property, buyers }: Props) {
  const qualifiedBuyers = buyers.filter(buyer => buyer.qualified);
  const [selectedPlan, setSelectedPlan] = useState("1");
  const [testModalOpen, setTestModalOpen] = useState(false);

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
  const generateEmailContent = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; }
          .header { background-color: #2e7d32; color: white; padding: 20px; text-align: center; }
          .property-image { width: 100%; height: 200px; object-fit: cover; margin-bottom: 20px; }
          .badge { background-color: #4caf50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .price { font-size: 24px; font-weight: bold; color: #2e7d32; }
          .features { margin: 20px 0; }
          .feature { display: flex; align-items: center; margin-bottom: 10px; }
          .feature span:first-child { margin-right: 10px; font-size: 18px; }
          .details-box { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .detail-label { font-weight: bold; }
          .cta-button { background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Land Available</h1>
            <h2>${property.streetAddress}</h2>
          </div>
          
          <div style="padding: 20px;">
            ${propertyImage ? 
              `<img src="${propertyImage}" alt="Property" class="property-image">` : ''}
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <span class="badge">${property.status}</span>
              <span class="price">${formatCurrency(property.askingPrice)}</span>
            </div>
            
            <div class="features">
              <div class="feature">
                <span>📍</span>
                <span>${property.city}, ${property.state} ${property.zip}</span>
              </div>
              <div class="feature">
                <span>📐</span>
                <span>${property.acre} acres</span>
              </div>
              <div class="feature">
                <span>💧</span>
                <span>${property.water || 'No water'}</span>
              </div>
              <div class="feature">
                <span>⚡</span>
                <span>${property.electric || 'No electric'}</span>
              </div>
            </div>
            
            <div class="details-box">
              <h3>Financing Plan ${selectedPlan}</h3>
              <div class="detail-row">
                <span class="detail-label">Monthly Payment:</span>
                <span>${safeCurrency(planData.monthlyPayment)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Down Payment:</span>
                <span>${safeCurrency(planData.downPayment)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Loan Amount:</span>
                <span>${safeCurrency(planData.loanAmount)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Interest Rate:</span>
                <span>${planData.interest || 0}%</span>
              </div>
            </div>
            
            <center>
              <a href="${serverURL}/property/${property.id}" class="cta-button">View Property Details</a>
            </center>
          </div>
          
          <div class="footer">
            <p>You're receiving this because you're subscribed to property alerts.</p>
            <p><a href="${serverURL}/unsubscribe">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New Land Available - ${property.streetAddress}

${property.title}

Location: ${property.city}, ${property.state} ${property.zip}
Price: ${formatCurrency(property.askingPrice)}
Size: ${property.acre} acres
Water: ${property.water || 'No water'}
Electric: ${property.electric || 'No electric'}

Financing Plan ${selectedPlan}:
- Monthly Payment: ${safeCurrency(planData.monthlyPayment)}
- Down Payment: ${safeCurrency(planData.downPayment)}
- Loan Amount: ${safeCurrency(planData.loanAmount)}
- Interest Rate: ${planData.interest || 0}%

View property: ${serverURL}/property/${property.id}

You're receiving this because you're subscribed to property alerts.
Unsubscribe: ${serverURL}/unsubscribe
    `;

    return { html, text };
  };

  const emailContent = generateEmailContent();

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
                >
                  Plan 1
                </button>
                {property.monthlyPaymentTwo && (
                  <button
                    onClick={() => setSelectedPlan("2")}
                    className={`px-4 py-2 text-sm rounded ${selectedPlan === "2" ? 'bg-green-600 text-white' : 'bg-gray-100 border'}`}
                  >
                    Plan 2
                  </button>
                )}
                {property.monthlyPaymentThree && (
                  <button
                    onClick={() => setSelectedPlan("3")}
                    className={`px-4 py-2 text-sm rounded ${selectedPlan === "3" ? 'bg-green-600 text-white' : 'bg-gray-100 border'}`}
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
            </div>
          </div>
        </CardContent>
      </Card>

      <EmailTestModal
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
        campaignData={{
          subject: `New Land Available - ${property.streetAddress}`,
          htmlContent: emailContent.html,
          textContent: emailContent.text,
        }}
      />
    </>
  );
}