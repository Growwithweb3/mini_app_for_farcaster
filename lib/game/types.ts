// Game types and interfaces

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface Size {
  width: number;
  height: number;
}

export enum EnemyType {
  // Level 1 (Easy) - No guns, melee only
  STARKENT = 'starkent',
  SCROLL = 'scroll',
  ZKSYN = 'zksyn',
  TAIKO = 'taiko',
  // Level 2 (Medium) - Have guns, shoot player
  LINEA = 'linea',
  OP = 'op',
  // Level 3 (Hard) - Tanks/bombs
  ARB = 'arb',
  POLYGON = 'polygon',
}

export interface EnemyConfig {
  type: EnemyType;
  health: number;
  speed: number;
  imagePath: string;
  width: number;
  height: number;
  canShoot: boolean;
  shootInterval: number;
  level: number;
  bulletsPerShot?: number; // Number of bullets to shoot at once (default: 1)
  bulletSpeed?: number; // Speed of enemy bullets (default: 4)
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isPlayerBullet: boolean;
  damage: number;
}

export interface GameState {
  score: number;
  level: number;
  playerHealth: number;
  maxPlayerHealth: number;
  isGameOver: boolean;
  isPaused: boolean;
  levelStartTime: number;
  levelDuration: number;
}

