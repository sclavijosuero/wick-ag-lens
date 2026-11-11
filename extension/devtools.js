// Creates the panel in the DevTools window
chrome.devtools.panels.create(
  "WICK-AG-Lens",
  "assets/icons/icon48.png",
  "panel/panel.html", 
  function(panel) {
    console.log("WICK-AG-Lens v3.0.0 Panel Created");
  }
);