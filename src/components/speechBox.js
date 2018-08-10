"use strict";

/** 
 * speechBox.js
 * @createdOn:23-Jan-2018
 * @version:2.0.0
 * @author:SmartChartsNXT
 * @description:This components will create speech box with SVG by providing top-left point and c-point.
 */

import Point from "./../core/point";
import { Component } from "./../viewEngin/pview";
import UiCore from "./../core/ui.core"; 

/** 
 * This components will create speech box with SVG by providing top-left point and c-point. 
 * @extends Component
 */
class SpeechBox extends Component {
  constructor(props) {
    super(props);
    this.aHalfWidth = 8; 
    this.state = {
      aTop:false,
      aBottom:false,
      aLeft:false,
      aRight:false
    };
  }
  set cpoint(point) {
    this._cpoint = point; 
    this.calcAnchorDirection(); 
  } 

  get cpoint() {
    return this._cpoint; 
  }

  render() {
    this.cpoint = this.props.cpoint; 
    let cp = new Point(this.props.cpoint.x - this.props.x, this.props.cpoint.y - this.props.y);
    return (
      <g class='speech-box' transform={`translate(${this.props.x},${this.props.y})`}>
        {this.props.shadow && UiCore.dropShadow('sc-speech-box-drop-shadow')}
        <path class='speech-box-path' d={this.getBoxPath()} fill={this.props.bgColor} filter={this.props.shadow ? 'url(#sc-speech-box-drop-shadow)' : ''} stroke={this.props.strokeColor} stroke-width={this.props.strokeWidth || 1} shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"/>
      </g> 
    );
  }

  getBoxPath() {
    let d = ['M', 0, 0]; 
    let topPath, bottomPath, leftPath, rightPath, cpoint = new Point(this.cpoint.x - this.props.x, this.cpoint.y - this.props.y); 
    
    if(this.state.aTop) {
      topPath = ['L', cpoint.x - this.aHalfWidth, 0, cpoint.x, cpoint.y, cpoint.x + this.aHalfWidth, 0, this.props.width, 0];
    } else {
      topPath = ['L', this.props.width, 0]; 
    }
    if(this.state.aRight) {
      rightPath = ['L', this.props.width, cpoint.y - this.aHalfWidth, cpoint.x, cpoint.y, this.props.width, cpoint.y + this.aHalfWidth, this.props.width, this.props.height];
    } else {
      rightPath = ['L', this.props.width, this.props.height];
    }
    if(this.state.aBottom) {
      bottomPath = ['L', cpoint.x + this.aHalfWidth, this.props.height, cpoint.x, cpoint.y, cpoint.x - this.aHalfWidth, this.props.height, 0, this.props.height];
    } else {
      bottomPath = ['L', 0, this.props.height]; 
    }
    if(this.state.aLeft) {
      leftPath = ['L', 0, cpoint.y + this.aHalfWidth, cpoint.x, cpoint.y, 0, cpoint.y - this.aHalfWidth, 0, 0];
    } else {
      leftPath = ['L', 0, 0];
    }

    if(this.state.aTop && this.state.aRight){
      topPath = ['L', this.props.width - (2*this.aHalfWidth) , 0, cpoint.x, cpoint.y];
      rightPath = ['L', this.props.width, (2*this.aHalfWidth), this.props.width, this.props.height];
    }

    if(this.state.aTop && this.state.aLeft){
      topPath = ['L', cpoint.x, cpoint.y, (2*this.aHalfWidth) , 0 , this.props.width, 0];
      leftPath = ['L', 0, (2*this.aHalfWidth), cpoint.x, cpoint.y];
    }

    if(this.state.aBottom && this.state.aRight){
      bottomPath = ['L', cpoint.x, cpoint.y, this.props.width - (2*this.aHalfWidth) , this.props.height, 0, this.props.height ];
      rightPath = ['L', this.props.width, this.props.height - (2*this.aHalfWidth), cpoint.x, cpoint.y];
    }

    if(this.state.aBottom && this.state.aLeft){
      bottomPath = ['L', (2*this.aHalfWidth) , this.props.height , cpoint.x, cpoint.y];
      leftPath = ['L', cpoint.x, cpoint.y, 0, this.props.height - (2*this.aHalfWidth), 0,0];
    }

    d.push(...topPath, ...rightPath, ...bottomPath, ...leftPath, 'Z'); 
    return d.join(' '); 
  }

  calcAnchorDirection() {
    this.state.aTop = this.props.y > (this.cpoint.y - this.aHalfWidth) ? true : false; 
    this.state.aBottom = this.cpoint.y >(this.props.y + this.props.height - this.aHalfWidth) ? true : false; 
    this.state.aRight = this.cpoint.x > (this.props.x + this.props.width - this.aHalfWidth) ? true : false; 
    this.state.aLeft = this.props.x > (this.cpoint.x - this.aHalfWidth) ? true : false; 
  }
}

export default SpeechBox;