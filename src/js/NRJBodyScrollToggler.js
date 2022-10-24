/**
 * туглит скролл на body
 * особенность: пока открытых попапов несколько, игнорируем переключение скроллбара
 * 
 * @public @method hide - скрывает/показывает скроллбар на странице
 *      @param {Boolean} hideScroll - флаг скрытия скроллбара
 * 
 * @public @method getScrollbarWidth - возвращает ширину скроллбара
 */

class NRJBodyScrollToggler {
    constructor() {
        this._isScrollLocked = false;
        this._popupCount = 0;
    }

    hide(hideScroll) {
        const prevCount = this._popupCount;
        this._popupCount += hideScroll ? 1 : -1;
        this._popupCount = this._popupCount < 0 ? 0 : this._popupCount;

        if (prevCount > 0 && this._popupCount > 0) return;

        const scrollbarWidth = this.getScrollbarWidth();

        document.body.style.paddingRight = hideScroll ? `${scrollbarWidth}px` : "";
        document.body.style.overflow = hideScroll ? "hidden" : "";
        document.documentElement.style.setProperty("--scrollbar-width", hideScroll ? `${scrollbarWidth}px` : "0px");
    }

    getScrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    }
}
