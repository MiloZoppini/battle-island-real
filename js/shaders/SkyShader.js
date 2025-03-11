import * as THREE from 'three';

export class SkyShader {
    constructor() {
        // Vertex shader
        this.vertexShader = `
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                vNormal = normalize(normalMatrix * normal);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        // Fragment shader
        this.fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            
            void main() {
                // Calcola il gradiente basato sulla posizione Y normalizzata
                float h = normalize(vWorldPosition + offset).y;
                float gradientFactor = max(pow(max(h, 0.0), exponent), 0.0);
                
                // Interpola tra i due colori
                vec3 sky = mix(bottomColor, topColor, gradientFactor);
                
                gl_FragColor = vec4(sky, 1.0);
            }
        `;
        
        // Parametri di default per il materiale
        this.uniforms = {
            topColor: { value: new THREE.Color(0x7AB5E6) },    // Blu chiaro per la parte alta
            bottomColor: { value: new THREE.Color(0x87CEEB) }, // Azzurro più intenso per l'orizzonte
            offset: { value: 10 },
            exponent: { value: 0.6 }
        };
        
        // Crea il materiale dello shader
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            side: THREE.BackSide,
            fog: false
        });
    }
    
    /**
     * Crea una mesh sferica per il cielo
     * @param {number} radius - Il raggio della sfera del cielo
     * @returns {THREE.Mesh} - La mesh del cielo
     */
    createSky(radius = 1000) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        return new THREE.Mesh(geometry, this.material);
    }
    
    /**
     * Aggiorna i colori del cielo
     * @param {THREE.Color} topColor - Il colore della parte alta del cielo
     * @param {THREE.Color} bottomColor - Il colore dell'orizzonte
     */
    updateColors(topColor, bottomColor) {
        this.uniforms.topColor.value.copy(topColor);
        this.uniforms.bottomColor.value.copy(bottomColor);
    }
    
    /**
     * Aggiorna i parametri del gradiente
     * @param {number} offset - L'offset del gradiente
     * @param {number} exponent - L'esponente per controllare la transizione
     */
    updateGradient(offset, exponent) {
        this.uniforms.offset.value = offset;
        this.uniforms.exponent.value = exponent;
    }
} 