window.A11Y_DOCS_HTML = `
<div class="a11y-docs-container">
    <p>WICK-AG-Lens is a professional visual accessibility inspector for Web Developers and QA. It operates as a Chrome browser extension that generates visual overlays on elements to indicate accessibility violations and structural information directly within your page layout.</p>

    <h3 id="features-overview">Features Overview</h3>
    <p>WICK-AG-Lens is built for developers and QA engineers. It runs static analysis against the DOM and computed CSS styles to highlight accessibility patterns directly on the page.</p>
    <ul>
        <li><strong>40 Independent Audits:</strong> Divided into 20 actionable violations and 20 structural information checks.</li>
        <li><strong>Visual Highlighting:</strong> Draws bounding boxes and badges over target elements to clearly identify where issues occur.</li>
        <li><strong>Interactive Info Panels:</strong> Clicking any on-page badge opens a detailed panel explaining what the issue is, why it matters, and providing the exact CSS selector.</li>
        <li><strong>Precision Element Locator:</strong> Use the crosshair action inside the DevTools details modal to instantly scroll an affected element into view, marking it with a highly visible pulsating ring.</li>
        <li><strong>Accessible Interface:</strong> The extension's DevTools panel is designed to be keyboard-friendly and incorporates WCAG 2.2 AA best practices where possible.</li>
        <li><strong>One-Click Reporting:</strong> Copy formatted text reports of all active audits and their findings directly to your clipboard for easy ticket creation or bug tracking.</li>
        <li><strong>Shadow DOM &amp; Iframe Support:</strong> Pierces open web components to evaluate encapsulated markup and fully traverses same-origin iframes.</li>
        <li><strong>WCAG 2.2 Alignment:</strong> References current W3C standards for all checks.</li>
    </ul>

    <h3 id="audit-library">Audit Library &amp; Ruleset</h3>
    <p>The following details the complete list of heuristic evaluations performed by the inspector, their classification, and the corresponding W3C WCAG guidelines.</p>

    <h4 class="docs-tab-title">Tab 1: Violations & Warnings</h4>
    
    <h4>Keyboard Navigation</h4>
    <ul>
        <li><strong>Unfocusable Clickables:</strong> Flags generic elements with onclick handlers lacking tabindex and role. This is a Critical severity issue because keyboard users cannot tab to or activate these elements.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html" target="_blank">WCAG 2.1.1</a></li>
        
        <li><strong>Disabled Focus Outlines:</strong> Parses page CSS via heuristic evaluation to find focusable elements where outline is none or 0 on the focus state without a fallback box-shadow or border. This is a Critical severity issue because sighted keyboard users rely entirely on focus rings to know which element they are interacting with.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html" target="_blank">WCAG 2.4.7</a></li>
        
        <li><strong>Tabindex Violations:</strong> Flags elements with tabindex > 0. This is a Serious severity issue because it overrides natural DOM focus order, creating unpredictable navigation paths.<br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html" target="_blank">WCAG 2.4.3</a></li>
        
        <li><strong>Accesskey Attributes:</strong> Flags explicit accesskey usage. This is a Moderate severity issue because it often conflicts with native browser or screen reader shortcuts.<br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html" target="_blank">WCAG 2.1.4</a></li>
    </ul>

    <h4>Images & Media</h4>
    <ul>
        <li><strong>Missing Alt Text:</strong> Flags img elements completely lacking an alt attribute. This is a Critical severity issue because screen readers will read the raw filename if alt is missing.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html" target="_blank">WCAG 1.1.1</a></li>
        
        <li><strong>Uncaptioned Video:</strong> Flags video elements lacking nested track elements. This is a Critical severity issue because deaf or hard of hearing users require captions for video content.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html" target="_blank">WCAG 1.2.2</a></li>
        
        <li><strong>Redundant Alt Text:</strong> Flags alt attributes containing words like image or photo. This is a Minor severity issue because screen readers automatically announce images, making these prefixes redundant.<br>
        <span class="severity-badge severity-minor">MINOR</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html" target="_blank">WCAG 1.1.1</a></li>
    </ul>

    <h4>Forms & Controls</h4>
    <ul>
        <li><strong>Unlabeled Form Inputs:</strong> Flags form controls missing label wrappers, aria labels, or for attributes. This is a Critical severity issue because screen readers cannot announce what the input is for.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html" target="_blank">WCAG 3.3.2</a></li>
        
        <li><strong>Empty Buttons:</strong> Flags buttons with no text, aria-label, or child image alt. This is a Critical severity issue because screen readers will only announce 'Button', providing no context.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a></li>
        
        <li><strong>Placeholder as Label:</strong> Flags inputs relying solely on placeholders for their accessible name. This is a Serious severity issue because placeholders disappear on typing and often lack contrast.<br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a></li>
    </ul>

    <h4>Links & Navigation</h4>
    <ul>
        <li><strong>Empty Links:</strong> Flags a tags lacking readable text or accessible names. This is a Critical severity issue because screen readers will read the URL, which is often confusing.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html" target="_blank">WCAG 2.4.4</a></li>
        
        <li><strong>Suspicious Link Targets:</strong> Flags anchor tags that lack actual routing destinations and are missing a button role. Using links to trigger JS actions confuses screen readers and breaks expected spacebar keyboard operability.<br>
        <div style="margin: 6px 0;">
            <span class="severity-badge severity-critical">CRITICAL</span> javascript: targets &nbsp;|&nbsp; 
            <span class="severity-badge severity-serious">SERIOUS</span> href="#" targets
        </div>
        &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a>, <a href="https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html" target="_blank">WCAG 2.1.1</a></li>
        
        <li><strong>Generic Link Text:</strong> Flags ambiguous link text like Click Here or Read More. This is a Moderate severity issue because users navigating via a Links List will lack context for the destination.<br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html" target="_blank">WCAG 2.4.4</a></li>
        
        <li><strong>Unwarned New Window Links:</strong> Flags target blank links lacking text or ARIA warnings. This is a Moderate severity issue because unexpectedly opening new tabs disorients cognitive and screen reader users.<br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html" target="_blank">WCAG 3.2.5</a></li>
    </ul>

    <h4>ARIA & Semantics</h4>
    <ul>
        <li><strong>Focusable in Aria-Hidden:</strong> Flags focusable controls inside aria-hidden='true' subtrees. This is a Critical severity issue because keyboard users can reach them, but screen readers cannot, creating a severe mismatch.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a></li>
        
        <li><strong>Invalid ARIA State:</strong> Flags elements marked with aria-invalid='true'. This is a Serious severity issue because it identifies application-enforced validation errors.<br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html" target="_blank">WCAG 3.3.1</a></li>
        
        <li><strong>Prohibited Author Names:</strong> Flags presentation or none roles that improperly contain aria-label or aria-labelledby. This is a Serious severity issue because adding a name to a transparent structural role breaks its semantics.<br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a></li>
    </ul>

    <h4>Structure & Document</h4>
    <ul>
        <li><strong>Auto-playing Media:</strong> Flags audio or video with autoplay enabled. This is a Serious severity issue because unexpected audio conflicts with screen reader announcements.<br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html" target="_blank">WCAG 1.4.2</a></li>
        
        <li><strong>Heading Hierarchy Errors:</strong> Flags skipped sequential levels or fake structural classes. This is a Moderate severity issue because headings map document structure, and skipping levels confuses screen reader navigation.<br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a></li>
    </ul>

    <h4>Visual & Contrast</h4>
    <ul>
        <li><strong>Text Color Contrast:</strong> Traverses the DOM to calculate the effective contrast ratio between visible text and its backing container. Low contrast prevents users with visual impairments from reading content.<br>
        <div style="margin: 6px 0;">
            <span class="severity-badge severity-critical">CRITICAL</span> Fail (&lt; 3.0:1) &nbsp;|&nbsp; 
            <span class="severity-badge severity-serious">SERIOUS</span> AA Large (3.0-4.49) &nbsp;|&nbsp; 
            <span class="severity-badge severity-moderate">MODERATE</span> AA Normal (4.5-6.99)
        </div>
        &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" target="_blank">WCAG 1.4.3</a>, <a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html" target="_blank">WCAG 1.4.6</a></li>
    </ul>


    <h4 class="docs-tab-title" style="margin-top: 32px;">Tab 2: Informative & Structure</h4>
    
    <h4>Keyboard Navigation</h4>
    <ul>
        <li><strong>Tabindex (Comparison):</strong> Highlights all tabindex usages simultaneously. Important to provide a visual map of the programmatic focus strategy and custom widget interactions.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html" target="_blank">WCAG 2.4.3</a></li>
        
        <li><strong>Display Focus Order:</strong> Traces and numbers the natural sequential path of focusable elements. Important to simulate the TAB key route to ensure logical flow.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html" target="_blank">WCAG 2.4.3</a></li>
    </ul>

    <h4>Images & Media</h4>
    <ul>
        <li><strong>Display Image Alternatives:</strong> Extracts and visually prints the alt text for all img elements. Important to allow quick visual auditing of alternative text descriptions.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html" target="_blank">WCAG 1.1.1</a></li>
        
        <li><strong>Captioned Video:</strong> Highlights video elements that correctly implement track captions. Important to confirm proper multimedia accessibility setup.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html" target="_blank">WCAG 1.2.2</a></li>
        
        <li><strong>Iframe Context & Titles:</strong> Extracts explicitly defined titles from embedded iframes. Important because screen readers announce the title to inform the user what the sub-document contains before they enter it.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a></li>
    </ul>

    <h4>Forms & Controls</h4>
    <ul>
        <li><strong>Form Field Descriptions:</strong> Identifies supplemental instructional text linked to inputs via aria-describedby or title. Important to ensure extended hints or error messages are programmatically tied to inputs.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html" target="_blank">WCAG 3.3.2</a></li>
        
        <li><strong>Fieldsets & Captions:</strong> Highlights visual grouping containers and their titles. Important for grouping related radio buttons or complex form sections.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a></li>
        
        <li><strong>Touch Target Sizes:</strong> Computes the exact width and height pixel boundaries of interactive elements. Important because undersized targets prevent users with fine motor impairments from activating controls accurately.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html" target="_blank">WCAG 2.5.8</a></li>
    </ul>

    <h4>Links & Navigation</h4>
    <ul>
        <li><strong>Warned New Window Links:</strong> Highlights target blank links that correctly include accessible warnings. Important to confirm proper communication of context shifts to assistive technologies.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html" target="_blank">WCAG 3.2.5</a></li>
    </ul>

    <h4>ARIA & Semantics</h4>
    <ul>
        <li><strong>ARIA Roles & Attributes:</strong> Maps all elements utilizing an explicit role definition. Important to allow auditing of custom widget semantics.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a></li>
        
        <li><strong>ARIA Live Regions:</strong> Maps dynamic aria-live injection containers. Important to ensure dynamic content updates are announced to screen readers.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html" target="_blank">WCAG 4.1.3</a></li>
        
        <li><strong>Required Fields:</strong> Maps mandatory inputs enforced via HTML5 required or aria-required. Important to ensure required status is programmatically available.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html" target="_blank">WCAG 3.3.1</a></li>
        
        <li><strong>Aria-Expanded State:</strong> Maps expandable widgets, color-coded by true or false state. Important to visualize the current programmatic state of accordions and menus.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a></li>
        
        <li><strong>Aria-Controls:</strong> Highlights elements that dictate the visibility of remote DOM elements. Important because links trigger mechanisms to their targets.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a></li>
        
        <li><strong>Aria-Owns:</strong> Highlights elements establishing parent or child relationships outside the DOM tree. Important to reconstruct accessibility tree hierarchy for disjointed widgets.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a></li>
    </ul>

    <h4>Structure & Document</h4>
    <ul>
        <li><strong>Valid Heading Order:</strong> Maps the standard, sequential H1 to H6 structure. Important to verify the logical outline of the page.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a></li>
        
        <li><strong>Landmark Regions:</strong> Maps native HTML5 and ARIA structural containers. Important to allow screen reader users to jump quickly between page sections.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html" target="_blank">WCAG 2.4.1</a></li>
        
        <li><strong>Table & Grid Structure:</strong> Highlights native tables, captions, headers, as well as custom div-based structures. Important to visually map data structures and verify custom UI grids implement semantic headers.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a></li>
        
        <li><strong>Lists and List Items:</strong> Maps unordered, ordered, and glossary lists and children. Important to ensure related items are programmatically grouped.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a></li>
        
        <li><strong>Language Definitions:</strong> Maps the root document language declaration alongside inline phonetic shifts. Important because screen readers rely on the language tag to load the correct accent and pronunciation rules.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html" target="_blank">WCAG 3.1.1</a>, <a href="https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html" target="_blank">WCAG 3.1.2</a></li>
    </ul>


    <h3 id="limitations">Limitations &amp; Technical Bounds</h3>
    <ul>
        <li><strong>Visibility Filtering:</strong> Elements hidden via <code>display: none</code>, <code>visibility: hidden</code>, <code>hidden</code>, or <code>inert</code> are strictly excluded from all analysis to match native accessibility tree behavior.</li>
        <li><strong>Visual Occlusion:</strong> Visibility calculations rely on CSS properties. The tool does not calculate 3D geometric occlusion (e.g., an element technically "visible" in CSS but visually covered by a high <code>z-index</code> modal).</li>
        <li><strong>Focus Order:</strong> Mirrors standard browser Tab execution, prioritizing <code>tabindex &gt; 0</code>, respecting native Radio Group bundling, and ignoring disabled/hidden nodes.</li>
        <li><strong>Shadow DOMs:</strong> Standard (open) Web Components are fully traversed and supported. Explicitly 'closed' Shadow Roots remain inaccessible by browser design.</li>
        <li><strong>Iframes &amp; Cross-Origin Policies:</strong> The inspector traverses and audits the internal DOM of same-origin iframes. Due to strict browser security (Same-Origin Policy), it cannot pierce cross-origin iframes.</li>
        <li><strong>Color Contrast Heuristics:</strong> Contrast ratios are calculated using computed DOM styles. Complex backgrounds (images, gradients) or mixed element opacities may reduce accuracy compared to pixel-level visual analysis.</li>
    </ul>

    <h3 id="compatibility">Compatibility &amp; License</h3>
    <p>Compatible with Google Chrome version 100.0 or higher. Operates on all URLs permitted by the user using the <code>activeTab</code>, <code>scripting</code>, and <code>storage</code> host permissions. Available under the MIT License.</p>
</div>
`;