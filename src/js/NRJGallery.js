/**
 * вспомогательный класс для инициализации фото-галереи
 * 
 * функция togglePopup и объект ENERGYFM - в глобальном контексте
 * 
 * @contructor
 *      @param {HTMLElement} wrapper -  список с фотографиями,
 *                                      по клику на который будет открываться галерея
 */

class NRJGallery {
    constructor(wrapper) {
        this._popup = document.querySelector(".js-gallery-popup");
        this._isGalleryInited = false;

        this._onClick = this._onClick.bind(this);
        this._onThumbClick = this._onThumbClick.bind(this);

        wrapper.addEventListener("click", this._onClick);
        this._popup.querySelector(".gallery-thumb-slider")
            .addEventListener("click", this._onThumbClick, true);
    }

    _onClick(event) {
        event.preventDefault();

        const link = event.target.closest(".photo-list__item");

        if (link === null) return;

        const index = +link.dataset.index;

        togglePopup(this._popup, true, {
            onStateToggle: (show) => {
                ENERGYFM.bodyScrollToggler.hide(show);
            },
            onBeforeShowing: () => {
                if (!this._isGalleryInited) {
                    this._initSliders();
                }

                requestAnimationFrame(() => {
                    this._gotoSlide(index);
                });
            },
        });
    }

    _initSliders() {
        requestAnimationFrame(() => {
            this._mainSlider = new Swiper(".gallery-slider", {
                spaceBetween: 16,
                slidesPerView: 1,
                centeredSlides: true,
                keyboard: {
                    enabled: true,
                },
                pagination: {
                    type: "fraction",
                    el: ".gallery-slider__pagination",
                    renderFraction: (currentClass, totalClass) => {
                        return `<span class="${currentClass}"></span>/<span class="${totalClass}"></span>`;
                    },
                },
                navigation: {
                    nextEl: ".gallery-slider__btn_t_next",
                    prevEl: ".gallery-slider__btn_t_prev",
                    disabledClass: "gallery-slider__btn_disabled",
                },
                on: {
                    activeIndexChange: () => {
                        this._highlightThumb(this._mainSlider.activeIndex);
                    },
                },
            });

            this._thumbSlider = new Swiper(".gallery-thumb-slider", {
                slidesPerView: "auto",
                freeMode: true,
            });

            this._isGalleryInited = true;
        });
    }

    _onThumbClick(event) {
        const thumbLink = event.target.closest(".gallery-thumb-slider__slide");

        if (thumbLink === null) return;

        event.preventDefault();

        const index = +thumbLink.dataset.index;
        this._mainSlider.slideTo(index);
        this._highlightThumb(index);
    }

    _gotoSlide(index) {
        this._mainSlider.slideTo(index, 0, false);
    }

    _highlightThumb(targetIndex) {
        Array.from(this._thumbSlider.slides).forEach((slide, index) => {
            slide.classList.toggle("gallery-thumb-slider__slide_active", index === targetIndex);
        });
    }
}