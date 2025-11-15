import * as THREE from 'three';

/**
 * Create a neon-styled ground plane with procedural emissive effects
 * @returns {THREE.Mesh} Ground mesh with animated neon shader
 */
export function createNeonGround() {
  // Create plane geometry (20x20 units)
  const geometry = new THREE.PlaneGeometry(20, 20, 32, 32);
  
  // Create material with PBR-like properties
  const material = new THREE.MeshStandardMaterial({
    color: 0x0a0f12,
    roughness: 0.9,
    metalness: 0.05,
    emissive: 0x000000
  });
  
  // Shader uniforms for animation and control
  const uniforms = {
    uTime: { value: 0 },
    uNoiseScale: { value: 2.0 },
    uNoiseSpeed: { value: 0.3 },
    uEmissiveColor: { value: new THREE.Color(0x00ffff) },
    uEmissiveIntensity: { value: 0.8 },
    uRimStrength: { value: 1.5 },
    uRimPower: { value: 2.0 }
  };
  
  // Modify shader with onBeforeCompile
  material.onBeforeCompile = (shader) => {
    // Add uniforms to shader
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uNoiseScale = uniforms.uNoiseScale;
    shader.uniforms.uNoiseSpeed = uniforms.uNoiseSpeed;
    shader.uniforms.uEmissiveColor = uniforms.uEmissiveColor;
    shader.uniforms.uEmissiveIntensity = uniforms.uEmissiveIntensity;
    shader.uniforms.uRimStrength = uniforms.uRimStrength;
    shader.uniforms.uRimPower = uniforms.uRimPower;
    
    // Inject vertex shader code for world position
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vWPos;`
    );
    
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
      vWPos = (modelMatrix * vec4(position, 1.0)).xyz;`
    );
    
    // Inject fragment shader code with noise functions and neon effect
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vWPos;
      uniform float uTime;
      uniform float uNoiseScale;
      uniform float uNoiseSpeed;
      uniform vec3 uEmissiveColor;
      uniform float uEmissiveIntensity;
      uniform float uRimStrength;
      uniform float uRimPower;
      
      // Simple 2D value noise
      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      
      // Simple FBM with 2 octaves (GPU-friendly)
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for (int i = 0; i < 2; i++) {
          value += amplitude * noise(p * frequency);
          frequency *= 2.0;
          amplitude *= 0.5;
        }
        
        return value;
      }`
    );
    
    // Replace emissive calculation with neon effect
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec3 totalEmissiveRadiance = emissive;',
      `// Animated noise pattern
      vec2 noisePos = vWPos.xz * uNoiseScale;
      float animTime = uTime * uNoiseSpeed;
      float noiseValue = fbm(noisePos + animTime);
      
      // Radial rings effect (animated)
      vec2 center = vec2(0.0);
      float dist = length(vWPos.xz - center);
      float rings = sin(dist * 3.0 - uTime * 2.0) * 0.5 + 0.5;
      
      // Combine noise and rings
      float emissiveMask = noiseValue * 0.3 + rings * 0.7;
      emissiveMask = smoothstep(0.4, 0.6, emissiveMask);
      
      // Fresnel rim effect
      vec3 viewDir = normalize(cameraPosition - vWPos);
      vec3 normalDir = normalize(vNormal);
      float fresnel = pow(1.0 - abs(dot(viewDir, normalDir)), uRimPower);
      float rimGlow = fresnel * uRimStrength;
      
      // Combine all effects
      vec3 neonRadiance = uEmissiveColor * (emissiveMask * uEmissiveIntensity + rimGlow);
      vec3 totalEmissiveRadiance = emissive + neonRadiance;`
    );
  };
  
  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);
  
  // Rotate to horizontal (ground) position
  mesh.rotation.x = -Math.PI / 2;
  
  // Position slightly below origin
  mesh.position.y = -0.5;
  
  // Update time uniform each frame
  mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
    uniforms.uTime.value = performance.now() * 0.001;
  };
  
  return mesh;
}
