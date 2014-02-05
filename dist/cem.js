;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
exports.Manager = require('./manager');
exports.Entity = require('./entity');

if (typeof window !== 'undefined') {
    window.CEM = exports;
}
},{"./manager":2,"./entity":3}],3:[function(require,module,exports){
var utils = require('./utils');

var RESERVED = {
    requires: true,
    bootstrap: true,
    destroy: true
}

var Entity = module.exports = function (manager) {
    this.id = null;
    this.destroyed = false;
    this.__manager = manager;
    this.__components = [];
    this.__component_hash = {};
    this.__properties = {};
};

Entity.prototype.bootstrap = function () {
    var args = arguments;
    this.__components.forEach(function (component) {
        if (component.bootstrap) {
            component.bootstrap.apply(this, args);
        }
    }, this);
};

Entity.prototype.destroy = function () {

    if(this.trigger) this.trigger('destroy');
    this.destroyed = true;
};


Entity.prototype.__extend = function(component) {
    var c, key, property, self = this;

    //if component name was passed, get component object from manager
    if( (typeof component) === 'string'){
        var c = this.__manager.components[component];
        if(!c) {
            throw 'Unknown component: '+component;
        }
        component = c;
    }

    //register component with this entity
    
    if(component.__name) {
        if(!this.__component_hash[component.__name]) {
            this.__component_hash[component.__name] = component;
        } else {
            return;
        }
    }
    this.__components.push(component);

    //if component has sub components, extend w. them first
    if(component.requires) {
        component.requires.split(' ').forEach(function (component) {
            if(component) {
                this.__extend(component);
            }
        }, this);
    }

    //copy properties
    Object.keys(component).forEach(function(key) {
        if(key.slice(0, 2) !== '__' && !RESERVED[key]){
            property = component[key];
            if((typeof property) === 'function') {
                if(!component.__name) {
                    console.log('Adding functions via anonymous components is not recommended! These properties will not be restored on deserialization.');
                }
                self[key] = property;

            } else {
                if(key.slice(0, 1) !== '_') {
                    if ((typeof property) === 'object') {
                        property = utils.deep_copy(property);
                    } 

                    if(self.__properties[key] === undefined){

                        Object.defineProperty(self, key, {
                            set: function (val){
                                self.__properties[key] = val;
                                if(self.trigger) {
                                    self.trigger('set_'+key, [val]);
                                    self.trigger('set', [key, val]);
                                }
                            },
                            get: function () {
                                return self.__properties[key];
                            }   
                        });
                    }

                    self.__properties[key] = property;
                } else {
                    self[key] = property;
                }
            }
        }
    });
},

Entity.prototype.is = function(component_name) {
    return this.__component_hash[component_name] != undefined;
};
},{"./utils":4}],2:[function(require,module,exports){
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
},{"./entity":3,"./utils":4,"./builtins":5}],4:[function(require,module,exports){
exports.deep_copy = function(obj){
    return JSON.parse(JSON.stringify(obj));
}

exports.generate_id = function(){
    //v4 guid
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

},{}],5:[function(require,module,exports){
exports.collection = require('./collection');
exports.evented = require('./evented');
exports.object = require('./object');
},{"./collection":6,"./evented":7,"./object":8}],6:[function(require,module,exports){
module.exports = {

    _objects: [],
    _objects_by_id: {},
    length: 0,

    bootstrap: function () {
        this._objects = [];
        this._objects_by_id = {};
    },

    add: function(object){
        this._objects.push(object);
        this._objects_by_id[object.id] = object;
        this.observe('object', object);
        this.length++;
        this.trigger('add', [object]);
        object.on('destroy', function(){
            this.remove(object);
        }, this);
    },

    get: function(id) {
        return this._objects_by_id[id];
    },

    remove: function(object) {
        this.unobserve(object);
        this.length--;
        delete this._objects_by_id[object.id];
        this._objects = this._objects.filter(function(obj){
            return obj.id != object.id;
        });
        object.off("destroy", null, this);
        this.trigger('remove', [object]);
    },

    each: function(cb, context) {
        this._objects.forEach(cb, context);
    }
};
},{}],7:[function(require,module,exports){
function evlist(events){
    if( (typeof events) === 'string'){
        events = events.split(' ');
    }
    return events;
};

module.exports = {

    _callbacks: {},
    _observed_by: [],
    _suppress_events: false,

    bootstrap: function () {
        //make event_x work
        this._callbacks = {};
        this._observed_by = [];

        for(var key in this) {
            if(key.substring(0, 6) == 'event_'){
                (function(key, fn, self){
                    self[key] = function () {
                        self.trigger(key, Array.prototype.slice.call(arguments));
                    }
                    self.on(key, fn, self);
                })(key.substring(6), this[key], this);
            }
        }
    },


    _on: function(event, callback, context, once) {

        this._callbacks[event] = this._callbacks[event] || [];
        this._callbacks[event].push({
            callback: callback,
            context: context,
            once: once
        });

        if(context && context.on) {
            var self = this;
            context.on('destroy', function () {
                self.off(event, callback, context);
            });
        }
    },


    on: function(events, callback, context, once) {
        evlist(events).forEach(function (event) {
            this._on(event, callback, context, once);
        }, this);
    },

    _off: function (event, callback, context) {
        if(this._callbacks[event])  {
            this._callbacks[event] = this._callbacks[event].filter(function(evt){
                return (callback && (callback.toString() != evt.callback.toString())) || (context && (context !== evt.context));
            });
        }
    },

    off: function(events, callback, context) {
        evlist(events).forEach(function (event) {
            this._off(event, callback, context);
        }, this);
    },


    once: function(events, callback, context) {
        this.on(events, callback, context, true);
    },

    observe: function(prefix, target) {
        if(target === this) {
            throw new Error("Tryin to obsrver self.");
        }
        if(target._observed_by) {
            target._observed_by.push({
                prefix: prefix,
                observer: this
            });
        } else {
            throw new Error('trying to observe unobservable', target);
        }
    },

    unobserve: function(target) {
        if(target._observed_by) {
            target._observed_by = target._observed_by.filter(function(x){
                return x.observer !== this;
            }, this);
        }
    },

    _trigger: function(event, args){
        if(this._callbacks[event]){
            this._callbacks[event] = this._callbacks[event].filter(function(cb){
                if(!this.destroyed) {
                    cb.callback.apply(cb.context, args);
                }
                return !cb.once;
            }, this);
        }
    },
    
    trigger: function(event, args){
        args = (args || []).slice(0);
        if(this._suppress_events) return;
        for(var key in this) {
            if(key.indexOf('on_'+event) == 0 && !this.destroyed) {
                this[key].apply(this, args);
            }
        }

        if(!args) args = [this];
        else args.splice(0, 0, this);
        this._trigger(event, args);
        this._observed_by.forEach(function(o){
            o.observer.trigger(o.prefix+':'+event, args);
        }, this);

        args.splice(0, 0, event);
        this._trigger('*', args);
    }
};  
},{}],8:[function(require,module,exports){
module.exports = {
    requires: 'evented'
};
},{}]},{},[1])
;