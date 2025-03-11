import * as THREE from 'three';
import { MinecraftCharacter } from '../entities/MinecraftCharacter.js';

export class BoatController {
    constructor(boat, camera, scene, controls, island1, island2) {
        this.boat = boat;
        this.camera = camera;
        this.scene = scene;
        this.controls = controls;
        this.island1 = island1;
        this.island2 = island2;
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
        this.cameraOffset = new THREE.Vector3(0, 3, -10);
        this.cameraLookOffset = new THREE.Vector3(0, 2, 0);
        
        // Configurazione del movimento della barca
        this.boatSpeed = 0.3; // Velocità di movimento della barca
        this.boatRotationSpeed = 0.03; // Velocità di rotazione della barca
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.wavesIntensity = 0.2;
        this.waveFrequency = 2;
        this.journeyTime = 0;
        
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
            this.showMessage("Clicca per salire sulla barca");
        } else {
            this.hideMessage();
        }
    }
    
    onClick() {
        if (this.isTransitioning || !this.controls.isLocked) {
            console.log('Click ignorato: transizione in corso o controlli non bloccati');
            return;
        }
        
        // Se il giocatore è già sulla barca, ignora il click
        if (this.isPlayerInBoat) return;
        
        console.log('Click rilevato, verifico intersezione con la barca');
        
        // Usa la direzione della camera per il raycasting
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        // Verifica l'intersezione con la barca e tutti i suoi figli
        const intersects = this.raycaster.intersectObject(this.boat, true);
        
        if (intersects.length > 0) {
            const distance = intersects[0].distance;
            console.log('Intersezione con la barca rilevata, distanza:', distance);
            
            if (distance <= this.interactionDistance) {
                console.log('Distanza valida, salgo sulla barca');
                this.enterBoat();
            } else {
                console.log('Troppo lontano dalla barca:', distance);
            }
        } else {
            // Verifica se siamo comunque vicini alla barca
            const distanceToBoat = this.camera.position.distanceTo(this.boat.position);
            console.log('Nessuna intersezione diretta, distanza dalla barca:', distanceToBoat);
            
            if (distanceToBoat <= this.interactionDistance) {
                console.log('Abbastanza vicino alla barca, salgo sulla barca');
                this.enterBoat();
            }
        }
    }
    
    onKeyDown(event) {
        // Se il giocatore preme E, scende dalla barca
        if (this.isPlayerInBoat && event.code === 'KeyE') {
            this.exitBoat();
            return;
        }
        
        // Gestisci i comandi di movimento solo se il giocatore è sulla barca
        if (this.isPlayerInBoat) {
            switch (event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.moveForward = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.moveRight = true;
                    break;
            }
        }
    }
    
    onKeyUp(event) {
        // Gestisci il rilascio dei tasti solo se il giocatore è sulla barca
        if (this.isPlayerInBoat) {
            switch (event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.moveRight = false;
                    break;
            }
        }
    }
    
    enterBoat() {
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
        
        // Mostra un messaggio con le istruzioni
        this.showMessage("Usa WASD per muovere la barca, E per scendere");
        setTimeout(() => {
            if (this.isPlayerInBoat) {
                this.hideMessage();
            }
        }, 5000);
        
        console.log('Salito sulla barca!');
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
        // Calcola l'offset ruotato in base all'orientamento della barca
        const offset = this.cameraOffset.clone();
        offset.applyQuaternion(this.boat.quaternion);

        // Posizione target della telecamera dietro la barca
        const cameraTarget = new THREE.Vector3().copy(this.boat.position).add(offset);

        // Aggiungi movimento ondulatorio
        const waveOffset = Math.sin(this.journeyTime * 0.002 * this.waveFrequency) * this.wavesIntensity;
        cameraTarget.y += waveOffset;

        // Interpola la posizione della telecamera per un movimento fluido
        this.camera.position.lerp(cameraTarget, 0.1);

        // La telecamera guarda verso la barca con un offset verticale fisso
        const lookTarget = new THREE.Vector3().copy(this.boat.position).add(this.cameraLookOffset);
        this.camera.lookAt(lookTarget);
    }
    
    update() {
        if (!this.isPlayerInBoat) return;
        
        this.journeyTime += 16.67; // Circa 60 FPS
        
        // Movimento della barca in base ai comandi del giocatore
        const boatDirection = new THREE.Vector3(0, 0, 0);
        
        // Calcola la direzione di movimento
        if (this.moveForward) {
            boatDirection.z += 1;
        }
        if (this.moveBackward) {
            boatDirection.z -= 1;
        }
        
        // Applica la rotazione
        if (this.moveLeft) {
            this.boat.rotation.y += this.boatRotationSpeed;
        }
        if (this.moveRight) {
            this.boat.rotation.y -= this.boatRotationSpeed;
        }
        
        // Normalizza la direzione se necessario
        if (boatDirection.length() > 0) {
            boatDirection.normalize();
        }
        
        // Applica la rotazione della barca alla direzione di movimento
        boatDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.boat.rotation.y);
        
        // Calcola la nuova posizione
        const newPosition = new THREE.Vector3();
        newPosition.copy(this.boat.position);
        newPosition.add(boatDirection.multiplyScalar(this.boatSpeed));
        
        // Aggiungi movimento ondulatorio
        const waveOffset = Math.sin(this.journeyTime * 0.002 * this.waveFrequency) * this.wavesIntensity;
        newPosition.y = 0 + waveOffset;
        
        // Aggiorna la posizione della barca
        this.boat.position.copy(newPosition);
        
        // Rotazione naturale della barca (ondeggiamento)
        this.boat.rotation.x = waveOffset * 0.2;
        this.boat.rotation.z = Math.sin(this.journeyTime * 0.001) * 0.1;
        
        // Verifica se la barca tocca una delle isole
        const boatBox = new THREE.Box3().setFromObject(this.boat);
        const island1Box = new THREE.Box3().setFromObject(this.island1);
        const island2Box = new THREE.Box3().setFromObject(this.island2);

        if (boatBox.intersectsBox(island1Box)) {
            console.log("La barca ha raggiunto l'isola 1");
            this.exitBoat();
            // Posiziona il personaggio sull'isola 1 (aggiusta l'offset se necessario)
            this.character.model.position.copy(this.island1.position);
        } else if (boatBox.intersectsBox(island2Box)) {
            console.log("La barca ha raggiunto l'isola 2");
            this.exitBoat();
            // Posiziona il personaggio sull'isola 2
            this.character.model.position.copy(this.island2.position);
        }
        
        // Aggiorna la posizione della camera
        this.updateCameraPosition();
        
        // Aggiorna il personaggio Minecraft
        this.character.update(this.boat, this.journeyTime);
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