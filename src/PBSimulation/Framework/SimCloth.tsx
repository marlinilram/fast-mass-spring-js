import Constraint from './Constraint';
import Solver from './Solver';

import {
  Matrix
} from 'vectorious';

class SimCloth implements Constraint {
  private massMatrix: Matrix;
  private rightHand: Matrix;
  private extForce: Float64Array;
  private qN1: Float64Array; // q_(n-1)
  private y: Float64Array;
  private hSqrt: number;

  private solver: Solver;
  private PNum: number;

  constructor() { /* */ }

  public init(solver: Solver): void {
    this.solver = solver;
    this.PNum = 0;
    this.hSqrt = 1.0;
  }

  public setModel(vMass: Array<number>, initP: Array<number>): void {
    this.PNum = vMass.length;
    this.massMatrix = Matrix.zeros(3 * this.PNum, 3 * this.PNum);
    vMass.forEach((mass, idx) => {
      this.massMatrix.set(3 * idx + 0, 3 * idx + 0, mass);
      this.massMatrix.set(3 * idx + 1, 3 * idx + 1, mass);
      this.massMatrix.set(3 * idx + 2, 3 * idx + 2, mass);
    });

    this.extForce = new Float64Array(3 * this.PNum).fill(0);
    this.qN1 = Float64Array.from(initP);
    this.y = Float64Array.from(initP);
  }

  public setTimeStep(step: number): void {
    this.hSqrt = step * step;
  }

  public setExtForce(forces: Array<[number, [number, number, number]]>): void {
    this.extForce = new Float64Array(3 * this.PNum).fill(0);
    forces.forEach(force => {
      this.extForce[3 * force[0] + 0] = force[1][0];
      this.extForce[3 * force[0] + 1] = force[1][1];
      this.extForce[3 * force[0] + 2] = force[1][2];      
    });
  }

  public update(): void {
    this.rightHand = Matrix.multiply(
      this.massMatrix,
      Matrix.fromTypedArray(this.y, [3 * this.PNum, 1])
    ).scale(1.0 / this.hSqrt)
    .subtract(Matrix.fromTypedArray(this.extForce, [3 * this.PNum, 1]));
  }

  public projection(): void {
    // do nothing
  }

  public getRightHand(): Matrix {
    return this.rightHand;
  }

  public getLinearSys(): Matrix {
    return Matrix.scale(this.massMatrix, 1.0 / this.hSqrt);
  }

  public updateyVector(): void {
    this.qN1.forEach((qLast, idx) => { this.y[idx] = 2 * this.solver.POpt[idx] - qLast; });
    this.qN1.set(this.solver.POpt);
  }
}

export default SimCloth;