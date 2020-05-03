const cardsUrl = '/data/phrasal-verbs.json';

const cacheNamePrefix = 'offline-cache-';
const cacheName = `${cacheNamePrefix}${self.assetsManifest.version}`;
const offlineAssetsInclude = [
  /\.html$/,
  /\.js$/,
  /\.json$/,
  /\.css$/,
  /\.woff$/,
  /\.png$/,
  /\.jpe?g$/,
  /\.gif$/,
  /\.ico$/,
  /\.svg$/];

const offlineAssetsExclude = [
  /^service-worker\.js$/,
  /^js\/service-worker-core.js$/,
  /^https:\/\/.*$/,
];

const forceCacheUrls = [
  'version.json',
  'https://images.unsplash.com/photo-1520695287272-b7f8af46d367?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80',
];

const onInstall = async () => {
  console.info('Service worker: Install');
  let assertUrls;
  let cardImageUrl;

  [assertUrls, cardImageUrl] = await Promise.all(
      [getAssetUrls(), getCardImageUrls()]);

  let urlsToCache = assertUrls.
      concat(cardImageUrl).
      concat(forceCacheUrls).
      filter(
          (value, index, self) => value !== '' && self.indexOf(value) ===
              index);

  await caches.open(cacheName).then(cache => cache.addAll(urlsToCache));
};

const onActivate = async () => {
  console.info('Service worker: Activate');

  // Delete unused caches
  const cacheKeys = await caches.keys();
  await Promise.all(cacheKeys.filter(
      key => key.startsWith(cacheNamePrefix) && key !== cacheName).
      map(key => caches.delete(key)));
};

const onFetch = async event => {
  let cachedResponse = null;
  if (event.request.method === 'GET') {
    // For all navigation requests, try to serve index.html from cache
    // If you need some URLs to be server-rendered, edit the following check to exclude those URLs
    const shouldServeIndexHtml = event.request.mode === 'navigate';
    const request = shouldServeIndexHtml ? 'index.html' : event.request;

    //todo: investigate ignoreVary parameter
    cachedResponse = await caches.match(request, {ignoreVary: true});
  }

  return cachedResponse || fetch(event.request);
};

const onMessage = async event => {
  if (event.data.action === 'skipWaiting') {
    await self.skipWaiting();
  }
};

const getCardImageUrls = async () => {
  const cardsFile = await fetch(cardsUrl);
  let cardsJson = await cardsFile.json();
  return Object.keys(cardsJson).
      map(key => cardsJson[key].image);
};

const getAssetUrls = async () => {
  // Fetch and cache all matching items from the assets manifest
  return self.assetsManifest.assets.
      filter(asset => offlineAssetsInclude.some(
          pattern => pattern.test(asset.url))).
      filter(asset => !offlineAssetsExclude.some(
          pattern => pattern.test(asset.url))).
      map(asset => asset.url);
};