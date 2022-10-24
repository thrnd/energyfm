/**
 * навешивает на элементы с названием артиста и исполнителя
 * обработчики pointerenter/leave
 * для добавления класса с анимацией бегущей строки, в том случае
 * если название не вмещается полностью в одну строку
 * 
 * @constructor {Object}
 *      @prop { String } selector - селектор для отслеживаемых элементов
 *      @prop { String } tickingClass - css-класс который вешается при ховере
 * 
 * навешивает обработчики на элемент,
 * используется при переходах на новые страницы
 * @public @method observeElement
 *      @param { HTMLElement } el - дом-нода с селектором равным selector из конструктора
 * 
 * метод дергается каждый раз при обновлении титров
 * @public @method updateTicking
 *      @param { HTMLElement } el - дом-нода
 */

 class TitlesTicker {
    constructor({
        selector,
        tickingClass,
    }) {
        this._tickingClass = tickingClass;

        this._pointerHandler = this._pointerHandler.bind(this);

        [ ...document.querySelectorAll(selector) ].forEach((item) => {
            this.observeElement(item);
        });
    }

    observeElement(el) {
        el.addEventListener("pointerenter", this._pointerHandler);
        el.addEventListener("pointerleave", this._pointerHandler);
    }

    updateTicking(el) {
        this._checkForTicking(el);
    }

    _getDiff(parentEl, innerEl) {
        return innerEl.scrollWidth - parentEl.offsetWidth;
    }

    _checkForTicking(el, forcedState = null) {
        const diff = this._getDiff(el.parentElement, el);
        const isTicking = typeof forcedState === "boolean"
            ? forcedState
            : (diff > 0);

        el.classList.toggle(this._tickingClass, isTicking);

        if (diff > 0) {
            el.style.setProperty("--translate-x-width", `-${diff}px`);
            el.style.setProperty("--anim-duration", `${Math.max((diff / 20), 4)}s`);
        }
    }

    _pointerHandler(event) {
        if ( getViewportWidth() < 1025 ) return;

        const el = event.target;
        const isOver = event.type === "pointerenter";

        el.classList.toggle(this._tickingClass, isOver);

        if (isOver) {
            requestAnimationFrame(() => {
                this._checkForTicking(el, isOver);
            });
        }
    };
}