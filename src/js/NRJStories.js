/**
 * инициализирует истории
 * 
 * @constructor {Object}
 *      @prop {String} storiesURL - ссылка для подгрузки историй
 * 
 * @public @method toggleSmallSize - уменьшает кнопку, используется при фиксации шапки
 *      @param {Boolean} isSmall - флаг маленького размера
 */

class NRJStories {
    constructor({
        storiesURL,
    }) {
        this._btn = document.querySelector(".nrj-stories");

        // если активных историй нет, кнопки в доме не будет
        if (this._btn === null) return this;

        this._storiesURL = storiesURL;
        this._popup = document.querySelector(".nrj-stories-popup");
        this._load = this._load.bind(this);

        this._step = 17;
        this._slideDuration = 5000;

        this._btn.addEventListener("click", this._load, { once: true });
    }

    toggleSmallSize(isSmall) {
        if (this._btn === null) return;

        this._btn.classList.toggle("nrj-stories_s_sm", isSmall);
    }

    async _load() {
        const response = await fetch(this._storiesURL);
        const html = await response.text();

        this._popup.classList.remove("nrj-stories-popup_loading");
        const placement = this._popup.querySelector(".popup__inner");

        placement.innerHTML = html;

        this._initSlider();
        this._slideChanger();
    }

    _clearBullets() {
        this._bullets.forEach((bullet) => bullet.style.setProperty(`--story-progress`, 0));
    }

    _fillBullet(time) {
        if (this._bulletInterval) clearInterval(this._bulletInterval);
        this._clearBullets();
        let timer = 0;
        const activeBullet = this._bullets[this._slider.snapIndex];
        this._bulletInterval = setInterval(() => {
            if (timer >= time) return clearInterval(this._bulletInterval);
            const position = ((timer += this._step / time) * 100) + `%`;
            window.requestAnimationFrame(() => {
                activeBullet.style.setProperty(`--story-progress`, position);
            });
        }, this._step);
    }

    _addTimeout(time) {
        if (this._timeout) clearTimeout(this._timeout);
        this._fillBullet(time);
        if ((this._slider.snapIndex + 1) >= this._slider.slides.length) return false;
        this._timeout = setTimeout(() => this._slider.slideNext(), time);
    }

    _slideChanger() {
        this._bullets = document.querySelectorAll(`.stories-slider__bullet`);
        const slide = this._slider.slides[this._slider.snapIndex];
        const video = slide.querySelector(`video`);
        if (video) {
            video.pause();
            video.currentTime = 0;
            const canplayListener = () => {
                this._addTimeout(video.duration * 1000);
                video.removeEventListener(`canplay`, canplayListener);
            };
            video.addEventListener(`canplay`, canplayListener);
            return video.play();
        }
        this._addTimeout(this._slideDuration);
    }

    _initSlider() {
        this._slider = new Swiper(".stories-slider__slider", {
            slidesPerView: 1,
            resistanceRatio: 0,
            pagination: {
                el: ".stories-slider__pagination",
                clickable: true,
                bulletClass: "stories-slider__bullet",
                bulletActiveClass: "stories-slider__bullet_active",
            },
            navigation: {
                disabledClass: "stories-slider__btn_disabled",
                prevEl: ".stories-slider__btn_t_prev",
                nextEl: ".stories-slider__btn_t_next",
            }
        });
        this._slider.on('activeIndexChange', this._slideChanger.bind(this));
    }

    _storiesViewed() {
        this._btn.classList.add("nrj-stories_viewed");
    }
}