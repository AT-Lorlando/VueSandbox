import {
    Matrix4
} from 'three';

var rotWorldMatrix, rotObjectMatrix;

export function rotateAroundObjectAxis(object, axis, radians) {
    rotObjectMatrix = new Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
    object.matrix.multiply(rotObjectMatrix);
    object.rotation.setFromRotationMatrix(object.matrix);
}

// Rotate an object around an arbitrary axis in world space       
export function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix);
    object.matrix = rotWorldMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
}