import { Button } from "./ui/button";
import { Navigation, Fuel, AlertTriangle, Cloud, Wrench } from "lucide-react";

interface QuickActionsProps {
  onActionClick: (action: string) => void;
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const actions = [
    { icon: Navigation, label: "Navigation", query: "Help me find the nearest gas station" },
    { icon: Fuel, label: "Fuel", query: "Where can I find cheap gas nearby?" },
    { icon: AlertTriangle, label: "Emergency", query: "What should I do in case of a car breakdown?" },
    { icon: Cloud, label: "Weather", query: "What's the weather like on my route?" },
    { icon: Wrench, label: "Maintenance", query: "When is my next maintenance due?" },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600 px-1">Quick Actions</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={() => onActionClick(action.query)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
