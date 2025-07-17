'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Mail, Eye, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PropertyActionMenuProps {
  property: any;
}

export function PropertyActionMenu({ property }: PropertyActionMenuProps) {
  const router = useRouter();

  const handleRunCampaign = () => {
    router.push(`/dashboard/landivo/run/${property.id}`);
  };

  const handleViewProperty = () => {
    // Navigate to property details or open in new tab
    window.open(`/properties/${property.id}`, '_blank');
  };

  const handleEditProperty = () => {
    // Navigate to property edit page
    router.push(`/properties/edit/${property.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleRunCampaign}>
          <Mail className="mr-2 h-4 w-4" />
          Run Campaign
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewProperty}>
          <Eye className="mr-2 h-4 w-4" />
          View Property
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEditProperty}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Property
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}