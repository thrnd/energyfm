/**
 * класс для инициализации формы поиска по истории эфира
 * 
 * IMask - функция для инициализации маски для инпута, в глобальном контексте
 * 
 * @param {Object}
 *      @prop {String} componentSelector - селектор компонента
 *      @prop {String / HTMLInputElement} input - селектор для инпута / сам инпут
 *      @prop {Boolean= false} [useDateFilter] - флаг, указывающий на то,
 *                                               что компонент будет использоваться как фильтр
 *      @prop {Function} datepickerIniter - функция-инициализатор DatePicker
 *      @prop {Function} [onDateChange] - функция, которая будет вызываться
 *                                        каждый раз при изменении даты в DatePicker
 * 
 * @public @prop {Datepicker} datepicker - инстанс Datepicker
 * 
 * @public @method toggle
 *      @param {Boolean} [show] - флаг открытия/закрытия компонента
 * 
 * @public @method submit - сабмитит данные
 *      @param {Event} event - event клика
 */

class DateTimeComponent {
    constructor({
        componentSelector,
        input,
        useDateFilter = false,
        datepickerIniter,
        datepickerOptions = {},
        onDateChange,
    }) {
        this._component = document.querySelector(componentSelector);
        this._btn = this._component.querySelector(".date-time-component__btn");
        this._input = input instanceof HTMLInputElement
            ? input
            : document.querySelector(input);
        this.datepicker = datepickerIniter(this._input, {
            container: `${componentSelector} .date-time-component__datepicker`,
            ...datepickerOptions,
        });
        this._popup = this._component.querySelector(".date-time-component__form");
        this._timeInput = this._component.querySelector(".date-time-component__input");
        this._timeResetBtn = this._component.querySelector(".date-time-component__time-reset");
        this._submit = this._component.querySelector(".date-time-component__submit");

        this.toggle = this.toggle.bind(this);
        this._timeReset = this._timeReset.bind(this);
        this._onDateChangeCB = onDateChange;
        this._hasCB = typeof onDateChange === "function";
        this._useDateFilter = useDateFilter;
        this._isVisible = false;

        this._btn.addEventListener("click", this.toggle)
        this._timeResetBtn.addEventListener("click", this._timeReset);

        if (!useDateFilter) {
            this.submit = this.submit.bind(this);
            this._submit.addEventListener("click", this.submit);
        }
        else {
            this._submit.addEventListener("click", this.toggle);
        }

        if (this._hasCB || useDateFilter) {
            this._onDateChange = this._onDateChange.bind(this);
            this._input.addEventListener("changeDate", this._onDateChange);
        }

        this._timeMask = IMask(this._timeInput, {
            mask: "00:00",
        });
    }

    toggle(show) {
        const _show = typeof show === "boolean" ? show : !this._isVisible;

        this._component.classList.toggle("date-time-component_opened", _show);

        this._isVisible = _show;
    }

    // сюда передается event события click
    async submit(event) {
        event.preventDefault();

        const { form } = event.target;
        const {
            date: dateInput,
            time: timeInput,
        } = form;

        dateInput.setCustomValidity("");
        timeInput.setCustomValidity("");

        const isDateValid = dateInput.checkValidity();
        const isFromValid = timeInput.checkValidity();
        const isValid = isDateValid && isFromValid;

        dateInput.setCustomValidity(isDateValid ? "": "Необходимый формат дд.мм.гггг");
        timeInput.setCustomValidity(isFromValid ? "": "Необходимый формат чч:мм");

        dateInput.classList.toggle("invalid", !isDateValid);
        timeInput.classList.toggle("invalid", !isFromValid);

        if (!isValid) return form.reportValidity();

        const time = encodeURIComponent(timeInput.value);
        const url = `/playlist/date/${encodeURIComponent(dateInput.value)}${time ? `/time/${time}` : ""}`;

        this.toggle(false);

        MPAjax.loader.currentProps = {};
        const StateData = {
            place: MPAjax.PlaceID,
            source: MPAjax.SourceID,
            replaces: MPAjax.ReplaceList,
        };
        MPAjax.ReplaceList = [{
            place: StateData.place,
            source: StateData.source,
            type: "mainBlock",
        }];

        MPAjax.getData(url);
        window.history.pushState(StateData, null, url);
    }

    _timeReset() {
        this._timeInput.value = "";

        if (this._useDateFilter) {
            this._input.value = "";
            this._onDateChange();
        }
    }

    _onDateChange(event) {
        if (this._hasCB) {
            this._onDateChangeCB(this._input);
        }

        if (this._useDateFilter) {
            this._component.classList.toggle("date-time-component_selected", this._input.value !== "");
        }
    }
}