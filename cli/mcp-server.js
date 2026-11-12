import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import WICKScanner from "./scanner.js";

const server = new McpServer({
  name: "wick-ag-lens-mcp",
  version: "3.0.0",
});

// Maintain a single active scanner instance for the AI's session
let activeScanner = null;

server.tool(
  "audit_baseline",
  "Runs a full accessibility baseline scan on a target URL.",
  {
    url: z.string().describe("The URL to navigate to and audit."),
    requestedAudits: z.array(z.string()).optional().describe("Optional list of specific audit IDs to run (e.g., ['i-focus-order'])."),
    includeScreenshot: z.boolean().optional().describe("If true, includes a Base64 JPEG screenshot of the rendered page."),
    viewportWidth: z.number().optional().describe("Viewport width in pixels (e.g., 375 for mobile, 1280 for desktop)."),
    viewportHeight: z.number().optional().describe("Viewport height in pixels (e.g., 812 for mobile, 800 for desktop).")
  },
  async (args) => {
    try {
      // Close previous instance if it exists to start fresh
      if (activeScanner) {
        await activeScanner.close();
      }

      activeScanner = new WICKScanner();
      
      const scannerOpts = { 
        headless: true,
        width: args.viewportWidth,
        height: args.viewportHeight
      };
      
      await activeScanner.init(scannerOpts);
      
      await activeScanner.runBaseline(
        args.url, 
        args.requestedAudits || [], 
        args.includeScreenshot || false
      );

      return {
        content: [{ type: "text", text: JSON.stringify(activeScanner.getAuditTrail(), null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error executing audit_baseline: ${error.message}\n${error.stack}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "interact_and_diff",
  "Clicks a CSS selector on the current page, waits for the SPA to settle, and returns a delta log of new or resolved accessibility barriers.",
  {
    actionName: z.string().describe("A human-readable name for the action (e.g., 'Click Mobile Menu')."),
    selector: z.string().describe("The CSS selector of the element to click."),
    requestedAudits: z.array(z.string()).optional(),
    includeScreenshot: z.boolean().optional()
  },
  async (args) => {
    try {
      if (!activeScanner) {
        throw new Error("No active baseline found. Please run 'audit_baseline' first.");
      }

      const diffLog = await activeScanner.interactAndAudit(
        args.actionName, 
        args.selector, 
        args.requestedAudits || [], 
        args.includeScreenshot || false
      );

      return {
        content: [{ type: "text", text: JSON.stringify(diffLog, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error executing interact_and_diff: ${error.message}\n${error.stack}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_audit_trail",
  "Returns the full chronological Action-State timeline log with global metadata and health scores.",
  {},
  async () => {
    try {
      if (!activeScanner) {
        throw new Error("No active scan session found.");
      }

      return {
        content: [{ type: "text", text: JSON.stringify(activeScanner.getAuditTrail(), null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error executing get_audit_trail: ${error.message}\n${error.stack}` }],
        isError: true,
      };
    }
  }
);

// Process cleanup
process.on('SIGINT', async () => {
    if (activeScanner) {
        await activeScanner.close();
    }
    process.exit(0);
});

// Start the stdio transport
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WICK-AG-Lens MCP Server running on stdio");
}

run().catch(console.error);