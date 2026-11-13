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
        this.auditDictionary = {};
        this.topLevelMetadata = {
            timestamp: new Date().toISOString(),
            global_summary: { Critical: 0, Serious: 0, Moderate: 0, Minor: 0, Manual: 0, Informative: 0 }
        };
    }

    async init(options = {}) {
        this.browser = await chromium.launch({ headless: !options.interactive });
        const viewportWidth = options.width || 1280;
        const viewportHeight = options.height || 800;

        const contextOpts = {
            viewport: { width: viewportWidth, height: viewportHeight },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };
        
        if (options.authState && fs.existsSync(options.authState)) {
            contextOpts.storageState = options.authState;
        }
        
        this.context = await this.browser.newContext(contextOpts);
        await this.context.addInitScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
        this.page = await this.context.newPage();
    }

    async navigateSafely(url, timeout = 45000) {
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout });
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 8000 });
        } catch (e) {
            console.log('[Audit] Background network activity still active after 8s; proceeding with DOM evaluation...');
        }
    }

    async executeStep(step) {
        switch (step.action) {
            case 'fill':
                await this.page.fill(step.target, step.value ?? '');
                break;
            case 'select':
                await this.page.selectOption(step.target, step.value ?? '');
                break;
            case 'click':
                await this.page.click(step.target);
                break;
            case 'hover':
                await this.page.hover(step.target);
                break;
            case 'press': {
                const key = step.value || 'Enter';
                if (!step.target || step.target.toLowerCase() === 'active') {
                    await this.page.keyboard.press(key);
                } else {
                    await this.page.press(step.target, key);
                }
                break;
            }
            case 'wait':
                if (/^\d+$/.test(step.target)) {
                    await this.page.waitForTimeout(parseInt(step.target, 10));
                } else {
                    await this.page.waitForSelector(step.target, { timeout: 15000 });
                }
                break;
            default:
                throw new Error(`Unknown step action: "${step.action}". Supported actions: click, fill, select, press, hover, wait.`);
        }
    }

    async authenticate(loginUrl, steps = []) {
        if (!loginUrl || steps.length === 0) return;
        console.log(`[Auth] Navigating to ${loginUrl}...`);
        await this.navigateSafely(loginUrl);

        for (const step of steps) {
            await this.executeStep(step);
        }

        try {
            await this.page.waitForURL((currentUrl) => currentUrl.href !== loginUrl, { timeout: 8000 });
        } catch (e) {
            await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        }
        console.log('[Auth] Login sequence complete.');
    }

    async authenticateWithScript(scriptPath) {
        console.log(`[Auth] Executing custom login script: ${scriptPath}`);
        const fullPath = path.resolve(process.cwd(), scriptPath);
        const moduleUrl = process.platform === 'win32' ? `file://${fullPath.replace(/\\/g, '/')}` : fullPath;
        
        const customAuth = await import(moduleUrl);
        await customAuth.default(this.page);
        console.log('[Auth] Custom login script complete.');
    }

    async injectCore(frameOrPage) {
        const corePath = path.resolve(__dirname, '../core');
        await frameOrPage.addScriptTag({ content: fs.readFileSync(path.join(corePath, 'shared-utils.js'), 'utf-8') });
        await frameOrPage.addScriptTag({ content: fs.readFileSync(path.join(corePath, 'a11y-config.js'), 'utf-8') });
        await frameOrPage.addScriptTag({ content: fs.readFileSync(path.resolve(__dirname, './cli-adapter.js'), 'utf-8') });
    }

    async extractAllFrames(filters = {}) {
        const mergedAudits = new Map();
        const frames = this.page.frames();
        
        const requestedAudits = filters.requestedAudits || [];
        const wcagVersions = filters.wcagVersions || [];
        const wcagLevels = filters.wcagLevels || [];
        
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            try {
                await this.injectCore(frame);
                const prefix = i === 0 ? "" : `F${i}.`;
                const depth = i === 0 ? 0 : 1;
                
                const frameResults = await frame.evaluate(([audits, pref, dep, versions, levels]) => {
                    return window.A11yCliAdapter ? window.A11yCliAdapter.run(audits, pref, dep, versions, levels) : [];
                }, [requestedAudits, prefix, depth, wcagVersions, wcagLevels]);
                
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

    buildHierarchy(unifiedSnapshot, countKey) {
        const hierarchy = {};
        for (const audit of unifiedSnapshot) {
            if (!hierarchy[audit.tab]) hierarchy[audit.tab] = {};
            if (!hierarchy[audit.tab][audit.category]) hierarchy[audit.tab][audit.category] = [];
            
            const entry = {
                auditId: audit.auditId,
                audit: audit.auditLabel,
                severity: audit.severity
            };

            if (countKey) {
                entry[countKey] = audit.elements.length;
            }

            entry.elements = audit.elements;

            hierarchy[audit.tab][audit.category].push(entry);
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

    async generateStepData(interactionObj, filters, includeScreenshot) {
        const startTime = performance.now();
        const currentSnapshot = await this.extractAllFrames(filters);
        const executionTimeMs = Math.round(performance.now() - startTime);

        for (const audit of currentSnapshot) {
            if (!this.auditDictionary[audit.auditId] && audit.info) {
                this.auditDictionary[audit.auditId] = {
                    auditLabel: audit.auditLabel,
                    info: audit.info
                };
            }
        }

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
            for (const audit of currentSnapshot) {
                diffedNew.push(audit);
            }
        } else {
            for (const currAudit of currentSnapshot) {
                const baseAudit = this.lastSnapshot.find(a => a.auditId === currAudit.auditId) || { elements: [] };
                
                if (currAudit.auditId === 'i-focus-order') {
                    let isChanged = currAudit.elements.length !== baseAudit.elements.length ||
                                    currAudit.elements.some((el, i) => el.selector !== baseAudit.elements[i].selector);
                    diffedNew.push({ ...currAudit, elements: isChanged ? currAudit.elements : [] });
                } 
                else {
                    const hash = (el) => `${el.selector}|${el.issueText}`;
                    const baseSet = new Set(baseAudit.elements.map(hash));
                    const currSet = new Set(currAudit.elements.map(hash));

                    diffedNew.push({ ...currAudit, elements: currAudit.elements.filter(el => !baseSet.has(hash(el))) });
                    diffedResolved.push({ ...currAudit, elements: baseAudit.elements.filter(el => !currSet.has(hash(el))) }); 
                }
            }
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
            interaction: interactionObj,
            url: this.page.url(),
            execution_time_ms: executionTimeMs,
            screenshot_base64: screenshotBase64,
            health_scores: healthScores,
            new_findings: this.buildHierarchy(diffedNew, 'totalElemsNew'),
            resolved_findings: this.buildHierarchy(diffedResolved, 'totalElemsResolved')
        };

        this.lastSnapshot = currentSnapshot;
        this.auditTrail.push(logEntry);
        return logEntry;
    }

    async runBaseline(url, filters = {}, includeScreenshot = false, timingOpts = {}) {
        if (this.page.url() !== url) {
            await this.navigateSafely(url);
        }

        if (timingOpts.waitForSelector) {
            console.log(`[Audit] Waiting for selector: ${timingOpts.waitForSelector}...`);
            await this.page.waitForSelector(timingOpts.waitForSelector, { timeout: 15000 });
        }

        if (timingOpts.waitMs && timingOpts.waitMs > 0) {
            console.log(`[Audit] Waiting ${timingOpts.waitMs}ms for SPA hydration...`);
            await this.page.waitForTimeout(timingOpts.waitMs);
        }
        
        console.log('[Audit] Smooth scrolling to trigger lazy-loaded content...');
        await this.page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 250;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight - window.innerHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });
        
        await this.page.waitForTimeout(1500);
        await this.page.evaluate(() => window.scrollTo(0, 0));

        return await this.generateStepData(
            { action: "navigate", selector: "Initial Page Load" }, 
            filters, 
            includeScreenshot
        );
    }

    async interactAndAudit(step, filters = {}, includeScreenshot = false) {
        if (!this.page) throw new Error("Browser not initialized.");

        const waitForAuditComplete = this.page.evaluate(() => {
            return new Promise(resolve => {
                document.addEventListener('wick-audit-complete', resolve, { once: true });
                setTimeout(resolve, 2500); 
            });
        }).catch(() => {});

        await this.executeStep(step);
        await this.page.waitForLoadState('domcontentloaded').catch(() => {});
        await waitForAuditComplete;

        const interactionObj = {
            action: step.action,
            selector: step.target || 'active'
        };
        if (step.value !== undefined) {
            interactionObj.value = step.value;
        }

        return await this.generateStepData(
            interactionObj, 
            filters, 
            includeScreenshot
        );
    }

    getAuditTrail() {
        return {
            ...this.topLevelMetadata,
            audit_trail: this.auditTrail,
            audit_dictionary: this.auditDictionary
        };
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}