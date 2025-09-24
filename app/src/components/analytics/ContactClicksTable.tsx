
// app/src/components/analytics/ContactClicksTable.tsx
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ContactClick } from '@/types/analytics';

interface ContactClicksTableProps {
  contacts: ContactClick[];
  onContactClick: (contact: ContactClick) => void;
}

export function ContactClicksTable({ contacts, onContactClick }: ContactClicksTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredContacts = contacts.filter(contact =>
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Total Clicks</TableHead>
            <TableHead>Unique Links</TableHead>
            <TableHead>First Click</TableHead>
            <TableHead>Last Click</TableHead>
            <TableHead>Engagement</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredContacts.map((contact) => (
            <TableRow key={contact.contactId}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {contact.firstName && contact.lastName 
                      ? `${contact.firstName} ${contact.lastName}` 
                      : 'Unknown Name'}
                  </div>
                  <div className="text-sm text-muted-foreground">{contact.email}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{contact.totalClicks}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{contact.uniqueLinks}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(contact.firstClick)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(contact.lastClick)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(contact.engagementScore * 10, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {contact.engagementScore.toFixed(1)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onContactClick(contact)}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filteredContacts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'No contacts found matching your search.' : 'No contacts have clicked in this campaign yet.'}
        </div>
      )}
    </div>
  );
}