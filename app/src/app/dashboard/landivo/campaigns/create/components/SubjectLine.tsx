// app/src/app/dashboard/landivo/campaigns/create/components/Step6Subject.tsx
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, AlertTriangle, RefreshCcw, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmojiTextEditor, EmojiTextEditorRef } from '@/components/EmojiText/emoji-text-editor';
import { useSubjectTemplates } from '@/hooks/useSubjectTemplates';
import { TemplateManagementModal } from '@/components/subject-templates/TemplateManagementModal';

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
    zoning?: string;
    restrictions?: string;
    askingPrice?: number;
    minPrice?: number;
    disPrice?: number;
    hoaPoa?: string;
    hoaFee?: number;
    tax?: number;
    water?: string;
    sewer?: string;
    electric?: string;
    roadCondition?: string;
    floodplain?: string;
}

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

export function SubjectLine({ formData, setFormData, errors, properties }: Props) {
    const [selectedSubjectTemplate, setSelectedSubjectTemplate] = useState('');
    const [selectedAddressTemplate, setSelectedAddressTemplate] = useState('');
    const [generatedSubject, setGeneratedSubject] = useState('');
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateRequiresAddress, setTemplateRequiresAddress] = useState(false);
    const EmojiTextEditorRef = useRef<EmojiTextEditorRef>(null);

    // Get enabled subject templates
    const { data: templatesData, isLoading: templatesLoading } = useSubjectTemplates(true);
    const enabledTemplates = templatesData?.templates || [];

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
        enabled: !!formData.property
    });

    // Initialize subject from form data
    useEffect(() => {
        if (formData.subject && generatedSubject !== formData.subject) {
            setGeneratedSubject(formData.subject);
            EmojiTextEditorRef.current?.setContent(formData.subject);
        }
    }, [formData.subject, generatedSubject]);

    // Handle template generation
    useEffect(() => {
        if (selectedSubjectTemplate && propertyData) {
            if (templateRequiresAddress && selectedAddressTemplate) {
                generateSubjectLine();
            } else if (!templateRequiresAddress) {
                generateSubjectLine();
            }
        }
    }, [selectedSubjectTemplate, selectedAddressTemplate, propertyData, templateRequiresAddress]);

    const replaceVariables = (template: string, data: PropertyData, addressFormat?: string): string => {
        let result = template;
        
        // Replace {address} placeholder with formatted address if addressFormat is provided
        if (addressFormat && result.includes('{address}')) {
            const formattedAddress = replaceVariables(addressFormat, data);
            result = result.replace(/{address}/g, formattedAddress);
        }
        
        // Replace other property variables
        const replacements: Record<string, any> = {
            county: data.county || '',
            city: data.city || '',
            state: data.state || '',
            zip: data.zip || '',
            streetAddress: data.streetAddress || '',
            acre: data.acre?.toString() || '',
            zoning: data.zoning || '',
            restrictions: data.restrictions || '',
            askingPrice: data.askingPrice ? `$${data.askingPrice.toLocaleString()}` : '',
            minPrice: data.minPrice ? `$${data.minPrice.toLocaleString()}` : '',
            disPrice: data.disPrice ? `$${data.disPrice.toLocaleString()}` : '',
            hoaPoa: data.hoaPoa || '',
            hoaFee: data.hoaFee ? `$${data.hoaFee}` : '',
            tax: data.tax ? `$${data.tax}` : '',
            water: data.water || '',
            sewer: data.sewer || '',
            electric: data.electric || '',
            roadCondition: data.roadCondition || '',
            floodplain: data.floodplain || ''
        };

        Object.entries(replacements).forEach(([key, value]) => {
            const regex = new RegExp(`{${key}}`, 'g');
            result = result.replace(regex, value.toString());
        });

        return result;
    };

    const generateSubjectLine = () => {
        if (!propertyData || !selectedSubjectTemplate) return;

        const template = enabledTemplates.find(t => t.id === selectedSubjectTemplate);
        if (!template) return;

        let generated: string;
        
        if (templateRequiresAddress && selectedAddressTemplate) {
            generated = replaceVariables(template.content, propertyData, selectedAddressTemplate);
        } else if (!templateRequiresAddress) {
            generated = replaceVariables(template.content, propertyData);
        } else {
            // Template requires address but no format selected yet
            return;
        }

        setGeneratedSubject(generated);
        EmojiTextEditorRef.current?.setContent(generated);
        
        setFormData(prev => ({
            ...prev,
            subject: generated
        }));
    };

    const handleSubjectTemplateChange = (templateId: string) => {
        setSelectedSubjectTemplate(templateId);
        
        if (templateId) {
            const template = enabledTemplates.find(t => t.id === templateId);
            if (template) {
                const requiresAddress = template.content.includes('{address}');
                setTemplateRequiresAddress(requiresAddress);
                
                if (!requiresAddress) {
                    // Template doesn't need address format, generate immediately
                    setSelectedAddressTemplate('');
                    if (propertyData) {
                        const generated = replaceVariables(template.content, propertyData);
                        setGeneratedSubject(generated);
                        EmojiTextEditorRef.current?.setContent(generated);
                        setFormData(prev => ({
                            ...prev,
                            subject: generated
                        }));
                    }
                } else {
                    // Template needs address format, clear previous selection
                    setSelectedAddressTemplate('');
                }
            }
        } else {
            setTemplateRequiresAddress(false);
            setSelectedAddressTemplate('');
        }
    };

    const handleAddressTemplateChange = (template: string) => {
        setSelectedAddressTemplate(template);
        if (selectedSubjectTemplate && template && propertyData) {
            generateSubjectLine();
        }
    };

    const handleSubjectEdit = (content: string) => {
        setGeneratedSubject(content);
        setFormData(prev => ({
            ...prev,
            subject: content
        }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Subject Line
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Property Loading State */}
                {propertyLoading && (
                    <Alert>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription>
                            Loading property information to generate templates...
                        </AlertDescription>
                    </Alert>
                )}

                {/* Property Error State */}
                {propertyError && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <div>Unable to load property data for template generation.</div>
                            <div>Using basic property info instead.</div>
                            <Button size="sm" variant="outline" onClick={() => refetch()} className="mt-2">
                                <RefreshCcw className="h-3 w-3 mr-1" />
                                Retry
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Template Management */}
                <div className="space-y-3">
                    <Label>Subject Line Templates</Label>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsTemplateModalOpen(true)}
                        className="w-fit"
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Templates
                    </Button>
                </div>

                {/* Template Selection */}
                {templatesLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading templates...
                    </div>
                ) : enabledTemplates.length > 0 ? (
                    <div className="space-y-4">
                        {/* Subject Line Template Dropdown */}
                        <div className="space-y-2">
                            <Label>Subject Line Template</Label>
                            <Select
                                value={selectedSubjectTemplate}
                                onValueChange={handleSubjectTemplateChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a subject line template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {enabledTemplates.map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{template.name}</span>
                                                <span 
                                                    className="text-xs text-muted-foreground"
                                                    dangerouslySetInnerHTML={{ __html: template.content }}
                                                />
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Address Format Dropdown - Only show if template requires address */}
                        {templateRequiresAddress && (
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
                                <p className="text-xs text-muted-foreground">
                                    Required because the selected template contains an {'{address}'} variable
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            No enabled templates found. Click "Manage Templates" to create your first subject line template.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Rich Text Subject Line Editor */}
                <div className="space-y-2">
                    <Label>Customize Subject Line</Label>
                    <EmojiTextEditor
                        ref={EmojiTextEditorRef}
                        value={generatedSubject}
                        onChange={handleSubjectEdit}
                        placeholder="Enter your custom subject line or select templates above to auto-generate..."
                        maxLength={150}
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
                {selectedSubjectTemplate && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                        {templateRequiresAddress ? (
                            selectedAddressTemplate ? (
                                <>
                                    <p>💡 Template with address format selected! Your subject line has been auto-generated above.</p>
                                    <p>You can further customize it using the rich text editor.</p>
                                </>
                            ) : (
                                <p>⏳ Please select an address format to complete the template generation.</p>
                            )
                        ) : (
                            <>
                                <p>💡 Template selected! Your subject line has been auto-generated above.</p>
                                <p>You can further customize it using the rich text editor.</p>
                            </>
                        )}
                    </div>
                )}

                {/* Template Management Modal */}
                <TemplateManagementModal 
                    open={isTemplateModalOpen}
                    onOpenChange={setIsTemplateModalOpen}
                />
            </CardContent>
        </Card>
    );
}