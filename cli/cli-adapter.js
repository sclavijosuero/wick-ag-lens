window.A11yCliAdapter = {
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

    run: function(requestedAudits = [], framePrefix = "", frameDepth = 0) {
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

        const targetFeatures = requestedAudits.length > 0
            ? allFeatures.filter(f => requestedAudits.includes(f.feature.id))
            : allFeatures;

        targetFeatures.forEach(({ feature, categoryLabel, tabLabel }) => {
            const rawWhy = feature.info ? feature.info.why : '';
            
            // Build the base audit object (ensures empty audits are returned)
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
                    wcag_levels: feature.wcag || [],
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
                    if (feature.legends) {
                        const legObj = feature.legends.find(l => l.type === legendType);
                        if (legObj) humanLegend = legObj.label;
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

            results.push(auditObj);
        });

        return results;
    }
};