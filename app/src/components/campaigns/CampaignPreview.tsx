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

  // Generate HTML content for email
  const generateEmailContent = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; padding: 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; }
          .property-image { width: 100%; height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 20px; }
          .badge { display: inline-block; padding: 4px 12px; background-color: #fef3c7; color: #92400e; border-radius: 4px; font-size: 14px; font-weight: bold; }
          .price { font-size: 24px; font-weight: bold; color: #2563eb; margin: 10px 0; }
          .features { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .feature { display: flex; align-items: center; gap: 8px; }
          .feature-icon { width: 20px; height: 20px; }
          .details-box { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .detail-label { font-weight: bold; }
          .cta-button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Land Available</h1>
            <p>${property.streetAddress}</p>
          </div>
          
          <div class="content">
            <h2>${property.title}</h2>
            ${propertyImage ? `<img src="${propertyImage}" alt="Property" class="property-image">` : ''}
            
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
                <span>${property.totalAcreage} acres</span>
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
                <span>${formatCurrency(planData.monthlyPayment)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Down Payment:</span>
                <span>${formatCurrency(planData.downPayment)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Loan Amount:</span>
                <span>${formatCurrency(planData.loanAmount)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Interest Rate:</span>
                <span>${planData.interest}%</span>
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
Size: ${property.totalAcreage} acres
Water: ${property.water || 'No water'}
Electric: ${property.electric || 'No electric'}

Financing Plan ${selectedPlan}:
- Monthly Payment: ${formatCurrency(planData.monthlyPayment)}
- Down Payment: ${formatCurrency(planData.downPayment)}
- Loan Amount: ${formatCurrency(planData.loanAmount)}
- Interest Rate: ${planData.interest}%

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
          {/* Email Preview Content - your existing preview code */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-2">Subject: New Land Available - {property.streetAddress}</div>
            
            <div className="bg-white border rounded p-4 text-sm">
              {/* Your existing preview content */}
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