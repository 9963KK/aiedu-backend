import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  variant: "primary" | "accent" | "success";
  onExplore: () => void;
}

const variantStyles = {
  primary: "border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/5 to-transparent",
  accent: "border-accent/20 hover:border-accent/40 bg-gradient-to-br from-accent/5 to-transparent",
  success: "border-success/20 hover:border-success/40 bg-gradient-to-br from-success/5 to-transparent",
};

const iconStyles = {
  primary: "text-primary bg-primary/10",
  accent: "text-accent bg-accent/10",
  success: "text-success bg-success/10",
};

export function FeatureCard({ icon: Icon, title, description, features, variant, onExplore }: FeatureCardProps) {
  return (
    <Card className={`group overflow-hidden ${variantStyles[variant]}`}>
      <CardHeader className="space-y-4">
        <div className={`w-14 h-14 rounded-xl ${iconStyles[variant]} flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <CardTitle className="text-xl mb-2">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-1">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button 
          onClick={onExplore}
          className="w-full"
          variant="outline"
        >
          开始使用
        </Button>
      </CardContent>
    </Card>
  );
}
