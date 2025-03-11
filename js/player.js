import * as THREE from 'three';

/**
 * Classe per gestire il movimento del giocatore
 */
class Player {
    constructor(camera) {
        this.camera = camera;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = true;
        this.isRunning = false;
        
        // Costanti di movimento
        this.moveSpeed = 0.15;
        this.runSpeed = 0.3;
        this.jumpForce = 0.4;
        this.gravity = 0.015;
        
        // Rotazione della camera
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.PI_2 = Math.PI / 2;
        
        // Vettori temporanei per i calcoli
        this.moveDirection = new THREE.Vector3();
        this.forward = new THREE.Vector3();
        this.right = new THREE.Vector3();
        
        // Proprietà per la barca
        this.isInBoat = false;
        this.nearBoat = false;
        this.boat = null;
        this.minDistanceToEnterBoat = 3; // Ridotto per facilitare l'interazione
        
        // Crea il messaggio per la barca
        this.boatMessage = document.createElement('div');
        this.boatMessage.style.position = 'absolute';
        this.boatMessage.style.bottom = '50px';
        this.boatMessage.style.width = '100%';
        this.boatMessage.style.textAlign = 'center';
        this.boatMessage.style.color = 'white';
        this.boatMessage.style.fontSize = '24px';
        this.boatMessage.style.fontFamily = 'Arial, sans-serif';
        this.boatMessage.style.textShadow = '2px 2px 2px black';
        this.boatMessage.style.display = 'none';
        document.body.appendChild(this.boatMessage);
        
        // Imposta la posizione iniziale della camera
        this.camera.position.set(0, 7, 20);
        
        // Configura i controlli del mouse
        this.setupPointerLock();
        
        // Aggiungi i listener per i tasti
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Listener dedicato per il tasto E (entrare/uscire dalla barca)
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyE') {
                if (this.nearBoat) {
                    this.toggleBoat();
                }
            }
        });
    }
    
    setupPointerLock() {
        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === document.body) {
                // Rotazione orizzontale
                this.euler.y -= event.movementX * 0.002;
                
                // Rotazione verticale con limiti
                this.euler.x = Math.max(
                    -this.PI_2,
                    Math.min(this.PI_2, this.euler.x - event.movementY * 0.002)
                );
                
                // Applica la rotazione
                this.camera.quaternion.setFromEuler(this.euler);
            }
        });
        
        // Click per iniziare
        document.body.addEventListener('click', () => {
            if (document.pointerLockElement !== document.body) {
                document.body.requestPointerLock();
            }
        });
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                if (this.canJump) {
                    this.velocity.y = this.jumpForce;
                    this.canJump = false;
                }
                break;
            case 'ShiftLeft':
                this.isRunning = true;
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'ShiftLeft':
                this.isRunning = false;
                break;
        }
    }
    
    setBoat(boat) {
        this.boat = boat;
        console.log("Barca impostata:", boat);
    }
    
    toggleBoat() {
        if (!this.boat) {
            console.log("Nessuna barca disponibile");
            return;
        }
        
        if (this.isInBoat) {
            // Esci dalla barca
            this.isInBoat = false;
            // Posiziona il player leggermente spostato dalla barca
            const offset = new THREE.Vector3(2, 0, 0);
            offset.applyQuaternion(this.camera.quaternion);
            this.camera.position.copy(this.boat.position).add(offset);
            this.camera.position.y = 7;
            console.log("Uscito dalla barca");
        } else {
            // Entra nella barca
            this.isInBoat = true;
            this.camera.position.copy(this.boat.position);
            this.camera.position.y = 3;
            console.log("Entrato nella barca");
        }
        this.updateBoatMessage();
    }
    
    updateBoatMessage() {
        if (this.nearBoat) {
            this.boatMessage.textContent = this.isInBoat ? "Premi E per scendere dalla barca" : "Premi E per salire sulla barca";
            this.boatMessage.style.display = 'block';
        } else {
            this.boatMessage.style.display = 'none';
        }
    }
    
    checkBoatProximity() {
        if (!this.boat) return;
        
        const distance = this.camera.position.distanceTo(this.boat.position);
        const wasNear = this.nearBoat;
        this.nearBoat = distance < this.minDistanceToEnterBoat;
        
        // Debug: mostra la distanza dalla barca
        console.log(`Distanza dalla barca: ${distance.toFixed(2)}, Vicino: ${this.nearBoat}`);
        
        if (this.nearBoat !== wasNear) {
            this.updateBoatMessage();
        }
    }
    
    update() {
        // Controlla la vicinanza alla barca prima di tutto
        this.checkBoatProximity();
        
        // Applica la gravità solo se non siamo in barca
        if (!this.isInBoat) {
            this.velocity.y -= this.gravity;
            this.camera.position.y += this.velocity.y;
        }
        
        // Collisione con il terreno e l'acqua
        if (this.camera.position.y < (this.isInBoat ? 3 : 7)) {
            // Se non siamo in barca e siamo sopra l'acqua (non sull'isola)
            if (!this.isInBoat && this.camera.position.x * this.camera.position.x + this.camera.position.z * this.camera.position.z > 900) {
                // Respingi il player verso l'isola
                const dir = new THREE.Vector3(this.camera.position.x, 0, this.camera.position.z).normalize();
                this.camera.position.x -= dir.x * 2;
                this.camera.position.z -= dir.z * 2;
                console.log("Non puoi entrare in acqua! Usa una barca!");
            }
            
            this.camera.position.y = this.isInBoat ? 3 : 7;
            this.velocity.y = 0;
            this.canJump = !this.isInBoat;
        }
        
        // Calcola la velocità di movimento
        const speed = this.isRunning ? this.runSpeed : this.moveSpeed;
        
        // Resetta la direzione di movimento
        this.moveDirection.set(0, 0, 0);
        
        // Calcola la direzione in base alla rotazione della camera
        this.forward.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
        this.right.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
        
        // Rimuovi il componente Y per mantenere il movimento orizzontale
        this.forward.y = 0;
        this.right.y = 0;
        this.forward.normalize();
        this.right.normalize();
        
        // Aggiungi le direzioni in base ai tasti premuti
        if (this.moveForward) this.moveDirection.add(this.forward);
        if (this.moveBackward) this.moveDirection.sub(this.forward);
        if (this.moveRight) this.moveDirection.add(this.right);
        if (this.moveLeft) this.moveDirection.sub(this.right);
        
        // Normalizza la direzione se ci stiamo muovendo in diagonale
        if (this.moveDirection.lengthSq() > 0) {
            this.moveDirection.normalize();
        }
        
        // Applica il movimento
        this.camera.position.addScaledVector(this.moveDirection, speed);
        
        // Se siamo in barca, aggiorna la posizione della barca
        if (this.isInBoat && this.boat) {
            this.boat.position.x = this.camera.position.x;
            this.boat.position.z = this.camera.position.z;
            this.boat.rotation.y = this.euler.y;
        }
    }
}

/**
 * Inizializza il player
 * @param {THREE.Camera} camera - La camera della scena
 * @returns {Player} Il player inizializzato
 */
export function initPlayer(camera) {
    return new Player(camera);
} 