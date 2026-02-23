/**
 * Dashboard Page
 * 
 * Main dashboard for authenticated users
 * Protected by ProtectedRoute - requires authentication and email verification
 */

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">FlowMCP Dashboard</h1>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-center">
                Welcome to FlowMCP!
              </CardTitle>
              <CardDescription className="text-center">
                Your authentication is set up successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Task 1.1 Complete (10%)</p>
                  <p className="text-sm text-muted-foreground">
                    Authentication system with email verification is now ready:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>Email/password signup with disposable email blocking</li>
                    <li>Google OAuth integration</li>
                    <li>Email verification requirement</li>
                    <li>Terms of Service and Acceptable Use agreements</li>
                    <li>Protected route system</li>
                  </ul>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Next: Implement Task 1.2 (Database Schema)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
