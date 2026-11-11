window.A11yUtils = {
    querySelectorAllDeep: function(selector, root = document) {
        const results = [];
        function traverse(node) {
            if (!node) return;
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Ignore inspector UI overlays
                if (node.id === 'a11y-inspector-overlay' || node.id === 'a11y-info-toast' || node.id === 'panel-toast' || node.id === 'a11y-sim-field-mask') {
                    return;
                }
                if (node.matches && node.matches(selector)) {
                    results.push(node);
                }
                if (node.shadowRoot) {
                    for (let child of node.shadowRoot.children) traverse(child);
                }
            }
            for (let child of node.children) traverse(child);
        }
        const startNode = (root === document) ? (document.documentElement || document.body) : root;
        if (startNode) traverse(startNode);
        return results;
    },

    isElementVisible: function(element) {
        if (!element || element.nodeType !== 1) return false;
        let currentElement = element;

        while (currentElement && currentElement !== document) {
            if (currentElement.nodeType === Node.ELEMENT_NODE) {
                if (currentElement.hasAttribute('inert') || currentElement.hasAttribute('hidden')) return false;
                if (currentElement.tagName && currentElement.tagName.toLowerCase() === 'dialog' && !currentElement.hasAttribute('open')) return false;

                const win = currentElement.ownerDocument.defaultView || window;
                const style = win.getComputedStyle(currentElement);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            }

            if (currentElement.assignedSlot) {
                currentElement = currentElement.assignedSlot;
            } else if (currentElement.parentNode instanceof ShadowRoot) {
                currentElement = currentElement.parentNode.host;
            } else if (currentElement.parentNode === currentElement.ownerDocument) {
                const win = currentElement.ownerDocument.defaultView;
                if (win) {
                    try { currentElement = win.frameElement ? win.frameElement : null; } 
                    catch (e) { currentElement = null; }
                } else {
                    currentElement = null;
                }
            } else {
                currentElement = currentElement.parentNode;
            }
        }
        return true;
    },

    getContainerClippingBounds: function(element) {
        let current = element.parentElement;
        let minTop = -Infinity, maxBottom = Infinity, minLeft = -Infinity, maxRight = Infinity;

        while (current && current !== document.body && current !== document.documentElement) {
            if (current.nodeType === Node.ELEMENT_NODE) {
                const win = current.ownerDocument.defaultView || window;
                const style = win.getComputedStyle(current);
                const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'hidden' || style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflowX === 'hidden');

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
    },

    getCssSelector: function(el) {
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
};