// Importa le librerie Three.js
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { initScene, createBoatsForIslands } from './scene.js';
import { Player } from './entities/player.js';
import { initPlayer } from './player.js';
import { BoatController } from './controllers/BoatController.js';

console.log('Inizializzazione del gioco...');

// Ottieni il contenitore del gioco
const container = document.getElementById('game-container');
const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');

// Variabili globali
let camera, scene, renderer;
let player;
let water;
let cloudGenerator;
let lastTime = 0;
let boatControllers = [];
let islandGenerator;
let islands = [];
let boats = [];
let playerCount = 12; // Numero di giocatori (modificabile)
let playerTeam = 0; // Squadra del giocatore corrente (modificabile)

// Inizializzazione della scena
function init() {
    scene = new THREE.Scene();
    console.log('Scena creata');
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 7, 20);
    console.log('Camera creata');
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87ceeb);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    console.log('Renderer creato e aggiunto al DOM');
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(100, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);
    
    // Inizializza la scena con gli elementi
    const sceneElements = initScene(scene, playerCount);
    water = sceneElements.water;
    const boat = sceneElements.boat;
    cloudGenerator = sceneElements.cloudGenerator;
    islandGenerator = sceneElements.islandGenerator;
    islands = sceneElements.islands;
    console.log('Elementi della scena inizializzati');
    
    // Crea barche per tutte le isole
    boats = createBoatsForIslands(scene, islands);
    
    // Inizializza il player e passa la barca
    player = initPlayer(camera);
    player.setBoat(boat);
    console.log('Player inizializzato e barca assegnata');
    
    // Posiziona il giocatore sull'isola della sua squadra
    if (islands.length > 0 && playerTeam < islands.length) {
        const teamIsland = islands[playerTeam];
        const spawnPosition = new THREE.Vector3(
            teamIsland.position.x,
            7, // Altezza del giocatore
            teamIsland.position.z + 10 // Leggermente spostato dal centro
        );
        camera.position.copy(spawnPosition);
        console.log(`Giocatore posizionato sull'isola della squadra ${playerTeam}`);
    }
    
    // Inizializza i controller delle barche
    boats.forEach((boatInfo, index) => {
        // Usa l'isola corrente come island1 e la prossima isola come island2 (o la prima se è l'ultima)
        const island1 = islands[index].group;
        const island2 = islands[(index + 1) % islands.length].group;
        
        const boatController = new BoatController(boatInfo.boat, camera, scene, controls, island1, island2);
        boatControllers.push(boatController);
        console.log(`Controller della barca ${index} inizializzato con isola1: ${index} e isola2: ${(index + 1) % islands.length}`);
    });
    
    // Gestisci il ridimensionamento della finestra
    window.addEventListener('resize', onWindowResize, false);
    
    // Aggiungi un'interfaccia per visualizzare informazioni sulla squadra
    createTeamUI();
}

// Crea un'interfaccia per visualizzare informazioni sulla squadra
function createTeamUI() {
    const teamInfo = document.createElement('div');
    teamInfo.style.position = 'absolute';
    teamInfo.style.top = '10px';
    teamInfo.style.left = '10px';
    teamInfo.style.color = 'white';
    teamInfo.style.fontFamily = 'Arial, sans-serif';
    teamInfo.style.fontSize = '16px';
    teamInfo.style.textShadow = '1px 1px 2px black';
    teamInfo.style.padding = '10px';
    teamInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    teamInfo.style.borderRadius = '5px';
    
    // Converti il colore esadecimale in stringa CSS
    const teamColors = [
        '#f2d16b', // Giallo
        '#ff6b6b', // Rosso
        '#6bff6b', // Verde
        '#6b6bff', // Blu
        '#ff6bff', // Magenta
        '#6bffff'  // Ciano
    ];
    
    const teamColor = teamColors[playerTeam % teamColors.length];
    
    teamInfo.innerHTML = `
        <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; background-color: ${teamColor}; margin-right: 10px; border-radius: 50%;"></div>
            <span>Squadra ${playerTeam + 1}</span>
        </div>
        <div style="margin-top: 5px;">Giocatori: ${Math.min(6, playerCount - playerTeam * 6)}</div>
        <div style="margin-top: 5px;">Isole totali: ${islands.length}</div>
    `;
    
    container.appendChild(teamInfo);
}

// Gestione del ridimensionamento della finestra
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Crea i controlli per il blocco del puntatore
const controls = new PointerLockControls(camera, document.body);

controls.addEventListener('lock', () => {
    blocker.classList.add('hidden');
    instructions.classList.add('hidden');
});

controls.addEventListener('unlock', () => {
    blocker.classList.remove('hidden');
    instructions.classList.remove('hidden');
});

document.addEventListener('click', () => {
    if (!controls.isLocked) {
        controls.lock();
    }
});

// Crea il mirino centrale
const crosshair = document.createElement('div');
crosshair.className = 'crosshair';
crosshair.style.position = 'absolute';
crosshair.style.top = '50%';
crosshair.style.left = '50%';
crosshair.style.width = '2px';
crosshair.style.height = '2px';
crosshair.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
crosshair.style.transform = 'translate(-50%, -50%)';
crosshair.style.pointerEvents = 'none';
container.appendChild(crosshair);

// Loop di animazione
function animate(currentTime) {
    requestAnimationFrame(animate);
    
    // Calcola il delta time
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Verifica se il giocatore è in una barca
    let isInAnyBoat = false;
    for (const controller of boatControllers) {
        if (controller.isPlayerInBoat) {
            isInAnyBoat = true;
            break;
        }
    }
    
    // Aggiorna la logica del giocatore solo se non è nella barca
    if (!isInAnyBoat) {
        player.update();
    }
    
    // Aggiorna tutti i controller delle barche
    for (const controller of boatControllers) {
        controller.update();
    }
    
    // Aggiorna l'acqua
    if (water) {
        water.material.uniforms['time'].value += 1.0 / 60.0;
    }
    
    // Aggiorna le nuvole
    if (cloudGenerator) {
        cloudGenerator.update(currentTime);
    }
    
    // Renderizza la scena
    renderer.render(scene, camera);
}

// Avvia l'applicazione
init();
console.log('Avvio del loop di animazione');
animate(0); 