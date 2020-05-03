window.userScope = {
    _dotnetHelper: Object,

    init: dotnetHelper => {
        userScope._dotnetHelper = dotnetHelper;
    },

    swipe: async (key, direction) => {
        let localPath = window.location.pathname;

        let timeLogLabel = `Swipe(${key}, ${direction}, ${localPath})`;
        console.time(timeLogLabel);

        await userScope._dotnetHelper.invokeMethodAsync('Swipe', key, direction, localPath);

        console.timeEnd(timeLogLabel);
    },
}