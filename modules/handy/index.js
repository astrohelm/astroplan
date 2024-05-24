'use strict';

const MetaForge = require('../..');
const Kit = require('./repair-kit');

const _buildPrototype = MetaForge.prototype._buildPrototype;
MetaForge.prototype._buildPrototype = function (tools, plan) {
  const builded = _buildPrototype.call(this, tools, plan);
  return builded;
};

const build = MetaForge.prototype.build;
MetaForge.prototype.build = function (plan) {
  const builded = build.call(this, plan);
  return builded;
};

module.exports = factory => {
  const kit = new Kit(factory);
  factory.kit = kit;
  factory.repair = kit.repair.bind(kit);
  return factory;
};
