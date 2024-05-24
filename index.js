'use strict';

const Forge = require('./lib2/forge');
const kSnitch = Symbol('Schema snitch');
const kBuilder = Symbol('Schema builder');
const { entries } = require('astropack').object;
const { SchemaError, Snitch } = require('./lib2/utils');
module.exports.default = module.exports = Schema;
module.exports.modules = require('./modules');
module.exports.Factory = Factory;
module.exports.Schema = Schema;

function Factory({ prototypes, modules = Schema.modules, ...other } = {}) {
  this[kSnitch] = new Snitch();
  this.warnings = this[kSnitch].warnings;
  this.forge = new Forge(prototypes);
  this.modules = new Map();
  this.options = other;

  entries(modules).forEach(([name, module]) => {
    this.register(name, module);
  });
}

Factory.prototype.build = function (plan) {
  return new Schema(plan, this.options, this);
};

Factory.prototype.child = function (options) {
  return new Factory(options ? { ...options, ...this.options } : this.options);
};

const MODULE_ERR = 'Module already exists: ';
Factory.prototype.register = function (name, module) {
  const { modules, [kSnitch]: warn } = this;
  if (modules.has(module)) warn({ cause: MODULE_ERR, plan: modules, sample: module });
  return modules.set(name, module(this)), this;
};

Schema.from = (plan, options) => new Schema(plan, options);
function Schema(plan, options, factory = new Factory(options)) {
  this.tools = { Error: SchemaError, build: this[kBuilder].bind(this), warn: new Snitch() };
  this.warnings = this.tools.warn.warnings;
  this.factory = factory;

  factory.modules.forEach(modifier => {
    if (typeof modifier !== 'function') return;
    modifier(this);
  });
  Object.assign(this, this.tools.build(plan));
}

const BUILD_ERR = 'Building error: received wrong plan:\n';
Schema.prototype[kBuilder] = function (plan) {
  const Type = this.factory.forge.melt(plan.$type);
  if (Type) return new Type(plan, this.tools);
  throw new Error(BUILD_ERR + JSON.stringify(plan));
};
