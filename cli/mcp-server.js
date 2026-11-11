import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { WICKScanner } from "./scanner.js";

const server = new Server({ name: "wick-ag-lens-mcp", version: "3.0.0" }, { capabilities: { tools: {} } });
const scanner = new WICKScanner();
let isInitialized = false;

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "audit_baseline",
                description: "Run a full WICK-AG-Lens accessibility baseline scan on a target URL and begin the Action-State timeline.",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string", description: "Target URL to scan" },
                        requestedAudits: { type: "array", items: { type: "string" }, description: "Array of specific audit IDs. Leave empty for all." }
                    },
                    required: ["url"]
                }
            },
            {
                name: "interact_and_diff",
                description: "Click a selector, wait for SPA/DOM mutations to settle, and return a delta log of accessibility barriers introduced or resolved.",
                inputSchema: {
                    type: "object",
                    properties: {
                        actionName: { type: "string", description: "Friendly name for the action (e.g. 'Open Cart Modal')" },
                        selector: { type: "string", description: "CSS selector to click (e.g. '#open-cart')" },
                        requestedAudits: { type: "array", items: { type: "string" } }
                    },
                    required: ["selector", "actionName"]
                }
            },
            {
                name: "get_audit_trail",
                description: "Returns the full chronological Action-State timeline log of all interactions and accessibility shifts.",
                inputSchema: {
                    type: "object",
                    properties: {}
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (!isInitialized) {
        await scanner.init({ interactive: false });
        isInitialized = true;
    }

    try {
        if (request.params.name === "audit_baseline") {
            const { url, requestedAudits } = request.params.arguments;
            const result = await scanner.runBaseline(url, requestedAudits || []);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } 
        
        else if (request.params.name === "interact_and_diff") {
            const { actionName, selector, requestedAudits } = request.params.arguments;
            const diff = await scanner.interactAndAudit(actionName, selector, requestedAudits || []);
            return { content: [{ type: "text", text: JSON.stringify(diff, null, 2) }] };
        }

        else if (request.params.name === "get_audit_trail") {
            const trail = scanner.getAuditTrail();
            return { content: [{ type: "text", text: JSON.stringify(trail, null, 2) }] };
        }
        
        throw new Error("Tool not found");
    } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("WICK-AG-Lens MCP Server v3.0.0 running on stdio");
}

main().catch(console.error);
