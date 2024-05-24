'use strict';

const instanceOfArray = sample => Array.isArray(sample) || sample?.constructor?.name === 'Set';
module.exports = { unionHandler, instanceOfArray, unifyResult };

function unifyResult(result, createError) {
  const unified = [];
  const unify = v => {
    if (Array.isArray(v)) return void v.forEach(unify);
    const type = typeof v;
    if (!v) return void (type === 'boolean' && unified.push(createError()));
    if (type === 'string') return void unified.push(createError(v));
    if (type === 'object') return void unified.push(v);
  };
  return unify(result), unified;
}

function unionHandler(name, max) {
  var flag = false;
  if (name === 'allof') {
    return (result, i) => {
      if (result.length === 0) return i === max ? ['ok'] : ['continue'];
      return ['Item did not pass one of schema', result];
    };
  }
  const errors = [];
  if (name === 'oneof') {
    return (result, i) => {
      if (flag && result.length === 0) return ['Item passed more than one schema'];
      if (result.length === 0) flag = true;
      else if (!flag) errors.push(...result);
      if (i === max) return flag ? ['ok'] : ['Item did not pass all schemas', errors];
      return ['continue'];
    };
  }
  return (result, i) => {
    if (result.length !== 0) {
      if (i >= max) return ['Item did not pass all schemas', errors];
      errors.push(...result);
    }
    return result.length === 0 ? ['ok'] : ['continue'];
  };
}
