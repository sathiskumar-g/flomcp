import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, BookOpen } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/10 flex flex-col">
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Logo height={32} />
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-8xl font-bold text-primary/20 mb-4">404</p>
          <h1 className="text-3xl font-bold mb-4">Page not found</h1>
          <p className="text-muted-foreground mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button size="lg">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/docs/getting-started">
              <Button variant="ghost" size="lg">
                <BookOpen className="mr-2 h-4 w-4" />
                Docs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
