var CEM = require('../lib/cem'),
    should = require('should');

describe('Manager', function () {

    it('should register a component and spawn it', function () {
        var manager = new CEM.Manager();
        manager.c('foo', {
            bar: '1',
            fn: function(){
                return this.bar;
            }
        });
        should.exist(manager.components['foo']);

        var entity = manager.e('foo');
        entity.should.be.an.instanceOf(CEM.Entity);
        entity.bar.should.equal('1');
        entity.fn().should.equal('1');
        should.exist(entity.id);
        manager.get(entity.id).should.equal(entity);
    });

    it('should register a component and set initial properties, and id', function() {
        var manager = new CEM.Manager();

        manager.c('foo', {
            bar: 1,
            baz: 2
        });

        var entity = manager.e('foo', {
            bar: 2,
            id: 'stuffthing'
        });

        entity.bar.should.equal(2);
        entity.baz.should.equal(2);
        entity.id.should.equal('stuffthing');

    });

    it('should remove entity that is destroyed', function () {
        var manager = new CEM.Manager(), e;

        manager.c('foo');
        e = manager.e('foo');
        e.destroy();
        should.not.exist(manager.get(e.id));
    });

});