// app/src/app/dashboard/automations/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Play, Pause, Copy, Trash2, Edit, MoreVertical, TrendingUp, Calendar, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Automation } from '@/types/mailivo-automation';

export default function AutomationsPage() {
  const router = useRouter();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterActive !== null) {
        params.append('isActive', String(filterActive));
      }

      const response = await fetch(`/api/mailivo-automations?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setAutomations(data.data);
      }
    } catch (error) {
      console.error('Failed to load automations:', error);
      toast.error('Failed to load automations');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (automationId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/mailivo-automations/${automationId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to toggle automation');
      }

      toast.success(`Automation ${isActive ? 'activated' : 'deactivated'}`);
      loadAutomations();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDuplicate = async (automationId: string) => {
    try {
      const response = await fetch(`/api/mailivo-automations/${automationId}/duplicate`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate automation');
      }

      toast.success('Automation duplicated');
      loadAutomations();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (automationId: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/mailivo-automations/${automationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete automation');
      }

      toast.success('Automation deleted');
      loadAutomations();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredAutomations = automations.filter(automation =>
    automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    automation.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      property_uploaded: 'Property Upload',
      time_based: 'Time Based',
      property_viewed: 'Property View',
      property_updated: 'Property Update',
      campaign_status_changed: 'Campaign Status',
      email_tracking_status: 'Email Tracking',
      unsubscribe: 'Unsubscribe'
    };
    return labels[type] || type;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500' : 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Loading automations...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automations</h1>
          <p className="text-muted-foreground">
            Automate campaign creation with triggers and conditions
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/automations/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Automations</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Automations</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automations.filter(a => a.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automations.reduce((sum, a) => sum + (a.stats?.totalRuns || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search automations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        
        <div className="flex space-x-2">
          <Button
            variant={filterActive === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterActive(null)}
          >
            All
          </Button>
          <Button
            variant={filterActive === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterActive(true)}
          >
            Active
          </Button>
          <Button
            variant={filterActive === false ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterActive(false)}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Automations Table */}
      {filteredAutomations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No automations found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search' : 'Create your first automation to get started'}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={() => router.push('/dashboard/automations/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Automation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAutomations.map((automation) => (
                <TableRow key={automation.id}>
                  <TableCell>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(automation.isActive)}`} />
                  </TableCell>

                  <TableCell>
                    <div>
                      <div className="font-medium">{automation.name}</div>
                      {automation.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {automation.description}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">
                      {getTriggerLabel(automation.trigger.type)}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {automation.conditions.length > 0 ? (
                        automation.conditions.map((cond, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {cond.category.replace('_', ' ')}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Runs:</span>
                        <span className="font-medium">{automation.stats?.totalRuns || 0}</span>
                      </div>
                      {automation.stats && automation.stats.totalRuns > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">Success:</span>
                          <span className="font-medium text-green-600">
                            {automation.stats.successfulRuns}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {automation.lastRunAt 
                        ? new Date(automation.lastRunAt).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/automations/${automation.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleToggle(automation.id, !automation.isActive)}
                        >
                          {automation.isActive ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleDuplicate(automation.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleDelete(automation.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}