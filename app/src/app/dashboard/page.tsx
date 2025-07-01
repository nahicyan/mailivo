// ===== 1. Dashboard Page =====

// app/src/app/dashboard/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Mail, 
  Users, 
  TrendingUp, 
  Send,
  UserPlus,
  FileText,
  Zap,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const stats = [
  { name: 'Total Campaigns', value: '0', icon: Mail, color: 'text-blue-600' },
  { name: 'Total Contacts', value: '0', icon: Users, color: 'text-green-600' },
  { name: 'Emails Sent', value: '0', icon: Send, color: 'text-purple-600' },
  { name: 'Avg. Open Rate', value: '0%', icon: TrendingUp, color: 'text-orange-600' },
];

const quickActions = [
  {
    title: 'Create Campaign',
    description: 'Start a new email campaign',
    icon: Mail,
    href: '/dashboard/campaigns/create',
    color: 'bg-blue-500',
  },
  {
    title: 'Import Contacts',
    description: 'Add contacts to your list',
    icon: UserPlus,
    href: '/dashboard/contacts/import',
    color: 'bg-green-500',
  },
  {
    title: 'Email Templates',
    description: 'Browse and create templates',
    icon: FileText,
    href: '/dashboard/campaigns/templates',
    color: 'bg-purple-500',
  },
  {
    title: 'Connect Landivo',
    description: 'Sync your property data',
    icon: Zap,
    href: '/dashboard/landivo',
    color: 'bg-orange-500',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.company.name}
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your email campaigns today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  Get started to see metrics
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="p-0 h-auto">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started with Mailivo</CardTitle>
          <CardDescription>
            Follow these steps to set up your email marketing platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Configure Email Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Set up your SMTP or SendGrid credentials to start sending emails
                </p>
                <Link href="/dashboard/settings/email">
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Configure Settings →
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Import Your Contacts</h4>
                <p className="text-sm text-muted-foreground">
                  Upload your contact list via CSV or connect with Landivo
                </p>
                <Link href="/dashboard/contacts/import">
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Import Contacts →
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Create Your First Campaign</h4>
                <p className="text-sm text-muted-foreground">
                  Design and send your first email campaign to engage your audience
                </p>
                <Link href="/dashboard/campaigns/create">
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Create Campaign →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
