import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class CloudGenerator {
    constructor(scene, options = {}) {
        this.scene = scene;
        
        // Opzioni di configurazione con valori predefiniti
        this.options = {
            numClouds: options.numClouds || 10,
            minHeight: options.minHeight || 100,
            maxHeight: options.maxHeight || 150,
            cloudScale: options.cloudScale || 20,
            noiseScale: options.noiseScale || 0.1,
            threshold: options.threshold || 0.3,
            opacity: options.opacity || 0.8,
            color: options.color || 0xffffff,
            size: options.size || { x: 10, y: 3, z: 10 },
            bounds: options.bounds || { x: 500, z: 500 }
        };
        
        // Inizializza il generatore di rumore
        this.noise2D = createNoise2D();
        
        // Crea il materiale per i cubi delle nuvole
        this.cloudMaterial = new THREE.MeshPhongMaterial({
            color: this.options.color,
            transparent: true,
            opacity: this.options.opacity,
            side: THREE.DoubleSide
        });
        
        // Array per tenere traccia delle nuvole
        this.clouds = [];
        
        // Geometria condivisa per tutti i cubi
        this.cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    }
    
    generateCloud(x, y, z) {
        const cloud = new THREE.Group();
        const { size } = this.options;
        
        // Genera la forma della nuvola usando il rumore
        for (let dx = 0; dx < size.x; dx++) {
            for (let dy = 0; dy < size.y; dy++) {
                for (let dz = 0; dz < size.z; dz++) {
                    // Calcola il valore del rumore per questa posizione
                    const noiseValue = this.noise2D(
                        (x + dx) * this.options.noiseScale,
                        (z + dz) * this.options.noiseScale
                    );
                    
                    // Aggiungi variazione verticale
                    const heightFactor = 1 - (dy / size.y);
                    const density = noiseValue * heightFactor;
                    
                    // Se la densità supera la soglia, aggiungi un cubo
                    if (density > this.options.threshold) {
                        const cube = new THREE.Mesh(this.cubeGeometry, this.cloudMaterial);
                        cube.position.set(dx, dy, dz);
                        cloud.add(cube);
                    }
                }
            }
        }
        
        // Posiziona la nuvola
        cloud.position.set(x, y, z);
        return cloud;
    }
    
    generateClouds() {
        // Rimuovi le nuvole esistenti
        this.clouds.forEach(cloud => {
            this.scene.remove(cloud);
        });
        this.clouds = [];
        
        // Genera nuove nuvole
        for (let i = 0; i < this.options.numClouds; i++) {
            const x = (Math.random() - 0.5) * this.options.bounds.x;
            const z = (Math.random() - 0.5) * this.options.bounds.z;
            const y = this.options.minHeight + Math.random() * (this.options.maxHeight - this.options.minHeight);
            
            const cloud = this.generateCloud(x, y, z);
            this.clouds.push(cloud);
            this.scene.add(cloud);
        }
    }
    
    update(deltaTime) {
        // Muovi lentamente le nuvole
        this.clouds.forEach((cloud, index) => {
            cloud.position.x += Math.sin(deltaTime * 0.001 + index) * 0.05;
            cloud.position.z += Math.cos(deltaTime * 0.001 + index) * 0.05;
            
            // Riporta le nuvole dentro i limiti se escono
            if (cloud.position.x > this.options.bounds.x / 2) {
                cloud.position.x = -this.options.bounds.x / 2;
            }
            if (cloud.position.x < -this.options.bounds.x / 2) {
                cloud.position.x = this.options.bounds.x / 2;
            }
            if (cloud.position.z > this.options.bounds.z / 2) {
                cloud.position.z = -this.options.bounds.z / 2;
            }
            if (cloud.position.z < -this.options.bounds.z / 2) {
                cloud.position.z = this.options.bounds.z / 2;
            }
        });
    }
} 