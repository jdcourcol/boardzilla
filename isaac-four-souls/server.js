/* global game */
game.minPlayers = 1;
game.maxPlayers = 4;

game.setupPlayerMat = mat => {
  const tableau = mat.addSpace('#tableau', 'area', {spreadX: 80});
  mat.addSpace('#hand', 'area', {spreadX: 80});
  tableau.addComponent('counter', {display: 'hp', initialValue: 2, max: 5});
  tableau.addComponent('counter', {display: 'coin', initialValue: 3, max: 50, x: 140, y: 0});
  tableau.addComponent('die', {faces: 6, x: 250, y: 0});
};

game.setupBoard = board => {
  const charactersDeck = board.addSpace('#characters', 'deck');
  characters.forEach(c => charactersDeck.addPiece("#" + c, 'card', {type: 'character'}))
  charactersDeck.shuffle()
  const eternalsDeck = board.addSpace('#eternals', 'deck');
  eternals.forEach(c => eternalsDeck.addPiece("#" + c, 'card', {type: 'eternal'}))
  eternalsDeck.shuffle()

  const lootDeck = board.addSpace('#loot', 'deck');
  Object.keys(loot).forEach(c => lootDeck.addPieces(loot[c], "#" + c, 'card', {type: 'loot'}))
  lootDeck.shuffle()
  board.addSpace('#loot-discard', 'deck');

  const treasureDeck = board.addSpace('#treasure', 'deck');
  treasure.forEach(c => treasureDeck.addPiece("#" + c, 'card', {type: 'treasure'}))
  treasureDeck.shuffle()
  board.addSpace('#treasure-discard', 'deck');
  board.addSpace('#shop', 'area', {spreadX: 80});

  const monsterDeck = board.addSpace('#monsters', 'deck');
  monsters.forEach(c => monsterDeck.addPiece("#" + c, 'card', {type: 'monster'}))
  monsterDeck.shuffle()
  board.addSpace('#monsters-discard', 'deck');
  board.addSpace('#dungeon', 'area', {spreadX: 80});
  board.addComponent('counter', {display: 'hp', max: 8});

  const bonus = board.addSpace('#bonusSouls', 'area', {spreadY: 40});
  let bonusY = 0;
  bonusSouls.forEach(c => bonus.addPiece("#" + c, 'card', {type: 'bonusSoul', x:0, y:(bonusY += 40)}))
};

game.hidden = () => `card[flipped], #player-mat:not(.mine) #hand card, #loot card, #treasure card, #monsters card, #characters card, #eternals card`;

game.play = async () => {
  game.playersMayAlwaysMove('.mine card, .mine counter, #board counter, .mine die, #shop card, #dungeon card, #bonusSouls card');
  game.playersMayAlwaysPlay(['setCounter', 'rollDie']);
  const allActions = Object.keys(game.actions);
  while(true) {
    await game.anyPlayerPlay(allActions);
  }
};

game.actions = {
  shuffle: {
    select: "deck",
    prompt: "Shuffle",
    action: deck => deck.shuffle(),
  },
  flip: {
    select: ".mine card",
    prompt: "Flip",
    action: card => card.set('flipped', !card.get('flipped'))
  },
  activate: {
    select: ".mine #tableau card:not([active]):not([flipped])",
    prompt: "Activate",
    key: "x",
    action: card => card.set('active', true)
  },
  deactivate: {
    prompt: "Deactivate",
    select: ".mine #tableau card[active]:not([flipped])",
    key: "x",
    action: card => card.set('active', false)
  },
  play: {
    prompt: "Play onto board",
    key: "d",
    drag: ".mine #hand card",
    onto: ".mine #tableau"
  },
  remove: {
    prompt: "Put back in your hand",
    drag: ".mine #tableau card",
    onto: ".mine #hand",
  },
  draw: {
    prompt: "Draw",
    drag: "deck card:nth-last-child(-n+2), #loot-discard card",
    key: "d",
    onto: ".mine #hand",
  },
  drawMultiple: {
    prompt: "Draw multiple",
    select: "deck",
    next: {
      prompt: "How many?",
      min: 2,
      max: 6,
      action: (deck, n) => deck.move('card', '.mine #hand', n),
    },
  },
  drawOne: {
    prompt: "Draw specific card",
    select: "deck",
    next: {
      prompt: "Select card",
      select: deck => deck.findAll("card").map(c => c.id),
      action: (deck, card) => deck.find(`card#${card}`).move('.mine #tableau'),
    }
  },
  purchase: {
    prompt: "Purchase",
    drag: "#shop card, #treasure card:nth-last-child(-n+2)",
    key: "p",
    onto: ".mine #tableau",
  },
  intoLootDeckTop: {
    prompt: "Put on top of deck",
    key: "t",
    drag: '.mine card[type="loot"], #loot-discard card',
    onto: '#loot',
  },
  intoLootDeckBottom: {
    prompt: "Put at bottom of deck",
    select: '.mine card[type="loot"]',
    action: card => card.moveToBottom('#loot')
  },
  discardLoot: {
    prompt: "Discard",
    key: "f",
    drag: '#loot card:nth-last-child(-n+2), .mine card[type="loot"]',
    onto: '#loot-discard',
  },
  playLoot: {
    prompt: "Play",
    key: "p",
    drag: '.mine card[type="loot"]',
    onto: '#loot-discard',
  },
  intoShop: {
    prompt: "Put into shop",
    key: "s",
    drag: '#treasure card:nth-last-child(-n+2), #treasure-discard card:nth-last-child(-n+2), .mine card[type="treasure"]',
    onto: '#shop',
  },
  discardTreasure: {
    prompt: "Discard",
    key: "f",
    drag: '#treasure card:nth-last-child(-n+2), #shop card:nth-last-child(-n+2), .mine card[type="treasure"]',
    onto: '#treasure-discard',
  },
  intoTreasureDeck: {
    prompt: "Put top of deck",
    key: "t",
    drag: '#treasure-discard card:nth-last-child(-n+2), #shop card:nth-last-child(-n+2), .mine card[type="treasure"]',
    onto: '#treasure',
  },
  intoTreasureDeckBottom: {
    prompt: "Put at bottom of deck",
    key: "b",
    select: '#treasure-discard card:nth-last-child(-n+2), #shop card:nth-last-child(-n+2), .mine card[type="treasure"]',
    action: card => card.moveToBottom('#treasure')
  },
  intoDungeon: {
    prompt: "Put into dungeon",
    key: "s",
    drag: 'card[type="monster"]',
    onto: '#dungeon',
  },
  takeMonster: {
    prompt: "Take",
    key: "d",
    drag: '#board card[type="monster"]',
    onto: '.mine #tableau',
  },
  giveMonster: {
    prompt: "Give to a player",
    key: "d",
    drag: '.mine card[type="monster"]',
    onto: '#player-mat:not(.mine) #tableau',
  },
  discardMonster: {
    prompt: "Discard",
    key: "f",
    drag: '#board card[type="monster"], .mine card[type="monster"]',
    onto: '#monsters-discard',
  },
  intoMonsterDeck: {
    prompt: "Put top of deck",
    key: "t",
    drag: '#board card[type="monster"], .mine card[type="monster"]',
    onto: '#monsters',
  },
  intoMonsterDeckBottom: {
    prompt: "Put at bottom of deck",
    key: "b",
    select: '#board card[type="monster"], .mine card[type="monster"]',
    action: card => card.moveToBottom('#monsters')
  },
  takeBonus: {
    prompt: "Take",
    key: "d",
    drag: "#bonusSouls card",
    onto: ".mine #tableau",
  },
  discardBonus: {
    prompt: "Discard",
    key: "f",
    drag: ".mine card[type='bonusSoul']",
    onto: "#bonusSouls",
  },
  giveTreasure: {
    prompt: "Give to player",
    promptOnto: "Which player",
    key: "g",
    drag: ".mine #tableau card",
    onto: "#player-mat:not(.mine) #tableau",
  },
  giveLoot: {
    prompt: "Give to player",
    promptOnto: "Which player",
    key: "g",
    drag: ".mine #hand card",
    onto: "#player-mat:not(.mine) #hand",
  },
  giveAllLoot: {
    prompt: "Give all cards to player",
    select: ".mine #hand card",
    next: {
      prompt: "Which player?",
      select: "#player-mat:not(.mine) #hand",
      action: (from, to) => from.parent().move('card', to),
    },
  },
  addCounter: {
    prompt: "Add counter",
    select: ".mine card",
    action: card => card.addComponent('counter', {max: 9}),
  },
  removeCounter: {
    prompt: "Remove counter",
    select: ".mine card counter",
    action: counter => counter.destroy(),
  },
  intoCharDeckTop: {
    prompt: "Put on top of deck",
    drag: '.mine card[type="character"]',
    onto: '#characters',
  },
  getCharDeck: {
    prompt: "Get characters",
    if: () => game.pile.find('card[type="character"]'),
    action: () => game.board.find('#characters').add('card[type="character"]'),
  },
  removeCharDeck: {
    prompt: "Remove characters",
    if: () => game.board.find('card[type="character"]'),
    action: () => game.board.find('#characters').clear('card[type="character"]'),
  },
  intoEternalDeckTop: {
    prompt: "Put on top of deck",
    drag: '.mine card[type="eternal"]',
    onto: '#eternals',
  },
  getEternalDeck: {
    prompt: "Get eternals",
    if: () => game.pile.find('card[type="eternal"]'),
    action: () => game.board.find('#eternals').add('card[type="eternal"]'),
  },
  removeEternalDeck: {
    prompt: "Remove eternals",
    if: () => game.board.find('card[type="eternal"]'),
    action: () => game.board.find('#eternals').clear('card[type="eternal"]'),
  },
};

const characters = [
  "Isaac",
  "Cain",
  "Maggy",
  "Judas",
  "Samson",
  "Eve",
  "Lilith",
  "Blue-Baby",
  "Lazarus",
  "The-Forgotten",
  "Eden",
  "The-Lost",
  "The-Keeper",
  "Azazel",
  "Apollyon",
  "Guppy",
  "Bum-bo",
  "Whore-of-Babylon",
  "Dark-Judas",
  "Tapeworm",
  "Bethany",
  "Jacob-Esau",
  "The-Broken",
  "The-Hoarder",
  "The-Dauntless",
  "The-Deceiver",
  "The-Savage",
  "The-Curdled",
  "The-Harlot",
  "The-Soiled",
  "The-Enigma",
  "The-Fettered",
  "The-Caprocious",
  "The-Baleful",
  "The-Miser",
  "The-Benighted",
  "The-Empty",
  "The-Zealot",
  "The-Derserter",
  "Ash",
  "Guy-spelunky",
  "The-Silent",
  "Captain-Viridian",
  "The-Knight",
  "Yung-Venuz",
  "Pink-Knight",
  "Boyfriend",
  "Psycho-Goreman",
  "Blind-Johnny",
  "Salad-Fingers",
  "Blue-Archer",
  "Quote",
  "Crewmate",
  "Bum-bo-the-weird",
  "Steven",
  "Abe",
  "Johnny",
  "Baba",
  "Edmund"
];

const eternals = [
  "Abyss",
  "Anima-sola",
  "Bag-o-Trash",
  "Bag-of-Crafting",
  "Ball-of-tumors",
  "Berserk",
  "Blood-Lust",
  "Book-of-Belial",
  "Book-of-Virtues",
  "Booster-v20",
  "Bow-and-arrow",
  "Ceremonial-blade",
  "Dark-Arts",
  "Emerganct-meetingjpg",
  "Flip",
  "Focus",
  "Football",
  "Forever-Alone",
  "Gello",
  "Gimpy",
  "Girlfriend",
  "Glitch",
  "Gravity",
  "Hemoptysis",
  "Holy-Mantle",
  "Hunky-boys",
  "Hypercoagulation",
  "IBS",
  "Incubus",
  "Infestation",
  "Is-you",
  "Johnnys-knives",
  "Keepers-bargain",
  "Lazarus-Rags",
  "Lemegton",
  "Lil-Steven",
  "Lollypop",
  "Lord-of-the-Pit",
  "Pile-o-bones",
  "Pink-Proglottid-Four-Souls-eternal-item",
  "Polar-star",
  "Pop-pop",
  "Possession",
  "Ring-of-the-snake",
  "Rusty-spoons",
  "Sibling-Rivalry",
  "Sleight-of-Hand",
  "Soulbond",
  "Spelunking-pack",
  "Spindown-dice",
  "Strange-marble",
  "Suptorium",
  "The-Bone",
  "The-Curse",
  "The-D6",
  "The-Revenant",
  "The-real-left-hand",
  "Void",
  "Wooden-Nickel",
  "Yum-Heart"
];

const loot = {
  "A-Penny": 11,
  "2-Cents": 17,
  "3-Cents": 21,
  "4-Cents": 13,
  "A-Nickel": 6,
  "A-Dime": 1,
  "Butter-Bean": 4,
  "Pills-Red": 1,
  "Pills-Blue": 1,
  "Pills-Yellow": 1,
  "Bomb": 6,
  "Gold-Bomb": 1,
  "Lil-Battery": 5,
  "Mega-Battery": 1,
  "Dice-Shard": 4,
  "Soul-Heart": 3,
  "Blank-Rune": 1,
  "Dagaz": 1,
  "Ehwaz": 1,
  "Bloody-Penny": 1,
  "Swallowed-Penny": 1,
  "Counterfeit-Penny": 1,
  "Cains-Eye": 1,
  "Broken-Ankh": 1,
  "Curved-Horn": 1,
  "Purple-Heart": 1,
  "Golden-Horseshoe": 1,
  "Guppys-Hairball": 1,
  "Lost-Soul": 1,
  "0-The-Fool": 1,
  "I-The-Magician": 1,
  "II-The-High-Priestess": 1,
  "III-The-Empress": 1,
  "IV-The-Emperor": 1,
  "V-The-Hierophant": 1,
  "VI-The-Lovers": 1,
  "VII-The-Chariot": 1,
  "VIII-Justice": 1,
  "IX-The-Hermit": 1,
  "X-Wheel-of-Fortune": 1,
  "XI-Strength": 1,
  "XII-The-Hanged-Man": 1,
  "XIII-Death": 1,
  "XIV-Temperance": 1,
  "XV-The-Devil": 1,
  "XVI-The-Tower": 1,
  "XVII-The-Stars": 1,
  "XVIII-The-Moon": 1,
  "XIX-The-Sun": 1,
  "XX-Judgement": 1,
  "XXI-The-World": 1,
  "Charged-Penny": 1,
  "Joker": 1,
  "Holy-Card": 1,
  "Two-of-Diamonds": 1,
  "A-Sack": 1,
  "Credit-Card": 1,
  "Jera": 1,
  "Pills-Purple": 1,
  "Pink-Eye": 1,
  "Cancer": 1,
  "Perthro": 1,
  "Ansuz": 1,
  "Black-Rune": 1,
  "Tape-Worm": 1,
  "AAA-Battery": 1,
  "Poker-Chip": 1,
  "The-Left-Hand": 1,
  "Pills-Black": 1,
  "Pills-Spots": 1,
  "Pills-White": 1,
  "Q-Card": 1,
  "Get-Out-of-Jail-Card": 1,
  "Gold-Key": 1,
  "Rainbow-Tapeworm": 1,
};

const treasure = [
  "The-Battery",
  "The-Bible",
  "Blank-Card",
  "Book-of-Sin",
  "Boomerang",
  "Box",
  "Bum-Friend",
  "Compost",
  "Chaos",
  "Chaos-Card",
  "Crystal-Ball",
  "The-D4",
  "The-D20",
  "The-D100",
  "Decoy",
  "Diplopia",
  "Flush",
  "Glass-Cannon",
  "Godhead",
  "Guppys-Head",
  "Guppys-Paw",
  "Host-Hat",
  "Jawbone",
  "Lucky-Foot",
  "Mini-Mush",
  "Modeling-Clay",
  "Moms-Bra",
  "Moms-Shovel",
  "Monster-Manual",
  "Mr-Boom",
  "Mystery-Sack",
  "NO",
  "Pandoras-Box",
  "Placebo",
  "Potato-Peeler",
  "Razor-Blade",
  "Remote-Detonator",
  "Sack-Head",
  "Sack-of-Pennies",
  "The-Shovel",
  "Spoon-Bender",
  "Two-of-Clubs",
  "Crooked-Penny",
  "The-Bible",
  "20-20",
  "Black-Candle",
  "Distant-Admiration",
  "Divorce-Papers",
  "Forget-Me-Now",
  "Head-of-Krampus",
  "Libra",
  "Mutant-Spider",
  "Rainbow-Baby",
  "Red-Candle",
  "Smart-Fly",
  "Battery-Baby",
  "Contract-From-Below",
  "Donation-Machine",
  "Golden-Razor-Blade",
  "Pay-To-Play",
  "The-Poop",
  "Portable-Slot",
  "Smelter",
  "Tech-X",
  "Athame",
  "Baby-Haunt",
  "Belly-Button",
  "The-Blue-Map",
  "Bobs-Brain",
  "Breakfast",
  "Brimstone",
  "Bum-Bo",
  "Cambion-Conception",
  "Champion-Belt",
  "Charged-Baby",
  "Cheese-Grater",
  "The-Chest",
  "The-Compass",
  "Curse-of-the-Tower",
  "The-D10",
  "Daddy-Haunt",
  "Dads-Lost-Coin",
  "Dark-Bum",
  "Dead-Bird",
  "The-Dead-Cat",
  "Dinner",
  "Dry-Baby",
  "Edens-Blessing",
  "Empty-Vessel",
  "Eye-of-Greed",
  "Fanny-Pack",
  "Finger",
  "Goat-Head",
  "Greeds-Gullet",
  "Guppys-Collar",
  "The-Habit",
  "Ipecac",
  "The-Map",
  "Meat",
  "The-Midas-Touch",
  "Moms-Box",
  "Moms-Coin-Purse",
  "Moms-Purse",
  "Moms-Razor",
  "Monstros-Tooth",
  "The-Polaroid",
  "Polydactyly",
  "Restock",
  "The-Relic",
  "Sacred-Heart",
  "Shadow",
  "Shiny-Rock",
  "Spider-Mod",
  "Starter-Deck",
  "Steamy-Sale",
  "Suicide-King",
  "Synthoil",
  "Tarot-Cloth",
  "Theres-Options",
  "Trinity-Shield",
  "Guppys-Tail",
  "Moms-Knife",
  "Skeleton-Key",
  "The-Missing-Page",
  "1-Up",
  "Abaddon",
  "Cursed-Eye",
  "Daddy-Long-Legs",
  "Euthanasia",
  "Game-Breaking-Bug",
  "Guppys-Eye",
  "Head-of-the-Keeper",
  "Hourglass",
  "Lard",
  "Magnet",
  "Mama-Haunt",
  "Moms-Eye-Shadow",
  "PHD",
  "Polyphemus",
  "Rubber-Cement",
  "Telepathy-for-Dummies",
  "The-Wiz",
];

const monsters = [
  "Big-Spider",
  "Black-Bony",
  "Boom-Fly",
  "Clotty",
  "Cod-Worm",
  "Conjoined-Fatty",
  "Dank-Globin",
  "Dinga",
  "Dip",
  "Dople",
  "Evil-Twin",
  "Fat-Bat",
  "Fatty",
  "Fly",
  "Greedling",
  "Hanger",
  "Hopper",
  "Horf",
  "Keeper-Head",
  "Leaper",
  "Leech",
  "Moms-Dead-Hand",
  "Moms-Eye",
  "Moms-Hand",
  "Mulliboom",
  "Mulligan",
  "Pale-Fatty",
  "Pooter",
  "Portal",
  "Psy-Horf",
  "Rage-Creep",
  "Red-Host",
  "Ring-of-Flies",
  "Spider",
  "Squirt",
  "Stoney",
  "Swarm-of-Flies",
  "Trite",
  "Wizoob",
  "Begotten",
  "Boil",
  "Charger",
  "Deaths-Head",
  "Gaper",
  "Imp",
  "Knight",
  "Parabite",
  "Ragling",
  "Round-Worm",
  "Bony",
  "Brain",
  "Flaming-Hopper",
  "Globin",
  "Nerve-Ending",
  "Roundy",
  "Sucker",
  "Swarmer",
  "Tumor",
  "Cursed-Fatty",
  "Cursed-Gaper",
  "Cursed-Horf",
  "Cursed-Keeper-Head",
  "Cursed-Moms-Hand",
  "Cursed-Psy-Horf",
  "Holy-Dinga",
  "Holy-Dip",
  "Holy-Keeper-Head",
  "Holy-Moms-Eye",
  "Holy-Squirt",
  "Cursed-Globin",
  "Cursed-Tumor",
  "Holy-Bony",
  "Holy-Mulligan",
  "Carrion-Queen",
  "Chub",
  "Conquest",
  "Daddy-Long-Legs",
  "Dark-One",
  "Death",
  "Delirium",
  "Envy",
  "Famine",
  "Gemini",
  "Gluttony",
  "Greed",
  "Gurdy-Jr",
  "Gurdy",
  "Larry-Jr",
  "Little-Horn",
  "Lust",
  "Mask-Of-Imfamy",
  "Mega-Fatty",
  "Monstro",
  "Peep",
  "Pestilence",
  "Pin",
  "Pride",
  "Ragman",
  "Scolex",
  "Sloth",
  "The-Bloat",
  "Duke-of-Flies",
  "The-Haunt",
  "War",
  "Wrath",
  "Fistula",
  "Gurgling",
  "Polycephalus",
  "Steven",
  "The-Cage",
  "Blastocyst",
  "Dingle",
  "Headless-Horseman",
  "Krampus",
  "Monstro-II",
  "The-Fallen",
  "Widow",
  "Mom",
  "Satan",
  "The-Lamb",
  "Hush",
  "Isaac",
  "Moms-Heart",
  "Ambush",
  "Chest",
  "Cursed-Chest",
  "Dark-Chest",
  "Devil-Deal",
  "Gold-Chest",
  "Greed",
  "I-Can-See-Forever",
  "Troll-Bombs",
  "Mega-Troll-Bomb",
  "Secret-Room",
  "Shop-Upgrade",
  "We-Need-to-go-Deeper",
  "XL-Floor",
  "I-Am-Error",
  "Angel-Room",
  "Boss-Rush",
  "Holy-Chest",
  "Spiked-Chest",
  "Troll-Bombs",
  "Curse-of-Amnesia",
  "Curse-of-Greed",
  "Curse-of-Loss",
  "Curse-of-Pain",
  "Curse-of-the-Blind",
  "Curse-of-Fatigue",
  "Curse-of-Tiny-Hands",
  "Curse-of-Blood-Lust",
  "Curse-of-Impulse",
];

const bonusSouls = [
  "Soul-of-Greed",
  "Soul-of-Gluttony",
  "Soul-of-Guppy",
];
