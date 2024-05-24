'use strict';

module.exports = new Map();

const ENUM_WARN = 'Received incorrect enumerable';
const filter = el => typeof el === 'string' || typeof el === 'number';
exports.set('enum', function Enum(plan, { warn }) {
  const sample = plan.enum;
  this.kind = 'enum';
  this.enum = Array.isArray(sample) ? [...new Set(sample)].filter(filter) : [];
  this.enum.length !== sample?.length && warn({ cause: ENUM_WARN, plan, sample });
});

const DEFAULT_UNION_CONDITION = 'anyof';
exports.set('union', function Union({ types, condition }, { build }) {
  this.kind = 'union';
  this.condition = condition ?? DEFAULT_UNION_CONDITION;
  this.types = (Array.isArray(types) ? types : [types]).map(build);
});

exports.set('map', function Map(plan, tools) {
  ObjectLike.call(this, plan, tools);
});

exports.set('set', function Set(plan, tools) {
  ObjectLike.call(this, plan, tools);
});

exports.set('record', function Record(plan, tools) {
  ObjectLike.call(this, plan, tools);
});

exports.set('array', function Array(plan, tools) {
  ArrayLike.call(this, plan, tools);
});

exports.set('set', function Set(plan, tools) {
  ArrayLike.call(this, plan, tools);
});

exports.set('tuple', function Tuple(plan, tools) {
  ArrayLike.call(this, plan, tools);
});

exports.set('string', function String() {
  this.kind = 'scalar';
});

exports.set('number', function Number() {
  this.kind = 'scalar';
});

exports.set('bigint', function BigInt() {
  this.kind = 'scalar';
});

exports.set('boolean', function Boolean() {
  this.kind = 'scalar';
});

exports.set('null', function Null() {
  this.kind = 'null';
});

exports.set('any', function Any() {
  this.kind = 'any';
});

exports.set('unknown', function Unknown() {
  this.kind = 'unknown';
});

const LIST_WARN = 'Received invalid or empty list of items';
function ArrayLike(plan, { warn, build }) {
  const sample = plan.items;
  this.kind = 'struct';
  this.items = (Array.isArray(sample) ? sample : [sample]).map(build);
  !this.items.length && warn({ plan, cause: LIST_WARN, sample });
}

const STRUCT_WARN = 'Missing properties';
function ObjectLike(plan, { build, warn }) {
  const { properties, strict } = plan;
  this.kind = 'struct';
  this.strict = strict ?? false;
  this.properties = new Map();
  this.patterns = new Map();
  this.requires = [];
  if (!properties) return void warn({ plan, sample: properties, cause: STRUCT_WARN });
  for (var [key, value] of Object.entries(properties)) {
    var builded = build(value);
    builded.required && this.requires.push(key);
    (value.isPattern ? this.patterns : this.properties).set(key, builded);
  }
}
