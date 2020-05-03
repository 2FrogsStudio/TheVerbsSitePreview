// noinspection JSUnusedGlobalSymbols
window.cards = {
    scaleMultiplier: 0.08,
    elementsMargin: 15,
    velocity: 0.3,
    extremeVerticalPosition: window.screen.availHeight,
    extremeHorizontalPosition: window.screen.availWidth,

    init: (firstRender, allowedSwipes) => {
        const cardsBlock = document.getElementById('stacked-cards-block');
        if (!cards.tryInitCards(cardsBlock)) {
            return;
        }
        cards.initOverlays(cardsBlock);
        cards.moveOverlaysToBack();
        cards.initExtremePositions();

        const lastCardIdChanged = !cards.prevLastCardId || (cards.lastCard && cards.prevLastCardId !== cards.lastCard?.id);
        if (lastCardIdChanged) {
            cards.transformUi(0, cards.topExtremePosition.posX, cards.topExtremePosition.posY, 0, false, cards.lastCard, true);
            cards.prevLastCardId = cards.lastCard?.id;
        }

        cards.resetCards();

        cards.allowTouch = true;
        cards.allowedSwipes = allowedSwipes;

        if (firstRender) {
            cards.initEvents(cardsBlock);
        }
    },

    tryInitCards: (cardsBlock) => {
        cards.stackedCards = cardsBlock.querySelector('.stackedcards-container');
        cards.firstCard = cards.stackedCards.children[0];
        if (!cards.firstCard) {
            return false;
        }
        cards.lastCard = cards.stackedCards.children[cards.stackedCards.children.length - 1];

        //todo: should it be in blazor?
        cards.stackedCards.style.marginBottom = cards.elementsMargin * (cards.stackedCards.childElementCount - 1) + 'px';
        return true;
    },

    initOverlays: (cardsBlock) => {
        cards.overlays = cardsBlock.querySelector('.stackedcards-overlays');
        cards.leftOverlay = cards.overlays.querySelector('.left');
        cards.rightOverlay = cards.overlays.querySelector('.right');
        cards.topOverlay = cards.overlays.querySelector('.top');
    },

    initExtremePositions: () => {
        let createExtremePosition = (name, posX, posY, overlay) => {
            let cardSwipe = Object.create(null);

            cardSwipe.name = name;
            cardSwipe.posX = posX;
            cardSwipe.posY = posY;
            cardSwipe.overlay = overlay;

            return cardSwipe;
        };

        cards.leftExtremePosition = createExtremePosition('Left', -cards.extremeVerticalPosition, 0, cards.leftOverlay);
        cards.rightExtremePosition = createExtremePosition('Right', cards.extremeVerticalPosition, 0, cards.rightOverlay);
        cards.topExtremePosition = createExtremePosition('Top', 0, -cards.extremeVerticalPosition, cards.topOverlay);
    },

    initEvents: (cardsBlock) => {
        let topOpacity;
        let rightOpacity;
        let leftOpacity;
        let startTime;
        let startX;
        let startY;
        let currentY;
        let currentX;
        let translateX;
        let translateY;
        let touchingElement = false;

        let setOverlayOpacity = () => {
            topOpacity = 0;
            rightOpacity = 0;
            leftOpacity = 0;

            const YOpacity = Math.abs(
                (((translateY + (cardsBlock.offsetHeight / 4)) /
                    (cardsBlock.offsetHeight / 5))));
            const XOpacity = Math.abs(
                translateX / (cardsBlock.offsetWidth / 2));
            let avgOpacity = Math.min((YOpacity + XOpacity) / 2, 1);

            if (avgOpacity === 0) {
                return;
            }

            if (translateY < -(cardsBlock.offsetHeight / 4) &&
                translateX > ((cards.stackedCards.offsetWidth / 2) * -1) &&
                translateX < ((cards.stackedCards.offsetWidth / 2))) {
                topOpacity = avgOpacity;
                return;
            }

            if (translateX > 0) {
                rightOpacity = avgOpacity;
                return;
            }

            leftOpacity = avgOpacity;
        }
        let gestureStart = (evt) => {
            if (!cards.allowTouch) {
                return;
            }
            touchingElement = true;
            cards.moveOverlaysToFront();
            startTime = new Date().getTime();

            currentX = startX = evt.changedTouches[0].clientX;
            currentY = startY = evt.changedTouches[0].clientY;
        };
        let gestureMove = (evt) => {
            if (!touchingElement || !cards.allowTouch) {
                return;
            }
            cards.moveOverlaysToFront();
            evt.preventDefault();

            currentX = evt.changedTouches[0].pageX;
            currentY = evt.changedTouches[0].pageY;

            translateX = currentX - startX;
            translateY = currentY - startY;

            setOverlayOpacity();

            cards.transformUi(1, translateX, translateY, 1, true, cards.firstCard,
                true);
            cards.transformUi(1, translateX, translateY, topOpacity, true,
                cards.topOverlay, true);
            cards.transformUi(1, translateX, translateY, leftOpacity, true,
                cards.leftOverlay, true);
            cards.transformUi(1, translateX, translateY, rightOpacity, true,
                cards.rightOverlay, true);
        }
        let gestureEnd = () => {
            cards.moveOverlaysToBack();
            if (!touchingElement || !cards.allowTouch) {
                return;
            }

            touchingElement = false;
            const timeTaken = new Date().getTime() - startTime;
            translateX = currentX - startX;
            translateY = currentY - startY;
            setOverlayOpacity();

            let backToMiddle = () => {
                cards.moveOverlaysToBack();
                cards.transformUi(1, 0, 0, 1, true, cards.firstCard);
            };

            if (cards.allowedSwipes.includes('Top') &&
                (translateY < ((cardsBlock.offsetHeight / 3) * -1) && translateX > ((cards.stackedCards.offsetWidth / 2) * -1) && translateX <
                    (cards.stackedCards.offsetWidth / 2))) {  //is Top?
                if (translateY < ((cardsBlock.offsetHeight / 3) * -1) ||
                    (Math.abs(translateY) / timeTaken > cards.velocity)) {
                    cards.swipeCard(cards.topExtremePosition);
                } else {
                    backToMiddle();
                }
            } else {
                if (translateX < 0) {
                    if (cards.allowedSwipes.includes('Left') &&
                        (translateX < ((cards.stackedCards.offsetWidth / 2) * -1) || (Math.abs(translateX) / timeTaken > cards.velocity))) {
                        cards.swipeCard(cards.leftExtremePosition);
                    } else {
                        backToMiddle();
                    }
                } else if (translateX > 0) {
                    if (cards.allowedSwipes.includes('Right') &&
                        (translateX > (cards.stackedCards.offsetWidth / 2) && (Math.abs(translateX) / timeTaken > cards.velocity))) {
                        cards.swipeCard(cards.rightExtremePosition);
                    } else {
                        backToMiddle();
                    }
                }
            }
        };

        let buttonLeft = document.querySelector('.left-action');
        let buttonTop = document.querySelector('.top-action');
        let buttonRight = document.querySelector('.right-action');

        cardsBlock.addEventListener('touchstart', gestureStart, false);
        cardsBlock.addEventListener('touchmove', gestureMove, false);
        cardsBlock.addEventListener('touchend', gestureEnd, false);
        buttonLeft.addEventListener('click', _ => cards.onActionByDirection('Left'), false);
        buttonTop.addEventListener('click', _ => cards.onActionByDirection('Top'), false);
        buttonRight.addEventListener('click', _ => cards.onActionByDirection('Right'), false);
    },

    onActionByDirection: (directionName, force) => {
        if (!cards.allowedSwipes.includes(directionName) && !force) {
            return;
        }
        cards.allowTouch = false;
        cards.allowedSwipes = [];

        let extremePosition;
        switch (directionName) {
            case 'Top':
                extremePosition = cards.topExtremePosition;
                break;
            case 'Left':
                extremePosition = cards.leftExtremePosition;
                break;
            case 'Right':
                extremePosition = cards.rightExtremePosition;
                break;
            default:
                throw Error('Bad extremePosition!');
        }

        cards.moveOverlaysToFront();
        cards.transformUi(1, 0, 0, 0.8, false, extremePosition.overlay, true);
        setTimeout(() => cards.swipeCard(extremePosition), 500);
    },

    swipeCard: (extremePosition) => {
        cards.allowTouch = false;
        cards.allowedSwipes = [];

        switch (extremePosition.name) {
            case 'Top':
                cards.swipeToExtremePosition(extremePosition, false);
                break;
            case 'Left':
            case 'Right':
                cards.swipeToExtremePosition(extremePosition, true);
                break;
        }

        setTimeout(async () => {
            cards.transformUi(1, 0, 0, 0, true, cards.firstCard, true);
            await userScope.swipe(cards.firstCard.id, extremePosition.name);
        }, 300);
    },

    moveOverlaysToBack: () => {
        for (let i = 0; i < cards.overlays.children.length; i++) {
            cards.transformUi(1, 0, 0, 0, false, cards.overlays.children[i], false);
            setTimeout(() => {
                cards.overlays.children[i].style.zIndex = '0';
            }, 300);
        }
    },

    moveOverlaysToFront: () => {
        for (let i = 0; i < cards.overlays.children.length; i++) {
            cards.overlays.children[i].style.zIndex = '8';
        }
    },

    swipeToExtremePosition: (extremePosition, isSwipe) => {
        cards.transformUi(1, extremePosition.posX, extremePosition.posY, 0, true, cards.firstCard);
        cards.transformUi(1, extremePosition.posX, extremePosition.posY, 0, true, extremePosition.overlay);
        if (isSwipe) {
            cards.changeBackground();
            cards.resetCards(1);
        }
    },

    changeBackground: (number) => {
        let currentColorNumber = -1;
        document.body.classList.forEach(function(value) {
            if (value.startsWith('background-')) {
                currentColorNumber = Number(value.split('-')[1]);
                document.body.classList.remove(value);
            }
        });
        number = number || (currentColorNumber <= 6) ?
            currentColorNumber + 1 :
            0;
        document.body.classList.add('background-' + number);
    },

    resetCards: (skip) => {
        skip = skip || 0;
        const cardsCount = cards.stackedCards.childElementCount;
        for (let i = cardsCount - 1; i >= skip; i--) {
            let card = cards.stackedCards.children[i];
            const n = i - skip;
            const elTrans = (cards.elementsMargin * n) * -1;
            const elScale = 1 - (cards.scaleMultiplier * n);
            const elOpacity = 1 - ((1 / cardsCount) * n);
            const zIndex = 7 - i;
            card.style.zIndex = zIndex.toString();
            const noTransition = skip === 0 && (cardsCount === 1 || i !== cardsCount - 1);
            if (!noTransition) {
                setTimeout(() => cards.transformUi(elScale, 0, elTrans, elOpacity, false, card, noTransition), 1);
            } else {
                cards.transformUi(elScale, 0, elTrans, elOpacity, false, card, noTransition);
            }
        }
    },

    //Add translate X and Y to active card for each frame.
    transformUi: (scale, moveX, moveY, opacity, doRotate, element, noTransition) => {
        const transition = !noTransition || false;
        if (transition) {
            element.classList.remove('no-transition');
        } else {
            element.classList.add('no-transition');
        }
        requestAnimationFrame(function() {
            // Function to generate rotate value 
            /**
             * @return {number}
             */
            function RotateRegulator(value) {
                if (value / 10 > 15) {
                    return 15;
                } else if (value / 10 < -15) {
                    return -15;
                }
                return value / 10;
            }

            const rotateElement = doRotate ? RotateRegulator(moveX) : 0;
            element.style.transform = 'scale(' + scale + ') translateX(' +
                moveX + 'px) translateY(' + moveY +
                'px) translateZ(0px) rotate(' + rotateElement + 'deg)';
            element.style.opacity = opacity;
        });
    },
};