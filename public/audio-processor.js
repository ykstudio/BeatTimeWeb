class OnsetProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        // Simple peak-picking onset detection.
        this.threshold = 0.2; // This may need to be adjusted.
        this.lastValue = 0;
        this.lastOnsetTime = 0;
        this.debounceTime = 0.1; // 100ms debounce
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const channelData = input[0];
            for (let i = 0; i < channelData.length; i++) {
                const currentValue = Math.abs(channelData[i]);
                // Check if we've crossed the threshold going up
                if (currentValue > this.threshold && this.lastValue <= this.threshold) {
                    const now = currentTime;
                    if (now > this.lastOnsetTime + this.debounceTime) {
                        this.port.postMessage({
                            type: 'onset',
                            onsetTime: now
                        });
                        this.lastOnsetTime = now;
                    }
                }
                this.lastValue = currentValue;
            }
        }
        return true;
    }
}

registerProcessor('onset-processor', OnsetProcessor);
