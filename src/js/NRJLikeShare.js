/**
 * инициализирует соответствующий компонент
 * 
 * для голосования за треки используется модуль голосований
 * для голосования за новости и трансляцию модуль счетчиков
 * 
 * @public @method initShare - инициализирует Share
 * 
 * @public @method initCounters - инициализирует кнопки лайка для новости и трансляции
 */

class NRJLikeShare {
    constructor() {
        this._onCounterClick = this._onCounterClick.bind(this);

        document.addEventListener("click", (event) => {
            const likeBtn = event.target.closest(".like-btn");

            if (likeBtn === null) return;

            likeBtn.classList.add("like-btn_voted");
            likeBtn.disabled = true;

            const likeShare = likeBtn.parentElement;

            if ( !likeShare.classList.contains("like-share") ) return;

            likeShare.classList.add("like-share_opened");
        });

        const that = this;

        new SimplePoll({
            selector: ".js-like-btn",
            pollID: 6,
            // this === кликнутая кнопка
            successCallback(respond, self) {
                that._incrementCounter(this, "Вы уже голосовали за данный трек");
            },
            errorCallback(respond, self) {
                MP.notify("Вы уже голосовали за данный трек", "def");
            },
        });
    }

    initShare() {
        new Share({
            wrapper: ".share",
            button: ".js-share-btn",
        });
    }

    initCounters() {
        const an = getArticleName();
        const newsArticle = document.querySelector("article.news-article");
        const isDetailedNewsPage = (
                an === ENERGYFM.newsPageAn
            &&  newsArticle !== null
        );
        const isLivePage = an === ENERGYFM.livePageAn;

        if (!isDetailedNewsPage && !isLivePage) return;

        const likeBtn = isDetailedNewsPage
            ? newsArticle.querySelector(".like-btn")
            : document.querySelector(".live-content .like-btn");

        if (likeBtn === null) return;

        likeBtn.addEventListener("click", this._onCounterClick, { once: true });
    }

    _incrementCounter(btn, text) {
        btn.querySelector(".like-btn__likes")
            .textContent = this._roundLikes( +(btn.dataset.likes) + 1 );
        btn.title = text;
    }

    _roundLikes(val) {
        return val > 999
            ? `${Math.round(val / 100) / 10}K`
            : val;
    }

    async _onCounterClick(event) {
        const { target } = event;
        const { id } = target.dataset;

        if (!id) return;

        const isNewsCounter = target.classList.contains("js-news-counter");
        const part = isNewsCounter ? 9 : 47;
        const text = isNewsCounter
            ? "Вы уже голосовали за данную новость"
            : "Вы уже голосовали за трансляцию";

        await fetch(`/api/counters/save/${part}/${id}/spacer.png`);

        this._incrementCounter(target, text);
    }
}