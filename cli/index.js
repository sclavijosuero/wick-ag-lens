import { Command } from 'commander';
import { WICKScanner } from './scanner.js';
import fs from 'fs';

const program = new Command();

program
  .name('wick-ag-lens')
  .description('Headless CLI for WICK-AG-Lens with Action-State Timeline support')
  .version('3.0.0');

program.command('audit <url>')
  .description('Run an accessibility baseline audit against a URL')
  .option('-a, --auth-state <path>', 'Path to Playwright storage state JSON')
  .option('--login-url <url>', 'URL to authenticate against first')
  .option('-u, --user <user>', 'Username for direct auth')
  .option('-p, --pass <pass>', 'Password for direct auth')
  .option('-i, --interactive', 'Run browser visibly for manual MFA bypass')
  .option('--audits <list>', 'Comma separated list of specific audit IDs to run (e.g. v-doc-title,v-empty-links)')
  .option('--click <selector>', 'Optional: CSS selector to click after baseline to generate an interaction diff log')
  .action(async (url, options) => {
      const scanner = new WICKScanner();
      await scanner.init(options);

      if (options.loginUrl && options.user && options.pass) {
          await scanner.authenticate(options.loginUrl, options.user, options.pass);
      } else if (options.interactive) {
          console.log("Interactive mode: Please log in. The script will wait 30s...");
          await scanner.page.waitForTimeout(30000); 
      }

      const requestedAudits = options.audits ? options.audits.split(',') : [];
      console.log(`[Audit] Running Baseline Scan on ${url}...`);
      
      await scanner.runBaseline(url, requestedAudits);
      
      if (options.click) {
          console.log(`[Audit] Interacting with element: ${options.click}...`);
          await scanner.interactAndAudit(`Click: ${options.click}`, options.click, requestedAudits);
      }

      // Output the full grouped Action-State timeline
      console.log(JSON.stringify(scanner.getAuditTrail(), null, 2));
      await scanner.close();
  });

program.parse();
