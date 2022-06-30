import Constraint from './Constraint';
import Solver from './Solver';

import {
  Vector,
  Matrix
} from 'vectorious';

type Edge = [number, number];
let edgeCompare = function(a: Edge, b: Edge): number {
  if (a[0] < b[0]) {
    return -1;
  } else if (a[0] > b[0]) {
    return 1;
  } else if (a[1] < b[1]) {
    return -1;
  } else if (a[1] > b[1]) {
    return 1;
  } else { return 0; }
};

class FastMassSpring implements Constraint {
  private strechEdges: Array<Edge>;
  private strechRLength: Array<number>;

  private LStrechMatrix: Matrix;
  private JStrechMatrix: Matrix;
  private dVector: Float64Array;
  private rightHand: Matrix;

  private solver: Solver;

  private kStrech: number;
  private PNum: number;

  constructor() { /* */ }

  public init(solver: Solver): void {
    this.solver = solver;
    this.kStrech = 1.0;
    this.PNum = 0;
  }

  public setModel(faceList: Array<number>, vertexList: Array<number>): void {
    this.initEdgeGraph(faceList, vertexList);
    this.buildMatrix();
  }

  public setStrech(strech: number): void {
    this.kStrech = strech;
  }

  public update(): void {
    this.rightHand = Matrix.multiply(
      this.JStrechMatrix,
      Matrix.fromTypedArray(this.dVector, [3 * this.strechEdges.length, 1])
    );
  }

  public projection(): void {
    this.computedVector();
  }

  public getRightHand(): Matrix {
    return Matrix.scale(this.rightHand, this.kStrech);
  }

  public getLinearSys(): Matrix {
    return Matrix.scale(this.LStrechMatrix, this.kStrech);
  }

  private initEdgeGraph(faceList: Array<number>, vertexList: Array<number>): void {
    this.PNum = vertexList.length / 3;

    // building edge graph
    this.strechEdges = [];
    let ptid = [0, 0, 0];
    let nFace = faceList.length / 3;
    for (let i = 0; i < nFace; ++i) {
      ptid[0] = faceList[3 * i + 0];
      ptid[1] = faceList[3 * i + 1];
      ptid[2] = faceList[3 * i + 2];
      // the order of start point and end point doesn't matter
      this.strechEdges.push(ptid[0] < ptid[1] ? [ptid[0], ptid[1]] : [ptid[1], ptid[0]]);
      this.strechEdges.push(ptid[1] < ptid[2] ? [ptid[1], ptid[2]] : [ptid[2], ptid[1]]);
      this.strechEdges.push(ptid[2] < ptid[0] ? [ptid[2], ptid[0]] : [ptid[0], ptid[2]]);
    }

    this.strechEdges = this.strechEdges.sort(edgeCompare).filter((edge, pos, ary) => {
      return !pos || edgeCompare(edge, ary[pos - 1]) !== 0;
    });

    // store rest length
    let curR = 0.0;
    this.strechRLength = [];
    this.strechEdges.forEach(edge => {
      curR = 0.0;
      for (let j = 0; j < 3; ++j) {
        curR += Math.pow(vertexList[3 * edge[0] + j] - vertexList[3 * edge[1] + j], 2);
      }
      this.strechRLength.push(Math.sqrt(curR));
    });

    // init d vector
    this.dVector = new Float64Array(3 * this.strechEdges.length);
    this.computedVector();
  }

  private computedVector(): void {
    let p12 = new Vector([0, 0, 0]);
    this.strechEdges.forEach((edge, idx) => {
      for (let j = 0; j < 3; ++j) {
        p12.set(j, this.solver.POpt[3 * edge[0] + j] - this.solver.POpt[3 * edge[1] + j]);
      }
      p12 = p12.normalize().scale(this.strechRLength[idx]);
      this.dVector[3 * idx + 0] = p12.get(0);
      this.dVector[3 * idx + 1] = p12.get(1);
      this.dVector[3 * idx + 2] = p12.get(2);
    });
  }

  private buildMatrix(): void {
    // fill L Matrix
    let tmp = 0;
    this.LStrechMatrix = Matrix.zeros(3 * this.PNum, 3 * this.PNum);
    this.strechEdges.forEach(edge => {
      for (let j = 0; j < 3; ++j) {
        tmp = this.LStrechMatrix.get(3 * edge[0] + j, 3 * edge[0] + j);
        this.LStrechMatrix.set(3 * edge[0] + j, 3 * edge[0] + j, tmp + 1);
        tmp = this.LStrechMatrix.get(3 * edge[0] + j, 3 * edge[1] + j);
        this.LStrechMatrix.set(3 * edge[0] + j, 3 * edge[1] + j, tmp - 1);
        tmp = this.LStrechMatrix.get(3 * edge[1] + j, 3 * edge[0] + j);
        this.LStrechMatrix.set(3 * edge[1] + j, 3 * edge[0] + j, tmp - 1);
        tmp = this.LStrechMatrix.get(3 * edge[1] + j, 3 * edge[1] + j);
        this.LStrechMatrix.set(3 * edge[1] + j, 3 * edge[1] + j, tmp + 1);
      }
    });

    // fill J Matrix
    this.JStrechMatrix = Matrix.zeros(3 * this.PNum, 3 * this.strechEdges.length);
    this.strechEdges.forEach((edge, idx) => {
      for (let j = 0; j < 3; ++j) {
        tmp = this.JStrechMatrix.get(3 * edge[0] + j, 3 * idx + j);
        this.JStrechMatrix.set(3 * edge[0] + j, 3 * idx + j, tmp + 1);
        tmp = this.JStrechMatrix.get(3 * edge[1] + j, 3 * idx + j);
        this.JStrechMatrix.set(3 * edge[1] + j, 3 * idx + j, tmp - 1);
      }
    });
  }
}

export default FastMassSpring;