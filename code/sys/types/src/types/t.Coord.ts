/**
 *  Edge Coordinate Positioning
 * (spacial placement on 2D rectangular plane)
 */
export type EdgePositionX = 'left' | 'right' | 'center';
export type EdgePositionY = 'top' | 'bottom' | 'center';
export type EdgePositionXY = EdgePositionX | EdgePositionY;
export type EdgePosition = { x: EdgePositionX; y: EdgePositionY };
export type EdgePos = [EdgePositionX, EdgePositionY];
export type EdgePositionInput = EdgePosition | EdgePos;

/**
 * Axis
 */
export type AxisX = 'x';
export type AxisY = 'y';
export type Axis = AxisX | AxisY;

/**
 * 2D Coordinate
 */
export type Point = { x: number; y: number };
export type Offset = { x: number; y: number };
export type PixelOffset = { x: number; y: number };
