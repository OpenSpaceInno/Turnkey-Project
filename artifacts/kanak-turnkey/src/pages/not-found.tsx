import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft, Briefcase } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [location] = useLocation();

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border/60">
        <CardContent className="pt-6 pb-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">404 - Page Not Found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The page you are looking for doesn't exist or may have been moved.
            </p>
            {location && (
              <p className="mt-1 text-xs font-mono bg-muted/60 py-1 px-2 rounded inline-block text-muted-foreground border">
                {location}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => window.history.back()} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Go Back
            </Button>
            <Link href="/projects">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Briefcase className="w-4 h-4" /> Projects
              </Button>
            </Link>
            <Link href="/">
              <Button size="sm" className="gap-1.5">
                <Home className="w-4 h-4" /> Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
