var CEM = require('../lib/cem'),
    should = require('should'),
    Q = require('q');

describe('Events', function () {

    it('on should register a handler and trigger should trigger it', function (done) {
        var manager = new CEM.Manager(), e;

        manager.c('foo');
        e = manager.e('foo');
        var i =2;
        e.on('hit', function (en, arg) {
            en.should.equal(e);
            arg.should.equal(1);
            if(--i == 0) done();
        });

        e.trigger('hit', [1]);
        e.trigger('hit', [1]);
    });

    it('on should register multiple events separated by spaces', function (done){
        var manager = new CEM.Manager(), e, i=0;

        function handler () {
            if(++i == 2) done();
        }

        manager.c('foo');
        e = manager.e('foo');

        e.on('h1 h2', handler);

        e.trigger('h1');
        e.trigger('h2');

    });

    it('once should register a handler that triggers only once', function () {
        var manager = new CEM.Manager(), e;

        manager.c('foo');
        e = manager.e('foo');

        var fired = false
        e.once('hit', function(){
            fired.should.not.be.ok;
            fired = true;
        })

        e.trigger('hit');
        e.trigger('hit');

        fired.should.be.ok;
    });

    it('should unregister handler with .off if callback is provided', function (done) {
        var manager = new CEM.Manager(), e;

        manager.c('foo');
        e = manager.e('foo');

        var fired = false, otherfired = 0;

        function handler () {
            fired.should.not.be.ok;
            fired = true;
        };

        function otherhandler () {
            otherfired++;
            if(otherfired == 2) done();
        }

        e.on('hit', handler);
        e.on('hit', otherhandler);

        e.trigger('hit');
        e.off('hit', handler);
        e.trigger('hit');
    });

    it('should unregister handler with .off if context provided', function (done) {
        var manager = new CEM.Manager(), e;

        manager.c('foo');
        e = manager.e('foo');

        var fired = false, otherfired = 0;

        function handler () {
            this.should.equal(1);
            fired.should.not.be.ok;
            fired = true;
        }
        function otherhandler () {
            otherfired++;
            if(otherfired == 2) done();
        }

        e.on('hit', handler, 1);
        e.on('hit', otherhandler);

        e.trigger('hit');
        e.off('hit', null, 1);
        e.trigger('hit');
    });

    it(' should make an entity re-emit observed object events', function (done) {
        var manager = new CEM.Manager(), foo, boo;

        manager.c('foo');
        manager.c('boo');

        foo = manager.e('foo');
        boo = manager.e('boo');

        foo.observe('booevt', boo);

        foo.on('booevt:hit', function(x, y){
            y.id.should.equal(boo.id);
            done();
        });

        boo.trigger('hit');
    });

    it('should remove observer when unobserved', function () {
        var manager = new CEM.Manager(), foo, boo;

        manager.c('foo');
        manager.c('boo');

        foo = manager.e('foo');
        boo = manager.e('boo');

        foo.observe('booevt', boo);
        foo.unobserve(boo);
        foo.on('booevt:hit', function(x, y){
            throw new Error('bad');
        });

        boo.trigger('hit');
    });

    it('should unbind its events where it is context when destroyed', function () {
        var manager = new CEM.Manager(), foo, boo;

        manager.c('foo');
        manager.c('boo');

        foo = manager.e('foo');
        boo = manager.e('boo');

        boo.on('hit', function(){
            throw new Error('bad');
        }, foo);

        foo.destroy();

        boo.trigger('hit');
    });

    it('should fire setter events', function (done) {
        var manager = new CEM.Manager(), e;
        manager.c('foo', {
            bar: 2
        });
        e = manager.e('foo');
        e.on('set_bar', function (ent, f) {
            f.should.equal(1);
            e.bar.should.equal(1);
            done();
        });
        e.bar = 1;        
    });

    it('event handler method should fire', function (done) {
        var manager = new CEM.Manager(), e;
        manager.c('foo', {
            on_hit: function () {
                done();
            }
        });

        e = manager.e('foo');
        e.trigger('hit');
    });

    it('method event trigger should work', function(done){
        var manager = new CEM.Manager(), e, i=3;

        function cb(){
            if(--i ==0) done();
        }

        manager.c('foo', {
            event_hit: cb,
            on_hit: cb
        });

        e = manager.e('foo');

        e.on('hit', cb);

        e.hit();
    });

    it('destroyed entity should not handle events', function(){
        var m = new CEM.Manager(), e;
        m.c('foo', {
            on_hit: function() {
                throw new Error('should not happen');
            }
        });
        e = m.e('foo');
        e.on('hit', function(){
            throw new Error('should not hapen');
        });
        e.destroy();
        e.trigger('hit');

    });

});