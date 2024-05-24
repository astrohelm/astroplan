'use strict';

const { assign } = Object;
module.exports = { SchemaError, Snitch, unifyProto };
const format = ({ path, cause }) => `[${path}] => ${cause}`;
function SchemaError(options) {
  assign(this, options);
  this.count = this.cause ? 1 : 0;
  this.path = this.path ?? 'unknown';
  this.sampleType = this.sampleType ?? typeof sample;
  this.message = format(this);
}

SchemaError.prototype.add = function (cause) {
  this.cause = this.cause ? `${this.cause}, ${cause}` : cause;
  this.message = (this.count++, format(this));
  return this;
};

SchemaError.prototype.toString = function () {
  return this.message;
};

SchemaError.prototype.toJSON = function () {
  return { sample: this.sample, path: this.path, cause: this.cause };
};

function Snitch(warnings = []) {
  return assign(warn, { warnings });
  function warn(details) {
    const warn = new SchemaError({ path: 'BUILD', ...details });
    return warnings.push(warn), warn;
  }
}

function unifyProto(Proto) {
  const type = isFunction(Proto);
  if (type === 'function') return Proto;
  return function Prototype(plan, tools) {
    if (type === 'class') assign(this, new Proto(plan, tools));
    if (type === 'arrow') assign(this, Proto.call(this, plan, tools));
    if (typeof Proto.construct !== 'function') assign(this, Proto);
    else assign(this, Proto.construct(plan, tools));
  };
}

function isFunction(x) {
  if (typeof x !== 'function') return null;
  if (!x.prototype) return x.constructor.name === 'AsyncFunction' ? 'async' : 'arrow';
  const descriptor = Object.getOwnPropertyDescriptor(x, 'prototype');
  return descriptor.writable ? 'function' : 'class';
}
