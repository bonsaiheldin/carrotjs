/**
 * @author       Bonsaiheldin <dm@bonsaiheld.org>
 * @copyright    2018 Bonsaiheldin
 * @license      {@link https://github.com/photonstorm/Domy/blob/master/license.txt|MIT License}
 */

// Initialize the main object with all expected properties
var Domy = Domy ||
{
    "Version": "0.0.5",
    /*
    "Game": {},
    "Camera": {},
    "World": {},
    "Group": {},
    "Sprite": {},
    "Time": {},
    "Math": {},
    "Sound": {},
    "Physics": {},
    "Point": {},
    "Rectangle": {},
    "Circle": {},
    "Line": {},
    "Input": {}
    */
};

console.log("%cDomy v" + Domy.Version + " | HTML5 DOM game engine | https://github.com/bonsaiheldin/domy", "font-weight: bold;");

/**
 * The core game container.
 *
 * @class Domy.Game
 * @constructor
 * @param {number} [width=960] - The width of the container.
 * @param {number} [height=540] - The height of the container.
 * @param {string} [parent=null] - The parent div of the container.
 * @param {object} [states=null] - Your own states the game shall use.
 * @param {boolean} [transparent=false] - Defines if the container shall be transparent.
 */
Domy.Game = function(width, height, parent, states, transparent)
{
    let that = this;
    var start = function()
    {
        that.width = width || 960;
        that.height = height || 540;
        that.parent = document.getElementById(parent) || null;
        that.states = states || null;
        that.transparent = transparent || false;

        // If container was not specified or not found, create one
        if (that.parent === null)
        {
            let div = document.createElement('div');
            document.body.appendChild(div);
            that.parent = div;
        }

        // If the container shall not be transparent, color it black
        if (that.transparent === false)
        {
            that.parent.style.backgroundColor = '#000000';
        }

        that.parent.style.width = that.width + 'px';
        that.parent.style.height = that.height + 'px';
        that.parent.style.overflow = "hidden";
        that.parent.className = 'domy';

        // Init
        that.world = new Domy.World(that);
        that.camera = new Domy.Camera(that);
        that.time = new Domy.Time(that);
        that.keyboard = new Domy.Keyboard(that);
        that.mouse = new Domy.Mouse(that);
        that.cache = new Domy.Cache(that);
        that.load = new Domy.Loader(that);
        that.add = new Domy.ObjectFactory(that);

        if (that.states.create) { that.states.create(); }

        that.start(that);

        return that;
    };

    document.addEventListener('DOMContentLoaded', start, false);
}

/**
 * The update loop of the core. Happens automatically.
 * @method Domy.Game#update
 * @private
 */
Domy.Game.prototype.update = function(delta)
{
    this.time.update(delta);
    this.world.update();
    this.camera.update();

    if (this.states.update) { this.states.update(); }
};

/**
 * The render loop of the core. Happens automatically.
 * @method Domy.Game#render
 * @private
 */
Domy.Game.prototype.render = function()
{
    //this.time.render();
    this.world.render();
    //this.camera.render();

    if (this.states.render) { this.states.render(); }
};

/**
 * Starts the update and render loops of the core.
 */
Domy.Game.prototype.start = function(game)
{
    // Start the two core loops
    MainLoop.setUpdate(function(delta)
    {
        game.update(delta);
    }).setDraw(function()
    {
        game.render();
    }).start();
};

Domy.Game.prototype.constructor = Domy.Game;

/**
 * The camera. It is added to the core loops and updates automatically.
 * @class Domy.Camera
 * @constructor
 * @param {Domy.Game} game - The core game object.
 */
Domy.Camera = function(game)
{
    this.game = game;
    this.world = this.game.world;
    /**
    * @property {number} x - The x coordinate of the camera.
    */
    this.x = 0;
    this.y = 0;
    this.width = this.game.width;
    this.height = this.game.height;
    this.bounds = new Domy.Rectangle(this.x, this.y, this.width, this.height);

    this.target = null;

    return this;
};

Domy.Camera.prototype =
{
    /**
     * Let the camera follow an entity.
     * @method Domy.Camera#follow
     * @param {object} game - The entity.
     */
    follow(target)
    {
        if (target)
        {
            this.target = target;
        }
    },

    /**
     * Let the camera stop following any entity.
     * @method Domy.Camera#unfollow
     */
    unfollow()
    {
        this.target = null;
    },

    /**
     * The update loop of the camera. Happens automatically.
     * @method Domy.Camera#update
     * @private
     */
    update()
    {
        if (this.target !== null)
        {
            let targetX = this.target.x;
            let targetY = this.target.y;

            // Left / right
            if (targetX > this.width * 0.5
             && targetX <= this.world.width - (this.width * 0.5))
            {
                this.x = targetX - (this.width * 0.5);
            }

            // Top / bottom
            if (targetY > this.height * 0.5
             && targetY <= this.world.height - (this.height * 0.5))
            {
                this.y = targetY - (this.height * 0.5);
            }

            // Transform the game div according to the camera
            this.game.parent.style.left = -this.x;
            this.game.parent.style.top  = -this.y;
        }
    }
};

Domy.Camera.prototype.constructor = Domy.Camera;

/**
 * The world container stores every sprite or group and updates them automatically.
 * @class Domy.World
 * @constructor
 * @param {object} game - The core game object.
 */
Domy.World = function(game)
{
    this.game = game;
    this.camera = new Domy.Camera(this.game);
    this.x = 0;
    this.y = 0;
    this.width = this.game.width;
    this.height = this.game.height;
    this.bounds = new Domy.Rectangle(this.x, this.y, this.width, this.height);

    this.children = [];

    return this;
};

Domy.World.prototype =
{
    /**
     * Adds a child to the world container. The child can be a sprite or a group.
     * @method Domy.World#addChild
     * @param {object} entity - The child.
     */
    addChild(entity)
    {
        this.children.push(entity);
    },

    /**
     * Removes the given child from the world container.
     * @method Domy.World#removeChild
     * @param {object} entity - The child.
     */
    removeChild(entity)
    {
        this.children.splice(this.children.indexOf(entity), 1);
    },

    /**
     * The update loop of the world container. Happens automatically.
     * @method Domy.World#update
     * @private
     */
    update()
    {
        for (let i = 0; i < this.children.length; i++)
        {
            let child = this.children[i];

            child.update();
        }
    },

    /**
     * The render loop of the world container. Happens automatically.
     * @method Domy.World#render
     * @private
     */
    render()
    {
        for (let i = 0; i < this.children.length; i++)
        {
            let child = this.children[i];

            child.render();
        }
    }
};

Domy.World.prototype.constructor = Domy.World;

/**
 * Groups are containers storing your game objects (sprites).
 * They are added automatically to the world container.
 * @class Domy.Group
 * @constructor
 * @param {object} game - The core game object.
 */
Domy.Group = function(game)
{
    this.game = game;
    this.world = this.game.world;

    this.children = [];

    // Add it to the world
    this.world.addChild(this);

    return this;
};

Domy.Group.prototype =
{
    /**
     * Adds an entity to a group. The entity has to be a sprite.
     * @method Domy.Group#addChild
     * @param {object} entity - The entity.
     */
    addChild(entity)
    {
        // Since the entity is now in the group, there is no need for it to be
        // a child of the world, because it gets updated through the group now.
        this.world.removeChild(entity);

        this.children.push(entity);
        entity.group = this;
    },

    /**
     * Removes the given entity from a group.
     * @method Domy.Group#removeChild
     * @param {object} entity - The entity.
     */
    removeChild(entity)
    {
        // Since the entity left the group, it has to be added as a child of
        // the world again, so it still gets updates.
        this.world.addChild(entity);

        this.children.splice(this.children.indexOf(entity), 1);
        entity.group = null;
    },

    /**
     * Iterates all children of a group and sets their `property` to the given `value`.
     * @method Domy.Group#setAll
     * @param {object} entity - The entity.
     */
    setAll(property, value)
    {
        for (let i = 0; i < this.children.length; i++)
        {
            let child = this.children[i];

            child[property] = value;
        }
    },

    /**
     * Destroys the sprite and removes it entirely from the game world.
     *
     * @method Domy.Group#destroy
     */
    destroy()
    {
        // Remove from world container
        this.world.removeChild(this);

        return this;
    },

    /**
     * The update loop of the group. Happens automatically.
     * @method Domy.Group#update
     * @private
     */
    update()
    {
        for (let i = 0; i < this.children.length; i++)
        {
            let child = this.children[i];

            child.update();
        }
    },

    /**
     * The render loop of the group. Happens automatically.
     * @method Domy.Group#render
     * @private
     */
    render()
    {
        for (let i = 0; i < this.children.length; i++)
        {
            let child = this.children[i];

            child.render();
        }
    }
};

Domy.Group.prototype.constructor = Domy.Group;

/**
 * Sprites are game objects which contain the actual HTML elements for rendering.
 * @class Domy.Sprite
 * @constructor
 * @param {Domy.Game} game - The core game object.
 * @param {number} x - The x coordinate in the world of the sprite.
 * @param {number} y - The y coordinate in the world of the sprite.
 * @param {string} [key=null] - This is the image for the sprite. If left empty, the sprite will be just a green rectangle.
 * @param {string} [frame=0] - The starting frame of the image (only for spritesheets). If left empty, it will be null.
 * @param {Domy.Group} [group=null] - The group this sprite shall be added to. If left empty, it will be added directly to the world container
 */
Domy.Sprite = function(game, x, y, key, frame, group)
{
    this.x = x || 0;
    this.y = y || 0;
    this.key = key || null;
    this.frame = frame || 0;
    this.group = group || null;

    // Internal values
    this.game = game;
    this.world = this.game.world;
    this.camera = this.game.camera;
    this.time = this.game.time;
    this.alive = true;
    this.alpha = 1;
    this.width = 32;
    this.height = 32;
    this.anchor = new Domy.Point(0.5, 0.5);
    this.position = new Domy.Point(this.x, this.y);
    this.left   = this.x - (this.width  * this.anchor.x);
    this.right  = this.x + (this.width  * this.anchor.x);
    this.top    = this.y - (this.height * this.anchor.y);
    this.bottom = this.y + (this.height * this.anchor.y);
    this.bounds = new Domy.Rectangle(this.x, this.y, this.width, this.height);
    this.outOfBoundsKill = false;
    this.inCamera = false;

    // Physics body
    this.body = new Domy.Physics.Body();

    // HTML magic
    this.image = document.createElement('div');
    this.game.parent.appendChild(this.image);
    this.image.style.position = "absolute";
    this.image.style.width = this.width + "px";
    this.image.style.height = this.height + "px";

    // If no image was given, just color it green
    if (this.key === null)
    {
        this.image.style.backgroundColor = "#00ff00";
    }

    // If an image was given, apply it as a background image
    else
    {
        this.image.style.backgroundImage = "url(" + this.game.cache.images[this.key].src + ")";

        // Apply frame on spritesheet
        if (this.frame !== 0)
        {
            let frame = this.game.cache.images[this.key].frames[this.frame];
            this.image.style.backgroundPosition = frame.x + "px " + frame.y + "px";
        }
    }

    // Add it to the world
    // If a group was given, add the sprite to that
    if (this.group !== null) { this.group.addChild(this); }
    // If no group was given, add the sprite to the world container
    else { this.world.addChild(this); }

    return this;
};

Domy.Sprite.prototype =
{
    /**
     * Kills the sprite. Just a placeholder for now. Will be used as a soft destroy for object pooling.
     *
     * @method Domy.Sprite#kill
     */
    kill()
    {
        this.alive = false;
        this.destroy();
    },

    /**
     * Destroys the sprite and removes it entirely from the game world.
     *
     * @method Domy.Sprite#destroy
     */
    destroy()
    {
        // If in group, remove it there
        if (this.group !== null)
        {
            this.group.removeChild(this);
        }
        // If not in group, remove it from world container
        else
        {
            this.world.removeChild(this);
        }

        // Remove the HTML element
        this.game.parent.removeChild(this.image);

        return this;
    },

    // Changes the width of the sprite
    setWidth(width)
    {
        this.width = width;
        this.image.style.width = value + "px";

        return this;
    },

    // Changes the height of the sprite
    setHeight(height)
    {
        this.width = height;
        this.image.style.height = value + "px";

        return this;
    },

    // Changes shown frame of spritesheet
    setFrame(frame)
    {
        frame = this.game.cache.images[this.key].frames[frame];
        this.image.style.backgroundPosition = frame.x + "px " + frame.y + "px";

        return this;
    },

    /**
     * The update loop of the sprite. Happens automatically.
     * @method Domy.Sprite#update
     * @private
     */
    update()
    {
        // Store some variables for faster accessing
        let thisWidth    = this.width  * this.anchor.x;
        let thisHeight   = this.height * this.anchor.y;
        let worldWidth   = this.world.width;
        let worldHeight  = this.world.height;
        let cameraX      = this.camera.x;
        let cameraY      = this.camera.y;
        let cameraWidth  = this.camera.width;
        let cameraHeight = this.camera.height;

        // Physics
        if (this.body !== null)
        {
            // Reset body.touching
            this.body.touching.none   = true;
            this.body.touching.left   = false;
            this.body.touching.right  = false;
            this.body.touching.top    = false;
            this.body.touching.bottom = false;

            // Drag: Deceleration
            this.body.velocity.x *= (1 - this.body.drag.x);
            this.body.velocity.y *= (1 - this.body.drag.y);

            // Gravity
            this.body.velocity.x += this.body.gravity.x;
            this.body.velocity.y += this.body.gravity.y;

            // Moving
            this.x += this.time.delta * this.body.velocity.x;
            this.y += this.time.delta * this.body.velocity.y;

            // Let the sprite collide with the world bounds
            if (this.body.collideWorldBounds)
            {
                // Left, right, top, bottom
                if (this.x <= thisWidth)
                {
                    this.x = thisWidth;

                    this.body.touching.none = false;
                    this.body.touching.left = true;

                    // Bouncing
                    this.body.velocity.x = -(this.body.velocity.x * this.body.bounce.x);
                }

                if (this.x + thisWidth >= worldWidth)
                {
                    this.x = worldWidth - thisWidth;

                    this.body.touching.none = false;
                    this.body.touching.right = true;

                    // Bouncing
                    this.body.velocity.x = -(this.body.velocity.x * this.body.bounce.x);
                }

                if (this.y <= thisHeight)
                {
                    this.y = thisHeight;

                    this.body.touching.none = false;
                    this.body.touching.top = true;

                    // Bouncing
                    this.body.velocity.y = -(this.body.velocity.y * this.body.bounce.y);
                }

                if (this.y + thisHeight >= worldHeight)
                {
                    this.y = worldHeight - thisHeight;

                    this.body.touching.none = false;
                    this.body.touching.bottom = true;

                    // Bouncing
                    this.body.velocity.y = -(this.body.velocity.y * this.body.bounce.y);
                }
            }
        }

        // Check if inside camera bounds
        this.inCamera = false;
        if (this.x >= cameraX
         && this.y >= cameraY
         && this.x <= cameraWidth
         && this.y <= cameraHeight)
        {
            this.inCamera = true;
        }

        // Kill the sprite if it leaves the world bounds
        // >>>>>>>>>>>>>>>>>>>>> Bug! <<<<<<<<<<<<<<<<<<
        if (this.outOfBoundsKill)
        {
            // Left, right, top, bottom
            if (this.x < thisWidth
             || this.x > worldWidth  + thisWidth
             || this.y < thisHeight
             || this.y > worldHeight + thisHeight)
            {
                //this.kill();
            }
        }

        // Update some internal stuff
        this.position.x    = this.x;
        this.position.y    = this.y;
        this.bounds.x      = this.x;
        this.bounds.y      = this.y;
        this.bounds.width  = this.width;
        this.bounds.height = this.height;
        this.left          = this.x - (this.width  * this.anchor.x);
        this.right         = this.x + (this.width  * this.anchor.x);
        this.top           = this.y - (this.height * this.anchor.y);
        this.bottom        = this.y + (this.height * this.anchor.y);

        // Collect all transforms and apply them in the render function
        this.transform = "";
        let x = Math.round(this.x - thisWidth);
        let y = Math.round(this.y - thisHeight);
        this.transform += "translate(" + x + "px," + y + "px)";

        return this;
    },

    /**
     * The render loop of the sprite. Happens automatically.
     * @method Domy.Sprite#render
     * @private
     */
    render()
    {
        if (this.inCamera)
        {
            this.image.style.transform = this.transform;
            this.image.style.opacity = this.alpha;
        }
    }
};

Domy.Sprite.prototype.constructor = Domy.Sprite;

/**
 * The Time container stores the current time, the time the game has started at and the delta time for animating.
 * @class Domy.Time
 * @constructor
 * @param {Domy.Game} game - The core game object.
 */
Domy.Time = function(game)
{
    this.game = game;

    this.started = Date.now();
    this.sinceStart = 0;
    this.now = Date.now();

    return this;
};

Domy.Time.prototype =
{
    /**
     * The update loop of the time object. Happens automatically.
     * @method Domy.Time#update
     * @private
     */
    update(delta)
    {
        this.sinceStart = Date.now() - this.started;
        this.now = Date.now();
        this.delta = delta / 1000;

        return this;
    }
};

Domy.Time.prototype.constructor = Domy.Time;

/**
 * The Math object offers various standard math functions like measuring a distance.
 *
 * @class Domy.Math
 * @static
 */
Domy.Math = {

    /**
    * PI.
    * @property {number} Domy.Math#PI
    * @type {number}
    */
    PI: Math.PI,

    /**
    * Twice PI.
    * @property {number} Domy.Math#PI2
    * @type {number}
    */
    PI2: Math.PI * 2,

    /**
    * Degrees to Radians factor.
    * @property {number} Domy.Math#DEG_TO_RAD
    */
    DEG_TO_RAD: Math.PI / 180,

    /**
    * Degrees to Radians factor.
    * @property {number} Domy.Math#RAD_TO_DEG
    */
    RAD_TO_DEG: 180 / Math.PI,

    /**
    * Convert degrees to radians.
    *
    * @method Domy.Math#degToRad
    * @param {number} degrees - Angle in degrees.
    * @return {number} Angle in radians.
    */
    degToRad(degrees)
    {
        return degrees * Domy.Math.DEG_TO_RAD;
    },

    /**
    * Convert radians to degrees.
    *
    * @method Domy.Math#radToDeg
    * @param {number} radians - Angle in radians.
    * @return {number} Angle in degrees.
    */
    radToDeg(radians)
    {
        return radians * Domy.Math.RAD_TO_DEG;
    },

    /**
    * Returns an integer between (including) min and (including) max
    *
    * @method Domy.Math#integerInRange
    * @param {number} min - Min.
    * @param {number} max - Max.
    * @return {number}
    */
    integerInRange(min, max)
    {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /** Returns the direction between two poins in degrees */
    angleBetweenPoints(x1, y1, x2, y2)
    {
        return Math.atan2(y2 - y1, x2 - x1) * Domy.Math.RAD_TO_DEG;
    },

    /** Returns the distance between two vectors */
    distanceBetweenPoints(x1, y1, x2, y2)
    {
        return Math.hypot(x2 - x1, y2 - y1);
    }
};

/**
 * The Sound object offers audio functions.
 * @class Domy.Sound
 * @constructor
 * @static
 */
Domy.Sound = {};

/** Plays an audio file */
Domy.Sound.play = function(file, loop)
{
    var file = Domy.Sounds[file];
    if (! file.paused)
    {
        file.pause();
        file.currentTime = 0;
        file.play();
    }

    else
    {
        file.play();
    }

    // Music?
    if (loop !== undefined)
    {
        file.loop = loop;
    }
};

// Physics

/**
 * The Physics object offers physics related functions like collision detection.
 * @class Domy.Physics
 * @constructor
 * @static
 */
Domy.Physics =
{
    /** Rectangle collision */
    intersectRectangle(a, b)
    {
        let ax = a.x;
        let ay = a.y;
        let aw = a.width;
        let ah = a.height;
        let bx = b.x;
        let by = b.y;
        let bw = b.width;
        let bh = b.height;

        return !(ax + aw > bx
              || ay + ah > by
              || bx + aw > ax
              || by + ah > ay);
    },

    /** Circle collision */
    intersectCircle(a, b)
    {
        let x = a.x - b.x;
        let y = a.y - b.y;
        let r = (a.width * 0.5) + (b.width * 0.5);
        return (x * x) + (y * y) < (r * r);
    }
}

/**
 * Creates a physics body.
 *
 * @constructor
 * @param {number} x - X position relative to the sprite.
 * @param {number} y - Y position relative the sprite.
 */
Domy.Physics.Body = function(x, y)
{
    this.x = x || 0;
    this.y = y || 0;

    this.collideWorldBounds = false;

    this.velocity = new Domy.Point(0, 0);
    this.bounce   = new Domy.Point(0, 0);
    this.drag     = new Domy.Point(0, 0);
    this.gravity  = new Domy.Point(0, 0);

    this.touching =
    {
        none:   true,
        left:   false,
        right:  false,
        top:    false,
        bottom: false
    };

    return this;
};

Domy.Physics.Body.prototype =
{

};

Domy.Physics.Body.prototype.constructor = Domy.Physics.Body;

/**
 * The global cache object where all loaded assets are stored.

 * @constructor
 * @param {object} - The core game object.
 */
Domy.Cache = function(game)
{
    this.game = game;
};

Domy.Cache.prototype =
{
    images: {}
};

Domy.Cache.prototype.constructor = Domy.Cache;

/**
 * Creates a point.
 *
 * @constructor
 * @param {number} x
 * @param {number} y
 */
Domy.Point = function(x, y)
{
    this.setTo(x, y);

    return this;
};

Domy.Point.prototype =
{
    /**
     * Sets the point up.
     * @param {number} x
     * @param {number} y
     */
    setTo(x, y)
    {
       this.x = x || 0;
       this.y = y || 0;

       return this;
    }
};

/**
 * Creates a rectangle.
 *
 * @constructor
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 */
Domy.Rectangle = function(x, y, width, height)
{
    this.setTo(x, y, width, height);

    return this;
};

Domy.Rectangle.prototype =
{
    /**
     * Sets the rectangle up.
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    setTo(x, y, width, height)
    {
       this.x = x || 0;
       this.y = y || 0;
       this.width = width || 0;
       this.height = height || 0;

       return this;
   }
};

/**
 * Creates a circle.
 *
 * @constructor
 * @param {number} x
 * @param {number} y
 * @param {number} diameter
 */
Domy.Circle = function(x, y, diameter)
{
    this.setTo(x, y, diameter);

    return this;
};

Domy.Circle.prototype =
{
    /**
     * Sets the circle up.
     * @param {number} x
     * @param {number} y
     * @param {number} diameter
     */
    setTo(x, y, diameter)
    {
       this.x = x || 0;
       this.y = y || 0;
       this.diameter = diameter || 0;
       this.radius = diameter * 0.5;

       return this;
   }
};

/**
 * The object factory lets one create sprites and other game objects
 *
 * @constructor
 * @param {Domy.Game} game - The core game object.
 */
Domy.ObjectFactory = function(game)
{
    this.game = game;

    return this;
};

Domy.ObjectFactory.prototype =
{
    /**
     * Creates a sprite.
     * @method Domy.ObjectFactory#sprite
     */
    sprite(x, y, key, frame)
    {
        return new Domy.Sprite(this.game, x, y, key, frame);
    },

    /**
     * Creates a group.
     * @method Domy.ObjectFactory#group
     */
    group()
    {
        return new Domy.Group(this.game);
    }
};

Domy.ObjectFactory.prototype.constructor = Domy.ObjectFactory;

/**
 * A very basic Asset loader without progess functions. Yet.
 *
 * @constructor
 * @param {Domy.Game} game - The core game object.
 */
Domy.Loader = function(game)
{
    this.game = game;

    return this;
};

Domy.Loader.prototype =
{
    /**
     * Loads an simple image.
     * @method Domy.Loader#image
     */
    image(key, path)
    {
        let that = this;
        let img = new Image();
        img.src = path;
        img.onerror = function(event)
        {
            delete that.game.cache.images[key];
        }
        this.game.cache.images[key] = img;
    },

    /**
     * Loads a spritesheet.
     * @method Domy.Loader#spritesheet
     */
    spritesheet(key, path, frameWidth, frameHeight, frameIndexes)
    {
        let that = this;
        frameWidth   = frameWidth   || 32;
        frameHeight  = frameHeight  || 32
        frameIndexes = frameIndexes || Infinity;

        let img = new Image();
        img.src = path;
        img.onload = function()
        {
            // Save frames for spritesheet animation
            let frames = [];
            let frameFound = 0;

            for (let x = 0; x < that.width; x += frameWidth)
            {
                for (let y = 0; y < that.height; y += frameHeight)
                {
                    frameFound += 1;
                    if (frameFound === frameIndexes) break;
                    {
                        frames.push(
                        {
                            x: -x,
                            y: -y
                        });
                    }
                }
            }

            that.game.cache.images[key].frames = frames;
        }

        this.game.cache.images[key] = img;
        this.game.cache.images[key].frames = [];
        this.game.cache.images[key].frameWidth = frameWidth;
        this.game.cache.images[key].frameHeight = frameHeight;
    }
};

Domy.ObjectFactory.prototype.constructor = Domy.ObjectFactory;

/**
 * Keyboard controls. Just a placeholder for now.

 * @constructor
 * @param {Domy.Game} game - The core game object.
 */
Domy.Keyboard = function(game)
{
    this.isDown = {};
    this.isPressed = {};
    this.isUp = {};

    // Internal values
    this.game = game;

    // Set all buttons to false
    for (let i = 0; i < 200; i++)
    {
        this.isDown[i]    = false;
        this.isPressed[i] = false;
        this.isUp[i]      = false;
    }

    // Add the event listeners for the mouse to the game container
    let gameDiv = this.game.parent;
    let that = this;
    window.addEventListener('keydown', function(event)
    {
        that.isDown[event.keyCode]    = true;
        that.isPressed[event.keyCode] = false;
        that.isUp[event.keyCode]      = false;
    }, false);

    window.addEventListener('keypress', function(event)
    {
        that.isDown[event.keyCode]    = true;
        that.isPressed[event.keyCode] = true;
        that.isUp[event.keyCode]      = false;
    }, false);

    window.addEventListener('keyup', function(event)
    {
        that.isDown[event.keyCode]    = false;
        that.isPressed[event.keyCode] = false;
        that.isUp[event.keyCode]      = true;
    }, false);

    return this;
};

Domy.Keyboard.prototype =
{
    isDown(key)
    {

    },

    isUp(key)
    {

    }
};

Domy.Keyboard.prototype.constructor = Domy.Keyboard;

/**
 * @class Domy.KeyCode
 */
Domy.KeyCode =
{
    /** @static */
    A: "A".toUpperCase().charCodeAt(0),
    /** @static */
    B: "B".toUpperCase().charCodeAt(0),
    /** @static */
    C: "C".toUpperCase().charCodeAt(0),
    /** @static */
    D: "D".toUpperCase().charCodeAt(0),
    /** @static */
    E: "E".toUpperCase().charCodeAt(0),
    /** @static */
    F: "F".toUpperCase().charCodeAt(0),
    /** @static */
    G: "G".toUpperCase().charCodeAt(0),
    /** @static */
    H: "H".toUpperCase().charCodeAt(0),
    /** @static */
    I: "I".toUpperCase().charCodeAt(0),
    /** @static */
    J: "J".toUpperCase().charCodeAt(0),
    /** @static */
    K: "K".toUpperCase().charCodeAt(0),
    /** @static */
    L: "L".toUpperCase().charCodeAt(0),
    /** @static */
    M: "M".toUpperCase().charCodeAt(0),
    /** @static */
    N: "N".toUpperCase().charCodeAt(0),
    /** @static */
    O: "O".toUpperCase().charCodeAt(0),
    /** @static */
    P: "P".toUpperCase().charCodeAt(0),
    /** @static */
    Q: "Q".toUpperCase().charCodeAt(0),
    /** @static */
    R: "R".toUpperCase().charCodeAt(0),
    /** @static */
    S: "S".toUpperCase().charCodeAt(0),
    /** @static */
    T: "T".toUpperCase().charCodeAt(0),
    /** @static */
    U: "U".toUpperCase().charCodeAt(0),
    /** @static */
    V: "V".toUpperCase().charCodeAt(0),
    /** @static */
    W: "W".toUpperCase().charCodeAt(0),
    /** @static */
    X: "X".toUpperCase().charCodeAt(0),
    /** @static */
    Y: "Y".toUpperCase().charCodeAt(0),
    /** @static */
    Z: "Z".toUpperCase().charCodeAt(0),
    /** @static */
    ZERO: "0".charCodeAt(0),
    /** @static */
    ONE: "1".charCodeAt(0),
    /** @static */
    TWO: "2".charCodeAt(0),
    /** @static */
    THREE: "3".charCodeAt(0),
    /** @static */
    FOUR: "4".charCodeAt(0),
    /** @static */
    FIVE: "5".charCodeAt(0),
    /** @static */
    SIX: "6".charCodeAt(0),
    /** @static */
    SEVEN: "7".charCodeAt(0),
    /** @static */
    EIGHT: "8".charCodeAt(0),
    /** @static */
    NINE: "9".charCodeAt(0),
    /** @static */
    NUMPAD_0: 96,
    /** @static */
    NUMPAD_1: 97,
    /** @static */
    NUMPAD_2: 98,
    /** @static */
    NUMPAD_3: 99,
    /** @static */
    NUMPAD_4: 100,
    /** @static */
    NUMPAD_5: 101,
    /** @static */
    NUMPAD_6: 102,
    /** @static */
    NUMPAD_7: 103,
    /** @static */
    NUMPAD_8: 104,
    /** @static */
    NUMPAD_9: 105,
    /** @static */
    NUMPAD_MULTIPLY: 106,
    /** @static */
    NUMPAD_ADD: 107,
    /** @static */
    NUMPAD_ENTER: 108,
    /** @static */
    NUMPAD_SUBTRACT: 109,
    /** @static */
    NUMPAD_DECIMAL: 110,
    /** @static */
    NUMPAD_DIVIDE: 111,
    /** @static */
    F1: 112,
    /** @static */
    F2: 113,
    /** @static */
    F3: 114,
    /** @static */
    F4: 115,
    /** @static */
    F5: 116,
    /** @static */
    F6: 117,
    /** @static */
    F7: 118,
    /** @static */
    F8: 119,
    /** @static */
    F9: 120,
    /** @static */
    F10: 121,
    /** @static */
    F11: 122,
    /** @static */
    F12: 123,
    /** @static */
    F13: 124,
    /** @static */
    F14: 125,
    /** @static */
    F15: 126,
    /** @static */
    COLON: 186,
    /** @static */
    EQUALS: 187,
    /** @static */
    COMMA: 188,
    /** @static */
    UNDERSCORE: 189,
    /** @static */
    PERIOD: 190,
    /** @static */
    QUESTION_MARK: 191,
    /** @static */
    TILDE: 192,
    /** @static */
    OPEN_BRACKET: 219,
    /** @static */
    BACKWARD_SLASH: 220,
    /** @static */
    CLOSED_BRACKET: 221,
    /** @static */
    QUOTES: 222,
    /** @static */
    BACKSPACE: 8,
    /** @static */
    TAB: 9,
    /** @static */
    CLEAR: 12,
    /** @static */
    ENTER: 13,
    /** @static */
    SHIFT: 16,
    /** @static */
    CONTROL: 17,
    /** @static */
    ALT: 18,
    /** @static */
    CAPS_LOCK: 20,
    /** @static */
    ESC: 27,
    /** @static */
    SPACEBAR: 32,
    /** @static */
    PAGE_UP: 33,
    /** @static */
    PAGE_DOWN: 34,
    /** @static */
    END: 35,
    /** @static */
    HOME: 36,
    /** @static */
    LEFT: 37,
    /** @static */
    UP: 38,
    /** @static */
    RIGHT: 39,
    /** @static */
    DOWN: 40,
    /** @static */
    PLUS: 43,
    /** @static */
    MINUS: 44,
    /** @static */
    INSERT: 45,
    /** @static */
    DELETE: 46,
    /** @static */
    HELP: 47,
    /** @static */
    NUM_LOCK: 144
};

// Duplicate Domy.KeyCode values in Domy.Keyboard for compatibility
for (var key in Domy.KeyCode)
{
    if (Domy.KeyCode.hasOwnProperty(key) && !key.match(/[a-z]/))
    {
        Domy.Keyboard[key] = Domy.KeyCode[key];
    }
}

/**
 * This class handles all mouse interactions (but the mouse wheel, yet).
 *
 * @constructor
 * @param {Domy.Game} game - The core game object.
 */
Domy.Mouse = function(game)
{
    this.x = 0;
    this.y = 0;
    this.isDown = [];
    this.isUp = [];

    // Internal values
    this.game = game;

    // Add the event listeners for the mouse to the game container
    let gameDiv = this.game.parent;
    let that = this;

    gameDiv.addEventListener("mousemove", function(event)
    {
        that.x = event.offsetX;
        that.y = event.offsetY;
    }, true);

    gameDiv.addEventListener("mousedown", function(event)
    {
        that.isDown[event.button] = true;
        that.isUp[event.button]   = false;
    }, true);

    gameDiv.addEventListener("mouseup",   function(event)
    {
        that.isDown[event.button] = false;
        that.isUp[event.button]   = true;
    }, true);

    return this;
}

Domy.Mouse.LEFT_BUTTON = 0;
Domy.Mouse.MIDDLE_BUTTON = 1;
Domy.Mouse.RIGHT_BUTTON = 2;

// The stuff below is not working yet
Domy.Mouse.prototype =
{
    onMouseMove(event)
    {
        this.x = event.offsetX;
        this.y = event.offsetY;
    },

    onMouseDown(event)
    {
        this.isDown[event.button] = true;
        this.isUp[event.button]   = false;
    },

    onMouseUp(event)
    {
        this.isDown[event.button] = false;
        this.isUp[event.button]   = true;
    }
};

Domy.Mouse.prototype.constructor = Domy.Mouse;

/**
 * mainloop.js 1.0.3-20170529
 *
 * @author Isaac Sukin (http://www.isaacsukin.com/)
 * @license MIT
 */

!function(a){function b(a){if(x=q(b),!(a<e+l)){for(d+=a-e,e=a,t(a,d),a>i+h&&(f=g*j*1e3/(a-i)+(1-g)*f,i=a,j=0),j++,k=0;d>=c;)if(u(c),d-=c,++k>=240){o=!0;break}v(d/c),w(f,o),o=!1}}var c=1e3/60,d=0,e=0,f=60,g=.9,h=1e3,i=0,j=0,k=0,l=0,m=!1,n=!1,o=!1,p="object"==typeof window?window:a,q=p.requestAnimationFrame||function(){var a=Date.now(),b,d;return function(e){return b=Date.now(),d=Math.max(0,c-(b-a)),a=b+d,setTimeout(function(){e(b+d)},d)}}(),r=p.cancelAnimationFrame||clearTimeout,s=function(){},t=s,u=s,v=s,w=s,x;a.MainLoop={getSimulationTimestep:function(){return c},setSimulationTimestep:function(a){return c=a,this},getFPS:function(){return f},getMaxAllowedFPS:function(){return 1e3/l},setMaxAllowedFPS:function(a){return"undefined"==typeof a&&(a=1/0),0===a?this.stop():l=1e3/a,this},resetFrameDelta:function(){var a=d;return d=0,a},setBegin:function(a){return t=a||t,this},setUpdate:function(a){return u=a||u,this},setDraw:function(a){return v=a||v,this},setEnd:function(a){return w=a||w,this},start:function(){return n||(n=!0,x=q(function(a){v(1),m=!0,e=a,i=a,j=0,x=q(b)})),this},stop:function(){return m=!1,n=!1,r(x),this},isRunning:function(){return m}},"function"==typeof define&&define.amd?define(a.MainLoop):"object"==typeof module&&null!==module&&"object"==typeof module.exports&&(module.exports=a.MainLoop)}(this);