window.A11Y_DOCS_HTML = `
<div class="a11y-docs-container">
    <!-- Compact Hero Banner -->
    <div style="border-radius: 8px; overflow: hidden; margin-bottom: 16px; border: 1px solid rgba(128, 128, 128, 0.2); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); background: #0c0d0e; text-align: center;">
        <img src="../assets/images/wick-ag-lens-promotile.png" alt="WICK-AG-Lens Accessibility Inspector" style="width: 100%; max-height: 110px; object-fit: contain; display: block; margin: 0 auto;">
    </div>

    <!-- Intro Paragraphs -->
    <p style="margin-top: 0; margin-bottom: 12px; line-height: 1.55;">
        WICK-AG-Lens is a professional visual accessibility inspector for Web Developers and QA. It operates as a Chrome browser extension that generates visual overlays on elements to indicate accessibility violations, maps structural information, and provides a rigorous engine to simulate visual impairments directly within your page layout.
    </p>

    <p style="margin-bottom: 24px; line-height: 1.55;">
        Designed for modern web applications, it features a real-time sync engine that automatically re-audits the page when new elements are injected or made visible, seamlessly handling Single Page Application (SPA) routing and navigation without requiring a manual refresh.
    </p>

    <h3 id="features-overview">Features Overview</h3>
    <p>WICK-AG-Lens is built for developers and QA engineers. It runs static analysis against the DOM and computed CSS styles to highlight accessibility patterns, while also offering dynamic rendering filters to simulate specific user conditions and a binary scanner for PDF documents.</p>
    <ul>
        <li><strong>Real-Time SPA &amp; DOM Sync:</strong> Automatically detects Single Page Application (SPA) navigations and dynamic DOM injections (like modals), seamlessly re-auditing the page in real-time.</li>
        <li><strong>Comprehensive Audits:</strong> Divided into actionable violations and structural information checks covering many of the most common issues identified across WCAG 2.0, 2.1, and 2.2 at the A, AA, and AAA conformance levels.</li>
        <li><strong>Disability Simulation Engine:</strong> Toggle strictly modeled color vision deficiencies (CVD) and interactive physiological impairments (like cataracts, diplopia, and field loss) to empathetically audit your layout.</li>
        <li><strong>PDF Gatekeeper Auditing (New v2.5.0):</strong> Zero-dependency binary scanner to evaluate critical structural WCAG and PDF/UA prerequisites (Tags, Title, Language, Extraction Permissions) directly from the active tab.</li>
        <li><strong>WCAG Criteria Filtering:</strong> Dynamically restrict audits and legend items by specific WCAG versions (2.0, 2.1, 2.2) and conformance levels (A, AA, AAA).</li>
        <li><strong>Visual Highlighting & Focus Tracing:</strong> Draws bounding boxes and badges over target elements, and utilizes SVG paths to map out sequential, cross-iframe keyboard focus order.</li>
        <li><strong>X-Ray Vision for Clipped Elements:</strong> Renders hidden or off-screen interactive elements (like carousel slides) with a ghosted hatched pattern so you can visualize hidden focus traps without breaking the layout.</li>
        <li><strong>Interactive Info Panels &amp; Code Previews:</strong> Clicking any on-page badge opens a detailed panel explaining the issue, displaying a sanitized HTML snippet of the target element, and providing actionable remediation steps.</li>
        <li><strong>Precision Element Locator:</strong> Use the crosshair action inside the DevTools details modal to instantly scroll an affected element into view, marking it with a highly visible pulsating ring.</li>
        <li><strong>One-Click Reporting:</strong> Copy formatted text reports of all active audits, their findings, and direct remediation instructions to your clipboard for easy ticket creation or bug tracking.</li>
        <li><strong>Shadow DOM &amp; Iframe Support:</strong> Pierces open web components to evaluate encapsulated markup and fully traverses and aggregates data across iframes.</li>
    </ul>

    <h3 id="core-features">Core Features &amp; Usage</h3>
    
    <h4>1. WCAG Filtering &amp; Audit Controls (Inspect Mode)</h4>
    <p>The inspector categorizes heuristic rulesets across two primary tabs: <strong>Violations &amp; Warnings</strong> (actionable failures) and <strong>Informative &amp; Structure</strong> (valid page architecture and semantic patterns).</p>
    <ul>
        <li><strong>Version &amp; Level Filters:</strong> Dynamically restrict the visible audits using the Version (2.0, 2.1, 2.2) and Level (A, AA, AAA) filters. Toggling these checkboxes instantly redraws the page highlights to strictly match the selected compliance criteria.</li>
        <li><strong>Master Toggles &amp; Clean UI:</strong> Use the Master Toggle at the top of each tab to activate all audits instantly, and use the category chevron buttons to collapse groups for a clutter-free DevTools workspace.</li>
        <li><strong>Inline Information:</strong> Clicking the <code>[ i ]</code> icon next to any audit expands an inline panel detailing exactly <em>What it highlights</em>, <em>Why it's important</em>, and <em>How to fix it</em>, complete with links directly to the official W3C WCAG documentation.</li>
    </ul>
    <p><img src="../assets/images/wcag-filtering.png" alt="WCAG Criteria Filtering and Audit Tabs" style="max-width: 100%; border: 1px solid #5f6368; border-radius: 4px; margin-top: 8px;"></p>
    
    <h4 style="margin-top: 24px;">2. Disability Simulation Engine (Simulate Mode)</h4>
    <p>Switch from the standard "Inspect Mode" into "Simulate Mode" using the top header toggle to visually alter the host page, allowing developers to experience structural boundaries and contrast failures firsthand.</p>
    <ul>
        <li><strong>Color Blindness:</strong> Applies strict SVG <code>feColorMatrix</code> transformations to emulate Achromatopsia, Protanopia, Deuteranopia, and Tritanopia.</li>
        <li><strong>Impaired Vision:</strong> Utilizes interactive intensity sliders to dynamically emulate Double Vision (Diplopia), Loss of Contrast, Yellowing (Aging Lens), Cataracts, and Field of Vision Loss.</li>
        <li><strong>Accuracy Indicators:</strong> The UI explicitly tags simulations as <em>Strict Simulation</em> (mapped to established physiological math) or <em>Approximate</em> (combinatorial CSS filters).</li>
    </ul>
    <p><img src="../assets/images/disability-simulation-blindness.png" alt="Color Blindness Simulation" style="max-width: 100%; border: 1px solid #5f6368; border-radius: 4px; margin-top: 8px;"></p>
    <p><img src="../assets/images/disability-simulation-impaired.png" alt="Impaired Vision Simulation" style="max-width: 100%; border: 1px solid #5f6368; border-radius: 4px; margin-top: 8px;"></p>

    <h4 style="margin-top: 24px;">3. PDF Gatekeeper Auditing (PDF Mode)</h4>
    <p>Analyze raw PDF binary streams directly in the browser. Since Chrome's native PDF viewer is securely isolated and cannot be visually overlaid, this mode programmatically inspects the Document Catalog and Metadata dictionaries via an ArrayBuffer stream.</p>
    <ul>
        <li><strong>Auto-Scan Verification:</strong> Navigate to any direct PDF URL and toggle "Scan Active PDF" to execute an instant structural audit covering Tags, Titles, Language, and Extraction Permissions.</li>
        <li><strong>View Technical Details Modal:</strong> Click the details icon on any gatekeeper check to open a comprehensive modal. This displays the explicit Evaluation Finding (Pass/Fail), the precise Technical Stream Inspection output (e.g., <code>/MarkInfo &lt;&lt; /Marked true &gt;&gt;</code>), Scope Guidance, and specific Remediation steps across Adobe Acrobat, Microsoft Word, and InDesign.</li>
        <li><strong>Global Clipboard Export:</strong> A dedicated <code>Copy Tab Report</code> (&#128203;) button allows you to instantly export all 4 PDF gatekeeper checks, their statuses, technical outputs, and software-specific remediation instructions directly to your clipboard.</li>
        <li><strong>Accuracy Identifiers:</strong> Checks are clearly labeled with their confidence interval (e.g., <em>High Confidence</em> for strict catalog validation vs. <em>Moderate Confidence</em> for heuristic metadata scanning).</li>
    </ul>
    <p><img src="../assets/images/pdf-analysis-engine.png" alt="PDF Analysis Engine" style="max-width: 100%; border: 1px solid #5f6368; border-radius: 4px; margin-top: 8px;"></p>
    <p><img src="../assets/images/pdf-analysis-details.png" alt="Technical Details and Remediation" style="max-width: 100%; border: 1px solid #5f6368; border-radius: 4px; margin-top: 8px;"></p>

    <h4 style="margin-top: 24px;">4. Interactive Info Panels &amp; Code Previews</h4>
    <p>Clicking on any highlighted badge directly on the page summons a detailed DevTools-style toast notification. This panel provides immediate context for the audit, explaining <em>what</em> was flagged, <em>why</em> it creates a barrier for users, and <strong>how to fix it</strong> (utilizing clean, collapsible native HTML accordions to keep the UI compact and prevent screen clutter).</p>
    <p>Crucially, the panel extracts a clean, extension-sanitized <strong>HTML Snippet</strong> of the target element, styled with VS Code dark-theme syntax highlighting, alongside the precise <strong>CSS Selector</strong>. Dedicated "Copy" buttons (&#128203;) allow you to instantly grab the code or selector for bug reports without opening the native Elements panel.</p>
    <p><img src="../assets/images/info-panel-preview.png" alt="Interactive Info Panel with HTML Snippet Preview" style="max-width: 100%; border: 1px solid #5f6368; border-radius: 4px; margin-top: 8px;"></p>

    <h4 style="margin-top: 24px;">5. View Elements List &amp; Precision Locator</h4>
    <p>For audits that return multiple findings, clicking the "View Elements" (list icon) button inside the DevTools panel opens a comprehensive details modal displaying a hierarchically sorted list of every flagged element.</p>
    <ul>
        <li><strong>Precision Locator:</strong> Clicking the target crosshair button next to any item will smoothly scroll the browser directly to that specific element on the page, flashing a bright pulsating focus ring to help you locate it instantly—even if it is deeply nested inside a complex UI or an embedded iframe.</li>
        <li><strong>Export Modal List:</strong> A dedicated <code>Copy All</code> button allows you to copy the exact list of isolated elements, their labels, and their CSS selectors directly to your clipboard.</li>
    </ul>
    <p><img src="../assets/images/elements-locator.png" alt="View Elements List and Locator Modal" style="max-width: 100%; border: 1px solid #5f6368; border-radius: 4px; margin-top: 8px;"></p>

    <h4 style="margin-top: 24px;">6. Comprehensive Tab Reporting</h4>
    <p>To streamline QA ticketing, WICK-AG-Lens features a global clipboard export function. Clicking the clipboard icon (&#128203;) at the top of either the Violations or Informative tabs generates a fully formatted text report of your current analysis.</p>
    <ul>
        <li>The report only exports data for <strong>actively toggled audits</strong> that pass your current WCAG filters.</li>
        <li>It organizes the output by Category and Rule, explicitly logging <code>(No matching elements found)</code> for active audits that currently pass.</li>
        <li>Crucially, the exported report <strong>automatically includes explicit, actionable Remediation steps</strong> for every flagged rule, making it effortless to paste direct solutions into Jira or bug tracking tickets for your developers.</li>
    </ul>
    <p><img src="../assets/images/clipboard-report.png" alt="One-Click Clipboard Reporting Output" style="max-width: 100%; border: 1px solid #5f6368; border-radius: 4px; margin-top: 8px;"></p>

    <h4 style="margin-top: 24px;">7. Real-Time SPA &amp; Dynamic DOM Sync</h4>
    <p>WICK-AG-Lens features a Dual-Debounce MutationObserver to handle modern Single Page Applications (React, Vue, Angular) and dynamic content seamlessly.</p>
    <ul>
        <li><strong>SPA Navigation (Hard Wipe):</strong> Instantly detects URL changes via the history API, clearing old highlights and triggering a fresh audit to prevent stale ghost boxes from floating over new views.</li>
        <li><strong>Dynamic DOM Mutations (Soft Update):</strong> Listens for injected elements (e.g., lazy-loaded content) as well as state changes on pre-rendered components (e.g., toggling <code>display: none</code> or <code>aria-hidden</code> on modals and dropdowns). Once the DOM settles, it silently runs a background rescan to attach new highlights and update holistic contexts without flashing the screen.</li>
    </ul>
    <p><img src="../assets/images/spa-sync.gif" alt="Real-Time SPA Sync automatically highlighting a newly opened dropdown" style="max-width: 100%; border: 1px solid #5f6368; border-radius: 4px; margin-top: 8px;"></p>

    <h4 style="margin-top: 24px;">8. X-Ray Vision for Clipped Elements</h4>
    <p>When elements are pushed off-screen or hidden inside <code>overflow: hidden</code> containers (like carousel slides or scrollable panels), the extension detects their clipping bounds. Instead of ignoring them or drawing misleading boxes, WICK-AG-Lens renders these hidden elements using a specialized "X-Ray" ghosted hatched pattern. This allows auditors to visualize the exact footprint of hidden interactive elements and invisible focus traps without breaking the page layout.</p>
    <p><img src="../assets/images/xray-vision.png" alt="X-Ray Vision highlighting clipped carousel elements" style="max-width: 100%; border: 1px solid #5f6368; border-radius: 4px; margin-top: 8px;"></p>

    <h4 style="margin-top: 24px;">9. Embedded Offline Documentation</h4>
    <p>Accessibility auditing shouldn't require constantly hunting for internet resources. WICK-AG-Lens includes a fully embedded, offline-ready reference guide. Clicking the book icon in the extension header opens a comprehensive modal detailing every single rule, its WCAG mapping, technical limitations, and precise heuristic logic, ensuring your QA team always has context at their fingertips.</p>
    <p><img src="../assets/images/embedded-doc.png" alt="Embedded Offline Documentation" style="max-width: 100%; border: 1px solid #5f6368; border-radius: 4px; margin-top: 8px;"></p>

    <h4 style="margin-top: 24px;">10. Native Dark Mode Support</h4>
    <p>The extension's DevTools panel fully respects your system and browser theme preferences, automatically switching between light and dark modes. It utilizes strictly WCAG 2.2 AAA compliant color contrast variables across both themes, ensuring that the auditing tool itself is accessible and easy on the eyes during long debugging sessions.</p>

    <h3 id="audit-library">Audit Library &amp; Ruleset</h3>
    <p>The following details the complete list of heuristic evaluations performed by the inspector, their classification, and the corresponding W3C WCAG guidelines.</p>

    <h4 class="docs-tab-title">Tab 1: Violations & Warnings</h4>
    
    <h4>Structure & Document</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Document Title:</strong> Checks if the document is missing a <code>&lt;title&gt;</code> tag or if it is empty. <strong>Screen readers announce the page title first.</strong><br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html" target="_blank">WCAG 2.4.2</a> (2.0 A) &bull; <a href="#v-doc-title">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Page Encoding:</strong> Checks if the document character set is defined (UTF-8). <strong>Ensures text is parsed and pronounced correctly.</strong><br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A) &bull; <a href="#v-page-encoding">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Auto-playing Media:</strong> Flags audio or video elements set to <code>autoplay</code>. <strong>Unexpected audio conflicts with screen reader announcements.</strong><br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html" target="_blank">WCAG 1.4.2</a> (2.0 A) &bull; <a href="#v-18">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Heading Hierarchy Errors:</strong> Flags skipped levels (e.g., <code>H1</code> to <code>H3</code>) or fake non-semantic headings. <strong>Note: Starting a page directly with an <code>H2</code> is not flagged as a skipped level.</strong> Skipping levels confuses screen reader navigation.<br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A) &bull; <a href="#v-19">View Logic</a></li>        
    </ul>

    <h4>Images & Media</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Inaccessible SVGs:</strong> Flags inline <code>&lt;svg&gt;</code> elements exposed to screen readers lacking an accessible name. <strong>Screen readers will read out raw SVG code nodes.</strong><br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html" target="_blank">WCAG 1.1.1</a> (2.0 A) &bull; <a href="#v-svg-accessible">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Missing Alt Text:</strong> Flags <code>&lt;img&gt;</code> elements completely lacking an <code>alt</code> attribute, explicitly separating 1x1 tracking pixels. <strong>Screen readers will read the raw image filename or URL</strong> if the attribute is missing, which is highly disruptive for hidden tracking pixels.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html" target="_blank">WCAG 1.1.1</a> (2.0 A) &bull; <a href="#v-5">View Logic</a></li>

        <li style="margin-bottom: 12px;"><strong>Uncaptioned Video:</strong> Flags <code>&lt;video&gt;</code> elements missing nested <code>&lt;track&gt;</code> elements. <strong>Deaf or hard of hearing users require captions</strong> for video content.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html" target="_blank">WCAG 1.2.2</a> (2.0 A) &bull; <a href="#v-6">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Redundant Alt Text:</strong> Flags <code>alt</code> attributes containing words like <em>'image of'</em> or <em>'photo of'</em>. <strong>Screen readers automatically announce images</strong>, making these prefixes redundant.<br>
        <span class="severity-badge severity-minor">MINOR</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html" target="_blank">WCAG 1.1.1</a> (2.0 A) &bull; <a href="#v-7">View Logic</a></li>
    </ul>
    
    <h4>Links & Navigation</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Empty Links:</strong> Flags <code>&lt;a&gt;</code> tags lacking readable text or accessible names. <strong>Screen readers will read the URL</strong>, which is often confusing.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html" target="_blank">WCAG 2.4.4</a> (2.0 A) &bull; <a href="#v-11">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Suspicious Link Targets:</strong> Flags anchor tags missing routing context acting as buttons (missing <code>role='button'</code>). <strong>Using links to trigger JS actions confuses screen readers.</strong><br>
        <div style="margin: 6px 0;">
            <span class="severity-badge severity-critical">CRITICAL</span> <code>javascript:</code> targets &nbsp;|&nbsp; 
            <span class="severity-badge severity-serious">SERIOUS</span> <code>href="#"</code> targets
        </div>
        &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a>, <a href="https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html" target="_blank">WCAG 2.1.1</a> (2.0 A) &bull; <a href="#v-12">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Generic Link Text:</strong> Flags ambiguous link text like <em>'Click Here'</em> or <em>'Read More'</em> using exact word boundaries. <strong>Users navigating via a Links List will lack context</strong> for the destination.<br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html" target="_blank">WCAG 2.4.4</a> (2.0 A) &bull; <a href="#v-13">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Unwarned New Window Links:</strong> Flags <code>target='_blank'</code> links without text or ARIA warnings. <strong>Unexpectedly opening new tabs disorients cognitive and screen reader users.</strong><br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html" target="_blank">WCAG 3.2.5</a> (2.0 AAA) &bull; <a href="#v-14">View Logic</a></li>
    </ul>

    <h4>Forms & Controls</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Unlabeled Form Inputs:</strong> Flags form controls missing <code>&lt;label&gt;</code> wrappers, <code>aria-label</code>s, or <code>for</code> attributes. <strong>Screen readers cannot announce what the input is for.</strong><br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html" target="_blank">WCAG 3.3.2</a> (2.0 A) &bull; <a href="#v-8">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Empty Buttons:</strong> Flags buttons without readable text or an <code>aria-label</code>. <strong>Screen readers will only announce 'Button'</strong>, providing no context.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#v-9">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Placeholder as Label:</strong> Flags inputs relying solely on the <code>placeholder</code> attribute for their accessible name. <strong>Placeholders disappear on typing</strong> and often lack sufficient contrast.<br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#v-10">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Invalid Autocomplete:</strong> Flags fields where <code>autocomplete</code> contains unrecognized HTML5 tokens. <strong>Invalid tokens prevent browsers and password managers from functioning correctly.</strong><br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html" target="_blank">WCAG 1.3.5</a> (2.1 AA) &bull; <a href="#v-autocomplete-invalid">View Logic</a></li>
    </ul>

    <h4>Keyboard Navigation</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Unfocusable Clickables:</strong> Flags generic elements with <code>onclick</code> handlers lacking a <code>tabindex</code> and a valid semantic <code>role</code>. <strong>Keyboard users cannot tab to or activate these elements.</strong><br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html" target="_blank">WCAG 2.1.1</a> (2.0 A) &bull; <a href="#v-1">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Tabindex Violations:</strong> Flags elements dynamically forcing focus order via <code>tabindex &gt; 0</code>. <strong>Overrides natural DOM focus order</strong>, creating unpredictable navigation paths.<br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html" target="_blank">WCAG 2.4.3</a> (2.0 A) &bull; <a href="#v-3">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Accesskey Attributes:</strong> Flags explicit <code>accesskey</code> definitions. <strong>Often conflicts with native browser or screen reader shortcuts.</strong><br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html" target="_blank">WCAG 2.1.4</a> (2.1 A) &bull; <a href="#v-4">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Disabled Focus Outlines (Heuristic):</strong> Parses page CSS via heuristic evaluation to find focusable elements where <code>outline: none</code> or <code>0</code> is applied on the <code>:focus</code> state. Because browsers cannot natively compute focus states without physical interaction, this static heuristic flags elements for manual review. <strong>Sighted keyboard users rely entirely on focus rings</strong> to know which element they are interacting with.<br>
        <span class="severity-badge severity-manual">MANUAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html" target="_blank">WCAG 2.4.7</a> (2.0 AA) &bull; <a href="#v-2">View Logic</a></li>
    </ul>

    <h4>ARIA Names (Errors)</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Prohibited Author Names:</strong> Flags structural roles containing <code>aria-label</code> or <code>aria-labelledby</code>. <strong>Adding a name to a transparent structural role breaks its semantics.</strong><br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#v-17">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Label in Name Mismatch:</strong> Flags interactive elements where the visible text is completely overridden by an <code>aria-label</code> that does not include the visible text. <strong>Voice dictation users rely on visible text commands.</strong><br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html" target="_blank">WCAG 2.5.3</a> (2.1 A) &bull; <a href="#v-label-in-name">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Duplicate ID Attributes:</strong> Flags multiple elements sharing the identical <code>id</code> attribute. <strong>Screen readers and label mappings will only find the first ID.</strong><br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A) &bull; <a href="#v-duplicate-id">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Broken ARIA References:</strong> Flags ARIA relationship attributes pointing to non-existent DOM IDs. <strong>A broken reference means the relationship is completely lost.</strong><br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A) &bull; <a href="#v-broken-aria-ref">View Logic</a></li>
    </ul>

    <h4>ARIA States (Errors)</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Focusable in Aria-Hidden:</strong> Flags active controls trapped in <code>aria-hidden='true'</code> trees. <strong>Keyboard users can reach them, but screen readers cannot</strong>, creating a severe mismatch.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#v-15">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Invalid ARIA State:</strong> Flags form controls explicitly marked <code>aria-invalid='true'</code>. <strong>Identifies application-enforced validation errors.</strong><br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html" target="_blank">WCAG 3.3.1</a> (2.0 A) &bull; <a href="#v-16">View Logic</a></li>
    </ul>

    <h4>Visual & Contrast</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Text Color Contrast:</strong> Traverses the DOM to calculate the effective contrast ratio between text and its background. Dynamically evaluates <code>font-size</code> and <code>font-weight</code> against WCAG large-text thresholds. Elements over images/gradients are flagged for manual review.<br>
        <div style="margin: 6px 0;">
            <span class="severity-badge severity-critical">CRITICAL</span> AA Fail &nbsp;|&nbsp; 
            <span class="severity-badge severity-serious">SERIOUS</span> AAA Fail &nbsp;|&nbsp; 
            <span class="severity-badge severity-manual">MANUAL</span> Manual Check
        </div>
        &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" target="_blank">WCAG 1.4.3</a>, <a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html" target="_blank">WCAG 1.4.6</a> (2.0 AA, 2.0 AAA) &bull; <a href="#v-20">View Logic</a></li>
    </ul>


    <h4 class="docs-tab-title" style="margin-top: 32px;">Tab 2: Informative & Structure</h4>
    
    <h4>Structure & Document</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Valid Heading Order:</strong> Standard <code>H1-H6</code> structural outline. <strong>Verifies the logical outline of the page.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A) &bull; <a href="#i-17">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Landmark Regions:</strong> HTML5 and ARIA structural landmark containers. <strong>Allows screen reader users to jump quickly between page sections.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html" target="_blank">WCAG 2.4.1</a> (2.0 A) &bull; <a href="#i-18">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Table & Grid Structure:</strong> Native <code>&lt;table&gt;</code> and ARIA data grids. <strong>Visually maps data structures and verifies custom UI grids implement semantic headers.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A) &bull; <a href="#i-19">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Lists and List Items:</strong> Unordered (<code>&lt;ul&gt;</code>), ordered (<code>&lt;ol&gt;</code>), and definition lists (<code>&lt;dl&gt;</code>). <strong>Ensures related items are programmatically grouped.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A) &bull; <a href="#i-20">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Language Definitions:</strong> Phonetic shifts and root <code>lang</code> declarations. <strong>Screen readers rely on the language tag to load the correct accent and pronunciation rules.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html" target="_blank">WCAG 3.1.1</a>, <a href="https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html" target="_blank">WCAG 3.1.2</a> (2.0 A, 2.0 AA) &bull; <a href="#i-21">View Logic</a></li>
    </ul>

    <h4>Images & Media</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Display Image Alternatives:</strong> Extracts and visually prints the <code>alt</code> text directly over all <code>&lt;img&gt;</code> elements, explicitly segregating 1x1 tracking pixels. <strong>Allows rapid visual auditing of alternative text descriptions.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html" target="_blank">WCAG 1.1.1</a> (2.0 A) &bull; <a href="#i-3">View Logic</a></li>

        <li style="margin-bottom: 12px;"><strong>Captioned Video:</strong> Videos containing <code>&lt;track&gt;</code> elements. <strong>Confirms proper multimedia accessibility setup.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html" target="_blank">WCAG 1.2.2</a> (2.0 A) &bull; <a href="#i-4">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Iframe Context & Titles:</strong> Analyzes third-party embed context and <code>title</code> attributes. <strong>Screen readers announce the title to inform the user</strong> what the sub-document contains.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#i-5">View Logic</a></li>
    </ul>
    
    <h4>Links & Navigation</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Warned New Window Links:</strong> <code>target='_blank'</code> links with proper warning. <strong>Confirms proper communication of context shifts to assistive technologies.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html" target="_blank">WCAG 3.2.5</a> (2.0 AAA) &bull; <a href="#i-9">View Logic</a></li>
    </ul>

    <h4>Forms & Controls</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Fieldsets & Captions:</strong> Visual grouping containers (<code>&lt;fieldset&gt;</code>). <strong>Crucial for grouping related radio buttons or complex form sections.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A) &bull; <a href="#i-7">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Touch Target Sizes:</strong> Calculates interactive pixel bounds (<code>width</code> / <code>height</code>). <strong>Undersized targets prevent users with fine motor impairments from activating controls accurately.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html" target="_blank">WCAG 2.5.8</a> (2.2 AA, 2.1 AAA) &bull; <a href="#i-8">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Read-Only Fields:</strong> Inputs marked as <code>readonly</code> or <code>aria-readonly</code>. <strong>Read-only fields must remain focusable</strong> (unlike disabled fields) so screen readers can access their content.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A) &bull; <a href="#i-readonly-fields">View Logic</a></li>
    </ul>

    <h4>Keyboard Navigation</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Tabindex (Comparison):</strong> Visual comparison of all <code>tabindex</code> usages. <strong>Provides a sweeping visual map of the programmatic focus strategy.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html" target="_blank">WCAG 2.4.3</a> (2.0 A) &bull; <a href="#i-1">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Display Focus Order:</strong> Sequential trace of naturally focusable elements. Utilizes hierarchical decimal prefixing (e.g., <code>[Iframe] #4.1</code>) for isolated DOM boundaries, connected by dynamic SVG paths and numerical pills. <strong>Simulates the exact path of the <code>TAB</code> key route.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html" target="_blank">WCAG 2.4.3</a> (2.0 A) &bull; <a href="#i-2">View Logic</a></li>
    </ul>
    
    <h4>ARIA Roles (Identity)</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>ARIA Roles & Attributes:</strong> Maps explicit <code>role</code> definitions. <strong>Allows rapid structural auditing of custom widget semantics.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#i-11">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Aria-Roledescription:</strong> Custom semantic overrides via <code>aria-roledescription</code>. <strong>Overrides the native role announcement</strong> (e.g., turning 'button' into 'slide').<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#i-aria-roledescription">View Logic</a></li>
    </ul>

    <h4>ARIA Names & Relationships</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>Accessible Name Resolution:</strong> Computes the final accessible name by simulating the browser's fallback calculation sequence: <code>aria-labelledby</code>, then <code>aria-label</code>, then native associated labels/text, and finally <code>title</code>. <strong>Reveals exactly what a screen reader will announce.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#i-10">View Logic</a></li>

        <li style="margin-bottom: 12px;"><strong>Form Field Descriptions:</strong> Supplemental instructional text (<code>aria-describedby</code>). <strong>Ensures extended hints or error messages are programmatically tied to inputs.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html" target="_blank">WCAG 3.3.2</a> (2.0 A) &bull; <a href="#i-6">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Aria-Details:</strong> Highlights elements utilizing <code>aria-details</code>. <strong>Links complex, rich explanations to an element</strong> (allows structured HTML in the description).<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#i-aria-details">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Aria-Controls:</strong> Remote DOM visibility targets (<code>aria-controls</code>). <strong>Links trigger mechanisms to their targets.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#i-15">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Aria-Owns:</strong> Remote programmatic ownership (<code>aria-owns</code>). <strong>Reconstructs accessibility tree hierarchy for disjointed widgets.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#i-16">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>List Set & Position:</strong> Virtual list mapping (<code>aria-setsize</code>, <code>aria-posinset</code>). <strong>Tells screen readers the total size of a list and the element's position</strong>, even if all items aren't in the DOM.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A) &bull; <a href="#i-aria-setsize">View Logic</a></li>
    </ul>

    <h4>ARIA States (Conditions)</h4>
    <ul>
        <li style="margin-bottom: 12px;"><strong>ARIA Live Regions:</strong> Maps dynamic <code>aria-live</code> injection containers. <strong>Ensures dynamic content updates are announced to screen readers.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html" target="_blank">WCAG 4.1.3</a> (2.1 AA) &bull; <a href="#i-12">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Required Fields:</strong> Mandatory input enforcement (<code>required</code> / <code>aria-required</code>). <strong>Ensures required status is programmatically available.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html" target="_blank">WCAG 3.3.1</a> (2.0 A) &bull; <a href="#i-13">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Aria-Expanded State:</strong> Expandable/collapsible widget states (<code>aria-expanded</code>). <strong>Visualizes the current programmatic state of accordions and menus.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#i-14">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Aria-Pressed State:</strong> Toggle button states (<code>aria-pressed</code>). <strong>Visualizes the programmatic state of toggle buttons</strong> (e.g., Mute/Unmute, Play/Pause).<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#i-aria-pressed">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Aria-Value Properties:</strong> Slider & progress bar states (<code>valuenow</code>, <code>valuetext</code>). <strong>Ensures visual slider values match their programmatic data.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#i-aria-value">View Logic</a></li>
        
        <li style="margin-bottom: 12px;"><strong>Aria-Haspopup:</strong> Elements triggering overlays (<code>aria-haspopup</code>). <strong>Prepares users for a context shift</strong> by announcing an interactive overlay.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A) &bull; <a href="#i-aria-haspopup">View Logic</a></li>
    </ul>

    <h3 id="search-predicates-and-logic-definitions">Search Predicates and Logic Definitions</h3>
    <p>Elements hidden via CSS parameters like <code>display: none</code> or <code>visibility: hidden</code>, or by using the HTML <code>inert</code> attribute, are excluded by the global DOM processing logic before the specific audits run.</p>
    
    <p><strong>DOM Traversal:</strong> The extension utilizes a custom deep <code>querySelectorAll</code> function combined with bottom-up ancestor mapping. This allows the scanner to properly pierce standard (open) Shadow DOM boundaries and fully traverse the internal DOM of same-origin iframes, guaranteeing accurate visibility tracking across complex widget architectures.</p>
    
    <p><strong>Self-Auditing Guard:</strong> The injected extension UI elements (like the overlay boxes and the information toast panels) are specifically excluded from audits to prevent false positives.</p>

    <h4 style="margin-top: 16px;">Tab 1: Violations & Warnings</h4>
    <ul style="list-style-type: none; padding-left: 0;">
        <li id="v-doc-title" style="margin-bottom: 12px;"><strong>Document Title:</strong> Uses the CSS selector <code>html</code>. The logic checks if <code>document.title</code> is missing or entirely empty strings.</li>
        <li id="v-page-encoding" style="margin-bottom: 12px;"><strong>Page Encoding:</strong> Uses the CSS selector <code>html</code>. The logic evaluates <code>document.characterSet</code> to ensure it is defined and set to UTF-8.</li>
        <li id="v-18" style="margin-bottom: 12px;"><strong>Auto-playing Media:</strong> Uses the CSS selector <code>audio[autoplay], video[autoplay]</code>. Elements matching the selector are flagged.</li>
        <li id="v-19" style="margin-bottom: 12px;"><strong>Heading Hierarchy Errors:</strong> Uses the CSS selector <code>h1, h2, h3, h4, h5, h6, [role='heading'], [class*='heading'], [class*='title']</code>. The logic tracks the integer level of headings, intentionally ignoring missing H1s at the start of the document. It flags an element if the current heading level skips sequentially past the previous tracked level. It also flags elements without a role attribute if the text length is under 80 characters, utilizing a heuristic wrapper safeguard to actively ignore generic containers that correctly wrap valid native headings to prevent false positives. Outputs are separated into distinct "Skipped Level" and "Fake Heading" legends.</li>        
        <li id="v-svg-accessible" style="margin-bottom: 12px;"><strong>Inaccessible SVGs:</strong> Uses the CSS selector <code>svg:not([aria-hidden='true']):not([aria-hidden='1'])</code>. The logic ignores SVGs explicitly hidden from screen readers. For exposed SVGs, it checks if it lacks an <code>aria-label</code>, lacks a nested <code>&lt;title&gt;</code>, and is not nested within an interactive parent (like a <code>&lt;button&gt;</code>) that already provides an accessible name.</li>
        <li id="i-3" style="margin-bottom: 12px;"><strong>Display Image Alternatives:</strong> Uses the CSS selector <code>img</code>. The logic evaluates bounding dimensions to isolate 1x1 tracking pixels, and assigns distinct legends depending on whether the <code>alt</code> attribute is missing, empty, or populated.</li>
        <li id="v-6" style="margin-bottom: 12px;"><strong>Uncaptioned Video:</strong> Uses the CSS selector <code>video</code>. The logic queries descendants for <code>track[kind="captions"], track[kind="subtitles"]</code>. If the result length is 0, the video is flagged.</li>
        <li id="v-7" style="margin-bottom: 12px;"><strong>Redundant Alt Text:</strong> Uses the CSS selector <code>img[alt]</code>. The logic reads the alt attribute and uses the regular expression <code>/\\b(image|img|photo|picture|graphic)\\b/i</code> to identify redundant terms before flagging.</li>
        <li id="v-11" style="margin-bottom: 12px;"><strong>Empty Links:</strong> Uses the CSS selector <code>a[href]</code>. The logic evaluates the text content, ARIA labels, and child image alt text. If all sources of accessible names are empty, it triggers a violation.</li>
        <li id="v-12" style="margin-bottom: 12px;"><strong>Suspicious Link Targets:</strong> Uses the CSS selector <code>a[href='#'], a[href^='javascript:']</code>. The logic ignores elements that possess <code>role="button"</code>. It categorizes the remaining matches based on whether the <code>href</code> prefix is javascript or a hash.</li>
        <li id="v-13" style="margin-bottom: 12px;"><strong>Generic Link Text:</strong> Uses the CSS selector <code>a[href]</code>. The logic trims the text content and applies an exact word boundary regular expression <code>/\\b(click here|read more|learn more|more|link|here)\\b/i</code> to flag matching elements.</li>
        <li id="v-14" style="margin-bottom: 12px;"><strong>Unwarned New Window Links:</strong> Uses the CSS selector <code>a[target='_blank']</code>. The logic concatenates the text content and <code>aria-label</code> to test against the regular expression <code>/new (window|tab)/</code>. If no match is found, it flags a violation.</li>
        <li id="v-8" style="margin-bottom: 12px;"><strong>Unlabeled Form Inputs:</strong> Uses the CSS selector <code>input:not([type='hidden']):not([type='submit']):not([type='button']), select, textarea</code>. The logic searches the document for a <code>&lt;label&gt;</code> with a <code>for</code> attribute matching the input ID. It also checks the element for <code>aria-label</code> or <code>aria-labelledby</code> attributes, or if it is nested directly inside a <code>label</code> element. If all checks fail, it is flagged.</li>
        <li id="v-9" style="margin-bottom: 12px;"><strong>Empty Buttons:</strong> Uses the CSS selector <code>button, [role='button']</code>. The logic checks the text content of the element, the presence of <code>aria-label</code> or <code>aria-labelledby</code>, and the presence of child <code>img[alt]</code> elements. If the trimmed text is empty and alternative names are missing, it flags a violation.</li>
        <li id="v-10" style="margin-bottom: 12px;"><strong>Placeholder as Label:</strong> Uses the CSS selector <code>input[placeholder], textarea[placeholder]</code>. The logic checks if the element lacks a <code>label[for]</code> referencing its ID and lacks <code>aria-label</code> or <code>aria-labelledby</code> attributes.</li>
        <li id="v-autocomplete-invalid" style="margin-bottom: 12px;"><strong>Invalid Autocomplete:</strong> Uses the CSS selector <code>input[autocomplete], select[autocomplete], textarea[autocomplete]</code>. The logic splits the token values and validates them against the official W3C HTML5 autocomplete token registry.</li>
        <li id="v-1" style="margin-bottom: 12px;"><strong>Unfocusable Clickables:</strong> Uses the CSS selector <code>div[onclick], span[onclick], section[onclick]</code>. The Javascript logic evaluates each element to ensure it lacks a <code>role</code> attribute or lacks a <code>tabindex</code> attribute before flagging a violation.</li>
        <li id="v-3" style="margin-bottom: 12px;"><strong>Tabindex Violations:</strong> Uses the CSS selector <code>[tabindex]</code>. The logic parses the attribute value as a base 10 integer and triggers a violation if the value is strictly greater than 0.</li>
        <li id="v-4" style="margin-bottom: 12px;"><strong>Accesskey Attributes:</strong> Uses the CSS selector <code>[accesskey]</code>. All elements matching this selector are flagged.</li>
        <li id="v-2" style="margin-bottom: 12px;"><strong>Disabled Focus Outlines (Heuristic):</strong> Uses the base CSS selector <code>a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])</code>. The Javascript logic iterates through <code>document.styleSheets</code> and checks each <code>CSSRule.STYLE_RULE</code> to see if the selector includes <code>:focus</code> or <code>:focus-visible</code>. It reads the <code>outline</code>, <code>outlineWidth</code>, <code>boxShadow</code>, and <code>border</code> properties. If outline rules contain <code>none</code> or <code>0px</code> and no fallback border or shadow is provided in the same rule, the selector is recorded. Any interactive element matching that recorded selector is flagged for manual review, as the script cannot natively account for subsequent CSS cascade overrides.</li>
        <li id="v-17" style="margin-bottom: 12px;"><strong>Prohibited Author Names:</strong> Uses the CSS selector <code>[role='presentation'], [role='none'], [role='generic']</code>. The logic triggers a violation if the matched element has an <code>aria-label</code> or <code>aria-labelledby</code> attribute.</li>
        <li id="v-label-in-name" style="margin-bottom: 12px;"><strong>Label in Name Mismatch:</strong> Uses the CSS selector <code>button[aria-label], a[href][aria-label], [role='button'][aria-label], [role='link'][aria-label]</code>. The logic normalizes whitespace, strips punctuation, and lowercases both the visible <code>innerText</code> and the computed <code>aria-label</code>. If the visible text is not found as a substring within the <code>aria-label</code>, it throws a violation.</li>
        <li id="v-duplicate-id" style="margin-bottom: 12px;"><strong>Duplicate ID Attributes:</strong> Uses the CSS selector <code>[id]</code>. The logic tracks processed IDs to prevent redundant processing. When a duplicate is found, it uses <code>document.querySelectorAll</code> with <code>CSS.escape()</code> to fetch all colliding nodes. It evaluates <code>offsetWidth/offsetHeight</code> to categorize each node as visible or hidden, explicitly registering hidden duplicates with a lighter-colored legend so they appear distinctly in the Details Modal without rendering layout-breaking zero-pixel boxes on the screen.</li>
        <li id="v-broken-aria-ref" style="margin-bottom: 12px;"><strong>Broken ARIA References:</strong> Targets elements using <code>[aria-labelledby], [aria-describedby], [aria-controls], [aria-owns], [aria-errormessage], [aria-details], [aria-activedescendant]</code>. The logic splits the attribute values by whitespace into individual ID strings and checks if <code>document.getElementById()</code> returns null. Flags the element if any referenced ID is missing from the DOM.</li>
        <li id="v-15" style="margin-bottom: 12px;"><strong>Focusable in Aria-Hidden:</strong> Uses a bottom-up DOM traversal to check if any naturally focusable element (or its ancestors) possesses <code>aria-hidden='true'</code>. Pierces Shadow DOMs and iframes to ensure accurate detection of ghost focus traps.</li>
        <li id="v-16" style="margin-bottom: 12px;"><strong>Invalid ARIA State:</strong> Uses the CSS selector <code>[aria-invalid='true']</code>. Elements matching the selector are flagged.</li>
        <li id="v-20" style="margin-bottom: 12px;"><strong>Text Color Contrast:</strong> Uses the CSS selector targeting standard text elements like <code>h1</code>, <code>p</code>, <code>span</code>, <code>button</code>. The logic verifies child text nodes exist. It uses <code>window.getComputedStyle</code> to retrieve colors, dynamically factoring in <code>font-size</code> and <code>font-weight</code> against WCAG large-text thresholds. It calculates the WCAG relative luminance formula and dynamically evaluates failures against the user's active UI filters (AA vs AAA) so strict AAA failures are correctly caught even when AA filters are unchecked. Elements over background images or CSS gradients are automatically flagged for manual review.</li>    
    </ul>

    <h4 style="margin-top: 16px;">Tab 2: Informative & Structure</h4>
    <ul style="list-style-type: none; padding-left: 0;">
        <li id="i-17" style="margin-bottom: 12px;"><strong>Valid Heading Order:</strong> Uses the CSS selector <code>h1, h2, h3, h4, h5, h6</code>. Elements matching the selector are highlighted.</li>
        <li id="i-18" style="margin-bottom: 12px;"><strong>Landmark Regions:</strong> Uses the CSS selector <code>main, nav, header, footer, aside, [role='main'], [role='navigation'], [role='banner'], [role='contentinfo']</code>. The logic retrieves the role attribute or the HTML tag name for the badge output.</li>
        <li id="i-19" style="margin-bottom: 12px;"><strong>Table & Grid Structure:</strong> Uses the CSS selector <code>table, caption, th, [role='table'], [role='grid'], [role='treegrid'], [role='columnheader'], [role='rowheader']</code>. The logic applies a dashed style to header roles and tags, and applies a solid style for grid and table containers.</li>
        <li id="i-20" style="margin-bottom: 12px;"><strong>Lists and List Items:</strong> Uses the CSS selector <code>ul, ol, li, dl, dt, dd</code>. Elements matching the selector are highlighted.</li>
        <li id="i-21" style="margin-bottom: 12px;"><strong>Language Definitions:</strong> Uses the CSS selector <code>html, [lang], [xml\\:lang]</code>. The logic checks if the element is the root html tag. It flags the element if the root tag is missing a language attribute. It categorizes root language declarations separately from inline phonetic shifts.</li>
        <li id="i-3" style="margin-bottom: 12px;"><strong>Display Image Alternatives:</strong> Uses the CSS selector <code>img</code>. The logic assigns distinct legends depending on whether the <code>alt</code> attribute is completely missing, present but empty, or populated.</li>
        <li id="i-4" style="margin-bottom: 12px;"><strong>Captioned Video:</strong> Uses the CSS selector <code>video</code>. The logic checks for child <code>track[kind="captions"]</code> or <code>track[kind="subtitles"]</code> elements to highlight the video.</li>
        <li id="i-5" style="margin-bottom: 12px;"><strong>Iframe Context & Titles:</strong> Uses the CSS selector <code>iframe</code>. The logic checks if the iframe has <code>aria-hidden</code> set to true or <code>tabindex</code> set to -1. It flags missing titles if the <code>title</code> attribute is missing or empty, otherwise, it outputs the title text.</li>
        <li id="i-9" style="margin-bottom: 12px;"><strong>Warned New Window Links:</strong> Uses the CSS selector <code>a[target='_blank']</code>. The logic combines the text content and <code>aria-label</code> to test against the regular expression <code>/new (window|tab)/</code>. Matches are highlighted.</li>
        <li id="i-7" style="margin-bottom: 12px;"><strong>Fieldsets & Captions:</strong> Uses the CSS selector <code>fieldset, legend</code>. Elements matching the selector are highlighted.</li>
        <li id="i-8" style="margin-bottom: 12px;"><strong>Touch Target Sizes:</strong> Uses a CSS selector targeting interactive elements and roles like <code>button</code>, <code>link</code>, <code>checkbox</code>, <code>slider</code>. The logic uses <code>getBoundingClientRect()</code> to compute width and height. It finds the minimum of the two dimensions and categorizes the element based on strict WCAG thresholds: < 24px (WCAG 2.2 AA Fail), 24-43px (WCAG 2.1 AAA Fail), and 44px+ (WCAG 2.1 AAA Pass).</li>
        <li id="i-readonly-fields" style="margin-bottom: 12px;"><strong>Read-Only Fields:</strong> Uses the CSS selector <code>[readonly], [aria-readonly='true']</code>. Highlights controls marked as read-only.</li>
        <li id="i-1" style="margin-bottom: 12px;"><strong>Tabindex (Comparison):</strong> Uses the CSS selector <code>[tabindex]</code>. The logic parses the attribute as an integer and assigns different visual legends based on whether the value is equal to 0, less than 0, or greater than 0.</li>
        <li id="i-2" style="margin-bottom: 12px;"><strong>Display Focus Order:</strong> Traces and numbers the natural sequential path of focusable elements using hierarchical decimal prefixing for cross-frame focus tracking. It dynamically flags elements that receive keyboard focus but are hidden from Assistive Technologies via <code>aria-hidden='true'</code> on the element or an ancestor.</li>
        <li id="i-11" style="margin-bottom: 12px;"><strong>ARIA Roles & Attributes:</strong> Uses the CSS selector <code>[role]</code>. The logic retrieves the value of the role attribute for display.</li>
        <li id="i-aria-roledescription" style="margin-bottom: 12px;"><strong>Aria-Roledescription:</strong> Uses the CSS selector <code>[aria-roledescription]</code>. Retrieves the value of the attribute for display.</li>
        <li id="i-10" style="margin-bottom: 12px;"><strong>Accessible Name Resolution:</strong> Uses a CSS selector targeting interactive widgets. The logic simulates the browser's native fallback sequence, sequentially checking <code>aria-labelledby</code>, <code>aria-label</code>, native associated labels/inner text, and finally the <code>title</code> attribute to print exactly what the screen reader will announce.</li>
        <li id="i-6" style="margin-bottom: 12px;"><strong>Form Field Descriptions:</strong> Uses the CSS selector <code>[aria-describedby], [title]</code>. The logic outputs the presence of these specific attributes to the badge.</li>
        <li id="i-aria-details" style="margin-bottom: 12px;"><strong>Aria-Details:</strong> Uses the CSS selector <code>[aria-details]</code>. Elements matching the selector are highlighted.</li>
        <li id="i-15" style="margin-bottom: 12px;"><strong>Aria-Controls:</strong> Uses the CSS selector <code>[aria-controls]</code>. Elements matching the selector are highlighted.</li>
        <li id="i-16" style="margin-bottom: 12px;"><strong>Aria-Owns:</strong> Uses the CSS selector <code>[aria-owns]</code>. Elements matching the selector are highlighted.</li>
        <li id="i-aria-setsize" style="margin-bottom: 12px;"><strong>List Set & Position:</strong> Uses the CSS selector <code>[aria-setsize], [aria-posinset]</code>. The logic retrieves the position and set size values for the badge output.</li>
        <li id="i-12" style="margin-bottom: 12px;"><strong>ARIA Live Regions:</strong> Uses the CSS selector <code>[aria-live]</code>. The logic retrieves the value of the aria-live attribute for display.</li>
        <li id="i-13" style="margin-bottom: 12px;"><strong>Required Fields:</strong> Uses the CSS selector <code>[required], [aria-required='true']</code>. The logic distinguishes between HTML required attributes and ARIA required attributes for the output.</li>
        <li id="i-14" style="margin-bottom: 12px;"><strong>Aria-Expanded State:</strong> Uses the CSS selector <code>[aria-expanded]</code>. The logic categorizes the element based on whether the attribute equals true or false.</li>
        <li id="i-aria-pressed" style="margin-bottom: 12px;"><strong>Aria-Pressed State:</strong> Uses the CSS selector <code>[aria-pressed]</code>. The logic categorizes the toggle button state based on whether the attribute equals true, false, or mixed.</li>
        <li id="i-aria-value" style="margin-bottom: 12px;"><strong>Aria-Value Properties:</strong> Uses the CSS selector <code>[aria-valuenow], [aria-valuetext]</code>. Retrieves the active numerical or text value of the slider/progress bar.</li>
        <li id="i-aria-haspopup" style="margin-bottom: 12px;"><strong>Aria-Haspopup:</strong> Uses the CSS selector <code>[aria-haspopup]</code>. Retrieves the overlay type parameter for display.</li>
    </ul>

    <h3 id="disability-simulation-engine-logic--assumptions">Disability Simulation Engine (Logic &amp; Assumptions)</h3>
    <p>The Simulate Mode provides an empathetic heuristic overlay to help developers identify critical contrast and layout barriers by simulating severe visual impairments directly in the DOM. These modules map to documented mathematical approximations rather than applying arbitrary color tints.</p>
    
    <h4 style="margin-top: 16px;">Color Vision Deficiencies (CVD)</h4>
    <ul>
        <li><strong>Achromatopsia (Monochromacy):</strong> Simulates a complete absence of color perception. Rather than a basic grayscale filter, it utilizes a standard SVG <code>feColorMatrix</code> mapped strictly to the WCAG relative luminance formula <code>(0.2126 R + 0.7152 G + 0.0722 B)</code> to ensure colors are converted to grayscale in direct proportion to their perceived brightness.</li>
        <li><strong>Protanopia &amp; Deuteranopia (Red/Green Blindness):</strong> Simulates the physiological lack of L-cones and M-cones, respectively. It applies the precise mathematical linearRGB Viénot model matrices via an SVG <code>feColorMatrix</code>.</li>
        <li><strong>Tritanopia (Blue-Blindness):</strong> Simulates the lack of S-cones. While a perfect simulation requires a 3D dual-plane mapping (Brettel 1997), WICK-AG-Lens utilizes an optimized SVG linear least-squares approximation matrix to maintain high-performance, real-time rendering within the browser compositor.</li>
    </ul>

    <h4 style="margin-top: 16px;">Impaired Vision Physiology</h4>
    <ul>
        <li><strong>Double Vision (Diplopia):</strong> Simulates perceiving a secondary ghosted image offset from the original content. It renders a highly accurate secondary ghost image using an SVG <code>feOffset</code> function combined with an alpha reduction (<code>feFuncA</code>) and composites it using <code>feBlend</code> directly into the page layer.</li>
        <li><strong>Loss of Contrast:</strong> Reduces the ability to distinguish between text and its surrounding background. It utilizes the native CSS <code>contrast()</code> function to reduce the luminance amplitude difference between elements while purposefully maintaining structural color (unlike other tools that biologically misrepresent contrast loss by aggressively converting the page to grayscale).</li>
        <li><strong>Yellowing (Aging Lens / Nuclear Sclerosis):</strong> Simulates the natural yellowing of the eye crystalline lens over time. Rather than utilizing a generic CSS <code>sepia()</code> tone (which unrealistically paints everything brown), it uses a custom SVG <code>feColorMatrix</code> that fundamentally degrades the blue channel to replicate the actual biological absorption of short-wavelength light.</li>
        <li><strong>Cataracts:</strong> Simulates the progressive clouding of the eye lens. It employs an approximate combinatorial filter simulating light scattering and opacity by mathematically intertwining a Gaussian blur function alongside a proportional drop in visual contrast and minor short-wavelength light absorption.</li>
        <li><strong>Field of Vision Loss:</strong> Simulates both Central Loss (Macular Degeneration) and Peripheral Loss (Glaucoma/Tunnel Vision). It employs a non-interactive overlay bounded by a static CSS radial gradient. Central Loss creates a localized central scotoma constrained correctly to a 20% limit of the visual angle, while Peripheral Loss aggressively restricts outer inputs, shrinking the clear tunnel down to 5%.</li>
    </ul>

    <h3 id="pdf-accessibility-engine-logic--assumptions">PDF Accessibility Engine (Logic &amp; Assumptions)</h3>
    <p>The PDF Mode provides a programmatic structural verification of essential PDF/UA and WCAG gatekeeper indicators directly from the active binary stream.</p>
    <ul>
        <li><strong>Tagged PDF (Structure Tree):</strong> Scans the Document Catalog for the <code>/MarkInfo</code> dictionary. Ensures <code>/Marked true</code> is present and <code>/Marked false</code> is not. A missing tag tree prevents screen readers from understanding reading order and semantics (WCAG 1.3.1 & ISO 14289-1).</li>
        <li><strong>Document Title:</strong> Uses a heuristic metadata scanner to search the Info dictionary for literal or hex-encoded <code>/Title</code> metadata, and verifies if <code>/DisplayDocTitle</code> is enforced (WCAG 2.4.2).</li>
        <li><strong>Primary Language:</strong> Strict Catalog property validation. Scans for the root <code>/Lang</code> ISO language code identifier to ensure speech synthesizers load the correct phonetic dictionary (WCAG 3.1.1).</li>
        <li><strong>Accessibility Extraction Permission:</strong> Strict bitmask calculation. Evaluates User Security Access Permissions (<code>/P</code>). Evaluates Bit 10 (value 512, <code>0x200</code>) to ensure assistive technologies are mathematically permitted to extract text contents if the document is encrypted (Robust Principle).</li>
    </ul>

    <h3 id="limitations">Limitations &amp; Technical Bounds</h3>
    
    <h4 style="margin-top: 16px;">Inspect Mode</h4>
    <ul>
        <li><strong>Visibility Filtering:</strong> Elements hidden via <code>display: none</code>, <code>visibility: hidden</code>, <code>hidden</code>, or <code>inert</code> are strictly excluded from all analysis to match native accessibility tree behavior.</li>
        <li><strong>Z-Index Occlusion:</strong> Visibility calculations rely on CSS properties. The tool does not calculate 3D geometric occlusion (e.g., an element technically "visible" in the DOM but visually covered by a high <code>z-index</code> modal).</li>
        <li><strong>Iframes &amp; Cross-Origin Policies:</strong> The tool successfully aggregates data across all active iframes. However, it cannot bypass strict Same-Origin Policies to force browser scroll events inside cross-origin windows.</li>
    </ul>

    <h4 style="margin-top: 16px;">Simulate Mode</h4>
    <ul>
        <li><strong>Hardware & Monitor Limitations:</strong> All visual simulations are inherently constrained by the physical hardware of the screen (monitor color calibration, backlight brightness, viewing angle, and ambient room lighting).</li>
        <li><strong>Impaired Vision Approximations:</strong> Conditions like Cataracts and Loss of Contrast are generated using mathematical CSS filter combinations. They mimic the optical experience to identify severe contrast issues but do not perfectly replicate the physiological deterioration of the human eye.</li>
    </ul>

    <h4 style="margin-top: 16px;">PDF Mode</h4>
    <ul>
        <li><strong>Native PDF Viewer Sandbox:</strong> Chrome strictly isolates PDF rendering inside an internal, inaccessible plugin layer. The DOM cannot be directly traversed or highlighted with visual overlays.</li>
        <li><strong>Binary Stream Analysis:</strong> Checks are performed programmatically via static byte inspection of the raw PDF Document Catalog, which may miss data exclusively locked in highly compressed Object Streams (<code>/ObjStm</code>).</li>
        <li><strong>Scope & Coverage:</strong> Programmatic validation verifies critical structural prerequisites with zero false positives. Deep layout semantics (e.g., table header associations, reading order, alternative text on individual vector figures) still require manual screen reader or PDF/UA inspection (e.g., PAC).</li>
    </ul>

    <h3 id="compatibility">Compatibility &amp; License</h3>
    <p>Compatible with Google Chrome version 100.0 or higher. Operates on all URLs permitted by the user using the <code>activeTab</code> and <code>storage</code> permissions. Available under the MIT License.</p>

    <h3 id="open-source-reference">Open Source &amp; Implementation Details</h3>
    <div style="display: flex; align-items: center; background-color: rgba(26, 115, 232, 0.1); border-left: 4px solid #1a73e8; border-radius: 4px; padding: 16px; margin: 24px 0;">
        <svg style="min-width: 32px; margin-right: 16px;" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
        <div>
            <div style="font-size: 16px; font-weight: bold; color: #1a73e8; margin-bottom: 4px;">Proudly Open Source</div>
            <p style="margin: 0; line-height: 1.5;">WICK-AG-Lens is driven by the community. Explore the source code, contribute, or report issues on our <a href="https://github.com/sclavijosuero/wick-ag-lens" target="_blank" rel="noopener noreferrer" style="color: #1a73e8; font-weight: 600; text-decoration: underline;">GitHub Repository &rarr;</a></p>
        </div>
    </div>
</div>
`;