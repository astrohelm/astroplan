'use strict';

const REQUIRED = 'Value is required';
const any = type => ({
  meta: { kind: 'scalar', subtype: 'exotic' },
  construct(plan, tools) {
    const { isRequired, Error } = tools;
    [this.type, this.required] = [type, isRequired(plan)];
    this.ts = () => this.type;
    this.test = (sample, path) => {
      if (!(!this.required && sample === undefined)) return [];
      return [new Error({ path, sample, plan, cause: REQUIRED })];
    };
  },
});

const json = {
  meta: { kind: 'struct', subtype: 'exotic' },
  construct(plan, tools) {
    const { isRequired, Error } = tools;
    [this.type, this.required] = ['json', isRequired(plan)];
    this.ts = () => 'object';
    this.test = (sample, path) => {
      if (!this.required && sample === undefined) return [];
      if (typeof sample === 'object' && sample) return [];
      const err = cause => new Error({ path, sample, plan, cause });
      if (this.required && sample === undefined) return [err(REQUIRED)];
      return [err('Not of expected type: object')];
    };
  },
};

module.exports = { any: any('any'), unknown: any('unknown'), json };