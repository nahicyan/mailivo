// app/src/app/dashboard/landivo/campaigns/create/components/Step6Subject.tsx
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { RichTextEditor, RichTextEditorRef } from '@/components/RichText/rich-text-editor';

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
    '{city} {zip}',
    '{county}, {state} {zip}',
    '{city}, {state} {zip}',
    '{county}, {city}, {state} {zip}'
];

export function Step6Subject({ formData, setFormData, errors, properties }: Props) {
    const [selectedSubjectTemplate, setSelectedSubjectTemplate] = useState('');
    const [selectedAddressTemplate, setSelectedAddressTemplate] = useState('');
    const [generatedSubject, setGeneratedSubject] = useState('');
    const richTextEditorRef = useRef<RichTextEditorRef>(null);

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
        retry: 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Get selected property data from the passed properties array
    const selectedProperty = properties?.find(p => p.id === formData.property);

    // Generate subject line when both dropdowns are selected
    useEffect(() => {
        if (selectedSubjectTemplate && selectedAddressTemplate && (propertyData || selectedProperty)) {
            const property = propertyData || selectedProperty;
            let addressText = selectedAddressTemplate;

            // Replace placeholders in address template
            addressText = addressText
                .replace('{county}', property?.county || '')
                .replace('{city}', property?.city || '')
                .replace('{state}', property?.state || '')
                .replace('{zip}', property?.zip || '');

            // Generate subject line
            let subject = selectedSubjectTemplate
                .replace('{Address}', addressText)
                .replace('{Acre}', property?.acre?.toString() || '1');

            setGeneratedSubject(subject);
            
            // Auto-populate the rich text editor
            if (richTextEditorRef.current) {
                richTextEditorRef.current.setContent(subject);
            }

            // Update form data
            setFormData(prev => ({
                ...prev,
                subject: subject,
                subjectTemplate: selectedSubjectTemplate,
                addressTemplate: selectedAddressTemplate
            }));
        }
    }, [selectedSubjectTemplate, selectedAddressTemplate, propertyData, selectedProperty, setFormData]);

    const handleSubjectTemplateChange = (template: string) => {
        setSelectedSubjectTemplate(template);
        // Clear rich text editor when dropdown changes
        if (richTextEditorRef.current) {
            richTextEditorRef.current.clear();
        }
        // Clear generated subject
        setGeneratedSubject('');
        setFormData(prev => ({ ...prev, subject: '', subjectTemplate: template }));
    };

    const handleAddressTemplateChange = (template: string) => {
        setSelectedAddressTemplate(template);
        // Clear rich text editor when dropdown changes
        if (richTextEditorRef.current) {
            richTextEditorRef.current.clear();
        }
        // Clear generated subject
        setGeneratedSubject('');
        setFormData(prev => ({ ...prev, subject: '', addressTemplate: template }));
    };

    const handleSubjectEdit = (content: string) => {
        // Extract plain text from HTML content for validation
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        
        setGeneratedSubject(plainText);
        setFormData(prev => ({ ...prev, subject: plainText, subjectHtml: content }));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <CardTitle>Subject Line Configuration</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Choose templates and customize your email subject line with rich text and emojis
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Missing Property Alert */}
                    {!formData.property && (
                        <Alert className="border-amber-200 bg-amber-50">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800">
                                Please select a property in the previous steps to generate personalized subject lines.
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
                            onValueChange={handleSubjectTemplateChange}
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
                        <Label>Address Format Template *</Label>
                        <Select
                            value={selectedAddressTemplate}
                            onValueChange={handleAddressTemplateChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select address format" />
                            </SelectTrigger>
                            <SelectContent>
                                {ADDRESS_FORMAT_TEMPLATES.map((template, index) => (
                                    <SelectItem key={index} value={template}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{template}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.addressTemplate && (
                            <p className="text-sm text-red-600">{errors.addressTemplate}</p>
                        )}
                    </div>

                    {/* Rich Text Subject Line Editor - Always visible */}
                    <div className="space-y-2">
                        <Label>Customize Subject Line</Label>
                        <RichTextEditor
                            ref={richTextEditorRef}
                            value={generatedSubject}
                            onChange={handleSubjectEdit}
                            placeholder="Enter your custom subject line or select templates above to auto-generate..."
                            maxLength={150}
                            showToolbar={true}
                            showEmojiPicker={true}
                            className="min-h-[150px]"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Customize with rich text formatting and emojis</span>
                        </div>
                        {errors.subject && (
                            <p className="text-sm text-red-600">{errors.subject}</p>
                        )}
                    </div>

                    {/* Template Generation Helper */}
                    {selectedSubjectTemplate && selectedAddressTemplate && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                            <p>💡 Templates selected! Your subject line has been auto-generated above. Feel free to customize it further.</p>
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