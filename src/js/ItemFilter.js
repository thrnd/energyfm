/**
 * Класс, выполняющий фильтрацию компонентов по data-аттрибуту
 * 
 * @param {Object}
 *      @prop {Array} items - массив DOM-нод на сортировку
 *      @prop {Function} onFilter - коллбек для вызова после каждой фильтрации
 * 
 * @public @method updateCriteria - обновляет критерии фильтрации
 *                                  сравнение значений выполняется через
 *                                  String.indexOf и ведется с начала строки
 *      @param {String} criteria - имя критерия, нужно указывать в camelCase,
 *                                 т.к. вызывается через dataset[criteria]
 *      @param {String} value -    значение критерия
 * 
 * @public @method updateItems - обновляет список элементов, вызывается после изменения списка
 *      @param {Array} items - массив дом-нод
 */

class ItemFilter {
    constructor({
        items,
        onFilter,
    }) {
        this._criterias = {};
        this._onFilter = onFilter;

        this._mapItems(items);
    }

    updateCriteria(criteria, value) {
        const val = value
            .trim()
            .toLocaleLowerCase();

        this._criterias[criteria] = val;

        if (val === "") {
            delete this._criterias[criteria];
        }

        this._filter();
    }

    updateItems(items) {
        this._mapItems(items);
        this._filter();
    }

    _filter() {
        const criterias = Object.entries(this._criterias);
        const isFilterEmpty = criterias.length === 0;

        this._clearFilter();

        if (isFilterEmpty) {
            this._draw();

            return;
        }

        this._items.forEach((item) => {
            const { itemDOMNode } = item;
            let isValid = true;
            let i = 0;

            while (isValid && i < criterias.length) {
                const name = criterias[i][0];
                const value = criterias[i][1];

                isValid = itemDOMNode.dataset[name].indexOf(value) === 0;
                i++;
            }

            item.isVisible = isValid;
        });

        this._draw();
    }

    _draw() {
        const visibleItems = [];

        this._items.forEach(({ isVisible, itemDOMNode }) => {
            itemDOMNode.style.display = isVisible ? "" : "none";

            if (isVisible) {
                visibleItems.push(itemDOMNode);
            }
        });

        this._onFilter(visibleItems, { ...this._criterias });
    }

    _mapItems(items) {
        this._items = [];

        items.forEach((item) => {
            this._items.push({
                // по ум. все элементы списка видны (нет фильтра)
                isVisible: true,
                itemDOMNode: item,
            });
        });
    }

    _clearFilter() {
        this._items.forEach((item) => {
            item.isVisible = true;
        });
    }
}