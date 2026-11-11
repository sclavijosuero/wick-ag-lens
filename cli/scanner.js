import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WICKScanner {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.auditTrail = [];
        this.lastSnapshot = [];
        this.stepCounter = 0;
    }

    async init(options = {}) {
        this.browser = await chromium.launch({ headless: !options.interactive });
        const contextOpts = {};
        if (options.authState && fs.existsSync(options.authState)) {
            contextOpts.storageState = options.authState;
        }
        this.context = await this.browser.newContext(contextOpts);
        this.page = await this.context.newPage();
    }

    async authenticate(loginUrl, user, pass) {
        if (!loginUrl) return;
        console.log(`[Auth] Navigating to ${loginUrl}...`);
        await this.page.goto(loginUrl, { waitUntil: 'networkidle' });
        await this.page.fill('input[type="text"], input[type="email"]', user);
        await this.page.fill('input[type="password"]', pass);
        await this.page.click('button[type="submit"], input[type="submit"]');
        await this.page.waitForNavigation({ waitUntil: 'networkidle' });
        console.log('[Auth] Login successful.');
    }

    async injectCore(frameOrPage) {
        const corePath = path.resolve(__dirname, '../core');
        const utilsCode = fs.readFileSync(path.join(corePath, 'shared-utils.js'), 'utf-8');
        const configCode = fs.readFileSync(path.join(corePath, 'a11y-config.js'), 'utf-8');
        const adapterCode = fs.readFileSync(path.resolve(__dirname, './cli-adapter.js'), 'utf-8');

        await frameOrPage.addScriptTag({ content: utilsCode });
        await frameOrPage.addScriptTag({ content: configCode });
        await frameOrPage.addScriptTag({ content: adapterCode });
    }

    async extractAllFrames(requestedAudits) {
        let allResults = [];
        // Traverse cross-origin iframes inherently supported by Playwright
        for (const frame of this.page.frames()) {
            try {
                await this.injectCore(frame);
                const frameResults = await frame.evaluate((audits) => {
                    return window.A11yCliAdapter ? window.A11yCliAdapter.run(audits) : [];
                }, requestedAudits);
                allResults.push(...frameResults);
            } catch (e) {
                // Ignore cross-origin execution context errors for tightly sandboxed frames
            }
        }
        return allResults;
    }

    groupViolations(violations) {
        const groups = {};
        for (const v of violations) {
            const key = `${v.label}|${v.issueText}`;
            if (!groups[key]) {
                groups[key] = {
                    rule: v.label,
                    context: v.issueText,
                    elements: []
                };
            }
            groups[key].elements.push(v.element);
        }
        return Object.values(groups);
    }

    async runBaseline(url, requestedAudits = []) {
        if (this.page.url() !== url) {
            await this.page.goto(url, { waitUntil: 'networkidle' });
        }
        
        const currentSnapshot = await this.extractAllFrames(requestedAudits);
        
        this.stepCounter = 1;
        this.lastSnapshot = currentSnapshot;
        
        // The baseline logs all existing violations as "new" for Step 1
        const groupedViolations = this.groupViolations(currentSnapshot);
        
        const logEntry = {
            step: this.stepCounter,
            action: "Initial Page Load",
            total_violations: currentSnapshot.length,
            new_violations: groupedViolations,
            resolved_violations: []
        };
        
        this.auditTrail.push(logEntry);
        return logEntry;
    }

    async interactAndAudit(actionName, selector, requestedAudits = []) {
        if (!this.page) throw new Error("Browser not initialized or baseline not run.");

        // Hook into the double-debounce custom event dispatched from /core/content.js
        const waitForAuditComplete = this.page.evaluate(() => {
            return new Promise(resolve => {
                document.addEventListener('wick-audit-complete', resolve, { once: true });
                // 2.5 second fallback in case the DOM doesn't mutate at all
                setTimeout(resolve, 2500); 
            });
        });

        await this.page.click(selector);
        
        // Guarantee React/SPA routes have settled and the fast core heuristics ran
        await waitForAuditComplete;

        const currentSnapshot = await this.extractAllFrames(requestedAudits);
        this.stepCounter++;

        // Delta Calculation (Context-Aware Diffing Engine)
        const hash = (r) => `${r.featureId}|${r.element}|${r.issueText}`;
        const baseSet = new Set(this.lastSnapshot.map(hash));
        const currSet = new Set(currentSnapshot.map(hash));

        const rawNewViolations = currentSnapshot.filter(r => !baseSet.has(hash(r)));
        const rawResolvedViolations = this.lastSnapshot.filter(r => !currSet.has(hash(r)));

        const new_violations = this.groupViolations(rawNewViolations);
        const resolved_violations = this.groupViolations(rawResolvedViolations);

        const logEntry = {
            step: this.stepCounter,
            action: actionName || `Click Element: ${selector}`,
            total_violations: currentSnapshot.length,
            new_violations,
            resolved_violations
        };

        this.lastSnapshot = currentSnapshot;
        this.auditTrail.push(logEntry);
        
        return logEntry;
    }

    getAuditTrail() {
        return { audit_trail: this.auditTrail };
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}
