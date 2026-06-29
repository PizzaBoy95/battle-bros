import Phaser from 'phaser';
import { BootScene }       from './scenes/BootScene.js';
import { SplashScene }     from './scenes/SplashScene.js';
import { AuthScene }       from './scenes/AuthScene.js';
import { MainMenuScene }   from './scenes/MainMenuScene.js';
import { CharSelectScene } from './scenes/CharSelectScene.js';
import { LobbyScene }      from './scenes/LobbyScene.js';
import { BattleScene }     from './scenes/BattleScene.js';
import { ResultsScene }    from './scenes/ResultsScene.js';
import { LootBoxScene }    from './scenes/LootBoxScene.js';

const config = {
  type: Phaser.AUTO,
  parent: document.body,
  backgroundColor: '#03070e',
  dom: { createContainer: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 854
  },
  scene: [
    BootScene, SplashScene, AuthScene, MainMenuScene,
    CharSelectScene, LobbyScene, BattleScene, ResultsScene, LootBoxScene
  ]
};

window.game = new Phaser.Game(config);
