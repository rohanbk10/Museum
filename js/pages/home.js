/**
 * Home Page - Gamified Museum Entry
 * Lightweight, no 3D, CSS animations only
 */

import { getARCount } from '../data/collection.js';

export default class HomePage {
  constructor(router, params) {
    this.router = router;
    this.params = params;
  }

  render() {
    const arCount = getARCount();
    
    return `
      <div class="home-page">
        <div class="home-hero">
          <!-- Brand Panel (40%) -->
          <div class="brand-panel">
            <div class="museum-logo">
              <svg width="80" height="80" viewBox="0 0 60 60" fill="none">
                <rect x="5" y="15" width="50" height="35" stroke="white" stroke-width="2" fill="none"/>
                <rect x="10" y="20" width="8" height="25" fill="white" opacity="0.8"/>
                <rect x="22" y="20" width="8" height="25" fill="white" opacity="0.8"/>
                <rect x="34" y="20" width="8" height="25" fill="white" opacity="0.8"/>
                <rect x="46" y="20" width="8" height="25" fill="white" opacity="0.8"/>
                <polygon points="30,5 5,15 55,15" fill="white"/>
                <rect x="0" y="50" width="60" height="3" fill="white"/>
              </svg>
            </div>
            
            <h1 class="museum-title">Museum AR</h1>
            <p class="museum-subtitle">Discover History Through Technology</p>

            <nav class="home-nav">
              <button class="home-btn" data-route="/collection" aria-label="Explore art collection">
                <span class="btn-icon">🎨</span>
                <div class="btn-content">
                  <span class="btn-text">Explore Art Collection</span>
                  <span class="btn-subtitle">View ${arCount} AR experience${arCount !== 1 ? 's' : ''}</span>
                </div>
              </button>

              <button class="home-btn" data-route="/map" aria-label="View museum map">
                <span class="btn-icon">🗺️</span>
                <div class="btn-content">
                  <span class="btn-text">View Museum Map</span>
                  <span class="btn-subtitle">Navigate the galleries</span>
                </div>
              </button>
            </nav>

            <div class="home-badge">
              <span class="badge-pulse"></span>
              <span class="badge-text">✨ ${arCount} AR Experience${arCount !== 1 ? 's' : ''} Available</span>
            </div>

            <footer class="home-footer">
              <p>Point your camera at exhibit markers to view artifacts in 3D</p>
            </footer>
          </div>

          <!-- Hero Image Section (60%) -->
          <div class="hero-image"></div>
        </div>
      </div>
    `;
  }

  mount() {
    // Add event listeners for navigation buttons
    const buttons = document.querySelectorAll('[data-route]');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const route = e.currentTarget.getAttribute('data-route');
        if (route) {
          this.router.navigate(route);
        }
      });
    });
  }

  cleanup() {
    // No resources to cleanup (no WebGL, no streams)
    return Promise.resolve();
  }
}
