"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";

interface ConsoleMessage {
    id: number;
    message: string;
    timestamp: Date;
    type: 'log' | 'warn' | 'error';
}

export function ConsoleOutput() {
    const [messages, setMessages] = useState<ConsoleMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageIdRef = useRef(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Intercept console.log, console.warn, console.error
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        const addMessage = (message: string, type: 'log' | 'warn' | 'error') => {
            setMessages(prev => {
                const newMessage: ConsoleMessage = {
                    id: messageIdRef.current++,
                    message,
                    timestamp: new Date(),
                    type
                };
                // Keep only last 50 messages
                const updated = [...prev, newMessage].slice(-50);
                return updated;
            });
        };

        console.log = (...args) => {
            originalLog(...args);
            addMessage(args.join(' '), 'log');
        };

        console.warn = (...args) => {
            originalWarn(...args);
            addMessage(args.join(' '), 'warn');
        };

        console.error = (...args) => {
            originalError(...args);
            addMessage(args.join(' '), 'error');
        };

        // Cleanup
        return () => {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
        };
    }, []);

    useEffect(() => {
        if (isVisible) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isVisible]);

    const clearMessages = () => {
        setMessages([]);
    };

    const exportLogs = () => {
        const logText = messages.map(msg =>
            `[${msg.timestamp.toISOString()}] ${msg.type.toUpperCase()}: ${msg.message}`
        ).join('\n');

        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${new Date().toISOString().slice(0, 19)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const copyLogs = () => {
        const logText = messages.map(msg =>
            `[${msg.timestamp.toLocaleTimeString()}] ${msg.message}`
        ).join('\n');
        navigator.clipboard.writeText(logText);
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Debug Console</CardTitle>
                <div className="flex gap-2">
                    <button
                        onClick={copyLogs}
                        className="text-xs px-2 py-1 bg-blue-200 hover:bg-blue-300 rounded"
                        title="Copy logs to clipboard"
                    >
                        Copy Logs
                    </button>
                    <button
                        onClick={exportLogs}
                        className="text-xs px-2 py-1 bg-green-200 hover:bg-green-300 rounded"
                        title="Download logs as file"
                    >
                        Export
                    </button>
                    <button
                        onClick={() => setIsVisible(!isVisible)}
                        className="text-xs px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded"
                        title="Toggle console visibility"
                    >
                        {isVisible ? 'Hide' : 'Show'}
                    </button>
                    <button
                        onClick={clearMessages}
                        className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                    >
                        Clear
                    </button>
                </div>
            </CardHeader>
            {isVisible && (
                <CardContent>
                    <div className="h-64 overflow-y-auto bg-black text-green-400 font-mono text-xs p-2 rounded">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`mb-1 ${msg.type === 'error' ? 'text-red-400' :
                                msg.type === 'warn' ? 'text-yellow-400' :
                                    'text-green-400'
                                }`}>
                                <span className="text-gray-500">
                                    {msg.timestamp.toLocaleTimeString()}:
                                </span>
                                {msg.message}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </CardContent>
            )}
        </Card>
    );
}