// WebGL Shader Background
class ShaderBackground {
    constructor() {
        this.canvas = document.getElementById('shaderCanvas');
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.warn('WebGL not supported, falling back to CSS background');
            return;
        }
        
        this.time = 0;
        this.mouse = { x: 0.5, y: 0.5 };
        this.puddles = [];
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Force initial resize to ensure proper canvas sizing
        this.resizeCanvas();
        
        // Force another resize after a short delay to handle any timing issues
        setTimeout(() => this.resizeCanvas(), 100);
        
        // Vertex shader
        const vertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // Fragment shader with expanding puddle effects
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec2 u_mouse;
            uniform vec3 u_puddles[10];
            
            float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            float smoothNoise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                
                float a = noise(i);
                float b = noise(i + vec2(1.0, 0.0));
                float c = noise(i + vec2(0.0, 1.0));
                float d = noise(i + vec2(1.0, 1.0));
                
                vec2 u = f * f * (3.0 - 2.0 * f);
                
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            void main() {
                vec2 st = gl_FragCoord.xy / u_resolution.xy;
                
                // Deep purple gradient background
                vec3 color1 = vec3(0.05, 0.02, 0.08);  // Very dark purple
                vec3 color2 = vec3(0.08, 0.04, 0.12);  // Dark purple
                vec3 color3 = vec3(0.12, 0.06, 0.18);  // Medium dark purple
                
                // Create smooth gradient
                float gradient = st.y * 0.7 + 0.3;
                vec3 baseColor = mix(color1, color2, gradient);
                baseColor = mix(baseColor, color3, gradient * 0.2);
                
                // Very subtle texture
                float noiseValue = smoothNoise(st * 12.0 + u_time * 0.05) * 0.015;
                baseColor += noiseValue;
                
                // Minimal puddle effects (much more subtle)
                float puddleEffect = 0.0;
                for(int i = 0; i < 10; i++) {
                    vec3 puddle = u_puddles[i];
                    if(puddle.z > 0.0) {
                        float dist = distance(st, puddle.xy);
                        
                        // Very subtle expanding effect
                        float expansion = puddle.z * 1.5;
                        float puddleRadius = expansion * 0.2;
                        
                        // Soft, barely visible puddle
                        float puddleMask = 1.0 - smoothstep(0.0, puddleRadius, dist);
                        puddleMask *= smoothstep(puddleRadius * 0.9, puddleRadius, dist);
                        
                        puddleEffect += puddleMask * puddle.z * 0.05;
                    }
                }
                
                // Subtle mouse interaction
                vec2 mousePos = u_mouse;
                float mouseDist = distance(st, mousePos);
                float mouseGlow = exp(-mouseDist * 12.0) * 0.03;
                
                // Apply minimal effects
                vec3 finalColor = baseColor;
                finalColor += puddleEffect * vec3(0.2, 0.3, 0.4);
                finalColor += mouseGlow * vec3(0.15, 0.2, 0.3);
                
                // Very subtle movement
                float flow = sin(st.x * 2.0 + u_time * 0.2) * cos(st.y * 1.5 + u_time * 0.15) * 0.008;
                finalColor += flow * vec3(0.1, 0.15, 0.2);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        // Create shaders
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        // Create program
        this.program = this.createProgram(vertexShader, fragmentShader);
        
        // Get uniform locations
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
            puddles: this.gl.getUniformLocation(this.program, 'u_puddles')
        };
        
        // Create buffer
        const positions = [
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1,
        ];
        
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        
        // Get attribute location
        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }
    
    resizeCanvas() {
        // Set canvas size to match actual display size
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;
        
        // Set the canvas size
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
        
        // Set the canvas style size to match
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        
        this.gl.viewport(0, 0, displayWidth, displayHeight);
        

    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Mouse movement with canvas-relative coordinate mapping
        document.addEventListener('mousemove', (e) => {
            // Get canvas bounding rect for accurate positioning
            const rect = this.canvas.getBoundingClientRect();
            
            // Calculate mouse position relative to canvas
            this.mouse.x = (e.clientX - rect.left) / rect.width;
            this.mouse.y = 1.0 - ((e.clientY - rect.top) / rect.height);
            
            // Clamp values to ensure they stay within 0-1 range
            this.mouse.x = Math.max(0, Math.min(1, this.mouse.x));
            this.mouse.y = Math.max(0, Math.min(1, this.mouse.y));
            

        });
        
        // Click to create puddles
        document.addEventListener('click', (e) => {
            // Get canvas bounding rect for accurate positioning
            const rect = this.canvas.getBoundingClientRect();
            
            // Calculate click position relative to canvas
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1.0 - ((e.clientY - rect.top) / rect.height);
            
            // Clamp values and add puddle
            const clampedX = Math.max(0, Math.min(1, x));
            const clampedY = Math.max(0, Math.min(1, y));
            this.addPuddle(clampedX, clampedY);
        });
        
        // Very occasional subtle effects
        setInterval(() => {
            const x = Math.random();
            const y = Math.random();
            this.addPuddle(x, y, 0.3);
        }, 8000 + Math.random() * 10000);
    }
    
    addPuddle(x, y, intensity = 0.5) {
        // Find empty slot or replace oldest
        let slot = this.puddles.findIndex(p => p.intensity <= 0);
        if (slot === -1) {
            slot = 0;
            this.puddles.shift();
        }
        
        this.puddles[slot] = {
            x: x,
            y: y,
            intensity: intensity,
            time: this.time
        };
    }
    
    animate() {
        if (!this.gl) return;
        
        this.time += 0.016; // ~60fps
        
        // Update puddles
        this.puddles.forEach(puddle => {
            if (puddle.intensity > 0) {
                puddle.intensity -= 0.005; // Slower decay for expanding effect
                if (puddle.intensity < 0) puddle.intensity = 0;
            }
        });
        
        // Clear canvas
        this.gl.clearColor(0.1, 0.2, 0.4, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // Use shader program
        this.gl.useProgram(this.program);
        
        // Set uniforms
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, this.time);
        this.gl.uniform2f(this.uniforms.mouse, this.mouse.x, this.mouse.y);
        
        // Set puddles
        const puddleData = new Float32Array(30); // 10 puddles * 3 values each
        for (let i = 0; i < 10; i++) {
            const puddle = this.puddles[i];
            if (puddle) {
                puddleData[i * 3] = puddle.x;
                puddleData[i * 3 + 1] = puddle.y;
                puddleData[i * 3 + 2] = puddle.intensity;
            } else {
                puddleData[i * 3] = 0;
                puddleData[i * 3 + 1] = 0;
                puddleData[i * 3 + 2] = 0;
            }
        }
        this.gl.uniform3fv(this.uniforms.puddles, puddleData);
        
        // Set up attributes
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
        
        // Draw
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ShaderBackground();
});
