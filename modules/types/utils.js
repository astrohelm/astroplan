'use strict';

const { isFirstLetter } = require('astropack').string.case;
const titlify = s => s.charAt(0).toUpperCase() + s.slice(1);
const SPECIAL = /[ `!@#%^&*()+\-=[\]{};':"\\|,.<>/?~]/;
const nameFix = name => name.replace(SPECIAL, '');

// prettier-ignore
const brackets = (sample, skip) => {
  if (skip && isFirstLetter(sample) && !SPECIAL.test(sample)) return sample;
  var left, right = left = sample.includes(`'`) ? '"' : `'`;
  if (sample.includes(left)) left = '[`', right = '`]';
  return left + sample + right;
};

const jsdoc = (meta, spacing = '') => {
  var result = spacing + '/**\n';
  for (var key in meta) {
    if (key[0] !== '@') continue;
    result += spacing + ` * ${key} ${meta[key]}\n`;
  }
  return result + spacing + ' */\n';
};

module.exports = { nameFix, brackets, jsdoc, titlify };
