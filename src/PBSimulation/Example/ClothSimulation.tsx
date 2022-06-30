// a example of cloth simulation

import Solver from '../Framework/Solver';
import FastMassSpring from '../Framework/FastMassSpring';
import SimCloth from '../Framework/SimCloth';

import {
  Camera,
  PerspectiveCamera,
  Scene,
  Color,
  PlaneGeometry,
  Mesh,
  MeshPhongMaterial,
  Vector3,
  Face3,
  AmbientLight,
  PointLight,
  DoubleSide
} from 'three';

class ClothSimulation {
  public camera: Camera;
  public scene: Scene;
  public simMesh: Mesh;
  public solver: Solver;
  public anchors: [Vector3, Vector3];
  private anchorMoveFlag: boolean;
  constructor() {
    
    window.addEventListener(
      'resize',
      () => {
        if (this.camera instanceof PerspectiveCamera) {
          this.camera.aspect = window.innerWidth / window.innerHeight;        
        }
      },
      false
    );
    this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
    this.scene = new Scene();
    this.scene.background = new Color(0xe0e0e0);
    
    this.initScene();
    this.initCamera();
    this.initSim();
  }
  
  public getInfoForRender(): {camera: Camera, scene: Scene, updateWorld: (t: number) => void} {
    return {
      camera: this.camera,
      scene: this.scene,
      updateWorld: this.updateWorld.bind(this)
    };
  }

  public initScene(): void {
    // generate a plane geometry
    let simGeomtry = new PlaneGeometry(5, 5, 10, 10);
    let simMaterial = new MeshPhongMaterial({
      color: 0x2194CE,
      wireframe: false,
      emissive: 0x0,
      specular: 0x0,
      shininess: 10,
      side: DoubleSide
    });
    this.simMesh = new Mesh(simGeomtry, simMaterial);
    this.scene.add(this.simMesh);
    console.log(this.simMesh);

    // there should be light
    let ambientLight = new AmbientLight( 0x000000 );
    this.scene.add( ambientLight );

    let lights = [];
    lights[ 0 ] = new PointLight( 0xffffff, 1, 0 );
    lights[ 1 ] = new PointLight( 0xffffff, 1, 0 );
    lights[ 2 ] = new PointLight( 0xffffff, 1, 0 );

    lights[ 0 ].position.set( -10, 10, 10 );
    lights[ 1 ].position.set( 15, 10, 15 );
    lights[ 2 ].position.set( - 15, - 10, - 15 );

    this.scene.add( lights[ 0 ] );
    this.scene.add( lights[ 1 ] );
    this.scene.add( lights[ 2 ] );
  }

  public initCamera(): void {
    this.camera.position.set(0, 0, 20);
    this.camera.lookAt(this.simMesh.position);
  }

  public initSim(): void {
    this.solver = new Solver();
    this.solver.addConstraint(new FastMassSpring());
    this.solver.addConstraint(new SimCloth());
    
    let vertexList = (this.simMesh.geometry as PlaneGeometry).vertices.reduce(
      (arr: Array<number>, vertex: Vector3): Array<number> => {
        arr.push(vertex.x, vertex.y, vertex.z);
        return arr;
      },
      []
    );
    let faceList = (this.simMesh.geometry as PlaneGeometry).faces.reduce(
      (arr: Array<number>, face: Face3): Array<number> => {
        arr.push(face.a, face.b, face.c);
        return arr;
      },
      []
    );
    let massList = (this.simMesh.geometry as PlaneGeometry).vertices.map(
      (vertex: Vector3): number => { return 0.01; }
    );

    this.solver.initState(Float64Array.from(vertexList));
    (this.solver.constraints[0] as FastMassSpring).setModel(faceList, vertexList);
    (this.solver.constraints[0] as FastMassSpring).setStrech(15.0);
    (this.solver.constraints[1] as SimCloth).setModel(massList, vertexList);
    (this.solver.constraints[1] as SimCloth).setTimeStep(1 / 30);

    this.solver.maxIter = 5;
    this.solver.precomputeSystem();

    // set anchors
    this.anchors = [
      (this.simMesh.geometry as PlaneGeometry).vertices[0].clone(),
      (this.simMesh.geometry as PlaneGeometry).vertices[10].clone()
    ];
    this.anchorMoveFlag = true;
  }

  public computeForce(t:number): Array<[number, [number, number, number]]> {
    // generate gravity
    let forces = (this.simMesh.geometry as PlaneGeometry).vertices.map(
      (vertex, idx):[number, [number, number, number]] => { return [idx, [0, 0.098, 0]]; }
    );
    // add anchor force
    if (this.anchorMoveFlag) {
      this.anchors[0].z += t;
      this.anchors[1].z -= t;
    } else {
      this.anchors[0].z -= t;
      this.anchors[1].z += t;
    }
    if (this.anchors[0].z > 1.0) {
      this.anchorMoveFlag = false;
    } else if (this.anchors[0].z < -1.0) {
      this.anchorMoveFlag = true;
    }
    let f0 = new Vector3().subVectors((this.simMesh.geometry as PlaneGeometry).vertices[0], this.anchors[0]);
    let f1 = new Vector3().subVectors((this.simMesh.geometry as PlaneGeometry).vertices[10], this.anchors[1]);
    forces[0][1][0] += 10 * f0.x;
    forces[0][1][1] += 10 * f0.y;
    forces[0][1][2] += 10 * f0.z;
    forces[10][1][0] += 10 * f1.x;
    forces[10][1][1] += 10 * f1.y;
    forces[10][1][2] += 10 * f1.z;

    return forces;
  }

  public updateWorld(t: number): void {
    (this.solver.constraints[1] as SimCloth).updateyVector();
    this.solver.solve();
    let curP = this.solver.POpt;
    (this.simMesh.geometry as PlaneGeometry).vertices.forEach(
      (vertex: Vector3, idx: number) => {
        vertex.set(curP[3 * idx + 0], curP[3 * idx + 1], curP[3 * idx + 2]);
      }
    );
    (this.simMesh.geometry as PlaneGeometry).verticesNeedUpdate = true;
    (this.simMesh.geometry as PlaneGeometry).computeFaceNormals();
    (this.simMesh.geometry as PlaneGeometry).computeVertexNormals();
    (this.simMesh.geometry as PlaneGeometry).normalsNeedUpdate = true;
    (this.solver.constraints[1] as SimCloth).setExtForce(this.computeForce(t));
  }
}

export default ClothSimulation;