let player;
let zones = [];
let bullets = [];
let score = 0;
let scoreText;
let difficulty;

// main scene
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('player', 'assets/player.png');
        this.load.image('zone', 'assets/zone.png');
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('grass', 'assets/background.jpg');

        this.load.audio('music', 'assets/music.mp3')
        this.load.audio('scoreSound', 'assets/chick.mp3')
        this.load.audio('gameOverSound', 'assets/fail.mp3')
        this.load.audio('startGameSound', 'assets/rooster.mp3')
    }

    create() {
        zones = [];
        bullets = [];
        score = 0;
        difficulty = 1; 

        const background = this.add.image(0, 0, 'grass').setOrigin(0, 0);
        background.setDisplaySize(config.width, config.height);
        this.sound.play('startGameSound');

        this.sound.stopByKey('music');
        const music = this.sound.add('music', { loop: true });
        music.play();

        player = this.physics.add.sprite(400, 300, 'player');
        player.setDisplaySize(32, 32);
        player.body.setSize(11, 11);
        player.setCollideWorldBounds(true);

        scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

        spawnZone(this);

        this.time.addEvent({
            delay: 500/difficulty,
            callback: spawnBullet,
            callbackScope: this,
            loop: true
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            resetGame(this);
            this.scene.start('MainScene');
        });
    }

    update() {
        const cursors = this.input.keyboard.createCursorKeys();

        const playerSpeed = 300

        if (cursors.left.isDown) {
            player.setVelocityX(-playerSpeed);
        } else if (cursors.right.isDown) {
            player.setVelocityX(playerSpeed);
        } else {
            player.setVelocityX(0);
        }

        if (cursors.up.isDown) {
            player.setVelocityY(-playerSpeed);
        } else if (cursors.down.isDown) {
            player.setVelocityY(playerSpeed);
        } else {
            player.setVelocityY(0);
        }

        zones.forEach((zone, index) => {
            if (Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), zone.getBounds())) {
                zone.destroy();
                zones.splice(index, 1);
                score += 10;
                scoreText.setText(`Score: ${score}`);
                increaseDifficulty();

                this.sound.play('scoreSound');

                spawnZone(this);
            }
        });

        bullets.forEach((bullet, index) => {
            if (this.physics.world.overlap(player, bullet)) {
                this.sound.stopByKey('music');
                this.sound.play('gameOverSound');
                this.scene.start('GameOverScene', { score: score });
            }
        });
    }
}

// Game Over scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create(data) {
        this.add.text(400, 250, `Game Over\nScore: ${data.score}`, { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        const restartButton = this.add.text(400, 350, 'Press space to restart', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        restartButton.setInteractive();
        restartButton.on('pointerdown', () => {
            resetGame(this);
            this.scene.start('MainScene');
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            resetGame(this);
            this.scene.start('MainScene');
        });
    }
}

function resetGame(scene) {
    zones.forEach(zone => zone.destroy());
    zones = [];

    bullets.forEach(bullet => bullet.destroy());
    bullets = [];

    score = 0;
    difficulty = 1;
}

function spawnZone(scene) {
    const x = Phaser.Math.Between(50, 750);
    const y = Phaser.Math.Between(50, 550);
    const zone = scene.physics.add.sprite(x, y, 'zone');
    zone.setDisplaySize(32, 28);
    zones.push(zone);
}

function spawnBullet() {
    const minDistance = 400;

    const angle = Phaser.Math.Between(0, 360);

    const x = player.x + minDistance * Math.cos(Phaser.Math.DegToRad(angle));
    const y = player.y + minDistance * Math.sin(Phaser.Math.DegToRad(angle));

    const clampedX = Phaser.Math.Clamp(x, 0, 800);
    const clampedY = Phaser.Math.Clamp(y, 0, 600);

    let speed = 200 + difficulty;

    const bullet = this.physics.add.sprite(clampedX, clampedY, 'bullet');
    bullet.setDisplaySize(16, 16);
    this.physics.moveTo(bullet, player.x, player.y, speed);
    bullets.push(bullet);
}

function increaseDifficulty() {
    difficulty += 10;
    console.log(`Difficulté augmentée : ${difficulty}`);
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MainScene, GameOverScene]
};

const game = new Phaser.Game(config);