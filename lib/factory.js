'use strict';

const { seal, expand, typeOf, entries, SchemaError, createSnitch } = require('./utils');
const DEFAULT_PROTOTYPES = require('./prototypes');
const DEFAULT_MODULES = new Map();
const kSchema = Symbol('Metaforge');
module.exports = Factory;

function Factory(options = {}) {
  if (new.target === undefined) return new Factory(options);
  const { defaultPrototypes = DEFAULT_PROTOTYPES, defaultModules = DEFAULT_MODULES } = options;
  const { prototypes, modules } = options;
  this._prototypes = new Map();
  this._modules = new Map();
  this._options = options;

  var key, src;
  for ({ 0: key, 1: src } of entries(defaultPrototypes)) this._prototypes.set(key, seal(key, src));
  for ({ 0: key, 1: src } of entries(prototypes)) this.forge(key, src);
  for ({ 0: key, 1: src } of entries(defaultModules)) this.register(key, src);
  for ({ 0: key, 1: src } of entries(modules)) this.register(key, src);
}

Factory.build = (plan, options) => new Factory(options).build(plan);
Factory.isSchema = schema => schema[kSchema] === true;
Factory.Schema = function Schema(plan, options) {
  return new Factory(options).build(plan);
};

const INVALID_PLAN = 'Builder received invalid plan';
const INVALID_PROTOTYPE = 'Builder received plan with invalid prototype';
Factory.prototype._buildPrototype = function (tools, plan) {
  if (typeof plan !== 'object' || typeof plan.$type !== 'string') throw new Error(INVALID_PLAN);
  const Proto = this._prototypes.get(plan.$type);
  if (Proto) return new Proto(plan, tools);
  throw new Error(INVALID_PROTOTYPE);
};

Factory.defaultTools = { Error: SchemaError };
Factory.prototype._createTools = function () {
  const tools = Object.create(Factory.defaultTools);
  tools.warnings = [];
  tools.build = this._buildPrototype.bind(this, tools);
  tools.warn = createSnitch(tools.warnings);
  return tools;
};

Factory.prototype.build = function (plan) {
  const tools = this._createTools();
  const schema = Object.create(tools.build(plan));
  schema.warnings = tools.warnings;
  schema[kSchema] = true;
  schema.factory = this;
  return schema;
};

const NEW_PROTO_MUST_BE_FUNCTION = 'New prototype must be a function with prototype';
const PROTOTYPE_IS_NOT_ALLOWED = 'Type of prototype is not allowed';
Factory.prototype.forge = function forge(name, Proto) {
  const source = this._prototypes.get(name);
  const type = typeOf(Proto);

  if (source === undefined) {
    if (type !== 'function') throw new Error(NEW_PROTO_MUST_BE_FUNCTION);
    return void this._prototypes.set(name, seal(name, Proto));
  }

  if (type === null) {
    if (typeof Proto !== 'object') throw new Error(PROTOTYPE_IS_NOT_ALLOWED);
    return void this._prototypes.set(name, Object.assign(source.prototype, Proto));
  }

  if (type !== 'function') throw new Error(PROTOTYPE_IS_NOT_ALLOWED);
  this._prototypes.set(name, expand(source, Proto, type));
};

const MODULE_ALREADY_EXISTS = 'Module is already defined, this may lead to runtime errors.';
Factory.prototype.register = function (name, module = require(name)) {
  if (this._modules.has(name)) throw new Error(MODULE_ALREADY_EXISTS);
  module?.inject(this);
  this._modules.set(name);
};

Factory.prototype.child = function (options) {};
