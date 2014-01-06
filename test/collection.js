var CEM = require('../lib/cem'),
    should = require('should');

describe('Collection', function () {
    it('add and remove should work, length should be updated', function () {
        var m = new CEM.Manager(), e, c;
        c = m.e('collection');
        e = m.e('object');
        c.add(e);
        should.exist(c.get(e.id));
        c.length.should.equal(1);
        c._objects.length.should.equal(1);
        e = m.e('object');
        c.add(e);
        should.exist(c.get(e.id));
        c.length.should.equal(2);
        c._objects.length.should.equal(2);
        c.remove(e);
        should.not.exist(c.get(e.id));
        c.length.should.equal(1);
        c._objects.length.should.equal(1);
    });

    it('add should trigger an event', function (done) {
        var m = new CEM.Manager(), e, c;
        c = m.e('collection');
        e = m.e('object');
        c.on('add', function (collection, obj) {
            should.exist(obj);
            collection.length.should.equal(1);
            obj.id.should.equal(e.id);
            done();
        });
        c.add(e);
    });

    it('remove should trigger an event', function (done) {
        var m = new CEM.Manager(), e, c;
        c = m.e('collection');
        e = m.e('object');
        c.on('remove', function (collection, obj) {
            should.exist(obj);
            collection.length.should.equal(0);
            obj.id.should.equal(e.id);
            done();
        });
        c.add(e);
        c.remove(e);
    });

    it('destroyed objects should be removed automatically', function(done){
        var m = new CEM.Manager(), e, c;
        c = m.e('collection');
        e = m.e('object');
        c.add(e);
        c.length.should.equal(1);
        e.destroy();
        c.length.should.equal(0);
        done();
    }); 
});