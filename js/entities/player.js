import * as THREE from 'https://unpkg.com/three@0.149.0/build/three.module.js';

/**
 * Classe che rappresenta il giocatore
 */
export class Player {
    /**
     * Crea un nuovo giocatore
     * @param {THREE.Scene} scene - La scena Three.js
     * @param {PointerLockControls} controls - I controlli per la visuale in prima persona
     * @param {THREE.Vector3} position - La posizione iniziale del giocatore
     */
    constructor(scene, controls, position) {
        this.scene = scene;
        this.controls = controls;
        this.position = position;
        
        // Imposta la posizione iniziale dei controlli
        this.controls.getObject().position.copy(position);
        
        // Altezza degli occhi (offset dalla posizione del giocatore)
        this.eyeHeight = 1.6;
        this.controls.getObject().position.y += this.eyeHeight;
        
        // Parametri fisici
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3(0, 0, 0);
        this.moveSpeed = 10.0; // Velocità di movimento
        this.jumpHeight = 10.0; // Altezza del salto
        this.gravity = 30.0; // Forza di gravità
        
        // Stato del giocatore
        this.isOnGround = false;
        this.canJump = true;
        
        // Stato dei tasti
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };
        
        // Inizializza i controlli
        this.initControls();
        
        console.log('Giocatore creato alla posizione', position);
    }
    
    /**
     * Inizializza i controlli del giocatore
     */
    initControls() {
        // Aggiungi listener per i tasti premuti
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = true;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
                case 'Space':
                    this.keys.jump = true;
                    break;
            }
        });
        
        // Aggiungi listener per i tasti rilasciati
        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
                case 'Space':
                    this.keys.jump = false;
                    break;
            }
        });
        
        console.log('Controlli del giocatore inizializzati');
    }
    
    /**
     * Aggiorna lo stato del giocatore
     * @param {number} deltaTime - Il tempo trascorso dall'ultimo aggiornamento
     */
    update(deltaTime) {
        if (!this.controls.isLocked) {
            return;
        }
        
        // Applica la gravità
        this.velocity.y -= this.gravity * deltaTime;
        
        // Calcola la direzione di movimento basata sull'input
        this.direction.z = Number(this.keys.forward) - Number(this.keys.backward);
        this.direction.x = Number(this.keys.right) - Number(this.keys.left);
        this.direction.normalize(); // Normalizza per evitare velocità maggiore in diagonale
        
        // Ottieni la direzione della camera
        const camera = this.controls.getObject();
        
        // Calcola il movimento in base alla direzione della camera
        if (this.keys.forward || this.keys.backward) {
            this.velocity.z = this.direction.z * this.moveSpeed;
        } else {
            this.velocity.z = 0;
        }
        
        if (this.keys.left || this.keys.right) {
            this.velocity.x = this.direction.x * this.moveSpeed;
        } else {
            this.velocity.x = 0;
        }
        
        // Gestisci il salto
        if (this.keys.jump && this.isOnGround) {
            this.velocity.y = this.jumpHeight;
            this.isOnGround = false;
        }
        
        // Muovi il giocatore
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        
        const cameraRight = new THREE.Vector3(
            cameraDirection.z,
            0,
            -cameraDirection.x
        );
        
        const moveX = this.velocity.x * deltaTime;
        const moveZ = this.velocity.z * deltaTime;
        const moveY = this.velocity.y * deltaTime;
        
        // Applica il movimento in base alla direzione della camera
        if (moveZ !== 0) {
            camera.position.addScaledVector(cameraDirection, moveZ);
        }
        
        if (moveX !== 0) {
            camera.position.addScaledVector(cameraRight, moveX);
        }
        
        // Applica la gravità
        camera.position.y += moveY;
        
        // Controllo collisione con il terreno
        if (camera.position.y < this.position.y + this.eyeHeight) {
            camera.position.y = this.position.y + this.eyeHeight;
            this.velocity.y = 0;
            this.isOnGround = true;
        }
    }
}