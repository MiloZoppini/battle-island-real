import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { CloudGenerator } from './CloudGenerator.js';
import { SkyShader } from './shaders/SkyShader.js';

/**
 * Inizializza la scena con gli elementi di base: mare e isola
 * @param {THREE.Scene} scene - La scena Three.js
 */
export function initScene(scene) {
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
    
    // Crea il gruppo per l'isola
    const islandGroup = new THREE.Group();
    
    // Crea l'isola (ora completamente gialla)
    const islandGeometry = new THREE.CylinderGeometry(30, 30, 3, 32);
    const islandMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xf2d16b,
        shininess: 0
    });
    const island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.position.y = 1.5;
    island.receiveShadow = true;
    islandGroup.add(island);
    
    // Funzione per calcolare l'altezza sulla superficie dell'isola
    function getHeightAtPosition(x, z) {
        // L'isola è un cilindro, quindi calcoliamo la distanza dal centro
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        const islandRadius = 30;
        const islandHeight = 3;
        
        if (distanceFromCenter <= islandRadius) {
            // Siamo sull'isola, restituiamo l'altezza corretta
            return island.position.y + islandHeight / 2;
        }
        return 0; // Fuori dall'isola, altezza al livello dell'acqua
    }
    
    // Funzione per creare un albero in stile Minecraft
    function createTree(x, z, type = 'oak') {
        const treeGroup = new THREE.Group();
        const height = getHeightAtPosition(x, z);
        
        // Configurazione dell'albero in base al tipo
        const treeConfig = {
            oak: {
                trunkHeight: Math.floor(Math.random() * 3) + 4, // 4-6 blocchi
                trunkColor: 0x8B4513,
                leavesColor: 0x2d5a27,
                crownSize: 3,
                crownShape: 'cube'
            },
            pine: {
                trunkHeight: Math.floor(Math.random() * 4) + 6, // 6-9 blocchi
                trunkColor: 0x6B4423,
                leavesColor: 0x1b4a1b,
                crownSize: 4,
                crownShape: 'pyramid'
            }
        };
        
        const config = treeConfig[type];
        
        // Crea il materiale per il tronco (stile Minecraft)
        const trunkMaterial = new THREE.MeshPhongMaterial({
            color: config.trunkColor,
            shininess: 0,
            flatShading: true
        });
        
        // Crea il materiale per le foglie (stile Minecraft)
        const leavesMaterial = new THREE.MeshPhongMaterial({
            color: config.leavesColor,
            shininess: 0,
            transparent: true,
            opacity: 0.95,
            flatShading: true
        });
        
        // Crea il tronco usando cubi sovrapposti
        const trunkGeometry = new THREE.BoxGeometry(1, 1, 1);
        for (let i = 0; i < config.trunkHeight; i++) {
            const trunkBlock = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunkBlock.position.set(0, i, 0);
            trunkBlock.castShadow = true;
            trunkBlock.receiveShadow = true;
            treeGroup.add(trunkBlock);
        }
        
        // Funzione per aggiungere un blocco foglia con variazione casuale
        function addLeafBlock(x, y, z, probability = 1) {
            if (Math.random() < probability) {
                const leafBlock = new THREE.Mesh(trunkGeometry, leavesMaterial);
                leafBlock.position.set(x, y, z);
                leafBlock.castShadow = true;
                treeGroup.add(leafBlock);
            }
        }
        
        // Crea la chioma in base al tipo di albero
        const crownY = config.trunkHeight - 1;
        
        if (config.crownShape === 'cube') {
            // Chioma cubica (quercia)
            for (let y = 0; y < config.crownSize; y++) {
                for (let x = -2; x <= 2; x++) {
                    for (let z = -2; z <= 2; z++) {
                        // Evita i blocchi interni per risparmiare poligoni
                        if (Math.abs(x) === 2 || Math.abs(z) === 2 || y === 0 || y === config.crownSize - 1) {
                            // Aggiungi variazione casuale ai bordi
                            const distanceFromCenter = Math.sqrt(x * x + z * z);
                            const probability = 1 - (distanceFromCenter / 3);
                            addLeafBlock(x, crownY + y, z, probability);
                        }
                    }
                }
            }
        } else if (config.crownShape === 'pyramid') {
            // Chioma piramidale (pino)
            for (let y = 0; y < config.crownSize; y++) {
                const layerSize = config.crownSize - y;
                for (let x = -layerSize; x <= layerSize; x++) {
                    for (let z = -layerSize; z <= layerSize; z++) {
                        const distanceFromCenter = Math.sqrt(x * x + z * z);
                        if (distanceFromCenter <= layerSize) {
                            addLeafBlock(x, crownY + y, z, 0.8);
                        }
                    }
                }
            }
        }
        
        // Posiziona l'albero sulla superficie
        treeGroup.position.set(x, height, z);
        
        // Aggiungi una leggera rotazione casuale per varietà
        treeGroup.rotation.y = Math.random() * Math.PI * 2;
        
        return treeGroup;
    }
    
    // Aggiungi alberi sul bordo dell'isola
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 28;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        // Alterna tra querce e pini per varietà
        const treeType = i % 2 === 0 ? 'oak' : 'pine';
        const tree = createTree(x, z, treeType);
        islandGroup.add(tree);
    }
    
    // Aggiungi alcuni alberi sparsi nell'interno dell'isola
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 20 + 5; // Tra 5 e 25 unità dal centro
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const treeType = Math.random() < 0.7 ? 'oak' : 'pine';
        const tree = createTree(x, z, treeType);
        islandGroup.add(tree);
    }
    
    // Funzione per creare una roccia
    function createRock(x, z) {
        // Ottieni l'altezza corretta per la posizione
        const height = getHeightAtPosition(x, z);
        
        const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 1 + 0.5);
        const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        // Posiziona la roccia sulla superficie
        rock.position.set(x, height + rockGeometry.parameters.radius, z);
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        return rock;
    }
    
    // Aggiungi rocce sparse sull'isola
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 25; // Distribuisci le rocce su tutta l'isola
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const rock = createRock(x, z);
        islandGroup.add(rock);
    }
    
    // Aggiungi l'isola alla scena
    scene.add(islandGroup);
    
    // Crea l'acqua
    const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
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
    
    // Crea la barca (stile Minecraft)
    const boat = new THREE.Group();
    
    // Base della barca (scafo)
    const hullGeometry = new THREE.BoxGeometry(3, 1, 6);
    const woodMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513,
        shininess: 5
    });
    const hull = new THREE.Mesh(hullGeometry, woodMaterial);
    hull.position.y = 2;
    hull.castShadow = true;
    boat.add(hull);
    
    // Lati della barca (stile Minecraft)
    const sideGeometry = new THREE.BoxGeometry(0.4, 1, 6);
    const leftSide = new THREE.Mesh(sideGeometry, woodMaterial);
    leftSide.position.set(-1.2, 2.5, 0);
    leftSide.castShadow = true;
    boat.add(leftSide);
    
    const rightSide = new THREE.Mesh(sideGeometry, woodMaterial);
    rightSide.position.set(1.2, 2.5, 0);
    rightSide.castShadow = true;
    boat.add(rightSide);
    
    // Parte frontale e posteriore inclinate
    const frontGeometry = new THREE.BoxGeometry(3, 1, 1);
    const front = new THREE.Mesh(frontGeometry, woodMaterial);
    front.position.set(0, 2, -2.5);
    front.rotation.x = Math.PI / 6;
    front.castShadow = true;
    boat.add(front);
    
    const back = new THREE.Mesh(frontGeometry, woodMaterial);
    back.position.set(0, 2, 2.5);
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
    leftPaddleGroup.position.set(-1.5, 2.3, 0);
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
    rightPaddleGroup.position.set(1.5, 2.3, 0);
    rightPaddleGroup.rotation.x = Math.PI / 6;
    boat.add(rightPaddleGroup);
    
    // Posiziona la barca nell'acqua vicino all'isola
    boat.position.set(32, 0.2, 0); // Appena fuori dal bordo dell'isola
    scene.add(boat);
    console.log('Barca aggiunta alla scena con i remi');
    
    return { water, boat, cloudGenerator, skyShader };
}

/**
 * Aggiunge una barca alla scena
 * @param {THREE.Scene} scene - La scena Three.js
 */
function addBoat(scene) {
    const boat = new THREE.Group();
    
    // Scafo
    const hullGeometry = new THREE.BoxGeometry(6, 2, 12);
    const hullMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.1
    });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = 1;
    hull.castShadow = true;
    boat.add(hull);
    
    // Prua
    const bowGeometry = new THREE.ConeGeometry(2, 4, 4);
    bowGeometry.rotateX(-Math.PI / 2);
    const bowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.1
    });
    const bow = new THREE.Mesh(bowGeometry, bowMaterial);
    bow.position.set(0, 1, -6);
    bow.castShadow = true;
    boat.add(bow);
    
    // Albero
    const mastGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
    const mastMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.1
    });
    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(0, 6, -2);
    mast.castShadow = true;
    boat.add(mast);
    
    // Vela
    const sailGeometry = new THREE.PlaneGeometry(5, 6);
    const sailMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.0,
        side: THREE.DoubleSide
    });
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.position.set(0, 6, 0);
    sail.rotation.y = Math.PI / 2;
    sail.castShadow = true;
    boat.add(sail);
    
    // Posiziona la barca
    boat.position.set(-40, 2, 20);
    boat.rotation.y = Math.PI / 4;
    
    scene.add(boat);
    console.log('Barca aggiunta alla scena');
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