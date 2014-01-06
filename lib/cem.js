exports.Manager = require('./manager');
exports.Entity = require('./entity');

if (typeof window !== 'undefined') {
    window.CEM = exports;
}