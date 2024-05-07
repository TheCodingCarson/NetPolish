window.addEventListener('contextmenu', function(event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    return true;
}, true);