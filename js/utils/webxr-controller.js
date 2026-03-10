/**
 * WebXR Controller - Manages WebXR AR session with plane detection
 * For Android Chrome with ARCore support only
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class WebXRController {
  constructor(logCallback = null) {
    this.session = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.reticle = null;
    this.hitTestSource = null;
    this.hitTestSourceRequested = false;
    this.referenceSpace = null;
    this.viewerSpace = null; // Store viewer space for hit-test
    this.placedModels = [];
    this.modelTemplate = null;
    this.isActive = false;
    this.log = logCallback || console.log.bind(console);
  }

  async startSession(container, modelPath, callbacks = {}) {
    this.log('[WebXR] Starting session...');
    
    if (this.isActive) {
      this.log('[WebXR] Session already active');
      return;
    }

    // Check WebXR support
    this.log(`[WebXR] Navigator.xr available: ${!!navigator.xr}`);
    if (!navigator.xr) {
      throw new Error('WebXR not supported on this browser');
    }

    this.log('[WebXR] Checking immersive-ar support...');
    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    this.log(`[WebXR] Immersive AR supported: ${supported}`);
    
    if (!supported) {
      throw new Error('Immersive AR not supported on this device');
    }

    try {
      this.log('[WebXR] Initializing Three.js scene...');
      
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
        this.log('[WebXR] Loading 3D model...');
        await this.loadModelTemplate(modelPath);
        this.log('[WebXR] Model loaded successfully');
      }

      // Request XR session with proper feature requirements
      this.log('[WebXR] Requesting XR session...');
      try {
        // Try with 'local' as required feature (needed for hit-test)
        this.session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['local'],
          optionalFeatures: ['hit-test', 'dom-overlay', 'local-floor'],
          domOverlay: { root: document.body }
        });
        this.log('[WebXR] Session granted with local reference space');
      } catch (error) {
        this.log(`[WebXR] Local space not available: ${error.name}`);
        
        // Fallback: Try without requiring local (hit-test won't work)
        this.session = await navigator.xr.requestSession('immersive-ar', {
          optionalFeatures: ['hit-test', 'dom-overlay', 'local', 'local-floor', 'viewer'],
          domOverlay: { root: document.body }
        });
        this.log('[WebXR] Session granted without local requirement (hit-test disabled)');
      }

      this.log(`[WebXR] Session created: ${!!this.session}`);
      
      await this.renderer.xr.setSession(this.session);
      this.log('[WebXR] Renderer XR session set');

      // Get reference space with fallbacks
      this.log('[WebXR] Requesting reference space...');
      try {
        this.referenceSpace = await this.session.requestReferenceSpace('local');
        this.log('[WebXR] ✓ Got "local" reference space');
      } catch (error) {
        this.log(`[WebXR] "local" not supported, trying "local-floor"...`);
        try {
          this.referenceSpace = await this.session.requestReferenceSpace('local-floor');
          this.log('[WebXR] ✓ Got "local-floor" reference space');
        } catch (error2) {
          this.log(`[WebXR] "local-floor" not supported, trying "viewer"...`);
          this.referenceSpace = await this.session.requestReferenceSpace('viewer');
          this.log('[WebXR] ✓ Got "viewer" reference space');
        }
      }

      // Request viewer space for hit-test (separate from reference space)
      this.log('[WebXR] Requesting viewer space for hit-test...');
      try {
        this.viewerSpace = await this.session.requestReferenceSpace('viewer');
        this.log('[WebXR] ✓ Got viewer space for hit-test');
      } catch (error) {
        this.log(`[WebXR] ⚠ Viewer space not available: ${error.message}`);
        this.log('[WebXR] Hit-test will be disabled, but AR will still work');
        this.viewerSpace = null;
      }

      // Setup hit-test source on first frame
      this.session.requestAnimationFrame((time, frame) => {
        this.setupHitTestSource(frame);
      });

      this.isActive = true;
      this.log('[WebXR] ✓ Session started successfully!');

      if (callbacks.onStart) {
        callbacks.onStart();
      }

      // Handle session end
      this.session.addEventListener('end', () => {
        this.log('[WebXR] Session ended');
        this.isActive = false;
        if (callbacks.onEnd) {
          callbacks.onEnd();
        }
      });

    } catch (error) {
      this.log(`[WebXR] ✗ Session request failed: ${error.name} - ${error.message}`);
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

    // Check if viewer space is available
    if (!this.viewerSpace) {
      this.log('[WebXR] ⚠ Viewer space not available, hit-test disabled');
      return;
    }

    try {
      const session = frame.session;

      // Check if hit-test feature was actually granted (it was optional)
      if (!session.enabledFeatures || !session.enabledFeatures.includes('hit-test')) {
        this.log('[WebXR] ⚠ Hit-test feature not granted by device');
        this.log('[WebXR] Available features: ' + (session.enabledFeatures ? Array.from(session.enabledFeatures).join(', ') : 'none'));
        return;
      }

      this.hitTestSource = await session.requestHitTestSource({ space: this.viewerSpace });
      this.log('[WebXR] ✓ Hit-test source created successfully');
    } catch (error) {
      this.log(`[WebXR] ⚠ Failed to create hit-test source: ${error.message}`);
      this.log('[WebXR] AR will work without surface detection');
      this.hitTestSource = null;
    }
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
    this.viewerSpace = null;
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
