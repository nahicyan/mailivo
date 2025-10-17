// app/src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Mail, Users, TrendingUp, Send, UserPlus, FileText, Zap, ArrowRight, MousePointer, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { formatNumber } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Campaign {
  _id: string;
  name: string;
  status: string;
  metrics?: {
    sent?: number;
    totalClicks?: number;
    clicked?: number;
    opened?: number;
    delivered?: number;
  };
}

const quickActions = [
  {
    title: "Create Campaign",
    description: "Start a new email campaign",
    icon: Mail,
    href: "/dashboard/landivo/campaigns/manage",
    color: "bg-blue-500",
  },
  {
    title: "Create Automation",
    description: "Automate Your Email Campaigns",
    icon: Zap,
    href: "dashboard/automations/create",
    color: "bg-orange-500",
  },
  {
    title: "Email Templates",
    description: "Browse and create templates",
    icon: FileText,
    href: "/dashboard/landivo/campaigns/templates",
    color: "bg-purple-500",
  },
  {
    title: "Import Contacts",
    description: "Add contacts to your list",
    icon: UserPlus,
    href: "/dashboard/contacts/import",
    color: "bg-green-500",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats (same logic as manage page)
  const totalSent = campaigns.reduce((sum, c) => sum + (c.metrics?.sent || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.metrics?.totalClicks || 0), 0);
  const uniqueClickers = campaigns.reduce((sum, c) => sum + (c.metrics?.clicked || 0), 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.metrics?.opened || 0), 0);
  const totalDelivered = campaigns.reduce((sum, c) => sum + (c.metrics?.delivered || 0), 0);

  const avgClickRate = totalSent > 0 ? ((uniqueClickers / totalSent) * 100).toFixed(1) : "0";
  const avgOpenRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : "0";

  const stats = [
    {
      name: "Total Campaigns",
      value: loading ? "..." : campaigns.length.toString(),
      icon: Mail,
      color: "text-blue-600",
    },
    {
      name: "Unique Clickers",
      value: loading ? "..." : formatNumber(uniqueClickers),
      icon: MousePointer,
      color: "text-green-600",
    },
    {
      name: "Emails Sent",
      value: loading ? "..." : formatNumber(totalSent),
      icon: Send,
      color: "text-purple-600",
    },
    {
      name: "Avg. Click Rate",
      value: loading ? "..." : `${avgClickRate}%`,
      icon: TrendingUp,
      color: "text-orange-600",
      subtitle: `Open Rate: ${avgOpenRate}%`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.company.name}</h1>
        <p className="text-muted-foreground mt-2">Here's what's happening with your email campaigns today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.subtitle || (campaigns.length === 0 && !loading ? "Get started to see metrics" : "")}</p>
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
          <CardDescription>Follow these steps to set up your email marketing platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">1</div>
              <div>
                <h4 className="font-medium">Configure Email Settings</h4>
                <p className="text-sm text-muted-foreground">Set up your SMTP or SendGrid credentials to start sending emails</p>
                <Link href="/dashboard/settings/">
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Configure Settings →
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">2</div>
              <div>
                <h4 className="font-medium">Import Your Contacts</h4>
                <p className="text-sm text-muted-foreground">Upload your contact list via CSV or connect with Landivo</p>
                <Link href="/dashboard/contacts/import">
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Import Contacts →
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">3</div>
              <div>
                <h4 className="font-medium">Create Your First Campaign</h4>
                <p className="text-sm text-muted-foreground">Design and send your first email campaign to engage your audience</p>
                <Link href="/dashboard/landivo/campaigns/manage">
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
