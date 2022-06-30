import Solver from './Solver';

import {
  Matrix
} from 'vectorious';

interface Constraint {
  init(solver:Solver):void;
  update():void;
  projection():void;
  getRightHand():Matrix;
  getLinearSys():Matrix;
}

export default Constraint;