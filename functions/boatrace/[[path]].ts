export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const targetPath = url.pathname.replace(/^\/boatrace/, '') || '/';
  const targetUrl =
    'https://boatrace.giovgames.com' + targetPath + url.search;

  return fetch(new Request(targetUrl, context.request));
};
