
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
};

type LogSettingsProps = {
  settings: LogSettingsType;
  onChange: (settings: LogSettingsType) => void;
};

export default function LogSettings({ settings, onChange }: LogSettingsProps) {
  const handleChange = (key: keyof LogSettingsType, checked: boolean) => {
    onChange({ ...settings, [key]: checked });
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
            </AccordionContent>
        </AccordionItem>
    </Accordion>
  );
}
