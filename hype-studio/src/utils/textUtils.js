// src/utils/textUtils.js

import opentype from 'opentype.js';
import { parse } from 'svg-pathdata';
import { Path2 } from '@babylonjs/core';

/**
 * Load a font file using opentype.js.
 * @param {string} fontUrl - The URL to the font file.
 * @returns {Promise<Font>} - A promise that resolves with the loaded font.
 */
export const loadFont = (fontUrl) => {
  return new Promise((resolve, reject) => {
    opentype.load(fontUrl, (err, font) => {
      if (err) {
        reject('Font could not be loaded: ' + err);
      } else {
        resolve(font);
      }
    });
  });
};

/**
 * Convert text to SVG path data using the loaded font.
 * @param {Font} font - The loaded font.
 * @param {string} text - The text to convert.
 * @param {number} fontSize - The font size.
 * @returns {string} - The SVG path data.
 */
export const textToSvgPathData = (font, text, fontSize) => {
  const path = font.getPath(text, 0, 0, fontSize);
  return path.toPathData(2);
};

/**
 * Convert SVG path data to Babylon.js Path2 objects.
 * @param {string} svgPathData - The SVG path data.
 * @returns {Path2[]} - An array of Babylon.js Path2 objects.
 */
export const svgPathDataToBabylonPaths = (svgPathData) => {
  const commands = parse(svgPathData);
  const babylonPaths = [];
  let currentPath = new Path2();
  
  commands.forEach(cmd => {
    if (cmd.type === 'M') {
      if (currentPath.getPoints().length > 0) {
        babylonPaths.push(currentPath);
        currentPath = new Path2();
      }
      currentPath.moveTo(cmd.x, cmd.y);
    } else if (cmd.type === 'L') {
      currentPath.lineTo(cmd.x, cmd.y);
    }
    // Handle other command types (C, Q, etc.) if needed
  });

  if (currentPath.getPoints().length > 0) {
    babylonPaths.push(currentPath);
  }

  return babylonPaths;
};