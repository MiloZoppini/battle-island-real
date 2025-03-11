import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { CloudGenerator } from './CloudGenerator.js';
import { SkyShader } from './shaders/SkyShader.js';
import { IslandGenerator } from './IslandGenerator.js';

/**
 * Inizializza la scena con gli elementi di base: mare, isole e cielo
 * @param {THREE.Scene} scene - La scena Three.js
 * @param {number} playerCount - Numero di giocatori (default: 6)
 */
export function initScene(scene, playerCount = 6) {
    console.log('Inizializzazione degli elementi della scena...');
    
    // Crea il cielo con il nuovo shader
    const skyShader = new SkyShader();
    const sky = skyShader.createSky(1000);
    scene.add(sky);
    console.log('Cielo con shader creato e aggiunto alla scena');
    
    // Crea il generatore di nuvole
    const cloudGenerator = new CloudGenerator(scene, {
        numClouds: 15,
        minHeight: 80,
        maxHeight: 120,
        cloudScale: 15,
        noiseScale: 0.15,
        threshold: 0.25,
        opacity: 0.9,
        color: 0xffffff,
        size: { x: 8, y: 2, z: 8 },
        bounds: { x: 400, z: 400 }
    });
    
    // Genera le nuvole iniziali
    cloudGenerator.generateClouds();
    
    // Crea l'acqua
    const waterGeometry = new THREE.PlaneGeometry(2000, 2000);
    const water = new Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('assets/textures/waternormals.jpg', function(texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    });
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0;
    scene.add(water);
    
    // Crea il generatore di isole
    const islandGenerator = new IslandGenerator(scene);
    
    // Genera le isole in base al numero di giocatori
    islandGenerator.generateIslandsForPlayers(playerCount);
    
    // Ottieni tutte le isole generate
    const islands = islandGenerator.getAllIslands();
    console.log(`Generate ${islands.length} isole per ${playerCount} giocatori`);
    
    // Crea la barca (stile Minecraft) per la prima isola
    const boat = createBoat();
    
    // Posiziona la barca nell'acqua vicino alla prima isola
    boat.position.set(32, 0, 0);
    scene.add(boat);
    console.log('Barca aggiunta alla scena con i remi');
    
    return { 
        water, 
        boat, 
        cloudGenerator, 
        skyShader,
        islandGenerator,
        islands
    };
}

/**
 * Crea una barca in stile Minecraft
 * @returns {THREE.Group} - Il gruppo contenente la barca
 */
function createBoat() {
    const boat = new THREE.Group();
    
    // Base della barca (scafo)
    const hullGeometry = new THREE.BoxGeometry(3, 1, 6);
    const woodMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513,
        shininess: 5
    });
    const hull = new THREE.Mesh(hullGeometry, woodMaterial);
    hull.position.y = 0.5;
    hull.castShadow = true;
    boat.add(hull);
    
    // Lati della barca (stile Minecraft)
    const sideGeometry = new THREE.BoxGeometry(0.4, 1, 6);
    const leftSide = new THREE.Mesh(sideGeometry, woodMaterial);
    leftSide.position.set(-1.2, 1.0, 0);
    leftSide.castShadow = true;
    boat.add(leftSide);
    
    const rightSide = new THREE.Mesh(sideGeometry, woodMaterial);
    rightSide.position.set(1.2, 1.0, 0);
    rightSide.castShadow = true;
    boat.add(rightSide);
    
    // Parte frontale e posteriore inclinate
    const frontGeometry = new THREE.BoxGeometry(3, 1, 1);
    const front = new THREE.Mesh(frontGeometry, woodMaterial);
    front.position.set(0, 0.5, -2.5);
    front.rotation.x = Math.PI / 6;
    front.castShadow = true;
    boat.add(front);
    
    const back = new THREE.Mesh(frontGeometry, woodMaterial);
    back.position.set(0, 0.5, 2.5);
    back.rotation.x = -Math.PI / 6;
    back.castShadow = true;
    boat.add(back);
    
    // Aggiungi i remi (stile Minecraft)
    const paddleGeometry = new THREE.BoxGeometry(0.2, 0.1, 2);
    const handleGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
    const paddleMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xa0522d,
        shininess: 3
    });
    
    // Remo sinistro
    const leftPaddleGroup = new THREE.Group();
    const leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    leftPaddle.position.z = -1;
    const leftHandle = new THREE.Mesh(handleGeometry, paddleMaterial);
    leftHandle.position.y = 0.8;
    leftPaddleGroup.add(leftPaddle);
    leftPaddleGroup.add(leftHandle);
    leftPaddleGroup.position.set(-1.5, 0.8, 0);
    leftPaddleGroup.rotation.x = Math.PI / 6;
    boat.add(leftPaddleGroup);
    
    // Remo destro
    const rightPaddleGroup = new THREE.Group();
    const rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    rightPaddle.position.z = -1;
    const rightHandle = new THREE.Mesh(handleGeometry, paddleMaterial);
    rightHandle.position.y = 0.8;
    rightPaddleGroup.add(rightPaddle);
    rightPaddleGroup.add(rightHandle);
    rightPaddleGroup.position.set(1.5, 0.8, 0);
    rightPaddleGroup.rotation.x = Math.PI / 6;
    boat.add(rightPaddleGroup);
    
    return boat;
}

/**
 * Crea una barca per ogni isola
 * @param {THREE.Scene} scene - La scena Three.js
 * @param {Array} islands - Array di oggetti isola
 * @returns {Array} - Array di barche
 */
export function createBoatsForIslands(scene, islands) {
    const boats = [];
    
    islands.forEach((island, index) => {
        const boat = createBoat();
        
        // Calcola la posizione della barca vicino all'isola
        const islandPosition = island.position;
        
        // Calcola una direzione casuale per posizionare la barca (ma mantieni una distanza maggiore)
        const angle = Math.random() * Math.PI * 2;
        const distanceFromIsland = 50; // Aumentato da 32 a 50 per distanziare meglio le barche dalle isole
        
        const boatPosition = new THREE.Vector3(
            islandPosition.x + Math.cos(angle) * distanceFromIsland,
            0,
            islandPosition.z + Math.sin(angle) * distanceFromIsland
        );
        
        boat.position.copy(boatPosition);
        
        // Orienta la barca verso l'isola
        boat.lookAt(islandPosition);
        
        scene.add(boat);
        
        boats.push({
            boat: boat,
            islandIndex: index,
            position: boatPosition.clone()
        });
        
        console.log(`Barca creata per l'isola ${index} a posizione ${boatPosition.x}, ${boatPosition.y}, ${boatPosition.z}`);
    });
    
    return boats;
}

/**
 * Aggiunge un forziere del tesoro alla scena
 * @param {THREE.Scene} scene - La scena Three.js
 * @param {THREE.Group} islandGroup - Il gruppo dell'isola
 */
function addTreasureChest(scene, islandGroup) {
    const chest = new THREE.Group();
    
    // Base del forziere
    const baseGeometry = new THREE.BoxGeometry(3, 2, 2);
    const chestMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.3
    });
    const base = new THREE.Mesh(baseGeometry, chestMaterial);
    chest.add(base);
    
    // Coperchio
    const lidGeometry = new THREE.BoxGeometry(3, 1, 2);
    const lid = new THREE.Mesh(lidGeometry, chestMaterial);
    lid.position.set(0, 1.5, -0.5);
    lid.rotation.x = -Math.PI / 6; // Leggermente aperto
    chest.add(lid);
    
    // Decorazioni in oro
    const goldMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700,
        roughness: 0.3,
        metalness: 1.0
    });
    
    // Bordi
    const edgeGeometry = new THREE.BoxGeometry(3.2, 0.2, 0.2);
    
    const frontEdge = new THREE.Mesh(edgeGeometry, goldMaterial);
    frontEdge.position.set(0, -0.9, 1.1);
    chest.add(frontEdge);
    
    const backEdge = new THREE.Mesh(edgeGeometry, goldMaterial);
    backEdge.position.set(0, -0.9, -1.1);
    chest.add(backEdge);
    
    // Posiziona il forziere
    chest.position.set(5, 10.1, 0);
    chest.castShadow = true;
    chest.receiveShadow = true;
    
    islandGroup.add(chest);
    console.log('Forziere del tesoro aggiunto alla scena');
} 