/**
 * инициализирует плеер сайта
 * 
 * функции toggleAnimation, getCSSPropPixelValue, throttle
 * и объект ENERGYFM - в глобальном контексте
 * 
 * @constructor {Object}
 *      @prop {Function} onPlayerToggle -   коллбек, который вызывается при
 *                                          каждом показе/скрытии плеера
 *      @prop {Function} onTitlesUpdateCB - коллбек, который вызывается при изменении титров
 *      @prop {Function} onDJUpdate -       коллбек, который вызывается пр каждом запросе
 *                                          за данными текущего ведущего в эфире
 * 
 * @public @method togglePlayer -   в мобильном размерешении открывает попап с плеером
 *                                  в десктопе - переключает плеер между широким/узким видом
 *      @param {Boolean} show - флаг показа главного плеера
 * 
 * @public @method setMainChannelActive - делает кнопку с потоком "Radio NRJ" активной
 * 
 * @public @method setDefaultProgramData -  устанавливает дефолтное
 *                                          название текущей программыи обложку
 *      @param {String} title - название
 *      @param {String= ENERGYFM.placeholderPath} [cover] - путь до обложки
 * 
 * @public @method updateBroadcastSource - меняет поток вещания, копируя данные с донор-кнопки
 *      @param {HTMLElement} donorBtn - кнопка, со всеми необходимыми
 *                                      data-атрибутами для смены потока
 * 
 * @public @method onTitlesUpdate - метод вызывает коллбек onTitlesUpdateCB
 */

class NRJMainPlayer {
    constructor({
        onPlayerToggle,
        onTitlesUpdateCB,
        onDJUpdate,
    }) {
        this._player = document.querySelector(".main-player");
        this._mini = document.querySelector(".main-player-mini");
        this._mainBtn = this._player.querySelector(".main-player__play-live");
        this._miniBtn = this._mini.querySelector(".main-player-mini__play-btn");
        this._miniCoverBtn = this._mini.querySelector(".main-player-mini__cover-btn");
        this._miniTitlesTrack = this._mini.querySelector(".player__title");
        this._miniTitlesArtist = this._mini.querySelector(".player__subtitle");
        this._audioNode = this._player.querySelector("audio[data-player='nrj-main-player']");
        this._program = this._player.querySelector(".live-block__program");
        this._programMini = this._mini.querySelector(".player__title");
        this._cover = this._player.querySelector(".main-player__cover");
        this._historyList = document.getElementById("js-history-list");
        this._volumeComponents = [ ...document.querySelectorAll(".volume-control") ];
        this._scrollable = this._player.querySelector(".main-player__inner");
        this._channelBtns = [ ...this._player.querySelectorAll(".channel-list__btn") ];
        this._lyrics = this._player.querySelector(".live-track__lyrics");
        this._lyricsText = this._lyrics.querySelector(".live-track__lyrics-text");
        this._lyricsBtn = this._player.querySelector(".live-track__lyrics-btn");
        this._isLyricsVisible = false;
        this._platformInfo = this._player.querySelector(".other-platforms__el_visible");
        this._platformSocials = this._player.querySelector(".other-platforms__el_t_socials");

        const viewportWidth = getViewportWidth();
        const isDesktop = viewportWidth >= 1025;
        this._prevWidth = viewportWidth;
        this._isVisible = isDesktop;
        this._isShrinked = false;
        this._isChannelSliderInited = false;
        this._currentTrackID = null;

        this._onToggleCB = onPlayerToggle;
        this._onTitlesUpdateCB = onTitlesUpdateCB;
        this._onPlayerClick = this._onPlayerClick.bind(this);
        this._onMiniClick = this._onMiniClick.bind(this);
        this._onVolumeChange = this._onVolumeChange.bind(this);
        this._onTitlesUpdate = this._onTitlesUpdate.bind(this);
        this._onDJUpdate = onDJUpdate;

        this._player.addEventListener("click", this._onPlayerClick);
        this._mini.addEventListener("click", this._onMiniClick);
        window.addEventListener("resize", throttle(this._update, this, 200));

        // при смене трека, добавляем последний в историю эфира
        this._audioNode.addEventListener("volumechange", this._onVolumeChange);
        // при смене трека, добавляем последний в историю эфира
        this._audioNode.addEventListener("alEventHistory", this._onTitlesUpdate);
        document.addEventListener("titlesEvent", this._onTitlesUpdate);

        if (isDesktop) {
            this.togglePlayer(true);
        }
        else {
            this._updateMiniTitles();
        }
    }

    togglePlayer(show) {
        const _show = typeof show === "boolean" ? show : !this._isVisible;
        const viewportWidth = getViewportWidth();

        toggleAnimation({
            show: _show,
            el: this._player,
            visibleClass: "main-player_visible",
            animationClass: "main-player_appeared",
            onStateToggle: (show) => {
                if (viewportWidth < 1025) {
                    ENERGYFM.bodyScrollToggler.hide(show);
                }

                if (show) {
                    this._initChannelSlider();
                }
            },
            onBeforeShowing: () => {
                this._scrollable.scrollTop = 0;
            },
        });

        if (viewportWidth >= 1025) {
            toggleAnimation({
                show: !_show,
                el: this._mini,
                visibleClass: "main-player-mini_visible",
                animationClass: "main-player-mini_appeared",
                onStateToggle: (show) => {
                    if (!show) return;

                    this._updateMiniTitles();
                },
            });
        }

        this._isVisible = _show;

        this._onToggleCB(_show);
    }

    setMainChannelActive() {
        this._channelBtns.forEach((btn) => {
            btn.classList.toggle("channel-list__btn_active", btn.classList.contains("js-main-channel-btn"));
        });
    }

    setDefaultProgramData(title, cover = ENERGYFM.placeholderPath) {
        this._program.dataset.program = title;
        this._program.textContent = title;
        this._programMini.textContent = title;
        this._updateCover(cover);
    }

    updateBroadcastSource(donorBtn) {
        Object.assign(this._mainBtn.dataset, donorBtn.dataset);
        Object.assign(this._miniBtn.dataset, donorBtn.dataset);
        Object.assign(this._miniCoverBtn.dataset, donorBtn.dataset);
        this._mainBtn.click();
    }

    onTitlesUpdate() {
        this._onTitlesUpdateCB(this._currentTrackID);
    }

    _update() {
        const viewportWidth = getViewportWidth();
        const prevWidth = this._prevWidth;

        this._prevWidth = viewportWidth;

        // если разрешение не перескакивает с мобилки на десктоп и наоборот,
        // то ничего не меняем
        if (
                viewportWidth < 1025 && prevWidth < 1025
            ||  viewportWidth >= 1025 && prevWidth >= 1025
        ) return;

        // разрешение меняется с мобильного на десктоп
        if (viewportWidth >= 1025 && prevWidth < 1025) {
            if (this._isVisible) {
                ENERGYFM.bodyScrollToggler.hide(false);
            }

            this.togglePlayer(!this._isShrinked);

            return;
        }

        // далее подразумевается, что разрешение поменялось с десктопа на мобильное

        if (this._isVisible) {
            // скрываем плеер без анимации
            this._hide();
        }
    }

    _hide() {
        this._player.classList.remove("main-player_visible", "main-player_appeared");
        this._isVisible = false;
    }

    _onPlayerClick(event) {
        const { target } = event;
        const shrinkBtn = target.closest(".main-player__shrink-btn");

        if (shrinkBtn !== null) {
            this.togglePlayer(false);
            this._isShrinked = true;

            return;
        }

        const isChannelBtn = target.classList.contains("channel-list__btn");

        if (isChannelBtn) {
            this._setActiveChannelBtn(target);

            return;
        }

        if (target === this._lyricsBtn) {
            this._handleLyrics();

            return;
        }

        const otherPlatformsBtn = target.closest(".other-platforms__btn");

        if (otherPlatformsBtn !== null) {
            const isCloseBtn = otherPlatformsBtn.classList.contains("other-platforms__btn_t_close");

            this._toggleOtherPlatforms(!isCloseBtn);

            return;
        }
    }

    _onMiniClick(event) {
        const isMobile = getViewportWidth() < 1025;
        const { target } = event;
        const playerBtn = target.closest(".play-btn");
        const volume = target.closest(".volume-control");

        // если в мобильной версии клик прошел
        // по любой НЕинтерактивной области
        // тогда показываем плеер
        // (в мобилке в мини-плеере только одна интерактивная кнопка)
        if (isMobile) {
            if (playerBtn !== null) return;

            this.togglePlayer();

            return;
        }

        // плеер должен раскрываться при клике на любую область
        if (playerBtn === null && volume === null) {
            this.togglePlayer();
            this._isShrinked = false;
        }
    }

    _updateMiniTitles(){
        ENERGYFM.titlesTickerInstance.updateTicking(this._miniTitlesTrack);
        ENERGYFM.titlesTickerInstance.updateTicking(this._miniTitlesArtist);
    }

    async _handleLyrics() {
        if (this._isLyricsLoaded) {
            this._toggleLyrics();

            return;
        }

        this._lyrics.classList.add("live-track__lyrics_loading");
        this._toggleLyrics(true);

        const text = await fetch(`/getTrackLyrics/${this._lyricsBtn.dataset.id}`)
            .then((response) => response.text())
            .then((txt) => txt.trim());
        const isTextExist = text !== "";

        this._lyricsText.innerHTML = isTextExist ? text : "Мы не нашли текст для этого трека";
        this._lyricsBtn.disabled = !isTextExist;
        this._lyrics.classList.remove("live-track__lyrics_loading");
        this._isLyricsLoaded = isTextExist;

        if (!isTextExist) {
            setTimeout(() => {
                this._toggleLyrics(false);
                this._lyricsText.innerHTML = "";
            }, 3000);
        }
    }

    _toggleLyrics(show) {
        const _show = typeof show === "boolean" ? show : !this._isLyricsVisible;

        this._lyrics.classList.toggle("live-track__lyrics_visible", _show);
        this._isLyricsVisible = _show;
    }

    _updateLyricsData(mdbUidTrack) {
        if (mdbUidTrack) {
            this._lyricsBtn.dataset.id = mdbUidTrack;
            this._lyricsBtn.disabled = false;
        }
        else {
            delete this._lyricsBtn.dataset.id;
            this._lyricsBtn.disabled = true;
        }

        this._toggleLyrics(false);
        this._isLyricsLoaded = false;
    }

    _initChannelSlider() {
        if (this._isChannelSliderInited) return;

        const sliderWrap = this._player.querySelector(".channels-slider");

        this._slider = new Swiper(sliderWrap, {
            slidesPerView: "auto",
            initialSlide: 1,
            centeredSlides: true,
            slideToClickedSlide: true,
            resistanceRatio: .5,
        });

        sliderWrap.addEventListener("click", (event) => {
            const { target } = event;
            const isChannelBtn = target.classList.contains("channel-list__btn");

            if (!isChannelBtn) return;

            this.setDefaultProgramData(target.textContent, target.dataset.cover);
            this.updateBroadcastSource(target);
        });
    }

    _setActiveChannelBtn(activeBtn) {
        this._channelBtns.forEach((btn) => {
            btn.classList.toggle("channel-list__btn_active", btn === activeBtn);
        });
    }

    _toggleOtherPlatforms(show) {
        this._platformInfo.classList.toggle("other-platforms__el_visible", !show);
        this._platformSocials.classList.toggle("other-platforms__el_visible", show);
    }

    _onVolumeChange(event) {
        const { volume } = event.target;
        const iconName = volume === 0
            ? "sound-muted"
            : volume <= .5
                ? "sound-half"
                : "sound-full";

        this._volumeComponents.forEach((component) => {
            const svgUseNode = component.querySelector(".volume-control__icon use");

            svgUseNode.setAttribute("xlink:href", `${ENERGYFM.pathToSVGSprite}#${iconName}`);
        });
    }

    _onTitlesUpdate(event) {
        const isTitlesEvent = event.type === "titlesEvent";

        this._updateMiniTitles();

        // проверяем бегущую строку при смене титров
        if (isTitlesEvent) {
            const { mdbUidTrack = "" } = event.detail.result.short;
            const { dj : { name: DJName = "", photo: DJPhoto = "" } = { dj: {} } } = event.detail.result;

            // устанавливаем id на кнопку для подгрузки текста песни
            this._updateLyricsData(mdbUidTrack);
            this._currentTrackID = mdbUidTrack || null;
            this.onTitlesUpdate();

            // меняем текущую "программу в эфире" и ее обложку
            if (DJName !== "" && DJPhoto !== "") {
                this._updateCover(DJPhoto);

                this._program.textContent = DJName || this._program.dataset.program;
                this._programMini.textContent = DJName || this._program.dataset.program;

                this._onDJUpdate(DJName, DJPhoto);
            }

            return;
        }

        const { isException, titleExecutorFull, titleTrack, sample, cover, mdbUidTrack = "" } = event.detail.titlesData.short;
        const { startSongString } = event.detail.titlesData.stat;

        if (
                titleExecutorFull === ""
            &&  titleTrack === ""
            ||  this._historyList === null
            ||  isException === 1
        ) return;

        const latestSongArtist = this._historyList
            .firstElementChild
            .querySelector(".player__subtitle")
            .textContent
            .trim()
            .toLocaleLowerCase();
        const artistToCheck = titleExecutorFull
            .trim()
            .toLocaleLowerCase();

        // если последняя песня в истории уже есть - ничего не выводим
        if (latestSongArtist === artistToCheck) return;

        // подставляем данные, пришедшие с сокетов
        const newHistoryItem = this._historyList.lastElementChild.cloneNode(true);

        this._historyList.lastElementChild.remove();

        const timeNode = newHistoryItem.querySelector(".history-list__time");
        timeNode.textContent = startSongString.substring(0, 5);
        const trackNode = newHistoryItem.querySelector(".player__title");
        trackNode.textContent = titleTrack;
        const artistNode = newHistoryItem.querySelector(".player__subtitle");
        artistNode.textContent = titleExecutorFull;

        const isCoverExist = cover && cover.cover50;
        const coverNode = newHistoryItem.querySelector(".player__cover");
        coverNode.src = isCoverExist ? cover.cover50 : ENERGYFM.placeholderPath;

        let playBtn = newHistoryItem.querySelector(".play-btn");
        const btnTitle = `Воспроизвести семпл песни \"${titleExecutorFull}${titleTrack ? ` - ${titleTrack}` : ""}\"`;
        // если id у трека нет - пихаем любое уникальное значение
        const broadcastID = mdbUidTrack ? `sample-${mdbUidTrack}` : performance.now();

        playBtn.outerHTML = sample
            // если ссылка на семпл есть - выводим кнопку для воспроизвенения семпла
            ? `
                <button
                    class="play-btn play play-btn-wrap__btn"
                    type="button"
                    title="${btnTitle}"
                    aria-label="${btnTitle}"

                    data-player-button="nrj-main-player"
                    data-broadcast-button="${broadcastID}"
                    data-track="${sample}"
                    data-pause="true"
                >
                    <svg class="play-btn__icon play-btn__icon_t_play" width="14" height="12">
                        <use xlink:href="${ENERGYFM.pathToSVGSprite}#play"></use>
                    </svg>
                    <svg class="play-btn__icon play-btn__icon_t_pause" width="10" height="14">
                        <use xlink:href="${ENERGYFM.pathToSVGSprite}#pause"></use>
                    </svg>
                    <span class="loader loader_s_sm play-btn__loader">
                        <span class="loader__el"></span>
                        <span class="loader__el"></span>
                        <span class="loader__el"></span>
                        <span class="loader__el"></span>
                    </span>
                </button>
            `
            // если ссылки на семпл нет - выводим заглушку
            : `
                <div class="play-btn play play-btn_disabled play-btn-wrap__btn" title="Семпл песни не найден">
                    <svg class="play-btn__icon play-btn__icon_t_play" width="14" height="12">
                        <use xlink:href="${ENERGYFM.pathToSVGSprite}#play"></use>
                    </svg>
                </div>
            `;

        this._historyList.prepend(newHistoryItem);
        ENERGYFM.titlesTickerInstance.observeElement(trackNode);
        ENERGYFM.titlesTickerInstance.observeElement(artistNode);
    }

    _updateCover(cover) {
        this._cover.dataset.src = cover;

        if ( this._cover.classList.contains("loaded") ) {
            this._cover.src = cover;
        }
    }
}