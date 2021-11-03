const webIconScraper = require('./../index');

const linkTestData = [
  { url: "https://reactjs.org/", expected: "https://reactjs.org/favicon.ico" },
  { url: "https://www.sony.com.au/", expected: "https://www.sony.com.au/assets/images/Favicon_144x144.png" },
  { url: "https://www.bbc.co.uk/", expected: "https://www.bbc.co.uk/favicon.ico" },
  { url: "https://www.apple.com.au/", expected: "https://www.apple.com.au/favicon.ico" },
  { url: "https://github.com", expected: "https://github.githubassets.com/favicon.ico" },
  { url: "https://auspost.com.au/", expected: "https://auspost.com.au/content/dam/global/favicons/apple-touch-icon-144x144.png" },
  { url: "https://www.ibm.com/au-en", expected: "https://www.ibm.com/favicon.ico" },
  { url: "https://www.bose.com.au/en_au/index.html", expected: "https://static.bose.com/etc/designs/bose/consumer-products-2016/favicon.ico" },
  { url: "https://momentjs.com", expected: "https://momentjs.com/static/img/moment-favicon.png" },
  { url: "https://slack.com/intl/en-au/", expected: "https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png" },
  { url: "https://www.ministryofsound.com/", expected: "https://www.ministryofsound.com/media/3982/mos-favicon.png?width=32&height=32" },
  { url: "https://brave.com/", expected: "https://brave.com/wp-content/uploads/2018/02/cropped-brave_appicon_release-32x32.png" },
  { url: "https://swedishhousemafia.com/", expected: "https://swedishhousemafia.com/gfx/meta/favicon.ico?1615" },
  { url: "https://firebase.com", expected: "https://www.gstatic.com/devrel-devsite/v2355ed73ae6b243a36832e70498f2cd0b3f352ff30481ebdfdc56826b566bf8a/firebase/images/favicon.png" }
];

jest.setTimeout(30000);

test('Ensure links are correct', async () => {
  for (var i = 0; i < linkTestData.length; i++) {
    const result = await webIconScraper({ limit: 1, url: linkTestData[i].url, sort: 'asc', checkStatus: false });
    if (result.icons[0]) {
      expect(result.icons[0].link).toBe(linkTestData[i].expected);
    }
  }
});


