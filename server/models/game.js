module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.define('Game', {
    name: DataTypes.STRING,
  });
  Game.associate = function (models) {
    models.Game.hasMany(models.GameVersion, { foreignKey: 'gameId' });
  };

  Game.prototype.latestStableVersion = async function () {
    const gameVersions = await this.getGameVersions({ where: { beta: false }, limit: 1, order: [['version', 'desc']] });
    return gameVersions[0];
  };

  Game.prototype.latestVersion = async function () {
    const gameVersions = await this.getGameVersions({ limit: 1, order: [['version', 'desc']] });
    return gameVersions[0];
  };

  return Game;
};
