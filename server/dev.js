const { EventEmitter } = require('events');
const AWSMock = require('mock-aws-s3');
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const bcrypt = require('bcrypt');
const createServer = require('./server');
const db = require('./models');

const allPlayerInfo = [
  {
    name: 'alpha', password: bcrypt.hashSync('alpha', 10), email: 'alpha@alpha.com', role: 'admin',
  },
  {
    name: 'beta', password: bcrypt.hashSync('beta', 10), email: 'beta@alpha.com', role: 'admin',
  },
  {
    name: 'gamma', password: bcrypt.hashSync('gamma', 10), email: 'gamma@alpha.com', role: 'admin',
  },
  {
    name: 'delta', password: bcrypt.hashSync('delta', 10), email: 'delta@alpha.com', role: 'admin',
  },
];

const colors = [null, 'red', 'green', 'blue', 'purple'];

if (!process.env.GAME) {
  console.error('expected GAME to be defined in the environment');
  process.exit(1);
}

const gameName = process.env.GAME;
const gamePath = path.resolve(__dirname, path.join('..', gameName));

if (!fs.existsSync(gamePath)) {
  console.error(`expected game ${gameName} to exist at ${gamePath}`);
  process.exit(1);
}

function modifyBuild(config) {
  config.watch = true;
  config.watchOptions = {
    followSymlinks: true,
  };
}

async function build() {
  const serverConfig = require(path.join(gamePath, 'server', 'webpack.config.js'));
  const clientConfig = require(path.join(gamePath, 'client', 'webpack.config.cjs'));

  modifyBuild(serverConfig);
  modifyBuild(clientConfig);

  const emitter = new EventEmitter();

  await new Promise((resolve) => {
    let resolved = false;
    webpack(serverConfig, async () => {
      if (resolved) {
        await db.SessionAction.destroy({ truncate: true });
        return emitter.emit('update');
      }
      resolved = true;
      resolve();
    });
  });

  await new Promise((resolve) => {
    let resolved = false;
    webpack(clientConfig, () => {
      if (resolved) {
        return emitter.emit('update');
      }
      resolved = true;
      resolve();
    });
  });

  return emitter;
}

async function run() {
  const numberOfPlayers = parseInt(process.env.PLAYERS_NUM || 2, 10);
  const playerInfo = allPlayerInfo.slice(0, numberOfPlayers);
  if (!(await db.User.findOne())) {
    const players = await Promise.all(playerInfo.map(info => db.User.create(info)));
    let game
    const games = fs.readFileSync('../GAMES').toString().split("\n").filter(g=>g!=="")
    await Promise.all(games.map(async g => {
      const info = require(path.join('..', g, 'info.json'));
      if (g == gameName) {
        const gameDb = await db.Game.create({
          name: g,
          friendlyName: info.name,
          description: info.description,
        });

        game = gameDb;
      }
    }));

    const gameVersion = await db.GameVersion.create({
      gameId: game.id,
      version: 0,
      clientDigest: 'build',
      serverDigest: 'build',
      notes: `Bunch of smaller quality-of-life fixes are live now, as promised:

**Four Souls**
- Eternal is automatically selected along with the character
- Additional Eternals are included for characters that have alt art variants
- Eternals and characters stay on the board for Clicker
- Board start has fewer decks to hopefully remove confusion
- Bonus souls can be replaced before play starts

**General**
- Better rearrangement of items in splayed space (e.g. cards in your hand)
- Better translation of drag location when scaling the play area
      `,
    });
  }
  const buildHandle = await build();
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const secretKey = process.env.SECRET_KEY || 'some secret';
  const port = parseInt(process.env.PORT || 3000);
  AWSMock.config.basePath = path.resolve(__dirname, '..', '..');
  const bucketName = path.basename(path.resolve(__dirname, '..'));
  const s3Provider = AWSMock.S3({
    params: { Bucket: bucketName },
  });
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

  const server = createServer({
    secretKey, rabbitmqUrl, s3Provider,
  });
  console.log(`🎲🎲🎲 Ready on port ${port} 🎲🎲🎲`);
  const serverHandle = server.listen(port);
  buildHandle.on('update', async () => {
    await serverHandle.reload();
  });
}

if (process.env.NODE_ENV !== 'development') {
  console.error('this can only be run when NODE_ENV is set to development');
  process.exit(1);
}

run();
