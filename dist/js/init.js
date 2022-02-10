function getUrlExtension(url) {
    if (typeof browser === "undefined") {
        return chrome.runtime.getURL(url);
    } else {
        return browser.runtime.getURL(url);
    }
}
function getManifestExtension() {
    if (typeof browser === "undefined") {
        return chrome.runtime.getManifest();
    } else {
        return browser.runtime.getManifest();
    }
}
function loadConfigAgenda() {
    if (typeof browser === "undefined") {
        chrome.storage.sync.get({
            dataValues: ''
        }, function(items) {  
            localStorage.setItem('configAgenda', items.dataValues);
        });
    } else {
        browser.storage.sync.get({
            dataValues: ''
        }, function(items) {  
            localStorage.setItem('configAgenda', items.dataValues);
        });
    }
}
loadConfigAgenda();

$.getScript(getUrlExtension("js/lib/moment.min.js"));
$.getScript(getUrlExtension("js/lib/jmespath.min.js"));
$.getScript(getUrlExtension("js/agendador.js"));