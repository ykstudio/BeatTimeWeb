
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SlidersHorizontal } from "lucide-react";

export type LogSettingsType = {
  metronome: boolean;
  onsets: boolean;
  hits: boolean;
  velocity: boolean;
  beats: boolean;
  measures: boolean;
  timingQuality: boolean;
  songGrid: boolean;
  performanceMode: boolean;  // When true, disables heavy visualizations
};

type LogSettingsProps = {
  settings: LogSettingsType;
  onChange: (settings: LogSettingsType) => void;
};

export default function LogSettings({ settings, onChange }: LogSettingsProps) {
  const handleChange = (key: keyof LogSettingsType, checked: boolean) => {
    onChange({ ...settings, [key]: checked });
  };

  const allChecked = Object.values(settings).every(Boolean);
  const someChecked = Object.values(settings).some(Boolean);

  const handleMarkAll = (checked: boolean) => {
    const newSettings = Object.keys(settings).reduce((acc, key) => {
      acc[key as keyof LogSettingsType] = checked;
      return acc;
    }, {} as LogSettingsType);
    onChange(newSettings);
  };

  return (
    <Accordion type="single" collapsible className="w-full max-w-md mt-4">
        <AccordionItem value="log-settings" className="border rounded-lg px-4">
            <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4"/>
                    <span className="font-semibold">Log Settings</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 pt-4">
                <div className="flex items-center space-x-2 pb-2 mb-2 border-b">
                    <Checkbox
                        id="performance-mode"
                        checked={settings.performanceMode}
                        onCheckedChange={(checked) => handleChange("performanceMode", !!checked)}
                    />
                    <Label htmlFor="performance-mode" className="font-medium cursor-pointer text-green-600">
                        Performance Mode (Recommended)
                    </Label>
                </div>
                <div className="flex items-center space-x-2 pb-2 border-b">
                    <Checkbox
                        id="log-mark-all"
                        checked={allChecked}
                        onCheckedChange={(checked) => handleMarkAll(!!checked)}
                    />
                    <Label htmlFor="log-mark-all" className="font-medium cursor-pointer">
                        Mark All Debug Logs
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="log-metronome"
                        checked={settings.metronome}
                        onCheckedChange={(checked) => handleChange("metronome", !!checked)}
                    />
                    <Label htmlFor="log-metronome" className="font-normal cursor-pointer">
                        Log Metronome Beats
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="log-onsets"
                        checked={settings.onsets}
                        onCheckedChange={(checked) => handleChange("onsets", !!checked)}
                    />
                    <Label htmlFor="log-onsets" className="font-normal cursor-pointer">
                        Log Audio Onsets
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="log-velocity"
                        checked={settings.velocity}
                        onCheckedChange={(checked) => handleChange("velocity", !!checked)}
                    />
                    <Label htmlFor="log-velocity" className="font-normal cursor-pointer">
                        Log Audio Input Velocity
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="log-hits"
                        checked={settings.hits}
                        onCheckedChange={(checked) => handleChange("hits", !!checked)}
                    />
                    <Label htmlFor="log-hits" className="font-normal cursor-pointer">
                        Log Hit/Miss Detection
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="log-beats"
                        checked={settings.beats}
                        onCheckedChange={(checked) => handleChange("beats", !!checked)}
                    />
                    <Label htmlFor="log-beats" className="font-normal cursor-pointer">
                        Log Beat Detection
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="log-measures"
                        checked={settings.measures}
                        onCheckedChange={(checked) => handleChange("measures", !!checked)}
                    />
                    <Label htmlFor="log-measures" className="font-normal cursor-pointer">
                        Log Measure Completion
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="log-timing-quality"
                        checked={settings.timingQuality}
                        onCheckedChange={(checked) => handleChange("timingQuality", !!checked)}
                    />
                    <Label htmlFor="log-timing-quality" className="font-normal cursor-pointer">
                        Log Timing Quality Scores
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="log-song-grid"
                        checked={settings.songGrid}
                        onCheckedChange={(checked) => handleChange("songGrid", !!checked)}
                    />
                    <Label htmlFor="log-song-grid" className="font-normal cursor-pointer">
                        Log Song Grid Updates
                    </Label>
                </div>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
  );
}
