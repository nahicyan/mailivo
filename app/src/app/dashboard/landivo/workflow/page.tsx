'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';

// Import the updated WorkflowBuilder components
import WorkflowBuilder from '@/components/automations/WorkflowBuilder';

function WorkflowBuilderWrapper() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('id') || undefined;

  return <WorkflowBuilder workflowId={workflowId} />;
}

export default function LandivoWorkflowPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <Skeleton className="h-8 w-64" />
            </div>
          </div>
          <div className="max-w-7xl mx-auto">
            <div className="flex h-[calc(100vh-200px)]">
              <div className="w-80 bg-white border-r border-gray-200 p-4">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="flex-1 bg-white">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="w-80 bg-white border-l border-gray-200 p-4">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      }>
        <WorkflowBuilderWrapper />
      </Suspense>
    </DashboardLayout>
  );
}