/**
 * WebXR Controller - Manages WebXR AR session with plane detection
 * For Android Chrome with ARCore support only
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class WebXRController {
  constructor() {
    this.session = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.reticle = null;
    this.hitTestSource = null;
    this.hitTestSourceRequested = false;
    this.referenceSpace = null;
    this.placedModels = [];
    this.modelTemplate = null;
    this.isActive = false;
  }

  async startSession(container, modelPath, callbacks = {}) {
    console.log('[WebXR] Starting session...');
    
    if (this.isActive) {
      console.warn('[WebXR] Session already active');
      return;
    }

    // Check WebXR support
    console.log('[WebXR] Navigator.xr available:', !!navigator.xr);
    if (!navigator.xr) {
      throw new Error('WebXR not supported on this browser');
    }

    console.log('[WebXR] Checking immersive-ar support...');
    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    console.log('[WebXR] Immersive AR supported:', supported);
    
    if (!supported) {
      throw new Error('Immersive AR not supported on this device');
    }

    try {
      console.log('[WebXR] Initializing Three.js scene...');
      
      // Initialize Three.js scene
      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.xr.enabled = true;
      container.appendChild(this.renderer.domElement);

      // Setup lighting
      this.setupLights();

      // Create reticle
      this.createReticle();

      // Load model template
      if (modelPath) {
        console.log('[WebXR] Loading 3D model...');
        await this.loadModelTemplate(modelPath);
        console.log('[WebXR] Model loaded successfully');
      }

      // Request XR session with fallback
      console.log('[WebXR] Requesting XR session with hit-test...');
      try {
        this.session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test'],
          optionalFeatures: ['dom-overlay'],
          domOverlay: { root: document.body }
        });
        console.log('[WebXR] Session granted with hit-test');
      } catch (error) {
        console.warn('[WebXR] Hit-test not available, trying without...', error.name);
        
        // Fallback: Try without hit-test as required feature
        this.session = await navigator.xr.requestSession('immersive-ar', {
          optionalFeatures: ['hit-test', 'dom-overlay'],
          domOverlay: { root: document.body }
        });
        console.log('[WebXR] Session granted without hit-test requirement');
      }

      console.log('[WebXR] Session created:', !!this.session);
      
      await this.renderer.xr.setSession(this.session);
      console.log('[WebXR] Renderer XR session set');

      // Get reference space
      this.referenceSpace = await this.session.requestReferenceSpace('local');
      console.log('[WebXR] Reference space obtained');

      // Setup hit-test source on first frame
      this.session.requestAnimationFrame((time, frame) => {
        this.setupHitTestSource(frame);
      });

      this.isActive = true;
      console.log('[WebXR] Session started successfully!');

      if (callbacks.onStart) {
        callbacks.onStart();
      }

      // Handle session end
      this.session.addEventListener('end', () => {
        console.log('[WebXR] Session ended');
        this.isActive = false;
        if (callbacks.onEnd) {
          callbacks.onEnd();
        }
      });

    } catch (error) {
      console.error('[WebXR] Session request failed:', error.name, error.message);
      console.error('[WebXR] Full error:', error);
      await this.stopSession();
      throw error;
    }
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 2, 1);
    this.scene.add(directionalLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    this.scene.add(hemiLight);
  }

  createReticle() {
    const geometry = new THREE.RingGeometry(0.12, 0.15, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      opacity: 0.7,
      transparent: true
    });

    this.reticle = new THREE.Mesh(geometry, material);
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    this.scene.add(this.reticle);
  }

  async loadModelTemplate(modelPath) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      
      loader.load(
        modelPath,
        (gltf) => {
          this.modelTemplate = gltf.scene;

          // Center the model
          const box = new THREE.Box3().setFromObject(this.modelTemplate);
          const center = new THREE.Vector3();
          box.getCenter(center);

          this.modelTemplate.children.forEach(child => {
            child.position.sub(center);
          });

          // Set appropriate scale for AR
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 0.3 / maxDim; // ~30cm size
          this.modelTemplate.scale.setScalar(scale);

          // Optimize materials
          this.modelTemplate.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              if (node.material) {
                node.material.needsUpdate = true;
              }
            }
          });

          resolve(this.modelTemplate);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  async setupHitTestSource(frame) {
    if (this.hitTestSourceRequested) return;
    
    this.hitTestSourceRequested = true;

    const session = frame.session;
    const viewerSpace = await session.requestReferenceSpace('viewer');

    this.hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
  }

  updateReticle(frame) {
    if (!this.hitTestSource || !this.reticle) return;

    const hitTestResults = frame.getHitTestResults(this.hitTestSource);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(this.referenceSpace);

      if (pose) {
        this.reticle.visible = true;
        this.reticle.matrix.fromArray(pose.transform.matrix);
      }
    } else {
      this.reticle.visible = false;
    }
  }

  placeModel() {
    if (!this.reticle.visible || !this.modelTemplate) {
      return null;
    }

    // Clone the model
    const model = this.modelTemplate.clone();

    // Get reticle position and orientation
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    this.reticle.matrix.decompose(position, quaternion, scale);

    model.position.copy(position);
    model.quaternion.copy(quaternion);

    this.scene.add(model);
    this.placedModels.push(model);

    return model;
  }

  removeLastModel() {
    if (this.placedModels.length > 0) {
      const model = this.placedModels.pop();
      this.scene.remove(model);
      
      // Dispose geometry and materials
      model.traverse((node) => {
        if (node.isMesh) {
          if (node.geometry) node.geometry.dispose();
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach(mat => this.disposeMaterial(mat));
            } else {
              this.disposeMaterial(node.material);
            }
          }
        }
      });
    }
  }

  clearAllModels() {
    while (this.placedModels.length > 0) {
      this.removeLastModel();
    }
  }

  getPlacedModelsCount() {
    return this.placedModels.length;
  }

  isReticleVisible() {
    return this.reticle ? this.reticle.visible : false;
  }

  async stopSession() {
    console.log('Stopping WebXR session...');

    // Clear all placed models
    this.clearAllModels();

    // Remove reticle
    if (this.reticle) {
      this.scene.remove(this.reticle);
      this.reticle.geometry.dispose();
      this.reticle.material.dispose();
      this.reticle = null;
    }

    // Dispose model template
    if (this.modelTemplate) {
      this.modelTemplate.traverse((node) => {
        if (node.isMesh) {
          if (node.geometry) node.geometry.dispose();
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach(mat => this.disposeMaterial(mat));
            } else {
              this.disposeMaterial(node.material);
            }
          }
        }
      });
      this.modelTemplate = null;
    }

    // End XR session
    if (this.session) {
      try {
        await this.session.end();
      } catch (error) {
        console.error('Error ending XR session:', error);
      }
      this.session = null;
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    // Clear scene
    if (this.scene) {
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
      this.scene = null;
    }

    this.camera = null;
    this.hitTestSource = null;
    this.hitTestSourceRequested = false;
    this.referenceSpace = null;
    this.placedModels = [];
    this.isActive = false;

    console.log('WebXR session stopped successfully');
  }

  disposeMaterial(material) {
    if (material.map) material.map.dispose();
    if (material.lightMap) material.lightMap.dispose();
    if (material.bumpMap) material.bumpMap.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.specularMap) material.specularMap.dispose();
    if (material.envMap) material.envMap.dispose();
    material.dispose();
  }

  isSessionActive() {
    return this.isActive;
  }

  getRenderer() {
    return this.renderer;
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }
}
