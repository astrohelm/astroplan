'use strict';

const create = type => ({ kind: type });
module.exports = [
  ['unknown', create('unknown')],
  ['boolean', create('scalar')],
  ['string', create('scalar')],
  ['number', create('scalar')],
  ['bigint', create('scalar')],
  ['null', create('null')],
  ['any', create('any')],
  ['schema', Schema],
  ['object', Struct],
  ['map', Struct],
  ['array', List],
  ['tuple', List],
  ['set', List],
  ['union', Union],
  ['enum', Enum],
];

const ENUM_WARN = 'Recieved incorrect enumerable';
const filter = el => typeof el === 'string' || typeof el === 'number';
function Enum(plan, { warn }) {
  const store = plan.enum;
  this.kind = 'enum';
  this.enum = Array.isArray(store) ? [...new Set(store)].filter(filter) : [];
  this.enum.length !== store?.length && warn({ cause: ENUM_WARN, plan, sample: store });
}

const ITEMS_ERROR = 'Plan items are invalid or empty';
function List(plan, { warn, build }) {
  const items = plan.items;
  const isArray = Array.isArray(items);
  this.kind = 'struct';
  this.isTuple = this.type === 'tuple' || isArray;
  this.items = (isArray ? items : [items]).map(build);
  !this.items.length && warn({ plan, cause: ITEMS_ERROR, sample: items });
}

const PLANS_ERROR = 'Received plan without properties';
function Struct(plan, { build, warn }) {
  const { properties, strict } = plan;
  this.kind = 'struct';
  this.isStrict = strict ?? false;
  this.properties = new Map();
  this.patterns = new Map();
  this.requires = [];
  if (!properties) return void warn({ plan, sample: properties, cause: PLANS_ERROR });
  for (var [key, value] of Object.entries(properties)) {
    const builded = build(value);
    builded.required && this.requires.push(key);
    (value.isPattern ? this.patterns : this.properties).set(key, builded);
  }
}

function Union({ types, condition }, { build }) {
  this.kind = 'union';
  this.condition = condition ?? 'anyof';
  this.types = (Array.isArray(types) ? types : [types]).map(build);
}

function Schema({ schema, id, required }) {
  Object.assign(this, schema);
  if (id) this.id = id;
  this.required = required;
}
