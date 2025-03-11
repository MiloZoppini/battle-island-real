import * as THREE from 'three';

export class MinecraftCharacter {
    constructor() {
        this.model = new THREE.Group();
        this.createCharacter();
    }

    createCharacter() {
        // Colori Minecraft
        const skinColor = 0xc68642;
        const shirtColor = 0x3b5dc9;
        const pantsColor = 0x1a1a1a;
        const shoesColor = 0x4d2601;
        const hairColor = 0x3b2300;

        // Materiali
        const skinMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
        const shirtMaterial = new THREE.MeshLambertMaterial({ color: shirtColor });
        const pantsMaterial = new THREE.MeshLambertMaterial({ color: pantsColor });
        const shoesMaterial = new THREE.MeshLambertMaterial({ color: shoesColor });
        const hairMaterial = new THREE.MeshLambertMaterial({ color: hairColor });

        // Geometria di base per i cubi
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

        // Testa
        const head = new THREE.Mesh(cubeGeometry, skinMaterial);
        head.scale.set(0.8, 0.8, 0.8);
        head.position.y = 2.4;
        this.model.add(head);

        // Capelli
        const hair = new THREE.Mesh(cubeGeometry, hairMaterial);
        hair.scale.set(0.85, 0.2, 0.85);
        hair.position.y = 2.8;
        this.model.add(hair);

        // Occhi
        const eyeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.2, 2.5, 0.4);
        this.model.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.2, 2.5, 0.4);
        this.model.add(rightEye);

        // Corpo
        const body = new THREE.Mesh(cubeGeometry, shirtMaterial);
        body.scale.set(0.7, 1, 0.4);
        body.position.y = 1.5;
        this.model.add(body);

        // Braccia
        const leftArm = new THREE.Mesh(cubeGeometry, skinMaterial);
        leftArm.scale.set(0.3, 0.9, 0.3);
        leftArm.position.set(0.5, 1.5, 0);
        this.model.add(leftArm);

        const rightArm = new THREE.Mesh(cubeGeometry, skinMaterial);
        rightArm.scale.set(0.3, 0.9, 0.3);
        rightArm.position.set(-0.5, 1.5, 0);
        this.model.add(rightArm);

        // Gambe
        const leftLeg = new THREE.Mesh(cubeGeometry, pantsMaterial);
        leftLeg.scale.set(0.3, 0.9, 0.3);
        leftLeg.position.set(0.2, 0.5, 0);
        this.model.add(leftLeg);

        const rightLeg = new THREE.Mesh(cubeGeometry, pantsMaterial);
        rightLeg.scale.set(0.3, 0.9, 0.3);
        rightLeg.position.set(-0.2, 0.5, 0);
        this.model.add(rightLeg);

        // Scarpe
        const leftShoe = new THREE.Mesh(cubeGeometry, shoesMaterial);
        leftShoe.scale.set(0.35, 0.2, 0.35);
        leftShoe.position.set(0.2, 0.1, 0);
        this.model.add(leftShoe);

        const rightShoe = new THREE.Mesh(cubeGeometry, shoesMaterial);
        rightShoe.scale.set(0.35, 0.2, 0.35);
        rightShoe.position.set(-0.2, 0.1, 0);
        this.model.add(rightShoe);

        // Scala il modello intero
        this.model.scale.set(0.8, 0.8, 0.8);
        
        // Nascondi il modello inizialmente
        this.model.visible = false;
    }

    // Posiziona il personaggio sulla barca
    positionOnBoat(boat) {
        this.model.position.copy(boat.position);
        // Posiziona il personaggio più in alto sulla barca per evitare che venga tagliato
        this.model.position.y += 2.5; // Aumentato da 1.5 a 2.5
        this.model.position.z += 0.5;
        // Ruota il personaggio per guardare avanti
        this.model.rotation.y = boat.rotation.y;
    }

    // Mostra il personaggio
    show() {
        this.model.visible = true;
    }

    // Nascondi il personaggio
    hide() {
        this.model.visible = false;
    }

    // Aggiorna la posizione e rotazione del personaggio in base alla barca
    update(boat, time) {
        this.positionOnBoat(boat);
        
        // Aggiungi un leggero movimento di oscillazione per simulare il movimento della barca
        const swayAmount = Math.sin(time * 0.002) * 0.05;
        this.model.rotation.z = swayAmount;
        this.model.rotation.x = Math.sin(time * 0.001) * 0.03;
    }
} 