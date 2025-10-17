// app/src/app/dashboard/settings/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Lock, Bell, CreditCard, Shield, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Disabled Notice */}
      <Alert variant="destructive" className="border-2">
        <AlertTriangle className="h-5 w-5" />
        <AlertDescription className="text-lg font-semibold">Settings Are Currently Disabled</AlertDescription>
      </Alert>

      {/* Account Settings */}
      <Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <CardTitle>Account Settings</CardTitle>
          </div>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input disabled placeholder="Your Company" />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input disabled type="email" placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input disabled placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          <Button disabled>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Configuration</CardTitle>
          </div>
          <CardDescription>Configure your email sending settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input disabled placeholder="mail.yourdomain.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SMTP Port</Label>
                <Input disabled placeholder="587" />
              </div>
              <div className="space-y-2">
                <Label>Encryption</Label>
                <Input disabled placeholder="TLS" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>From Email</Label>
              <Input disabled placeholder="noreply@yourdomain.com" />
            </div>
          </div>
          <Button disabled>Test Connection</Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Manage your security preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input disabled type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input disabled type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input disabled type="password" placeholder="••••••••" />
          </div>
          <Button disabled>Update Password</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>Choose what notifications you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Campaign Updates</p>
                <p className="text-sm text-muted-foreground">Get notified about campaign performance</p>
              </div>
              <input type="checkbox" disabled checked className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Delivery Alerts</p>
                <p className="text-sm text-muted-foreground">Alerts for delivery issues</p>
              </div>
              <input type="checkbox" disabled className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Reports</p>
                <p className="text-sm text-muted-foreground">Receive weekly analytics summary</p>
              </div>
              <input type="checkbox" disabled checked className="h-4 w-4" />
            </div>
          </div>
          <Button disabled>Save Preferences</Button>
        </CardContent>
      </Card>

      {/* Billing */}
      {/*<Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Billing & Subscription</CardTitle>ff
          </div>
          <CardDescription>Manage your billing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Current Plan</Label>
              <Input disabled value="Professional - $99/month" readOnly />
            </div>
            <div className="space-y-2">
              <Label>Next Billing Date</Label>
              <Input disabled value="November 17, 2025" readOnly />
            </div>
          </div>
          <div className="flex gap-2">
            <Button disabled>Upgrade Plan</Button>
            <Button disabled variant="outline">View Invoices</Button>
          </div>
        </CardContent>
      </Card>
 */}
      {/* API Keys */}
      <Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <CardTitle>API Keys</CardTitle>
          </div>
          <CardDescription>Manage your API access keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Landivo API Key</Label>
            <Input disabled type="password" value="••••••••••••••••" readOnly />
          </div>
          <div className="space-y-2">
            <Label>Mailcow API Key</Label>
            <Input disabled type="password" value="••••••••••••••••" readOnly />
          </div>
          <Button disabled>Generate New Key</Button>
        </CardContent>
      </Card>
    </div>
  );
}
