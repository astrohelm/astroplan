'use strict';

const { objectEntries, unifyResult } = require('./utils');
const prototypes = require('./tests');

const DID_NOT_PASSED = 'Test failed: ';
const RULE_NOT_EXIST = `Missing rule: `;
const REQUIRE_SAMPLE = 'Recieved empty sample';
module.exports = (schema, options) => {
  schema.forge.attach('after', TestWrapper);
  for (const [name, proto] of prototypes.entries()) schema.forge.attach(name, proto);
  const schemaRules = options.rules ? new Map(objectEntries('any', options.rules)) : new Map();
  const Error = schema.tools.Error;
  schema.test = (sample, path = 'root', isPartial = false) => {
    const err = (def, cause = def) => new Error({ cause, path, plan: schema.$plan, sample });
    const result = schema.test(sample, path, isPartial);
    const flat = unifyResult(result, err.bind(null, DID_NOT_PASSED));
    flat.valid = flat.length === 0;
    return flat;
  };

  function TestWrapper(plan) {
    if (plan.$type === 'schema') return this.test.bind(this);
    const planRules = plan?.$rules;
    const rules = Array.isArray(planRules) ? planRules : [planRules];
    const tests = rules.filter(test => typeof test === 'string' || typeof test === 'function');
    typeof this.test === 'function' && tests.unshift(this.test.bind(this));
    this.test = (sample, path, isPartial) => {
      if (sample === undefined || sample === null) return !this.$required ? [] : [REQUIRE_SAMPLE];
      const err = (def, cause = def) => new Error({ cause, path, plan, sample });
      const errors = [];
      for (let i = 0; i < tests.length; i++) {
        let [rule, name] = [tests[i], i - 1 < 0 ? 'Prototype test' : 'Rule №' + i];
        if (typeof rule === 'string') [rule, name] = [schemaRules.get(rule), rule];
        if (rule) {
          const result = rule(sample, path, isPartial);
          errors.push(...unifyResult(result, err.bind(null, DID_NOT_PASSED + name)));
          continue;
        }
        errors.push(err(RULE_NOT_EXIST + name));
      }
      return errors;
    };
  }
};