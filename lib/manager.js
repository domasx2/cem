var Entity = require('./entity'),
    utils = require('./utils'),
    builtins = require('./builtins');

var Manager = module.exports = function () {
    this.components = {};
    this.entities = {};
    this.register_builtins();  
};

Manager.prototype.register_builtins = function () {
    this.c('evented', builtins.evented);
    this.c('object', builtins.object);
    this.c('collection', builtins.collection);
};

Manager.prototype.base_component = 'object';

Manager.prototype.clone = function () {
    var retv = new Manager();
    retv.components = this.components;
    return retv;
};

Manager.prototype.component = Manager.prototype.c = function (name, component) {
    component = component || {};
    component.__name = name;
    if(this.components[name]) {
        console.log('WARNING! Component already registered: '+name);
    } 
    this.components[name] = component;
};

Manager.prototype.get = function (entity_id) {
    return this.entities[entity_id];
};

Manager.prototype.entity = Manager.prototype.e = function () {
    if(!arguments.length) {
        throw 'No components specified.'
    }
    var e = new Entity(this), i;

    if(this.base_component) e.__extend(this.base_component);

    for(var i=0; i<arguments.length; i++) {
        e.__extend(arguments[i]);
    };

    if(!e.id) {
        e.id = utils.generate_id();
    }

    if(this.entities[e.id]){
        throw 'Entity with this id already exists';
    }

    e.bootstrap();

    this.entities[e.id] = e;

    if(e.on) {
        e.on('destroy', function () {
            delete this.entities[e.id];
        }, this);
    }

    return e;
};