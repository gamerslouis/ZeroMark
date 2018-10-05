class MarkBox {
    constructor() {
        this.classNames = {
            markBox: 'zeromark_tabManager_markBox',
            titleText: 'zeromark_tabManager_markBox_titleText',
            colorButton: 'zeromark_tabManager_markBox_colorButton',
            closeButton: 'zeromark_tabManager_markBox_closeButton',
            colorContainer: 'zeromark_tabManager_markBox_colorButtonContainer'
        };

        //load markBox html
        let div = document.createElement('div');
        div.className = this.classNames.markBox;
        fetch(chrome.extension.getURL('/contents/markBox.html')).then((res) => {
            return res.text();
        }).then((content)=>{
            div.innerHTML = content;
            div.style.display = 'none';
            div.style.zIndex = '90000000';
            div.oncontextmenu = () => { return false; };
            this.element = div;
            document.body.appendChild(div);

            //target Tab
            this.tab = new Object();
            //map between color str and colorbutton element
            this.colorButtons = {};

            // make colorButtons
            let colors = div.getElementsByClassName(this.classNames.colorButton);
            for (let i = 0; i < colors.length; i++) {
                this.colorButtons[colors[i].style.backgroundColor] = colors[i];
            }
            this.colors = colors;

            let ul = div.getElementsByClassName(this.classNames.colorContainer)[0];

            //element of ul
            this.colorButtonList = ul;

            //handle color button click event to switch color
            ul.addEventListener('click', ((e) => {
                if (e.target.classList.contains(this.classNames.colorButton)) {
                    this.cancelSelectAllColorButton();
                    e.target.classList.add('selected');
                    this.onChanged({ tabId: this.tab.id, type: 'labelColor', value: e.target.style.backgroundColor });
                }
            }).bind(this));

            div.getElementsByClassName(this.classNames.closeButton)[0].addEventListener('click', (() => {
                this.hide();
            }).bind(this));

            this.titleTextInputCount = 0;
            this.maxSearchWait = 400; //Delay Between UserInput and Search

            this.titleText = div.getElementsByClassName(this.classNames.titleText)[0];
            this.titleText.addEventListener('input', ((e) => {
                this.titleTextInputCount++;
                let locolCount = this.titleTextInputCount;
                setTimeout(() => {
                    if (locolCount != this.titleTextInputCount) return;
                    this.onChanged({ tabId: this.tab.id, type: 'title', value: this.titleText.value });
                }, this.maxSearchWait);
            }).bind(this));

            this.titleText.addEventListener(('click'), (() => {
                this.titleText.select();
            }).bind(this));
        });
        

        div.addEventListener('click', (e) => { e.stopPropagation(); });
        document.addEventListener('click', (() => { this.hide(); }).bind(this));
    }

    cancelSelectAllColorButton() {
        for (let i = 0; i < this.colors.length; i++) {
            this.colors[i].classList.remove('selected');
        }
    }

    selectColorButton(color) {
        this.colorButtons[color].classList.add('selected');
    }

    show(tab, ex, ey, onChanged) {
        this.onChanged = onChanged;
        this.tab = tab;
        this.cancelSelectAllColorButton();
        this.selectColorButton(tab.labelColor);
        this.titleText.value = tab.title;

        this.element.style.left = `${ex}px`;
        this.element.style.top = `${ey}px`;

        this.element.style.display = 'block';
    }

    hide() {
        this.element.style.display = 'none';
    }

    rgb(hex) {
        let hexToR = (h) => { return parseInt((cutHex(h)).substring(0, 2), 16); };
        let hexToG = (h) => { return parseInt((cutHex(h)).substring(2, 4), 16); };
        let hexToB = (h) => { return parseInt((cutHex(h)).substring(4, 6), 16); };
        let cutHex = (h) => { return (h.charAt(0) == '#') ? h.substring(1, 7) : h; };
        return `rgb(${hexToR(hex)}, ${hexToG(hex)}, ${hexToB(hex)})`;
    }
}