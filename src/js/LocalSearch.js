/**
 * инициализирует соответствующий компонент
 * 
 * функция throttle и объект ENERGYFM - в глобальном контексте
 * 
 * @constructor {Object}
 *      @prop {String} selector - селектор компонента
 *      @prop {Boolean= true} showSuggestion - флаг показа подсказок при наборе
 *      @prop {Function} onUpdate - коллбек, который вызывается при каждом обновлении фильтра
 * 
 * @public @method setValue - устанавливает значение инпута
 *      @param {String} val - новое значение
 * 
 * @public @method updateItems - обновляет список фильтруемых элементов
 * 
 * @public @method hideHints - скрывает отображаемые подсказки при вводе
 */

class LocalSearch {
    constructor({
        selector,
        showSuggestion = true,
        onUpdate,
    }) {
        this._component = document.querySelector(selector);

        if (this._component === null) {
            console.error(`LocalSearch: нет элемента "${selector}"`);

            return null;
        }

        this._input = this._component.querySelector(".local-search__input");
        this._showSuggestion = showSuggestion;
        this._wasHintsInited = false;
        this._hideHintsOnNextDraw = false;

        this._onInput = throttle(this._onInput, this, 150);
        this._onFilterUpdate = this._onFilterUpdate.bind(this);
        this._onUpdate = onUpdate;
        this._isUpdateFn = typeof onUpdate === "function";

        this.itemFilter = new ItemFilter({
            items: [ ...document.querySelectorAll(this._input.dataset.items) ],
            onFilter: this._onFilterUpdate,
        });

        this._input.addEventListener("input", this._onInput);

        this._isAlwaysVisible = this._component.classList.contains("local-search_always-visible");
        this._isVisibleState = this._isVisible();

        if (!this._isAlwaysVisible) {
            this._toggleVisibility = this._toggleVisibility.bind(this);
            this._component.addEventListener("click", this._toggleVisibility);
        }
    }

    setValue(val) {
        this._input.value = val;
        this._onInput();
    }

    updateItems() {
        this.itemFilter.updateItems([ ...document.querySelectorAll(this._input.dataset.items) ]);
    }

    hideHints() {
        if (!this._wasHintsInited) return;

        this._hints.classList.remove("local-search__hints_visible");
    }

    _onInput(event) {
        const val = this._input
            .value
            .trim()
            .toLocaleLowerCase();

        this.itemFilter.updateCriteria("string", val);
    }

    _onFilterUpdate(visibleItems, criterias) {
        const currentValue = criterias["string"] || "";

        if ( this._showSuggestion && this._isVisible() ) {
            const suggestionArr = visibleItems.length > 5
                ? visibleItems.slice(0, 5)
                : visibleItems;

            this._drawHints(suggestionArr, currentValue);
        }

        if (this._isUpdateFn) {
            this._onUpdate(visibleItems, currentValue);
        }
    }

    _drawHints(visibleListItems, query) {
        if (!this._wasHintsInited) {
            this._initHints();
        }

        if (query === "" || this._hideHintsOnNextDraw || visibleListItems.length === 0) {
            this.hideHints();
            this._hideHintsOnNextDraw = false;

            return;
        }

        this._hints.innerHTML = `${
            visibleListItems
                .map((item) => {
                    const highlightedPart = item.dataset.string.slice(0, query.length);
                    const restPart = item.dataset.string.slice(query.length);

                    return `<button class="local-search__hint-btn" type="button" data-string="${item.dataset.string}">
                                <span class="local-search__hint-hl">${highlightedPart}</span>${restPart}
                            </button>`;
                })
                .join("")
        }`;
        this._hints.classList.add("local-search__hints_visible");
    }

    _initHints() {
        this._hints = document.createElement("DIV");
        this._hints.className = "local-search__hints";
        this._hints.addEventListener("click", (event) => {
            const btn = event.target.closest(".local-search__hint-btn");

            if (btn === null) return;

            this._hideHintsOnNextDraw = true;
            this.setValue(btn.dataset.string);
        });
        this._component.append(this._hints);

        this._wasHintsInited = true;
    }

    _toggleVisibility(event) {
        if ( getViewportWidth() > 767 ) return;

        const isOpenBtn = event.target.closest(".local-search__submit") !== null;
        const isCloseBtn = event.target.closest(".local-search__close") !== null;

        if (!isOpenBtn && !isCloseBtn) return;

        this._component.classList.toggle("local-search_opened", isOpenBtn);
        this._isVisibleState = isOpenBtn;

        if (isOpenBtn) {
            this._input.focus();
        }
        else {
            this.hideHints();
        }
    }

    _isVisible() {
        return this._isAlwaysVisible || this._isVisibleState || getViewportWidth() > 767;
    }
}