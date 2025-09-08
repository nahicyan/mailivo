// app/src/app/dashboard/landivo/campaigns/create-multi/components/StepAgentProfile.tsx
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, AlertCircle, Loader2, RefreshCcw, Phone, Mail } from 'lucide-react';
import { hasAgentProfileComponents } from '@landivo/email-template';

interface AgentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  profileRole: string;
  avatarUrl: string | null;
}

interface Props {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  errors: Record<string, string>;
  selectedTemplate?: any;
}

// Fetch agent profiles from API
const fetchAgentProfiles = async (): Promise<AgentProfile[]> => {
  const response = await fetch('https://api.landivo.com/user/public-profiles');
  if (!response.ok) {
    throw new Error('Failed to fetch agent profiles');
  }
  const data = await response.json();
  return data.profiles || [];
};

export function StepAgentProfile({ formData, setFormData, errors, selectedTemplate }: Props) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(formData.selectedAgent || '');

  // Check if selected template has agent profile components
  const templateHasAgentProfile = selectedTemplate ? hasAgentProfileComponents(selectedTemplate) : false;

  // Fetch agent profiles
  const { 
    data: profiles = [], 
    isLoading: profilesLoading, 
    error: profilesError,
    refetch 
  } = useQuery({
    queryKey: ['agentProfiles'],
    queryFn: fetchAgentProfiles,
    enabled: templateHasAgentProfile, // Only fetch if template needs it
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Update form data when agent is selected
  useEffect(() => {
    if (selectedAgentId) {
      setFormData(prev => ({
        ...prev,
        selectedAgent: selectedAgentId
      }));
    }
  }, [selectedAgentId, setFormData]);

  // If template doesn't have agent profile components, don't show this step
  if (!templateHasAgentProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Agent Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Agent Profile Required
            </h3>
            <p className="text-gray-500">
              The selected template doesn't contain any agent profile components.
              You can skip this step.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (profilesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Agent Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading agent profiles...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (profilesError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Agent Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Unable to load agent profiles. Please try again.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()}
                  className="mt-2"
                >
                  <RefreshCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const selectedAgent = profiles.find(agent => agent.id === selectedAgentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Select Agent Profile</span>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Choose which agent's contact information will appear in the email.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Display */}
        {errors.selectedAgent && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.selectedAgent}</AlertDescription>
          </Alert>
        )}

        {/* Agent Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Available Agents</Label>
          
          {profiles.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No agent profiles found. Please contact your administrator to set up agent profiles.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {profiles.map((agent) => (
                <div
                  key={agent.id}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedAgentId === agent.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAgentId(agent.id)}
                >
                  {selectedAgentId === agent.id && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="bg-blue-600">
                        Selected
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      {agent.avatarUrl ? (
                        <img
                          src={`https://api.landivo.com/${agent.avatarUrl}`}
                          alt={`${agent.firstName} ${agent.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {agent.firstName} {agent.lastName}
                      </h3>
                      
                      {agent.profileRole && (
                        <p className="text-sm text-gray-500 mb-2">
                          {agent.profileRole}
                        </p>
                      )}

                      <div className="space-y-1">
                        {agent.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-3 h-3 mr-1" />
                            <span className="truncate">{agent.phone}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-3 h-3 mr-1" />
                          <span className="truncate">{agent.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Agent Preview */}
        {selectedAgent && (
          <div className="border-t pt-6">
            <Label className="text-base font-medium mb-3 block">Selected Agent Preview</Label>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                  {selectedAgent.avatarUrl ? (
                    <img
                      src={`https://api.landivo.com/${selectedAgent.avatarUrl}`}
                      alt={`${selectedAgent.firstName} ${selectedAgent.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">
                    Contact {selectedAgent.firstName} {selectedAgent.lastName}
                  </h4>
                  {selectedAgent.profileRole && (
                    <p className="text-sm text-gray-600 italic">
                      {selectedAgent.profileRole}
                    </p>
                  )}
                  {selectedAgent.phone && (
                    <p className="text-sm text-blue-600 font-medium">
                      {selectedAgent.phone}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    {selectedAgent.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}