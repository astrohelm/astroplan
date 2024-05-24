'use strict';

const kBuilder = Symbol('Schema builder');
const { SchemaError, Snitch } = require('./utils');
const Factory = require('./factory');
module.exports = Schema;

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

const BUILD_ERR = 'Building error: recieved wrong plan:\n';
Schema.prototype[kBuilder] = function (plan) {
  const Type = this.factory.forge.melt(plan.$type);
  if (Type) return new Type(plan, this.tools);
  throw new Error(BUILD_ERR + JSON.stringify(plan));
};
