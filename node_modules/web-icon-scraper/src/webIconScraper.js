const http = require('http');
const https = require('https');
const cheerio = require('cheerio');
const sortBySize = require('./sortBySize');
const urlMod = require('url');
const domainExtList = require('./domainExtList');

// Get the max icon size data from meta
const getIconMaxSize = (sizes) => {
  if (!sizes) console.warn('getIconMaxSize: sizes were missing');
  const sIndex = sizes ? sizes.lastIndexOf('x') + 1 : undefined;
  return (sizes && sIndex) ? Number(sizes.substring(sIndex, sizes.length)) : undefined;
}

// reducese slashes to a max of 2.
const reduceSlashes = (url) => {
  return url.replace(/(\/)(?=\/\1)/g, "");
}

// remove . from start of path
const removeRelativePath = (url) => {
  if (url.indexOf('.') === 0) return url.replace('.', '');
  return url;
}

// include / at start of path
const includeRelativeSlash = (url) => {
  if (url.indexOf('/') <= -1) return '/' + url;
  return url;
}

// TODO tidy this function.
const getCleanLink = ({ link, host, reqProtocol }) => {
  if (!link) console.warn('getCleanLink: link was missing');
  const indexOfHttp = link.indexOf('http');
  const indexOfWww = link.indexOf('www');
  // if link found starts with a relative path ./
  link = removeRelativePath(link);
  // if link contains no /
  link = includeRelativeSlash(link);
  // e.g. htts://www.a.com/favicon.ico
  if (indexOfHttp === 0 || indexOfWww === 0) return link;
  // e.g. example.www.a.com/favicon.ico
  if (indexOfWww > 0 && indexOfHttp === -1) {
    const removeChars = link.substring(0, indexOfWww);
    link = link.replace(removeChars, '');
    return reduceSlashes(`${reqProtocol}://${link}`);
  }
  // e.g. example.https://a.com/favicon.ico
  if (indexOfHttp > 0) {
    const removeChars = link.substring(0, indexOfHttp);
    return link.replace(removeChars, '');
  }
  // e.g. static.com/favicon.ico
  const linkToArray = link.toUpperCase().split(/(?=[\/.])/g);
  const matchFound = linkToArray.some(r => domainExtList.indexOf(r) >= 0);
  if (matchFound) {
    return reduceSlashes(`${reqProtocol}://${link}`);
  }
  if (host) {
    return reduceSlashes(reqProtocol + '://' + host + link);
  }
  return undefined;
}

// Returns object { type: String size: String link: String }
const getIconData = ({ type = undefined, data, host, reqProtocol }) => {
  if (!data) console.warn('getIconData: data was missing');
  const size = getIconMaxSize(data.attr('sizes'));
  const link = getCleanLink({ link: data.attr('href'), host, reqProtocol });
  return { type, size, link };
};

// Returns object array [{ type: String size: String link: String }]
const getIconDataOrdered = ({ sort = 'asc', icons }) => {
  if (!icons) console.warn('getIconDataOrdered: icons were missing');
  if (sort === 'asc') { return icons.sort(sortBySize.ascending); }
  return icons.sort(sortBySize.descending);
};

// Remove duplicate data
const removeDuplicateData = (icons) => {
  const uniqueIcons = new Set(icons);
  icons = [...uniqueIcons];
  return icons;
}

// Check meta for icons
const containsIcon = (rel) => {
  const iconTypes = [
    'icon', 'msapplication - TileImage',
    'image/vnd.microsoft.icon', 'image/x-icon',
    'shortcut icon'
  ];
  return (iconTypes.includes(rel));
}

// Check meta for apple icons
const containsAppleIcon = (rel) => {
  const appleIconTypes = [
    'apple-touch-icon-precomposed',
    'apple-touch-icon',
    'apple'
  ];
  return (appleIconTypes.includes(rel));
}

// Resolve icons that can be found
const checkIconsStatus = async (reqTypes, reqTypeIndex, icons) => {
  let iconsResolved = [];
  for (const icon of icons) {
    const result = await checkIconStatus(reqTypes, reqTypeIndex, icon);
    if (result.statusCode == 200) {
      iconsResolved.push(result.icon);
    }
  }
  icons = iconsResolved;
  return icons;
}

// Check if icon can be found
const checkIconStatus = (reqTypes, reqTypeIndex, icon) => {
  return new Promise(function (resolve, reject) {
    reqTypes[reqTypeIndex].get(icon.link, (res) => {
      resolve({
        statusCode: res.statusCode,
        icon
      });
    });
  });
}

const recursiveIconRequestHandler = ({ url, sort, limit, checkStatus, followRedirectsCount }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      iconRequestHandler({ url, sort, limit, checkStatus, followRedirectsCount }).then((res) => {
        if (res.redirect) {
          return resolve(recursiveIconRequestHandler({ url: res.redirect, sort, limit, checkStatus, followRedirectsCount }))
        } else {
          return resolve(res.icons);
        }
      })
    }, 0);
  })
}

// Core logic to return icons
let followRedirectAttempts = 0;
const iconRequestHandler = async ({ url, sort, limit, checkStatus, followRedirectsCount }) => {
  return new Promise(function (resolve, reject) {
    const _url = urlMod.parse(url, true);
    const host = _url.host;
    const protocol = _url.protocol;
    const reqTypes = [http, https];
    const reqTypeIndex = (protocol.indexOf('https') <= -1) ? 0 : 1;
    const reqProtocol = (protocol.indexOf('https') <= -1) ? 'http' : 'https';
    reqTypes[reqTypeIndex].get(url, (res) => {
      let data;
      res.on('data', (d) => {
        data += d;
      });
      res.on('end', () => {
        // Redirect Strategy
        if (res.headers.location && followRedirectAttempts < followRedirectsCount) {
          followRedirectAttempts++;
          resolve({ icons: [], redirect: `${res.headers.location}` })
        } else {
          // Resolve Icons Strategy
          let icons = [];
          if (data) {
            data = data.toString();
            const $ = cheerio.load(data);
            $('link').each(function () {
              if (icons.length < limit) {
                const rel = $(this).attr('rel');
                if (containsIcon(rel)) {
                  icons.push(getIconData({
                    type: 'favicon',
                    data: $(this),
                    host,
                    reqProtocol
                  }));
                }
                if (containsAppleIcon(rel)) {
                  icons.push(getIconData({
                    type: 'apple-touch-icon',
                    data: $(this),
                    host,
                    reqProtocol
                  }));
                }
              }
            });
            if (sort === 'asc') { icons = getIconDataOrdered({ sort, icons }) }
            else { icons = getIconDataOrdered({ sort, icons }) }
          }
          icons = removeDuplicateData(icons);
          if (icons.length === 0) {
            icons = [
              {
                type: 'favicon',
                size: undefined,
                link: reduceSlashes(`${reqProtocol}://${host}/favicon.ico`)
              },
            ]
          }
          if (checkStatus) {
            return checkIconsStatus(reqTypes, reqTypeIndex, icons).then((icons) => {
              resolve({ icons });
            });
          } else {
            resolve({ icons });
          }
        }
      });
    }).on('error', (e) => {
      reject({
        err: 'web-icon-scraper: could not resolve data from url ',
        info: e,
        icons: []
      });
    });
  });
}

module.exports = {
  getIconRequest: ({ url, sort = 'asc', limit = 10, checkStatus = false, followRedirectsCount = 0 }) => {
    return new Promise(function (resolve, reject) {
      recursiveIconRequestHandler({ url, sort, limit, checkStatus, followRedirectsCount }).then((icons) => {
        resolve({ icons });
      }, (e) => {
        reject({
          err: 'web-icon-scraper: could not resolve data from url ',
          info: e,
          icons: []
        });
      });
    }, (e) => {
      reject({
        err: 'web-icon-scraper: could not resolve data from url ',
        info: e,
        icons: []
      });
    });
  }
};
