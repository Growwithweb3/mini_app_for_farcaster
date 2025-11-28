// Enemy factory - creates enemies based on level

import { Enemy, EnemyConfig } from './Enemy';
import { EnemyType } from './types';

export class EnemyFactory {
  // Enemy configurations per level
  private static enemyConfigs: Record<number, Record<EnemyType, EnemyConfig>> = {
    1: {
      [EnemyType.STARKENT]: {
        type: EnemyType.STARKENT,
        health: 30,
        speed: 2,
        imagePath: '/images/starkent-the-enemy.png',
        width: 50,
        height: 50,
        canShoot: false,
        shootInterval: 0,
        level: 1,
      },
      [EnemyType.SCROLL]: {
        type: EnemyType.SCROLL,
        health: 30,
        speed: 2,
        imagePath: '/images/scroll-the-enemy.jpg',
        width: 50,
        height: 50,
        canShoot: false,
        shootInterval: 0,
        level: 1,
      },
      [EnemyType.ZKSYN]: {
        type: EnemyType.ZKSYN,
        health: 30,
        speed: 2,
        imagePath: '/images/zksyn-the-enemy.jpg',
        width: 50,
        height: 50,
        canShoot: false,
        shootInterval: 0,
        level: 1,
      },
      [EnemyType.TAIKO]: {
        type: EnemyType.TAIKO,
        health: 30,
        speed: 2,
        imagePath: '/images/taiko-the-enemy.png',
        width: 50,
        height: 50,
        canShoot: false,
        shootInterval: 0,
        level: 1,
      },
    },
    2: {
      [EnemyType.LINEA]: {
        type: EnemyType.LINEA,
        health: 50,
        speed: 3,
        imagePath: '/images/linea-the-enemy.png',
        width: 55,
        height: 55,
        canShoot: true,
        shootInterval: 2000, // 2 seconds
        level: 2,
      },
      [EnemyType.OP]: {
        type: EnemyType.OP,
        health: 50,
        speed: 3,
        imagePath: '/images/op-the-enemy.jpg',
        width: 55,
        height: 55,
        canShoot: true,
        shootInterval: 2000,
        level: 2,
      },
    },
    3: {
      [EnemyType.ARB]: {
        type: EnemyType.ARB,
        health: 100,
        speed: 1.5,
        imagePath: '/images/arb-the-enemy.jpg',
        width: 70,
        height: 70,
        canShoot: true,
        shootInterval: 1500, // 1.5 seconds
        level: 3,
      },
      [EnemyType.POLYGON]: {
        type: EnemyType.POLYGON,
        health: 100,
        speed: 1.5,
        imagePath: '/images/polygon-the-enemy.jpg',
        width: 70,
        height: 70,
        canShoot: true,
        shootInterval: 1500,
        level: 3,
      },
    },
  };

  // Get all enemy types for a level
  static getEnemyTypesForLevel(level: number): EnemyType[] {
    const configs = this.enemyConfigs[level];
    return configs ? Object.keys(configs) as EnemyType[] : [];
  }

  // Create a random enemy for a level
  static createRandomEnemy(level: number, canvasWidth: number, canvasHeight: number): Enemy | null {
    const configs = this.enemyConfigs[level];
    if (!configs) return null;

    const enemyTypes = Object.keys(configs) as EnemyType[];
    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const config = configs[randomType];

    return new Enemy(config, canvasWidth, canvasHeight);
  }

  // Create a specific enemy type
  static createEnemy(
    type: EnemyType,
    level: number,
    canvasWidth: number,
    canvasHeight: number
  ): Enemy | null {
    const configs = this.enemyConfigs[level];
    if (!configs || !configs[type]) return null;

    return new Enemy(configs[type], canvasWidth, canvasHeight);
  }
}

