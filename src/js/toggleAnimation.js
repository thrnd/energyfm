/**
 * туглит элемент из состояния display: none (через css-классы)
 * и затем (через тик requestAnimationFrame) вешает класс анимации, и наоборот:
 * снимает класс анимации и после скрытия элемента, по transitionend,
 * скрывает в display: none (снимая класс видимости)
 * при первом вызове, вешает на элемент обработчик события transitionend
 * для обратного скрытия в display: none
 * 
 * @param {HTMLElement} el - DOM-элемент, который нужно проанимировать
 * @param {Boolean} show - состояние, в которое должен быть установлен элемент
 * @param {String} visibleClass - класс видимости, переключает элемент из display: none
 * @param {String} animationClass - класс запуска анимации
 * @param {Function} [onStateToggle] - функция будет вызываться на каждом этапе анимации (появление/скрытие)
 * @param {Function} [onBeforeShowing] - функция будет вызываться только перед показом блока
 */
 function toggleAnimation({
    show,
    el,
    visibleClass,
    animationClass,
    onStateToggle,
    onBeforeShowing,
}) {
    toggleAnimation.initedElements = toggleAnimation.initedElements || new WeakSet();

    if ( !toggleAnimation.initedElements.has(el) ) {
        el.addEventListener("transitionend", (event) => {
            if ( !el.classList.contains(animationClass) ) {
                el.classList.remove(visibleClass);
            }
        });
        toggleAnimation.initedElements.add(el);
    }

    requestAnimationFrame((now) => {
        el.classList.toggle(show ? visibleClass : animationClass, show);

        if (typeof onStateToggle === "function") {
            onStateToggle(show);
        }

        if (!show) return;

        requestAnimationFrame((now) => {
            el.classList.add(animationClass);

            if (typeof onBeforeShowing === "function") {
                onBeforeShowing();
            }
        });
    });
}