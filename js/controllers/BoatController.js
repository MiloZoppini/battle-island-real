import * as THREE from 'three';
import { MinecraftCharacter } from '../entities/MinecraftCharacter.js';

export class BoatController {
    constructor(boat, camera, scene, controls, islands = []) {
        this.boat = boat;
        this.camera = camera;
        this.scene = scene;
        this.controls = controls;
        this.islands = islands;
        this.isPlayerInBoat = false;
        this.raycaster = new THREE.Raycaster();
        this.interactionDistance = 10; // Aumentato per facilitare l'interazione
        this.transitionDuration = 1000;
        this.isTransitioning = false;
        
        // Crea il personaggio Minecraft
        this.character = new MinecraftCharacter();
        this.scene.add(this.character.model);
        console.log('Personaggio Minecraft creato e aggiunto alla scena');
        
        // Configurazione della telecamera
        this.cameraOffset = new THREE.Vector3(0, 2, -8); // Ridotto da 4 a 2 per adattarsi alla nuova altezza della barca
        this.cameraLookOffset = new THREE.Vector3(0, 1, 4); // Ridotto da 2 a 1 per adattarsi alla nuova altezza della barca
        
        // Configurazione del movimento della barca
        this.boatSpeed = 0.3;
        this.boatRotationSpeed = 0.03;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.boatDirection = new THREE.Vector3(0, 0, 1);
        this.wavesIntensity = 0.2;
        this.waveFrequency = 2;
        
        // Audio delle onde
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);
        this.waveSound = new THREE.Audio(this.audioListener);
        
        // Carica il suono delle onde
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('assets/sounds/waves.mp3', (buffer) => {
            this.waveSound.setBuffer(buffer);
            this.waveSound.setLoop(true);
            this.waveSound.setVolume(0.5);
            console.log('Suono delle onde caricato');
        }, 
        // Funzione di progresso
        (xhr) => {
            console.log('Caricamento audio: ' + (xhr.loaded / xhr.total * 100) + '%');
        },
        // Funzione di errore
        (error) => {
            console.error('Errore nel caricamento dell\'audio:', error);
        });
        
        // Binding dei metodi
        this.onClick = this.onClick.bind(this);
        this.update = this.update.bind(this);
        this.checkBoatProximity = this.checkBoatProximity.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.checkIslandCollision = this.checkIslandCollision.bind(this);
        
        // Event listeners
        document.addEventListener('click', this.onClick);
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        
        // Messaggio di debug
        console.log('BoatController inizializzato, barca posizionata a:', this.boat.position);
        
        // Verifica periodicamente la vicinanza alla barca per mostrare un messaggio
        this.proximityInterval = setInterval(this.checkBoatProximity, 1000);
        
        // Crea un messaggio di interazione
        this.createInteractionMessage();
    }
    
    createInteractionMessage() {
        this.message = document.createElement('div');
        this.message.style.position = 'absolute';
        this.message.style.bottom = '50px';
        this.message.style.width = '100%';
        this.message.style.textAlign = 'center';
        this.message.style.color = 'white';
        this.message.style.fontSize = '20px';
        this.message.style.fontFamily = 'Arial, sans-serif';
        this.message.style.textShadow = '2px 2px 2px black';
        this.message.style.display = 'none';
        document.body.appendChild(this.message);
    }
    
    showMessage(text) {
        this.message.textContent = text;
        this.message.style.display = 'block';
    }
    
    hideMessage() {
        this.message.style.display = 'none';
    }
    
    checkBoatProximity() {
        if (this.isPlayerInBoat || !this.controls.isLocked) return;
        
        // Calcola la distanza tra il giocatore e la barca
        const distance = this.camera.position.distanceTo(this.boat.position);
        
        if (distance <= this.interactionDistance) {
            this.showMessage("Premi E per salire sulla barca");
        } else {
            this.hideMessage();
        }
    }
    
    onClick() {
        // Non usiamo più il click per salire sulla barca
    }
    
    onKeyDown(event) {
        if (!this.controls.isLocked) return;
        
        // Se il giocatore è vicino alla barca e preme E, sale sulla barca
        if (!this.isPlayerInBoat && event.code === 'KeyE') {
            const distance = this.camera.position.distanceTo(this.boat.position);
            if (distance <= this.interactionDistance) {
                this.boardBoat();
            }
        }
        // Se il giocatore è sulla barca e preme E, scende dalla barca
        else if (this.isPlayerInBoat && event.code === 'KeyE') {
            this.exitBoat();
        }
        
        // Controlli di movimento della barca
        if (this.isPlayerInBoat) {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                    this.moveRight = true;
                    break;
            }
        }
    }
    
    onKeyUp(event) {
        // Ferma il movimento quando i tasti vengono rilasciati
        if (this.isPlayerInBoat) {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        }
    }
    
    boardBoat() {
        this.isPlayerInBoat = true;
        this.controls.enabled = false;
        
        // Mostra il personaggio Minecraft
        this.character.show();
        this.character.positionOnBoat(this.boat);
        
        // Avvia il suono delle onde
        if (this.waveSound && this.waveSound.buffer) {
            this.waveSound.play();
            console.log('Suono delle onde avviato');
        } else {
            console.warn('Audio delle onde non disponibile');
        }
        
        // Nascondi il messaggio di interazione
        this.hideMessage();
        
        console.log('Giocatore salito sulla barca!');
    }
    
    exitBoat() {
        this.isPlayerInBoat = false;
        this.controls.enabled = true;
        
        // Nascondi il personaggio Minecraft
        this.character.hide();
        
        // Ferma il suono delle onde
        if (this.waveSound) {
            this.waveSound.stop();
        }
        
        // Posiziona il giocatore vicino alla barca
        const exitPosition = new THREE.Vector3();
        exitPosition.copy(this.boat.position);
        exitPosition.y = 5; // Ridotto da 7 a 5 per adattarsi alla nuova altezza della barca
        exitPosition.z += 5; // Leggermente dietro la barca
        
        this.camera.position.copy(exitPosition);
        
        // Ripristina la rotazione della camera
        this.camera.rotation.set(0, 0, 0);
        
        console.log('Giocatore sceso dalla barca');
    }
    
    updateCameraPosition() {
        // Calcola la posizione della camera in base alla barca
        const cameraTarget = new THREE.Vector3();
        cameraTarget.copy(this.boat.position).add(this.cameraOffset);
        
        // Aggiungi movimento ondulatorio alla camera
        const time = Date.now();
        const waveOffset = Math.sin(time * 0.002 * this.waveFrequency) * this.wavesIntensity;
        cameraTarget.y += waveOffset;
        
        // Interpola la posizione della camera
        this.camera.position.lerp(cameraTarget, 0.1);
        
        // Fai guardare la camera verso la barca
        const lookTarget = new THREE.Vector3();
        lookTarget.copy(this.boat.position).add(this.cameraLookOffset);
        this.camera.lookAt(lookTarget);
    }
    
    checkIslandCollision() {
        if (!this.islands || this.islands.length === 0) return false;
        
        // Verifica la collisione con le isole
        for (const island of this.islands) {
            if (island.group && island.position) {
                const distance = this.boat.position.distanceTo(island.position);
                const collisionThreshold = 35; // Raggio dell'isola + margine
                
                if (distance < collisionThreshold) {
                    console.log('Barca arrivata all\'isola!');
                    return true;
                }
            }
        }
        
        return false;
    }
    
    update() {
        if (!this.isPlayerInBoat) return;
        
        // Movimento ondulatorio della barca
        const time = Date.now();
        const waveOffset = Math.sin(time * 0.002 * this.waveFrequency) * this.wavesIntensity;
        this.boat.position.y = 0 + waveOffset;
        
        // Rotazione naturale della barca
        this.boat.rotation.x = waveOffset * 0.2;
        this.boat.rotation.z = Math.sin(time * 0.001) * 0.1;
        
        // Movimento della barca in base ai tasti premuti
        if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
            // Calcola la direzione di movimento
            if (this.moveLeft) {
                this.boat.rotation.y += this.boatRotationSpeed;
            }
            if (this.moveRight) {
                this.boat.rotation.y -= this.boatRotationSpeed;
            }
            
            // Aggiorna la direzione della barca
            this.boatDirection.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.boat.rotation.y);
            
            // Muovi la barca avanti o indietro
            if (this.moveForward) {
                this.boat.position.x += this.boatDirection.x * this.boatSpeed;
                this.boat.position.z += this.boatDirection.z * this.boatSpeed;
            }
            if (this.moveBackward) {
                this.boat.position.x -= this.boatDirection.x * this.boatSpeed * 0.5; // Più lento all'indietro
                this.boat.position.z -= this.boatDirection.z * this.boatSpeed * 0.5;
            }
            
            // Verifica collisione con le isole
            if (this.checkIslandCollision()) {
                this.exitBoat();
                return;
            }
        }
        
        // Aggiorna la posizione della camera
        this.updateCameraPosition();
        
        // Aggiorna il personaggio Minecraft
        this.character.update(this.boat, time);
    }
    
    dispose() {
        document.removeEventListener('click', this.onClick);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        if (this.waveSound) {
            this.waveSound.stop();
        }
        if (this.audioListener) {
            this.camera.remove(this.audioListener);
        }
        if (this.message && this.message.parentNode) {
            this.message.parentNode.removeChild(this.message);
        }
        if (this.proximityInterval) {
            clearInterval(this.proximityInterval);
        }
        // Rimuovi il personaggio dalla scena
        if (this.character && this.character.model) {
            this.scene.remove(this.character.model);
        }
    }
} 