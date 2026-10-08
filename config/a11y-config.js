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
                            desc: "Clickable <code>&lt;div&gt;</code> or <code>&lt;span&gt;</code> elements missing keyboard support",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "div[onclick], span[onclick], section[onclick]",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags generic elements with <code>onclick</code> handlers lacking a <code>tabindex</code> and a valid semantic <code>role</code>.",
                                why: "<strong>Keyboard users cannot tab to or activate these elements.</strong> If an element behaves like a button, it must be programmatically focusable. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html' target='_blank'>WCAG 2.1.1: Keyboard</a>"
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
                            desc: "Elements dynamically forcing focus order via <code>tabindex</code>",
                            severity: "Serious",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[tabindex]",
                            legends: [{ label: "tabindex > 0", color: "#f29900", type: "bad" }],
                            info: {
                                what: "Flags elements dynamically injected with a <code>tabindex &gt; 0</code>.",
                                why: "<strong>Overrides natural DOM focus order</strong>, creating unpredictable and confusing navigation paths for screen readers and keyboard users. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html' target='_blank'>WCAG 2.4.3: Focus Order</a>"
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
                            desc: "Explicit <code>accesskey</code> definitions",
                            severity: "Moderate",
                            wcag: [{ version: "2.1", level: "A" }],
                            selector: "[accesskey]",
                            legends: [{ label: "Warning", color: "#fbbc04", type: "warn" }],
                            info: {
                                what: "Flags explicit <code>accesskey</code> usage on elements.",
                                why: "<strong>Often conflicts with native browser or screen reader shortcuts</strong>, overriding commands that users heavily rely on for navigation. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html' target='_blank'>WCAG 2.1.4: Character Key Shortcuts</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                drawHighlight(el, "#fbbc04", `accesskey="${el.getAttribute("accesskey")}"`, "warn"); return true;
                            }
                        },
                        {
                            id: "v-disabled-focus",
                            label: "Disabled Focus Outlines",
                            desc: "Interactive elements hiding <code>:focus</code> rings without fallbacks",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "AA" }],
                            selector: "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Parses page CSS via heuristic evaluation to find focusable elements where <code>outline: none</code> is applied on the <code>:focus</code> state without a border or shadow fallback.",
                                why: "<strong>Sighted keyboard users rely entirely on focus rings</strong> to know which element they are currently interacting with on the page. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html' target='_blank'>WCAG 2.4.7: Focus Visible</a>"
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
                                            } catch (e) { }
                                        }
                                    } catch (e) { }
                                }
                                for (let sel of state.parsedSelectors) {
                                    try {
                                        if (el.matches(sel)) { drawHighlight(el, "#d93025", "Disabled Focus Ring (Heuristic)", "bad"); return true; }
                                    } catch (e) { }
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
                            desc: "Images lacking an <code>alt</code> attribute",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "img:not([alt])",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags <code>&lt;img&gt;</code> elements completely lacking an <code>alt</code> attribute.",
                                why: "<strong>Screen readers will read the raw image filename</strong> if the <code>alt</code> attribute is entirely missing, creating severe confusion for the user. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html' target='_blank'>WCAG 1.1.1: Non-text Content</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#d93025", "Missing alt", "bad"); return true; }
                        },
                        {
                            id: "v-uncaptioned-video",
                            label: "Uncaptioned Video",
                            desc: "Video elements missing <code>&lt;track&gt;</code> elements",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "video",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags <code>&lt;video&gt;</code> elements lacking nested <code>&lt;track&gt;</code> elements.",
                                why: "<strong>Deaf or hard of hearing users require captions</strong> to understand audio tracks and dialogue in video content. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html' target='_blank'>WCAG 1.2.2: Captions (Prerecorded)</a>"
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
                            desc: "<code>alt</code> text containing <em>'image of'</em> or <em>'photo of'</em>",
                            severity: "Minor",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "img[alt]",
                            legends: [{ label: "Violation", color: "#1a73e8", type: "bad" }],
                            info: {
                                what: "Flags <code>alt</code> attributes containing unnecessary prefixes like <em>'image of'</em> or <em>'photo of'</em>.",
                                why: "<strong>Screen readers automatically announce the element as an image.</strong> Including these words forces the user to hear <em>'Image, image of...'</em> redundantly. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html' target='_blank'>WCAG 1.1.1: Non-text Content</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const alt = el.getAttribute("alt");
                                if (/\b(image|img|photo|picture|graphic)\b/i.test(alt)) {
                                    drawHighlight(el, "#1a73e8", `Redundant alt: "${alt.substring(0, 15)}..."`, "bad"); return true;
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
                            desc: "Inputs missing programmatic names (e.g., <code>aria-label</code>)",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "input:not([type='hidden']):not([type='submit']):not([type='button']), select, textarea",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags form controls missing a linked <code>&lt;label for&gt;</code>, an <code>aria-label</code>, or a direct <code>&lt;label&gt;</code> wrapper.",
                                why: "<strong>Screen readers cannot announce what the input is for.</strong> The user will focus the field and only hear <em>'Edit text'</em>, with no context. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html' target='_blank'>WCAG 3.3.2: Labels or Instructions</a>"
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
                            desc: "Buttons without readable text or an <code>aria-label</code>",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "button, [role='button']",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags buttons with no internal text, missing an <code>aria-label</code>, or lacking a child image with an <code>alt</code> attribute.",
                                why: "<strong>Screen readers will only announce 'Button'</strong>, providing zero context about what clicking the button will actually do. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
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
                            desc: "Inputs relying solely on the <code>placeholder</code> attribute",
                            severity: "Serious",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "input[placeholder], textarea[placeholder]",
                            legends: [{ label: "Violation", color: "#f29900", type: "bad" }],
                            info: {
                                what: "Flags inputs relying solely on the <code>placeholder</code> attribute for their accessible name.",
                                why: "<strong>Placeholders disappear when a user begins typing</strong>, removing the instructions. Furthermore, default placeholder colors frequently fail text contrast minimums. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
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
                            desc: "Links without readable text or an <code>aria-label</code>",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "a[href]",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags <code>&lt;a&gt;</code> tags lacking readable text or accessible ARIA names.",
                                why: "<strong>Screen readers will default to reading the raw URL path</strong> out loud, which is often confusing and excessively long. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html' target='_blank'>WCAG 2.4.4: Link Purpose (In Context)</a>"
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
                            desc: "Links missing routing context acting as buttons (missing <code>role='button'</code>)",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "a[href='#'], a[href^='javascript:']",
                            legends: [
                                { label: "javascript: (Critical)", color: "#d93025", type: "js" },
                                { label: "href='#' (Serious)", color: "#f29900", type: "hash" }
                            ],
                            info: {
                                what: "Flags anchor tags that lack actual routing destinations and are missing <code>role='button'</code>.",
                                why: "<strong>Using links to trigger JS actions confuses screen readers.</strong> A user expects a link to navigate them to a new page. If it executes a script or toggles a menu, it should be a Button. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
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
                            desc: "Ambiguous text like <em>'Click Here'</em>",
                            severity: "Moderate",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "a[href]",
                            legends: [{ label: "Violation", color: "#fbbc04", type: "bad" }],
                            info: {
                                what: "Flags ambiguous link text (e.g., <em>'Click Here'</em>, <em>'Read More'</em>) using exact word boundaries.",
                                why: "<strong>Users navigating via an isolated 'Links List' will lack context</strong> for where the destination actually leads. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html' target='_blank'>WCAG 2.4.4: Link Purpose</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const text = (el.innerText || el.textContent).trim();
                                if (/\b(click here|read more|learn more|more|link|here)\b/i.test(text)) {
                                    drawHighlight(el, "#fbbc04", `Generic link: "${text.substring(0, 15)}..."`, "bad"); return true;
                                } return false;
                            }
                        },
                        {
                            id: "v-unwarned-window",
                            label: "Unwarned New Window Links",
                            desc: "<code>target='_blank'</code> links without an accessible warning",
                            severity: "Moderate",
                            wcag: [{ version: "2.0", level: "AAA" }],
                            selector: "a[target='_blank']",
                            legends: [{ label: "Violation", color: "#fbbc04", type: "bad" }],
                            info: {
                                what: "Flags <code>target='_blank'</code> links lacking text or ARIA warnings that the context will shift.",
                                why: "<strong>Unexpectedly opening new tabs disorients cognitive and screen reader users</strong> by suddenly hijacking their context and changing their window environment. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html' target='_blank'>WCAG 3.2.5: Change on Request</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const txt = (el.innerText + " " + (el.getAttribute("aria-label") || "")).toLowerCase();
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
                            desc: "Active controls trapped in <code>aria-hidden='true'</code> trees",
                            severity: "Critical",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
                            legends: [{ label: "Violation", color: "#d93025", type: "bad" }],
                            info: {
                                what: "Flags elements that receive keyboard focus but are hidden from Assistive Technologies via <code>aria-hidden='true'</code>.",
                                why: "<strong>Keyboard users can reach them, but screen readers cannot</strong>, creating a severe operational mismatch and invisible focus traps. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
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
                                        if (win) { try { currentElement = win.frameElement ? win.frameElement : null; } catch (e) { currentElement = null; } }
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
                            desc: "Form controls explicitly marked <code>aria-invalid='true'</code>",
                            severity: "Serious",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[aria-invalid='true']",
                            legends: [{ label: "Violation", color: "#f29900", type: "bad" }],
                            info: {
                                what: "Flags elements explicitly marked with <code>aria-invalid='true'</code>.",
                                why: "<strong>Identifies application-enforced validation errors.</strong> Used to ensure visual error styling is programmatically communicated to screen reader users. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html' target='_blank'>WCAG 3.3.1: Error Identification</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#f29900", 'aria-invalid="true"', "bad"); return true; }
                        },
                        {
                            id: "v-prohibited-names",
                            label: "Prohibited Author Names",
                            desc: "Structural roles containing <code>aria-label</code>",
                            severity: "Serious",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[role='presentation'], [role='none'], [role='generic']",
                            legends: [{ label: "Violation", color: "#f29900", type: "bad" }],
                            info: {
                                what: "Flags presentation/none roles that improperly contain <code>aria-label</code> or <code>aria-labelledby</code>.",
                                why: "<strong>Adding an accessible name to a transparent structural role breaks its semantics.</strong> Presentation nodes should be silent mapping vehicles, not named entities. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
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
                            desc: "Audio/Video elements set to <code>autoplay</code>",
                            severity: "Serious",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "audio[autoplay], video[autoplay]",
                            legends: [{ label: "Violation", color: "#f29900", type: "bad" }],
                            info: {
                                what: "Flags <code>&lt;audio&gt;</code> or <code>&lt;video&gt;</code> elements with <code>autoplay</code> enabled.",
                                why: "<strong>Unexpected audio conflicts with screen reader announcements</strong>, drowning out the speech engine and making it impossible for the user to hear page navigation. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html' target='_blank'>WCAG 1.4.2: Audio Control</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#f29900", "Autoplay Media", "bad"); return true; }
                        },
                        {
                            id: "v-heading-errors",
                            label: "Heading Hierarchy Errors",
                            desc: "Skipped levels (e.g., <code>H1</code> to <code>H3</code>) or fake non-semantic headings",
                            severity: "Moderate",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "h1, h2, h3, h4, h5, h6, [role='heading'], [class*='heading'], [class*='title']",
                            legends: [{ label: "Violation", color: "#fbbc04", type: "bad" }],
                            info: {
                                what: "Flags skipped sequential levels (e.g., jumping from <code>H1</code> directly to <code>H3</code>) or fake structural classes imitating headings.",
                                why: "<strong>Headings map the document's structure.</strong> Skipping levels breaks the outline and deeply confuses screen reader navigation. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html' target='_blank'>WCAG 1.3.1: Info and Relationships</a>"
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
                            desc: "Evaluates effective contrast ratio between text and its background.",
                            severity: "CRITICAL",
                            wcag: [
                                { version: "2.1", level: "AA" },
                                { version: "2.1", level: "AAA" }
                            ],
                            selector: "p, h1, h2, h3, h4, h5, h6, span, a, button, label, li, td, th, div, b, strong, i, em, mark, small, del, ins, sub, sup",
                            legends: [
                                { label: "AA Fail", color: "#d93025", type: "aa-fail" },
                                { label: "AAA Fail", color: "#f29900", type: "aaa-fail" },
                                { label: "Manual", color: "#00bcd4", type: "manual" }
                            ],
                            info: {
                                what: "Traverses the DOM to calculate the effective mathematical contrast ratio between visible text and its solid backing container. Dynamically evaluates <code>font-size</code> and <code>font-weight</code> against WCAG large-text targets.",
                                why: "<strong>Low contrast prevents users with visual impairments from reading content.</strong> Background images, complex gradients, or transparent floats are safely flagged for Manual Review to prevent false automated calculations.<br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum' target='_blank'>WCAG 1.4.3: Contrast (Minimum)</a><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced' target='_blank'>WCAG 1.4.6: Contrast (Enhanced)</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                let hasDirectText = false;
                                for (let i = 0; i < el.childNodes.length; i++) {
                                    if (el.childNodes[i].nodeType === Node.TEXT_NODE && el.childNodes[i].nodeValue.trim().length > 0) {
                                        hasDirectText = true;
                                        break;
                                    }
                                }
                                if (!hasDirectText) return false;

                                const style = window.getComputedStyle(el);
                                if (style.opacity === '0' || style.visibility === 'hidden' || style.display === 'none') return false;

                                const parseRGB = (c) => {
                                    const match = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                                    return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [0, 0, 0];
                                };

                                const getLuminance = (r, g, b) => {
                                    const a = [r, g, b].map(v => {
                                        v /= 255;
                                        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                                    });
                                    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
                                };

                                const fgRGB = parseRGB(style.color);
                                const fgLum = getLuminance(...fgRGB);

                                let bgNode = el;
                                let bgStyle = style;
                                let bgRGB = [255, 255, 255];
                                let needsManualCheck = false;

                                while (bgNode && bgNode !== document) {
                                    bgStyle = window.getComputedStyle(bgNode);

                                    if (bgStyle.backgroundImage !== 'none' && (bgStyle.backgroundImage.includes('url') || bgStyle.backgroundImage.includes('gradient'))) {
                                        needsManualCheck = true;
                                        break;
                                    }

                                    const match = bgStyle.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                                    if (match) {
                                        const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
                                        if (alpha === 1) {
                                            bgRGB = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
                                            break;
                                        }
                                    }
                                    bgNode = bgNode.parentElement;
                                }

                                if (needsManualCheck) {
                                    drawHighlight(el, "#00bcd4", "Manual Check", "manual");
                                    return true;
                                }

                                const bgLum = getLuminance(...bgRGB);
                                const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
                                const displayRatio = ratio.toFixed(2);

                                const fontSizePx = parseFloat(style.fontSize);
                                const fontWeight = style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700;

                                const isLargeText = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight);
                                const aaTarget = isLargeText ? 3.0 : 4.5;
                                const aaaTarget = isLargeText ? 4.5 : 7.0;

                                if (ratio < aaTarget) {
                                    drawHighlight(el, "#d93025", `AA Fail (${displayRatio}:1)`, "aa-fail");
                                    return true;
                                } else if (ratio < aaaTarget) {
                                    drawHighlight(el, "#f29900", `AAA Fail (${displayRatio}:1)`, "aaa-fail");
                                    return true;
                                }

                                return false; 
                            }
                        }]
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
                            desc: "Visual comparison of all <code>tabindex</code> usages",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[tabindex]",
                            legends: [
                                { label: "0 (Valid)", color: "#1a73e8", type: "zero" },
                                { label: "-1 (Scripted)", color: "#1e8e3e", type: "minus" },
                                { label: "> 0 (Warn)", color: "#d93025", type: "plus" }
                            ],
                            info: {
                                what: "Highlights all <code>tabindex</code> variations (<code>0</code>, <code>-1</code>, and <code>&gt; 0</code>) simultaneously on the page.",
                                why: "<strong>Provides a sweeping visual map of the programmatic focus strategy.</strong> Allows auditors to ensure programmatic focus control is being routed correctly. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html' target='_blank'>WCAG 2.4.3: Focus Order</a>"
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
                            selector: "a[href], button, input, select, textarea, iframe, [tabindex]:not([tabindex='-1'])",
                            legends: [
                                { label: "Valid Focus", color: "#9c27b0", type: "path" },
                                { label: "Hidden from AT (aria-hidden)", color: "#d93025", type: "hidden-at" }
                            ],
                            info: {
                                what: "Traces the sequential path of focusable elements and flags traps. Main page elements are numbered sequentially (<code>#1</code>, <code>#2</code>). When focus enters an iframe, elements are marked with an <code>[Iframe]</code> tag and a hierarchical decimal (e.g., <code>#4.1</code> indicates the 1st focusable element inside the 4th tab stop). Nested iframes add further decimals (e.g., <code>[Nested] #4.2.1</code>).",
                                why: "<strong>Simulates the exact path of the <code>TAB</code> key.</strong> Ensures logical flow and visualizes deeply nested cross-frame boundaries. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html' target='_blank'>WCAG 2.4.3: Focus Order</a>"
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
                                        if (win) { try { currentElement = win.frameElement ? win.frameElement : null; } catch (e) { currentElement = null; } }
                                        else currentElement = null;
                                    } else { currentElement = currentElement.parentNode; }
                                }
                                
                                state.counter = state.counter || 1;
                                
                                const prefix = window.A11Y_FOCUS_PREFIX || "";
                                const depth = window.A11Y_FRAME_DEPTH || 0;
                                const tagName = el.tagName.toLowerCase();

                                if (tagName === 'iframe') {
                                    try {
                                        if (el.contentWindow) {
                                            el.contentWindow.postMessage({
                                                action: 'WICK_AG_LENS_SET_PREFIX',
                                                prefix: prefix + state.counter + ".",
                                                depth: depth + 1
                                            }, '*');
                                        }
                                    } catch (e) {}
                                }

                                let depthTag = "";
                                if (depth === 1) depthTag = "[Iframe] ";
                                else if (depth > 1) depthTag = "[Nested] ";

                                const displayNum = `${depthTag}#${prefix}${state.counter}`;

                                if (isHiddenFromAT) { 
                                    drawHighlight(el, "#d93025", `${displayNum}: <${tagName}> (Hidden from AT)`, "hidden-at"); 
                                } else { 
                                    drawHighlight(el, "#9c27b0", `${displayNum}: <${tagName}>`, "path"); 
                                }
                                state.counter++; 
                                return true;
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
                            desc: "Prints <code>alt</code> text for all images",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "img",
                            legends: [
                                { label: "Has Alt", color: "#1a73e8", type: "has" },
                                { label: "Decorative", color: "#5f6368", type: "dec" },
                                { label: "Missing", color: "#d93025", type: "miss" }
                            ],
                            info: {
                                what: "Extracts and visually prints the <code>alt</code> text directly over all <code>&lt;img&gt;</code> elements.",
                                why: "<strong>Allows rapid visual auditing of alternative text descriptions</strong> without needing to inspect the DOM manually. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html' target='_blank'>WCAG 1.1.1: Non-text Content</a>"
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
                            desc: "Videos containing <code>&lt;track&gt;</code> elements",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "video",
                            legends: [{ label: "Has Captions", color: "#009688", type: "good" }],
                            info: {
                                what: "Highlights <code>&lt;video&gt;</code> elements that correctly implement <code>&lt;track&gt;</code> captions.",
                                why: "<strong>Confirms proper multimedia accessibility setup.</strong> <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html' target='_blank'>WCAG 1.2.2: Captions (Prerecorded)</a>"
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
                            desc: "Analyzes third-party embed context and <code>title</code> attributes",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "iframe",
                            legends: [
                                { label: "Titled (Valid)", color: "#1a73e8", type: "titled" },
                                { label: "Hidden", color: "#5f6368", type: "hidden" },
                                { label: "Missing Title", color: "#d93025", type: "missing" }
                            ],
                            info: {
                                what: "Extracts explicitly defined <code>title</code> attributes from embedded iframes.",
                                why: "<strong>Screen readers announce the title to inform the user</strong> what the sub-document contains before they cross the boundary into it. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
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
                            desc: "Supplemental instructional text (<code>aria-describedby</code>)",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[aria-describedby], [title]",
                            legends: [{ label: "Description", color: "#e91e63", type: "info" }],
                            info: {
                                what: "Identifies supplemental instructional text linked to inputs via <code>aria-describedby</code> or <code>title</code>.",
                                why: "<strong>Ensures extended hints or error messages are programmatically tied to inputs</strong> so screen readers read them alongside the main label. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html' target='_blank'>WCAG 3.3.2: Labels or Instructions</a>"
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
                            desc: "Visual grouping containers (<code>&lt;fieldset&gt;</code>)",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "fieldset, legend",
                            legends: [{ label: "Grouping", color: "#3f51b5", type: "good" }],
                            info: {
                                what: "Highlights visual grouping containers (<code>&lt;fieldset&gt;</code>) and their titles (<code>&lt;legend&gt;</code>).",
                                why: "<strong>Crucial for grouping related radio buttons</strong> or complex form sections to give screen readers proper structural context. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html' target='_blank'>WCAG 1.3.1: Info and Relationships</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                drawHighlight(el, "#3f51b5", `<${el.tagName.toLowerCase()}>`, "good"); return true;
                            }
                        },
                        {
                            id: "i-touch-targets",
                            label: "Touch Target Sizes",
                            desc: "Calculates interactive pixel bounds (<code>width</code> / <code>height</code>)",
                            wcag: [{ version: "2.2", level: "AA" }, { version: "2.1", level: "AAA" }],
                            selector: "button, a[href], input:not([type='hidden']), select, textarea, summary, [role='button'], [role='link'], [role='menuitem'], [role='tab'], [role='checkbox'], [role='radio'], [role='switch'], [role='slider'], [tabindex]:not([tabindex='-1'])",
                            legends: [
                                { label: "< 24px (Fail)", color: "#d93025", type: "small", wcag: [{ version: "2.2", level: "AA" }] },
                                { label: "24-43px (AA Min)", color: "#fbbc04", type: "medium", wcag: [{ version: "2.1", level: "AAA" }] },
                                { label: "44px+ (AAA)", color: "#1e8e3e", type: "large", wcag: [{ version: "2.1", level: "AAA" }] }
                            ],
                            info: {
                                what: "Computes the exact <code>width</code> and <code>height</code> pixel boundaries of interactive elements, color-coding thresholds.",
                                why: "<strong>Undersized targets prevent users with fine motor impairments</strong> (like hand tremors) from activating controls accurately without accidental clicks. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html' target='_blank'>WCAG 2.5.8: Target Size (Minimum)</a><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/target-size.html' target='_blank'>WCAG 2.5.5: Target Size (Enhanced)</a>"
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
                            desc: "<code>target='_blank'</code> links with proper warning",
                            wcag: [{ version: "2.0", level: "AAA" }],
                            selector: "a[target='_blank']",
                            legends: [{ label: "Warned", color: "#00acc1", type: "good" }],
                            info: {
                                what: "Highlights <code>target='_blank'</code> links that correctly include accessible text or ARIA warnings.",
                                why: "<strong>Confirms proper communication of context shifts.</strong> Allows assistive technologies to warn the user before the window rips them away. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html' target='_blank'>WCAG 3.2.5: Change on Request</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const txt = (el.innerText + " " + (el.getAttribute("aria-label") || "")).toLowerCase();
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
                            id: "i-accessible-name",
                            label: "Accessible Name Resolution",
                            desc: "Computes and prints the resolved accessible name",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "button, a[href], input:not([type='hidden']), select, textarea, summary, [role='button'], [role='link'], [role='menuitem'], [role='tab'], [role='checkbox'], [role='radio'], [role='switch'], [role='slider']",
                            legends: [
                                { label: "aria-labelledby", color: "#9c27b0", type: "labelledby" },
                                { label: "aria-label", color: "#00bcd4", type: "label" },
                                { label: "Native/Text", color: "#1e8e3e", type: "native" },
                                { label: "Missing Name", color: "#d93025", type: "missing" }
                            ],
                            info: {
                                what: "Computes the final accessible name by simulating the browser's fallback calculation sequence: <code>aria-labelledby</code>, then <code>aria-label</code>, then native linked labels or inner text, and finally the <code>title</code> attribute.",
                                why: "<strong>Reveals exactly what a screen reader will announce.</strong> Identifies mismatching accessible names and dangerously silent controls. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                let name = "";
                                let source = "";

                                // 1. Check aria-labelledby
                                if (el.hasAttribute('aria-labelledby')) {
                                    const ids = el.getAttribute('aria-labelledby').split(/\s+/);
                                    name = ids.map(id => {
                                        const ref = document.getElementById(id);
                                        return ref ? (ref.innerText || ref.textContent).trim() : "";
                                    }).join(" ").trim();
                                    if (name) source = "labelledby";
                                }

                                // 2. Check aria-label
                                if (!name && el.hasAttribute('aria-label')) {
                                    name = el.getAttribute('aria-label').trim();
                                    if (name) source = "label";
                                }

                                // 3. Check Native Element Properties / Associated Labels
                                if (!name) {
                                    const tag = el.tagName.toLowerCase();
                                    if (['input', 'select', 'textarea'].includes(tag)) {
                                        const id = el.id;
                                        const labelFor = id ? document.querySelector(`label[for="${id}"]`) : null;
                                        if (labelFor) {
                                            name = (labelFor.innerText || labelFor.textContent).trim();
                                            source = "native";
                                        } else if (el.closest('label')) {
                                            name = (el.closest('label').innerText || el.closest('label').textContent).trim();
                                            source = "native";
                                        } else if (tag === 'input' && ['submit', 'button', 'reset'].includes(el.type)) {
                                            name = el.value.trim();
                                            source = "native";
                                        }
                                    } else if (tag === 'img' || tag === 'area') {
                                        name = (el.getAttribute('alt') || "").trim();
                                        source = "native";
                                    } else {
                                        // For links/buttons, grab inner text and nested image alts
                                        name = Array.from(el.childNodes).map(n => {
                                            if (n.nodeType === Node.TEXT_NODE) return n.nodeValue;
                                            if (n.nodeType === Node.ELEMENT_NODE && n.tagName.toLowerCase() === 'img') return n.getAttribute('alt') || "";
                                            return n.innerText || n.textContent || "";
                                        }).join(" ").replace(/\s+/g, " ").trim();
                                        if (name) source = "native";
                                    }
                                }

                                // 4. Fallback to Title attribute
                                if (!name && el.hasAttribute('title')) {
                                    name = el.getAttribute('title').trim();
                                    if (name) source = "native";
                                }

                                // Truncate long names to prevent UI blowout
                                const shortName = name.length > 35 ? name.substring(0, 35) + "..." : name;

                                if (!name) {
                                    drawHighlight(el, "#d93025", "Missing Name", "missing");
                                } else if (source === "labelledby") {
                                    drawHighlight(el, "#9c27b0", `[id] ${shortName}`, "labelledby");
                                } else if (source === "label") {
                                    drawHighlight(el, "#00bcd4", `[aria] ${shortName}`, "label");
                                } else {
                                    drawHighlight(el, "#1e8e3e", `[text] ${shortName}`, "native");
                                }
                                return true;
                            }
                        },
                        {
                            id: "i-aria-roles",
                            label: "ARIA Roles & Attributes",
                            desc: "Maps explicit <code>role</code> definitions",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[role]",
                            legends: [{ label: "Role", color: "#673ab7", type: "info" }],
                            info: {
                                what: "Maps all elements utilizing an explicit <code>role</code> definition.",
                                why: "<strong>Allows rapid structural auditing of custom widget semantics.</strong> <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#673ab7", `role="${el.getAttribute("role")}"`, "info"); return true; }
                        },
                        {
                            id: "i-aria-live",
                            label: "ARIA Live Regions",
                            desc: "Maps dynamic <code>aria-live</code> injection containers",
                            wcag: [{ version: "2.1", level: "AA" }],
                            selector: "[aria-live]",
                            legends: [{ label: "Live Region", color: "#ff5722", type: "live" }],
                            info: {
                                what: "Maps dynamic <code>aria-live</code> injection containers (polite, assertive).",
                                why: "<strong>Ensures dynamic content updates are announced</strong> to screen readers without requiring focus. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html' target='_blank'>WCAG 4.1.3: Status Messages</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#ff5722", `aria-live="${el.getAttribute("aria-live")}"`, "live"); return true; }
                        },
                        {
                            id: "i-required-fields",
                            label: "Required Fields",
                            desc: "Mandatory input enforcement (<code>required</code> / <code>aria-required</code>)",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[required], [aria-required='true']",
                            legends: [{ label: "Required", color: "#ff9800", type: "req" }],
                            info: {
                                what: "Maps mandatory inputs enforced via HTML5 <code>required</code> or <code>aria-required</code>.",
                                why: "<strong>Ensures required status is programmatically available</strong>, not just visually styled. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html' target='_blank'>WCAG 3.3.1: Error Identification</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const txt = el.hasAttribute("required") ? "required" : 'aria-required="true"';
                                drawHighlight(el, "#ff9800", txt, "req"); return true;
                            }
                        },
                        {
                            id: "i-aria-expanded",
                            label: "Aria-Expanded State",
                            desc: "Expandable/collapsible widget states (<code>aria-expanded</code>)",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[aria-expanded]",
                            legends: [
                                { label: "True", color: "#4caf50", type: "true" },
                                { label: "False", color: "#795548", type: "false" }
                            ],
                            info: {
                                what: "Maps expandable widgets by their <code>aria-expanded</code> status, color-coded by true/false state.",
                                why: "<strong>Visualizes the current programmatic state</strong> of dynamic accordions and menus for easy testing. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
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
                            desc: "Remote DOM visibility targets (<code>aria-controls</code>)",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[aria-controls]",
                            legends: [{ label: "Controls", color: "#03a9f4", type: "info" }],
                            info: {
                                what: "Highlights elements utilizing <code>aria-controls</code> to dictate visibility of remote elements.",
                                why: "<strong>Links trigger mechanisms to their remote targets</strong> within the accessibility tree. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#03a9f4", `aria-controls`, "info"); return true; }
                        },
                        {
                            id: "i-aria-owns",
                            label: "Aria-Owns",
                            desc: "Remote programmatic ownership (<code>aria-owns</code>)",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "[aria-owns]",
                            legends: [{ label: "Owns", color: "#8bc34a", type: "own" }],
                            info: {
                                what: "Highlights elements establishing parent/child relationships outside the DOM tree via <code>aria-owns</code>.",
                                why: "<strong>Reconstructs the accessibility tree hierarchy</strong> for disjointed or floating widgets. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html' target='_blank'>WCAG 4.1.2: Name, Role, Value</a>"
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
                            desc: "Standard <code>H1-H6</code> structural outline",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "h1, h2, h3, h4, h5, h6",
                            legends: [{ label: "Heading", color: "#607d8b", type: "good" }],
                            info: {
                                what: "Maps the standard, sequential <code>H1-H6</code> heading structure.",
                                why: "<strong>Verifies the logical outline of the page.</strong> <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html' target='_blank'>WCAG 1.3.1: Info and Relationships</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#607d8b", `<${el.tagName.toLowerCase()}>`, "good"); return true; }
                        },
                        {
                            id: "i-landmarks",
                            label: "Landmark Regions",
                            desc: "HTML5 and ARIA structural landmark containers",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "main, nav, header, footer, aside, [role='main'], [role='navigation'], [role='banner'], [role='contentinfo']",
                            legends: [{ label: "Landmark", color: "#c2185b", type: "info" }],
                            info: {
                                what: "Maps native HTML5 (e.g., <code>&lt;main&gt;</code>, <code>&lt;nav&gt;</code>) and ARIA (e.g., <code>role='banner'</code>) structural landmark containers.",
                                why: "<strong>Allows screen reader users to jump quickly</strong> between core page sections via the Rotor or Shortcut lists. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html' target='_blank'>WCAG 2.4.1: Bypass Blocks</a>"
                            },
                            customHighlight: (el, drawHighlight) => {
                                const label = el.hasAttribute("role") ? el.getAttribute("role") : el.tagName.toLowerCase();
                                drawHighlight(el, "#c2185b", `<${label}>`, "info"); return true;
                            }
                        },
                        {
                            id: "i-tables",
                            label: "Table & Grid Structure",
                            desc: "Native <code>&lt;table&gt;</code> and ARIA data grids",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "table, caption, th, [role='table'], [role='grid'], [role='treegrid'], [role='columnheader'], [role='rowheader']",
                            legends: [
                                { label: "Table/Grid", color: "#303f9f", type: "solid" },
                                { label: "Header", color: "#1976d2", type: "dashed" }
                            ],
                            info: {
                                what: "Highlights native <code>&lt;table&gt;</code>, <code>&lt;caption&gt;</code>, and <code>&lt;th&gt;</code> tags, alongside custom div-based grid ARIA structures.",
                                why: "<strong>Visually maps data structures</strong> and verifies that custom UI grids correctly implement semantic headers. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html' target='_blank'>WCAG 1.3.1: Info and Relationships</a>"
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
                            desc: "Unordered (<code>&lt;ul&gt;</code>), ordered (<code>&lt;ol&gt;</code>), and definition lists (<code>&lt;dl&gt;</code>)",
                            wcag: [{ version: "2.0", level: "A" }],
                            selector: "ul, ol, li, dl, dt, dd",
                            legends: [{ label: "List Element", color: "#00796b", type: "info" }],
                            info: {
                                what: "Maps unordered (<code>&lt;ul&gt;</code>), ordered (<code>&lt;ol&gt;</code>), and glossary lists (<code>&lt;dl&gt;</code>) along with their children.",
                                why: "<strong>Ensures related items are programmatically grouped</strong> so screen readers can announce list sizes correctly. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html' target='_blank'>WCAG 1.3.1: Info and Relationships</a>"
                            },
                            customHighlight: (el, drawHighlight) => { drawHighlight(el, "#00796b", `<${el.tagName.toLowerCase()}>`, "info"); return true; }
                        },
                        {
                            id: "i-language",
                            label: "Language Definitions",
                            desc: "Phonetic shifts and root <code>lang</code> declarations",
                            wcag: [{ version: "2.0", level: "A" }, { version: "2.0", level: "AA" }],
                            selector: "html, [lang], [xml\\:lang]",
                            legends: [
                                { label: "Root Lang Missing", color: "#d93025", type: "root-miss", wcag: [{ version: "2.0", level: "A" }] },
                                { label: "Root Lang", color: "#1a73e8", type: "root-has", wcag: [{ version: "2.0", level: "A" }] },
                                { label: "Inline Shift", color: "#9c27b0", type: "shift", wcag: [{ version: "2.0", level: "AA" }] }
                            ],
                            info: {
                                what: "Maps the root document <code>lang</code> declaration alongside any mid-page inline phonetic shifts.",
                                why: "<strong>Screen readers rely on the language tag</strong> to load the correct dictionary, accent, and pronunciation rules. <br><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html' target='_blank'>WCAG 3.1.1: Language of Page</a><br><a href='https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html' target='_blank'>WCAG 3.1.2: Language of Parts</a>"
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