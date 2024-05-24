'use strict';

const { entries } = require('astropack').object;
const { unifyResult } = require('./utils');
const prototypes = require('./types');

const DID_NOT_PASSED = 'Test failed: ';
const RULE_NOT_EXIST = `Missing rule: `;
const REQUIRE_SAMPLE = 'Recieved empty sample';
const validify = result => Object.assign(result, { valid: result.length === 0 });
module.exports = ({ forge, options: { rules } }) => {
  prototypes.forEach(([name, proto]) => void forge.attach(name, proto));
  const schemaRules = rules ? new Map(entries(rules)) : new Map();
  forge.attach('after', function TestWrapper(plan, { Error }) {
    if (plan.type === 'schema') return this.test;
    const planRules = plan.rules;
    const rules = Array.isArray(planRules) ? planRules : [planRules];
    const tests = rules.filter(test => typeof test === 'string' || typeof test === 'function');
    typeof this.test === 'function' && tests.unshift(this.test);
    // prettier-ignore
    this.test = (sample, path = 'root', isPartial = false) => {
      const err = (def, cause = def) => new Error({ cause, path, plan, sample });
      if (sample === undefined) return validify(this.required ? [err(REQUIRE_SAMPLE)] : []);
      return validify(tests.reduce((errors, rule, i) => {
        const test = typeof rule === 'string' ? schemaRules.get(rule) : rule;
        const name = i - 1 < 0 ? 'Prototype test' : 'Rule №' + i;
        const result = rule ? test.call(this, sample, path, isPartial) : RULE_NOT_EXIST + name;
        errors.push(...unifyResult(result, err.bind(null, DID_NOT_PASSED + name)));
        return errors;
      }, []));
    };
  });
};
