import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LandivoProperty, LandivoBuyer } from '@/types/landivo';
import { formatCurrency } from '@/lib/utils';
import { Mail, MapPin, Square, Zap, Users, Home, Droplets, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
  property: LandivoProperty;
  buyers: LandivoBuyer[];
}

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL;

export function CampaignPreview({ property, buyers }: Props) {
  const qualifiedBuyers = buyers.filter(buyer => buyer.qualified);
  const [selectedPlan, setSelectedPlan] = useState("1");

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

  // Get plan data based on selection
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Campaign Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Preview */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="text-sm text-gray-600 mb-2">Subject: New Land Available - {property.streetAddress}</div>
          
          <div className="bg-white border rounded p-4 text-sm">
            <div className="font-bold text-lg mb-2" dangerouslySetInnerHTML={{ __html: property.title }} />
            
            {propertyImage && (
              <img src={propertyImage} alt="Property" className="w-full h-48 object-cover rounded mb-4" />
            )}

            <div className="flex items-center justify-between mb-3">
              <Badge className="bg-yellow-100 text-yellow-800">{property.status}</Badge>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(property.askingPrice)}</div>
            </div>

            {/* Property Highlights */}
            <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-gray-50 rounded">
              <div className="text-center">
                <Square className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                <div className="text-xs font-medium">{property.sqft?.toLocaleString()}</div>
                <div className="text-xs text-gray-500">21,154 sqft</div>
              </div>
              <div className="text-center">
                <Home className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                <div className="text-xs font-medium">{property.zoning}</div>
                <div className="text-xs text-gray-500">Zoning</div>
              </div>
              <div className="text-center">
                <MapPin className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                <div className="text-xs font-medium">0.49 acres</div>
                <div className="text-xs text-gray-500">Acreage</div>
              </div>
              <div className="text-center">
                <Clock className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                <div className="text-xs font-medium">Available</div>
                <div className="text-xs text-gray-500">Financing</div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4" />
              <span>{property.streetAddress}, {property.city}, {property.state} {property.zip}</span>
            </div>

            {/* Location & Property Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
              <div>
                <h4 className="font-semibold mb-2">Location</h4>
                <div className="space-y-1">
                  <div><span className="font-medium">County:</span> {property.county}</div>
                  <div><span className="font-medium">State:</span> {property.state}</div>
                  <div><span className="font-medium">Zip:</span> {property.zip}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Property Details</h4>
                <div className="space-y-1">
                  <div><span className="font-medium">Size:</span> {property.sqft?.toLocaleString()}</div>
                  <div><span className="font-medium">Acreage:</span> {property.acre}</div>
                  <div><span className="font-medium">Zoning:</span> {property.zoning}</div>
                  <div><span className="font-medium">Parcel:</span> {property.apnOrPin}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div><span className="font-medium">Land Type:</span> {property.landType?.join(', ')}</div>
              <div><span className="font-medium">Water:</span> {property.water || 'N/A'}</div>
              <div><span className="font-medium">Sewer:</span> {property.sewer || 'N/A'}</div>
              <div><span className="font-medium">Electric:</span> {property.electric || 'N/A'}</div>
            </div>

            {/* Payment Calculator with Plan Selection */}
            {property.financing && property.financing !== 'Not-Available' && property.monthlyPaymentOne && (
              <div className="bg-blue-50 p-4 rounded mb-4">
                <h4 className="font-semibold text-lg mb-3">Payment Calculator</h4>
                
                {/* Plan Selection */}
                <div className="flex gap-2 mb-4">
                  {property.monthlyPaymentOne && (
                    <button
                      onClick={() => setSelectedPlan("1")}
                      className={`px-3 py-1 text-xs rounded ${selectedPlan === "1" ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                    >
                      Plan 1
                    </button>
                  )}
                  {property.monthlyPaymentTwo && (
                    <button
                      onClick={() => setSelectedPlan("2")}
                      className={`px-3 py-1 text-xs rounded ${selectedPlan === "2" ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                    >
                      Plan 2
                    </button>
                  )}
                  {property.monthlyPaymentThree && (
                    <button
                      onClick={() => setSelectedPlan("3")}
                      className={`px-3 py-1 text-xs rounded ${selectedPlan === "3" ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                    >
                      Plan 3
                    </button>
                  )}
                </div>

                {/* Payment Display */}
                <div className="flex justify-center mb-4">
                  <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center border-8 border-blue-600">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        ${planData.monthlyPayment?.toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-600">/mo</div>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Monthly Payment</span>
                    <span>${planData.monthlyPayment?.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loan Amount</span>
                    <span>${planData.loanAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Down Payment</span>
                    <span>${planData.downPayment?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Property Tax</span>
                    <span>${Math.round((property.tax || 0) / 12)}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Rate</span>
                    <span>{planData.interest}% APR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loan Term</span>
                    <span>{property.term || 60} Months</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <span>${property.serviceFee || 35}/mo</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-green-50 rounded">
                  <div className="space-y-1 text-sm">
                    <p className="text-green-800 font-medium">✓ Takes About 2 Minutes</p>
                    <p className="text-green-800 font-medium">✓ Won't affect your credit score</p>
                  </div>
                  <Button className="w-full mt-2 bg-green-600 hover:bg-green-700">
                    Get Pre-Qualified
                  </Button>
                </div>
              </div>
            )}

            <div 
              className="text-gray-600 text-sm mb-4" 
              dangerouslySetInnerHTML={{ 
                __html: property.description?.substring(0, 400) + '...' || 'No description available'
              }} 
            />

            {/* Buyer Guidelines */}
            <div className="bg-gray-50 p-3 rounded mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Buyer Guidelines</h4>
              <div className="text-xs space-y-1 text-gray-700">
                <p>• Buyer pays ALL closing costs.</p>
                <p>• Cash OR Hard Money Only.</p>
                <p>• A $395 transaction fee applies to each contract and is payable by the buyer.</p>
                <p>• This Property is being sold AS-IS.</p>
                <p>• No Daisy Chaining – No Option Period.</p>
                <p>• Due diligence required before submitting an offer.</p>
                <p>• Agents, please add your commission to the buyer's sales price.</p>
                <p>• Earnest money deposit varies per property.</p>
                <p>• Closing ASAP.</p>
              </div>
            </div>

            <Button className="w-full mt-3">View Full Details</Button>
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">Total Recipients</div>
            <div className="text-2xl font-bold">{buyers.length}</div>
          </div>
          <div>
            <div className="font-medium">Qualified Buyers</div>
            <div className="text-2xl font-bold text-green-600">{qualifiedBuyers.length}</div>
          </div>
        </div>

        <Button className="w-full">Send Campaign to {buyers.length} Buyers</Button>
      </CardContent>
    </Card>
  );
}