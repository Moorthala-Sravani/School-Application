// src/theme/scale.ts
import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Base design size (iPhone 14)
const BASE_W = 390;
const BASE_H = 844;

// Horizontal scale — use for width, paddingHorizontal, marginHorizontal
export const hs = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel(size * (SCREEN_W / BASE_W)));

// Vertical scale — use for height, paddingVertical, marginVertical
export const vs = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel(size * (SCREEN_H / BASE_H)));

// Moderate scale — use for fontSize (less aggressive)
export const ms = (size: number, factor = 0.5): number =>
  Math.round(PixelRatio.roundToNearestPixel(size + (hs(size) - size) * factor));

// Screen dimensions — use for full width/height calculations
export const SCREEN_WIDTH  = SCREEN_W;
export const SCREEN_HEIGHT = SCREEN_H;