import Constraint from './Constraint';

import {
  Matrix
} from 'vectorious';

class Solver {
  public POpt: Float64Array;
  public maxIter: number;
  public constraints: Array<Constraint>;
  private plu: any[];
  private systemMatrix: Matrix;
  private rightHand: Matrix;
  private problemSize: number;
  constructor() {
    this.maxIter = 1;

    this.problemSize = 0;
    this.constraints = [];
  }

  public addConstraint(constraint: Constraint): void {
    constraint.init(this);
    this.constraints.push(constraint);
  }

  public solve(): void {
    for (let i = 0; i < this.maxIter; ++i) {
      this.runLocalStep();
      this.runGlobalStep();
    }
  }

  public initState(initP: Float64Array): void {
    this.POpt = initP.slice();
    this.problemSize = this.POpt.length;
    this.rightHand = Matrix.zeros(this.problemSize, 1);
    this.systemMatrix = Matrix.zeros(this.problemSize, this.problemSize);
  }

  public precomputeSystem(): void {
    if (this.constraints.length === 0) {
      console.log('no constraints now.');
      return;
    }
    
    this.setSystemMatrix();
  
    // pre factorize the system matrix
    console.log('pre factorize matrix.');
    this.plu = this.systemMatrix.plu();
  }

  private runGlobalStep(): void {
    let tmp: number[] = [];
    tmp = tmp.concat(...((this.plu[0] as Matrix).lusolve(this.rightHand, this.plu[1]).toArray()));
    this.POpt.set(tmp);
  }
  
  private runLocalStep(): void {
    this.constraints.forEach(constraint => {
      constraint.projection();
      constraint.update();
    });
  
    this.setRightHand();
  }
  
  private setRightHand(): void {
    this.rightHand = Matrix.zeros(this.problemSize, 1); // need more efficient way
    this.constraints.forEach(constraint => {
      this.rightHand.add(constraint.getRightHand());
    });
  }

  private setSystemMatrix(): void {
    this.systemMatrix = Matrix.zeros(this.problemSize, this.problemSize); // need more efficient way
    this.constraints.forEach(constraint => {
      this.systemMatrix.add(constraint.getLinearSys());
    });
  }
}

export default Solver;