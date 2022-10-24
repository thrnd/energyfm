/**
 * вспомогательный класс для инициализации попапа с выбором городов вещания
 * 
 * функция toggleAnimation - в глобальном контексте
 * 
 * @constructor {Object}
 *      @prop {String} mainPlayerBtnSelector - селектор кнопки запуска эфира
 *      @prop {Function} onToggle -            коллбек, который вызывается
 *                                             каждый раз при показе/скрывании попапа
 *      @prop {Function} onCityChange -        коллбек, который вызывается
 *                                             каждый раз при смене города вещания
 * 
 * @public @method toggle
 *      @param {Boolean} [show] - флаг показа/скрытия попапа
 */

class CityChangePopup {
    constructor({
        mainPlayerBtnSelector,
        onToggle,
        onCityChange,
    }) {
        this._mainBtn = document.querySelector(mainPlayerBtnSelector);
        this._onToggle = onToggle;
        this._onCityChange = onCityChange;
        this._popup = document.querySelector(".js-city-popup");
        this._btns = [ ...this._popup.querySelectorAll(".city-list__btn") ];

        // локальный поиск по городам вещания
        this._letterListItems = [ ...this._popup.querySelectorAll(".letter-list__item") ];
        this._localSearch = new LocalSearch({
            selector: ".city-popup__search",
            showSuggestion: false,
            onUpdate: (visibleListItems, query) => {
                const visibleLists = [];

                visibleListItems.forEach((item) => {
                    visibleLists.push(item.parentElement);
                });

                this._letterListItems.forEach((item) => {
                    const list = item.querySelector(".city-list");

                    item.style.display = visibleLists.includes(list) ? "" : "none";
                });

                this._btns.forEach((btn) => {
                    const cityTitle = btn.querySelector(".city-list__btn-inner");

                    Array.prototype.forEach.call(cityTitle.children, (letter, index) => {
                        letter.classList.toggle("city-list__city-letter_highlighted", index < query.length);
                    });
                });
            },
        });

        this._isVisible = false;

        document.addEventListener("click", (event) => {
            const toggleBtn = event.target.closest(".js-city-popup-btn");

            if (toggleBtn === null) return;

            this.toggle();
        });

        // меняем название текущего потока при смене города вещания
        this._popup.addEventListener("click", (event) => {
            const cityBtn = event.target.closest(".city-list__btn");

            if (cityBtn === null) return;

            const channelName = cityBtn.textContent.trim();

            [ ...document.querySelectorAll(".js-city-popup-btn") ].forEach((btn) => {
                btn
                    .querySelector(".city-popup-btn__text")
                    .textContent = channelName;
            });

            this._btns.forEach((btn) => {
                btn.classList.toggle("city-list__btn_active", btn === cityBtn);
            });

            const cityID = cityBtn.dataset.idstation;

            // дергаем статью, чтобы запомнить выбор пользователя
            if (cityID) {
                fetch(`/detectOfCityUser/${cityID}`);
            }

            this._localSearch.setValue("");
            this.toggle(false);
            this._onCityChange(cityBtn);
        });
    }

    toggle(show) {
        const _show = show !== undefined ? show : !this._isVisible;

        toggleAnimation({
            show: _show,
            el: this._popup,
            visibleClass: "popup_visible",
            animationClass: "popup_appeared",
            onStateToggle: (show) => {
                this._onToggle(show);
            },
            onBeforeShowing: () => {
                this._popup.scrollTop = 0;
                this._localSearch.setValue("");
            },
        });

        this._isVisible = _show;
    }
}