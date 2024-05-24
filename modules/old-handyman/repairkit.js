'use strict';

const { createSchema, parsePlan } = require('./utils');
module.exports = RepairKit;

function RepairKit(schema, namespace) {
  this.forge = schema.factory.forge;
  this.namespace = namespace;
  this.tools = schema.tools;
}

RepairKit.prototype.function = plan => ({ $type: 'unknown', calc: plan });
RepairKit.prototype.unknown = { $type: 'unknown', required: false };
RepairKit.prototype.repair = function (plan, warn = this.tools.warn) {
  const type = Array.isArray(plan) ? 'array' : typeof plan;
  return this[type]?.(plan, warn) ?? this.unknown;
};

const SCHEMA_NOT_FOUND = 'Schema not found: ';
const TYPE_NOT_FOUND = 'Received unknown type: ';
RepairKit.prototype.string = function (plan, warn) {
  const required = plan[0] !== '?';
  const type = required ? plan : plan.slice(1);
  if (!astropack.case.isFirstUpper(plan)) {
    if (this.forge[type]) return { $type: type, required };
    warn({ cause: TYPE_NOT_FOUND + type, plan, sample: type });
    return this.unknown;
  }
  const schema = this.namespace.get(type); //? Schema wrapper #1
  if (schema) return { $type: 'schema', schema, id: type, required };
  warn({ cause: SCHEMA_NOT_FOUND + type, plan, sample: type });
  return this.unknown;
};

const ENUM_ITEMS = ['string', 'number', 'bigint', 'boolean'];
const ARRAY_TYPE_NOT_FOUND = 'Cant parse type of received array: ';
RepairKit.prototype.array = function (plan, warn) {
  var isArray = true;
  const stub = () => (isArray = false);
  for (var i = 0; i < plan.length && isArray; ++i) {
    const { $type } = this.repair(plan[i], stub);
    isArray = isArray && this.forge[$type];
    if (!isArray) break;
  }
  if (isArray) return { $type: 'array', items: plan, required: true };
  const isEnum = plan.every(item => ENUM_ITEMS.includes(typeof item));
  if (isEnum) return { $type: 'enum', enum: plan, required: true };
  warn({ cause: ARRAY_TYPE_NOT_FOUND, sample: plan, plan });
  return this.unknown;
};

RepairKit.prototype.object = function (plan, warn) {
  if (plan === null) return { $type: 'null', required: true };
  if (plan.constructor?.name === 'Schema') return { $type: 'schema', schema: plan };
  if (plan.constructor?.name !== 'Object') return this.unknown;
  if ('$type' in plan) {
    if (plan.id) return createSchema(this.tools, plan, 'id');
    if (this.forge[plan.$type]) return plan;
    warn({ cause: TYPE_NOT_FOUND + plan.$type, sample: plan.$type, plan });
    return this.unknown;
  }

  if (plan.$id) return createSchema(this.tools, plan, '$id');
  const { dollars, properties } = parsePlan(plan);
  const result = { $type: 'object', properties: { ...properties }, ...dollars };
  return result;
};
