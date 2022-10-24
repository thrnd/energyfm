var ENERGYFM = ENERGYFM || {};

// названия статей в шаблонизаторе
ENERGYFM.indexPageAn = ENERGYFM.indexPageAn                 || "index";
ENERGYFM.playlistPageAn = ENERGYFM.playlistPageAn           || "playlist";
ENERGYFM.artistsPageAn = ENERGYFM.artistsPageAn             || "artist";
ENERGYFM.tracksPageAn = ENERGYFM.tracksPageAn               || "new-tracks";
ENERGYFM.trackDetailedPageAn = ENERGYFM.trackDetailedPageAn || "track";
ENERGYFM.hot30PageAn = ENERGYFM.hot30PageAn                 || "hot-30";
ENERGYFM.videoPageAn = ENERGYFM.videoPageAn                 || "video";
ENERGYFM.photoPageAn = ENERGYFM.photoPageAn                 || "photo";
ENERGYFM.clipsPageAn = ENERGYFM.clipsPageAn                 || "clips";
ENERGYFM.newsPageAn = ENERGYFM.newsPageAn                   || "news";
ENERGYFM.actionPageAn = ENERGYFM.actionPageAn               || "action";
ENERGYFM.pastActionsPageAn = ENERGYFM.pastActionsPageAn     || "past-actions";
ENERGYFM.podcastPageAn = ENERGYFM.podcastPageAn             || "podcast";
ENERGYFM.programPageAn = ENERGYFM.programPageAn             || "program";
ENERGYFM.livePageAn = ENERGYFM.livePageAn                   || "live";

// сюда складываем обработчики, которые надо снимать
// после ухода с соответствующей страницы, пример:
//      const someFunction = () => { ... };
//      ENERGYFM.pageHandlers[ENERGYFM.indexPageAn].push({
//          target: document,
//          event: "click",
//          handler: someFunction,
//          useCapture: true,
//      });
ENERGYFM.pageHandlers = ENERGYFM.pageHandlers || {};
ENERGYFM.initializers = ENERGYFM.initializers || {};
ENERGYFM.initedPages = ENERGYFM.initedPages || {};
ENERGYFM.slidersToUpdate = ENERGYFM.slidersToUpdate || [];

// инициализация общих для всего сайта обработчиков
ENERGYFM.initCommon = () => {
    if (ENERGYFM.isInited) return;

    isDocReady(() => {
        const { documentElement: root } = document;
        ENERGYFM.pathToSVGSprite = `${
                window.pathToSVGSprite || "/design/images/site-design/sprite.svg"
            }${
                window.SVGSpriteVer !== "" ? `?v=${window.SVGSpriteVer}` : ""
            }`;
        ENERGYFM.placeholderPath = window.placeholderPath || "/design/images/site-design/placeholder.svg";

        ENERGYFM.lazyInstance = new LazyLoad();
        ENERGYFM.bodyScrollToggler = new NRJBodyScrollToggler();

        const cityChangePopup = new CityChangePopup({
            mainPlayerBtnSelector: ".main-player__play-live",
            onToggle: (show) => {
                ENERGYFM.bodyScrollToggler.hide(show);
            },
            onCityChange: (cityBtn) => {
                ENERGYFM.mainPlayer.setMainChannelActive();
                ENERGYFM.mainPlayer.setDefaultProgramData("ENERGY FM");
                ENERGYFM.mainPlayer.updateBroadcastSource(cityBtn);
            },
        });

        ENERGYFM.NRJMenu = new NRJMenu({
            onClose: () => {
                cityChangePopup.toggle(false);
            },
        });

        const themeToggler = new ThemeToggler({
            defaultTheme: "light",
            btnSelector: ".js-toggle-theme",
            btnDarkStateClassName: "toggle-theme-btn_state_dark",
        });

        // форма поиска по плейлисту в шапке (подменю "музыка")
        const menuSongSearchDateInput = document.querySelector(".page-header .song-search__input");
        const menuSongSearchForm = new DateTimeComponent({
            componentSelector: ".date-time-component_view_song-search",
            input: menuSongSearchDateInput,
            datepickerIniter: initDatePicker,
            onDateChange: (input) => {
                inputFillChecker({ target: input });
            },
        });

        menuSongSearchDateInput.addEventListener("focus", (event) => {
            menuSongSearchForm.toggle(true);
        });

        document.addEventListener("click", (event) => {
            const isMenuSongSearchClick = event.target.closest(".song-search") !== null;

            if (!isMenuSongSearchClick) {
                menuSongSearchForm.toggle(false);
            }
        });

        const stories = new NRJStories({
            storiesURL: "/stories-list",
        });

        // при скролле страницы слегка меняется шапка
        const header = document.querySelector(".page-header");
        const headerObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    const isPinned = entry.intersectionRatio !== 1;

                    header.classList.toggle("page-header_pinned", isPinned);
                    stories.toggleSmallSize(isPinned);
                });
            }, {
                rootMargin: "94px 0px 0px 0px",
                threshold: 1.0,
            }
        );
        headerObserver.observe( document.querySelector(".page-header__scroll-detector") );

        // функционал для тегов
        document.addEventListener("click", (event) => {
            const { target } = event;
            const isMoreBtn = target.classList.contains("tags__btn_t_more");
            const isRegularButton = target.matches("button.tags__btn:not(.tags__btn_t_more)");

            if (!isMoreBtn && !isRegularButton) return;

            const list = target.closest(".tags");

            // при нажатии на <button> тег - делаем его активным
            if (isRegularButton) {
                const activeBtn = list.querySelector(".tags__btn_active");
                activeBtn.classList.remove("tags__btn_active");
                target.classList.add("tags__btn_active");

                return;
            }

            // при нажатии на кпонку "ещё x" в списке .tags
            // показываем все скрытые теги
            [ ...list.querySelectorAll(".tags__item_hidden") ]
                .forEach((item) => {
                    item.classList.remove("tags__item_hidden");
                });

            target.parentElement.remove();
        });

        window.addEventListener("resize", throttle(function() {
            if ( getViewportWidth() > 1024 ) {
                // при ресайзе на десктопную ширину закрываем меню
                if ( ENERGYFM.NRJMenu.isOpened() ) {
                    ENERGYFM.NRJMenu.toggle();
                }
            }
        }, window, 200));

        ENERGYFM.titlesTickerInstance = new TitlesTicker({
            selector: ".player-titles",
            tickingClass: "player-titles_ticking",
        });

        ENERGYFM.mainPlayer = new NRJMainPlayer({
            onPlayerToggle: (show) => {
                if ( getViewportWidth() > 1024 ) {
                    root.classList.toggle("player-shrinked", !show);
                }
                ENERGYFM.slidersToUpdate.forEach((swiper) => {
                    swiper.update();
                });
            },
            onTitlesUpdateCB: (currentTrackID) => {
                if ( getArticleName() !== ENERGYFM.playlistPageAn ) return;

                const root = document.getElementById("MPAjaxMainBlock");
                const clearCurrent = () => {
                    const player = root.querySelector(".player_view_playlist-onair");
                    const playlistItem = root.querySelector(".playlist__item_view_onair");

                    if (player !== null) {
                        player.classList.remove("player_view_playlist-onair");
                    }
                    if (playlistItem !== null) {
                        playlistItem.classList.remove("playlist__item_view_onair");
                    }
                };

                if (currentTrackID === null) {
                    clearCurrent();

                    return;
                }

                const playBtn = root.querySelector(`.play-btn[data-broadcast-button="sample-${currentTrackID}"]`);

                if (playBtn === null) return;

                clearCurrent();

                const player = playBtn.closest(".player");
                const playlistItem = player.closest(".playlist__item");
                const cover = player.querySelector(".player__cover");

                player.classList.add("player_view_playlist-onair");
                playlistItem.classList.add("playlist__item_view_onair");

                const currentCover = cover.dataset.src;
                const path = currentCover.split("?")[0];
                cover.src = `${path}?w=100&h=100&pos=center`;

                ENERGYFM.lazyInstance.update();
            },
            onDJUpdate: (name, photo) => {
                if ( getArticleName() !== ENERGYFM.livePageAn ) return;

                const DJphoto = document.querySelector(".live-content__dj-photo");
                const DJname = document.querySelector(".live-content__dj-name");

                if (DJphoto !== null) {
                    DJphoto.src = photo;
                }
                if (DJname !== null) {
                    DJname.textContent = name;
                }
            },
        });

        ENERGYFM.likeShareInstance = new NRJLikeShare();

        ENERGYFM.equalizer = new NRJEqualizer();

        // видео попап
        const videoPopup = document.querySelector(".popup_content_video");
        const videoPopupCloseBtn = videoPopup.querySelector(".popup__close");
        const videoPlacement = videoPopup.querySelector(".iframe-wrap");

        document.addEventListener("click", (event) => {
            const videoBtn = event.target.closest(".js-video-btn");

            if (videoBtn === null || !videoBtn.dataset.video) return;

            [ ...document.querySelectorAll("audio") ].forEach((player) => {
                player.pause();
            });

            videoPlacement.innerHTML = videoBtn.dataset.video;

            togglePopup(videoPopup, true);
        });

        // при закрытии попапа с видео, удаляем iframe из дома
        videoPopupCloseBtn.addEventListener("click", (event) => {
            videoPlacement.innerHTML = "";
        });

        // обработчик форм
        document.addEventListener("formResponse", (event) => {
            const { form, data: response } = event.detail;
            const isError = response.status === 0;
            const { result } = response;
            const formWrap = form.closest(".form");
            const inner = formWrap.querySelector(".form__inner");
            const responseOutput = formWrap.querySelector(".form__response");
            const iconUSETag = responseOutput.querySelector(".form__icon use");
            const title = responseOutput.querySelector(".form__title");
            const desc = responseOutput.querySelector(".form__desc");
            const btn = responseOutput.querySelector(".form__response-btn");
            const successMsg = desc.dataset.success || "Мы свяжемся с вами в ближайшее время";

            formWrap.style.width = `${formWrap.offsetWidth}px`;
            formWrap.style.height = `${formWrap.offsetHeight}px`;
            inner.style.display = "none";
            iconUSETag.setAttribute("xlink:href", `${ENERGYFM.pathToSVGSprite}#${isError ? "error" : "success"}`);
            title.textContent = isError ? "Ошибка" : "Заявка отправлена";
            desc.textContent = isError
                ? (result !== ""
                    ? result
                    : "Не удалось отправить заявку")
                : successMsg;
            btn.textContent = isError ? "Попробовать еще раз" : "Ок";
            responseOutput.classList.add(isError ? "form__response_t_error" : "form__response_t_success");
            responseOutput.classList.add("form__response_visible");
        });

        document.addEventListener("click", (event) => {
            const formResponseBtn = event.target.closest(".form__response-btn");

            if (formResponseBtn === null) return;

            const closeOnClick = "close" in formResponseBtn.dataset;
            const { form } = formResponseBtn;
            const formWrap = form.closest(".form");
            const inner = formWrap.querySelector(".form__inner");
            const response = formWrap.querySelector(".form__response");
            const isError = response.classList.contains("form__response_t_error");
            const submit = form.querySelector(".form__submit");

            response.classList.remove("form__response_visible", "form__response_t_success", "form__response_t_error");
            inner.style.display = "";
            formWrap.style.width = "";
            formWrap.style.height = "";

            if (!isError) {
                form.reset();
                submit.disabled = true;

                [ ...form.querySelectorAll(".input") ].forEach((input) => {
                    inputFillChecker({ target: input });
                });

                if (closeOnClick) {
                    togglePopup(formResponseBtn.closest(".popup"), false, {
                        onStateToggle: () => {
                            ENERGYFM.bodyScrollToggler.hide(false);
                        },
                    });
                }
            }
        });

        const phoneMask = IMask(
            document.querySelector(".footer-form__input[name='fields[phone]']"), {
                mask: "+{7}0000000000",
            },
        );

        // общие обработчики для попапов

        // показать попап
        document.addEventListener("click", (event) => {
            const popupBtn = event.target.closest(".js-popup-btn");

            if (popupBtn === null) return;

            const targetPopup = document.querySelector(popupBtn.dataset.popupTarget);

            if (targetPopup === null) return;

            const isVisible = targetPopup.classList.contains("popup_appeared");

            togglePopup(targetPopup, !isVisible);
            ENERGYFM.bodyScrollToggler.hide(!isVisible);
        });

        // закрыть попап
        document.addEventListener("click", (event) => {
            const { target } = event;
            const isCloseBtnClick = target.closest(".popup__close") !== null;
            const closeOnDarkClick = target.classList.contains("popup") && "closeOnDarkClick" in target.dataset;

            if (!isCloseBtnClick && !closeOnDarkClick) return;

            const popup = target.closest(".popup");

            togglePopup(popup, false);
            ENERGYFM.bodyScrollToggler.hide(false);
        });

        document.addEventListener("keydown", (event) => {
            if (event.isComposing || event.keyCode === 229 || event.code !== "Escape") return;

            [ ...document.querySelectorAll(".popup_visible") ]
                .forEach((popup) => {
                    togglePopup(popup, false);
                    videoPlacement.innerHTML = "";
                    ENERGYFM.bodyScrollToggler.hide(false);
                });
        });

        // помечаем инпуты как "заполенные"
        document.addEventListener("change", inputFillChecker);

        function inputFillChecker(event) {
            const input = event.target;
            const value = input.value.trim();

            input.classList.toggle("label__input_filled", value !== "");
        }

        ENERGYFM.isInited = true;
    });
};

// главная
ENERGYFM.initializers[ENERGYFM.indexPageAn] = () => {
    const sliderDOMNode = document.querySelector(".main-slider");
    const mainSlider = new Swiper(sliderDOMNode, {
        slidesPerView: "auto",
        spaceBetween: 12,
        loop: true,
        autoplay: {
            delay: 5000,
        },
        pagination: {
            type: "fraction",
            el: ".main-slider__pagination",
            renderFraction(currentClass, totalClass) {
                return `<span class="main-slider__pagination-active ${currentClass}"></span>/<span class="${totalClass}"></span>`;
            },
            formatFractionCurrent(number) {
                return number > 9 ? number : number.toString().padStart(2, "0");
            },
            formatFractionTotal(number) {
                return number > 9 ? number : number.toString().padStart(2, "0");
            },
        },
        navigation: {
            nextEl: ".main-slider__btn_t_next",
            prevEl: ".main-slider__btn_t_prev",
        },
        breakpoints: {
            // >= 768
            768: { spaceBetween: 16, },
            // >= 1025
            1025: { spaceBetween: 32, },
        },
    });

    ENERGYFM.slidersToUpdate.push(mainSlider);

    let tracksSlider = null;
    let isTrackSliderInited = false;

    checkNewTracksSlider();

    const resizeHandler = throttle(checkNewTracksSlider, window, 200);

    ENERGYFM.pageHandlers[ENERGYFM.indexPageAn] = ENERGYFM.pageHandlers[ENERGYFM.indexPageAn] || [];

    window.addEventListener("resize", resizeHandler);

    ENERGYFM.pageHandlers[ENERGYFM.indexPageAn].push({
        target: window,
        event: "resize",
        handler: resizeHandler,
    });

    function checkNewTracksSlider() {
        const viewportWidth = getViewportWidth();

        if (viewportWidth < 1280) {
            if (!isTrackSliderInited) {
                tracksSlider = new Swiper(".new-tracks-slider", {
                    slidesPerView: "auto",
                });
                isTrackSliderInited = true;

                ENERGYFM.slidersToUpdate.push(tracksSlider);
            }
        }
        else if (isTrackSliderInited) {
            tracksSlider.destroy();
            isTrackSliderInited = false;
        }
    }

    [ ...document.querySelectorAll("#MPAjaxMainBlock .track_view_ticking-titles") ]
        .forEach((track) => {
            ENERGYFM.titlesTickerInstance.observeElement(
                track.querySelector(".track__title")
            );
            ENERGYFM.titlesTickerInstance.observeElement(
                track.querySelector(".track__artist")
            );
        });

    if ( document.querySelectorAll(".index-media-slider__slide").length > 0 ) {
        const mediaSlider = new Swiper(".index-media-slider", {
            slidesPerView: 1,
            spaceBetween: 16,
            resistanceRatio: 0,
            navigation: {
                nextEl: ".index-media-slider__btn_t_next",
                prevEl: ".index-media-slider__btn_t_prev",
                disabledClass: "index-media-slider__btn_disabled",
            },
        });
    }

    const initIndexSlider = (selector, tagsSelector = null) => {
        const swiper = new Swiper(selector, {
            slidesPerView: "auto",
            freeMode: true,
            spaceBetween: 16,
            navigation: {
                nextEl: `${selector} .index-slider__btn_t_next`,
                prevEl: `${selector} .index-slider__btn_t_prev`,
                disabledClass: "index-slider__btn_disabled",
            },
            breakpoints: {
                // >= 1280
                1280: {
                    freeMode: false,
                    spaceBetween: 32,
                },
            },
        });

        ENERGYFM.slidersToUpdate.push(swiper);

        if (tagsSelector !== null) {
            const tags = document.querySelector(tagsSelector);

            tags.addEventListener("click", async (event) => {
                const isTabBtn = event.target.classList.contains("tags__btn");
                const { url } = event.target.dataset;

                if (!isTabBtn || !url) return;

                const response = await fetch(url);
                const html = await response.text();
                const placement = document.querySelector(`${selector} .swiper-wrapper`);
                placement.innerHTML = html;

                swiper.update();
                ENERGYFM.lazyInstance.update();

                [ ...placement.querySelectorAll(".player-titles") ]
                    .forEach((el) => {
                        ENERGYFM.titlesTickerInstance.observeElement(el);
                    });
            });
        }

        return swiper;
    };

    const videoSlider = initIndexSlider(".js-video-slider", ".js-video-tags");
    const clipsSlider = initIndexSlider(".js-clips-slider");
    const newsSlider = initIndexSlider(".js-news-slider", ".js-news-tags");
};

// плейлист (история эфира)
ENERGYFM.initializers[ENERGYFM.playlistPageAn] = () => {
    if (ENERGYFM.initedPages[ENERGYFM.playlistPageAn]) return;

    initDatePicker( document.querySelector("#MPAjaxMainBlock .history-form__input_t_date") );
};

// видео
ENERGYFM.initializers[ENERGYFM.videoPageAn] = () => {
    if (ENERGYFM.initedPages[ENERGYFM.videoPageAn]) return;

    const localSearchSelector = "#MPAjaxMainBlock .js-video-local-search";
    const localSearch = new LocalSearch({
        selector: localSearchSelector,
    });
    const clickOutsideLocalSearchDetector = (event) => {
        const isLocalSearchClick = event.target.closest(localSearchSelector) !== null;

        if (!isLocalSearchClick) {
            localSearch.hideHints();
        }
    };

    document.addEventListener("click", clickOutsideLocalSearchDetector);

    ENERGYFM.pageHandlers[ENERGYFM.videoPageAn] = ENERGYFM.pageHandlers[ENERGYFM.videoPageAn] || [];

    ENERGYFM.pageHandlers[ENERGYFM.videoPageAn].push({
        target: document,
        event: "click",
        handler: clickOutsideLocalSearchDetector,
    });

    const dateTimeComponentSelector = "#MPAjaxMainBlock .date-time-component";
    const dateTimePicker = new DateTimeComponent({
        componentSelector: dateTimeComponentSelector,
        input: "#MPAjaxMainBlock .date-time-component__hidden-input",
        useDateFilter: true,
        datepickerIniter: initDatePicker,
        onDateChange: (input) => {
            localSearch.itemFilter.updateCriteria("date", input.value);
        },
    });
    const clickOutsideComponentDetector = (event) => {
        const isComponentClick = event.target.closest(dateTimeComponentSelector) !== null;

        if (!isComponentClick) {
            dateTimePicker.toggle(false);
        }
    };

    // ловим на погружении, т.к. без этого случается баг:
    // элемент, на который кликнули внутри дейтпикера
    // на момент вызова обработчика уже может быть не в ДОМе
    document.addEventListener("click", clickOutsideComponentDetector, true);

    ENERGYFM.pageHandlers[ENERGYFM.videoPageAn].push({
        target: document,
        event: "click",
        handler: clickOutsideComponentDetector,
        useCapture: true,
    });

    let videoSlider = null;
    let isVideoSliderInited = false;

    const videoSliderIniter = (event) => {
        const viewportWidth = getViewportWidth();

        if (viewportWidth > 575 && viewportWidth < 1280) {
            if (!isVideoSliderInited) {
                videoSlider = new Swiper(".new-videos-slider", {
                    slidesPerView: "auto",
                    resistanceRatio: 0,
                });
                isVideoSliderInited = true;

                ENERGYFM.slidersToUpdate.push(videoSlider);
            }
        }
        else {
            if (isVideoSliderInited) {
                videoSlider.destroy();
                isVideoSliderInited = false;
            }
        }
    };

    videoSliderIniter();
    window.addEventListener("resize", videoSliderIniter);

    ENERGYFM.pageHandlers[ENERGYFM.videoPageAn].push({
        target: window,
        event: "resize",
        handler: videoSliderIniter,
    });

    const loader = document.getElementById("js-video-loader");

    if (loader === null) return;

    // ха-ха, смотрите, жихвери!
    $(loader).loader({
        action: "scroll",
        contentWrapper: "#js-video-list",
        href: "/video__load",
        parameter: "page",
        initPage: 2,
        onPageLoad: false,
        callbacks: {
            beforeLoad(params) {
                const currentCategorySource = document.querySelector(params.contentWrapper);

                if (currentCategorySource === null) return;

                const currentCategoryID = currentCategorySource.dataset.category;
                params.parameter = `${currentCategoryID ? `category=${currentCategoryID}&` : ""}page`;
            },
            afterLoad: function(params) {
                ENERGYFM.lazyInstance.update();
                localSearch.updateItems();
            },
            destroyCallback: function(params) {
                this.elements.trigger.remove();
            },
        },
    });
};

// исполнители
ENERGYFM.initializers[ENERGYFM.artistsPageAn] = () => {
    if (ENERGYFM.initedPages[ENERGYFM.artistsPageAn]) return;

    const alphabetFilterHeader = document.querySelector(".alphabet-filter__header");
    const isDetailedPage = alphabetFilterHeader === null;

    // если текущая страница - страница исполнителя
    if (isDetailedPage) {
        const desc = document.querySelector(".artist-content__desc");
        const toggleBtn = document.querySelector(".artist-content__toggle-btn");

        if (toggleBtn !== null) {
            toggleBtn.addEventListener("click", (event) => {
                const isExpanded = desc.classList.contains("artist-content__desc_expanded");
                const { top } = desc.getBoundingClientRect();

                desc.classList.toggle("artist-content__desc_expanded");
                toggleBtn.textContent = isExpanded ? "Подробнее" : "Свернуть";

                requestAnimationFrame(() => {
                    if (top < 90) {
                        document.documentElement.scrollTop = desc.offsetParent.offsetTop - 90;
                    }
                });
            });
        }

        const tracksBlock = document.querySelector(".artist-materials-block_content_tracks");

        if (tracksBlock !== null) {
            new ArtistMaterialsBlock({
                localSearchSelector: ".js-tracks-local-search",
                listSelector: ".track-list_view_artist-tracks",
                listLoadedClassName: "track-list_loaded",
                loaderID: "js-track-loader",
                loaderListID: "#js-artist-tracks",
                url: "/artist__tracks-load",
            });
        }

        const clipsBlock = document.querySelector(".artist-materials-block_content_clips");

        if (clipsBlock !== null) {
            new ArtistMaterialsBlock({
                localSearchSelector: ".js-clips-local-search",
                listSelector: ".video-list_view_artist-clips",
                listLoadedClassName: "video-list_loaded",
                loaderID: "js-clip-loader",
                loaderListID: "#js-artist-clips",
                url: "/artist__clips-load",
            });
        }

        return;
    }

    // далее по коду - функционал для страницы со списком исполнителей
    const alphabetFilterBtns = [ ...alphabetFilterHeader.querySelectorAll(".alphabet-filter__btn") ];
    const alphabetFilterTabs = {};

    [ ...document.querySelectorAll(".alphabet-filter__content") ].forEach((tab) => {
        alphabetFilterTabs[tab.dataset.tab] = tab;
    });

    alphabetFilterHeader.addEventListener("click", (event) => {
        alphabetFilterBtns.forEach((btn) => {
            btn.classList.toggle("alphabet-filter__btn_active", btn === event.target);

            alphabetFilterTabs[btn.dataset.tab].classList.toggle("alphabet-filter__content_visible", btn === event.target);
        });
    });

    const localSearchSelector = "#MPAjaxMainBlock .js-artists-local-search";
    const localSearch = new LocalSearch({
        selector: localSearchSelector,
    });
    const clickOutsideLocalSearchDetector = (event) => {
        const isLocalSearchClick = event.target.closest(localSearchSelector) !== null;

        if (!isLocalSearchClick) {
            localSearch.hideHints();
        }
    };

    document.addEventListener("click", clickOutsideLocalSearchDetector);

    ENERGYFM.pageHandlers[ENERGYFM.artistsPageAn] = ENERGYFM.pageHandlers[ENERGYFM.artistsPageAn] || [];

    ENERGYFM.pageHandlers[ENERGYFM.artistsPageAn].push({
        target: document,
        event: "click",
        handler: clickOutsideLocalSearchDetector,
    });

    const loader = document.getElementById("js-artist-loader");

    if (loader === null) return;

    // ха-ха, смотрите, жихвери!
    $(loader).loader({
        action: "scroll",
        contentWrapper: "#js-artists-list",
        href: "/artist__load",
        parameter: "page",
        initPage: 2,
        onPageLoad: false,
        callbacks: {
            beforeLoad(params) {
                const currentSymbolSource = document.querySelector(params.contentWrapper);

                if (currentSymbolSource === null) return;

                const currentSymbol = currentSymbolSource.dataset.symbol;
                params.parameter = `${currentSymbol !== "" ? `bysymbol=${currentSymbol}&` : ""}page`;
            },
            afterLoad: function(params) {
                ENERGYFM.lazyInstance.update();
                localSearch.updateItems();
            },
            destroyCallback: function(params) {
                this.elements.trigger.remove();
            },
        },
    });
};

// новые треки
ENERGYFM.initializers[ENERGYFM.tracksPageAn] = () => {
    if (ENERGYFM.initedPages[ENERGYFM.tracksPageAn]) return;

    const localSearchSelector = "#MPAjaxMainBlock .js-tracks-local-search";
    const localSearch = new LocalSearch({
        selector: localSearchSelector,
    });
    const clickOutsideLocalSearchDetector = (event) => {
        const isLocalSearchClick = event.target.closest(localSearchSelector) !== null;

        if (!isLocalSearchClick) {
            localSearch.hideHints();
        }
    };

    document.addEventListener("click", clickOutsideLocalSearchDetector);

    ENERGYFM.pageHandlers[ENERGYFM.artistsPageAn] = ENERGYFM.pageHandlers[ENERGYFM.artistsPageAn] || [];

    ENERGYFM.pageHandlers[ENERGYFM.artistsPageAn].push({
        target: document,
        event: "click",
        handler: clickOutsideLocalSearchDetector,
    });

    let slider = null;
    let isSliderInited = false;

    checkNewTracksSlider();

    const resizeHandler = throttle(checkNewTracksSlider, window, 200);

    window.addEventListener("resize", resizeHandler);

    ENERGYFM.pageHandlers[ENERGYFM.artistsPageAn].push({
        target: window,
        event: "resize",
        handler: resizeHandler,
    });

    function checkNewTracksSlider() {
        const viewportWidth = getViewportWidth();

        if (viewportWidth < 1280) {
            if (!isSliderInited) {
                slider = new Swiper(".new-tracks-slider", {
                    slidesPerView: "auto",
                });
                isSliderInited = true;

                ENERGYFM.slidersToUpdate.push(slider);
            }
        }
        else if (isSliderInited) {
            slider.destroy();
            isSliderInited = false;
        }
    }

    const loader = document.getElementById("js-new-tracks-loader");

    if (loader === null) return;

    // ха-ха, смотрите, жихвери!
    $(loader).loader({
        action: "scroll",
        contentWrapper: "#js-new-tracks-list",
        href: "/new-tracks__load/page/[%page%]",
        parameter: "page",
        initPage: 2,
        onPageLoad: false,
        callbacks: {
            afterLoad: function(params) {
                ENERGYFM.lazyInstance.update();
                localSearch.updateItems();
            },
            destroyCallback: function(params) {
                this.elements.trigger.remove();
            },
        },
    });
};

// клипы
ENERGYFM.initializers[ENERGYFM.clipsPageAn] = () => {
    if (ENERGYFM.initedPages[ENERGYFM.clipsPageAn]) return;

    const localSearchSelector = "#MPAjaxMainBlock .js-clips-local-search";
    const localSearch = new LocalSearch({
        selector: localSearchSelector,
    });
    const clickOutsideLocalSearchDetector = (event) => {
        const isLocalSearchClick = event.target.closest(localSearchSelector) !== null;

        if (!isLocalSearchClick) {
            localSearch.hideHints();
        }
    };

    document.addEventListener("click", clickOutsideLocalSearchDetector);

    ENERGYFM.pageHandlers[ENERGYFM.clipsPageAn] = ENERGYFM.pageHandlers[ENERGYFM.clipsPageAn] || [];

    ENERGYFM.pageHandlers[ENERGYFM.clipsPageAn].push({
        target: document,
        event: "click",
        handler: clickOutsideLocalSearchDetector,
    });

    const loader = document.getElementById("js-clips-loader");

    if (loader === null) return;

    // ха-ха, смотрите, жихвери!
    $(loader).loader({
        action: "scroll",
        contentWrapper: "#js-clips-list",
        href: "/clips__load/page/[%page%]",
        parameter: "page",
        initPage: 2,
        onPageLoad: false,
        callbacks: {
            afterLoad: function(params) {
                ENERGYFM.lazyInstance.update();
                localSearch.updateItems();
            },
            destroyCallback: function(params) {
                this.elements.trigger.remove();
            },
        },
    });
};

// страница трека/клипа
ENERGYFM.initializers[ENERGYFM.trackDetailedPageAn] = () => {
    if (ENERGYFM.initedPages[ENERGYFM.trackDetailedPageAn]) return;

    // по ум. счестчик времени трека будет цепляться за эфир,
    // поэтому показываем его только после клика на воспроизведение трека
    const playBtn = document.querySelector(".track-content__play-btn");
    const time = document.querySelector(".track-content__time");

    playBtn.addEventListener("click", (event) => {
        time.classList.toggle("track-content__time_visible");
    });

    const tabContainer = document.querySelector(".clip-text-block__inner");

    if (tabContainer === null) return;

    initTabs({
        tabContainer,
        btnClassName: "clip-text-block__btn",
        btnActiveClassName: "clip-text-block__btn_active",
        tabSelector: ".clip-text-block__text",
        tabActiveClassName: "clip-text-block__text_visible",
    });
};

// hot30
ENERGYFM.initializers[ENERGYFM.hot30PageAn] = () => {
    if (ENERGYFM.initedPages[ENERGYFM.hot30PageAn]) return;

    // при клике на button.player__inner_t_button
    // показываем/подгружаем инфу о треке (клип + текст)
    const container = document.querySelector(".hot-30-content");
    const placement = container.querySelector(".hot-30-content__track-info");
    const loadedTracks = {};
    // для первого трека инфа сразу отдается в шаблонах
    const loadedTrackInfo = placement.querySelector(".hot-30-content__item");
    loadedTracks[loadedTrackInfo.dataset.id] = loadedTrackInfo;

    const closeTrackInfo = (idToShow = null) => {
        for (const id in loadedTracks) {
            loadedTracks[id].style.display = id === idToShow ? "" : "none";
        }
    };
    const toggleTrackInfo = (show, id) => {
        toggleAnimation({
            show,
            el: placement,
            visibleClass: "hot-30-content__track-info_visible",
            animationClass: "hot-30-content__track-info_appeared",
            onStateToggle: (show) => {
                if (!show) {
                    closeTrackInfo();
                }
                if ( getViewportWidth() < 1025 ) {
                    ENERGYFM.bodyScrollToggler.hide(show);
                }
            },
            onBeforeShowing: () => {
                placement.scrollTop = 0;
                closeTrackInfo(id);
            },
        });
    };

    container.addEventListener("click", async (event) => {
        const trackBtn = event.target.closest(".player__inner_t_button");
        const closeTrackInfoBtn = event.target.closest(".hot-30-content__close");

        if (closeTrackInfoBtn !== null) {
            toggleTrackInfo(false);

            return;
        }

        if (trackBtn === null || !trackBtn.dataset.id) return;

        const { id } = trackBtn.dataset;

        toggleTrackInfo(true, id);

        if (id in loadedTracks) return;

        placement.classList.add("hot-30-content__track-info_loading");

        const response = await fetch(`/track-info/${id}`);
        const html = await response.text();
        const wrap = document.createElement("DIV");
        wrap.className = "hot-30-content__item";
        wrap.dataset.id = id;
        wrap.innerHTML = html;
        loadedTracks[id] = wrap;

        placement.classList.remove("hot-30-content__track-info_loading");
        placement.append(wrap);

        if ( getViewportWidth() > 1024 ) {
            document.documentElement.scrollTop = 0;
        }

        const tabContainer = wrap.querySelector(".clip-text-block__inner");

        if (tabContainer === null) return;

        initTabs({
            tabContainer,
            btnClassName: "clip-text-block__btn",
            btnActiveClassName: "clip-text-block__btn_active",
            tabSelector: ".clip-text-block__text",
            tabActiveClassName: "clip-text-block__text_visible",
        });
    });
};

// playlist (история эфира)
ENERGYFM.initializers[ENERGYFM.playlistPageAn] = () => {
    if (ENERGYFM.initedPages[ENERGYFM.playlistPageAn]) return;

    ENERGYFM.likeShareInstance.initShare();

    const input = document.querySelector("#MPAjaxMainBlock .date-time-component__hidden-input");
    const wrap = document.querySelector(".playlist-content__inner");
    const prevBtn = document.querySelector(".playlist-content__btn_t_prev");
    const nextBtn = document.querySelector(".playlist-content__btn_t_next");
    const selectedDateText = document.querySelector(".playlist-content__current");
    const dateTimeComponentSelector = "#MPAjaxMainBlock .date-time-component";

    const getTodayDate = () => {
        const today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);

        return today;
    }
    const dateTimePicker = new DateTimeComponent({
        componentSelector: dateTimeComponentSelector,
        input,
        datepickerIniter: initDatePicker,
        datepickerOptions: {
            defaultViewDate: getTodayDate(),
        },
        // при смене даты подставляем человеко-читаемую дату
        // и туглим кнопки "пред/след день" в завис-ти от выбранной даты
        onDateChange: (input) => {
            const { datepicker } = dateTimePicker;
            const today = getTodayDate();
            const selectedDate = datepicker.getDate();
            const isTodaySelected = today.toString() === selectedDate.toString();
            const dateTextFull = selectedDate.toLocaleDateString("ru-RU", {
                dateStyle: "long",
            });
            const dateText = dateTextFull.split(" г.")[0];

            selectedDateText.textContent = isTodaySelected ? `Сегодня, ${dateText}` : dateText;

            const isMinDate = selectedDate.valueOf() === datepicker.config.minDate;
            const isMaxDate = selectedDate.valueOf() === datepicker.config.maxDate;

            prevBtn.classList.toggle("playlist-content__btn_hidden", isMinDate);
            nextBtn.classList.toggle("playlist-content__btn_hidden", isMaxDate);
        },
    });

    wrap.addEventListener("click", (event) => {
        const btn = event.target.closest(".playlist-content__btn");

        if (btn === null) return;

        const { datepicker } = dateTimePicker;
        const isPrevBtn = btn.classList.contains("playlist-content__btn_t_prev");
        let currentDate = datepicker.getDate();

        if (currentDate === undefined) {
            currentDate = getTodayDate();
        }

        currentDate.setDate( currentDate.getDate() + (isPrevBtn ? -1 : 1) );
        datepicker.setDate(currentDate);
        dateTimePicker.submit(event);
    });

    const clickOutsideComponentDetector = (event) => {
        const isComponentClick = event.target.closest(dateTimeComponentSelector) !== null;

        if (!isComponentClick) {
            dateTimePicker.toggle(false);
        }
    };

    // ловим на погружении, т.к. без этого случается баг:
    // элемент, на который кликнули внутри дейтпикера
    // на момент вызова обработчика уже может быть не в ДОМе
    document.addEventListener("click", clickOutsideComponentDetector, true);

    ENERGYFM.pageHandlers[ENERGYFM.playlistPageAn] = ENERGYFM.pageHandlers[ENERGYFM.playlistPageAn] || [];

    ENERGYFM.pageHandlers[ENERGYFM.playlistPageAn].push({
        target: document,
        event: "click",
        handler: clickOutsideComponentDetector,
        useCapture: true,
    });

    const loader = document.getElementById("js-playlist-loader");

    if (loader === null) return;

    // ха-ха, смотрите, жихвери!
    $(loader).loader({
        action: "scroll",
        contentWrapper: "#js-playlist-list",
        href: "/playlist__load",
        parameter: "page",
        initPage: 2,
        onPageLoad: false,
        callbacks: {
            beforeLoad(params) {
                const list = document.querySelector(params.contentWrapper);

                if (list === null) return;

                const { date, time } = list.dataset;
                params.parameter = `${date ? `date=${date}&` : ""}${time ? `time=${time}&` : ""}page`;
            },
            afterLoad: function(params) {
                ENERGYFM.lazyInstance.update();
            },
            destroyCallback: function(params) {
                this.elements.trigger.remove();
            },
        },
    });
};

// новости
ENERGYFM.initializers[ENERGYFM.newsPageAn] = () => {
    if (ENERGYFM.initedPages[ENERGYFM.newsPageAn]) return;

    ENERGYFM.pageHandlers[ENERGYFM.newsPageAn] = ENERGYFM.pageHandlers[ENERGYFM.newsPageAn] || [];

    const isDetailedPage = document.querySelector("article.news-article") !== null;

    // страница со списком новостей
    if (!isDetailedPage) {
        const localSearchSelector = "#MPAjaxMainBlock .js-news-local-search";
        const localSearch = new LocalSearch({
            selector: localSearchSelector,
        });
        const clickOutsideLocalSearchDetector = (event) => {
            const isLocalSearchClick = event.target.closest(localSearchSelector) !== null;

            if (!isLocalSearchClick) {
                localSearch.hideHints();
            }
        };

        document.addEventListener("click", clickOutsideLocalSearchDetector);

        ENERGYFM.pageHandlers[ENERGYFM.newsPageAn].push({
            target: document,
            event: "click",
            handler: clickOutsideLocalSearchDetector,
        });

        const dateTimeComponentSelector = "#MPAjaxMainBlock .date-time-component";
        const dateTimePicker = new DateTimeComponent({
            componentSelector: dateTimeComponentSelector,
            input: "#MPAjaxMainBlock .date-time-component__hidden-input",
            useDateFilter: true,
            datepickerIniter: initDatePicker,
            onDateChange: (input) => {
                localSearch.itemFilter.updateCriteria("date", input.value);
            },
        });
        const clickOutsideComponentDetector = (event) => {
            const isComponentClick = event.target.closest(dateTimeComponentSelector) !== null;

            if (!isComponentClick) {
                dateTimePicker.toggle(false);
            }
        };

        // ловим на погружении, т.к. без этого случается баг:
        // элемент, на который кликнули внутри дейтпикера
        // на момент вызова обработчика уже может быть не в ДОМе
        document.addEventListener("click", clickOutsideComponentDetector, true);

        ENERGYFM.pageHandlers[ENERGYFM.newsPageAn].push({
            target: document,
            event: "click",
            handler: clickOutsideComponentDetector,
            useCapture: true,
        });

        const loader = document.getElementById("js-news-loader");

        if (loader === null) return;

        // ха-ха, смотрите, жихвери!
        $(loader).loader({
            action: "scroll",
            contentWrapper: "#js-news-list",
            href: "/news__load",
            parameter: "page",
            initPage: 2,
            onPageLoad: false,
            callbacks: {
                beforeLoad(params) {
                    const currentCategorySource = document.querySelector(params.contentWrapper);

                    if (currentCategorySource === null) return;

                    const currentKeyword = currentCategorySource.dataset.keyword;
                    params.parameter = `${currentKeyword ? `keyword=${currentKeyword}&` : ""}page`;
                },
                afterLoad: function(params) {
                    ENERGYFM.lazyInstance.update();
                    localSearch.updateItems();
                },
                destroyCallback: function(params) {
                    this.elements.trigger.remove();
                },
            },
        });

        return;
    }

    // далее по коду - инициализация страницы со статьей новости

    ENERGYFM.likeShareInstance.initShare();

    const sliders = [ ...document.querySelectorAll(".more-news-slider") ];
    const slidersData = [];

    sliders.forEach((slider) => {
        slidersData.push({
            isInited: false,
            swiper: null,
            node: slider,
        });
    });

    const checkMoreNewsSlider = () => {
        const viewportWidth = getViewportWidth();

        slidersData.forEach((slider) => {
            if (viewportWidth < 1025) {
                if (!slider.isInited) {
                    slider.swiper = new Swiper(slider.node, {
                        slidesPerView: "auto",
                        spaceBetween: 12,
                        breakpoints: {
                            // >= 768
                            768: {
                                spaceBetween: 16,
                            },
                        },
                    });
                    slider.isInited = true;

                    ENERGYFM.slidersToUpdate.push(slider.swiper);
                }
            }
            else if (slider.isInited) {
                slider.swiper.destroy();
                slider.isInited = false;
            }
        });
    };

    checkMoreNewsSlider();

    const throttledChecker = throttle(checkMoreNewsSlider, window, 200);
    window.addEventListener("resize", throttledChecker);

    ENERGYFM.pageHandlers[ENERGYFM.newsPageAn].push({
        target: window,
        event: "resize",
        handler: throttledChecker,
    });
};

// фото
ENERGYFM.initializers[ENERGYFM.photoPageAn] = () => {
    if (ENERGYFM.initedPages[ENERGYFM.photoPageAn]) return;

    ENERGYFM.pageHandlers[ENERGYFM.photoPageAn] = ENERGYFM.pageHandlers[ENERGYFM.photoPageAn] || [];

    const photoList = document.querySelector(".photo-list");

    // страница фото-альбома с галереей
    if (photoList !== null) {
        const gallery = new NRJGallery(photoList);
        const loader = document.getElementById("js-photo-loader");

        if (loader === null) return;

        // ха-ха, смотрите, жихвери!
        $(loader).loader({
            action: "scroll",
            contentWrapper: "#js-photo-list",
            href: "/photo__load",
            parameter: "page",
            initPage: 2,
            onPageLoad: false,
            callbacks: {
                beforeLoad(params) {
                    const currentIDSource = document.querySelector(params.contentWrapper);

                    if (currentIDSource === null) return;

                    const currentID = currentIDSource.dataset.id;
                    params.parameter = `${currentID ? `id=${currentID}&` : ""}page`;
                },
                afterLoad: function(params) {
                    ENERGYFM.lazyInstance.update();
                },
                destroyCallback: function(params) {
                    this.elements.trigger.remove();
                },
            },
        });

        return;
    }

    // далее по коду - инициализация всего для страницы с альбомами

    const localSearchSelector = "#MPAjaxMainBlock .js-photo-local-search";
    const localSearch = new LocalSearch({
        selector: localSearchSelector,
    });
    const clickOutsideLocalSearchDetector = (event) => {
        const isLocalSearchClick = event.target.closest(localSearchSelector) !== null;

        if (!isLocalSearchClick) {
            localSearch.hideHints();
        }
    };

    document.addEventListener("click", clickOutsideLocalSearchDetector);

    ENERGYFM.pageHandlers[ENERGYFM.photoPageAn].push({
        target: document,
        event: "click",
        handler: clickOutsideLocalSearchDetector,
    });

    const dateTimeComponentSelector = "#MPAjaxMainBlock .date-time-component";
    const dateTimePicker = new DateTimeComponent({
        componentSelector: dateTimeComponentSelector,
        input: "#MPAjaxMainBlock .date-time-component__hidden-input",
        useDateFilter: true,
        datepickerIniter: initDatePicker,
        onDateChange: (input) => {
            localSearch.itemFilter.updateCriteria("date", input.value);
        },
    });
    const clickOutsideComponentDetector = (event) => {
        const isComponentClick = event.target.closest(dateTimeComponentSelector) !== null;

        if (!isComponentClick) {
            dateTimePicker.toggle(false);
        }
    };

    // ловим на погружении, т.к. без этого случается баг:
    // элемент, на который кликнули внутри дейтпикера
    // на момент вызова обработчика уже может быть не в ДОМе
    document.addEventListener("click", clickOutsideComponentDetector, true);

    ENERGYFM.pageHandlers[ENERGYFM.photoPageAn].push({
        target: document,
        event: "click",
        handler: clickOutsideComponentDetector,
        useCapture: true,
    });

    const loader = document.getElementById("js-album-loader");

    if (loader === null) return;

    // ха-ха, смотрите, жихвери!
    $(loader).loader({
        action: "scroll",
        contentWrapper: "#js-album-list",
        href: "/album__load",
        parameter: "page",
        initPage: 2,
        onPageLoad: false,
        callbacks: {
            beforeLoad(params) {
                const currentGroupSource = document.querySelector(params.contentWrapper);

                if (currentGroupSource === null) return;

                const currentGroupID = currentGroupSource.dataset.group;
                params.parameter = `${currentGroupID ? `group=${currentGroupID}&` : ""}page`;
            },
            afterLoad: function(params) {
                ENERGYFM.lazyInstance.update();
                localSearch.updateItems();
            },
            destroyCallback: function(params) {
                this.elements.trigger.remove();
            },
        },
    });
};

// акции / прошедшие акции
const actionsIniter = () => {
    const list = document.querySelector(".action-list");
    const isDetailedPage = document.querySelector(".action-content") !== null;

    // детальная страница акции
    if (isDetailedPage) {
        const moreActionsSlider = new Swiper(".actions-slider", {
            slidesPerView: "auto",
            navigation: {
                prevEl: ".actions-slider__btn_t_prev",
                nextEl: ".actions-slider__btn_t_next",
                disabledClass: "actions-slider__btn_disabled",
            },
        });

        ENERGYFM.slidersToUpdate.push(moreActionsSlider);

        return;
    }

    // далее по коду инициализация страниц со списком акций

    if (list === null) return;

    if ( !list.classList.contains("action-list_view_compact") ) {
        list.addEventListener("click", (event) => {
            const toggleBtn = event.target.closest(".action__toggle-btn");
    
            if (toggleBtn === null) return;
    
            const desc = toggleBtn.closest(".action__desc");
            const isExpanded = desc.classList.contains("action__desc_expanded");
            const { top } = desc.getBoundingClientRect();
    
            desc.classList.toggle("action__desc_expanded");
            toggleBtn.textContent = isExpanded ? "Еще" : "Свернуть";
    
            requestAnimationFrame(() => {
                if (top < 90) {
                    document.documentElement.scrollTop = desc.offsetParent.offsetTop - 90;
                }
            });
        });
    }

    const loader = document.getElementById("js-action-loader");

    if (loader === null) return;

    // ха-ха, смотрите, жихвери!
    $(loader).loader({
        action: "scroll",
        contentWrapper: "#js-action-list",
        href: `/${"past" in loader.dataset ? "past-" : ""}action__load/page/[%page%]`,
        parameter: "page",
        initPage: 2,
        onPageLoad: false,
        callbacks: {
            afterLoad: function(params) {
                ENERGYFM.lazyInstance.update();
            },
            destroyCallback: function(params) {
                this.elements.trigger.remove();
            },
        },
    });
};
ENERGYFM.initializers[ENERGYFM.actionPageAn] = actionsIniter;
ENERGYFM.initializers[ENERGYFM.pastActionsPageAn] = actionsIniter;

// подкасты
ENERGYFM.initializers[ENERGYFM.podcastPageAn] = () => {
    if (ENERGYFM.initedPages[ENERGYFM.podcastPageAn]) return;

    const localSearchSelector = "#MPAjaxMainBlock .js-podcasts-local-search";
    const localSearch = new LocalSearch({
        selector: localSearchSelector,
    });
    const clickOutsideLocalSearchDetector = (event) => {
        const isLocalSearchClick = event.target.closest(localSearchSelector) !== null;

        if (!isLocalSearchClick) {
            localSearch.hideHints();
        }
    };

    document.addEventListener("click", clickOutsideLocalSearchDetector);

    ENERGYFM.pageHandlers[ENERGYFM.podcastPageAn] = ENERGYFM.pageHandlers[ENERGYFM.podcastPageAn] || [];

    ENERGYFM.pageHandlers[ENERGYFM.podcastPageAn].push({
        target: document,
        event: "click",
        handler: clickOutsideLocalSearchDetector,
    });

    const dateTimeComponentSelector = "#MPAjaxMainBlock .date-time-component";
    const dateTimePicker = new DateTimeComponent({
        componentSelector: dateTimeComponentSelector,
        input: "#MPAjaxMainBlock .date-time-component__hidden-input",
        useDateFilter: true,
        datepickerIniter: initDatePicker,
        onDateChange: (input) => {
            localSearch.itemFilter.updateCriteria("date", input.value);
        },
    });
    const clickOutsideComponentDetector = (event) => {
        const isComponentClick = event.target.closest(dateTimeComponentSelector) !== null;

        if (!isComponentClick) {
            dateTimePicker.toggle(false);
        }
    };

    // ловим на погружении, т.к. без этого случается баг:
    // элемент, на который кликнули внутри дейтпикера
    // на момент вызова обработчика уже может быть не в ДОМе
    document.addEventListener("click", clickOutsideComponentDetector, true);

    ENERGYFM.pageHandlers[ENERGYFM.podcastPageAn].push({
        target: document,
        event: "click",
        handler: clickOutsideComponentDetector,
        useCapture: true,
    });

    const loader = document.getElementById("js-podcast-loader");

    if (loader === null) return;

    // ха-ха, смотрите, жихвери!
    $(loader).loader({
        action: "scroll",
        contentWrapper: "#js-podcast-list",
        href: "/podcast__load",
        parameter: "page",
        initPage: 2,
        onPageLoad: false,
        callbacks: {
            beforeLoad(params) {
                const currentIDSource = document.querySelector(params.contentWrapper);

                if (currentIDSource === null || !("id" in currentIDSource.dataset)) return;

                const currentID = currentIDSource.dataset.id;
                params.parameter = `${currentID ? `id=${currentID}&` : ""}page`;
            },
            afterLoad: function(params) {
                ENERGYFM.lazyInstance.update();
                localSearch.updateItems();
            },
            destroyCallback: function(params) {
                this.elements.trigger.remove();
            },
        },
    });
};

// программа
ENERGYFM.initializers[ENERGYFM.programPageAn] = () => {
    if (ENERGYFM.initedPages[ENERGYFM.programPageAn]) return;

    const form = document.querySelector(".js-program-form");

    if (form === null) return;

    initTabs({
        tabContainer: form,
        btnClassName: "tabs__btn",
        btnActiveClassName: "uselessClassName",
        tabSelector: ".form__tab",
        tabActiveClassName: "form__tab_visible",
    });

    [ ...form.querySelectorAll("input[data-type='tel'") ]
        .forEach((input) => {
            IMask(
                input, {
                    mask: "+{7}0000000000",
                },
            );
        });
};

onPageEnter();

/**
 * на некоторых страницах нужны дополнительные обработчики "resize" для слайдеров
 * при уходе на другую страницу нужно их снять,
 * чтобы не плодить кучу одинаковых обработчиков
 * и чтобы не держать лишнюю память
 * 
 * @param {String} [pageToExclude] - имя страницы, на которую переходим (с нее не снимается)
 *                                   если параметр опущен, снимаются все обработчики
 */
ENERGYFM.removeAnHandlers = (pageToExclude = null) => {
    for (const an in ENERGYFM.pageHandlers) {
        if (an === pageToExclude || typeof ENERGYFM.pageHandlers[an] === "undefined") continue;

        ENERGYFM.pageHandlers[an].forEach(({ target, event, handler, useCapture = false }) => {
            target.removeEventListener(event, handler, useCapture);
        });

        delete ENERGYFM.pageHandlers[an];
        delete ENERGYFM.initedPages[an];
    }
};

/**
 * инициализируем необходимые для страниц скрипты
 * и снимаем лишние обработчики
 */
function onPageEnter() {
    isDocReady(() => {
        ENERGYFM.initCommon();

        ENERGYFM.slidersToUpdate = [];

        const html = document.documentElement;
        const root = document.getElementById("MPAjaxMainBlock");
        const an = getArticleName();
        html.scrollTop = 0;
        html.classList.toggle("inner-page", an !== "index");

        const viewportWidth = getViewportWidth();

        if (typeof ENERGYFM.initializers[an] === "function") {
            ENERGYFM.initializers[an]();
        }

        ENERGYFM.removeAnHandlers(an);
        ENERGYFM.lazyInstance.update();
        ENERGYFM.NRJMenu.toggle(false);
        document.activeElement.blur();

        // снимаем фокус с ссылки в меню
        if (document.activeElement) {
            document.activeElement.blur();
        }

        if (viewportWidth < 1025) {
            ENERGYFM.mainPlayer.togglePlayer(false);
        }

        const header = document.querySelector(".page-header");
        header.classList.toggle("page-header_view_inner-page", an !== "index");

        // устанавливаем ширину скроллбара, если ранее не было установлено
        // или значение было установлено на странице без сроллбара
        // нужно для некоторых компонентов
        const scrollbarWidth = ENERGYFM.bodyScrollToggler.getScrollbarWidth();
        const previouslySetScrollbarWidth = getCSSPropPixelValue(html, "--browser-scrollbar-width");

        if (scrollbarWidth !== previouslySetScrollbarWidth) {
            html.style.setProperty("--browser-scrollbar-width", `${scrollbarWidth}px`);
        }

        // инициализируем счетчики
        ENERGYFM.likeShareInstance.initCounters();

        // выделаем текущий трек в эфире на странице плейлиста
        if (an === ENERGYFM.playlistPageAn) {
            ENERGYFM.mainPlayer.onTitlesUpdate();
        }

        // после появления нового контента в ДОМе
        // устанавливаем слежку за бегущими строками
        const elementsObserve = [ ...root.querySelectorAll(".player-titles") ];
        elementsObserve.forEach((el) => {
            ENERGYFM.titlesTickerInstance.observeElement(el);
        });

        // обновляем состояние эквалайзера
        ENERGYFM.equalizer.update();
    });
}

/**
 * перед тем как вставить данные в дом
 * при переходе на другую страницу
 */
function beforeInsertCallback() {
    // isDocReady(() => {});
}

// вспомогательные функции

/**
 * туглит попап
 * 
 * @param {String/HTMLElement} popup - селектор либо сама дом-нода попапа
 * @param {Boolean} show - целевое состояние попапа
 * @param {Object= {}} [toggleAnimationCallbacks] - третьим параметром можно прокинуть
 *                                                  коллбеки onStateToggle, onBeforeShowing
 *                                                  для toggleAnimation
 *      @prop {Function} onStateToggle
 *      @prop {Function} onBeforeShowing
 */
function togglePopup(popup, show, { onStateToggle, onBeforeShowing } = {}) {
    let popupDOMNode = null;

    if (typeof popup === "string") {
        popupDOMNode = document.querySelector(popup);
    }
    else if (popup instanceof HTMLElement) {
        popupDOMNode = popup;
    }

    if (popupDOMNode === null) return;

    toggleAnimation({
        show,
        el: popupDOMNode,
        visibleClass: "popup_visible",
        animationClass: "popup_appeared",
        onStateToggle,
        onBeforeShowing,
    });
}

/**
 * ограничивает количество вызовов функции fn не более чем раз в ms милисекунд
 * 
 * @param {Function} fn - требуемая функция
 * @param {Object} ctx - контекст, в которой будет вызываться функция fn
 * @param {Number} ms - количество милисекунд
 * @returns {Function} - декоратор требуемой функции
 */
function throttle(fn, ctx, ms) {
    let pendingCall = null;
    let lastCall = -ms;

    const decorator = function() {
        const now = performance.now();
        const diff = now - lastCall;
        const args = arguments;
        clearTimeout(pendingCall);

        if (diff >= ms) {
            lastCall = now;
            fn.call(ctx, ...args);
        }
        else {
            pendingCall = setTimeout(decorator, ms - diff, ...args);
        }
    };

    return decorator;
}

/**
 * вспомогательная функция для инициализации переключения табов
 * 
 * @param {Object}
 *      @prop {HTMLElement} tabContainer - общий контейнер, в котором находятся и кнопки, и табы
 *      @prop {String} btnClassName - css-класс кнопки, без точки в начале
 *      @prop {String} btnActiveClassName - css-класс активного состояния кнопки
 *      @prop {String} tabSelector - селектор табов
 *      @prop {String} tabActiveClassName - css-класс активного состояния табов
 */
function initTabs({
    tabContainer,
    btnClassName,
    btnActiveClassName,
    tabSelector,
    tabActiveClassName,
}) {
    const tabBtns = [ ...tabContainer.querySelectorAll(`.${btnClassName}`) ];
    const tabs = [ ...tabContainer.querySelectorAll(tabSelector) ];

    tabContainer.addEventListener("click", (event) => {
        const { target } = event;
        const isTabBtn = target.classList.contains(btnClassName);

        if (!isTabBtn) return;

        const targetTab = tabContainer.querySelector(target.dataset.target);

        tabBtns.forEach((btn) => {
            btn.classList.toggle(btnActiveClassName, btn === target);
        });
        tabs.forEach((tab) => {
            tab.classList.toggle(tabActiveClassName, tab === targetTab);
        });
    });
}

/**
 * вспомогательная функция для
 * инициализации целевого инпута как Datepicker
 * 
 * @param {HTMLInputElement} input
 * @param {Object} options - объект с пробрасываемыми доп. параметрами Datepicker
 * @returns {Datepicker}
 */
function initDatePicker(input, options = {}) {
    if (input === null) return;

    const today = new Date();
    today.setHours(23);
    today.setMinutes(59);
    today.setSeconds(59);

    // минимальная дата - последний год с текущего момента
    const lastYear = new Date( today.getFullYear() - 1, today.getMonth() );

    const datePicker = new Datepicker(input, {
        language: "ru",
        minDate: lastYear,
        maxDate: today,
        prevArrow: `<svg class="datepicker__prev" width="8" height="15"><use xlink:href="${ENERGYFM.pathToSVGSprite}#arrow"></use></svg>`,
        nextArrow: `<svg class="" width="8" height="15"><use xlink:href="${ENERGYFM.pathToSVGSprite}#arrow"></use></svg>`,
        ...options,
    });

    return datePicker;
}

/**
 * возвращает ширину вьюпорта
 */
function getViewportWidth() {
    return document.body.clientWidth;
}

/**
 * хелпер для получения имени статьи шаблонизатора
 * если нужно распарсить текущую страницу, нужно вызывать без параметра
 * @param {String} [url] - урл страницы, которую нужно распарсить, необязательный 
 * @returns {String}
 */
function getArticleName(url = window.location.href) {
    return MP.ParseQueryString(url).an || "index";
}

/**
 * вспомогательная обертка над getPropertyValue
 * @param {HTMLElement} el - дом-нода, с которой нужно взять свойство
 * @param {String} prop - строка со свойством
 * @return {Number / String} -  если значение свойства в пикселях - возвращается число,
 *                              иначе - пустая строка
 */
function getCSSPropPixelValue(el, prop) {
    const style = getComputedStyle(el);
    const propValue = style.getPropertyValue(prop);
    let value = propValue;

    if (propValue !== "") {
        const tmp = propValue.split("px");

        value = tmp.length > 0 ? +tmp[0] : top;
        value = isNaN(value) ? "" : value;
    }

    return value;
}