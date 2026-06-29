import Phaser from 'phaser';
import { BootScene }      from './scenes/BootScene.js';
import { SplashScene }    from './scenes/SplashScene.js';
import { AuthScene }      from './scenes/AuthScene.js';
import { MainMenuScene }  from './scenes/MainMenuScene.js';
import { CharSelectScene }from './scenes/CharSelectScene.js';
import { LobbyScene }     from './scenes/LobbyScene.js';
import { BattleScene }    from './scenes/BattleScene.js';
import { ResultsScene }   from './scenes/ResultsScene.js';
import { LootBoxScene }   from './scenes/LootBoxScene.js';

// Three.js host div — sits behind the Phaser canvas (DOM order matters: inserted first)
const threeWrap = document.createElement('div');
threeWrap.id = 'three-wrap';
threeWrap.style.cssText = [
  'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
  'z-index:0', 'background:#060614', 'pointer-events:none', 'overflow:hidden'
].join(';');
document.body.insertBefore(threeWrap, document.body.firstChild);

// Phaser parent — sits on top of three-wrap (z-index:1)
const phaserWrap = document.createElement('div');
phaserWrap.id = 'phaser-wrap';
phaserWrap.style.cssText = [
  'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%', 'z-index:1'
].join(';');
document.body.appendChild(phaserWrap);

const config = {
  type: Phaser.AUTO,
  transparent: true,       // Phaser canvas has no background — Three.js shows through
  parent: phaserWrap,      // Parent our canvas above the three-wrap layer
  dom: { createContainer: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 854
  },
  scene: [
    BootScene,
    SplashScene,
    AuthScene,
    MainMenuScene,
    CharSelectScene,
    LobbyScene,
    BattleScene,
    ResultsScene,
    LootBoxScene
  ]
};

window.game = new Phaser.Game(config);
