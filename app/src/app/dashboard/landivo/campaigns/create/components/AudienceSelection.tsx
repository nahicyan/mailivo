// app/src/app/dashboard/landivo/campaigns/create/components/Step3Audience.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, FileText } from 'lucide-react';

interface Props {
    formData: any;
    setFormData: (fn: (prev: any) => any) => void;
    errors: Record<string, string>;
    emailLists: any[];
    listsLoading: boolean;
    listsError: any;
    refetchLists: () => void;
    templates: any[];
    templatesLoading: boolean;
    templatesError: any;
}

export function AudienceSelection({ formData, setFormData, errors, emailLists, listsLoading, listsError, refetchLists, templates, templatesLoading, templatesError }: Props) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>Target Audience</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email List *</Label>
                        <Select
                            value={formData.emailList}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, emailList: value }))}
                            disabled={listsLoading || !!listsError}
                        >
                            <SelectTrigger className={errors.emailList ? 'border-red-500' : ''}>
                                <SelectValue placeholder={
                                    listsLoading ? "Loading email lists..." :
                                    listsError ? "Error loading email lists - Click to retry" :
                                    !emailLists || emailLists.length === 0 ? "No email lists found" :
                                    "Select email list"
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {emailLists && emailLists.length > 0 ? (
                                    emailLists.map((list) => (
                                        <SelectItem key={list.id} value={list.id}>
                                            <div className="flex justify-between items-center w-full">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{list.name}</span>
                                                    <span className="text-xs text-gray-500">{list.description}</span>
                                                </div>
                                                <Badge variant="secondary" className="ml-2">
                                                    {list.totalContacts} contacts
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem disabled value="no-lists">
                                        No email lists available
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {errors.emailList && <p className="text-sm text-red-600">{errors.emailList}</p>}
                        {listsError && (
                            <Button variant="outline" size="sm" onClick={() => refetchLists()} className="mt-2">
                                Retry Loading Lists
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Email Template</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Template *</Label>
                        <Select
                            value={formData.emailTemplate}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, emailTemplate: value }))}
                            disabled={templatesLoading || !!templatesError}
                        >
                            <SelectTrigger className={errors.emailTemplate ? 'border-red-500' : ''}>
                                <SelectValue placeholder={
                                    templatesLoading ? "Loading templates..." :
                                    templatesError ? "Error loading templates" :
                                    "Select email template"
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {templates?.map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                        <div className="flex flex-col w-full">
                                            <span className="font-medium">{template.name}</span>
                                            <div className="flex space-x-2 text-xs">
                                                <Badge variant="outline">{template.components?.length || 0} components</Badge>
                                                <Badge variant="secondary">{template.category}</Badge>
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.emailTemplate && <p className="text-sm text-red-600">{errors.emailTemplate}</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}