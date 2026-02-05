#!/usr/bin/env node
/**
 * Godot Documentation MCP Server - Live WebSocket Version
 *
 * This MCP server connects to a running Godot Editor plugin via WebSocket
 * to provide real-time access to Godot's ClassDB and documentation.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import WebSocket from 'ws';
// Configuration
const GODOT_WS_URL = process.env.GODOT_WS_URL || "ws://localhost:9081";
const RECONNECT_DELAY = 5000; // 5 seconds
// WebSocket connection
let ws = null;
let reconnectTimer = null;
let requestId = 0;
const pendingRequests = new Map();
/**
 * Connect to Godot WebSocket server
 */
function connectToGodot() {
    return new Promise((resolve, reject) => {
        console.error(`Connecting to Godot at ${GODOT_WS_URL}...`);
        ws = new WebSocket(GODOT_WS_URL);
        ws.on('open', () => {
            console.error('✓ Connected to Godot Documentation Server');
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
            resolve();
        });
        ws.on('error', (error) => {
            console.error('WebSocket error:', error.message);
            reject(error);
        });
        ws.on('close', () => {
            console.error('Connection to Godot closed. Attempting to reconnect...');
            scheduleReconnect();
        });
        ws.on('message', (data) => {
            try {
                const response = JSON.parse(data.toString());
                // Check if this is a response to a pending request
                if (response.id !== undefined && pendingRequests.has(response.id)) {
                    const { resolve, reject } = pendingRequests.get(response.id);
                    pendingRequests.delete(response.id);
                    if (response.error) {
                        reject(new Error(response.error.message || 'RPC error'));
                    }
                    else {
                        resolve(response.result);
                    }
                }
            }
            catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        });
    });
}
/**
 * Schedule a reconnection attempt
 */
function scheduleReconnect() {
    if (reconnectTimer)
        return;
    reconnectTimer = setTimeout(() => {
        console.error('Attempting to reconnect to Godot...');
        connectToGodot().catch((error) => {
            console.error('Reconnection failed:', error.message);
            scheduleReconnect();
        });
    }, RECONNECT_DELAY);
}
/**
 * Send an RPC request to Godot
 */
async function sendRpcRequest(method, params = {}) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error('Not connected to Godot. Please ensure Godot Editor is running with the plugin enabled.');
    }
    const id = ++requestId;
    return new Promise((resolve, reject) => {
        pendingRequests.set(id, { resolve, reject });
        const request = {
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: id
        };
        ws.send(JSON.stringify(request));
        // Set a timeout for the request
        setTimeout(() => {
            if (pendingRequests.has(id)) {
                pendingRequests.delete(id);
                reject(new Error('Request timeout'));
            }
        }, 10000); // 10 second timeout
    });
}
/**
 * Create an MCP server
 */
const server = new Server({
    name: "godot-docs-server-live",
    version: "0.2.0",
}, {
    capabilities: {
        resources: {},
        tools: {},
        prompts: {},
    },
});
/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_class_doc",
                description: "Get full documentation for a Godot class from the running Godot Editor",
                inputSchema: {
                    type: "object",
                    properties: {
                        class_name: {
                            type: "string",
                            description: "Name of the Godot class (e.g., 'Node', 'Control', 'Area2D')"
                        }
                    },
                    required: ["class_name"]
                }
            },
            {
                name: "search_classes",
                description: "Search for Godot classes by name pattern",
                inputSchema: {
                    type: "object",
                    properties: {
                        pattern: {
                            type: "string",
                            description: "Search pattern (e.g., 'Area', 'Node')"
                        }
                    },
                    required: ["pattern"]
                }
            },
            {
                name: "get_class_methods",
                description: "Get list of methods for a Godot class",
                inputSchema: {
                    type: "object",
                    properties: {
                        class_name: {
                            type: "string",
                            description: "Name of the Godot class"
                        }
                    },
                    required: ["class_name"]
                }
            },
            {
                name: "get_class_properties",
                description: "Get list of properties for a Godot class",
                inputSchema: {
                    type: "object",
                    properties: {
                        class_name: {
                            type: "string",
                            description: "Name of the Godot class"
                        }
                    },
                    required: ["class_name"]
                }
            },
            {
                name: "get_class_signals",
                description: "Get list of signals for a Godot class",
                inputSchema: {
                    type: "object",
                    properties: {
                        class_name: {
                            type: "string",
                            description: "Name of the Godot class"
                        }
                    },
                    required: ["class_name"]
                }
            },
            {
                name: "get_class_hierarchy",
                description: "Get the inheritance hierarchy for a Godot class",
                inputSchema: {
                    type: "object",
                    properties: {
                        class_name: {
                            type: "string",
                            description: "Name of the Godot class"
                        }
                    },
                    required: ["class_name"]
                }
            },
            {
                name: "list_all_classes",
                description: "List all available Godot classes in the running Godot Editor",
                inputSchema: {
                    type: "object",
                    properties: {
                        filter: {
                            type: "string",
                            description: "Optional filter pattern to narrow results"
                        }
                    }
                }
            }
        ]
    };
});
/**
 * Handler for tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        switch (request.params.name) {
            case "get_class_doc": {
                const className = String(request.params.arguments?.class_name);
                const result = await sendRpcRequest("get_class_doc", { class_name: className });
                return {
                    content: [{
                            type: "text",
                            text: formatClassDoc(result)
                        }]
                };
            }
            case "search_classes": {
                const pattern = String(request.params.arguments?.pattern);
                const result = await sendRpcRequest("search_classes", { pattern: pattern });
                if (result.error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error: ${result.error}`
                            }],
                        isError: true
                    };
                }
                return {
                    content: [{
                            type: "text",
                            text: `Found ${result.results?.length || 0} classes matching '${pattern}':\n\n${(result.results || []).join('\n')}`
                        }]
                };
            }
            case "get_class_methods": {
                const className = String(request.params.arguments?.class_name);
                const result = await sendRpcRequest("get_class_methods", { class_name: className });
                if (result.error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error: ${result.error}`
                            }],
                        isError: true
                    };
                }
                return {
                    content: [{
                            type: "text",
                            text: formatMethods(result.methods || [])
                        }]
                };
            }
            case "get_class_properties": {
                const className = String(request.params.arguments?.class_name);
                const result = await sendRpcRequest("get_class_properties", { class_name: className });
                if (result.error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error: ${result.error}`
                            }],
                        isError: true
                    };
                }
                return {
                    content: [{
                            type: "text",
                            text: formatProperties(result.properties || [])
                        }]
                };
            }
            case "get_class_signals": {
                const className = String(request.params.arguments?.class_name);
                const result = await sendRpcRequest("get_class_signals", { class_name: className });
                if (result.error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error: ${result.error}`
                            }],
                        isError: true
                    };
                }
                return {
                    content: [{
                            type: "text",
                            text: formatSignals(result.signals || [])
                        }]
                };
            }
            case "get_class_hierarchy": {
                const className = String(request.params.arguments?.class_name);
                const result = await sendRpcRequest("get_class_hierarchy", { class_name: className });
                if (result.error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error: ${result.error}`
                            }],
                        isError: true
                    };
                }
                return {
                    content: [{
                            type: "text",
                            text: `Inheritance hierarchy for ${className}:\n\n${(result.hierarchy || []).join(' -> ')}`
                        }]
                };
            }
            case "list_all_classes": {
                const filter = request.params.arguments?.filter;
                const result = await sendRpcRequest("list_all_classes", filter ? { filter } : {});
                if (result.error) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error: ${result.error}`
                            }],
                        isError: true
                    };
                }
                const classes = result.classes || [];
                return {
                    content: [{
                            type: "text",
                            text: `Available Godot classes${filter ? ` matching '${filter}'` : ''} (${classes.length} total):\n\n${classes.join('\n')}`
                        }]
                };
            }
            default:
                throw new Error(`Unknown tool: ${request.params.name}`);
        }
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error: ${error.message}`
                }],
            isError: true
        };
    }
});
/**
 * Format class documentation for display
 */
function formatClassDoc(doc) {
    if (doc.error) {
        return `Error: ${doc.error}`;
    }
    let output = `# ${doc.name}\n\n`;
    if (doc.inherits) {
        output += `**Inherits:** ${doc.inherits}\n\n`;
    }
    if (doc.properties && doc.properties.length > 0) {
        output += `## Properties\n\nThis class has ${doc.properties.length} properties.\n\n`;
    }
    if (doc.methods && doc.methods.length > 0) {
        output += `## Methods\n\nThis class has ${doc.methods.length} methods.\n\n`;
    }
    if (doc.signals && doc.signals.length > 0) {
        output += `## Signals\n\nThis class has ${doc.signals.length} signals.\n\n`;
    }
    return output;
}
/**
 * Format methods for display
 */
function formatMethods(methods) {
    if (methods.length === 0) {
        return "No methods found.";
    }
    let output = "";
    methods.forEach((method, index) => {
        output += `${index + 1}. ${method.name || method}\n`;
    });
    return output;
}
/**
 * Format properties for display
 */
function formatProperties(properties) {
    if (properties.length === 0) {
        return "No properties found.";
    }
    let output = "";
    properties.forEach((prop, index) => {
        output += `${index + 1}. ${prop.name || prop}\n`;
    });
    return output;
}
/**
 * Format signals for display
 */
function formatSignals(signals) {
    if (signals.length === 0) {
        return "No signals found.";
    }
    let output = "";
    signals.forEach((signal, index) => {
        output += `${index + 1}. ${signal.name || signal}\n`;
    });
    return output;
}
/**
 * Handler that lists available prompts
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: [
            {
                name: "explain_class",
                description: "Get a detailed explanation of a Godot class",
            },
            {
                name: "compare_classes",
                description: "Compare two Godot classes",
            },
        ]
    };
});
/**
 * Handler for prompts
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case "explain_class": {
            const className = args?.class_name || "Node";
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Please provide a comprehensive explanation of the Godot class '${className}', including its purpose, key methods, properties, and common use cases.`
                        }
                    }
                ]
            };
        }
        case "compare_classes": {
            const class1 = args?.class1 || "Node";
            const class2 = args?.class2 || "Control";
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Please compare the Godot classes '${class1}' and '${class2}', highlighting their differences, when to use each, and their relationship.`
                        }
                    }
                ]
            };
        }
        default:
            throw new Error(`Unknown prompt: ${name}`);
    }
});
/**
 * Start the server
 */
async function main() {
    // Connect to Godot
    try {
        await connectToGodot();
    }
    catch (error) {
        console.error(`Failed to connect to Godot: ${error.message}`);
        console.error(`Will continue attempting to reconnect...`);
        scheduleReconnect();
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Godot Documentation MCP Server (Live) running on stdio');
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
