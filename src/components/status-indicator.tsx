"use client";

import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, LoaderCircle, AlertCircle, Music, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = 'idle' | 'requesting' | 'listening' | 'denied' | 'error' | 'stopped';

type StatusIndicatorProps = {
  status: Status;
};

export default function StatusIndicator({ status }: StatusIndicatorProps) {
  const statusConfig = {
    idle: {
      text: "Ready to Practice",
      icon: <Music className="h-4 w-4" />,
      variant: "secondary" as const,
    },
    requesting: {
      text: "Requesting Permissions",
      icon: <LoaderCircle className="h-4 w-4 animate-spin" />,
      variant: "secondary" as const,
    },
    listening: {
      text: "Listening...",
      icon: <Mic className="h-4 w-4" />,
      variant: "default" as const,
    },
    denied: {
      text: "Permission Denied",
      icon: <MicOff className="h-4 w-4" />,
      variant: "destructive" as const,
    },
    error: {
      text: "An Error Occurred",
      icon: <AlertCircle className="h-4 w-4" />,
      variant: "destructive" as const,
    },
    stopped: {
      text: "Practice Stopped",
      icon: <Square className="h-4 w-4" />,
      variant: "secondary" as const,
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <Badge variant={currentStatus.variant} className={cn("flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all")}>
      {currentStatus.icon}
      <span>{currentStatus.text}</span>
    </Badge>
  );
}
