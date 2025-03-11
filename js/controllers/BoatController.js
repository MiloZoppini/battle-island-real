import * as THREE from 'three';
import { MinecraftCharacter } from '../entities/MinecraftCharacter.js';

export class BoatController {
    constructor(boat, camera, scene, controls) {
        this.boat = boat;
        this.camera = camera;
        this.scene = scene;
        this.controls = controls;
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
        this.cameraOffset = new THREE.Vector3(0, 4, -8); // Posizione della camera in terza persona
        this.cameraLookOffset = new THREE.Vector3(0, 2, 4); // Punto dove guarda la camera
        
        // Configurazione del viaggio
        this.journeyStarted = false;
        this.journeyTime = 0;
        this.journeyDuration = 20000; // 20 secondi di viaggio
        this.startPosition = new THREE.Vector3(32, 0, 0); // Posizione iniziale della barca
        this.endPosition = new THREE.Vector3(200, 0, 0); // Posizione finale della barca
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
        
        // Event listeners
        document.addEventListener('click', this.onClick);
        document.addEventListener('keydown', this.onKeyDown);
        
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
        if (this.journeyStarted || !this.controls.isLocked) return;
        
        // Calcola la distanza tra il giocatore e la barca
        const distance = this.camera.position.distanceTo(this.boat.position);
        
        if (distance <= this.interactionDistance) {
            this.showMessage("Clicca per salire sulla barca");
        } else {
            this.hideMessage();
        }
    }
    
    onClick() {
        if (this.isTransitioning || !this.controls.isLocked || this.journeyStarted) {
            console.log('Click ignorato: transizione in corso o controlli non bloccati');
            return;
        }
        
        console.log('Click rilevato, verifico intersezione con la barca');
        
        // Usa la direzione della camera per il raycasting
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        // Verifica l'intersezione con la barca e tutti i suoi figli
        const intersects = this.raycaster.intersectObject(this.boat, true);
        
        if (intersects.length > 0) {
            const distance = intersects[0].distance;
            console.log('Intersezione con la barca rilevata, distanza:', distance);
            
            if (distance <= this.interactionDistance) {
                console.log('Distanza valida, avvio il viaggio');
                this.startJourney();
            } else {
                console.log('Troppo lontano dalla barca:', distance);
            }
        } else {
            // Verifica se siamo comunque vicini alla barca
            const distanceToBoat = this.camera.position.distanceTo(this.boat.position);
            console.log('Nessuna intersezione diretta, distanza dalla barca:', distanceToBoat);
            
            if (distanceToBoat <= this.interactionDistance) {
                console.log('Abbastanza vicino alla barca, avvio il viaggio');
                this.startJourney();
            }
        }
    }
    
    onKeyDown(event) {
        // Se il giocatore preme E, scende dalla barca
        if (this.isPlayerInBoat && event.code === 'KeyE') {
            this.exitBoat();
        }
    }
    
    startJourney() {
        this.isPlayerInBoat = true;
        this.journeyStarted = true;
        this.journeyTime = 0;
        this.controls.enabled = false;
        
        // Salva la posizione iniziale
        this.initialCameraPosition = this.camera.position.clone();
        this.initialBoatPosition = this.boat.position.clone();
        
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
        
        console.log('Viaggio iniziato!');
    }
    
    exitBoat() {
        this.isPlayerInBoat = false;
        this.journeyStarted = false;
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
        exitPosition.y = 7; // Altezza del giocatore
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
        const waveOffset = Math.sin(this.journeyTime * 0.002 * this.waveFrequency) * this.wavesIntensity;
        cameraTarget.y += waveOffset;
        
        // Interpola la posizione della camera
        this.camera.position.lerp(cameraTarget, 0.1);
        
        // Fai guardare la camera verso la barca
        const lookTarget = new THREE.Vector3();
        lookTarget.copy(this.boat.position).add(this.cameraLookOffset);
        this.camera.lookAt(lookTarget);
    }
    
    update() {
        if (!this.journeyStarted) return;
        
        this.journeyTime += 16.67; // Circa 60 FPS
        const progress = Math.min(this.journeyTime / this.journeyDuration, 1);
        
        // Movimento della barca
        const newPosition = new THREE.Vector3();
        newPosition.lerpVectors(this.startPosition, this.endPosition, progress);
        
        // Aggiungi movimento ondulatorio
        const waveOffset = Math.sin(this.journeyTime * 0.002 * this.waveFrequency) * this.wavesIntensity;
        newPosition.y = 0 + waveOffset;
        
        // Aggiorna la posizione della barca
        this.boat.position.copy(newPosition);
        
        // Rotazione naturale della barca
        this.boat.rotation.x = waveOffset * 0.2;
        this.boat.rotation.z = Math.sin(this.journeyTime * 0.001) * 0.1;
        
        // Fai guardare la barca nella direzione del movimento
        this.boat.rotation.y = Math.atan2(
            this.endPosition.x - this.startPosition.x,
            this.endPosition.z - this.startPosition.z
        );
        
        // Aggiorna la posizione della camera
        this.updateCameraPosition();
        
        // Aggiorna il personaggio Minecraft
        this.character.update(this.boat, this.journeyTime);
        
        // Controlla se il viaggio è completato
        if (progress >= 1) {
            this.exitBoat();
        }
    }
    
    dispose() {
        document.removeEventListener('click', this.onClick);
        document.removeEventListener('keydown', this.onKeyDown);
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