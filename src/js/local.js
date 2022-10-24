;[ ...document.querySelectorAll(".city-list__btn-inner") ].forEach((node) => {
    const text = node.textContent.trim();
    let letters = "";

    text
        .split("")
        .forEach((letter) => {
            const span = document.createElement("span");
            span.className = "city-list__city-letter";
            span.textContent = letter;

            letters += span.outerHTML;
        });

    node.innerHTML = letters + " ";
});

document.querySelector(".footer-form__submit")
    .addEventListener("click", localForm);
[...document.querySelectorAll(".form button[type='submit']")]
    .forEach(btn => {
        btn.addEventListener("click", localForm);
    })

function localForm(event) {
    event.preventDefault();

    const { form } = event.target;
    const formWrap = form.closest(".form");
    const isError = event.ctrlKey === true;
    const inner = formWrap.querySelector(".form__inner");
    const iconUSETag = formWrap.querySelector(".form__icon use");
    const response = formWrap.querySelector(".form__response");
    const title = response.querySelector(".form__title");
    const desc = response.querySelector(".form__desc");
    const btn = response.querySelector(".form__response-btn");

    iconUSETag.setAttribute("xlink:href", `${ENERGYFM.pathToSVGSprite}#${isError ? "error" : "success"}`);
    title.textContent = isError ? "Ошибка" : "Заявка отправлена";
    desc.textContent = isError ? "Не удалось отправить заявку" : "Мы свяжемся с вами в ближайшее время";
    btn.textContent = isError ? "Попробовать еще раз" : "Ок";
    btn.type = isError ? "submit" : "button";
    response.classList.add(isError ? "form__response_t_error" : "form__response_t_success");
    response.classList.add("form__response_visible");

    formWrap.style.width = `${formWrap.offsetWidth}px`;
    formWrap.style.height = `${formWrap.offsetHeight}px`;
    inner.style.display = "none";
    response.classList.add(isError ? "form__response_t_error" : "form__response_t_success");
    response.classList.add("form__response_visible");
}

document.addEventListener("click", (event) => {
    const playBtn = event.target.closest(".play-btn");

    if (playBtn === null) return;

    const isPlaying = playBtn.classList.contains("pause");

    playBtn.classList.toggle("play");

    if (isPlaying) {
        playBtn.classList.toggle("pause");
    }
    else {
        setTimeout(() => {
            playBtn.classList.toggle("pause");
        }, 1000);
    }
});

document.addEventListener("keydown", (event) => {
    if (event.code === "KeyL") {
        document.documentElement.classList.toggle("dark-theme");
    }

    if (event.code === "KeyP") {
        document.querySelector(".page-header")
            .classList.toggle("page-header_pinned");
    }

    if (event.code === "KeyV") {
        document.querySelector(".nrj-stories")
            ?.classList.toggle("nrj-stories_viewed");
    }
});

var MP = {
    ParseQueryString(url) {
        const page = window.location.pathname
            .replace("/", "")
            .replace(".html", "");

        return {
            an: page
        };
    }
}

var History = { Adapter() {} };

var SimplePoll = function() {};

if ( getArticleName() === "artists" ) {
    const fn = ENERGYFM.initializers[ENERGYFM.artistsPageAn];
    ENERGYFM.artistsPageAn = "artists";
    ENERGYFM.initializers[ENERGYFM.artistsPageAn] = fn; 
}
if ( getArticleName() === "news-article" ) {
    const fn = ENERGYFM.initializers[ENERGYFM.newsPageAn];
    ENERGYFM.newsPageAn = "news-article";
    ENERGYFM.initializers[ENERGYFM.newsPageAn] = fn; 
}
if ( getArticleName() === "album-page" ) {
    const fn = ENERGYFM.initializers[ENERGYFM.photoPageAn];
    ENERGYFM.photoPageAn = "album-page";
    ENERGYFM.initializers[ENERGYFM.photoPageAn] = fn; 
}
if ( getArticleName() === "actions" ) {
    const fn = ENERGYFM.initializers[ENERGYFM.actionPageAn];
    ENERGYFM.actionPageAn = "actions";
    ENERGYFM.initializers[ENERGYFM.actionPageAn] = fn; 
}
if ( getArticleName() === "podcasts" ) {
    const fn = ENERGYFM.initializers[ENERGYFM.podcastPageAn];
    ENERGYFM.podcastPageAn = "podcasts";
    ENERGYFM.initializers[ENERGYFM.podcastPageAn] = fn; 
}

class Share { constructor(){} }