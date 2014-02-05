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