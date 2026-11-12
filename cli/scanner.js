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
        this.topLevelMetadata = {
            timestamp: new Date().toISOString(),
            global_summary: { Critical: 0, Serious: 0, Moderate: 0, Minor: 0, Manual: 0, Informative: 0 }
        };
    }

    async init(options = {}) {
        this.browser = await chromium.launch({ headless: !options.interactive });
        
        // Define dynamic viewport or fallback to standard desktop
        const viewportWidth = options.width || 1280;
        const viewportHeight = options.height || 800;

        const contextOpts = {
            viewport: { width: viewportWidth, height: viewportHeight },
            // Standardize the headless User-Agent for rendering consistency
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };
        
        if (options.authState && fs.existsSync(options.authState)) {
            contextOpts.storageState = options.authState;
        }
        
        this.context = await this.browser.newContext(contextOpts);
        await this.context.addInitScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
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
        await frameOrPage.addScriptTag({ content: fs.readFileSync(path.join(corePath, 'shared-utils.js'), 'utf-8') });
        await frameOrPage.addScriptTag({ content: fs.readFileSync(path.join(corePath, 'a11y-config.js'), 'utf-8') });
        await frameOrPage.addScriptTag({ content: fs.readFileSync(path.resolve(__dirname, './cli-adapter.js'), 'utf-8') });
    }

    async extractAllFrames(requestedAudits) {
        const mergedAudits = new Map();
        const frames = this.page.frames();
        
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            try {
                await this.injectCore(frame);
                const prefix = i === 0 ? "" : `F${i}.`;
                const depth = i === 0 ? 0 : 1;
                
                const frameResults = await frame.evaluate(([audits, pref, dep]) => {
                    return window.A11yCliAdapter ? window.A11yCliAdapter.run(audits, pref, dep) : [];
                }, [requestedAudits, prefix, depth]);
                
                for (const audit of frameResults) {
                    if (!mergedAudits.has(audit.auditId)) {
                        mergedAudits.set(audit.auditId, audit);
                    } else {
                        mergedAudits.get(audit.auditId).elements.push(...audit.elements);
                    }
                }
            } catch (e) {
                // Ignore cross-origin execution context errors
            }
        }
        return Array.from(mergedAudits.values());
    }

    buildHierarchy(unifiedSnapshot) {
        const hierarchy = {};
        for (const audit of unifiedSnapshot) {
            if (!hierarchy[audit.tab]) hierarchy[audit.tab] = {};
            if (!hierarchy[audit.tab][audit.category]) hierarchy[audit.tab][audit.category] = [];
            
            hierarchy[audit.tab][audit.category].push({
                auditId: audit.auditId,
                audit: audit.auditLabel,
                severity: audit.severity,
                info: audit.info,
                elements: audit.elements
            });
        }
        return hierarchy;
    }

    calculateHealthScores(unifiedSnapshot) {
        const scores = { Critical: 0, Serious: 0, Moderate: 0, Minor: 0, Manual: 0, Informative: 0 };
        for (const audit of unifiedSnapshot) {
            if (audit.auditId !== 'i-focus-order') {
                const rawSev = audit.severity || 'Informative';
                const sev = rawSev.charAt(0).toUpperCase() + rawSev.slice(1).toLowerCase();
                if (scores[sev] !== undefined) {
                    scores[sev] += audit.elements.length;
                }
            }
        }
        return scores;
    }

    async generateStepData(actionName, requestedAudits, includeScreenshot) {
        const startTime = performance.now();
        const currentSnapshot = await this.extractAllFrames(requestedAudits);
        const executionTimeMs = Math.round(performance.now() - startTime);

        let screenshotBase64 = null;
        if (includeScreenshot) {
            const buffer = await this.page.screenshot({ type: 'jpeg', quality: 60 });
            screenshotBase64 = buffer.toString('base64');
        }

        const healthScores = this.calculateHealthScores(currentSnapshot);
        for (const [k, v] of Object.entries(healthScores)) {
            this.topLevelMetadata.global_summary[k] += v;
        }

        const diffedNew = [];
        const diffedResolved = [];

        if (this.lastSnapshot.length === 0) {
            // Step 1: Baseline. Everything is new. There are no resolved findings yet.
            for (const audit of currentSnapshot) {
                diffedNew.push(audit);
            }
        } else {
            // Step 2+: Diffing Logic
            for (const currAudit of currentSnapshot) {
                const baseAudit = this.lastSnapshot.find(a => a.auditId === currAudit.auditId) || { elements: [] };
                
                // Focus Order Special Handling: Never put in resolved_findings
                if (currAudit.auditId === 'i-focus-order') {
                    let isChanged = currAudit.elements.length !== baseAudit.elements.length;
                    if (!isChanged) {
                        for (let i = 0; i < currAudit.elements.length; i++) {
                            if (currAudit.elements[i].selector !== baseAudit.elements[i].selector) {
                                isChanged = true;
                                break;
                            }
                        }
                    }
                    
                    if (isChanged) {
                        diffedNew.push({ ...currAudit, elements: currAudit.elements }); // Entire new sequence
                    } else {
                        diffedNew.push({ ...currAudit, elements: [] }); // No shift occurred
                    }
                } 
                // Standard Element Set Diffing for all other audits
                else {
                    const hash = (el) => `${el.selector}|${el.issueText}`;
                    const baseSet = new Set(baseAudit.elements.map(hash));
                    const currSet = new Set(currAudit.elements.map(hash));

                    const newElements = currAudit.elements.filter(el => !baseSet.has(hash(el)));
                    const resolvedElements = baseAudit.elements.filter(el => !currSet.has(hash(el)));

                    diffedNew.push({ ...currAudit, elements: newElements });
                    diffedResolved.push({ ...currAudit, elements: resolvedElements }); 
                }
            }
            // Catch audits that disappeared completely in the current snapshot
            for (const baseAudit of this.lastSnapshot) {
                if (!currentSnapshot.find(a => a.auditId === baseAudit.auditId)) {
                    diffedNew.push({ ...baseAudit, elements: [] });
                    if (baseAudit.auditId !== 'i-focus-order') {
                        diffedResolved.push({ ...baseAudit, elements: baseAudit.elements });
                    }
                }
            }
        }

        const logEntry = {
            step: ++this.stepCounter,
            action: actionName,
            url: this.page.url(),
            execution_time_ms: executionTimeMs,
            screenshot_base64: screenshotBase64,
            health_scores: healthScores,
            new_findings: this.buildHierarchy(diffedNew),
            resolved_findings: this.buildHierarchy(diffedResolved)
        };

        this.lastSnapshot = currentSnapshot;
        this.auditTrail.push(logEntry);
        return logEntry;
    }

    async runBaseline(url, requestedAudits = [], includeScreenshot = false, timingOpts = {}) {
        if (this.page.url() !== url) {
            await this.page.goto(url, { waitUntil: 'networkidle' });
        }

        // Wait for specific DOM selector if requested
        if (timingOpts.waitForSelector) {
            console.log(`[Audit] Waiting for selector: ${timingOpts.waitForSelector}...`);
            await this.page.waitForSelector(timingOpts.waitForSelector, { timeout: 15000 });
        }

        // Wait for explicit pause (e.g. SPA router settling) if requested
        if (timingOpts.waitMs && timingOpts.waitMs > 0) {
            console.log(`[Audit] Waiting ${timingOpts.waitMs}ms for SPA hydration...`);
            await this.page.waitForTimeout(timingOpts.waitMs);
        }
        
        console.log('[Audit] Smooth scrolling to trigger lazy-loaded content...');
        await this.page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 250; // Scroll 250px at a time
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    // Stop scrolling when we reach the bottom
                    if (totalHeight >= scrollHeight - window.innerHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100); // Every 100ms
            });
        });
        
        await this.page.waitForTimeout(1500); // Give JS time to render the new HTML
        await this.page.evaluate(() => window.scrollTo(0, 0)); // Reset focus to top

        return await this.generateStepData("Initial Page Load", requestedAudits, includeScreenshot);
    }

    async interactAndAudit(actionName, selector, requestedAudits = [], includeScreenshot = false) {
        if (!this.page) throw new Error("Browser not initialized.");

        const waitForAuditComplete = this.page.evaluate(() => {
            return new Promise(resolve => {
                document.addEventListener('wick-audit-complete', resolve, { once: true });
                setTimeout(resolve, 2500); 
            });
        });

        await this.page.click(selector);
        await waitForAuditComplete;

        return await this.generateStepData(actionName || `Click: ${selector}`, requestedAudits, includeScreenshot);
    }

    getAuditTrail() {
        return {
            ...this.topLevelMetadata,
            audit_trail: this.auditTrail
        };
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}