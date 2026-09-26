document.addEventListener("DOMContentLoaded", () => {
    // 1. Establish strict DevTools Tab ID scope
    const tabId = chrome.devtools.inspectedWindow.tabId;
    const STORAGE_KEY_FEATURES = `a11y_active_features_${tabId}`;
    const STORAGE_KEY_GROUPS = `a11y_collapsed_groups_${tabId}`;

    // --- Dynamic Copyright Year ---
    const yearEl = document.getElementById("copyright-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // 2. Tab Switching Logic with ARIA states
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-selected", "false");
            });
            tabContents.forEach(c => c.classList.remove("active"));
            
            btn.classList.add("active");
            btn.setAttribute("aria-selected", "true");
            document.getElementById(btn.getAttribute("aria-controls")).classList.add("active");
        });
    });

    const footerExpandBtn = document.getElementById("footer-expand-btn");
    if (footerExpandBtn) {
        footerExpandBtn.addEventListener("click", () => {
            const footer = document.getElementById("footer-restrictions");
            if (footer) {
                const isCollapsed = footer.classList.toggle("collapsed");
                footerExpandBtn.setAttribute("aria-expanded", !isCollapsed);
            }
        });
    }

    const config = window.A11Y_CONFIG;

    function getFeatureConfigById(featureId) {
        if (!config) return null;
        for (let tab of config.tabs) {
            for (let cat of tab.categories) {
                for (let f of cat.features) {
                    if (f.id === featureId) return f;
                }
            }
        }
        return null;
    }

    const frameCounts = {};

    function updateFeatureBadges(featureId) {
        const aggregateTotals = {};
        let grandTotal = 0;

        if (frameCounts[featureId]) {
            Object.values(frameCounts[featureId]).forEach(totals => {
                for (const [type, count] of Object.entries(totals)) {
                    aggregateTotals[type] = (aggregateTotals[type] ? aggregateTotals[type] : 0) + count;
                    grandTotal += count;
                }
            });
        }

        const toggle = document.querySelector(`.feature-toggle[data-feature="${featureId}"]`);
        const isActive = toggle ? toggle.checked : false;

        const feature = getFeatureConfigById(featureId);
        if (feature && feature.legends) {
            feature.legends.forEach(leg => {
                const badge = document.getElementById(`count-${featureId}-${leg.type}`);
                if (badge) {
                    const count = aggregateTotals[leg.type] ? aggregateTotals[leg.type] : 0;
                    badge.textContent = count;
                    if (isActive) badge.classList.add("visible");
                    else badge.classList.remove("visible");
                }
            });
        }

        const totalBadge = document.getElementById(`total-${featureId}`);
        if (totalBadge) {
            totalBadge.textContent = `${grandTotal} elements`;
            if (isActive) totalBadge.classList.add("visible");
            else totalBadge.classList.remove("visible");
        }

        const viewBtn = document.getElementById(`view-${featureId}`);
        if (viewBtn) {
            if (grandTotal > 0 && isActive) {
                viewBtn.classList.add("visible");
                viewBtn.title = "Inspect Element in Elements Panel";
            } else {
                viewBtn.classList.remove("visible");
                viewBtn.title = "View Elements (None)";
            }
        }
        
        updateAggregateCounts();
    }

    function resetBadges(featureId) {
        delete frameCounts[featureId];
        updateFeatureBadges(featureId);
    }

    function saveActiveFeaturesState() {
        const activeFeatures = Array.from(document.querySelectorAll('.feature-toggle:checked'))
            .map(cb => cb.getAttribute('data-feature'));
        chrome.storage.local.set({ [STORAGE_KEY_FEATURES]: activeFeatures });
    }

    function saveCollapsedState() {
        const collapsedGroups = Array.from(document.querySelectorAll('.category-group.collapsed'))
            .map(g => g.id);
        chrome.storage.local.set({ [STORAGE_KEY_GROUPS]: collapsedGroups });
    }

    const setupGlobalCollapseToggle = (tabIdName, toggleBtnId) => {
        const btn = document.getElementById(toggleBtnId);
        if (!btn) return () => {};
        
        const evaluateState = () => {
            const groups = document.querySelectorAll(`#${tabIdName} .category-group`);
            if (groups.length === 0) return;
            const allCollapsed = Array.from(groups).every(g => g.classList.contains('collapsed'));
            if (allCollapsed) {
                btn.classList.add('collapsed');
                btn.title = "Expand All";
            } else {
                btn.classList.remove('collapsed');
                btn.title = "Collapse All";
            }
        };

        btn.addEventListener("click", () => {
            const isCurrentlyCollapsed = btn.classList.contains('collapsed');
            const groups = document.querySelectorAll(`#${tabIdName} .category-group`);
            
            groups.forEach(g => {
                if (isCurrentlyCollapsed) {
                    g.classList.remove('collapsed');
                } else {
                    g.classList.add('collapsed');
                }
                
                const expandBtn = g.querySelector('.category-expand-btn');
                if (expandBtn) {
                    expandBtn.setAttribute("aria-expanded", isCurrentlyCollapsed);
                }
            });
            
            saveCollapsedState();
            evaluateState();
        });

        return evaluateState;
    };

    const evalViolationsCollapseState = setupGlobalCollapseToggle("tab-violations", "toggle-collapse-violations");
    const evalInformativeCollapseState = setupGlobalCollapseToggle("tab-informative", "toggle-collapse-informative");

    function updateTabHierarchyStates(tabContainerId) {
        const container = document.getElementById(tabContainerId);
        if (!container) return;

        const masterToggleId = tabContainerId === "tab-violations" ? "master-toggle-violations" : "master-toggle-informative";
        const masterToggle = document.getElementById(masterToggleId);

        let totalTabFeatures = 0;
        let checkedTabFeatures = 0;

        const categoryGroups = container.querySelectorAll(".category-group");
        categoryGroups.forEach(group => {
            const catToggle = group.querySelector(".category-toggle");
            const featureToggles = group.querySelectorAll(".feature-toggle");
            
            let catTotal = featureToggles.length;
            let catChecked = 0;

            featureToggles.forEach(ft => {
                if (ft.checked) catChecked++;
            });

            totalTabFeatures += catTotal;
            checkedTabFeatures += catChecked;

            if (catToggle) {
                if (catChecked === catTotal && catTotal > 0) {
                    catToggle.checked = true;
                    catToggle.indeterminate = false;
                } else if (catChecked === 0) {
                    catToggle.checked = false;
                    catToggle.indeterminate = false;
                } else {
                    catToggle.checked = false;
                    catToggle.indeterminate = true;
                }
            }
        });

        if (masterToggle) {
            if (checkedTabFeatures === totalTabFeatures && totalTabFeatures > 0) {
                masterToggle.checked = true;
                masterToggle.indeterminate = false;
            } else if (checkedTabFeatures === 0) {
                masterToggle.checked = false;
                masterToggle.indeterminate = false;
            } else {
                masterToggle.checked = false;
                masterToggle.indeterminate = true;
            }
        }
        
        updateAggregateCounts();
    }

    function updateAllHierarchyStates() {
        updateTabHierarchyStates("tab-violations");
        updateTabHierarchyStates("tab-informative");
    }

    function updateAggregateCounts() {
        ['tab-violations', 'tab-informative'].forEach(tabName => {
            const container = document.getElementById(tabName);
            if (!container) return;

            let tabCheckedFeatures = 0;
            let tabTotalFound = 0;

            const categoryGroups = container.querySelectorAll(".category-group");
            categoryGroups.forEach(group => {
                const catToggle = group.querySelector(".category-toggle");
                if (!catToggle) return;
                const catId = catToggle.getAttribute("data-cat");
                
                let catCheckedFeatures = 0;
                let catTotalFound = 0;

                const featureToggles = group.querySelectorAll(".feature-toggle");
                const catTotalFeatures = featureToggles.length;

                featureToggles.forEach(ft => {
                    if (ft.checked) {
                        catCheckedFeatures++;
                        const featureId = ft.getAttribute("data-feature");
                        
                        let featureTotal = 0;
                        if (frameCounts[featureId]) {
                            Object.values(frameCounts[featureId]).forEach(totals => {
                                Object.values(totals).forEach(count => {
                                    featureTotal += count;
                                });
                            });
                        }
                        catTotalFound += featureTotal;
                    }
                });

                tabCheckedFeatures += catCheckedFeatures;
                tabTotalFound += catTotalFound;

                const catCountEl = document.getElementById(`cat-count-${catId}`);
                if (catCountEl) {
                    if (catCheckedFeatures > 0) {
                        catCountEl.textContent = `${catCheckedFeatures} active audits of ${catTotalFeatures} • ${catTotalFound} elements`;
                        catCountEl.classList.add("visible");
                    } else {
                        catCountEl.classList.remove("visible");
                    }
                }
            });

            const masterSuffix = tabName === 'tab-violations' ? 'violations' : 'informative';
            const masterCountEl = document.getElementById(`master-count-${masterSuffix}`);
            const copyReportBtn = document.getElementById(`copy-report-${masterSuffix}`);

            if (masterCountEl) {
                if (tabCheckedFeatures > 0) {
                    const totalPossibleTabFeatures = container.querySelectorAll('.feature-toggle').length;
                    masterCountEl.textContent = `${tabCheckedFeatures} active audits of ${totalPossibleTabFeatures} • ${tabTotalFound} elements`;
                    masterCountEl.classList.add("visible");
                } else {
                    masterCountEl.classList.remove("visible");
                }
            }

            if (copyReportBtn) {
                if (tabCheckedFeatures > 0) {
                    copyReportBtn.classList.add("visible");
                } else {
                    copyReportBtn.classList.remove("visible");
                }
            }
        });
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

    function copyTabReport(tabName, btnEl) {
        const activeToggles = Array.from(document.querySelectorAll(`#${tabName} .feature-toggle:checked`));
        if (activeToggles.length === 0) return;

        const activeFeatureIds = activeToggles.map(t => t.getAttribute('data-feature'));

        chrome.tabs.sendMessage(tabId, { action: 'getTabReportData', featureIds: activeFeatureIds }, (response) => {
            if (chrome.runtime.lastError || !response) return;

            const tabTitle = tabName === 'tab-violations' ? 'VIOLATIONS & WARNINGS' : 'INFORMATIVE & STRUCTURE';
            const now = new Date();
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const dateStr = now.toLocaleString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
            });

            let totalElements = 0;
            Object.values(response.data || {}).forEach(arr => totalElements += arr.length);

            let report = `************************************************************\n`;
            report += `WICK-AG-LENS REPORT: ${tabTitle}\n`;
            report += `************************************************************\n`;
            report += `• Generated:  ${dateStr} (${timeZone})\n`;
            report += `• Page URL:   ${response.url || 'Unknown'}\n`;
            report += `• Page Title: ${response.title || 'Unknown'}\n`;
            report += `• Summary:    ${activeFeatureIds.length} Active Audits | ${totalElements} Total Findings\n`;
            report += `============================================================\n\n\n`;

            const tabConfig = config.tabs.find(t => t.id === tabName);
            if (tabConfig) {
                const groupBlocks = [];

                tabConfig.categories.forEach(cat => {
                    const activeCatFeatures = cat.features.filter(f => activeFeatureIds.includes(f.id));
                    if (activeCatFeatures.length > 0) {
                        let groupText = `============================================================\n`;
                        groupText += `GROUP: ${cat.label.toUpperCase()}\n`;
                        groupText += `============================================================\n\n`;

                        const auditBlocks = [];
                        activeCatFeatures.forEach(feature => {
                            const elements = response.data[feature.id] || [];
                            const elemCountLabel = `${elements.length} ${elements.length === 1 ? 'element' : 'elements'}`;
                            
                            let auditText = `------------------------------------------------------------\n`;
                            const severityMarker = feature.severity ? ` [SEVERITY: ${feature.severity.toUpperCase()}]` : '';
                            auditText += `AUDIT: ${feature.label.toUpperCase()}${severityMarker} (${elemCountLabel})\n`;
                            auditText += `Description: ${feature.desc}\n`;
                            auditText += `------------------------------------------------------------\n`;

                            if (elements.length > 0) {
                                elements.forEach(el => {
                                    const displayLabel = formatLabel(el.legendLabel, el.label);
                                    auditText += `[${displayLabel}] ${el.selector}\n`;
                                });
                            } else {
                                auditText += `(No matching elements found)\n`;
                            }
                            auditBlocks.push(auditText);
                        });

                        groupText += auditBlocks.join('\n\n');
                        groupBlocks.push(groupText);
                    }
                });
                report += groupBlocks.join('\n\n\n');
            }

            navigator.clipboard.writeText(report.trim()).then(() => {
                const originalText = btnEl.textContent;
                btnEl.textContent = '✔';
                btnEl.title = 'Report Copied!';
                setTimeout(() => {
                    btnEl.textContent = originalText;
                    btnEl.title = 'Copy Tab Report to Clipboard';
                }, 2000);
            });
        });
    }

    const copyViolationsBtn = document.getElementById("copy-report-violations");
    if (copyViolationsBtn) copyViolationsBtn.addEventListener("click", () => copyTabReport("tab-violations", copyViolationsBtn));

    const copyInformativeBtn = document.getElementById("copy-report-informative");
    if (copyInformativeBtn) copyInformativeBtn.addEventListener("click", () => copyTabReport("tab-informative", copyInformativeBtn));

    // 3. Build UI from Configuration
    config.tabs.forEach(tab => {
        const container = document.getElementById(tab.id === "tab-violations" ? "violations-container" : "informative-container");
        if (!container) return;

        tab.categories.forEach(cat => {
            const groupDiv = document.createElement("div");
            groupDiv.className = "category-group";
            groupDiv.id = `group-${cat.id}`;

            const headerDiv = document.createElement("div");
            headerDiv.className = "category-header";
            
            headerDiv.innerHTML = `
                <label class="toggle-switch category-toggle-wrapper">
                    <input type="checkbox" class="category-toggle" data-cat="${cat.id}" data-tab="${tab.id}" aria-label="Toggle all ${cat.label}">
                    <span class="slider"></span>
                </label>
                <button class="category-expand-btn" aria-expanded="true" aria-controls="group-${cat.id}">
                    <span class="category-header-title">${cat.label}</span>
                    <span class="category-count-info" id="cat-count-${cat.id}"></span>
                    <span class="category-chevron">▼</span>
                </button>
            `;
            groupDiv.appendChild(headerDiv);

            const expandBtn = headerDiv.querySelector('.category-expand-btn');
            expandBtn.addEventListener("click", () => {
                const isCollapsed = groupDiv.classList.toggle('collapsed');
                expandBtn.setAttribute("aria-expanded", !isCollapsed);
                saveCollapsedState();
                
                if (tab.id === 'tab-violations') evalViolationsCollapseState();
                else evalInformativeCollapseState();
            });

            cat.features.forEach(feature => {
                const rowDiv = document.createElement("div");
                rowDiv.className = "feature-row";
                rowDiv.id = `row-${feature.id}`;

                const severityHtml = feature.severity ? `<span class="severity-badge severity-${feature.severity.toLowerCase()}">${feature.severity}</span>` : '';

                let legendHtml = '';
                if (feature.legends) {
                    feature.legends.forEach(leg => {
                        legendHtml += `
                            <div class="legend-item">
                                <div class="legend-color" style="background-color:${leg.color}; ${leg.type === 'dashed' ? 'border:2px dashed #000;background:transparent' : ''}"></div>
                                <span>${leg.label} <span class="count-badge" id="count-${feature.id}-${leg.type}">0</span></span>
                            </div>
                        `;
                    });
                }

                rowDiv.innerHTML = `
                    <div class="feature-main">
                        <label class="toggle-switch">
                            <input type="checkbox" class="feature-toggle" data-feature="${feature.id}" data-tab="${tab.id}" aria-label="Toggle ${feature.label}">
                            <span class="slider"></span>
                        </label>
                        <div class="feature-content">
                            <div class="feature-title">
                                ${feature.label}
                                ${severityHtml}
                                <span class="count-badge" id="total-${feature.id}">0 elements</span>
                            </div>
                            <div class="feature-desc">${feature.desc}</div>
                            <div class="legend-area">${legendHtml}</div>
                            
                            <div class="info-panel" id="info-${feature.id}">
                                <div class="info-section">
                                    <strong>What it highlights:</strong>
                                    ${feature.info ? feature.info.what : 'No data'}
                                </div>
                                <div class="info-section">
                                    <strong>Why it's important:</strong>
                                    ${feature.info ? feature.info.why : 'No data'}
                                </div>
                            </div>
                        </div>
                        <div class="actions-area">
                            <button class="icon-btn view-btn" id="view-${feature.id}" title="View Elements List">
                                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                </svg>
                            </button>
                            <button class="icon-btn info-btn" id="infobtn-${feature.id}" title="Why is this important?">
                                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
                groupDiv.appendChild(rowDiv);

                const viewBtn = rowDiv.querySelector(`#view-${feature.id}`);
                viewBtn.addEventListener("click", () => {
                    chrome.tabs.sendMessage(tabId, { action: 'getRuleDetails', ruleId: feature.id }, (response) => {
                        if (chrome.runtime.lastError || !response || !response.elements) return;
                        const ruleMapping = { name: feature.label, description: feature.desc, severity: feature.severity };
                        openDetailsModal(ruleMapping, response.elements);
                    });
                });
            });

            container.appendChild(groupDiv);
        });
    });

    document.querySelectorAll(".info-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const btnEl = e.currentTarget;
            const id = btnEl.id.replace("infobtn-", "");
            document.getElementById(`info-${id}`).classList.toggle("visible");
        });
    });

    // 4. Input Toggle Logic
    document.querySelectorAll(".feature-toggle").forEach(toggle => {
        toggle.addEventListener("change", (e) => {
            const featureId = e.target.getAttribute("data-feature");
            const tabName = e.target.getAttribute("data-tab");
            const action = e.target.checked ? "highlight" : "clear";
            
            chrome.tabs.sendMessage(tabId, { action, featureId });

            if (!e.target.checked) resetBadges(featureId);
            updateTabHierarchyStates(tabName);
            saveActiveFeaturesState();
        });
    });

    document.querySelectorAll(".category-toggle").forEach(catToggle => {
        catToggle.addEventListener("change", (e) => {
            const isChecked = e.target.checked;
            const categoryGroup = e.target.closest(".category-group");
            const tabName = e.target.getAttribute("data-tab");

            if (categoryGroup) {
                const childToggles = categoryGroup.querySelectorAll(".feature-toggle");
                childToggles.forEach(ft => {
                    if (ft.checked !== isChecked) {
                        ft.checked = isChecked;
                        ft.dispatchEvent(new Event('change'));
                    }
                });
            }
            updateTabHierarchyStates(tabName);
        });
    });

    const handleMasterToggle = (masterId, containerId) => {
        const master = document.getElementById(masterId);
        if (!master) return;
        master.addEventListener("change", (e) => {
            const isChecked = e.target.checked;
            const toggles = document.querySelectorAll(`#${containerId} .feature-toggle`);
            toggles.forEach(t => {
                if (t.checked !== isChecked) {
                    t.checked = isChecked;
                    t.dispatchEvent(new Event('change'));
                }
            });
            updateTabHierarchyStates(containerId);
        });
    };
    handleMasterToggle("master-toggle-violations", "tab-violations");
    handleMasterToggle("master-toggle-informative", "tab-informative");

    // 5. DevTools Lifecycle Management (Port & Reloads)
    let panelPort = null;
    function connectToContentScript() {
        if (panelPort) panelPort.disconnect();
        panelPort = chrome.tabs.connect(tabId, { name: "a11y-panel" });
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (sender.tab && sender.tab.id === tabId) {
            if (request.action === "contentScriptReady") {
                connectToContentScript();
                
                for (let fid in frameCounts) {
                    delete frameCounts[fid];
                    updateFeatureBadges(fid);
                }
                updateAllHierarchyStates();
                
                const activeFeatures = Array.from(document.querySelectorAll('.feature-toggle:checked')).map(cb => cb.getAttribute('data-feature'));
                activeFeatures.forEach(featureId => {
                    chrome.tabs.sendMessage(tabId, { action: 'highlight', featureId });
                });
            }
            
            if (request.action === "updateCounts") {
                if (!frameCounts[request.featureId]) frameCounts[request.featureId] = {};
                frameCounts[request.featureId][sender.frameId ? sender.frameId : 0] = request.totals;
                updateFeatureBadges(request.featureId);
            }
        }
    });

    if (chrome.devtools && chrome.devtools.network) {
        chrome.devtools.network.onNavigated.addListener(() => {
            for (let featureId in frameCounts) {
                delete frameCounts[featureId];
                updateFeatureBadges(featureId);
            }
        });
    }

    // 6. Final Initialization via Scoped Storage
    chrome.storage.local.get([STORAGE_KEY_FEATURES, STORAGE_KEY_GROUPS], (result) => {
        const active = result[STORAGE_KEY_FEATURES] || [];
        document.querySelectorAll('.feature-toggle').forEach(toggle => {
            const fid = toggle.getAttribute('data-feature');
            const shouldBeChecked = active.includes(fid);
            if (toggle.checked !== shouldBeChecked) {
                toggle.checked = shouldBeChecked;
            }
        });
        updateAllHierarchyStates();

        connectToContentScript();
        active.forEach(featureId => {
            chrome.tabs.sendMessage(tabId, { action: 'highlight', featureId });
        });

        const collapsedGroups = result[STORAGE_KEY_GROUPS] || [];
        collapsedGroups.forEach(groupId => {
            const groupEl = document.getElementById(groupId);
            if (groupEl) {
                groupEl.classList.add('collapsed');
                const expandBtn = groupEl.querySelector('.category-expand-btn');
                if (expandBtn) expandBtn.setAttribute("aria-expanded", "false");
            }
        });
        
        evalViolationsCollapseState();
        evalInformativeCollapseState();
    });

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

    function openDetailsModal(rule, elements) {
        const existing = document.getElementById('a11y-details-modal');
        if (existing) existing.remove();

        const previousActiveElement = document.activeElement;

        const countText = elements.length > 0 ? `(${elements.length} Total)` : '';
        const severityHtml = rule.severity ? `<span class="severity-badge severity-${rule.severity.toLowerCase()}">${rule.severity}</span>` : '';
        
        const modal = document.createElement('div');
        modal.id = 'a11y-details-modal';
        modal.className = 'a11y-modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', `Elements for ${rule.name}`);

        modal.innerHTML = `
            <div class="a11y-modal-content">
                <div class="a11y-modal-header">
                    <div class="a11y-modal-title-area">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <h2>Elements: ${rule.name} ${countText}</h2>
                            ${severityHtml}
                        </div>
                        <p class="a11y-modal-desc" style="margin-top:6px;">${rule.description}</p>
                    </div>
                    <div class="a11y-modal-actions">
                        <button id="modal-copy-btn" class="a11y-btn-secondary">📋 Copy All</button>
                        <button id="modal-close-btn" class="a11y-btn-icon" aria-label="Close dialog">✖</button>
                    </div>
                </div>
                <div class="a11y-modal-list">
                    ${elements.map(el => {
                        const pillBg = el.color ? el.color : '#e67e22';
                        const pillTxt = getTextColor(pillBg);
                        const pillShadow = pillTxt === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.4)' : 'none';
                        
                        const rawLabel = formatLabel(el.legendLabel, el.label);
                        const safeLabel = rawLabel.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        
                        return `
                            <div class="a11y-modal-list-item" data-target-id="${el.id}">
                                <div class="a11y-modal-item-info">
                                    <span class="a11y-pill-label" style="background-color: ${pillBg}; color:${pillTxt}; text-shadow: ${pillShadow};">${safeLabel}</span>
                                    <span class="a11y-selector-path">${el.selector}</span>
                                </div>
                                <button class="a11y-scroll-btn" aria-label="Scroll element into view">
                                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path>
                                    </svg>
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => {
            modal.remove();
            document.removeEventListener('keydown', trapFocus);
            if (previousActiveElement) previousActiveElement.focus();
        };

        document.getElementById('modal-close-btn').addEventListener('click', closeModal);

        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const trapFocus = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'Tab') {
                if (e.shiftKey) { 
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else { 
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', trapFocus);
        
        document.getElementById('modal-close-btn').focus();

        document.getElementById('modal-copy-btn').addEventListener('click', () => {
            const elemCountLabel = `${elements.length} ${elements.length === 1 ? 'element' : 'elements'}`;
            const severityMarker = rule.severity ? ` [SEVERITY: ${rule.severity.toUpperCase()}]` : '';
            
            let copyText = `------------------------------------------------------------\n`;
            copyText += `AUDIT: ${rule.name.toUpperCase()}${severityMarker} (${elemCountLabel})\n`;
            copyText += `Description: ${rule.description}\n`;
            copyText += `------------------------------------------------------------\n`;

            if (elements.length > 0) {
                elements.forEach(el => {
                    const displayLabel = formatLabel(el.legendLabel, el.label);
                    copyText += `[${displayLabel}] ${el.selector}\n`;
                });
            } else {
                copyText += `(No matching elements found)\n`;
            }

            navigator.clipboard.writeText(copyText.trim());
            
            const copyBtn = document.getElementById('modal-copy-btn');
            copyBtn.textContent = '✔ Copied!';
            setTimeout(() => copyBtn.textContent = '📋 Copy All', 2000);
        });

        modal.querySelectorAll('.a11y-modal-list-item').forEach(item => {
            const scrollBtn = item.querySelector('.a11y-scroll-btn');
            scrollBtn.addEventListener('click', () => {
                const targetId = item.dataset.targetId;
                chrome.tabs.sendMessage(tabId, { action: 'highlightAndScroll', targetId: targetId });
            });
        });
    }

    // ==========================================================================
    // Documentation Modal Logic (Using Variable, No Fetch)
    // ==========================================================================
    const openDocsBtn = document.getElementById("btn-open-docs");
    if (openDocsBtn) {
        openDocsBtn.addEventListener("click", () => {
            const previousActiveElement = document.activeElement;
            const existing = document.getElementById('a11y-docs-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'a11y-docs-modal';
            modal.className = 'a11y-modal-overlay';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'docs-modal-title');

            modal.innerHTML = `
                <div class="a11y-modal-content" style="max-width: 800px; height: 90vh;">
                    <div class="a11y-modal-header">
                        <div class="a11y-modal-title-area">
                            <h2 id="docs-modal-title" style="margin: 0; font-size: 16px; font-weight: 700;">Documentation & Reference</h2>
                        </div>
                        <div class="a11y-modal-actions">
                            <button id="docs-close-btn" class="a11y-btn-icon" aria-label="Close Documentation">✖</button>
                        </div>
                    </div>
                    <div class="a11y-modal-list" id="docs-content-area" tabindex="0">
                        ${window.A11Y_DOCS_HTML || '<div style="color: #d93025; padding: 20px;">Error loading documentation.</div>'}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const closeModal = () => {
                modal.remove();
                document.removeEventListener('keydown', trapDocsFocus);
                if (previousActiveElement) previousActiveElement.focus();
            };

            document.getElementById('docs-close-btn').addEventListener('click', closeModal);

            // Focus Trap Logic
            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            const trapDocsFocus = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                } else if (e.key === 'Tab') {
                    if (e.shiftKey) { 
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else { 
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            };

            document.addEventListener('keydown', trapDocsFocus);
            document.getElementById('docs-close-btn').focus();
        });
    }
});