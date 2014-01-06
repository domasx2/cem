# Component entity manager

## Build

    npm install
    grunt

## Test
    
    npm test

## Usage


```
//instantiate new manager
var manager = new CEM.Manager();


//create some components
manager.c('alive', {
    health: 100,
    dead: false,
    requires: 'evented',

    take_damage: function(amount) {
        if(this.health > 0){
            this.health -= amount;
            this.trigger('took_damage', [amount]); //trigger event
            if(this.health <= 0){
                this.die();
            }
        }
    },

    event_die: function () {  //explicit event declaration
        this.dead = true;
        console.log('Died!');
    }
});

manager.c('fighter', {
    requires: 'object alive',  //base component; includes events
    name: 'Jhon Doe',
    attack_power: 30,
    attack: function(object) {
        if(object.is('alive')) {
            object.take_damage(this.attack_power);
        }
    }
});

manager.c('wuss', {
    requires: 'evented',
    on_took_damage_exclaim: function () { //event handler. Starts with "on_[event name]", can have any suffix
        console.log('Ouch!');
    }
});

//spawn entities
var bob = manager.e('fighter', {
    name: 'Bob'
});

var troll = manager.e('alive', 'wuss', {
    health: 200
});


//register event handler
troll.on('die', function(){
     console.log('Bob has slain troll!');
});

//slay troll
while(!troll.dead) {
    bob.attack(troll);
}


//and other great features

``` 