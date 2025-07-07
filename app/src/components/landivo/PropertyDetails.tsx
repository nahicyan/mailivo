import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LandivoProperty } from '@/types/landivo';
import { MapPin, Square, Zap, Home, Clock, AlertCircle, NotebookPen } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Props {
  property: LandivoProperty;
}

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL;

export function PropertyDetails({ property }: Props) {
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
        <CardTitle>Land Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {propertyImage && (
          <div className="aspect-video rounded-lg overflow-hidden">
            <img src={propertyImage} alt={property.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div>
          <div className="font-semibold mb-2" dangerouslySetInnerHTML={{ __html: property.title }} />
          <div className="flex items-center gap-1 text-muted-foreground mb-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{property.streetAddress}</span>
          </div>
          <div className="text-sm text-muted-foreground">{property.city}, {property.state} {property.zip}</div>
        </div>

        {/* Property Highlights */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Square className="h-6 w-6 mx-auto mb-2 text-gray-600" />
            <div className="font-medium">{property.sqft?.toLocaleString()}</div>
            <div className="text-xs text-gray-500">21,154 sqft</div>
          </div>
          <div className="text-center">
            <Home className="h-6 w-6 mx-auto mb-2 text-gray-600" />
            <div className="font-medium">{property.zoning}</div>
            <div className="text-xs text-gray-500">Zoning</div>
          </div>
          <div className="text-center">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-gray-600" />
            <div className="font-medium">Not Available</div>
            <div className="text-xs text-gray-500">Survey</div>
          </div>
          <div className="text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-gray-600" />
            <div className="font-medium">Available</div>
            <div className="text-xs text-gray-500">Financing</div>
          </div>
        </div>

        {/* Location & Property Details */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Location</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Street Address</span>
                <span>{property.streetAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">County</span>
                <span>{property.county}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">State</span>
                <span>{property.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Zip</span>
                <span>{property.zip}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Property Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Size</span>
                <span>{property.sqft?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Acreage</span>
                <span>{property.acre}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Zoning</span>
                <span>{property.zoning}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Parcel</span>
                <span>{property.apnOrPin}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Calculator */}
        {property.financing && property.financing !== 'Not-Available' && property.monthlyPaymentOne && (
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-4">Payment Calculator</h3>
            
            {/* Plan Selection */}
            <div className="flex gap-2 mb-4">
              {property.monthlyPaymentOne && (
                <button
                  onClick={() => setSelectedPlan("1")}
                  className={`px-4 py-2 text-sm rounded ${selectedPlan === "1" ? 'bg-green-600 text-white' : 'bg-gray-100 border'}`}
                >
                  Plan 1
                </button>
              )}
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

            {/* Circular Payment Display */}
            <div className="flex justify-center mb-4">
              <div className="relative w-40 h-40 rounded-full flex items-center justify-center border-8 border-green-600 bg-white">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    ${planData.monthlyPayment?.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">/mo</div>
                </div>
              </div>
            </div>

            {/* Payment Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div className="flex justify-between">
                <span className="font-medium">Monthly Payment</span>
                <span>${planData.monthlyPayment?.toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Loan Amount</span>
                <span>${planData.loanAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Down Payment</span>
                <span>${planData.downPayment?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Property Tax</span>
                <span>${Math.round((property.tax || 0) / 12)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Interest Rate</span>
                <span>{planData.interest}% APR</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Service Fee</span>
                <span>${property.serviceFee || 35}/mo</span>
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded mb-4">
              <div className="space-y-1 text-sm">
                <p className="text-green-800">✓ Takes About 2 Minutes</p>
                <p className="text-green-800">✓ Won't affect your credit score</p>
              </div>
            </div>

            <Button className="w-full bg-green-600 hover:bg-green-700">
              Get Pre-Qualified
            </Button>
          </div>
        )}

        {/* Property Description - Only one instance */}
        <div>
          <h3 className="font-semibold mb-2">Property Description</h3>
          <div className="bg-green-50 p-3 rounded mb-3">
            <div className="text-sm font-medium text-green-800">Property Overview:</div>
            <div className="text-xs text-green-700">
              Zoning: {property.zoning}<br/>
              Lot Size: {property.sqft?.toLocaleString()} sqft<br/>
              Utilities: {property.water}, {property.sewer} & {property.electric}<br/>
              Mobile Homes: {property.mobileHomeFriendly || 'Not Permitted'}<br/>
              Survey: {property.survey || 'No'}<br/>
              Floodplain: {property.floodplain || 'No'}<br/>
              HOA: {property.hoaPoa || 'No'}<br/>
              Restrictions: {property.restrictions || 'Unknown'}
            </div>
          </div>
          <div className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: property.description }} />
        </div>

        {/* Buyer Guidelines */}
        <Accordion type="single" collapsible className="space-y-2">
          <AccordionItem value="guidelines" className="border rounded">
            <AccordionTrigger className="px-4">
              <div className="flex items-center gap-2">
                <NotebookPen className="w-5 h-5" />
                <span>Buyer Guidelines</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2 text-sm">
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}