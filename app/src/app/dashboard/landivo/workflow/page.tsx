'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import WorkflowBuilder from '@/components/automations/WorkflowBuilder';

export default function WorkflowBuilderPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        <WorkflowBuilder />
      </div>
    </DashboardLayout>
  );
}