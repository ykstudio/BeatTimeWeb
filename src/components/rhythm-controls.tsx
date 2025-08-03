"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Settings } from "lucide-react";

export type RhythmControlsType = {
  // Hit/Miss contributions
  hitContribution: number;        // 0 to 100%
  missContribution: number;       // 0 to 100%
  
  // Timing window in milliseconds
  timingWindowMs: number;         // 50 to 500 ms
  
  // Timing window and accuracy
  timingWindow: number;           // 0.1 to 0.5 seconds (derived from timingWindowMs)
  onsetThreshold: number;         // 0.5 to 5
  
  // Streak bonuses
  streak2Bonus: number;           // 0 to 30 points
  streak3Bonus: number;           // 0 to 30 points
  streak5Bonus: number;           // 0 to 50 points
  
  // Color thresholds
  greenThreshold: number;         // 50 to 90%
  yellowThreshold: number;        // 30 to 70%
  orangeThreshold: number;        // 10 to 50%
  
  // Default measure accuracy
  emptyMeasureMin: number;        // 0 to 50%
  emptyMeasureMax: number;        // 20 to 60%
};

type RhythmControlsProps = {
  controls: RhythmControlsType;
  onChange: (controls: RhythmControlsType) => void;
};

export default function RhythmControls({ controls, onChange }: RhythmControlsProps) {
  const handleChange = (key: keyof RhythmControlsType, value: number) => {
    const newControls = { ...controls, [key]: value };
    
    // Sync timingWindow with timingWindowMs
    if (key === 'timingWindowMs') {
      newControls.timingWindow = value / 1000; // Convert ms to seconds
    } else if (key === 'timingWindow') {
      newControls.timingWindowMs = value * 1000; // Convert seconds to ms
    }
    
    onChange(newControls);
  };

  return (
    <Accordion type="single" collapsible className="w-full max-w-2xl mt-4">
      <AccordionItem value="rhythm-controls" className="border rounded-lg px-4">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4"/>
            <span className="font-semibold">Rhythm Feedback Controls</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-6 pt-4">
          
          {/* Timing Window */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">HIT DETECTION WINDOW</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <Label className="text-sm">Timing Window</Label>
                  <span className="text-xs text-muted-foreground">How late/early a hit can be detected</span>
                </div>
                <span className="text-xs text-muted-foreground">±{controls.timingWindowMs}ms</span>
              </div>
              <Slider
                value={[controls.timingWindowMs]}
                onValueChange={(value) => handleChange("timingWindowMs", value[0])}
                min={50}
                max={500}
                step={10}
                className="w-full"
              />
            </div>
          </div>

          {/* Hit/Miss Contributions */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">HIT/MISS CONTRIBUTIONS</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <Label className="text-sm">Hit Contribution</Label>
                  <span className="text-xs text-muted-foreground">Score for each successful hit</span>
                </div>
                <span className="text-xs text-muted-foreground">{controls.hitContribution}%</span>
              </div>
              <Slider
                value={[controls.hitContribution]}
                onValueChange={(value) => handleChange("hitContribution", value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <Label className="text-sm">Miss Contribution</Label>
                  <span className="text-xs text-muted-foreground">Score for each missed beat</span>
                </div>
                <span className="text-xs text-muted-foreground">{controls.missContribution}%</span>
              </div>
              <Slider
                value={[controls.missContribution]}
                onValueChange={(value) => handleChange("missContribution", value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Timing & Detection */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">TIMING & DETECTION</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <Label className="text-sm">Onset Threshold</Label>
                  <span className="text-xs text-muted-foreground">Audio level needed to detect a hit</span>
                </div>
                <span className="text-xs font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">{controls.onsetThreshold.toFixed(1)}</span>
              </div>
              <Slider
                value={[controls.onsetThreshold]}
                onValueChange={(value) => handleChange("onsetThreshold", value[0])}
                min={0.5}
                max={20}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          {/* Streak Bonuses */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">STREAK BONUSES</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <Label className="text-sm">Streak 2+ Bonus</Label>
                  <span className="text-xs text-muted-foreground">Extra points for 2+ consecutive hits</span>
                </div>
                <span className="text-xs text-muted-foreground">+{controls.streak2Bonus}%</span>
              </div>
              <Slider
                value={[controls.streak2Bonus]}
                onValueChange={(value) => handleChange("streak2Bonus", value[0])}
                min={0}
                max={30}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <Label className="text-sm">Streak 3+ Bonus</Label>
                  <span className="text-xs text-muted-foreground">Extra points for 3+ consecutive hits</span>
                </div>
                <span className="text-xs text-muted-foreground">+{controls.streak3Bonus}%</span>
              </div>
              <Slider
                value={[controls.streak3Bonus]}
                onValueChange={(value) => handleChange("streak3Bonus", value[0])}
                min={0}
                max={30}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <Label className="text-sm">Streak 5+ Bonus</Label>
                  <span className="text-xs text-muted-foreground">Extra points for 5+ consecutive hits</span>
                </div>
                <span className="text-xs text-muted-foreground">+{controls.streak5Bonus}%</span>
              </div>
              <Slider
                value={[controls.streak5Bonus]}
                onValueChange={(value) => handleChange("streak5Bonus", value[0])}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Color Thresholds */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">COLOR THRESHOLDS</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <Label className="text-sm">🟢 Green Threshold</Label>
                  <span className="text-xs text-muted-foreground">Minimum score for excellent performance</span>
                </div>
                <span className="text-xs text-muted-foreground">{controls.greenThreshold}%+</span>
              </div>
              <Slider
                value={[controls.greenThreshold]}
                onValueChange={(value) => handleChange("greenThreshold", value[0])}
                min={50}
                max={90}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <Label className="text-sm">🟡 Yellow Threshold</Label>
                  <span className="text-xs text-muted-foreground">Minimum score for good performance</span>
                </div>
                <span className="text-xs text-muted-foreground">{controls.yellowThreshold}%+</span>
              </div>
              <Slider
                value={[controls.yellowThreshold]}
                onValueChange={(value) => handleChange("yellowThreshold", value[0])}
                min={30}
                max={70}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <Label className="text-sm">🟠 Orange Threshold</Label>
                  <span className="text-xs text-muted-foreground">Minimum score for fair performance</span>
                </div>
                <span className="text-xs text-muted-foreground">{controls.orangeThreshold}%+</span>
              </div>
              <Slider
                value={[controls.orangeThreshold]}
                onValueChange={(value) => handleChange("orangeThreshold", value[0])}
                min={10}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Empty Measure Handling */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">EMPTY MEASURE DEFAULTS</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <Label className="text-sm">Minimum Default</Label>
                  <span className="text-xs text-muted-foreground">Lowest score for measures with no hits</span>
                </div>
                <span className="text-xs text-muted-foreground">{controls.emptyMeasureMin}%</span>
              </div>
              <Slider
                value={[controls.emptyMeasureMin]}
                onValueChange={(value) => handleChange("emptyMeasureMin", value[0])}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <Label className="text-sm">Maximum Default</Label>
                  <span className="text-xs text-muted-foreground">Highest score for measures with no hits</span>
                </div>
                <span className="text-xs text-muted-foreground">{controls.emptyMeasureMax}%</span>
              </div>
              <Slider
                value={[controls.emptyMeasureMax]}
                onValueChange={(value) => handleChange("emptyMeasureMax", value[0])}
                min={20}
                max={60}
                step={1}
                className="w-full"
              />
            </div>
          </div>

        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
