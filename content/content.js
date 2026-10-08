const HIGHLIGHT_PADDING = 4;

// In-Memory Registry for instant O(1) positioning lookups during scroll/resize
const activeHighlightsMap = new Map();
// NEW: Map to keep track of active rules so child iframes can auto-redraw upon prefix update
const lastRunLegends = new Map();

// Global Listener to catch iframe indexing from parent documents
window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'WICK_AG_LENS_SET_PREFIX') {
        if (window.A11Y_FOCUS_PREFIX !== event.data.prefix) {
            window.A11Y_FOCUS_PREFIX = event.data.prefix;
            window.A11Y_FRAME_DEPTH = event.data.depth;
            
            // If the i-focus-order check is actively running on the page, force it to redraw with the new prefix
            if (lastRunLegends.has('i-focus-order')) {
                requestAnimationFrame(() => {
                    runCheck('i-focus-order', lastRunLegends.get('i-focus-order'));
                });
            }
        }
    }
});

const pulsateStyle = document.createElement('style');
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
        animation: a11y-spotlight-pulse 1s ease-in-out 2; 
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
        z-index: 2147483647;
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
    .a11y-info-toast .a11y-toast-selector { 
        font-family: monospace; 
        color: #a8c7fa; 
        word-break: break-all; 
        margin-bottom: 16px; 
        font-size: 12px; 
        background: rgba(0,0,0,0.5); 
        padding: 8px 10px; 
        border-radius: 6px; 
        border: 1px solid #5f6368;
    }
    
    /* NEW: Inline Code Styling for Toast */
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
    lastRunLegends.clear(); 
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
            
            if (node.id === 'a11y-inspector-overlay' || node.id === 'a11y-info-toast' || node.id === 'panel-toast') {
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
            // Includes overflow: hidden to properly detect carousel slide clipping
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
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "0";
        overlay.style.height = "0";
        overlay.style.overflow = "visible";
        overlay.style.pointerEvents = "none";
        overlay.style.zIndex = "2147483647"; 
        document.documentElement.appendChild(overlay); 
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
        if (!overlay || activeHighlightsMap.size === 0) {
            isRepositioning = false;
            return;
        }

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        const updates = [];

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

            // EXACT dimensions so we never expand the document boundary
            let top = rect.top + scrollTop;
            let left = rect.left + scrollLeft;
            let width = rect.width;
            let height = rect.height;

            // Badges sit directly above the highlighted element border/outline
            let badgeTop = top - HIGHLIGHT_PADDING;
            let badgeLeft = left - HIGHLIGHT_PADDING;

            updates.push({ entry, uniqueId, isVisible: true, isClippedOut, top, left, width, height, badgeTop, badgeLeft });
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

                // APPLY GHOSTED & X-RAY STATE FOR OFF-SCREEN ELEMENTS
                if (u.isClippedOut) {
                    box.style.opacity = '0.35';
                    box.style.outlineStyle = 'dashed';
                    const hatchColor = box.dataset.color || '#ffffff';
                    box.style.backgroundImage = `repeating-linear-gradient(45deg, ${hatchColor} 0, ${hatchColor} 2px, transparent 2px, transparent 8px)`;
                } else {
                    box.style.opacity = ''; // Reverts to default CSS class (0.75)
                    box.style.outlineStyle = box.dataset.originalBorderStyle || 'solid';
                    box.style.backgroundImage = 'none';
                }
            });

            if (u.entry.badgeContainer) {
                u.entry.badgeContainer.style.visibility = 'visible';
                u.entry.badgeContainer.style.top = `${u.badgeTop}px`;
                u.entry.badgeContainer.style.left = `${u.badgeLeft}px`;

                // UPDATE BADGE TEXT AND OPACITY FOR OFF-SCREEN ELEMENTS
                const badges = u.entry.badgeContainer.querySelectorAll('.a11y-inspector-badge');
                badges.forEach(b => {
                    const origText = b.dataset.originalText;
                    if (u.isClippedOut) {
                        b.style.opacity = '0.4';
                        if (origText && !b.textContent.startsWith('[Hidden]')) {
                            b.textContent = `[Hidden] ${origText}`;
                        }
                    } else {
                        b.style.opacity = ''; // Reverts to default CSS class (0.75)
                        if (origText && b.textContent !== origText) {
                            b.textContent = origText;
                        }
                    }
                });
            }
        });

        isRepositioning = false;
    });
}

window.addEventListener("scroll", repositionHighlights, { passive: true, capture: true });
window.addEventListener("resize", repositionHighlights, { passive: true });

let mutationDebounceTimer = null;
const domMutationObserver = new MutationObserver((mutations) => {
    let hasRelevantMutation = false;
    for (let m of mutations) {
        if (m.target && (m.target.id === 'a11y-inspector-overlay' || (m.target.closest && m.target.closest('#a11y-inspector-overlay')))) continue;
        if (m.type === 'attributes' && m.attributeName && m.attributeName.startsWith('data-a11y')) continue;
        hasRelevantMutation = true;
        break;
    }
    if (!hasRelevantMutation) return;

    if (mutationDebounceTimer) clearTimeout(mutationDebounceTimer);
    mutationDebounceTimer = setTimeout(() => {
        repositionHighlights();
    }, 50);
});

if (document.body) {
    domMutationObserver.observe(document.body, { 
        attributes: true, 
        childList: true, 
        subtree: true,
        attributeFilter: ['class', 'style', 'hidden', 'disabled', 'inert']
    });
}

function clearHighlights(featureId) {
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
            targetResizeObserver.unobserve(entry.targetEl);
            delete entry.targetEl.dataset.a11yTargetId;
            activeHighlightsMap.delete(uniqueId);
        }
    });

    const markedElements = querySelectorAllDeep(`[data-a11y-target-${featureId}]`);
    markedElements.forEach(el => {
        el.removeAttribute(`data-a11y-target-${featureId}`);
    });

    const activeToast = document.getElementById('a11y-info-toast');
    if (activeToast && activeToast.dataset.feature === featureId) {
        activeToast.remove();
    }
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

        const info = configData.feature.info || { what: 'No information provided.', why: 'No information provided.' };
        const severityHtml = configData.feature.severity ? `<span class="a11y-toast-severity severity-${configData.feature.severity.toLowerCase()}">${configData.feature.severity}</span>` : '';
        
        const rawLabel = formatLabel(badge.dataset.legendLabel, text);
        const safeDisplayLabel = rawLabel.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        const statusHtml = `<span class="a11y-toast-severity" style="background-color: ${color}; color: ${getTextColor(color)}; border: 1px solid rgba(255,255,255,0.2);">${safeDisplayLabel}</span>`;
        
        const toast = document.createElement('div');
        toast.id = 'a11y-info-toast';
        toast.className = 'a11y-info-toast';
        toast.dataset.feature = featureId;
        toast.style.setProperty('--badge-bg', color);
        
        toast.innerHTML = `
            <h2>
                <span>${configData.category.label} &rsaquo; ${configData.feature.label}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="a11y-toast-close" title="Close Toast Panel" aria-label="Close">✖</button>
                </div>
            </h2>
            <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
                ${severityHtml}
                ${statusHtml}
            </div>
            <div class="a11y-toast-selector" title="Element Selector">${getCssSelector(el)}</div>
            <span class="a11y-info-toast-section-title">What it highlights</span>
            <p>${info.what}</p>
            <span class="a11y-info-toast-section-title">Why it's important</span>
            <p>${info.why}</p>
        `;
        
        document.documentElement.appendChild(toast);

        const badgeRect = badge.getBoundingClientRect();
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
        
        toast.querySelector('.a11y-toast-close').addEventListener('click', () => {
            badge.classList.remove('a11y-badge-active');
            entry.badgeContainer.classList.remove('a11y-container-active');
            if (relatedBox) {
                relatedBox.classList.remove('a11y-box-active');
                relatedBox.style.backgroundColor = "transparent";
            }
            toast.remove();
        });
    });

    entry.badgeContainer.appendChild(badge);
    targetResizeObserver.observe(el);
}

function runCheck(featureId, activeLegends) {
    lastRunLegends.set(featureId, activeLegends); 
    clearHighlights(featureId);
    
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
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'highlight') {
        runCheck(request.featureId, request.activeLegends);
    } else if (request.action === 'clear') {
        lastRunLegends.delete(request.featureId); 
        clearHighlights(request.featureId);
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
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
        try { chrome.runtime.sendMessage({ action: "contentScriptReady" }); } catch (e) {}
    }, 250); 
}

window.addEventListener('pageshow', (event) => { if (event.persisted) requestStateSync(); });
window.addEventListener('popstate', requestStateSync);
window.addEventListener('hashchange', requestStateSync);

setTimeout(() => {
    try { chrome.runtime.sendMessage({ action: "contentScriptReady" }); } catch (e) {}
}, 50);