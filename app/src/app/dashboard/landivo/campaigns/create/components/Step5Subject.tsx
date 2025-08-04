// app/src/app/dashboard/landivo/campaigns/create/components/Step5Subject.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Props {
    formData: any;
    setFormData: (fn: (prev: any) => any) => void;
    errors: Record<string, string>;
    properties: any[];
}

interface PropertyData {
    county: string;
    city: string;
    state: string;
    zip: string;
    acre: number;
    streetAddress: string;
}

const SUBJECT_LINE_TEMPLATES = [
    '‼️PRICE REDUCED‼️🔥 Amazing Prime Lot in {Address}!',
    'Last Call to purchase this Lot in {Address} – Act Fast!',
    '🔥 Unrestricted LAND in {Address} – Act Fast!',
    '😱PRICE REDUCTION! Rare Lot in {Address} – Act Fast!🔥',
    '🚨 PRICE REDUCTION! {Acre} Acres Vacant Land– Exclusive Off-Market Deal! 🚨',
    '👀 All Utilities Available: Corner Lot in {Address} – Act Fast! 🙌',
    '🔥 PRICE REDUCTION! Lot Ready with All Utilities in {Address} – Act Fast! 🙌'
];

const ADDRESS_FORMAT_TEMPLATES = [
    '{county}',
    '{city}',
    '{state}',
    '{state} {zip}',
    '{county}, {state} {zip}',
    '{city}, {state} {zip}',
    '{county}, {city}, {state} {zip}'
];

export function Step5Subject({ formData, setFormData, errors, properties }: Props) {
    const [selectedSubjectTemplate, setSelectedSubjectTemplate] = useState('');
    const [selectedAddressTemplate, setSelectedAddressTemplate] = useState('');
    const [generatedSubject, setGeneratedSubject] = useState('');

    // Get property data from Landivo API
    const { data: propertyData, isLoading: propertyLoading, error: propertyError, refetch } = useQuery<PropertyData>({
        queryKey: ['residency', formData.property],
        queryFn: async () => {
            if (!formData.property) return null;
            const response = await fetch(`https://api.landivo.com/residency/${formData.property}`);
            if (!response.ok) {
                throw new Error('Failed to fetch property data');
            }
            return response.json();
        },
        enabled: !!formData.property,
        retry: 2
    });

    // Get selected property for fallback data
    const selectedProperty = properties?.find(p => p.id === formData.property);

    // Generate subject line when both templates are selected and property data is available
    useEffect(() => {
        if (selectedSubjectTemplate && selectedAddressTemplate && (propertyData || selectedProperty)) {
            generateSubjectLine();
        }
    }, [selectedSubjectTemplate, selectedAddressTemplate, propertyData, selectedProperty]);

    const generateSubjectLine = () => {
        if (!selectedSubjectTemplate || !selectedAddressTemplate) return;

        // Use API data first, fallback to selected property data
        const data = propertyData || selectedProperty;
        if (!data) return;

        // Generate address string based on selected template
        let addressString = selectedAddressTemplate
            .replace('{county}', data.county || '')
            .replace('{city}', data.city || '')
            .replace('{state}', data.state || '')
            .replace('{zip}', data.zip || '');

        // Clean up extra commas and spaces
        addressString = addressString
            .replace(/,\s*,/g, ',')
            .replace(/,\s*$/, '')
            .replace(/^\s*,/, '')
            .trim();

        // Generate final subject line
        let subject = selectedSubjectTemplate
            .replace('{Address}', addressString)
            .replace('{Acre}', data.acre?.toString() || '0.5');

        setGeneratedSubject(subject);
        
        // Update form data
        setFormData(prev => ({
            ...prev,
            subject: subject
        }));
    };

    const handleSubjectEdit = (value: string) => {
        setGeneratedSubject(value);
        setFormData(prev => ({
            ...prev,
            subject: value
        }));
    };

    const getSelectedProperty = () => properties?.find(p => p.id === formData.property);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Mail className="h-5 w-5" />
                        <span>Email Subject Line</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Property Selection Reminder */}
                    {!formData.property && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Please select a property in Step 1 to generate the subject line.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Property Data Loading/Error States */}
                    {formData.property && propertyLoading && (
                        <Alert>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertDescription>
                                Loading property information...
                            </AlertDescription>
                        </Alert>
                    )}

                    {formData.property && propertyError && (
                        <Alert className="border-orange-200 bg-orange-50">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                                <div>Failed to load property data from API. Using basic property info instead.</div>
                                <Button size="sm" variant="outline" onClick={() => refetch()} className="mt-2">
                                    <RefreshCcw className="h-3 w-3 mr-1" />
                                    Retry
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Subject Line Template Dropdown */}
                    <div className="space-y-2">
                        <Label>Subject Line Template *</Label>
                        <Select
                            value={selectedSubjectTemplate}
                            onValueChange={setSelectedSubjectTemplate}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a subject line template" />
                            </SelectTrigger>
                            <SelectContent>
                                {SUBJECT_LINE_TEMPLATES.map((template, index) => (
                                    <SelectItem key={index} value={template}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{template}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.subjectTemplate && (
                            <p className="text-sm text-red-600">{errors.subjectTemplate}</p>
                        )}
                    </div>

                    {/* Address Format Dropdown */}
                    <div className="space-y-2">
                        <Label>Address Format *</Label>
                        <Select
                            value={selectedAddressTemplate}
                            onValueChange={setSelectedAddressTemplate}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select address format" />
                            </SelectTrigger>
                            <SelectContent>
                                {ADDRESS_FORMAT_TEMPLATES.map((template, index) => (
                                    <SelectItem key={index} value={template}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{template}</span>
                                            {propertyData && (
                                                <span className="text-xs text-muted-foreground">
                                                    Preview: {template
                                                        .replace('{county}', propertyData.county || '')
                                                        .replace('{city}', propertyData.city || '')
                                                        .replace('{state}', propertyData.state || '')
                                                        .replace('{zip}', propertyData.zip || '')
                                                        .replace(/,\s*,/g, ',')
                                                        .replace(/,\s*$/, '')
                                                        .replace(/^\s*,/, '')
                                                        .trim()
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.addressTemplate && (
                            <p className="text-sm text-red-600">{errors.addressTemplate}</p>
                        )}
                    </div>

                    {/* Generated Subject Line Editor */}
                    {generatedSubject && (
                        <div className="space-y-2">
                            <Label>Generated Subject Line</Label>
                            <Textarea
                                value={generatedSubject}
                                onChange={(e) => handleSubjectEdit(e.target.value)}
                                placeholder="Your generated subject line will appear here..."
                                className="min-h-[100px]"
                                maxLength={150}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Edit the subject line as needed</span>
                                <span>{generatedSubject.length}/150 characters</span>
                            </div>
                            {errors.subject && (
                                <p className="text-sm text-red-600">{errors.subject}</p>
                            )}
                        </div>
                    )}

                    {/* Property Information Display */}
                    {formData.property && (propertyData || selectedProperty) && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-medium text-blue-800 mb-2">Property Information</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                                <div><span className="font-medium">Address:</span> {(propertyData || selectedProperty)?.streetAddress}</div>
                                <div><span className="font-medium">City:</span> {(propertyData || selectedProperty)?.city}</div>
                                <div><span className="font-medium">County:</span> {(propertyData || selectedProperty)?.county}</div>
                                <div><span className="font-medium">State:</span> {(propertyData || selectedProperty)?.state}</div>
                                <div><span className="font-medium">ZIP:</span> {(propertyData || selectedProperty)?.zip}</div>
                                <div><span className="font-medium">Acres:</span> {(propertyData || selectedProperty)?.acre || 'N/A'}</div>
                            </div>
                        </div>
                    )}

                    {/* Template Selection Summary */}
                    {selectedSubjectTemplate && selectedAddressTemplate && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-medium text-green-800 mb-2">Template Selection</h4>
                            <div className="space-y-1 text-sm text-green-700">
                                <p><span className="font-medium">Subject Template:</span> {selectedSubjectTemplate}</p>
                                <p><span className="font-medium">Address Format:</span> {selectedAddressTemplate}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}