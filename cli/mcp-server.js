import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { WICKScanner } from "./scanner.js";

const server = new McpServer({
  name: "wick-ag-lens-mcp",
  version: "3.0.0",
});

// Maintain a single active scanner instance for the AI's session
let activeScanner = null;

const stepSchema = z.object({
  action: z.enum(["click", "fill", "select", "press", "hover", "wait"]).describe("The interaction type to execute."),
  target: z.string().optional().describe("The CSS selector of the target element (or milliseconds if action is 'wait', or 'active' for global key presses)."),
  value: z.string().optional().describe("The text to fill, option value to select, or keyboard key to press (e.g., 'Enter', 'Tab', 'Escape').")
});

server.tool(
  "audit_baseline",
  "Authenticates if needed and runs a full accessibility baseline scan on a target URL.",
  {
    url: z.string().describe("The target URL to navigate to and audit."),
    // Authentication options
    loginUrl: z.string().optional().describe("Optional URL to navigate to for authentication before running the audit."),
    user: z.string().optional().describe("Optional shorthand username/email for standard 2-field login forms (requires loginUrl and pass)."),
    pass: z.string().optional().describe("Optional shorthand password for standard 2-field login forms (requires loginUrl and user)."),
    authSteps: z.array(stepSchema).optional().describe("Optional ordered list of pre-audit authentication steps (requires loginUrl)."),
    authScript: z.string().optional().describe("Optional path to a custom JavaScript module exporting an async default login function."),
    authState: z.string().optional().describe("Optional path to a Playwright storageState JSON file (cookies/localStorage) from agent-browser or Playwright."),
    // Audit scope & WCAG filters
    requestedAudits: z.array(z.string()).optional().describe("Optional list of specific audit IDs to run (e.g., ['i-focus-order', 'v-heading-errors'])."),
    wcagVersions: z.array(z.string()).optional().describe("Optional WCAG versions to filter by (e.g., ['2.0', '2.1', '2.2'])."),
    wcagLevels: z.array(z.string()).optional().describe("Optional WCAG levels to filter by (e.g., ['A', 'AA', 'AAA'])."),
    // Viewport, screenshots & SPA timing
    includeScreenshot: z.boolean().optional().describe("If true, includes a Base64 JPEG screenshot of the rendered page."),
    viewportWidth: z.number().optional().describe("Viewport width in pixels (defaults to 1280)."),
    viewportHeight: z.number().optional().describe("Viewport height in pixels (defaults to 800)."),
    waitMs: z.number().optional().describe("Optional pause duration in milliseconds after load for SPA hydration."),
    waitForSelector: z.string().optional().describe("Optional CSS selector to wait for before running the baseline audit.")
  },
  async (args) => {
    try {
      if (activeScanner) {
        await activeScanner.close();
      }

      activeScanner = new WICKScanner();
      
      await activeScanner.init({ 
        headless: true,
        width: args.viewportWidth,
        height: args.viewportHeight,
        authState: args.authState
      });

      // 1. Pre-Audit Authentication Pipeline (mirrors CLI index.js)
      if (args.authScript) {
        await activeScanner.authenticateWithScript(args.authScript);
      } else if (args.loginUrl) {
        let stepsToRun = args.authSteps ? [...args.authSteps] : [];

        if (stepsToRun.length === 0 && args.user && args.pass) {
          stepsToRun = [
            { action: "fill", target: 'input[type="text"], input[type="email"], input[type="user"]', value: args.user },
            { action: "fill", target: 'input[type="password"]', value: args.pass },
            { action: "click", target: 'button[type="submit"], input[type="submit"]' }
          ];
        }

        if (stepsToRun.length > 0) {
          await activeScanner.authenticate(args.loginUrl, stepsToRun);
        }
      }
      
      // 2. Scope Filters & Hydration Timing
      const filters = {
        requestedAudits: args.requestedAudits || [],
        wcagVersions: args.wcagVersions ? args.wcagVersions.map(v => v.toUpperCase()) : [],
        wcagLevels: args.wcagLevels ? args.wcagLevels.map(l => l.toUpperCase()) : []
      };

      const timingOpts = {
        waitMs: args.waitMs,
        waitForSelector: args.waitForSelector
      };

      // 3. Execute Baseline Audit
      await activeScanner.runBaseline(
        args.url, 
        filters, 
        args.includeScreenshot || false,
        timingOpts
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
  "Performs an interaction (click, fill, select, press, hover, wait) on the current page, waits for the SPA to settle, and returns a delta log of new or resolved accessibility barriers.",
  {
    action: z.enum(["click", "fill", "select", "press", "hover", "wait"]).describe("The interaction type to execute."),
    target: z.string().optional().describe("The CSS selector of the target element (or milliseconds if action is 'wait', or 'active' for global key presses)."),
    value: z.string().optional().describe("The text to fill, option value to select, or keyboard key to press (e.g., 'Enter', 'Tab', 'Escape')."),
    requestedAudits: z.array(z.string()).optional(),
    wcagVersions: z.array(z.string()).optional(),
    wcagLevels: z.array(z.string()).optional(),
    includeScreenshot: z.boolean().optional()
  },
  async (args) => {
    try {
      if (!activeScanner) {
        throw new Error("No active baseline found. Please run 'audit_baseline' first.");
      }

      const step = {
        action: args.action,
        target: args.target,
        value: args.value
      };

      const filters = {
        requestedAudits: args.requestedAudits || [],
        wcagVersions: args.wcagVersions ? args.wcagVersions.map(v => v.toUpperCase()) : [],
        wcagLevels: args.wcagLevels ? args.wcagLevels.map(l => l.toUpperCase()) : []
      };

      const diffLog = await activeScanner.interactAndAudit(
        step, 
        filters, 
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
  "Returns the full chronological Action-State timeline log with global metadata, focus order state maps, and health scores.",
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