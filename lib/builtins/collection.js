module.exports = {

    _objects: [],
    _objects_by_id: {},
    length: 0,



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