'use strict';

const AdmZip = require('adm-zip')
const fs = require('fs');
const path = require('path');

module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.define('Game', {
    content: DataTypes.BLOB,
    name: DataTypes.STRING,
    localDir: DataTypes.STRING,
    clientDigest: DataTypes.STRING,
    serverDigest: DataTypes.STRING,
  }, {
    getterMethods: {
      contentZip: function() {
        return new AdmZip(this.getDataValue('content'))
      },
    }
  });

  return Game;
};
