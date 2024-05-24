'use strict';

const { entries } = require('astropack').object;
const { copy, traverse } = require('./utils');
const RepairKit = require('./repairkit');

// prettier-ignore
module.exports = ({ options: { namespace: ns } }) => schema => {
  const unnamedSchemas = new Set();
  const namespace = ns ? new Map(entries(ns)) : new Map();
  const context = { kit: new RepairKit(schema, namespace), namespace, unnamedSchemas };
  schema.pull = Pull.bind(context);
  schema.calculate = Calculate.bind(schema);
  schema.tools.build = Build.bind(context, schema.tools.build);
};

function Pull(name) {
  for (var [type, schema] of this.namespace.entries()) {
    if (type === name) return schema;
    const found = schema.pull?.(name);
    if (found) return found;
  }
  for ([, schema] of this.unnamedSchemas.entries()) {
    const found = schema.pull?.(name);
    if (found) return found;
  }
  return null;
}

function Calculate(sample, mode) {
  const calc = this.calc;
  var root = mode && typeof sample === 'object' ? copy(sample) : sample;
  if (calc) root = typeof calc === 'function' ? calc(root, root) : calc;
  return !root || typeof root !== 'object' ? root : traverse(this, root, mode, root);
}

function Build(build, plan) {
  const fixed = this.kit.repair(plan);
  const builded = build(fixed);
  const { calc, $type } = fixed;
  if (calc) builded.calc = fixed.calc;
  if ($type !== 'schema') return builded;
  if (!builded.id) this.unnamedSchemas.add(builded);
  else this.namespace.set(builded.id, builded);
  return builded;
}
