"use strict";

/**
 * ui.core.js
 * @createdOn: 07-Apr-2016
 * @author: SmartChartsNXT
 * @version: 2.0.0
 * @description:SmartChartsNXT Core Library components. This contains UI functionality.
 */

/*-----------SmartChartsNXT UI functions------------- */



import Point from './point';
import Geom from './geom.core'; 

/**
 * SmartChartsNXT Core Library components. This singletone class contains UI functionalities.
 */

class UiCore {
  constructor() {}

  /**
   * Create a drop shadow over SVG component. Need to pass the ID of the drop shadow element. 
   * @param {String} shadowId Element ID of dropshadow Component.
   * @returns Virtual node of drop shadow component. 
   */
  dropShadow(shadowId) {
    return (
      <defs>
        <filter xmlns="http://www.w3.org/2000/svg" id={shadowId} height="130%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1"/> 
          <feOffset dx="4" dy="4" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2"/>
          </feComponentTransfer>
          <feMerge> 
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>
    );
  }

  /** Create radial gradient
   * @param {string} gradId - identifire of this gradient
   * @param {number} cx - center x 
   * @param {number} cy - center y
   * @param {number} fx - offset x
   * @param {number} fy - offset y
   * @param {number} r -  radius
   * @param {Array} gradArr - Array of number or object. 
   * Example --
   * gradArr = [0.1, -0.06, 0.9] or 
   * gradArr = [{offset:0, opacity:0.06},{offset:83, opacity:0.2},{offset:95, opacity:0}]
   * (-) negative indicates darker shades
   * 
  */
  radialShadow(gradId, cx, cy, fx, fy, r, gradArr) {
    return (
      <defs>
        <radialGradient id={gradId} cx={cx} cy={cy} fx={fx} fy={fy} r={r} gradientUnits="userSpaceOnUse">
          {gradArr.map((grad, i) =>{
            let offset = i/gradArr.length*100;
            let opacity = grad; 
            let color = '#fff'; 
            if(typeof grad === 'object'){
              offset = grad.offset !== 'undefined' ? grad.offset : offset; 
              opacity = grad.opacity  !== 'undefined' ? grad.opacity : opacity; 
              if(opacity < 0) {
                color = '#000'; 
                opacity = Math.abs(opacity); 
              }
            }
            return <stop offset={`${offset}%`} stop-color={color} stop-opacity={opacity}></stop>;
          })}
        </radialGradient>
      </defs>
    );
  }

  /**
   * Calculate font size according to scale and max size.
   * @param {Number} totalWidth Max width of component.
   * @param {Number} scale Scale factor when width change.
   * @param {Number} maxSize Max font size bound.
   */
  getScaledFontSize(totalWidth, scale, maxSize) {
    let fSize = totalWidth / scale;
    return fSize < maxSize ? fSize : maxSize;
  }

  /** Returns true if it is a touch device 
   * @return {boolean}
  */
  isTouchDevice() {
    return "ontouchstart" in document.documentElement;
  }

  /**
   * Convert Window screen coordinate into SVG point coordinate in global SVG space
   * @param {String} targetElem SVG element in which point coordinate will be calculated
   * @param {*} evt Ponter event related to screen like mouse or touch point
   */
  cursorPoint(targetElem, evt) {
    if (typeof targetElem === "string") {
      targetElem = document.querySelector("#" + targetElem + " svg");
    }
    let pt = targetElem.createSVGPoint();
    pt.x = evt.clientX || evt.touches[0].clientX;
    pt.y = evt.clientY || evt.touches[0].clientY;
    return pt.matrixTransform(targetElem.getScreenCTM().inverse());
  } 


  /**
   * Calculate interval value and also interval count for a given range. 
   * @param {Number} minVal Minimum Value.
   * @param {Number} maxVal Maximum Value
   * @return {Object} Returns interval object.
   */
  
  calcIntervalbyMinMax(minVal, maxVal) {
    let arrWeight = [0.1, 0.2, 0.5];
    let weightDecimalLevel = 1; 
    let minIntvCount = 6;
    let maxIntvCount = 12;
    let mid = (maxVal + minVal) / 2;
    let tMinVal = minVal > 0 ? 0 : minVal;
    maxVal = maxVal < 0 ? 0 : maxVal;
    let digitBase10 = Math.round(mid).toString().length;

    for(let w = 0; w <= 100 ; w = (w+1)%arrWeight.length) {
      let weight = arrWeight[w] * weightDecimalLevel;
      let tInt = Math.pow(10, digitBase10 - 1) * weight;
      if(w === arrWeight.length -1) {
        weightDecimalLevel *= 10; 
      }
      for (let intv = minIntvCount; intv <= maxIntvCount; intv++) {
        let hitIntv = +parseFloat(tInt * intv).toFixed(2);
        tMinVal = minVal <= 0 && tMinVal >= minVal ? (Math.floor(tMinVal / tInt) * tInt) : tMinVal;
        if ((tMinVal + hitIntv) >= (maxVal + tInt)) {
          let iMax = tMinVal + hitIntv;
          if (minVal <= 0) {
            tMinVal -= tInt;
            intv++;
          }
          return {
            iVal: tInt,
            iCount: intv,
            iMax: iMax,
            iMin: tMinVal
          };
        }
      }
    }
  }

}

export default new UiCore();