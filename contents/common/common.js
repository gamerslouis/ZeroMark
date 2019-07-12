function loadCSSFile(URL) {
    try {
        let css = document.createElement('link');
        css.setAttribute('rel', 'stylesheet');
        css.setAttribute('type', 'text/css');
        css.setAttribute('href', URL);
        document.getElementsByTagName('head')[0].appendChild(css);
    }
    catch (e) {
        return false;
    }
    return true;
}

function makeFromTemplate(templateClass, realClass)
{
    let div = document.getElementsByClassName(templateClass)[0].cloneNode(true);
    div.classList.remove(templateClass);
    div.classList.add   (realClass);
    return div;
}