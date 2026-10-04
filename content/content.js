const HIGHLIGHT_PADDING = 4;

const pulsateStyle = document.createElement('style');
pulsateStyle.textContent = `
    @keyframes a11y-pulsate-yellow {
        0%, 100% { 
            background-color: rgba(255, 235, 59, 0.05); 
            border-color: #ffd700; 
            box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.5); 
        }
        50% { 
            background-color: rgba(255, 235, 59, 0.2); 
            border-color: #ffffff; 
            box-shadow: 0 0 0 8px rgba(255, 215, 0, 0.9), 0 0 18px rgba(255, 215, 0, 1); 
        }
    }
    .a11y-pulsate-active {
        animation: a11y-pulsate-yellow 1.25s ease-in-out 2 !important; 
        z-index: 2147483647 !important;
    }
    
    .a11y-inspector-box {
        opacity: 0.75;
        transition: opacity 0.15s ease, background-color 0.2s ease, box-shadow 0.2s ease;
    }
    .a11y-inspector-box:hover {
        opacity: 1 !important;
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
    .a11y-info-toast strong { 
        color: #e3e3e3; 
        display: block; 
        margin-bottom: 6px; 
        font-size: 12px; 
        font-weight: 700;
        text-transform: uppercase; 
        letter-spacing: 0.5px;
    }
    .a11y-info-toast p { 
        margin: 0 0 16px 0; 
        line-height: 1.5; 
        color: #f1f3f4;
    }
    .a11y-info-toast p:last-child { margin-bottom: 0; }
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

    const markedElements = querySelectorAllDeep('[data-a11y-target-id]');
    markedElements.forEach(el => {
        targetResizeObserver.unobserve(el);
        const attrsToRemove = [];
        for (let i = 0; i < el.attributes.length; i++) {
            if (el.attributes[i].name.startsWith('data-a11y-target')) {
                attrsToRemove.push(el.attributes[i].name);
            }
        }
        attrsToRemove.forEach(attr => el.removeAttribute(attr));
        delete el.dataset.a11yTargetId;
    });
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
        if (!overlay) {
            isRepositioning = false;
            return;
        }
        
        const trackedElements = overlay.querySelectorAll(".a11y-inspector-box, .a11y-badge-container");
        
        trackedElements.forEach(el => {
            const targetId = el.dataset.a11yTargetId;
            if (!targetId) return;
            
            const targets = querySelectorAllDeep(`[data-a11y-target-id="${targetId}"]:not(.a11y-inspector-box, .a11y-badge-container)`);
            
            if (targets.length > 0) {
                const targetEl = targets[0];
                const rect = targetEl.getBoundingClientRect();
                
                if (rect.width === 0 && rect.height === 0) {
                    el.style.display = 'none';
                } else {
                    const isContainer = el.classList.contains("a11y-badge-container");
                    el.style.display = isContainer ? 'flex' : 'block';
                    
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;
                    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
                    
                    el.style.top = `${rect.top + scrollTop - HIGHLIGHT_PADDING}px`;
                    el.style.left = `${rect.left + scrollLeft - HIGHLIGHT_PADDING}px`;
                    
                    if (!isContainer) {
                        el.style.width = `${rect.width + (HIGHLIGHT_PADDING * 2)}px`;
                        el.style.height = `${rect.height + (HIGHLIGHT_PADDING * 2)}px`;
                    }
                }
            } else {
                el.style.display = 'none';
            }
        });
        isRepositioning = false;
    });
}

window.addEventListener("scroll", repositionHighlights, { passive: true, capture: true });
window.addEventListener("resize", repositionHighlights, { passive: true });

const domMutationObserver = new MutationObserver(() => {
    repositionHighlights();
});
if (document.body) {
    domMutationObserver.observe(document.body, { attributes: true, childList: true, subtree: true });
}

function clearHighlights(featureId) {
    const overlay = document.getElementById("a11y-inspector-overlay");
    if (overlay) {
        const badges = overlay.querySelectorAll(`.a11y-inspector-badge[data-feature="${featureId}"]`);
        badges.forEach(badge => {
            const container = badge.parentElement;
            badge.remove();
            if (container && container.children.length === 0) {
                container.remove(); 
            }
        });

        const boxes = overlay.querySelectorAll(`.a11y-inspector-box[data-feature="${featureId}"]`);
        boxes.forEach(box => {
            const targetId = box.dataset.a11yTargetId;
            box.remove(); 
            
            if (targetId) {
                const remainingBoxes = overlay.querySelectorAll(`.a11y-inspector-box[data-a11y-target-id="${targetId}"]`);
                if (remainingBoxes.length === 0) {
                    const targets = querySelectorAllDeep(`[data-a11y-target-id="${targetId}"]:not(.a11y-inspector-box, .a11y-badge-container)`);
                    targets.forEach(t => {
                        targetResizeObserver.unobserve(t);
                        delete t.dataset.a11yTargetId;
                    });
                }
            }
        });
    }

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
    
    let legendLabel = legendType;
    let legendTypeAttr = legendType;
    const configData = getFeatureConfig(featureId);
    if (configData && configData.feature.legends) {
        const leg = configData.feature.legends.find(l => l.type === legendType);
        if (leg) legendLabel = leg.label;
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

    box.style.display = "block";
    box.style.margin = "0";
    box.style.padding = "0";
    box.style.position = "absolute";
    box.style.top = `${rect.top + scrollTop - HIGHLIGHT_PADDING}px`;
    box.style.left = `${rect.left + scrollLeft - HIGHLIGHT_PADDING}px`;
    box.style.width = `${rect.width + (HIGHLIGHT_PADDING * 2)}px`;
    box.style.height = `${rect.height + (HIGHLIGHT_PADDING * 2)}px`;
    box.style.border = `3px ${borderStyle} ${color}`;
    box.style.boxSizing = "border-box";
    box.style.backgroundColor = "transparent";
    box.style.borderRadius = "3px";
    box.style.pointerEvents = "none";

    overlay.appendChild(box);

    let badgeContainer = overlay.querySelector(`.a11y-badge-container[data-a11y-target-id="${uniqueId}"]`);
    if (!badgeContainer) {
        badgeContainer = document.createElement("div");
        badgeContainer.className = "a11y-badge-container";
        badgeContainer.dataset.a11yTargetId = uniqueId;
        badgeContainer.style.top = `${rect.top + scrollTop - HIGHLIGHT_PADDING}px`;
        badgeContainer.style.left = `${rect.left + scrollLeft - HIGHLIGHT_PADDING}px`;
        overlay.appendChild(badgeContainer);
    }

    const badge = document.createElement("div");
    badge.className = "a11y-inspector-badge";
    badge.setAttribute("data-feature", featureId); 
    badge.dataset.legendLabel = legendLabel; 
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
        badgeContainer.classList.add('a11y-container-active');
        
        const relatedBox = document.querySelector(`.a11y-inspector-box[data-a11y-target-id="${uniqueId}"]`);
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
            <strong>What it highlights</strong>
            <p>${info.what}</p>
            <strong>Why it's important</strong>
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
            badgeContainer.classList.remove('a11y-container-active');
            if (relatedBox) {
                relatedBox.classList.remove('a11y-box-active');
                relatedBox.style.backgroundColor = "transparent";
            }
            toast.remove();
        });
    });

    badgeContainer.appendChild(badge);
    targetResizeObserver.observe(el);
}

function runCheck(featureId, activeLegends) {
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
                // Intercept and halt drawing if the specific legend does not match the active WCAG filters
                if (activeLegends && activeLegends.length > 0 && !activeLegends.includes(legendType) && activeLegends[0] !== "default") return;
                
                drawHighlight(target, color, text, featureId, legendType, borderStyle);
                counts[legendType] = (counts[legendType] || 0) + 1;
            }, state);
        } else {
            // "default" is passed if the whole audit matches without specific legend overrides
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
        const targetEl = querySelectorAllDeep(`[data-a11y-target-id="${request.targetId}"]:not(.a11y-inspector-box, .a11y-badge-container)`)[0];
        const overlayEl = document.querySelector(`.a11y-inspector-box[data-a11y-target-id="${request.targetId}"]`);

        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (overlayEl) {
            overlayEl.classList.add('a11y-pulsate-active');
            setTimeout(() => overlayEl.classList.remove('a11y-pulsate-active'), 2500);
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