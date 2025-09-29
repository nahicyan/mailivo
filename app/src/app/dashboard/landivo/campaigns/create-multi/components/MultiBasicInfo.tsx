// app/src/app/dashboard/landivo/campaigns/create/components/Step2BasicInfo.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';

interface Props {
    formData: any;
    setFormData: (fn: (prev: any) => any) => void;
    errors: Record<string, string>;
}
const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
};

export function MultiBasicInfo({ formData, setFormData, errors }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Campaign Information</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input
                        id="name"
                        value={stripHtml(formData.name)}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., New Manhattan Listings - January 2025"
                        className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Campaign Description *</Label>
                    <Textarea
                        id="description"
                        value={stripHtml(formData.description)}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the purpose and goals of this campaign..."
                        rows={4}
                        className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                </div>
            </CardContent>
        </Card>
    );
}