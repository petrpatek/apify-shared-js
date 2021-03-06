/*!
 * This module contains various client-side utility and helper functions.
 *
 * Author: Jan Curn (jan@apify.com)
 * Copyright(c) 2016 Apify. All rights reserved.
 *
 */

const slugg = require('slugg');
const consts = require('./consts');
require('./polyfills');

/**
 * Returns true if object equals null or undefined, otherwise returns false.
 * @param obj
 * @returns {boolean}
 */
export const isNullOrUndefined = function isNullOrUndefined(obj) {
    return obj === undefined || obj === null;
};

/**
 * Converts Date object to ISO string.
 * @param date
 * @param middleT
 * @returns {*}
 */
export const dateToString = function dateToString(date, middleT) {
    if (!(date instanceof Date)) { return ''; }
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // January is 0, February is 1, and so on.
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const millis = date.getMilliseconds();

    return `${
        year}-${
        month < 10 ? `0${month}` : month}-${
        day < 10 ? `0${day}` : day
    }${middleT ? 'T' : ' '
    }${hours < 10 ? `0${hours}` : hours}:${
        minutes < 10 ? `0${minutes}` : minutes}:${
        seconds < 10 ? `0${seconds}` : seconds}.${
        millis < 10 ? `00${millis}` : (millis < 100 ? `0${millis}` : millis)}`;
};

/**
 * Ensures a string is shorter than a specified number of character, and truncates it if not,
 * appending a specific suffix to it.
 * @param str
 * @param maxLength
 * @param suffix Suffix to be appended to truncated string. If null or undefined, it defaults to "...[truncated]".
 */
export const truncate = function (str, maxLength, suffix) {
    maxLength |= 0;
    if (typeof (suffix) !== 'string') { suffix = '...[truncated]'; }
    // TODO: we should just ignore rest of the suffix...
    if (suffix.length > maxLength) { throw new Error('suffix string cannot be longer than maxLength'); }
    if (typeof (str) === 'string' && str.length > maxLength) { str = str.substr(0, maxLength - suffix.length) + suffix; }
    return str;
};

/**
 * Gets ordinal suffix for a number (e.g. "nd" for 2).
 */
export const getOrdinalSuffix = function (num) {
    // code from https://ecommerce.shopify.com/c/ecommerce-design/t/ordinal-number-in-javascript-1st-2nd-3rd-4th-29259
    const s = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
};

export const parseUrl = (str) => {
    if (typeof (str) !== 'string') { return {}; }
    const o = {
        strictMode: false,
        key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'],
        q: {
            name: 'queryKey',
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g,
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
        },
    };
    const m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str);
    const uri = {};
    let i = o.key.length;

    while (i--) uri[o.key[i]] = m[i] || '';

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, ($0, $1, $2) => {
        if ($1) uri[o.q.name][$1] = $2;
    });

    // our extension - parse fragment using a query string format (i.e. "#key1=val1&key2=val2")
    // this format is used by many websites
    uri.fragmentKey = {};
    if (uri.fragment) {
        uri.fragment.replace(o.q.parser, ($0, $1, $2) => {
            if ($1) uri.fragmentKey[$1] = $2;
        });
    }

    return uri;
};

export const normalizeUrl = (url, keepFragment) => {
    if (typeof url !== 'string' || !url.length) {
        return null;
    }

    const urlObj = parseUrl(url.trim());
    if (!urlObj.protocol || !urlObj.host) {
        return null;
    }

    const path = urlObj.path.replace(/\/$/, '');
    const params = (urlObj.query
        ? urlObj.query
            .split('&')
            .filter((param) => {
                return !/^utm_/.test(param);
            })
            .sort()
        : []
    );

    return `${urlObj.protocol.trim().toLowerCase()
    }://${
        urlObj.host.trim().toLowerCase()
    }${path.trim()
    }${params.length ? `?${params.join('&').trim()}` : ''
    }${keepFragment && urlObj.fragment ? `#${urlObj.fragment.trim()}` : ''}`;
};

// Helper function for markdown rendered marked
// Renders links outside apify.com in readme with rel="nofollow" and target="_blank" attributes
export const markedSetNofollowLinks = (href, title, text) => {
    let urlParsed;
    try {
        urlParsed = URL.parse(href);
    } catch (e) {
        // Probably invalid url, go on
    }
    const isApifyLink = (urlParsed && /\.apify\.com$/i.test(urlParsed.hostname));
    return (isApifyLink) ? `<a href="${href}">${title || text}</a>` : `<a rel="nofollow" target="_blank" href="${href}">${title || text}</a>`;
};

// Helper function for markdown rendered marked
// Decreases level of all headings by one, h1 -> h2
export const markedDecreaseHeadsLevel = (text, level) => {
    level += 1;
    return `<h${level}>${text}</h${level}>`;
};

/**
 * Creates a "nice path" for public act consisting of 5 chars of it's _id
 * word "api" and slug version of either public.domain and customId.
 */
export const getPublicCrawlerNicePath = (actId, customId, domain) => {
    const parts = [actId.substr(0, consts.SHORT_CRAWLER_ID_LENGTH), 'api', slugg(domain || customId)];

    return parts.join('-');
};

/**
 * Converts integer version number previously generated by buildNumberToInt() or versionNumberToInt()
 * to string in a form 'MAJOR.MINOR' or 'MAJOR.MINOR.BUILD' in case build number is non-zero.
 * @param int
 * @return {string}
 */
export const buildOrVersionNumberIntToStr = (int) => {
    if (typeof (int) !== 'number' || !(int >= 0)) return null;

    const major = Math.floor(int / consts.VERSION_INT_MAJOR_BASE);
    const remainder = int % consts.VERSION_INT_MAJOR_BASE;
    const minor = Math.floor(remainder / consts.VERSION_INT_MINOR_BASE);
    const build = remainder % consts.VERSION_INT_MINOR_BASE;

    let str = `${major}.${minor}`;
    if (build > 0) str += `.${build}`;
    return str;
};
