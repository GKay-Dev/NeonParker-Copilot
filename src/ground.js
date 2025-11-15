// save as src/ground.js
import * as THREE from 'three';

/**
 * Create a reusable neon ground mesh using MeshStandardMaterial.
 * - Adds animated emissive noise and rim glow in onBeforeCompile (no textures).
 * - GPU-friendly: simple value noise and pow-based rim term.
 * @returns {THREE.Mesh}
 */
export function createNeonGround() {
  const size = 120;
  const geom = new THREE.PlaneGeometry(size, size, 1, 1);
  geom.rotateX(-Math.PI * 0.5);

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x0b0f1a),
    metalness: 0.0,
    roughness: 0.85,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 1.0
  });

  // Custom uniforms for emissive noise and rim glow
  const uniforms = {
    uTime: { value: 0 },
    uNoiseScale: { value: new THREE.Vector2(0.5, 0.5) },
    uNoiseSpeed: { value: 0.15 },
    uGlowColor: { value: new THREE.Color(0x00ffff) },
    uGlowIntensity: { value: 0.7 },
    uRimColor: { value: new THREE.Color(0x66ccff) },
    uRimIntensity: { value: 0.9 },
    uRimPower: { value: 2.0 }
  };
  mat.userData.uniforms = uniforms;

  mat.onBeforeCompile = (shader) => {
    // Attach our uniforms to the material shader
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uNoiseScale = uniforms.uNoiseScale;
    shader.uniforms.uNoiseSpeed = uniforms.uNoiseSpeed;
    shader.uniforms.uGlowColor = uniforms.uGlowColor;
    shader.uniforms.uGlowIntensity = uniforms.uGlowIntensity;
    shader.uniforms.uRimColor = uniforms.uRimColor;
    shader.uniforms.uRimIntensity = uniforms.uRimIntensity;
    shader.uniforms.uRimPower = uniforms.uRimPower;

    // Varyings for world space data
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n varying vec3 vWorldPos;\n varying vec3 vWorldNormal;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>`).replace('worldPosition = modelMatrix * worldPosition;', 'worldPosition = modelMatrix * worldPosition;\n vWorldPos = worldPosition.xyz;\n vWorldNormal = normalize(mat3(modelMatrix) * normal);');

    // Fragment shader: add noise + rim and pipe into totalEmissiveRadiance
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n\n uniform float uTime;\n uniform vec2 uNoiseScale;\n uniform float uNoiseSpeed;\n uniform vec3 uGlowColor;\n uniform float uGlowIntensity;\n uniform vec3 uRimColor;\n uniform float uRimIntensity;\n uniform float uRimPower;\n varying vec3 vWorldPos;\n varying vec3 vWorldNormal;\n\n // Hash and value noise (cheap)\n float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p+34.345); return fract(p.x*p.y); }\n float vnoise(vec2 p){\n   vec2 i = floor(p);\n   vec2 f = fract(p);\n   // 4 corners\n   float a = hash21(i + vec2(0.0,0.0));\n   float b = hash21(i + vec2(1.0,0.0));\n   float c = hash21(i + vec2(0.0,1.0));\n   float d = hash21(i + vec2(1.0,1.0));\n   vec2 u = f*f*(3.0-2.0*f);\n   return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);\n }\n float fbm(vec2 p){\n   float s = 0.0; float a = 0.5;\n   for(int i=0;i<2;i++){ s += a * vnoise(p); p *= 2.0; a *= 0.5; }\n   return s;\n }')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\n // Animated emissive noise in world space XZ\n vec2 nUV = vWorldPos.xz * uNoiseScale + vec2(uTime * uNoiseSpeed);\n float n = fbm(nUV);\n vec3 glow = uGlowColor * (n * uGlowIntensity);\n\n // Rim glow based on view angle\n vec3 V = normalize(cameraPosition - vWorldPos);\n float rim = pow(1.0 - max(dot(normalize(vWorldNormal), V), 0.0), uRimPower);\n vec3 rimGlow = uRimColor * (rim * uRimIntensity);\n\n totalEmissiveRadiance += glow + rimGlow;');
  };

  const mesh = new THREE.Mesh(geom, mat);
  mesh.receiveShadow = false; // performance-friendly

  // Drive time uniform automatically
  mesh.onBeforeRender = function () {
    if (mat.userData?.uniforms?.uTime) {
      mat.userData.uniforms.uTime.value = (performance.now() || Date.now()) * 0.001;
    }
  };

  return mesh;
}
