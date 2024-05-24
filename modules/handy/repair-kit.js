'use strict';

function Kit(factory, ns) {
  this.factory = factory;
  this.namespace = ns;
}

Kit.prototype.repair = function (plan) {
  const type = Array.isArray(plan) ? 'array' : typeof plan;
  return this[type](plan);
};

const UNKNOWN = { $type: 'unknown', required: false };
Kit.prototype.function = plan => ({ $type: 'unknown', required: false, calc: plan });
Kit.prototype.boolean = () => ({ $type: 'boolean', required: false });
Kit.prototype.number = () => ({ $type: 'number', required: false });
Kit.prototype.bigint = () => ({ $type: 'bigint', required: false });
Kit.prototype.undefined = () => UNKNOWN;
Kit.prototype.symbol = () => UNKNOWN;

const CORRUPTED = 'Received plan corrupted beyond repair';
const E404_SCHEMA = 'Schema not found: ';
Kit.prototype.string = function (plan) {
  const required = plan.charAt(0) !== '?';
  const $type = required ? plan : plan.slice(1);
  if ($type.charAt(0) < 'A' && $type.charAt(0) > 'Z') {
    if (this.factory._prototypes.has($type)) return { $type, required };
    throw new Error(CORRUPTED);
  }

  const schema = this.namespace.get($type);
  if (!schema) throw new Error(E404_SCHEMA + $type);
  const sealed = Object.create(schema);
  if (!sealed.id) sealed.id = $type;
  sealed.required = required;
  return sealed;
};

Kit.prototype.array = function (plan, { warn }) {};
Kit.prototype.object = function (plan, { warn }) {};
