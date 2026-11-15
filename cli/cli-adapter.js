window.A11yCliAdapter = {
    WCAG_21_CRITERIA: new Set([
        '1.3.4', '1.3.5', '1.3.6',
        '1.4.10', '1.4.11', '1.4.12', '1.4.13',
        '2.1.4', '2.2.6', '2.3.3',
        '2.5.1', '2.5.2', '2.5.3', '2.5.4', '2.5.5', '2.5.6',
        '4.1.3'
    ]),

    WCAG_22_CRITERIA: new Set([
        '2.4.11', '2.4.12', '2.4.13',
        '2.5.7', '2.5.8',
        '3.2.6', '3.3.7', '3.3.8', '3.3.9'
    ]),

    getTagWcagVersion: function(tag) {
        const explicitVer = tag.match(/\b(2\.[012])\b/);
        if (explicitVer) return explicitVer[1];

        const compactVer = tag.match(/\bwcag2([012])?(?:aaa|aa|a)?\b/i);
        if (compactVer) return `2.${compactVer[1] || '0'}`;

        const scMatch = tag.match(/\b(\d+\.\d+\.\d+)\b/);
        if (scMatch) {
            const sc = scMatch[1];
            if (this.WCAG_22_CRITERIA.has(sc)) return '2.2';
            if (this.WCAG_21_CRITERIA.has(sc)) return '2.1';
            return '2.0';
        }

        const compactSc = tag.match(/\bwcag(\d)(\d)(\d+)\b/i);
        if (compactSc) {
            const sc = `${compactSc[1]}.${compactSc[2]}.${compactSc[3]}`;
            if (this.WCAG_22_CRITERIA.has(sc)) return '2.2';
            if (this.WCAG_21_CRITERIA.has(sc)) return '2.1';
            return '2.0';
        }

        return null;
    },

    getTagWcagLevel: function(tag) {
        const levelMatch = tag.match(/\((AAA|AA|A)\)|\b(AAA|AA|A)\b/i);
        if (levelMatch) return (levelMatch[1] || levelMatch[2]).toUpperCase();

        const compactLevel = tag.match(/\bwcag2[012]?(aaa|aa|a)\b/i);
        if (compactLevel) return compactLevel[1].toUpperCase();

        return null;
    },

    extractRawWcagTags: function(feature) {
        const raw = feature.wcag ?? feature.info?.wcag ?? feature.info?.wcag_levels ?? feature.tags;
        if (!raw) return [];

        const items = Array.isArray(raw) ? raw : [raw];
        const tags = [];

        items.forEach(item => {
            if (!item) return;
            if (typeof item === 'string') {
                item.split(/[,;]+/).forEach(part => {
                    const trimmed = part.trim();
                    if (trimmed) tags.push(trimmed);
                });
            } else if (typeof item === 'object') {
                const parts = [
                    item.version || item.wcagVersion || '',
                    item.criterion || item.sc || item.id || '',
                    item.level || item.wcagLevel || ''
                ].filter(Boolean);
                if (parts.length > 0) tags.push(parts.join(' '));
            }
        });

        return tags;
    },

    matchesWcagFilters: function(feature, wcagVersions, wcagLevels) {
        const tags = this.extractRawWcagTags(feature);
        if (tags.length === 0) return false;

        const parsed = tags.map(tag => ({
            ver: this.getTagWcagVersion(tag),
            lvl: this.getTagWcagLevel(tag)
        }));

        // Paired tags where at least one entry contains both version/criterion and level
        const pairedTags = parsed.filter(p => p.ver !== null && p.lvl !== null);
        if (pairedTags.length > 0) {
            return pairedTags.some(p => {
                const matchesVersion = wcagVersions.length === 0 || wcagVersions.includes(p.ver);
                const matchesLevel = wcagLevels.length === 0 || wcagLevels.includes(p.lvl);
                return matchesVersion && matchesLevel;
            });
        }

        // Split tags where version/criterion and level are separate array items
        const matchesVersion = wcagVersions.length === 0 || parsed.some(p => p.ver && wcagVersions.includes(p.ver));
        const matchesLevel = wcagLevels.length === 0 || parsed.some(p => p.lvl && wcagLevels.includes(p.lvl));
        return matchesVersion && matchesLevel;
    },

    getTruncatedHtml: function(el) {
        const isVoid = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(el.tagName);
        let rawTagStr = `<${el.tagName.toLowerCase()}`;
        for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            if (!attr.name.startsWith('data-a11y-')) {
                rawTagStr += ` ${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`;
            }
        }
        rawTagStr += '>';
        if (isVoid) return rawTagStr;
        if (el.children.length === 0 && el.textContent.trim().length > 0) {
            let txt = el.textContent.trim();
            if (txt.length > 60) txt = txt.substring(0, 60) + '...';
            return `${rawTagStr}${txt}</${el.tagName.toLowerCase()}>`;
        }
        return `${rawTagStr} ... </${el.tagName.toLowerCase()}>`;
    },

    stripHtml: function(html) {
        if (!html) return "";
        return html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
    },

    extractWcagLinks: function(html) {
        const links = [];
        if (!html) return links;
        const regex = /<a\s+(?:[^>]*?\s+)?href=['"]([^'"]+)['"][^>]*>([^<]+)<\/a>/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
            links.push({ url: match[1], title: match[2].trim() });
        }
        return links;
    },

    run: function(requestedAudits = [], framePrefix = "", frameDepth = 0, wcagVersions = [], wcagLevels = []) {
        const results = [];
        const config = window.A11Y_CONFIG;
        if (!config || !window.A11yUtils) return results;

        window.A11Y_FOCUS_PREFIX = framePrefix;
        window.A11Y_FRAME_DEPTH = frameDepth;

        const allFeatures = [];
        config.tabs.forEach(t => {
            const tabName = t.id === "tab-violations" ? "Violations & Warnings" : "Informative & Structure";
            t.categories.forEach(c => {
                c.features.forEach(f => {
                    allFeatures.push({ feature: f, categoryLabel: c.label, tabLabel: tabName });
                });
            });
        });

        const targetFeatures = allFeatures.filter(({ feature }) => {
            // 1. Explicit audit list takes baseline precedence
            if (requestedAudits.length > 0 && !requestedAudits.includes(feature.id)) {
                return false;
            }

            // 2. Omission means all versions and levels
            if (wcagVersions.length === 0 && wcagLevels.length === 0) {
                return true;
            }

            // 3. Strict AND intersection for WCAG metadata
            return this.matchesWcagFilters(feature, wcagVersions, wcagLevels);
        });

        targetFeatures.forEach(({ feature, categoryLabel, tabLabel }) => {
            const rawWhy = feature.info ? feature.info.why : '';
            const normalizedTags = this.extractRawWcagTags(feature);
            
            const auditObj = {
                tab: tabLabel,
                category: categoryLabel,
                auditId: feature.id,
                auditLabel: feature.label,
                severity: feature.severity || 'Informative',
                info: {
                    what: window.A11yCliAdapter.stripHtml(feature.info ? feature.info.what : ''),
                    why: window.A11yCliAdapter.stripHtml(rawWhy),
                    fix: window.A11yCliAdapter.stripHtml(feature.info && feature.info.fix ? feature.info.fix : ''),
                    wcag_levels: normalizedTags,
                    wcag_references: window.A11yCliAdapter.extractWcagLinks(rawWhy)
                },
                elements: []
            };

            let elements = window.A11yUtils.querySelectorAllDeep(feature.selector).filter(window.A11yUtils.isElementVisible);
            
            if (feature.preprocessElements) {
                elements = feature.preprocessElements(elements);
            }

            const state = {};

            elements.forEach(el => {
                const selector = window.A11yUtils.getCssSelector(el);
                const htmlSnippet = window.A11yCliAdapter.getTruncatedHtml(el);
                
                const drawHighlightProxy = (target, color, text, legendType, borderStyle) => {
                    let humanLegend = legendType;
                    let legendObj = null;

                    if (feature.legends) {
                        legendObj = feature.legends.find(l => l.type === legendType);
                        if (legendObj) humanLegend = legendObj.label;
                    }

                    // --- ELEMENT-LEVEL WCAG FILTERING ---
                    // If this specific legend has its own WCAG mapping, filter it against active CLI flags
                    if (legendObj && (legendObj.wcag || legendObj.tags) && (wcagVersions.length > 0 || wcagLevels.length > 0)) {
                        if (!window.A11yCliAdapter.matchesWcagFilters(legendObj, wcagVersions, wcagLevels)) {
                            return; // Skip element: its legend's WCAG level is disabled in the CLI flags
                        }
                    }

                    auditObj.elements.push({
                        selector: selector,
                        htmlSnippet: htmlSnippet,
                        issueText: text,
                        legend: humanLegend
                    });
                };

                if (feature.customHighlight) {
                    feature.customHighlight(el, drawHighlightProxy, state);
                } else {
                    drawHighlightProxy(el, "#b00020", "Violation", "bad", "solid");
                }
            });

            // Only include the audit in the JSON if it has surviving elements (or is focus order)
            if (auditObj.elements.length > 0 || feature.id === 'i-focus-order') {
                results.push(auditObj);
            }
        });

        return results;
    }
};