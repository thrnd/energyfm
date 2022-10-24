/**
 * инициализирует фильтр по тегам/ключевым словам в новостях
 * 
 * @constructor {Object}
 *      @prop {Function} onClose -          коллбек, который вызывается при закрытии меню
 * 
 * @public @method isOpened - возвращает true/false, актуально только для мобильных разрешений
 * 
 * @public @method toggle - открывает/закрывает меню, актуально только для мобильных разрешений
 *      @param {Boolean} [show]
 */

class NRJNewsFilter {
    constructor({
        selector,
        loaderInstance = null,
    }) {
        this._component = document.querySelector(selector);
        this._allBtn = this._component.querySelector(".tags__btn[data-all]");
        this._resetBtn = this._component.querySelector(".tags__reset");
        this._btns = [ ...this._component.querySelectorAll(".tags__btn") ]
            .filter((btn) => btn !== this._allBtn && !btn.classList.contains("tags__btn_t_more"));
        this._url = this._component.dataset.url;

        this._onClick = this._onClick.bind(this);

        this._component.addEventListener("click", this._onClick);
    }

    _onClick(event) {
        const { target } = event;
        const isAll = target === this._allBtn;
        const isReset = target.classList.contains("tags__reset");
        const isBtn = target.classList.contains("tags__btn") && !isAll && !isReset;

        if (isReset || isAll) {
            this._btns.forEach((btn) => {
                btn.classList.remove("tags__btn_active");
            });
            this._allBtn.classList.add("tags__btn_active");

            

            return;
        }
    }
}