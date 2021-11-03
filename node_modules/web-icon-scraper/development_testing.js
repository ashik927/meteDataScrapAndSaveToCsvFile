const webIconScraper = require('./index');

webIconScraper({
  url: 'https://firebase.com',
  sort: 'des',
  limit: 1,
  checkStatus: true,
  followRedirectsCount: 5
}).then(result => {
  console.log('res', JSON.stringify(result));
}, err => {
  console.log('err', err);
});

