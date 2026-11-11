window.A11yCliAdapter = {
    run: function(requestedAudits = []) {
        const results = [];
        const config = window.A11Y_CONFIG;
        if (!config || !window.A11yUtils) return results;

        const allFeatures = [];
        config.tabs.forEach(t => t.categories.forEach(c => allFeatures.push(...c.features)));

        const targetFeatures = requestedAudits.length > 0
            ? allFeatures.filter(f => requestedAudits.includes(f.id))
            : allFeatures;

        targetFeatures.forEach(feature => {
            let elements = window.A11yUtils.querySelectorAllDeep(feature.selector).filter(window.A11yUtils.isElementVisible);
            
            if (feature.preprocessElements) {
                elements = feature.preprocessElements(elements);
            }

            // FIXED: The state object must be declared outside the elements loop!
            // This prevents massive performance hangs (e.g., v-disabled-focus re-parsing stylesheets 
            // for every single link) and prevents i-focus-order from resetting its counter.
            const state = {};

            elements.forEach(el => {
                const selector = window.A11yUtils.getCssSelector(el);
                
                // Proxy the callback to capture data instead of injecting UI
                const drawHighlightProxy = (target, color, text, legendType, borderStyle) => {
                    results.push({
                        featureId: feature.id,
                        label: feature.label,
                        severity: feature.severity || 'Info',
                        element: selector,
                        issueText: text,
                        legend: legendType
                    });
                };

                if (feature.customHighlight) {
                    feature.customHighlight(el, drawHighlightProxy, state);
                } else {
                    drawHighlightProxy(el, "#b00020", "Violation", "bad", "solid");
                }
            });
        });

        return results;
    }
};