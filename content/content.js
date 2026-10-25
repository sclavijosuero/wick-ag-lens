const HIGHLIGHT_PADDING = 4;

// In-Memory Registry for instant O(1) positioning lookups during scroll/resize
const activeHighlightsMap = new Map();
// Map to keep track of active rules and their options so child iframes can auto-redraw
const lastRunState = new Map();

// Global Listener to catch iframe indexing from parent documents
window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'WICK_AG_LENS_SET_PREFIX') {
        if (window.A11Y_FOCUS_PREFIX !== event.data.prefix) {
            window.A11Y_FOCUS_PREFIX = event.data.prefix;
            window.A11Y_FRAME_DEPTH = event.data.depth;
            
            if (lastRunState.has('i-focus-order')) {
                const state = lastRunState.get('i-focus-order');
                requestAnimationFrame(() => {
                    runCheck('i-focus-order', state.activeLegends, state.options);
                });
            }
        }
    }
});

const pulsateStyle = document.createElement('style');
pulsateStyle.id = "a11y-inspector-styles";
pulsateStyle.textContent = `
    .a11y-inspector-box {
        opacity: 0.75;
        transition: opacity 0.15s ease, background-color 0.2s ease, box-shadow 0.2s ease;
    }
    .a11y-inspector-box:hover {
        opacity: 0.5;
        z-index: 2147483646 !important;
    }
    
    @media (prefers-reduced-motion: no-preference) {
        @keyframes a11y-spotlight-pulse {
            0%, 100% { box-shadow: 0 0 0 2px #ffffff, 0 0 0 6px var(--badge-bg); }
            50% { box-shadow: 0 0 0 2px #ffffff, 0 0 0 12px var(--badge-bg), 0 0 20px var(--badge-bg); }
        }
    }

    .a11y-box-active {
        box-shadow: 0 0 0 2px #ffffff, 0 0 0 6px var(--badge-bg);
        backdrop-filter: contrast(140%) brightness(1.15);
        -webkit-backdrop-filter: contrast(140%) brightness(1.15);
        z-index: 2147483647 !important;
        animation: a11y-spotlight-pulse 1.5s ease-in-out infinite; 
    }
    
    .a11y-badge-container {
        position: absolute;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 2px;
        transform: translateY(-100%);
        margin-top: -3px;
        z-index: 2147483645;
        pointer-events: none;
    }
    
    .a11y-container-active {
        z-index: 2147483647 !important;
    }
    
    .a11y-inspector-badge {
        position: relative;
        z-index: 1;
        background-color: var(--badge-bg);
        color: var(--badge-text, #ffffff);
        font-family: "Atkinson Hyperlegible", Verdana, Tahoma, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
        padding: 4px 8px;
        border-radius: 3px;
        white-space: nowrap;
        line-height: 1;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        opacity: 0.75; 
        pointer-events: auto;
        transform-origin: bottom left;
        transition: opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
    }
    
    .informative-badge {
        background-color: #202124 !important;
        color: #ffffff !important;
        border-left: 8px solid var(--badge-bg) !important;
        border-radius: 2px 3px 3px 2px !important;
        padding-left: 8px !important;
    }
    
    .a11y-inspector-badge:hover {
        opacity: 1 !important;
        transform: scale(1.15);
        cursor: crosshair;
    }
    
    .a11y-badge-active {
        opacity: 1 !important;
        transform: scale(1.15);
        box-shadow: 0 0 0 2px #fff, 0 4px 10px rgba(0,0,0,0.5) !important;
        z-index: 9999 !important;
    }

    .a11y-info-toast *:focus-visible {
        outline: 3px solid #8ab4f8 !important;
        outline-offset: 2px !important;
        border-radius: 2px;
    }

    .a11y-info-toast {
        position: fixed;
        width: 380px;
        background: rgba(24, 26, 27, 0.98);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: #f1f3f4;
        border: 1px solid #5f6368;
        border-left: 6px solid var(--badge-bg);
        border-radius: 8px;
        box-shadow: 0 15px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1);
        z-index: 2147483647 !important;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        padding: 20px;
        pointer-events: auto;
        animation: a11y-toast-in 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .a11y-info-toast h2 { 
        margin: 0 0 14px 0; 
        font-size: 15px; 
        font-weight: 700;
        color: #ffffff; 
        display: flex; 
        justify-content: space-between; 
        align-items: flex-start;
    }
    .a11y-info-toast .a11y-toast-close { 
        background: rgba(255,255,255,0.1); 
        border: 1px solid transparent; 
        border-radius: 4px;
        width: 28px;
        height: 28px;
        color: #f1f3f4; 
        cursor: pointer; 
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }
    .a11y-info-toast .a11y-toast-close:hover { 
        background: rgba(217, 48, 37, 0.2); 
        color: #ff8a80;
        border-color: #ff8a80;
    }
    
    .a11y-toast-selector-wrapper {
        position: relative;
        margin-bottom: 16px;
    }
    .a11y-info-toast .a11y-toast-selector { 
        font-family: monospace; 
        color: #a8c7fa; 
        word-break: break-all; 
        margin: 0; 
        font-size: 12px; 
        background: rgba(0,0,0,0.5); 
        padding: 8px 34px 8px 10px; 
        border-radius: 6px; 
        border: 1px solid #5f6368;
    }
    
    .a11y-toast-code-container {
        position: relative;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid #5f6368;
        border-radius: 6px;
        margin-bottom: 16px;
    }
    .a11y-toast-code-container pre {
        margin: 0;
        padding: 10px 34px 10px 10px;
        max-height: 100px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
    }
    .a11y-toast-code-container pre::-webkit-scrollbar { width: 6px; }
    .a11y-toast-code-container pre::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 6px; }
    .a11y-toast-code-container pre::-webkit-scrollbar-thumb { background: #5f6368; border-radius: 6px; }
    .a11y-toast-code-container pre::-webkit-scrollbar-thumb:hover { background: #8ab4f8; }

    .a11y-toast-code-container code {
        font-family: 'ui-monospace', 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace !important;
        color: #a8c7fa !important;
        font-size: 12px !important;
        background: none !important;
        border: none !important;
        padding: 0 !important;
    }

    .a11y-toast-copy-btn {
        position: absolute;
        top: 6px;
        right: 6px;
        background: rgba(255,255,255,0.1);
        border: 1px solid transparent;
        color: #f1f3f4;
        border-radius: 4px;
        width: 24px;
        height: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        transition: all 0.2s;
    }
    .a11y-toast-copy-btn:hover {
        background: rgba(168, 199, 250, 0.2);
        color: #a8c7fa;
    }
    
    .a11y-info-toast code {
        font-family: 'ui-monospace', 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
        background: rgba(168, 199, 250, 0.15);
        color: #a8c7fa;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        border: 1px solid rgba(168, 199, 250, 0.2);
    }
    
    .a11y-info-toast-section-title { 
        display: block; 
        margin-bottom: 6px; 
        font-weight: 700;
        text-transform: uppercase; 
        letter-spacing: 0.5px;
        font-size: 11px;
        color: #9aa0a6;
    }
    .a11y-info-toast p { 
        margin: 0 0 16px 0; 
        line-height: 1.5; 
        color: #f1f3f4;
    }
    .a11y-info-toast p:last-child { margin-bottom: 0; }
    .a11y-info-toast strong { color: #ffffff; font-weight: 700; }
    .a11y-info-toast a { 
        color: #a8c7fa; 
        text-decoration: underline; 
        text-underline-offset: 2px;
        font-weight: 600;
    }
    .a11y-info-toast a:hover { text-decoration-thickness: 2px; }
    
    .a11y-toast-severity {
        font-size: 10px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .severity-critical { background-color: #d93025; color: #ffffff; }
    .severity-serious  { background-color: #f29900; color: #202124; }
    .severity-moderate { background-color: #fbbc04; color: #202124; }
    .severity-minor    { background-color: #1a73e8; color: #ffffff; }
    
    @keyframes a11y-toast-in { 
        from { transform: scale(0.95); opacity: 0; } 
        to { transform: scale(1); opacity: 1; } 
    }
`;
document.head.appendChild(pulsateStyle);

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'a11y-panel') {
        port.onDisconnect.addListener(() => {
            cleanupAllHighlights();
            clearSimulationFilters();
        });
    }
});

function cleanupAllHighlights() {
    const overlay = document.getElementById("a11y-inspector-overlay");
    if (overlay) overlay.remove();

    const activeToast = document.getElementById('a11y-info-toast');
    if (activeToast) activeToast.remove();

    activeHighlightsMap.forEach((entry) => {
        targetResizeObserver.unobserve(entry.targetEl);
        const attrsToRemove = [];
        for (let i = 0; i < entry.targetEl.attributes.length; i++) {
            if (entry.targetEl.attributes[i].name.startsWith('data-a11y-target')) {
                attrsToRemove.push(entry.targetEl.attributes[i].name);
            }
        }
        attrsToRemove.forEach(attr => entry.targetEl.removeAttribute(attr));
        delete entry.targetEl.dataset.a11yTargetId;
    });
    activeHighlightsMap.clear();
    lastRunState.clear(); 
}

// =============================================================================
// DISABILITY SIMULATION ENGINE (SVG Filters, Field Loss Masks)
// =============================================================================
function ensureSvgFilterContainer() {
    let svgContainer = document.getElementById("a11y-sim-svg-container");
    if (!svgContainer) {
        svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgContainer.id = "a11y-sim-svg-container";
        svgContainer.style.position = "absolute";
        svgContainer.style.width = "0";
        svgContainer.style.height = "0";
        svgContainer.style.overflow = "hidden";

        // Inject SVG Color Matrices & Offset Filters
        svgContainer.innerHTML = `
            <defs>
                <!-- Protanopia (LinearRGB Viénot model) -->
                <filter id="a11y-filter-protanopia" color-interpolation-filters="linearRGB">
                    <feColorMatrix type="matrix" values="
                        0.56667, 0.43333, 0.00000, 0, 0
                        0.55833, 0.44167, 0.00000, 0, 0
                        0.00000, 0.24167, 0.75833, 0, 0
                        0,       0,       0,       1, 0" />
                </filter>

                <!-- Deuteranopia (LinearRGB Viénot model) -->
                <filter id="a11y-filter-deuteranopia" color-interpolation-filters="linearRGB">
                    <feColorMatrix type="matrix" values="
                        0.62500, 0.37500, 0.00000, 0, 0
                        0.70000, 0.30000, 0.00000, 0, 0
                        0.00000, 0.30000, 0.70000, 0, 0
                        0,       0,       0,       1, 0" />
                </filter>

                <!-- Tritanopia (Linear Least-Squares Approximation) -->
                <filter id="a11y-filter-tritanopia" color-interpolation-filters="linearRGB">
                    <feColorMatrix type="matrix" values="
                        0.95000, 0.05000, 0.00000, 0, 0
                        0.00000, 0.43333, 0.56667, 0, 0
                        0.00000, 0.47500, 0.52500, 0, 0
                        0,       0,       0,       1, 0" />
                </filter>

                <!-- Achromatopsia (Monochromacy - WCAG Luminance) -->
                <filter id="a11y-filter-achromatopsia" color-interpolation-filters="linearRGB">
                    <feColorMatrix type="matrix" values="
                        0.2126, 0.7152, 0.0722, 0, 0
                        0.2126, 0.7152, 0.0722, 0, 0
                        0.2126, 0.7152, 0.0722, 0, 0
                        0,      0,      0,      1, 0" />
                </filter>

                <!-- Double Vision (Diplopia SVG Offset with feMerge) -->
                <filter id="a11y-filter-diplopia" color-interpolation-filters="sRGB">
                    <feOffset id="a11y-diplopia-offset" dx="6" dy="2" in="SourceGraphic" result="offset1" />
                    <feComponentTransfer in="offset1" result="opacity1">
                        <feFuncA type="linear" slope="0.55" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode in="SourceGraphic" />
                        <feMergeNode in="opacity1" />
                    </feMerge>
                </filter>
                
                <!-- Yellowing (Aging Lens) -->
                <filter id="a11y-filter-yellowing" color-interpolation-filters="sRGB">
                    <feColorMatrix id="a11y-yellowing-matrix" type="matrix" values="
                        1, 0, 0, 0, 0
                        0, 1, 0, 0, 0
                        0, 0, 1, 0, 0
                        0, 0, 0, 1, 0" />
                </filter>
            </defs>
        `;
        document.documentElement.appendChild(svgContainer);
    }
    return svgContainer;
}

function ensureFieldLossMask() {
    let maskOverlay = document.getElementById("a11y-sim-field-mask");
    if (!maskOverlay) {
        maskOverlay = document.createElement("div");
        maskOverlay.id = "a11y-sim-field-mask";
        
        if (HTMLElement.prototype.hasOwnProperty("popover")) {
            maskOverlay.setAttribute("popover", "manual");
        }
        
        maskOverlay.style.position = "fixed";
        maskOverlay.style.top = "0";
        maskOverlay.style.left = "0";
        maskOverlay.style.width = "100vw";
        maskOverlay.style.height = "100vh";
        maskOverlay.style.pointerEvents = "none";
        maskOverlay.style.zIndex = "2147483646";
        maskOverlay.style.margin = "0";
        maskOverlay.style.padding = "0";
        maskOverlay.style.border = "none";
        maskOverlay.style.background = "transparent";
        maskOverlay.style.display = "none";

        document.documentElement.appendChild(maskOverlay);

        if (maskOverlay.showPopover) {
            try { maskOverlay.showPopover(); } catch(e) {}
        }
    }
    return maskOverlay;
}

function clearSimulationFilters() {
    document.documentElement.style.filter = "";

    const maskOverlay = document.getElementById("a11y-sim-field-mask");
    if (maskOverlay) {
        maskOverlay.style.display = "none";
    }

    const svgContainer = document.getElementById("a11y-sim-svg-container");
    if (svgContainer) svgContainer.remove();
}

function getSafeFilterUrl(id) {
    // Strips out any existing URL hash logic to ensure absolute SVG filter resolution
    return `url('${window.location.href.split('#')[0]}#${id}')`;
}

function applyDisabilitySimulation(state) {
    clearSimulationFilters();
    if (!state) return;

    // 1. COLOR BLINDNESS CATEGORY
    if (state.category === "colorBlindness") {
        if (state.colorBlindness && state.colorBlindness !== "none") {
            ensureSvgFilterContainer();
            document.documentElement.style.filter = getSafeFilterUrl(`a11y-filter-${state.colorBlindness}`);
        }
        return;
    }

    // 2. IMPAIRED VISION CATEGORY (Stackable)
    if (state.category === "impairedVision") {
        const iv = state.impairedVision;
        if (!iv) return;

        const filterParts = [];

        // A. Double Vision (Diplopia %) - Ensure it's executed first in the chain
        if (iv.diplopia > 0) {
            ensureSvgFilterContainer();
            const offsetPx = (iv.diplopia / 100) * 14 + 2; // 2px to 16px shift
            const offsetEl = document.getElementById("a11y-diplopia-offset");
            if (offsetEl) {
                offsetEl.setAttribute("dx", offsetPx.toFixed(1));
                offsetEl.setAttribute("dy", (offsetPx * 0.3).toFixed(1));
            }
            filterParts.push(getSafeFilterUrl('a11y-filter-diplopia'));
        }

        // B. Yellowing (Aging Lens) via SVG blue-absorption matrix
        if (iv.yellowing > 0) {
            ensureSvgFilterContainer();
            // True nuclear sclerosis biologically absorbs blue light heavily.
            const blueMultiplier = 1 - (iv.yellowing / 100) * 0.85; 
            const redMultiplier = 1 - (iv.yellowing / 100) * 0.15; 
            const yellowEl = document.getElementById("a11y-yellowing-matrix");
            if (yellowEl) {
                yellowEl.setAttribute("values", `
                    ${redMultiplier} 0 0 0 0
                    0 1 0 0 0
                    0 0 ${blueMultiplier} 0 0
                    0 0 0 1 0
                `);
            }
            filterParts.push(getSafeFilterUrl('a11y-filter-yellowing'));
        }

        // C. Cataracts Blur (%)
        if (iv.cataracts > 0) {
            const blurPx = (iv.cataracts / 100) * 8; // 0px to 8px
            const contrastDrop = 100 - (iv.cataracts * 0.35); // 100% down to 65%
            const sepiaAdd = iv.cataracts * 0.25; // 0% to 25%
            filterParts.push(`blur(${blurPx.toFixed(1)}px) contrast(${contrastDrop.toFixed(0)}%) sepia(${sepiaAdd.toFixed(0)}%)`);
        }

        // D. Loss of Contrast (%)
        if (iv.contrast > 0) {
            const contrastVal = 100 - (iv.contrast * 0.8); // 100% down to 20%
            filterParts.push(`contrast(${contrastVal.toFixed(0)}%)`);
        }

        if (filterParts.length > 0) {
            document.documentElement.style.filter = filterParts.join(" ");
        }

        // E. Field Loss Mask (Peripheral vs Central %)
        if (iv.fieldLossType && iv.fieldLossType !== "none" && iv.fieldLossVal > 0) {
            const maskOverlay = ensureFieldLossMask();
            maskOverlay.style.display = "block";

            if (iv.fieldLossType === "peripheral") {
                // Tunnel Vision: Transparent center, black edges (Closer bounding for accuracy)
                const tunnelRadius = 60 - (iv.fieldLossVal * 0.55); // 60% down to 5%
                maskOverlay.style.background = `radial-gradient(circle at center, transparent ${tunnelRadius.toFixed(0)}%, rgba(0,0,0,0.98) ${(tunnelRadius + 15).toFixed(0)}%)`;
            } else if (iv.fieldLossType === "central") {
                // Macular Loss: Black center, transparent edges (Small biological blind spot)
                const blindRadius = iv.fieldLossVal * 0.20; // 0% to 20% max coverage
                maskOverlay.style.background = `radial-gradient(circle at center, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.92) ${blindRadius.toFixed(0)}%, transparent ${(blindRadius + 10).toFixed(0)}%)`;
            }
        }
    }
}

function getCssSelector(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
    const testAttrs = ['data-cy', 'data-testid', 'data-test-id', 'data-test', 'data-qa', 'data-element', 'data-target'];
    for (let attr of testAttrs) {
        if (el.hasAttribute(attr)) return `[${attr}="${el.getAttribute(attr)}"]`;
    }
    if (el.id) return '#' + el.id;

    let path = [];
    let current = el;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
        let testAttrFound = false;
        for (let attr of testAttrs) {
            if (current.hasAttribute(attr)) {
                path.unshift(`[${attr}="${current.getAttribute(attr)}"]`);
                testAttrFound = true;
                break;
            }
        }
        if (testAttrFound) break;

        if (current.id) {
            path.unshift('#' + current.id);
            break;
        }

        let selector = current.nodeName.toLowerCase();
        let sibling = current;
        let nth = 1;
        while (sibling = sibling.previousElementSibling) {
            if (sibling.nodeName.toLowerCase() === selector) nth++;
        }

        if (nth !== 1 || current.nextElementSibling) selector += `:nth-of-type(${nth})`;
        path.unshift(selector);

        if (current.parentNode instanceof ShadowRoot) {
            current = current.parentNode.host;
            path.unshift('>>>');
        } else {
            current = current.parentNode;
        }
    }
    return path.join(' > ').replace(/ > >>> > /g, ' >>> ');
}

function getFeatureConfig(featureId) {
    if (!window.A11Y_CONFIG) return null;
    for (let tab of window.A11Y_CONFIG.tabs) {
        for (let cat of tab.categories) {
            for (let f of cat.features) {
                if (f.id === featureId) return { feature: f, category: cat, tab: tab };
            }
        }
    }
    return null;
}

function querySelectorAllDeep(selector, root = document) {
    const results = [];
    function traverse(node) {
        if (!node) return;
        if (node.nodeType === Node.ELEMENT_NODE) {
            
            if (node.id === 'a11y-inspector-overlay' || node.id === 'a11y-info-toast' || node.id === 'panel-toast' || node.id === 'a11y-sim-field-mask') {
                return; 
            }

            if (node.matches && node.matches(selector)) {
                results.push(node);
            }
            if (node.shadowRoot) {
                for (let child of node.shadowRoot.children) {
                    traverse(child);
                }
            }
        }
        for (let child of node.children) {
            traverse(child);
        }
    }
    const startNode = (root === document) ? (document.documentElement || document.body) : root;
    if (startNode) traverse(startNode);
    return results;
}

function isElementVisible(element) {
    if (!element || element.nodeType !== 1) return false;
    let currentElement = element;
    
    while (currentElement && currentElement !== document) {
        if (currentElement.nodeType === Node.ELEMENT_NODE) {
            if (currentElement.hasAttribute('inert') || currentElement.hasAttribute('hidden')) {
                return false;
            }

            if (currentElement.tagName && currentElement.tagName.toLowerCase() === 'dialog' && !currentElement.hasAttribute('open')) {
                return false;
            }

            const win = currentElement.ownerDocument.defaultView || window;
            const style = win.getComputedStyle(currentElement);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                return false;
            }
        }
        
        if (currentElement.assignedSlot) {
            currentElement = currentElement.assignedSlot;
        } else if (currentElement.parentNode instanceof ShadowRoot) {
            currentElement = currentElement.parentNode.host;
        } else if (currentElement.parentNode === currentElement.ownerDocument) {
            const win = currentElement.ownerDocument.defaultView;
            if (win) {
                try {
                    currentElement = win.frameElement ? win.frameElement : null; 
                } catch(e) {
                    currentElement = null; 
                }
            } else {
                currentElement = null;
            }
        } else {
            currentElement = currentElement.parentNode; 
        }
    }

    return true;
}

function getContainerClippingBounds(element) {
    let current = element.parentElement;
    let minTop = -Infinity;
    let maxBottom = Infinity;
    let minLeft = -Infinity;
    let maxRight = Infinity;

    while (current && current !== document.body && current !== document.documentElement) {
        if (current.nodeType === Node.ELEMENT_NODE) {
            const win = current.ownerDocument.defaultView || window;
            const style = win.getComputedStyle(current);
            const overflowY = style.overflowY;
            const overflowX = style.overflowX;
            
            const isScrollable = (
                overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden' || 
                overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden'
            );

            if (isScrollable) {
                const rect = current.getBoundingClientRect();
                minTop = Math.max(minTop, rect.top);
                maxBottom = Math.min(maxBottom, rect.bottom);
                minLeft = Math.max(minLeft, rect.left);
                maxRight = Math.min(maxRight, rect.right);
            }
        }
        current = current.parentElement;
    }
    return { minTop, maxBottom, minLeft, maxRight };
}

function ensureOverlay() {
    let overlay = document.getElementById("a11y-inspector-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "a11y-inspector-overlay";
        
        if (HTMLElement.prototype.hasOwnProperty("popover")) {
            overlay.setAttribute("popover", "manual");
        }
        
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "0";
        overlay.style.height = "0";
        overlay.style.overflow = "visible";
        overlay.style.pointerEvents = "none";
        overlay.style.zIndex = "2147483647"; 
        
        overlay.style.margin = "0";
        overlay.style.padding = "0";
        overlay.style.border = "none";
        overlay.style.background = "transparent";
        
        document.documentElement.appendChild(overlay); 
        
        if (overlay.showPopover) {
            try { overlay.showPopover(); } catch(e) {}
        }
        
        // Add dedicated SVG layer for lines (e.g. Focus Order path)
        let svgLines = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgLines.id = "a11y-inspector-lines";
        svgLines.setAttribute("width", "1");
        svgLines.setAttribute("height", "1");
        svgLines.style.overflow = "visible";
        svgLines.style.position = "absolute";
        svgLines.style.top = "0";
        svgLines.style.left = "0";
        svgLines.style.pointerEvents = "none";
        svgLines.style.zIndex = "2147483644"; // Sits below HTML badges
        overlay.appendChild(svgLines);
    }
    return overlay;
}

const targetResizeObserver = new ResizeObserver(() => {
    repositionHighlights();
});

let isRepositioning = false;
function repositionHighlights() {
    if (isRepositioning) return;
    isRepositioning = true;
    
    requestAnimationFrame(() => {
        const overlay = document.getElementById("a11y-inspector-overlay");
        const svgLines = document.getElementById("a11y-inspector-lines");

        // Fast-fail cleanup if no audits are active
        if (!overlay || activeHighlightsMap.size === 0) {
            if (svgLines) {
                while (svgLines.firstChild) {
                    svgLines.removeChild(svgLines.firstChild);
                }
            }
            isRepositioning = false;
            return;
        }

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        const updates = [];
        const focusNodes = []; // Storage for Focus Order paths
        
        const focusState = lastRunState.get('i-focus-order');
        const showPath = focusState && focusState.options ? focusState.options['opt-show-path'] !== false : true;

        activeHighlightsMap.forEach((entry, uniqueId) => {
            const targetEl = entry.targetEl;

            if (!targetEl || !document.contains(targetEl)) {
                updates.push({ entry, uniqueId, isDead: true });
                return;
            }

            const rect = targetEl.getBoundingClientRect();

            if (rect.width === 0 || rect.height === 0 || !isElementVisible(targetEl)) {
                updates.push({ entry, uniqueId, isVisible: false });
                return;
            }

            const clip = getContainerClippingBounds(targetEl);
            const isClippedOut = (
                rect.bottom <= clip.minTop || 
                rect.top >= clip.maxBottom || 
                rect.right <= clip.minLeft || 
                rect.left >= clip.maxRight
            );

            let top = rect.top + scrollTop;
            let left = rect.left + scrollLeft;
            let width = rect.width;
            let height = rect.height;

            let badgeTop = top - HIGHLIGHT_PADDING;
            let badgeLeft = left - HIGHLIGHT_PADDING;

            updates.push({ entry, uniqueId, isVisible: true, isClippedOut, top, left, width, height, badgeTop, badgeLeft });
            
            // Register coordinates for Focus Order routing
            if (entry.boxes.has('i-focus-order') && showPath) {
                const box = entry.boxes.get('i-focus-order');
                focusNodes.push({
                    label: box.dataset.label,
                    color: box.dataset.color,
                    cx: left + (width / 2),
                    cy: top + (height / 2)
                });
            }
        });

        updates.forEach(u => {
            if (u.isDead) {
                u.entry.boxes.forEach(box => box.remove());
                if (u.entry.badgeContainer) u.entry.badgeContainer.remove();
                activeHighlightsMap.delete(u.uniqueId);
                return;
            }

            if (!u.isVisible) {
                u.entry.boxes.forEach(box => { box.style.visibility = 'hidden'; });
                if (u.entry.badgeContainer) u.entry.badgeContainer.style.visibility = 'hidden';
                return;
            }

            u.entry.boxes.forEach(box => {
                box.style.visibility = 'visible';
                box.style.top = `${u.top}px`;
                box.style.left = `${u.left}px`;
                box.style.width = `${u.width}px`;
                box.style.height = `${u.height}px`;

                if (u.isClippedOut) {
                    box.style.opacity = '0.35';
                    box.style.outlineStyle = 'dashed';
                    const hatchColor = box.dataset.color || '#ffffff';
                    box.style.backgroundImage = `repeating-linear-gradient(45deg, ${hatchColor} 0, ${hatchColor} 2px, transparent 2px, transparent 8px)`;
                } else {
                    box.style.opacity = ''; 
                    box.style.outlineStyle = box.dataset.originalBorderStyle || 'solid';
                    box.style.backgroundImage = 'none';
                }
            });

            if (u.entry.badgeContainer) {
                u.entry.badgeContainer.style.visibility = 'visible';
                u.entry.badgeContainer.style.top = `${u.badgeTop}px`;
                u.entry.badgeContainer.style.left = `${u.badgeLeft}px`;

                const badges = u.entry.badgeContainer.querySelectorAll('.a11y-inspector-badge');
                badges.forEach(b => {
                    const origText = b.dataset.originalText;
                    if (u.isClippedOut) {
                        b.style.opacity = '0.4';
                        if (origText && !b.textContent.startsWith('[Hidden]')) {
                            b.textContent = `[Hidden] ${origText}`;
                        }
                    } else {
                        b.style.opacity = ''; 
                        if (origText && b.textContent !== origText) {
                            b.textContent = origText;
                        }
                    }
                });
            }
        });
        
        // Re-draw SVG connecting lines for Focus Order
        if (svgLines) {
            // Safely clear existing nodes to avoid innerHTML parsing conflicts
            while (svgLines.firstChild) {
                svgLines.removeChild(svgLines.firstChild);
            }

            if (focusNodes.length > 1) {
                // Sort hierarchically based on badge labels (e.g. #1, #2, #3.1)
                focusNodes.sort((a, b) => {
                    const regex = /#(\d+(?:\.\d+)*):/;
                    const matchA = a.label.match(regex);
                    const matchB = b.label.match(regex);
                    if (matchA && matchB) {
                        const hA = matchA[1].split('.').map(Number);
                        const hB = matchB[1].split('.').map(Number);
                        const len = Math.max(hA.length, hB.length);
                        for (let i = 0; i < len; i++) {
                            const valA = hA[i] !== undefined ? hA[i] : -1;
                            const valB = hB[i] !== undefined ? hB[i] : -1;
                            if (valA !== valB) return valA - valB;
                        }
                    }
                    return 0;
                });
                
                const pointsStr = focusNodes.map(n => `${n.cx},${n.cy}`).join(' ');
                
                // 1. Solid background line (white buffer)
                const bgLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                bgLine.setAttribute("points", pointsStr);
                bgLine.setAttribute("fill", "none");
                bgLine.setAttribute("stroke", "#ffffff");
                bgLine.setAttribute("stroke-width", "6");

                // 2. Solid foreground line (Valid Focus color)
                const fgLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                fgLine.setAttribute("points", pointsStr);
                fgLine.setAttribute("fill", "none");
                fgLine.setAttribute("stroke", "#9c27b0"); 
                fgLine.setAttribute("stroke-width", "2.5");
                
                svgLines.appendChild(bgLine);
                svgLines.appendChild(fgLine);

                // 3. Draw dynamic numerical pills at vertices matching the target's legend color
                focusNodes.forEach(n => {
                    const match = n.label.match(/#(\d+(?:\.\d+)*)/);
                    const stepNum = match ? match[1] : "";
                    const charCount = stepNum.length;
                    
                    // Dynamic width calc: Minimum 24px (for a circle), expanding dynamically for decimals
                    const rectWidth = Math.max(24, charCount * 7.5 + 10); 

                    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
                    
                    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    rect.setAttribute("x", n.cx - (rectWidth / 2));
                    rect.setAttribute("y", n.cy - 12);
                    rect.setAttribute("width", rectWidth);
                    rect.setAttribute("height", "24");
                    rect.setAttribute("rx", "12"); 
                    rect.setAttribute("ry", "12");
                    rect.setAttribute("fill", n.color);
                    rect.setAttribute("stroke", "#ffffff");
                    rect.setAttribute("stroke-width", "2");
                    rect.style.filter = "drop-shadow(0px 1px 2px rgba(0,0,0,0.4))";

                    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    t.setAttribute("x", n.cx);
                    t.setAttribute("y", n.cy);
                    t.setAttribute("fill", getTextColor(n.color));
                    t.setAttribute("font-family", '"Atkinson Hyperlegible", Verdana, Tahoma, sans-serif');
                    t.setAttribute("font-size", "11");
                    t.setAttribute("font-weight", "bold");
                    t.setAttribute("text-anchor", "middle");
                    t.setAttribute("dominant-baseline", "central");
                    t.setAttribute("dy", "1"); 
                    t.textContent = stepNum;

                    g.appendChild(rect);
                    g.appendChild(t);
                    svgLines.appendChild(g);
                });
            }
        }

        isRepositioning = false;
    });
}

window.addEventListener("scroll", repositionHighlights, { passive: true, capture: true });
window.addEventListener("resize", repositionHighlights, { passive: true });

// Dual-Debounce DOM Mutation Logic
let lastUrl = window.location.href;
let mutationDebounceTimer = null;
let domSyncDebounceTimer = null;

const domMutationObserver = new MutationObserver((mutations) => {
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        requestStateSync();
        return;
    }

    let hasRelevantMutation = false;
    let needsRescan = false;

    for (let m of mutations) {
        if (m.target && (m.target.id === 'a11y-inspector-overlay' || (m.target.closest && m.target.closest('#a11y-inspector-overlay')))) continue;
        if (m.target && (m.target.id === 'a11y-sim-svg-container' || m.target.id === 'a11y-sim-field-mask')) continue;
        if (m.type === 'attributes' && m.attributeName && m.attributeName.startsWith('data-a11y')) continue;
        
        hasRelevantMutation = true;
        
        if (m.type === 'childList' && (m.addedNodes.length > 0 || m.removedNodes.length > 0)) {
            needsRescan = true; 
        } else if (m.type === 'attributes') {
            needsRescan = true; 
        }
    }
    
    if (!hasRelevantMutation) return;

    if (mutationDebounceTimer) clearTimeout(mutationDebounceTimer);
    mutationDebounceTimer = setTimeout(() => {
        repositionHighlights();
    }, 50);

    if (needsRescan && lastRunState.size > 0) {
        if (domSyncDebounceTimer) clearTimeout(domSyncDebounceTimer);
        domSyncDebounceTimer = setTimeout(() => {
            const overlay = document.getElementById("a11y-inspector-overlay");
            if (overlay && overlay.showPopover) {
                try { overlay.hidePopover(); overlay.showPopover(); } catch(e) {}
            }
            
            // NEW: Ensure toast is promoted above the overlay during soft resyncs
            const activeToast = document.getElementById('a11y-info-toast');
            if (activeToast && activeToast.showPopover) {
                try { activeToast.hidePopover(); activeToast.showPopover(); } catch(e) {}
            }
            
            try { chrome.runtime.sendMessage({ action: "softResync" }); } catch (e) {}
        }, 750);
    }
});

if (document.body) {
    domMutationObserver.observe(document.body, { 
        attributes: true, 
        childList: true, 
        subtree: true,
        attributeFilter: ['class', 'style', 'hidden', 'disabled', 'inert', 'aria-hidden', 'aria-expanded', 'open', 'data-state']
    });
}

function clearHighlights(featureId, preserveToast = false) {
    const activeToast = document.getElementById('a11y-info-toast');
    const activeTargetId = activeToast ? activeToast.dataset.targetId : null;

    activeHighlightsMap.forEach((entry, uniqueId) => {
        if (entry.boxes.has(featureId)) {
            entry.boxes.get(featureId).remove();
            entry.boxes.delete(featureId);
        }

        if (entry.badgeContainer) {
            const badges = entry.badgeContainer.querySelectorAll(`.a11y-inspector-badge[data-feature="${featureId}"]`);
            badges.forEach(b => b.remove());
            if (entry.badgeContainer.children.length === 0) {
                entry.badgeContainer.remove();
                entry.badgeContainer = null;
            }
        }

        entry.targetEl.removeAttribute(`data-a11y-target-${featureId}`);

        if (entry.boxes.size === 0) {
            // FIX: If preserving the toast, DO NOT delete the target ID mapping
            if (preserveToast && activeTargetId === uniqueId) {
                // Do nothing, leave it in the map so it can reconnect when redrawn
            } else {
                targetResizeObserver.unobserve(entry.targetEl);
                delete entry.targetEl.dataset.a11yTargetId;
                activeHighlightsMap.delete(uniqueId);
            }
        }
    });

    const markedElements = querySelectorAllDeep(`[data-a11y-target-${featureId}]`);
    markedElements.forEach(el => {
        el.removeAttribute(`data-a11y-target-${featureId}`);
    });

    if (!preserveToast) {
        if (activeToast && activeToast.dataset.feature === featureId) {
            activeToast.remove();
        }
    }
    
    // Explicitly call to erase any SVG paths or graphics immediately
    requestAnimationFrame(() => repositionHighlights());
}

function getTextColor(hexColor) {
    if (!hexColor) return '#ffffff';
    const hex = hexColor.replace('#', '');
    if (hex.length !== 6) return '#ffffff';
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#202124' : '#ffffff';
}

function formatLabel(legend, label) {
    const l1 = (legend || '').trim();
    const l2 = (label || '').trim();
    if (l1 && l2) {
        if (l1.toLowerCase() === l2.toLowerCase()) return l1;
        return `${l1}: ${l2}`;
    }
    return l1 || l2 || 'INFO';
}

function drawHighlight(el, color, text, featureId, legendType = "default", borderStyle = "solid") {
    const overlay = ensureOverlay();
    const rect = el.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    el.setAttribute(`data-a11y-target-${featureId}`, "true");

    let uniqueId = el.dataset.a11yTargetId;
    if (!uniqueId) {
        uniqueId = 'a11y-target-' + Math.random().toString(36).substr(2, 9);
        el.dataset.a11yTargetId = uniqueId;
    }

    if (!activeHighlightsMap.has(uniqueId)) {
        activeHighlightsMap.set(uniqueId, {
            targetEl: el,
            boxes: new Map(),
            badgeContainer: null
        });
    }
    const entry = activeHighlightsMap.get(uniqueId);

    let legendLabel = legendType;
    let legendTypeAttr = legendType;
    const configData = getFeatureConfig(featureId);
    if (configData && configData.feature.legends) {
        const leg = configData.feature.legends.find(l => l.type === legendType);
        if (leg) legendLabel = leg.label;
    }

    if (entry.boxes.has(featureId)) {
        entry.boxes.get(featureId).remove();
    }

    const box = document.createElement("div");
    box.className = "a11y-inspector-box";
    box.setAttribute("data-feature", featureId);
    box.setAttribute("data-legend", legendType);

    box.dataset.a11yTargetId = uniqueId;
    box.dataset.ruleId = featureId;
    box.dataset.selector = getCssSelector(el);
    box.dataset.label = text; 
    box.dataset.legendLabel = legendLabel;
    box.dataset.legendType = legendTypeAttr; 
    box.dataset.color = color;
    box.dataset.originalBorderStyle = borderStyle; 

    box.style.display = "block";
    box.style.margin = "0";
    box.style.padding = "0";
    box.style.position = "absolute";
    box.style.top = `${rect.top + scrollTop}px`;
    box.style.left = `${rect.left + scrollLeft}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;
    
    box.style.border = `none`;
    box.style.outline = `3px ${borderStyle} ${color}`;
    box.style.outlineOffset = `${HIGHLIGHT_PADDING}px`;
    
    box.style.boxSizing = "border-box";
    box.style.backgroundColor = "transparent";
    box.style.borderRadius = "3px";
    box.style.pointerEvents = "none";

    overlay.appendChild(box);
    entry.boxes.set(featureId, box);

    if (!entry.badgeContainer || !document.contains(entry.badgeContainer)) {
        let badgeContainer = overlay.querySelector(`.a11y-badge-container[data-a11y-target-id="${uniqueId}"]`);
        if (!badgeContainer) {
            badgeContainer = document.createElement("div");
            badgeContainer.className = "a11y-badge-container";
            badgeContainer.dataset.a11yTargetId = uniqueId;
            badgeContainer.style.top = `${rect.top + scrollTop - HIGHLIGHT_PADDING}px`;
            badgeContainer.style.left = `${rect.left + scrollLeft - HIGHLIGHT_PADDING}px`;
            overlay.appendChild(badgeContainer);
        }
        entry.badgeContainer = badgeContainer;
    }

    const existingBadge = entry.badgeContainer.querySelector(`.a11y-inspector-badge[data-feature="${featureId}"]`);
    if (existingBadge) existingBadge.remove();

    const badge = document.createElement("div");
    badge.className = "a11y-inspector-badge";
    
    if (configData && configData.tab && configData.tab.id === 'tab-informative') {
        badge.classList.add('informative-badge');
    }

    badge.setAttribute("data-feature", featureId); 
    badge.dataset.legendLabel = legendLabel; 
    badge.dataset.originalText = text; 
    badge.textContent = text; 
    
    badge.style.setProperty('--badge-bg', color); 
    badge.style.setProperty('--badge-text', getTextColor(color)); 
    
    // Fix for Popover UA Stylesheet Overrides
    badge.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const existingToast = document.getElementById('a11y-info-toast');
        if (existingToast) existingToast.remove();
        
        document.querySelectorAll('.a11y-badge-active').forEach(b => b.classList.remove('a11y-badge-active'));
        document.querySelectorAll('.a11y-container-active').forEach(c => c.classList.remove('a11y-container-active'));
        document.querySelectorAll('.a11y-box-active').forEach(b => {
            b.classList.remove('a11y-box-active');
            b.style.backgroundColor = "transparent";
        });

        if (!configData) return;

        badge.classList.add('a11y-badge-active');
        entry.badgeContainer.classList.add('a11y-container-active');
        
        const relatedBox = entry.boxes.get(featureId) || overlay.querySelector(`.a11y-inspector-box[data-a11y-target-id="${uniqueId}"][data-feature="${featureId}"]`);
        if (relatedBox) {
            relatedBox.style.setProperty('--badge-bg', color);
            relatedBox.classList.add('a11y-box-active');
            const tintedBgColor = color.length === 7 && color.startsWith('#') ? color + '33' : 'rgba(128, 128, 128, 0.2)';
            relatedBox.style.backgroundColor = tintedBgColor;
        }

        const isVoid = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(el.tagName);
        
        let rawTagStr = `<${el.tagName.toLowerCase()}`;
        for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            if (!attr.name.startsWith('data-a11y-')) {
                rawTagStr += ` ${attr.name}="${attr.value}"`;
            }
        }
        rawTagStr += '>';
        
        let htmlSnippet = rawTagStr;
        if (!isVoid) {
            if (el.children.length === 0 && el.textContent.trim().length > 0) {
                let txt = el.textContent;
                if (txt.length > 60) txt = txt.substring(0, 60) + '...';
                htmlSnippet += `${txt}</${el.tagName.toLowerCase()}>`;
            } else {
                htmlSnippet += ` ... </${el.tagName.toLowerCase()}>`;
            }
        }

        let syntaxHtml = `<span style="color: #808080">&lt;</span><span style="color: #569cd6">${el.tagName.toLowerCase()}</span>`;
        for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            if (!attr.name.startsWith('data-a11y-')) {
                const safeName = attr.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const safeVal = attr.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                syntaxHtml += ` <span style="color: #9cdcfe">${safeName}</span><span style="color: #d4d4d4">=</span><span style="color: #ce9178">"${safeVal}"</span>`;
            }
        }
        syntaxHtml += `<span style="color: #808080">&gt;</span>`;
        
        if (!isVoid) {
            if (el.children.length === 0 && el.textContent.trim().length > 0) {
                let txt = el.textContent;
                if (txt.length > 60) txt = txt.substring(0, 60) + '...';
                const safeTxt = txt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                syntaxHtml += `<span style="color: #d4d4d4">${safeTxt}</span><span style="color: #808080">&lt;/</span><span style="color: #569cd6">${el.tagName.toLowerCase()}</span><span style="color: #808080">&gt;</span>`;
            } else {
                syntaxHtml += `<span style="color: #808080"> ... &lt;/</span><span style="color: #569cd6">${el.tagName.toLowerCase()}</span><span style="color: #808080">&gt;</span>`;
            }
        }

        const info = configData.feature.info || { what: 'No information provided.', why: 'No information provided.' };
        const severityHtml = configData.feature.severity ? `<span class="a11y-toast-severity severity-${configData.feature.severity.toLowerCase()}">${configData.feature.severity}</span>` : '';
        
        const rawLabel = formatLabel(badge.dataset.legendLabel, text);
        const safeDisplayLabel = rawLabel.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const statusHtml = `<span class="a11y-toast-severity" style="background-color: ${color}; color: ${getTextColor(color)}; border: 1px solid rgba(255,255,255,0.2);">${safeDisplayLabel}</span>`;
        
        const selectorStr = getCssSelector(el);

        const toast = document.createElement('div');
        toast.id = 'a11y-info-toast';
        toast.className = 'a11y-info-toast';
        toast.dataset.feature = featureId;
        toast.dataset.targetId = uniqueId;
        toast.style.setProperty('--badge-bg', color);
        
        if (HTMLElement.prototype.hasOwnProperty("popover")) {
            toast.setAttribute("popover", "manual");
            toast.style.margin = "0"; 
        }
        
        toast.innerHTML = `
            <h2>
                <span>${configData.category.label} &rsaquo; ${configData.feature.label}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="a11y-toast-close" title="Close Toast Panel" aria-label="Close">✖</button>
                </div>
            </h2>
            <div style="margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 8px;">
                ${severityHtml}
                ${statusHtml}
            </div>
            
            <span class="a11y-info-toast-section-title">CSS Selector</span>
            <div class="a11y-toast-selector-wrapper">
                <button class="a11y-toast-copy-btn selector-copy-btn" title="Copy CSS Selector">📋</button>
                <div class="a11y-toast-selector" title="Element Selector">${selectorStr}</div>
            </div>
            
            <span class="a11y-info-toast-section-title">HTML Snippet</span>
            <div class="a11y-toast-code-container">
                <button class="a11y-toast-copy-btn html-copy-btn" title="Copy HTML Snippet">📋</button>
                <pre><code>${syntaxHtml}</code></pre>
            </div>

            <span class="a11y-info-toast-section-title">What it highlights</span>
            <p>${info.what}</p>
            <span class="a11y-info-toast-section-title">Why it's important</span>
            <p>${info.why}</p>
        `;
        
        document.documentElement.appendChild(toast);
        
        if (toast.showPopover) {
            try { toast.showPopover(); } catch(e) {}
        }

        toast.querySelector('.selector-copy-btn').addEventListener('click', (btnEvent) => {
            navigator.clipboard.writeText(selectorStr).then(() => {
                const btn = btnEvent.currentTarget;
                btn.textContent = '✔';
                setTimeout(() => { btn.textContent = '📋'; }, 2000);
            });
        });

        toast.querySelector('.html-copy-btn').addEventListener('click', (btnEvent) => {
            navigator.clipboard.writeText(htmlSnippet).then(() => {
                const btn = btnEvent.currentTarget;
                btn.textContent = '✔';
                setTimeout(() => { btn.textContent = '📋'; }, 2000);
            });
        });

        const badgeRect = badge.getBoundingClientRect();
        
        // Fix for Popover UA Stylesheet Overrides
        toast.style.left = 'auto';
        toast.style.right = 'auto';
        toast.style.top = 'auto';
        toast.style.bottom = 'auto';

        if (badgeRect.left > window.innerWidth / 2) {
            toast.style.left = '24px';
        } else {
            toast.style.right = '24px';
        }
        if (badgeRect.top > window.innerHeight / 2) {
            toast.style.top = '24px';
        } else {
            toast.style.bottom = '24px';
        }
        
        // FIX: Replaced isolated variables with global DOM lookups to prevent closure null crashes
        toast.querySelector('.a11y-toast-close').addEventListener('click', () => {
            document.querySelectorAll('.a11y-badge-active').forEach(b => b.classList.remove('a11y-badge-active'));
            document.querySelectorAll('.a11y-container-active').forEach(c => c.classList.remove('a11y-container-active'));
            document.querySelectorAll('.a11y-box-active').forEach(b => {
                b.classList.remove('a11y-box-active');
                b.style.backgroundColor = "transparent";
            });
            toast.remove();
        });
    });

    entry.badgeContainer.appendChild(badge);
    targetResizeObserver.observe(el);

    // Restore active highlight states if the toast for this element is currently open
    const activeToast = document.getElementById('a11y-info-toast');
    if (activeToast && activeToast.dataset.targetId === uniqueId && activeToast.dataset.feature === featureId) {
        badge.classList.add('a11y-badge-active');
        entry.badgeContainer.classList.add('a11y-container-active');
        
        if (entry.boxes.has(featureId)) {
            const activeBox = entry.boxes.get(featureId);
            activeBox.style.setProperty('--badge-bg', color);
            activeBox.classList.add('a11y-box-active');
            const tintedBgColor = color.length === 7 && color.startsWith('#') ? color + '33' : 'rgba(128, 128, 128, 0.2)';
            activeBox.style.backgroundColor = tintedBgColor;
        }
    }
}

function runCheck(featureId, activeLegends, options = {}) {
    lastRunState.set(featureId, { activeLegends, options }); 
    clearHighlights(featureId, true);
    
    const configData = getFeatureConfig(featureId);
    if (!configData) return;
    
    const feature = configData.feature;
    
    let elements = querySelectorAllDeep(feature.selector).filter(isElementVisible);
    
    if (feature.preprocessElements) {
        elements = feature.preprocessElements(elements);
    }

    let counts = {};
    if (feature.legends) {
        feature.legends.forEach(leg => counts[leg.type] = 0);
    }

    let state = {};

    elements.forEach(el => {
        if (feature.customHighlight) {
            feature.customHighlight(el, (target, color, text, legendType, borderStyle) => {
                if (activeLegends && activeLegends.length > 0 && !activeLegends.includes(legendType) && activeLegends[0] !== "default") return;
                
                drawHighlight(target, color, text, featureId, legendType, borderStyle);
                counts[legendType] = (counts[legendType] || 0) + 1;
            }, state);
        } else {
            if (activeLegends && activeLegends.length > 0 && !activeLegends.includes("bad") && activeLegends[0] !== "default") return;

            drawHighlight(el, "#b00020", "Violation", featureId, "bad", "solid");
            counts["bad"] = (counts["bad"] || 0) + 1;
        }
    });

    try {
        chrome.runtime.sendMessage({ action: "updateCounts", featureId, totals: counts });
    } catch (e) {}
    
    // Explicitly call to render SVG paths or graphics immediately after batch processing
    requestAnimationFrame(() => repositionHighlights());
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'highlight') {
        runCheck(request.featureId, request.activeLegends, request.options);
    } else if (request.action === 'clear') {
        lastRunState.delete(request.featureId); 
        clearHighlights(request.featureId);
    } else if (request.action === 'clearAllAudits') {
        cleanupAllHighlights();
    } else if (request.action === 'applySimulation') {
        applyDisabilitySimulation(request.state);
    } else if (request.action === 'clearSimulation') {
        clearSimulationFilters();
    } else if (request.action === 'getRuleDetails') {
        const overlays = document.querySelectorAll(`.a11y-inspector-box[data-rule-id="${request.ruleId}"]`);
        const elementsList = Array.from(overlays).map(box => ({
            id: box.dataset.a11yTargetId,
            label: box.dataset.label || 'INFO',
            legendLabel: box.dataset.legendLabel || 'INFO',
            legendType: box.dataset.legendType || 'default',
            selector: box.dataset.selector || 'Unknown Element',
            color: box.dataset.color || '#e67e22'
        }));
        sendResponse({ elements: elementsList });
        return true;
    } else if (request.action === 'getTabReportData') {
        const reportData = {};
        if (Array.isArray(request.featureIds)) {
            request.featureIds.forEach(featureId => {
                const overlays = document.querySelectorAll(`.a11y-inspector-box[data-rule-id="${featureId}"]`);
                reportData[featureId] = Array.from(overlays).map(box => ({
                    id: box.dataset.a11yTargetId,
                    label: box.dataset.label || 'INFO',
                    legendLabel: box.dataset.legendLabel || 'INFO',
                    legendType: box.dataset.legendType || 'default',
                    selector: box.dataset.selector || 'Unknown Element',
                    color: box.dataset.color || '#e67e22'
                }));
            });
        }
        sendResponse({
            url: window.location.href,
            title: document.title,
            data: reportData
        });
        return true;
    } else if (request.action === 'highlightAndScroll') {
        const entry = activeHighlightsMap.get(request.targetId);
        const targetEl = entry ? entry.targetEl : querySelectorAllDeep(`[data-a11y-target-id="${request.targetId}"]:not(.a11y-inspector-box, .a11y-badge-container)`)[0];
        
        let overlayEl = null;
        if (entry && entry.boxes && request.featureId) {
            overlayEl = entry.boxes.get(request.featureId);
        }
        if (!overlayEl) {
            overlayEl = document.querySelector(`.a11y-inspector-box[data-a11y-target-id="${request.targetId}"]`);
        }

        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (overlayEl) {
            const color = request.color || overlayEl.dataset.color || '#e67e22';
            
            document.querySelectorAll('.a11y-box-active').forEach(b => {
                b.classList.remove('a11y-box-active');
                b.style.backgroundColor = "transparent";
            });
            
            overlayEl.style.setProperty('--badge-bg', color);
            overlayEl.classList.add('a11y-box-active');
            
            const tintedBgColor = color.length === 7 && color.startsWith('#') ? color + '33' : 'rgba(128, 128, 128, 0.2)';
            overlayEl.style.backgroundColor = tintedBgColor;
            
            setTimeout(() => {
                overlayEl.classList.remove('a11y-box-active');
                overlayEl.style.backgroundColor = "transparent";
            }, 2500);
        }
        sendResponse({ success: true });
        return true;
    }
});

let syncTimeout = null;
function requestStateSync() {
    cleanupAllHighlights();
    clearSimulationFilters();
    if (syncTimeout) clearTimeout(syncTimeout);
    
    syncTimeout = setTimeout(() => {
        try { chrome.runtime.sendMessage({ action: "contentScriptReady" }); } catch (e) {}
    }, 500); 
}

window.addEventListener('pageshow', (event) => { if (event.persisted) requestStateSync(); });
window.addEventListener('popstate', requestStateSync);
window.addEventListener('hashchange', requestStateSync);

setTimeout(() => {
    try { chrome.runtime.sendMessage({ action: "contentScriptReady" }); } catch (e) {}
}, 50);