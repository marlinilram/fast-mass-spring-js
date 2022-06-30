import * as React from 'react';

import {
  WebGLRenderer,
  Scene,
  Camera,
  Clock
} from 'three';

import OrbitControls from './OrbitControls';

window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
let clock = new Clock();
let clockDelta = 0;
let fpsLimit = 1 / 30;

class Viewer extends React.Component {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: Camera;
  control: any;
  updateWorld: (t: number) => void;
  constructor({scene, camera, updateWorld}: {scene: Scene, camera: Camera, updateWorld: (t: number) => void}) {
    super();

    this.renderer = new WebGLRenderer({antialias: true});
    this.scene = scene;
    this.camera = camera;
    this.updateWorld = updateWorld;
    console.log(scene, camera);
  }

  componentDidMount() {
    const divViewer = document.querySelector('#PBSimulationViewer');
    if (divViewer) {
      divViewer.appendChild(this.renderer.domElement);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      window.addEventListener(
        'resize',
        () => { this.renderer.setSize(window.innerWidth, window.innerHeight); },
        false
      );
      this.control = new (OrbitControls as any)(this.camera, this.renderer.domElement);    
      this.control.update();
      this.renderScence(); 
    }
  }

  renderUpdate() {
    clockDelta += clock.getDelta();
    if (clockDelta < fpsLimit) {
      return;
    }

    this.updateWorld(clockDelta);
    this.control.update();
    this.renderer.render(this.scene, this.camera);
    clockDelta = 0;
  }

  renderScence() {
    // stats.begin();
    this.renderUpdate();
    requestAnimationFrame(this.renderScence.bind(this));
    // stats.end();
  }

  render() {
    return (
      <div className="PBSimulationViewer" id="PBSimulationViewer" />
    );
  }
}

export default Viewer;