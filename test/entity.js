var CEM = require('../lib/cem'),
    should = require('should');

describe('Entity', function () {

    it('should extend component specified in "requires" property', function () {
        var manager = new CEM.Manager(), e;

        manager.c('foo', {
            a: 1,
            b: 2
        });

        manager.c('bar', {
            requires: 'foo',
            a: 3
        });

        e = manager.e('bar');
        e.a.should.equal(3);
        e.b.should.equal(2);
        e.is('foo').should.be.ok;
        e.is('bar').should.be.ok;
        e.is('godzilla').should.not.be.ok; 
    });

    it('should extend multiple required components', function () {
        var manager = new CEM.Manager(), e;

        manager.c('foo1', {
            foo1prop: 1
        });

        manager.c('foo2', {
            foo2prop: 2
        });

        manager.c('superfoo',  {
            superprop: 3,
            requires: 'foo1 foo2'
        });

        e = manager.e('superfoo');
        e.is('foo1').should.be.ok;
        e.is('foo2').should.be.ok;
        e.is('superfoo').should.be.ok;
        e.foo1prop.should.equal(1);
        e.foo2prop.should.equal(2);
        e.superprop.should.equal(3);
    });

    it('bootstrap should be called for all components', function ( done ) {
        var manager = new CEM.Manager(), e, i=3;

        function initfn() {
            if(--i == 0) done();
        }

        manager.c('foo1', {
            foo1prop: 1,
            bootstrap: initfn
        });

        manager.c('foo2', {
            foo2prop: 2,
            bootstrap: initfn
        });

        manager.c('superfoo',  {
            superprop: 3,
            bootstrap: initfn,
            requires: 'foo1 foo2'
        });

        e = manager.e('superfoo');
    });

    it('should deep copy object attributes', function () {
        var manager = new CEM.Manager(), e;

        manager.c('foo', {
            bar: {
                baz: 1
            }
        });

        e = manager.e('foo');
        e.bar.baz = 2;
        e = manager.e('foo');
        e.bar.baz.should.equal(1);

    });

    it('should be possible to set custom id', function () {
        var manager = new CEM.Manager(), e;
        manager.c('foo', {
            bar: 'baz'
        });
        e = manager.e('foo', {
            id: '1234'
        });
        e.id.should.equal('1234');
    });

    it('should throw exception on duplicate id', function (done) {
        var manager = new CEM.Manager();
        manager.c('foo', {
            id: '1234'
        });
        manager.e('foo', {id: '1234'});
        try {
            manager.e('foo', {id: '1234'});
        } catch(e) {
            (e+'').should.equal('Entity with this id already exists');
            done();
        } 
    });

});