/**
 * при воспроизведении семпла или подкаста
 * добавляем элемент с анимацией "эквалайзера" в название трека/подкаста
 * 
 * покрываются следующие сценарии:
 *      запускаем трек
 *          ничего не играло / играл эфир
 *          играл другой трек
 *      паузим трек
 *      трек кончается
 *      переходим на другую страницу в момент когда
 *          трек играет
 *          трек на паузе
 * 
 * @public @method update - хэндлит все анимации эквалайзера на странице,
 *                          исходя из состояния плеера
 */
class NRJEqualizer {
    constructor() {
        this._audioNode = document.querySelector("audio[data-player='nrj-main-player']");
        this._root = document.getElementById("MPAjaxMainBlock");
        this._currentBroadcastID = null;
        this._isTrackPaused = false;
        this._broadcastEqualizer = document.querySelector(".live-eq");

        this._audioNode.addEventListener("alEventPlay", (event) => {
            const broadcastID = this._audioNode.dataset.broadcastPlayer;
            const isSamplePlaying = broadcastID.indexOf("sample-") === 0;
            const isPodcastPlaying = broadcastID.indexOf("podcast-") === 0;

            // если играл другой трек
            if (this._currentBroadcastID !== null && this._currentBroadcastID !== broadcastID) {
                [ ...this._root.querySelectorAll(".eq-wrap") ]
                    .forEach(this._clearWrap);
            }

            this._isTrackPaused = false;

            if (!isSamplePlaying && !isPodcastPlaying) {
                this._currentBroadcastID = null;
                this.update();
                this._updateBroadcastEqualizer(true);

                return;
            }

            this._currentBroadcastID = broadcastID;
            this.update();
        });
        this._audioNode.addEventListener("alEventPause", (event) => {
            this._updateBroadcastEqualizer(false);

            if (this._currentBroadcastID === null) return;

            this._isTrackPaused = true;
            this._checkForAnimation();
        });
        this._audioNode.addEventListener("alEventEnded", (event) => {
            this._currentBroadcastID = null;
            this._isTrackPaused = false;
            this.update();
            this._updateBroadcastEqualizer(false);
        });
    }

    update() {
        if (this._currentBroadcastID === null) {
            this._checkForAnimation();

            return;
        }

        [ ...this._root.querySelectorAll(`.play-btn[data-broadcast-button="${this._currentBroadcastID}"]`) ]
            .forEach((playBtn) => {
                const track = playBtn.closest(".track");
                const isTrack = track !== null;
                const podcast = playBtn.closest(".podcast");
                const isPodcast = podcast !== null;
                const player = playBtn.closest(".player");
                const isPlayer = player !== null;
                let placement = null;

                if (isTrack) {
                    placement = track.querySelector(".eq-wrap");
                }
                if (isPodcast) {
                    placement = podcast.querySelector(".eq-wrap");
                }
                if (isPlayer) {
                    placement = player.querySelector(".eq-wrap");
                }

                if ( placement !== null && !placement.classList.contains("eq-wrap_animating") ) {
                    const eq = this._createEq( placement.classList.contains("eq-wrap_s_lg") );
                    placement.prepend(eq);
                }
            });

        this._checkForAnimation();
    }

    _createEq(isLargeSize) {
        const eq = document.createElement("DIV");
        eq.className = `equalizer${isLargeSize ? " equalizer_s_lg": ""} eq-wrap__eq`;

        for (let i = 0; i < 4; i++) {
            const bar = document.createElement("DIV");
            bar.className = `equalizer__bar equalizer__bar_n_${i + 1}`;
            eq.append(bar);
        }

        return eq;
    }

    _checkForAnimation() {
        if (this._currentBroadcastID === null) {
            [ ...this._root.querySelectorAll(".eq-wrap") ]
                .forEach(this._clearWrap);

            return;
        }

        [ ...this._root.querySelectorAll(".equalizer") ]
            .forEach((eq) => {
                const wrap = eq.closest(".eq-wrap");
                wrap.classList.add("eq-wrap_animating");
                eq.classList.toggle("equalizer_paused", this._isTrackPaused);
            });
    }

    _clearWrap(wrap) {
        wrap.classList.remove("eq-wrap_animating");

        const eq = wrap.querySelector(".equalizer");
        if (eq !== null) {
            eq.remove();
        }
    }

    _updateBroadcastEqualizer(isPlaying) {
        this._broadcastEqualizer.classList.toggle("live-eq_playing", isPlaying);
    }
}
