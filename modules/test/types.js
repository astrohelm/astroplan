'use strict';

const { object: astropack } = require('astropack');
const { unionHandler, instanceOfArray } = require('./utils');

const WRONG_TYPE = 'Type misconfiguration, expected type: ';
const nullable = {
  test(sample) {
    if (sample === null) return null;
    return WRONG_TYPE + this.type;
  },
};

const NOT_AT_ENUM = `Enum doesn't contain this value: `;
const enumerable = {
  test(sample) {
    if (this.enum.includes(sample)) return null;
    return `${NOT_AT_ENUM + sample}, enum: ${this.enum.join(', ')}`;
  },
};

const EMPTY_ERROR = 'Empty data received';
const TUPLE_ERROR = 'Received items length does not match expected length';
const INCOR_ERROR = 'Data type misconfiguration, expected: ';
const iterable = {
  test(sample, path, isPartial) {
    const items = this.items;
    if (!instanceOfArray(sample)) return [INCOR_ERROR + this.type];
    const entries = [...sample];
    if (!entries.length && this.required) return [EMPTY_ERROR];
    if (this.isTuple && entries.length !== items.length) return [TUPLE_ERROR];
    return entries.reduce((acc, sample, i) => {
      const { test } = this.isTuple ? items[i] : items[0];
      const result = test(sample, `${path}[${i}]`, isPartial);
      result.length && acc.push(...result);
      return acc;
    }, []);
  },
};

const EXOTC_ERROR = 'Exotic properties: ';
const RELIC_ERROR = 'Missing properties: ';
const kPull = Symbol('Pull property');
const struct = {
  test(sample, path, isPartial) {
    if (!sample || typeof sample !== 'object') return [INCOR_ERROR + this.type];
    const remain = this.requires.reduce((acc, prop) => acc.set(prop), new Map());
    const errors = [];
    astropack.entries(sample).forEach(([prop, item]) => {
      const [key, prototype] = this[kPull](prop);
      if (!key) return void (this.isStrict && errors.push(EXOTC_ERROR));
      const result = prototype.test(item, `${path}.${prop}`, isPartial);
      remain.delete(key), result.length && errors.push(...result);
    });
    !isPartial && remain.size && errors.push(RELIC_ERROR + [...remain.keys()].join(', '));
    return errors;
  },
  [kPull](prop) {
    const temp = this.properties.get(prop);
    if (temp) return [prop, temp];
    if (typeof prop !== 'string') prop = String(prop);
    for (var [pattern, value] of this.patterns.entries()) {
      if (prop.match(pattern)) return [pattern, value];
    }
    return [null, null];
  },
};

const union = {
  test(sample, path, isPartial) {
    const errors = [];
    const types = this.types;
    const handler = unionHandler(this.condition, types.length - 1);
    for (var i = 0; i < types.length; ++i) {
      var result = types[i].test(sample, path, isPartial);
      var [message, deepErrors] = handler(result, i);
      if (message === 'ok') return [];
      if (deepErrors && deepErrors.length > 0) errors.push(...deepErrors);
      if (message !== 'continue') return errors.push(message), errors;
    }
    return errors;
  },
};

const create = type => {
  const invalid = WRONG_TYPE + type;
  return { test: sample => (typeof sample === type ? null : invalid) };
};

module.exports = [
  ['boolean', create('boolean')],
  ['string', create('string')],
  ['number', create('number')],
  ['bigint', create('bigint')],
  ['enum', enumerable],
  ['array', iterable],
  ['tuple', iterable],
  ['set', iterable],
  ['null', nullable],
  ['object', struct],
  ['map', struct],
  ['union', union],
];
