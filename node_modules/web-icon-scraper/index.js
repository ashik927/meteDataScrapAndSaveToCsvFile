const webIconScraper = require('./src/webIconScraper');
module.exports = async ({ url, sort = 'asc', limit = 10, checkStatus = false, followRedirectsCount = 0 }) => {
  return await webIconScraper.getIconRequest({ url, sort, limit, checkStatus, followRedirectsCount });
};