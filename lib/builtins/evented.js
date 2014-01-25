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