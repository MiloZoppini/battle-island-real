import * as THREE from 'three';

/**
 * Classe per generare isole multiple per il gameplay multiplayer
 */
export class IslandGenerator {
    constructor(scene) {
        this.scene = scene;
        this.islands = [];
        this.playersPerIsland = 6;
        this.islandRadius = 30;
        this.islandSpacing = 300; // Distanza tra le isole
        this.teamColors = [
            0xf2d16b, // Giallo (isola principale)
            0xff6b6b, // Rosso
            0x6bff6b, // Verde
            0x6b6bff, // Blu
            0xff6bff, // Magenta
            0x6bffff  // Ciano
        ];
    }

    /**
     * Genera un'isola per una squadra
     * @param {number} teamIndex - Indice della squadra
     * @param {THREE.Vector3} position - Posizione dell'isola
     * @returns {THREE.Group} - Il gruppo contenente l'isola e i suoi elementi
     */
    generateIslandForTeam(teamIndex, position) {
        console.log(`Generazione isola per la squadra ${teamIndex} a posizione ${position.x}, ${position.y}, ${position.z}`);
        
        // Crea un gruppo per l'isola
        const islandGroup = new THREE.Group();
        islandGroup.position.copy(position);
        this.scene.add(islandGroup);
        
        // Scegli il colore dell'isola in base alla squadra
        const teamColor = this.teamColors[teamIndex % this.teamColors.length];
        
        // Crea l'isola
        const islandGeometry = new THREE.CylinderGeometry(this.islandRadius, this.islandRadius, 3, 32);
        const islandMaterial = new THREE.MeshPhongMaterial({ 
            color: teamColor,
            shininess: 0
        });
        const island = new THREE.Mesh(islandGeometry, islandMaterial);
        island.position.y = 1.5;
        island.receiveShadow = true;
        islandGroup.add(island);
        
        // Aggiungi alberi e rocce
        this.addTreesAndRocks(islandGroup, teamIndex);
        
        // Aggiungi una bandiera per identificare la squadra
        this.addTeamFlag(islandGroup, teamIndex);
        
        // Memorizza l'isola
        this.islands.push({
            group: islandGroup,
            position: position.clone(),
            teamIndex: teamIndex
        });
        
        return islandGroup;
    }
    
    /**
     * Aggiunge alberi e rocce all'isola
     * @param {THREE.Group} islandGroup - Il gruppo dell'isola
     * @param {number} teamIndex - Indice della squadra
     */
    addTreesAndRocks(islandGroup, teamIndex) {
        // Funzione per calcolare l'altezza sulla superficie dell'isola
        const getHeightAtPosition = (x, z) => {
            const distanceFromCenter = Math.sqrt(x * x + z * z);
            const islandHeight = 3;
            
            if (distanceFromCenter <= this.islandRadius) {
                return 1.5 + islandHeight / 2;
            }
            return 0;
        };
        
        // Funzione per creare un albero
        const createTree = (x, z, type = 'oak') => {
            const treeGroup = new THREE.Group();
            const height = getHeightAtPosition(x, z);
            
            // Configurazione dell'albero in base al tipo
            const treeConfig = {
                oak: {
                    trunkHeight: Math.floor(Math.random() * 3) + 4,
                    trunkColor: 0x8B4513,
                    leavesColor: 0x2d5a27,
                    crownSize: 3,
                    crownShape: 'cube'
                },
                pine: {
                    trunkHeight: Math.floor(Math.random() * 4) + 6,
                    trunkColor: 0x6B4423,
                    leavesColor: 0x1b4a1b,
                    crownSize: 4,
                    crownShape: 'pyramid'
                }
            };
            
            const config = treeConfig[type];
            
            // Crea il materiale per il tronco
            const trunkMaterial = new THREE.MeshPhongMaterial({
                color: config.trunkColor,
                shininess: 0,
                flatShading: true
            });
            
            // Crea il materiale per le foglie
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
            const addLeafBlock = (x, y, z, probability = 1) => {
                if (Math.random() < probability) {
                    const leafBlock = new THREE.Mesh(trunkGeometry, leavesMaterial);
                    leafBlock.position.set(x, y, z);
                    leafBlock.castShadow = true;
                    treeGroup.add(leafBlock);
                }
            };
            
            // Crea la chioma in base al tipo di albero
            const crownY = config.trunkHeight - 1;
            
            if (config.crownShape === 'cube') {
                // Chioma cubica (quercia)
                for (let y = 0; y < config.crownSize; y++) {
                    for (let x = -2; x <= 2; x++) {
                        for (let z = -2; z <= 2; z++) {
                            if (Math.abs(x) === 2 || Math.abs(z) === 2 || y === 0 || y === config.crownSize - 1) {
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
        };
        
        // Funzione per creare una roccia
        const createRock = (x, z) => {
            const height = getHeightAtPosition(x, z);
            
            const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 1 + 0.5);
            const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            rock.position.set(x, height + rockGeometry.parameters.radius, z);
            rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            return rock;
        };
        
        // Aggiungi alberi sul bordo dell'isola
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const radius = this.islandRadius - 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const treeType = i % 2 === 0 ? 'oak' : 'pine';
            const tree = createTree(x, z, treeType);
            islandGroup.add(tree);
        }
        
        // Aggiungi alcuni alberi sparsi nell'interno dell'isola
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 20 + 5;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const treeType = Math.random() < 0.7 ? 'oak' : 'pine';
            const tree = createTree(x, z, treeType);
            islandGroup.add(tree);
        }
        
        // Aggiungi rocce sparse sull'isola
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 25;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const rock = createRock(x, z);
            islandGroup.add(rock);
        }
    }
    
    /**
     * Aggiunge una bandiera per identificare la squadra
     * @param {THREE.Group} islandGroup - Il gruppo dell'isola
     * @param {number} teamIndex - Indice della squadra
     */
    addTeamFlag(islandGroup, teamIndex) {
        const flagGroup = new THREE.Group();
        
        // Palo della bandiera
        const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 10, 8);
        const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 5;
        flagGroup.add(pole);
        
        // Bandiera
        const flagGeometry = new THREE.PlaneGeometry(4, 2);
        const flagMaterial = new THREE.MeshPhongMaterial({ 
            color: this.teamColors[teamIndex % this.teamColors.length],
            side: THREE.DoubleSide
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(2, 8, 0);
        flag.rotation.y = Math.PI / 2;
        flagGroup.add(flag);
        
        // Posiziona la bandiera al centro dell'isola
        flagGroup.position.set(0, 3, 0);
        islandGroup.add(flagGroup);
    }
    
    /**
     * Genera isole in base al numero di giocatori
     * @param {number} playerCount - Numero di giocatori
     */
    generateIslandsForPlayers(playerCount) {
        // Calcola quante isole sono necessarie
        const islandCount = Math.max(1, Math.ceil(playerCount / this.playersPerIsland));
        console.log(`Generazione di ${islandCount} isole per ${playerCount} giocatori`);
        
        // Genera le isole
        for (let i = 0; i < islandCount; i++) {
            // Calcola la posizione dell'isola
            let position;
            if (i === 0) {
                // La prima isola è al centro
                position = new THREE.Vector3(0, 0, 0);
            } else {
                // Le altre isole sono disposte in cerchio
                const angle = ((i - 1) / (islandCount - 1)) * Math.PI * 2;
                position = new THREE.Vector3(
                    Math.cos(angle) * this.islandSpacing,
                    0,
                    Math.sin(angle) * this.islandSpacing
                );
            }
            
            // Genera l'isola
            this.generateIslandForTeam(i, position);
        }
    }
    
    /**
     * Ottiene l'isola più vicina a una posizione
     * @param {THREE.Vector3} position - Posizione da controllare
     * @returns {Object|null} - L'isola più vicina o null se non ci sono isole
     */
    getNearestIsland(position) {
        if (this.islands.length === 0) {
            return null;
        }
        
        let nearestIsland = this.islands[0];
        let minDistance = position.distanceTo(nearestIsland.position);
        
        for (let i = 1; i < this.islands.length; i++) {
            const distance = position.distanceTo(this.islands[i].position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestIsland = this.islands[i];
            }
        }
        
        return nearestIsland;
    }
    
    /**
     * Ottiene tutte le isole generate
     * @returns {Array} - Array di oggetti isola
     */
    getAllIslands() {
        return this.islands;
    }
} 