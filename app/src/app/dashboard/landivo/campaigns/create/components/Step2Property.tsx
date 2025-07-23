// app/src/app/dashboard/landivo/campaigns/create/components/Step2Property.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building } from 'lucide-react';

interface Props {
    formData: any;
    setFormData: (fn: (prev: any) => any) => void;
    errors: Record<string, string>;
    properties: any[];
    propertiesLoading: boolean;
    propertiesError: any;
}

export function Step2Property({ formData, setFormData, errors, properties, propertiesLoading, propertiesError }: Props) {
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

    const getSelectedProperty = () => properties?.find(p => p.id === formData.property);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Select Property</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Property *</Label>
                    <Select
                        value={formData.property}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, property: value }))}
                        disabled={propertiesLoading || !!propertiesError}
                    >
                        <SelectTrigger className={errors.property ? 'border-red-500' : ''}>
                            <SelectValue placeholder={
                                propertiesLoading ? "Loading properties..." :
                                propertiesError ? "Error loading properties" :
                                "Select a property for this campaign"
                            } />
                        </SelectTrigger>
                        <SelectContent>
                            {properties?.map((property) => (
                                <SelectItem key={property.id} value={property.id}>
                                    <div className="flex flex-col space-y-1">
                                        <span className="font-medium">{property.title}</span>
                                        <span className="text-sm text-gray-500">
                                            {property.streetAddress}, {property.city}, {property.state}
                                        </span>
                                        <div className="flex items-center space-x-2 text-xs">
                                            <Badge variant="secondary">{formatCurrency(property.askingPrice)}</Badge>
                                            <Badge variant="outline">{property.acre} acres</Badge>
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.property && <p className="text-sm text-red-600">{errors.property}</p>}
                </div>

                {formData.property && getSelectedProperty() && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Selected Property</h4>
                        <div className="space-y-2">
                            <p className="font-medium">{getSelectedProperty()?.title}</p>
                            <p className="text-sm text-gray-600">
                                {getSelectedProperty()?.streetAddress}, {getSelectedProperty()?.city}, {getSelectedProperty()?.state}
                            </p>
                            <div className="flex space-x-2">
                                <Badge>{formatCurrency(getSelectedProperty()?.askingPrice || 0)}</Badge>
                                <Badge variant="outline">{getSelectedProperty()?.acre} acres</Badge>
                                <Badge variant="outline">{getSelectedProperty()?.status}</Badge>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
