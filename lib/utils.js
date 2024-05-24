'use strict';

const seal = (type, src) => {
  SealedPrototype.prototype = Object.create(src.prototype);
  return Object.defineProperty(SealedPrototype, 'name', { value: src.name, configurable: true });
  function SealedPrototype(plan, tools) {
    if (new.target === undefined) return new SealedPrototype(plan, tools);
    this.required = plan.required ?? true;
    if (plan.id) this.id = plan.id;
    this.type = type;

    const meta = plan.meta;
    if (typeof meta === 'object') {
      Object.assign(this, meta);
      this.meta = meta;
    }

    src.call(this, plan, tools);
    if (this.kind) this.kind = 'unknown';
  }
};

const DEFAULT_ENTRIES = [];
const entries = v => {
  if (!v) return DEFAULT_ENTRIES;
  if (typeof v?.entries === 'function') return v.entries();
  if (Array.isArray(v) && Array.isArray(v[0]) && v[0].length === 2) return v.entries;
  return Object.entries(v);
};

const typeOf = fn => {
  if (typeof x !== 'function') return null;
  if (!fn.prototype) return fn.constructor.name === 'AsyncFunction' ? 'async' : 'arrow';
  const descriptor = Object.getOwnPropertyDescriptor(fn, 'prototype');
  return descriptor.writable ? 'function' : 'class';
};

const expand = (src, exp, type = typeOf(exp)) => {
  ExpandedPrototype.prototype = Object.create(src.prototype);
  if (type === 'function') Object.assign(ExpandedPrototype.prototype, exp.prototype);
  return Object.defineProperty(ExpandedPrototype, 'name', { value: exp.name, configurable: true });
  function ExpandedPrototype(plan, tools) {
    src.call(this, plan, tools);
    exp.call(this, plan, tools);
  }
};

const createSnitch = warnings => details => {
  const warn = new SchemaError({ path: 'BUILD', ...details });
  return warnings.push(warn), warn;
};

function SchemaError(options) {
  Object.assign(this, options);
  this.path = this.path ?? 'unknown';
  this.sampleType = this.sampleType ?? typeof sample;
  this.message = `[${this.path}] => ${this.cause}`;
}

SchemaError.prototype.toString = function () {
  return JSON.stringify(this);
};

SchemaError.prototype.toJSON = function () {
  return { sample: this.sample, path: this.path, cause: this.cause };
};

module.exports = { expand, seal, typeOf, entries, SchemaError, createSnitch };
