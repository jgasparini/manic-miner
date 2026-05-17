import { LEVELS, TILE_SIZE } from '../constants.js';
import Enemy from '../entities/Enemy.js';

/**
 * Loads a TMX level (as JSON exported from Tiled) and returns all spawned objects.
 * Expected Tiled layers: Ground (tiles), Decoration (tiles), Collectibles (objects),
 * Enemies (objects), Portal (objects), PlayerStart (objects).
 */
export default class LevelManager {
  constructor(scene, physics) {
    this._scene = scene;
    this._physics = physics;
  }

  load(levelIndex) {
    const key = `map-${LEVELS[levelIndex]}`;
    const map = this._scene.make.tilemap({ key });
    const tileset = map.addTilesetImage('tileset-cave', 'tileset-cave');

    // Tile layers
    const decorLayer = map.createLayer('Decoration', tileset, 0, 0);
    const groundLayer = map.createLayer('Ground', tileset, 0, 0);
    groundLayer.setCollisionByExclusion([-1]);

    // Object layers
    const playerStart = this._getObjectLayerFirst(map, 'PlayerStart');
    const portalObj = this._getObjectLayerFirst(map, 'Portal');

    // Tiled shape-object y = top of rectangle → add half-height to get center
    const cx = (obj) => obj.x + obj.width / 2;
    const cy = (obj) => obj.y + obj.height / 2;

    const collectibles = this._scene.physics.add.staticGroup();
    this._spawnObjects(map, 'Collectibles', (obj) => {
      const item = collectibles.create(cx(obj), cy(obj), 'collectible');
      item.refreshBody();
    });

    const enemies = this._scene.physics.add.group({ runChildUpdate: true });
    this._spawnObjects(map, 'Enemies', (obj) => {
      const patrolDist = obj.properties?.find((p) => p.name === 'patrolDistance')?.value ?? 5;
      const enemy = new Enemy(this._scene, cx(obj), cy(obj), patrolDist, groundLayer);
      enemies.add(enemy, true);
    });

    // Portal sprite
    const portal = this._scene.physics.add.staticSprite(cx(portalObj), cy(portalObj), 'portal-closed');
    portal.refreshBody();

    // World + camera bounds
    this._scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this._scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    return {
      map,
      groundLayer,
      decorLayer,
      playerStart: { x: cx(playerStart), y: playerStart.y },
      collectibles,
      enemies,
      portal,
      totalItems: collectibles.getLength(),
    };
  }

  _getObjectLayerFirst(map, layerName) {
    const layer = map.getObjectLayer(layerName);
    if (!layer || !layer.objects.length) {
      throw new Error(`Tiled layer "${layerName}" is missing or empty`);
    }
    return layer.objects[0];
  }

  _spawnObjects(map, layerName, callback) {
    const layer = map.getObjectLayer(layerName);
    if (!layer) return;
    for (const obj of layer.objects) callback(obj);
  }
}
