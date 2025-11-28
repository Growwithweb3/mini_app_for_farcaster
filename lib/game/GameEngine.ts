// Main game engine - manages game state, entities, and game loop

import { Base } from './Base';
import { Enemy } from './Enemy';
import { EnemyFactory } from './EnemyFactory';
import { CollisionDetector } from './CollisionDetector';
import { Bullet, GameState, Position } from './types';

export class GameEngine {
  public base: Base;
  public enemies: Enemy[] = [];
  public bullets: Bullet[] = [];
  public gameState: GameState;
  public canvasWidth: number;
  public canvasHeight: number;
  private lastSpawnTime: number = 0;
  private spawnInterval: number = 2000; // 2 seconds default
  private levelDurations: Record<number, number> = {
    1: 30000, // 30 seconds
    2: 60000, // 60 seconds
    3: 40000, // 40 seconds
  };

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.base = new Base(canvasWidth, canvasHeight);
    this.gameState = {
      score: 0,
      level: 1,
      playerHealth: this.base.health,
      maxPlayerHealth: this.base.maxHealth,
      isGameOver: false,
      isPaused: false,
      levelStartTime: Date.now(),
      levelDuration: this.levelDurations[1],
    };
  }

  // Update game state (called every frame)
  update(): void {
    if (this.gameState.isPaused || this.gameState.isGameOver) {
      return;
    }

    const currentTime = Date.now();
    const levelElapsed = currentTime - this.gameState.levelStartTime;

    // Check if level time has elapsed
    if (levelElapsed >= this.gameState.levelDuration) {
      this.nextLevel();
      return;
    }

    // Spawn enemies based on level
    this.spawnEnemies(currentTime);

    // Update enemies
    this.enemies.forEach((enemy) => {
      enemy.update(this.canvasWidth, this.canvasHeight);

      // Enemy shoots at player
      if (enemy.canShoot(currentTime)) {
        const baseCenter = this.base.getCenter();
        const bullet = enemy.shoot(baseCenter);
        if (bullet) {
          this.bullets.push(bullet);
        }
      }

      // Check melee collision (Level 1 enemies)
      if (!enemy.config.canShoot && CollisionDetector.enemyBaseCollision(enemy, this.base)) {
        this.base.takeDamage(5);
        this.gameState.playerHealth = this.base.health;
        enemy.takeDamage(100); // Remove enemy after melee hit
      }
    });

    // Update bullets
    this.bullets.forEach((bullet) => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
    });

    // Remove off-screen bullets
    this.bullets = this.bullets.filter(
      (bullet) =>
        bullet.x > -50 &&
        bullet.x < this.canvasWidth + 50 &&
        bullet.y > -50 &&
        bullet.y < this.canvasHeight + 50
    );

    // Remove off-screen enemies
    this.enemies = this.enemies.filter((enemy) => !enemy.isOffScreen());

    // Check collisions: player bullets vs enemies
    this.bullets.forEach((bullet, bulletIndex) => {
      if (bullet.isPlayerBullet) {
        this.enemies.forEach((enemy, enemyIndex) => {
          if (CollisionDetector.bulletEnemyCollision(bullet, enemy)) {
            enemy.takeDamage(bullet.damage);
            this.bullets.splice(bulletIndex, 1);

            if (!enemy.isAlive()) {
              this.gameState.score += 10 * this.gameState.level;
              this.enemies.splice(enemyIndex, 1);
            }
          }
        });
      }
    });

    // Check collisions: enemy bullets vs Base
    this.bullets.forEach((bullet, bulletIndex) => {
      if (!bullet.isPlayerBullet) {
        if (CollisionDetector.bulletBaseCollision(bullet, this.base)) {
          this.base.takeDamage(bullet.damage);
          this.gameState.playerHealth = this.base.health;
          this.bullets.splice(bulletIndex, 1);

          if (!this.base.isAlive()) {
            this.gameState.isGameOver = true;
          }
        }
      }
    });

    // Update game state
    this.gameState.playerHealth = this.base.health;
  }

  // Spawn enemies based on level and time
  private spawnEnemies(currentTime: number): void {
    if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
      const enemy = EnemyFactory.createRandomEnemy(
        this.gameState.level,
        this.canvasWidth,
        this.canvasHeight
      );
      if (enemy) {
        this.enemies.push(enemy);
      }
      this.lastSpawnTime = currentTime;

      // Decrease spawn interval as level increases (more enemies)
      this.spawnInterval = Math.max(800, 2000 - (this.gameState.level - 1) * 200);
    }
  }

  // Move to next level
  nextLevel(): void {
    if (this.gameState.level < 3) {
      this.gameState.level++;
      this.enemies = [];
      this.bullets = [];
      this.gameState.levelStartTime = Date.now();
      this.gameState.levelDuration = this.levelDurations[this.gameState.level];
      this.lastSpawnTime = Date.now();
    } else {
      // Game completed
      this.gameState.isGameOver = true;
    }
  }

  // Player shoots
  shoot(): void {
    const center = this.base.getCenter();
    this.bullets.push({
      x: center.x,
      y: center.y,
      vx: 8,
      vy: 0,
      width: 10,
      height: 10,
      isPlayerBullet: true,
      damage: 20,
    });
  }

  // Draw everything on canvas
  draw(ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw background pattern (simple grid)
    ctx.strokeStyle = '#16213e';
    ctx.lineWidth = 1;
    for (let i = 0; i < this.canvasWidth; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, this.canvasHeight);
      ctx.stroke();
    }
    for (let i = 0; i < this.canvasHeight; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(this.canvasWidth, i);
      ctx.stroke();
    }

    // Draw Base
    this.base.draw(ctx);

    // Draw enemies
    this.enemies.forEach((enemy) => enemy.draw(ctx));

    // Draw bullets
    this.bullets.forEach((bullet) => {
      ctx.fillStyle = bullet.isPlayerBullet ? '#3B82F6' : '#EF4444';
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  }

  // Reset game
  reset(): void {
    this.base = new Base(this.canvasWidth, this.canvasHeight);
    this.enemies = [];
    this.bullets = [];
    this.gameState = {
      score: 0,
      level: 1,
      playerHealth: this.base.health,
      maxPlayerHealth: this.base.maxHealth,
      isGameOver: false,
      isPaused: false,
      levelStartTime: Date.now(),
      levelDuration: this.levelDurations[1],
    };
    this.lastSpawnTime = Date.now();
  }
}

