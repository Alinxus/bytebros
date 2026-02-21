declare module "ml-svm" {
  export type SvmKernelTypes = "linear" | "rbf" | "poly" | "sigmoid";
  export class SvcClassifier {
    constructor(options?: { kernel?: SvmKernelTypes; C?: number; gamma?: number });
    train(X: number[][], y: number[]): void;
    predict(X: number[][]): number[];
  }
}

declare module "ml-logistic-regression" {
  export class LogisticRegression {
    constructor(options?: { numIterations?: number; learningRate?: number; lambda?: number });
    train(X: any[], y: number[]): void;
    predict(X: any[]): number[][];
  }
}

declare module "ml-random-forest" {
  export class RandomForestClassifier {
    constructor(options?: { nEstimators?: number; maxFeatures?: number; treeOptions?: any; seed?: number });
    train(X: number[][], y: number[]): void;
    predict(X: number[][]): number[];
  }
}
