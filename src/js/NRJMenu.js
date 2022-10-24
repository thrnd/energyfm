/**
 * инициализирует меню
 * 
 * функции toggleAnimation, getCSSPropPixelValue
 * и объект ENERGYFM - в глобальном контексте
 * 
 * @constructor {Object}
 *      @prop {Function} onClose -          коллбек, который вызывается при закрытии меню
 * 
 * @public @method isOpened - возвращает true/false, актуально только для мобильных разрешений
 * 
 * @public @method toggle - открывает/закрывает меню, актуально только для мобильных разрешений
 *      @param {Boolean} [show]
 */

class NRJMenu {
    constructor({
        onClose,
    }) {
        // основной компонент меню
        this._wrap = document.querySelector(".menu-wrap");
        // внутрення скролящаяся часть
        this._inner = this._wrap.querySelector(".menu-wrap__inner");
        // кнопки открытия/закрытия
        this._openBtn = document.querySelector(".open-menu-btn");
        this._closeBtn = document.querySelector(".menu-wrap__close");
        // затеняющая "ширма" подменюшек для десктопа
        this._coverup = document.querySelector(".menu-wrap__popup-coverup");
        this._coverupVisibleClassName = "menu-wrap__popup-coverup_visible";
        // подменю
        this._subMenuBtnSelector = ".menu__btn";
        this._subMenuBtns = [ ...this._wrap.querySelectorAll(this._subMenuBtnSelector) ];
        this._subMenuBtnActiveClassName = "menu__btn_active";

        this.toggle = this.toggle.bind(this);
        this._subMenuClickHandler = this._subMenuClickHandler.bind(this);
        this._menuPointerMoveHandler = this._menuPointerMoveHandler.bind(this);
        this._submenuWidgetHandler = this._submenuWidgetHandler.bind(this);
        this._toggleWidgets = this._toggleWidgets.bind(this);
        this._onClose = onClose;

        this._isOpened = false;

        this._openBtn.addEventListener("click", this.toggle);
        this._closeBtn.addEventListener("click", this.toggle);
        // раскрытие подменю в мобильной версии
        this._wrap.addEventListener("click", this._subMenuClickHandler);
        // показывем/скрываем затеняющую ширму для подменюх в десктопе
        // навешиваем обработчики только на те пункты, в которых есть подменю
        [ ...this._wrap.querySelectorAll(".menu__item") ]
            .forEach((item) => {
                const hasSubmenu = item.querySelector(this._subMenuBtnSelector) !== null;

                if (!hasSubmenu) return;

                item.addEventListener("pointerenter", this._menuPointerMoveHandler);
                item.addEventListener("pointerleave", this._menuPointerMoveHandler);
            });
        // показываем нужный виджет при наведении на ссылку подменю
        // навешиваем обработчики только на ссылки с соответствующими атрибутами
        this._widgets = {};
        [ ...this._wrap.querySelectorAll(".submenu__link[data-widget]") ]
            .forEach((link, index) => {
                const widget = this._wrap.querySelector(link.dataset.widget);

                if (widget === null) return;

                this._widgets[widget.dataset.widgetGroup] ||= [];
                this._widgets[widget.dataset.widgetGroup].push(widget);

                if (index === 0) {}

                link.addEventListener("pointerleave", this._submenuWidgetHandler);
                link.addEventListener("pointerenter", this._submenuWidgetHandler);
                link.addEventListener("blur", this._submenuWidgetHandler);
                link.addEventListener("focus", this._submenuWidgetHandler);
            });
    }

    isOpened() {
        return this._isOpened;
    }

    toggle(show) {
        const _show = typeof show ==="boolean" ? show : !this._isOpened;

        toggleAnimation({
            show: _show,
            el: this._wrap,
            visibleClass: "menu-wrap_visible",
            animationClass: "menu-wrap_appeared",
            onStateToggle: (show) => {
                ENERGYFM.bodyScrollToggler.hide(show);
                this._closeOpenedSubMenus();
            },
            onBeforeShowing: () => {
                this._wrap.scrollTop = 0;
            },
        });

        if (!_show) {
            this._onClose();
        }

        this._isOpened = _show;
    }

    _subMenuClickHandler(event) {
        const viewportWidth = getViewportWidth();
        if (viewportWidth > 1024) return;

        event.preventDefault();

        const btn = event.target.closest(this._subMenuBtnSelector);

        if (btn === null) return;

        const topBeforeMenuClosing = btn.offsetTop;

        this._closeOpenedSubMenus(btn);
        btn.classList.toggle(this._subMenuBtnActiveClassName);

        // если кликнутая кнопка уплыла за пределы экрана
        // возвращаем ее на самый верх экрана
        // актуально только для разрешений < 768

        if (viewportWidth > 767) return;

        // во избежание forced synchronous layout
        // проверяем не сместилась ли кнопка через тик rAF
        requestAnimationFrame(() => {
            if (btn.offsetTop === topBeforeMenuClosing) return;

            this._inner.scrollTop = btn.offsetTop;
        });
    }

    _closeOpenedSubMenus(btnToExclude = null) {
        this._subMenuBtns.forEach((btn) => {
            if (btn === btnToExclude) return;

            btn.classList.remove(this._subMenuBtnActiveClassName);
        });
    }

    _menuPointerMoveHandler(event) {
        if ( getViewportWidth() < 1025 ) return;

        const show = event.type === "pointerenter";
        const menu = event.target.querySelector(".menu__inner");

        this._toggleCoverup(show);

        if (show) {
            this._undateCoverupBG(menu);
        }
    }

    _undateCoverupBG(menuPopupEl) {
        const propValue = getCSSPropPixelValue(menuPopupEl, "--submenu-top");
        const top = propValue !== "" ? propValue : 70;

        // чтобы получить высоту меню, нужно чтобы оно сначала загутлилось
        // из состояния "display: none"
        // поэтому берем размеры через тик rAF
        requestAnimationFrame(() => {
            this._coverup.style.setProperty("--submenu-height", `${menuPopupEl.offsetHeight + top}px`);
        });
    }

    _toggleCoverup(show) {
        this._coverup.classList.toggle(this._coverupVisibleClassName, show)
    }

    _submenuWidgetHandler(event) {
        const show = event.type === "pointerenter" || event.type === "focus";

        if (!show) return;

        const widget = this._wrap.querySelector(event.target.dataset.widget);
        const menu = widget.closest(".menu__inner");

        this._toggleWidgets(widget);
        this._undateCoverupBG(menu);
    }

    _toggleWidgets(target) {
        const group = target.dataset.widgetGroup;

        this._widgets[group].forEach((widget) => {
            widget.classList.toggle("menu__widget_visible", widget === target);
        });
    }
}