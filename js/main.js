// Importa le librerie Three.js
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { initScene } from './scene.js';
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
let boatController;

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
    const sceneElements = initScene(scene);
    water = sceneElements.water;
    const boat = sceneElements.boat;
    cloudGenerator = sceneElements.cloudGenerator;
    console.log('Elementi della scena inizializzati');
    
    // Inizializza il player e passa la barca
    player = initPlayer(camera);
    player.setBoat(boat);
    console.log('Player inizializzato e barca assegnata');
    
    // Inizializza il controller della barca
    boatController = new BoatController(boat, camera, scene, controls);
    console.log('Controller della barca inizializzato');
    
    // Gestisci il ridimensionamento della finestra
    window.addEventListener('resize', onWindowResize, false);
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
    
    // Aggiorna la logica del giocatore solo se non è nella barca
    if (!boatController.isPlayerInBoat) {
        player.update();
    }
    
    // Aggiorna il controller della barca
    boatController.update();
    
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