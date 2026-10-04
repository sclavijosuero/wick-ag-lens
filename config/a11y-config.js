window.A11Y_CONFIG = {
    tabs: [
        {
            id: "tab-violations",
            categories: [
                {
                    id: "cat-keyboard-1",
                    label: "Keyboard Navigation",
                    features: [
                        {
                            id: "v-unfocusable",
                            label: "Unfocusable Clickables",
                            desc: "Clickable divs/spans missing keyboard support",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "div[onclick], span[onclick], section[onclick]",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags generic elements with onclick handlers lacking tabindex and role.",
                                why: "Keyboard users cannot tab to or activate these elements. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html' target='_blank'>WCAG 2.1.1: Keyboard</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                if (!el.hasAttribute("role") || !el.hasAttribute("tabindex")) {
                                    drawHighlight(el, "#d93025", "Unfocusable Clickable", "bad"); return true;
                                } return false;
                            }
                        },
                        {
                            id: "v-tabindex",
                            label: "Tabindex Violations",
                            desc: "Elements forcing focus order",
                            severity: "Serious",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[tabindex]",
                            legends: [{ label: "tabindex > 0", color: "#f29900", type: "bad" }],
                            info: {
                                what: "Flags elements with tabindex > 0.",
                                why: "Overrides natural DOM focus order, creating unpredictable navigation paths. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html' target='_blank'>WCAG 2.4.3: Focus Order</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const val = parseInt(el.getAttribute("tabindex"), 10);
                                if (val > 0) { drawHighlight(el, "#f29900", `tabindex="${val}"`, "bad"); return true; }
                                return false;
                            }
                        },
                        {
                            id: "v-accesskey",
                            label: "Accesskey Attributes",
                            desc: "Explicit accesskey definitions",
                            severity: "Moderate",
                            wcag: [{ version: "2.1", level: "A" }],
                            selector: "[accesskey]",
                            legends: [{ label: "Warning", color: "#fbbc04", type: "warn" }],
                            info: {
                                what: "Flags explicit accesskey usage.",
                                why: "Often conflicts with native browser or screen reader shortcuts. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html' target='_blank'>WCAG 2.1.4: Character Key Shortcuts</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                drawHighlight(el, "#fbbc04", `accesskey="${el.getAttribute("accesskey")}"`, "warn"); return true;
                            }
                        },
                        {
                            id: "v-disabled-focus",
                            label: "Disabled Focus Outlines",
                            desc: "Interactive elements hiding focus rings without fallbacks",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "AA" }],
                            selector: "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Parses page CSS via heuristic evaluation to find focusable elements where <code>outline: none</code> is applied on the <code>:focus</code> state without a fallback.",
                                why: "Sighted keyboard users rely entirely on focus rings to know which element they are interacting with. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html' target='_blank'>WCAG 2.4.7: Focus Visible</a>"
                            },
                            customHighlight: (el, drawHighlight, state) => {
                                if (!state.parsedSelectors) {
                                    state.parsedSelectors = [];
                                    try {
                                        for (let sheet of document.styleSheets) {
                                            try {
                                                for (let rule of sheet.cssRules) {
                                                    if (rule.type === CSSRule.STYLE_RULE && rule.selectorText && (rule.selectorText.includes(':focus') || rule.selectorText.includes(':focus-visible'))) {
                                                        if ((rule.style.outline.includes('none') || rule.style.outline.includes('0px') || rule.style.outlineWidth === '0px') &&
                                                            (!rule.style.boxShadow || rule.style.boxShadow === 'none') &&
                                                            (!rule.style.border || rule.style.border === 'none')) {
                                                            const baseSelector = rule.selectorText.replace(/:focus-visible/g, '').replace(/:focus/g, '');
                                                            if (baseSelector.trim() !== '') state.parsedSelectors.push(baseSelector);
                                                        }
                                                    }
                                                }
                                            } catch (e) {}
                                        }
                                    } catch (e) {}
                                }
                                for (let sel of state.parsedSelectors) {
                                    try {
                                        if (el.matches(sel)) { drawHighlight(el, "#d93025", "Disabled Focus Ring (Heuristic)", "bad"); return true; }
                                    } catch(e) {}
                                }
                                return false;
                            }
                        }
                    ]
                },
                {
                    id: "cat-media-1",
                    label: "Images & Media",
                    features: [
                        {
                            id: "v-missing-alt",
                            label: "Missing Alt Text",
                            desc: "Images lacking alt attribute",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "img:not([alt])",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags &lt;img&gt; elements completely lacking an alt attribute.",
                                why: "Screen readers will read the raw filename if alt is missing. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html' target='_blank'>WCAG 1.1.1: Non-text Content</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#d93025", "Missing alt", "bad"); return true; }
                        },
                        {
                            id: "v-uncaptioned-video",
                            label: "Uncaptioned Video",
                            desc: "Video elements missing text tracks",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "video",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags &lt;video&gt; elements lacking nested &lt;track&gt; elements.",
                                why: "Deaf or hard of hearing users require captions for video content. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html' target='_blank'>WCAG 1.2.2: Captions (Prerecorded)</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const tracks = el.querySelectorAll('track[kind="captions"], track[kind="subtitles"]');
                                if (tracks.length === 0) { drawHighlight(el, "#d93025", "<video> (No Captions)", "bad"); return true; }
                                return false;
                            }
                        },
                        {
                            id: "v-redundant-alt",
                            label: "Redundant Alt Text",
                            desc: "Alt text containing image/photo",
                            severity: "Minor",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "img[alt]",
                            legends: [{ label: "Violation", color: "#1a73e8", type: "bad" }],
                            info: {
                                what: "Flags alt attributes containing 'image of', 'photo of', etc.",
                                why: "Screen readers automatically announce images, making these prefixes redundant. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html' target='_blank'>WCAG 1.1.1: Non-text Content</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const alt = el.getAttribute("alt");
                                if (/\b(image|img|photo|picture|graphic)\b/i.test(alt)) {
                                    drawHighlight(el, "#1a73e8", `Redundant alt: "${alt.substring(0,15)}..."`, "bad"); return true;
                                } return false;
                            }
                        }
                    ]
                },
                {
                    id: "cat-forms-1",
                    label: "Forms & Controls",
                    features: [
                        {
                            id: "v-unlabeled-inputs",
                            label: "Unlabeled Form Inputs",
                            desc: "Inputs missing programmatic names",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "input:not([type='hidden']):not([type='submit']):not([type='button']), select, textarea",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags form controls missing &lt;label for&gt;, ARIA labels, or &lt;label&gt; wrappers.",
                                why: "Screen readers cannot announce what the input is for. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html' target='_blank'>WCAG 3.3.2: Labels or Instructions</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const id = el.id;
                                const hasLabelFor = id ? document.querySelector(`label[for="${id}"]`) : false;
                                const hasAria = el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby");
                                const hasWrapper = el.closest("label");
                                if (!hasLabelFor && !hasAria && !hasWrapper) { drawHighlight(el, "#d93025", "Unlabeled Input", "bad"); return true; }
                                return false;
                            }
                        },
                        {
                            id: "v-empty-buttons",
                            label: "Empty Buttons",
                            desc: "Buttons without readable text",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "button, [role='button']",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags buttons with no text, aria-label, or child image alt.",
                                why: "Screen readers will only announce 'Button', providing no context. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const text = el.innerText || el.textContent;
                                const hasAria = el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby");
                                const hasImgAlt = el.querySelector("img[alt]");
                                if (text.trim() === "" && !hasAria && !hasImgAlt) { drawHighlight(el, "#d93025", "Empty Button", "bad"); return true; }
                                return false;
                            }
                        },
                        {
                            id: "v-placeholder-label",
                            label: "Placeholder as Label",
                            desc: "Inputs relying solely on placeholder",
                            severity: "Serious",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "input[placeholder], textarea[placeholder]",
                            legends: [{ label: "Violation", color: "#f29900", type: "bad" }],
                            info: {
                                what: "Flags inputs relying solely on placeholders for their accessible name.",
                                why: "Placeholders disappear on typing and often lack contrast. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const id = el.id;
                                const hasLabelFor = id ? document.querySelector(`label[for="${id}"]`) : false;
                                const hasAria = el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby");
                                if (!hasLabelFor && !hasAria) { drawHighlight(el, "#f29900", "Placeholder as Label", "bad"); return true; }
                                return false;
                            }
                        }
                    ]
                },
                {
                    id: "cat-links-1",
                    label: "Links & Navigation",
                    features: [
                        {
                            id: "v-empty-links",
                            label: "Empty Links",
                            desc: "Links without readable text",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "a[href]",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags &lt;a&gt; tags lacking readable text or accessible names.",
                                why: "Screen readers will read the URL, which is often confusing. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html' target='_blank'>WCAG 2.4.4: Link Purpose (In Context)</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const text = el.innerText || el.textContent;
                                const hasAria = el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby");
                                const hasImgAlt = el.querySelector("img[alt]");
                                if (text.trim() === "" && !hasAria && !hasImgAlt) { drawHighlight(el, "#d93025", "Empty Link", "bad"); return true; }
                                return false;
                            }
                        },
                        {
                            id: "v-suspicious-links",
                            label: "Suspicious Link Targets",
                            desc: "Links missing routing context acting as buttons",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "a[href='#'], a[href^='javascript:']",
                            legends: [
                                { label: "javascript: (Critical)", color: "#d93025", type: "js" },
                                { label: "href='#' (Serious)", color: "#f29900", type: "hash" }
                            ],
                            info: {
                                what: "Flags anchor tags that lack actual routing destinations and are missing <code>role='button'</code>.",
                                why: "Using links to trigger JS actions confuses screen readers. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                if (el.getAttribute("role") === "button") return false;
                                const href = el.getAttribute("href");
                                if (href && href.startsWith("javascript:")) {
                                    drawHighlight(el, "#d93025", "Fake Button (JS)", "js");
                                } else {
                                    drawHighlight(el, "#f29900", "Fake Button (#)", "hash");
                                }
                                return true;
                            }
                        },
                        {
                            id: "v-generic-link",
                            label: "Generic Link Text",
                            desc: "Ambiguous text like 'Click Here'",
                            severity: "Moderate",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "a[href]",
                            legends: [{ label: "Violation", color: "#fbbc04", type: "bad" }],
                            info: {
                                what: "Flags ambiguous link text (e.g., Click Here, Read More) using exact word boundaries to avoid false positives on valid phrases.",
                                why: "Users navigating via a Links List will lack context for the destination. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html' target='_blank'>WCAG 2.4.4: Link Purpose</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const text = (el.innerText || el.textContent).trim();
                                if (/\b(click here|read more|learn more|more|link|here)\b/i.test(text)) {
                                    drawHighlight(el, "#fbbc04", `Generic link: "${text.substring(0,15)}..."`, "bad"); return true;
                                } return false;
                            }
                        },
                        {
                            id: "v-unwarned-window",
                            label: "Unwarned New Window Links",
                            desc: "target='_blank' without warning",
                            severity: "Moderate",
                            wcag: [{ version: "2.0", level: "AAA" }],
                            selector: "a[target='_blank']",
                            legends: [{ label: "Violation", color: "#fbbc04", type: "bad" }],
                            info: {
                                what: "Flags target='_blank' links lacking text/ARIA warnings.",
                                why: "Unexpectedly opening new tabs disorients cognitive and screen reader users. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html' target='_blank'>WCAG 3.2.5: Change on Request</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const txt = (el.innerText + " " + (el.getAttribute("aria-label")||"")).toLowerCase();
                                if (!/new (window|tab)/.test(txt)) {
                                    drawHighlight(el, "#fbbc04", 'target="_blank" (No Warning)', "bad"); return true;
                                } return false;
                            }
                        }
                    ]
                },
                {
                    id: "cat-aria-1",
                    label: "ARIA & Semantics",
                    features: [
                        {
                            id: "v-aria-hidden-focus",
                            label: "Focusable in Aria-Hidden",
                            desc: "Active controls trapped in hidden trees",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags elements that receive keyboard focus but are hidden from Assistive Technologies via <code>aria-hidden='true'</code>.",
                                why: "Keyboard users can reach them, but screen readers cannot, creating a severe mismatch. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                if (el.disabled || el.getAttribute("aria-disabled") === "true") return false;
                                let isHiddenFromAT = false;
                                let currentElement = el;
                                while (currentElement && currentElement !== document) {
                                    if (currentElement.nodeType === Node.ELEMENT_NODE && currentElement.getAttribute("aria-hidden") === "true") {
                                        isHiddenFromAT = true; break;
                                    }
                                    if (currentElement.assignedSlot) currentElement = currentElement.assignedSlot;
                                    else if (currentElement.parentNode instanceof ShadowRoot) currentElement = currentElement.parentNode.host;
                                    else if (currentElement.parentNode === currentElement.ownerDocument) {
                                        const win = currentElement.ownerDocument.defaultView;
                                        if (win) { try { currentElement = win.frameElement ? win.frameElement : null; } catch(e) { currentElement = null; } } 
                                        else currentElement = null;
                                    } else { currentElement = currentElement.parentNode; }
                                }
                                if (isHiddenFromAT) { drawHighlight(el, "#d93025", "aria-hidden (Focusable)", "bad"); return true; }
                                return false;
                            }
                        },
                        {
                            id: "v-aria-invalid",
                            label: "Invalid ARIA State",
                            desc: "Form controls explicitly marked invalid",
                            severity: "Serious",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[aria-invalid='true']",
                            legends: [{ label: "Violation", color: "#f29900", type: "bad" }],
                            info: {
                                what: "Flags elements marked with aria-invalid='true'.",
                                why: "Identifies application-enforced validation errors. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html' target='_blank'>WCAG 3.3.1: Error Identification</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#f29900", 'aria-invalid="true"', "bad"); return true; }
                        },
                        {
                            id: "v-prohibited-names",
                            label: "Prohibited Author Names",
                            desc: "Structural roles containing ARIA labels",
                            severity: "Serious",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[role='presentation'], [role='none'], [role='generic']",
                            legends: [{ label: "Violation", color: "#f29900", type: "bad" }],
                            info: {
                                what: "Flags presentation/none roles that improperly contain aria-label or aria-labelledby.",
                                why: "Adding a name to a transparent structural role breaks its semantics. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                if (el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby")) {
                                    drawHighlight(el, "#f29900", `Prohibited name on role="${el.getAttribute('role')}"`, "bad"); return true;
                                } return false;
                            }
                        }
                    ]
                },
                {
                    id: "cat-structure-1",
                    label: "Structure & Document",
                    features: [
                        {
                            id: "v-autoplay-media",
                            label: "Auto-playing Media",
                            desc: "Audio/Video set to start automatically",
                            severity: "Serious",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "audio[autoplay], video[autoplay]",
                            legends: [{ label: "Violation", color: "#f29900", type: "bad" }],
                            info: {
                                what: "Flags &lt;audio&gt; or &lt;video&gt; with autoplay enabled.",
                                why: "Unexpected audio conflicts with screen reader announcements. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html' target='_blank'>WCAG 1.4.2: Audio Control</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#f29900", "Autoplay Media", "bad"); return true; }
                        },
                        {
                            id: "v-heading-errors",
                            label: "Heading Hierarchy Errors",
                            desc: "Skipped levels or fake non-semantic headings",
                            severity: "Moderate",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "h1, h2, h3, h4, h5, h6, [role='heading'], [class*='heading'], [class*='title']",
                            legends: [{ label: "Violation", color: "#fbbc04", type: "bad" }],
                            info: {
                                what: "Flags skipped sequential levels (H1 to H3) or fake structural classes.",
                                why: "Headings map document structure; skipping levels confuses screen reader navigation. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html' target='_blank'>WCAG 1.3.1: Info and Relationships</a>"
                            },
                            customHighlight: (el, drawHighlight, state) => {
                                state.lastLevel = state.lastLevel || 0;
                                const tag = el.tagName.toLowerCase();
                                if (tag.match(/^h[1-6]$/)) {
                                    const level = parseInt(tag.substring(1));
                                    if (level > state.lastLevel + 1 && state.lastLevel !== 0) {
                                        drawHighlight(el, "#fbbc04", `${tag.toUpperCase()} (Skipped)`, "bad");
                                        state.lastLevel = level; return true;
                                    }
                                    state.lastLevel = level;
                                } else if (!el.hasAttribute('role')) {
                                    if (el.innerText.length < 80) { drawHighlight(el, "#fbbc04", `Fake Heading`, "bad"); return true; }
                                }
                                return false;
                            }
                        }
                    ]
                },
                {
                    id: "cat-visual-1",
                    label: "Visual & Contrast",
                    features: [
                        {
                            id: "v-text-contrast",
                            label: "Text Color Contrast",
                            desc: "Calculated ratio of foreground to background color",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "AA" }, { version: "2.0", level: "AAA" }],
                            selector: "h1, h2, h3, h4, h5, h6, p, span, a, button, label, li, td, th, caption, legend, dt, dd, blockquote",
                            legends: [
                                { label: "AA Fail", color: "#d93025", type: "aa-fail", wcag: [{ version: "2.0", level: "AA" }] },
                                { label: "AAA Fail", color: "#f29900", type: "aaa-fail", wcag: [{ version: "2.0", level: "AAA" }] },
                                { label: "Manual Check", color: "#5f6368", type: "manual", wcag: [{ version: "2.0", level: "AA" }] }
                            ],
                            info: {
                                what: "Traverses the DOM to calculate the effective contrast ratio between visible text and its backing container. Dynamically evaluates <code>font-size</code> and <code>font-weight</code> against WCAG large-text thresholds, and flags elements over complex background images or gradients for manual review.",
                                why: "Low contrast prevents users with visual impairments from reading content. The required passing ratio depends strictly on text size and weight. Background images require human verification. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html' target='_blank'>WCAG 1.4.3: Contrast (Minimum)</a><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html' target='_blank'>WCAG 1.4.6: Contrast (Enhanced)</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const text = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.nodeValue).join('').trim();
                                if (!text) return false;
                                const style = window.getComputedStyle(el);
                                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

                                let fontSizePx = parseFloat(style.fontSize);
                                let fontWeight = style.fontWeight;
                                let isBold = fontWeight === 'bold' || parseInt(fontWeight, 10) >= 700;
                                let isLargeText = fontSizePx >= 24 || (isBold && fontSizePx >= 18.66);

                                let fg = style.color, bg = style.backgroundColor;
                                let current = el;
                                let manualCheck = false;

                                while(current && current.nodeType === 1) {
                                    let computedStyle = window.getComputedStyle(current);
                                    if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none' && computedStyle.backgroundImage !== 'initial') {
                                        manualCheck = true;
                                        break;
                                    }
                                    let computedBg = computedStyle.backgroundColor;
                                    if (computedBg !== 'rgba(0, 0, 0, 0)' && computedBg !== 'transparent') { bg = computedBg; break; }
                                    current = current.parentElement;
                                }

                                if (manualCheck) {
                                    drawHighlight(el, "#5f6368", "Manual Check (Bg)", "manual"); return true;
                                }

                                if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') bg = 'rgb(255, 255, 255)';
                                const parseRGB = (str) => { let m = str.match(/\d+/g); return m ? [parseInt(m[0]), parseInt(m[1]), parseInt(m[2])] : [255,255,255]; };
                                const getLum = (r, g, b) => {
                                    let a = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
                                    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
                                };
                                let l1 = getLum(...parseRGB(fg)), l2 = getLum(...parseRGB(bg));
                                let ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
                                
                                let aaReq = isLargeText ? 3.0 : 4.5;
                                let aaaReq = isLargeText ? 4.5 : 7.0;

                                if (ratio < aaReq) { 
                                    drawHighlight(el, "#d93025", `AA Fail (${ratio.toFixed(2)}:1)`, "aa-fail"); return true; 
                                } else if (ratio < aaaReq) { 
                                    drawHighlight(el, "#f29900", `AAA Fail (${ratio.toFixed(2)}:1)`, "aaa-fail"); return true; 
                                }
                                return false; 
                            }
                        }
                    ]
                }
            ]
        },
        {
            id: "tab-informative",
            categories: [
                {
                    id: "cat-keyboard-2",
                    label: "Keyboard Navigation",
                    features: [
                        {
                            id: "i-tabindex-all",
                            label: "Tabindex (Comparison)",
                            desc: "Visual comparison of all tabindex usages",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[tabindex]",
                            legends: [
                                { label: "0 (Valid)", color: "#1a73e8", type: "zero" },
                                { label: "-1 (Scripted)", color: "#1e8e3e", type: "minus" },
                                { label: "> 0 (Warn)", color: "#d93025", type: "plus" }
                            ],
                            info: {
                                what: "Highlights all tabindex usages (0, -1, and > 0) simultaneously.",
                                why: "Provides a visual map of the programmatic focus strategy. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html' target='_blank'>WCAG 2.4.3: Focus Order</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const val = parseInt(el.getAttribute("tabindex"), 10);
                                if (val === 0) { drawHighlight(el, "#1a73e8", `tabindex="0"`, "zero"); }
                                else if (val < 0) { drawHighlight(el, "#1e8e3e", `tabindex="${val}"`, "minus"); }
                                else { drawHighlight(el, "#d93025", `tabindex="${val}"`, "plus"); }
                                return true;
                            }
                        },
                        {
                            id: "i-focus-order",
                            label: "Display Focus Order",
                            desc: "Sequential trace of naturally focusable elements",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
                            legends: [
                                { label: "Valid Focus", color: "#9c27b0", type: "path" },
                                { label: "Hidden from AT (aria-hidden)", color: "#d93025", type: "hidden-at" }
                            ],
                            info: {
                                what: "Traces the sequential path of focusable elements and flags traps.",
                                why: "Simulates the TAB key route to ensure logical flow. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html' target='_blank'>WCAG 2.4.3: Focus Order</a>"
                            },
                            customHighlight: (el, drawHighlight, state) => {
                                if (el.disabled || el.getAttribute("aria-disabled") === "true") return false;
                                let isHiddenFromAT = false;
                                let currentElement = el;
                                while (currentElement && currentElement !== document) {
                                    if (currentElement.nodeType === Node.ELEMENT_NODE && currentElement.getAttribute("aria-hidden") === "true") {
                                        isHiddenFromAT = true; break;
                                    }
                                    if (currentElement.assignedSlot) currentElement = currentElement.assignedSlot;
                                    else if (currentElement.parentNode instanceof ShadowRoot) currentElement = currentElement.parentNode.host;
                                    else if (currentElement.parentNode === currentElement.ownerDocument) {
                                        const win = currentElement.ownerDocument.defaultView;
                                        if (win) { try { currentElement = win.frameElement ? win.frameElement : null; } catch(e) { currentElement = null; } } 
                                        else currentElement = null;
                                    } else { currentElement = currentElement.parentNode; }
                                }
                                state.counter = state.counter || 1;
                                const tagName = el.tagName.toLowerCase();
                                if (isHiddenFromAT) { drawHighlight(el, "#d93025", `#${state.counter}: <${tagName}> (Hidden from AT)`, "hidden-at"); } 
                                else { drawHighlight(el, "#9c27b0", `#${state.counter}: <${tagName}>`, "path"); }
                                state.counter++; return true;
                            },
                            preprocessElements: (elements) => {
                                let focusable = elements.filter(el => {
                                    if (el.disabled || el.getAttribute("aria-disabled") === "true") return false;
                                    if (el.tabIndex < 0) return false;
                                    if (el.tagName.toLowerCase() === 'input' && el.type === 'radio' && el.name) {
                                        const group = elements.filter(r => r.tagName.toLowerCase() === 'input' && r.type === 'radio' && r.name === el.name);
                                        const checkedRadio = group.find(r => r.checked);
                                        const targetRadio = checkedRadio || group[0];
                                        if (el !== targetRadio) return false;
                                    }
                                    return true;
                                });
                                return focusable.map((el, index) => {
                                    const tabIndexAttr = el.getAttribute('tabindex');
                                    const tabVal = parseInt(tabIndexAttr, 10);
                                    const sortVal = (tabIndexAttr && !isNaN(tabVal) && tabVal > 0) ? tabVal : Infinity;
                                    return { el, sortVal, index };
                                }).sort((a, b) => {
                                    if (a.sortVal !== b.sortVal) return a.sortVal - b.sortVal;
                                    return a.index - b.index; 
                                }).map(item => item.el);
                            }
                        }
                    ]
                },
                {
                    id: "cat-media-2",
                    label: "Images & Media",
                    features: [
                        {
                            id: "i-image-alts",
                            label: "Display Image Alternatives",
                            desc: "Prints alt text for all images",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "img",
                            legends: [
                                { label: "Has Alt", color: "#1a73e8", type: "has" },
                                { label: "Decorative", color: "#5f6368", type: "dec" },
                                { label: "Missing", color: "#d93025", type: "miss" }
                            ],
                            info: {
                                what: "Extracts and visually prints the alt text for all &lt;img&gt; elements.",
                                why: "Allows quick visual auditing of alternative text descriptions. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html' target='_blank'>WCAG 1.1.1: Non-text Content</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                if (!el.hasAttribute("alt")) { drawHighlight(el, "#d93025", "Missing alt", "miss"); }
                                else if (el.getAttribute("alt").trim() === "") { drawHighlight(el, "#5f6368", 'alt=""', "dec"); }
                                else { drawHighlight(el, "#1a73e8", `alt="${el.getAttribute("alt")}"`, "has"); }
                                return true;
                            }
                        },
                        {
                            id: "i-captioned-video",
                            label: "Captioned Video",
                            desc: "Videos with track elements",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "video",
                            legends: [{ label: "Has Captions", color: "#009688", type: "good" }],
                            info: {
                                what: "Highlights &lt;video&gt; elements that correctly implement &lt;track&gt; captions.",
                                why: "Confirms proper multimedia accessibility setup. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html' target='_blank'>WCAG 1.2.2: Captions (Prerecorded)</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const tracks = el.querySelectorAll('track[kind="captions"], track[kind="subtitles"]');
                                if (tracks.length > 0) { drawHighlight(el, "#009688", "<video> (Captioned)", "good"); return true; }
                                return false;
                            }
                        },
                        {
                            id: "i-iframes",
                            label: "Iframe Context & Titles",
                            desc: "Analyzes third-party embed context",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "iframe",
                            legends: [
                                { label: "Titled (Valid)", color: "#1a73e8", type: "titled" },
                                { label: "Hidden", color: "#5f6368", type: "hidden" },
                                { label: "Missing Title", color: "#d93025", type: "missing" }
                            ],
                            info: {
                                what: "Extracts explicitly defined titles from embedded iframes.",
                                why: "Screen readers announce the title to inform the user what the sub-document contains before they enter it. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const title = el.getAttribute("title");
                                const isHidden = el.getAttribute("aria-hidden") === "true" || el.getAttribute("tabindex") === "-1";
                                if (isHidden) { drawHighlight(el, "#5f6368", "Hidden Iframe", "hidden"); }
                                else if (!title || title.trim() === "") { drawHighlight(el, "#d93025", "Missing Title", "missing"); }
                                else { drawHighlight(el, "#1a73e8", `title="${title}"`, "titled"); }
                                return true;
                            }
                        }
                    ]
                },
                {
                    id: "cat-forms-2",
                    label: "Forms & Controls",
                    features: [
                        {
                            id: "i-field-desc",
                            label: "Form Field Descriptions",
                            desc: "Supplemental instructional text",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[aria-describedby], [title]",
                            legends: [{ label: "Description", color: "#e91e63", type: "info" }],
                            info: {
                                what: "Identifies supplemental instructional text linked to inputs via aria-describedby or title.",
                                why: "Ensures extended hints or error messages are programmatically tied to inputs. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html' target='_blank'>WCAG 3.3.2: Labels or Instructions</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                if (el.hasAttribute("aria-describedby")) { drawHighlight(el, "#e91e63", `aria-describedby`, "info"); }
                                else { drawHighlight(el, "#e91e63", `title`, "info"); }
                                return true;
                            }
                        },
                        {
                            id: "i-fieldsets",
                            label: "Fieldsets & Captions",
                            desc: "Visual grouping containers",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "fieldset, legend",
                            legends: [{ label: "Grouping", color: "#3f51b5", type: "good" }],
                            info: {
                                what: "Highlights visual grouping containers (&lt;fieldset&gt;) and their titles (&lt;legend&gt;).",
                                why: "Crucial for grouping related radio buttons or complex form sections. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html' target='_blank'>WCAG 1.3.1: Info and Relationships</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                drawHighlight(el, "#3f51b5", `<${el.tagName.toLowerCase()}>`, "good"); return true;
                            }
                        },
                        {
                            id: "i-touch-targets",
                            label: "Touch Target Sizes",
                            desc: "Calculates interactive bounds",
                            wcag: [{ version: "2.2", level: "AA" }, { version: "2.1", level: "AAA" }],
                            selector: "button, a[href], input:not([type='hidden']), select, textarea, summary, [role='button'], [role='link'], [role='menuitem'], [role='tab'], [role='checkbox'], [role='radio'], [role='switch'], [role='slider'], [tabindex]:not([tabindex='-1'])",
                            legends: [
                                { label: "< 24px (Fail)", color: "#d93025", type: "small", wcag: [{ version: "2.2", level: "AA" }] },
                                { label: "24-43px (AA Min)", color: "#fbbc04", type: "medium", wcag: [{ version: "2.1", level: "AAA" }] },
                                { label: "44px+ (AAA)", color: "#1e8e3e", type: "large", wcag: [{ version: "2.1", level: "AAA" }] }
                            ],
                            info: {
                                what: "Computes the exact width and height pixel boundaries of interactive elements.",
                                why: "Undersized targets prevent users with fine motor impairments (like hand tremors) from activating controls accurately. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html' target='_blank'>WCAG 2.5.8: Target Size (Minimum)</a><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/target-size.html' target='_blank'>WCAG 2.5.5: Target Size (Enhanced)</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const rect = el.getBoundingClientRect();
                                if (rect.width === 0 || rect.height === 0) return false;
                                const minSize = Math.min(rect.width, rect.height);
                                
                                if (minSize < 24) { 
                                    drawHighlight(el, "#d93025", `${Math.round(rect.width)}x${Math.round(rect.height)}px`, "small"); 
                                } else if (minSize < 44) { 
                                    drawHighlight(el, "#fbbc04", `${Math.round(rect.width)}x${Math.round(rect.height)}px`, "medium"); 
                                } else { 
                                    drawHighlight(el, "#1e8e3e", `${Math.round(rect.width)}x${Math.round(rect.height)}px`, "large"); 
                                }
                                return true;
                            }
                        }
                    ]
                },
                {
                    id: "cat-links-2",
                    label: "Links & Navigation",
                    features: [
                        {
                            id: "i-warned-window",
                            label: "Warned New Window Links",
                            desc: "target='_blank' with proper warning",
                            wcag: [{ version: "2.0", level: "AAA" }],
                            selector: "a[target='_blank']",
                            legends: [{ label: "Warned", color: "#00acc1", type: "good" }],
                            info: {
                                what: "Highlights target='_blank' links that correctly include accessible warnings.",
                                why: "Confirms proper communication of context shifts to assistive technologies. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html' target='_blank'>WCAG 3.2.5: Change on Request</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const txt = (el.innerText + " " + (el.getAttribute("aria-label")||"")).toLowerCase();
                                if (/new (window|tab)/.test(txt)) { drawHighlight(el, "#00acc1", 'target="_blank" (Warned)', "good"); return true; }
                                return false;
                            }
                        }
                    ]
                },
                {
                    id: "cat-aria-2",
                    label: "ARIA & Semantics",
                    features: [
                        {
                            id: "i-aria-roles",
                            label: "ARIA Roles & Attributes",
                            desc: "Maps explicit role definitions",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[role]",
                            legends: [{ label: "Role", color: "#673ab7", type: "info" }],
                            info: {
                                what: "Maps all elements utilizing an explicit role definition.",
                                why: "Allows auditing of custom widget semantics. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#673ab7", `role="${el.getAttribute("role")}"`, "info"); return true; }
                        },
                        {
                            id: "i-aria-live",
                            label: "ARIA Live Regions",
                            desc: "Maps dynamic injection containers",
                            wcag: [{ version: "2.1", level: "AA" }],
                            selector: "[aria-live]",
                            legends: [{ label: "Live Region", color: "#ff5722", type: "live" }],
                            info: {
                                what: "Maps dynamic aria-live injection containers (polite, assertive).",
                                why: "Ensures dynamic content updates are announced to screen readers. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html' target='_blank'>WCAG 4.1.3: Status Messages</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#ff5722", `aria-live="${el.getAttribute("aria-live")}"`, "live"); return true; }
                        },
                        {
                            id: "i-required-fields",
                            label: "Required Fields",
                            desc: "Mandatory input enforcement",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[required], [aria-required='true']",
                            legends: [{ label: "Required", color: "#ff9800", type: "req" }],
                            info: {
                                what: "Maps mandatory inputs enforced via HTML5 required or aria-required.",
                                why: "Ensures required status is programmatically available. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html' target='_blank'>WCAG 3.3.1: Error Identification</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const txt = el.hasAttribute("required") ? "required" : 'aria-required="true"';
                                drawHighlight(el, "#ff9800", txt, "req"); return true;
                            }
                        },
                        {
                            id: "i-aria-expanded",
                            label: "Aria-Expanded State",
                            desc: "Expandable/collapsible widget states",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[aria-expanded]",
                            legends: [
                                { label: "True", color: "#4caf50", type: "true" },
                                { label: "False", color: "#795548", type: "false" }
                            ],
                            info: {
                                what: "Maps expandable widgets, color-coded by true/false state.",
                                why: "Visualizes the current programmatic state of accordions and menus. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const val = el.getAttribute("aria-expanded");
                                if (val === "true") { drawHighlight(el, "#4caf50", `aria-expanded="true"`, "true"); }
                                else { drawHighlight(el, "#795548", `aria-expanded="false"`, "false"); }
                                return true;
                            }
                        },
                        {
                            id: "i-aria-controls",
                            label: "Aria-Controls",
                            desc: "Remote DOM visibility targets",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[aria-controls]",
                            legends: [{ label: "Controls", color: "#03a9f4", type: "info" }],
                            info: {
                                what: "Highlights elements that dictate the visibility of remote DOM elements.",
                                why: "Links trigger mechanisms to their targets. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#03a9f4", `aria-controls`, "info"); return true; }
                        },
                        {
                            id: "i-aria-owns",
                            label: "Aria-Owns",
                            desc: "Remote programmatic ownership",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[aria-owns]",
                            legends: [{ label: "Owns", color: "#8bc34a", type: "own" }],
                            info: {
                                what: "Highlights elements establishing parent/child relationships outside the DOM tree.",
                                why: "Reconstructs accessibility tree hierarchy for disjointed widgets. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#8bc34a", `aria-owns`, "own"); return true; }
                        }
                    ]
                },
                {
                    id: "cat-structure-2",
                    label: "Structure & Document",
                    features: [
                        {
                            id: "i-valid-headings",
                            label: "Valid Heading Order",
                            desc: "Standard H1-H6 structure",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "h1, h2, h3, h4, h5, h6",
                            legends: [{ label: "Heading", color: "#607d8b", type: "good" }],
                            info: {
                                what: "Maps the standard, sequential H1-H6 structure.",
                                why: "Verifies the logical outline of the page. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html' target='_blank'>WCAG 1.3.1: Info and Relationships</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#607d8b", `<${el.tagName.toLowerCase()}>`, "good"); return true; }
                        },
                        {
                            id: "i-landmarks",
                            label: "Landmark Regions",
                            desc: "HTML5 and ARIA structural containers",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "main, nav, header, footer, aside, [role='main'], [role='navigation'], [role='banner'], [role='contentinfo']",
                            legends: [{ label: "Landmark", color: "#c2185b", type: "info" }],
                            info: {
                                what: "Maps native HTML5 and ARIA structural containers.",
                                why: "Allows screen reader users to jump quickly between page sections. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html' target='_blank'>WCAG 2.4.1: Bypass Blocks</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const label = el.hasAttribute("role") ? el.getAttribute("role") : el.tagName.toLowerCase();
                                drawHighlight(el, "#c2185b", `<${label}>`, "info"); return true;
                            }
                        },
                        {
                            id: "i-tables",
                            label: "Table & Grid Structure",
                            desc: "Native tables and ARIA data grids",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "table, caption, th, [role='table'], [role='grid'], [role='treegrid'], [role='columnheader'], [role='rowheader']",
                            legends: [
                                { label: "Table/Grid", color: "#303f9f", type: "solid" },
                                { label: "Header", color: "#1976d2", type: "dashed" }
                            ],
                            info: {
                                what: "Highlights native &lt;table&gt;, &lt;caption&gt;, and &lt;th&gt; tags, as well as custom div-based structures.",
                                why: "Visually maps data structures and verifies that custom UI grids correctly implement semantic headers. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html' target='_blank'>WCAG 1.3.1: Info and Relationships</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const tag = el.tagName.toLowerCase();
                                const role = el.getAttribute("role");
                                const isHeader = tag === "th" || role === "columnheader" || role === "rowheader";
                                const label = role && !["table", "th", "caption"].includes(tag) ? `role="${role}"` : `<${tag}>`;

                                if (isHeader) { drawHighlight(el, "#1976d2", label, "dashed", "dashed"); } 
                                else { drawHighlight(el, "#303f9f", label, "solid", "solid"); }
                                return true;
                            }
                        },
                        {
                            id: "i-lists",
                            label: "Lists and List Items",
                            desc: "Unordered, ordered, and definition lists",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "ul, ol, li, dl, dt, dd",
                            legends: [{ label: "List Element", color: "#00796b", type: "info" }],
                            info: {
                                what: "Maps unordered (ul), ordered (ol), and glossary lists (dl) and children.",
                                why: "Ensures related items are programmatically grouped. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html' target='_blank'>WCAG 1.3.1: Info and Relationships</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#00796b", `<${el.tagName.toLowerCase()}>`, "info"); return true; }
                        },
                        {
                            id: "i-language",
                            label: "Language Definitions",
                            desc: "Phonetic shifts and root declarations",
                            wcag: [{ version: "2.0", level: "A" }, { version: "2.0", level: "AA" }],
                            selector: "html, [lang], [xml\\:lang]",
                            legends: [
                                { label: "Root Lang Missing", color: "#d93025", type: "root-miss", wcag: [{ version: "2.0", level: "A" }] },
                                { label: "Root Lang", color: "#1a73e8", type: "root-has", wcag: [{ version: "2.0", level: "A" }] },
                                { label: "Inline Shift", color: "#9c27b0", type: "shift", wcag: [{ version: "2.0", level: "AA" }] }
                            ],
                            info: {
                                what: "Maps the root document language declaration alongside any mid-page inline phonetic shifts.",
                                why: "Screen readers rely on the language tag to load the correct accent and pronunciation rules. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html' target='_blank'>WCAG 3.1.1: Language of Page</a><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html' target='_blank'>WCAG 3.1.2: Language of Parts</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const lang = el.getAttribute("lang") || el.getAttribute("xml:lang");
                                const isRoot = el.tagName.toLowerCase() === 'html';
                                if (isRoot) {
                                    if (!lang || lang.trim() === "") {
                                        drawHighlight(el, "#d93025", "Missing Root Lang", "root-miss");
                                    } else {
                                        drawHighlight(el, "#1a73e8", `Root lang="${lang}"`, "root-has");
                                    }
                                } else {
                                    drawHighlight(el, "#9c27b0", `lang="${lang}"`, "shift");
                                }
                                return true;
                            }
                        }
                    ]
                }
            ]
        }
    ]
};