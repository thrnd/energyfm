(function() {
    var img = new Image(), cl = document.querySelector('html').classList;
    img.onload = function () {
        if ((img.width > 0) && (img.height > 0)) {
           return cl.add('webp');
        }
        cl.add('no-webp');
    };
    img.onerror = function() {
        return cl.add('no-webp');
    }
    img.src = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";
})();