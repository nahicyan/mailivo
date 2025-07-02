// app/src/app/dashboard/contacts/import/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { contactService } from '@/services/contact.service';
import { Upload, Download } from 'lucide-react';

export default function ImportContactsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await contactService.importContacts(formData);
      alert('Contacts imported successfully!');
      setFile(null);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check your file format.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Contacts</h1>
        <p className="text-muted-foreground">
          Upload a CSV file to add contacts to your list
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file">Choose CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {file && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm">Selected: {file.name}</p>
              <p className="text-xs text-muted-foreground">
                Size: {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button 
              onClick={handleImport} 
              disabled={!file || importing}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {importing ? 'Importing...' : 'Import Contacts'}
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Sample CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSV Format Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Required columns:</strong> email</p>
            <p><strong>Optional columns:</strong> first_name, last_name, phone, segments</p>
            <p><strong>Example:</strong></p>
            <code className="block bg-muted p-2 rounded text-xs">
              email,first_name,last_name,segments<br/>
              john@example.com,John,Doe,"buyers,manhattan"<br/>
              jane@example.com,Jane,Smith,"sellers"
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}