'use strict';

const { entries } = require('astropack').object;
const copy = value => {
  if (Array.isArray(value)) return [...value];
  if (value?.constructor.name === 'Map') return new Map(value.entries());
  if (value?.constructor.name === 'Set') return new Set([...value]);
  return { ...value };
};

const calculate = (sample, schema, mode) => {
  if (!sample || typeof sample !== 'object') return sample;
  if (sample?.constructor.name === 'Set') return sample;
};

// const calc = this.calc;
// var root = mode && typeof sample === 'object' ? copy(sample) : sample;
// if (calc) root = typeof calc === 'function' ? calc(root, root) : calc;
// return !root || typeof root !== 'object' ? root : traverse(this, root, mode, root);
const TRAVERSE_PATH = ['properties', 'items'];
const traverse = (schema, root, mode, sample) => {
  if (!sample || typeof sample !== 'object') return sample;
  if (sample?.constructor.name === 'Set') return sample;
  const data = mode ? copy(sample) : sample;

  if (schema.properties) {
    for (var [prop, { calc }] of entries(data)) {
      if (calc) typeof calc === 'function' ? calc(data[prop], parent, root) : calc;
      data[prop] = traverse(schema, root, mode, data[prop]);
    }
  } else if (schema.items) {
  }

  for (var key of TRAVERSE_PATH) {
    var children = schema[key];
    if (!children) continue;
    var keys = key !== 'properties' ? Object.keys(data) : children.keys();
    for (var prop of entries(children)) {
      const schema = children.get?.(prop) ?? children[prop] ?? children[0];
      const calc = schema.calc;
      if (calc) data[prop] = typeof calc === 'function' ? calc(data[prop], parent, root) : calc;
    }
  }
  return data;
};

// prettier-ignore
const parsePlan = object => {
  const properties = {}, dollars = {};
  for (var key in object) {
    if (key.startsWith('$')) dollars[key] = object[key];
    else properties[key] = object[key];
  }
  return { properties, dollars, result: { ...properties, ...dollars } };
};

const createSchema = (tools, plan, idField) => {
  const { [idField]: id, ...fields } = plan;
  return { $type: 'schema', id, schema: tools.build(fields) };
};

module.exports = { traverse, copy, createSchema, parsePlan };
