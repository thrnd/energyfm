/**
 * вспомогательный класс для инициализации блоков "треки" и "клипы" на странице исполнителя
 * 
 * в шаблон отдаю сразу 12 элементов списка
 * по макету в мобилке видны только 4 элемента, в планшете - 8
 * по первому клику на лоадер просто показываются скрытые элементы
 * через навешивание модификатора _loaded на список
 * далее элементы подгружаются лоадером
 * 
 * @constructor {Object}
 *      @prop {String} localSearchSelector - селектор для инициализации LocalSearch
 *      @prop {String} listSelector - селектор списка с треками/клипами
 *      @prop {String} listLoadedClassName - css-класс для списка
 *      @prop {String} loaderID - id кнопки-лоадера
 *      @prop {String} loaderListID - id списка, куда будут подгружаться новые элементы
 *      @prop {String} url - ссылка статьи, откуда будут забираться новые элементы
 */
class ArtistMaterialsBlock {
    constructor({
        localSearchSelector,
        listSelector,
        listLoadedClassName,
        loaderID,
        loaderListID,
        url,
    }) {
        this._localSearchSelector = localSearchSelector;
        this._localSearch = new LocalSearch({
            selector: localSearchSelector,
        });

        this._clickOutsideLocalSearchDetector = this._clickOutsideLocalSearchDetector.bind(this);

        document.addEventListener("click", this._clickOutsideLocalSearchDetector);

        ENERGYFM.pageHandlers[ENERGYFM.artistsPageAn] = ENERGYFM.pageHandlers[ENERGYFM.artistsPageAn] || [];

        ENERGYFM.pageHandlers[ENERGYFM.artistsPageAn].push({
            target: document,
            event: "click",
            handler: this._clickOutsideLocalSearchDetector,
        });

        this._listLoadedClassName = listLoadedClassName;
        this._list = document.querySelector(listSelector);
        this._loader = document.getElementById(loaderID);
        this._loaderListID = loaderListID;
        this._url = url;

        if (this._loader !== null) {
            this._initLoadBtn();
        }
    }

    _initLoadBtn() {
        const isDesktop = getViewportWidth() >= 1025;
        const isLoadNeeded = !("noload" in this._loader.dataset);

        this._loader.addEventListener("click", (event) => {
            this._list.classList.add(this._listLoadedClassName);

            if (!isDesktop && isLoadNeeded) {
                this._initLoader();
            }

            if (!isLoadNeeded) {
                this._loader.remove();
            }
        }, { once: true });

        // в декстопе кнопка "еще" сразу нужна как лоадер
        if (isDesktop && isLoadNeeded) {
            this._initLoader();
        }
    }

    _initLoader() {
        // ха-ха, смотрите, жихвери!
        $(this._loader).loader({
            action: "click",
            contentWrapper: this._loaderListID,
            href: this._url,
            parameter: "page",
            initPage: 2,
            onPageLoad: false,
            callbacks: {
                beforeLoad: (params) => {
                    const currentArtistID = this._list.dataset.uid;
                    params.parameter = `id=${currentArtistID}&page`;
                },
                afterLoad: (params) => {
                    ENERGYFM.lazyInstance.update();
                    this._localSearch.updateItems();
                },
                destroyCallback: (params) => {
                    this._loader.remove();
                },
            },
        });
    }

    _clickOutsideLocalSearchDetector(event) {
        const isLocalSearchClick = event.target.closest(this._localSearchSelector) !== null;

        if (!isLocalSearchClick) {
            this._localSearch.hideHints();
        }
    }
}