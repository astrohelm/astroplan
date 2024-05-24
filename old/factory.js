'use strict';

const Forge = require('./forge');
const mods = require('../modules');
const { Snitch } = require('./utils');
const { object: astropack } = require('astropack');
module.exports = Factory;

function Factory(options = {}) {
  const { prototypes, modules = mods } = options;
  this.forge = new Forge(prototypes);
  this.warn = new Snitch();
  this.modules = new Map();
  this.options = options;

  this.warnings = this.warn.warnings;
  astropack.entries(modules).forEach(args => {
    this.register(...args);
  });
}

const MODULE_ERR = 'Module already exists: ';
const MODULE_MIS = 'Received incorrect module: ';
Factory.prototype.register = function (name, module) {
  const { modules, warn } = this;
  if (modules.has(module)) warn({ cause: MODULE_ERR, plan: modules, sample: module });
  if (typeof module !== 'function') throw new Error(MODULE_MIS + name);
  return modules.set(name, module(this)), this;
};

Factory.prototype.build = function (plan) {
  return new Schema(plan, this.options, this);
};

Factory.prototype.child = function (options) {
  if (!options) return new Factory();
  const opts = options ? { ...options, ...this.options } : this.options;
  return new Factory(opts);
};
