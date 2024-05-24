'use strict';

const { unifyProto } = require('./utils');
const defaultPrototypes = require('./proto');
const { entries } = require('astropack').object;
const { LinkedList } = require('astropack').structs;
const kWrappers = Symbol('Forge chain wrappers');
const kChains = Symbol('Forge chains');
Forge.symbols = { kChains, kWrappers };
const { kAdd } = LinkedList.symbols;
module.exports = Forge;

function Forge(custom) {
  this[kChains] = new Map();
  this[kWrappers] = { before: new LinkedList(), after: new LinkedList() };
  defaultPrototypes.forEach(([name, proto]) => void this.attach(name, proto));
  custom && entries(custom).forEach(([name, proto]) => void this.attach(name, proto));
  return new Proxy(this, {
    get: (target, prop, reciever) => {
      if (Reflect.has(target, prop)) return Reflect.get(target, prop, reciever);
      return this[kWrappers][prop] ?? this[kChains].get(prop);
    },
  });
}

const NAME500 = 'Invalid name: ';
const SOURCE500 = 'Invalid source: ';
const SOURCE404 = 'Source not found: ';
const OPTIONS = [false, undefined, 'before'];
const ALLOWED = ['function', 'object', 'string'];
Forge.prototype.attach = function (name, ...data) {
  const option = data[0];
  if (typeof name !== 'string') throw new Error(NAME500 + name);
  if (!ALLOWED.includes(typeof option)) throw new Error(SOURCE500 + typeof option);
  var { 0: flag, 1: source, 2: chainMode } = Array.isArray(option) ? data.shift() : OPTIONS;
  if (typeof option === 'string') {
    source = this[kChains].get(data.shift());
    if (!source) throw new Error(SOURCE404 + option);
  }

  const { [kChains]: chains, [kWrappers]: wrappers } = this;
  const created = wrappers[name] ?? chains.get(name);
  const list = created ?? new LinkedList();
  source && list.chain(chainMode, source);
  list[kAdd](flag, data.map(unifyProto));
  !created && chains.set(name, list);
};

Forge.prototype.melt = function (name) {
  const { before, after } = this[kWrappers];
  const chain = this[kChains].get(name);
  if (!chain) return null;
  return function ForgePrototype(plan, tools) {
    if (!new.target) return new ForgePrototype(plan, tools);
    const meta = plan.meta;
    this.type = name;
    this.required = plan.required ?? true;
    if (plan.id) this.id = plan.id;
    if (typeof meta === 'object') this.meta = (Object.assign(this, meta), meta);
    for (var proto of before) proto.call(this, plan, tools);
    for (proto of chain) proto.call(this, plan, tools);
    for (proto of after) proto.call(this, plan, tools);
    if (!this.kind) this.kind = 'unknown';
  };
};
