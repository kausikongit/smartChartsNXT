/*
 * BaseChart.js
 * @CreatedOn: 10-May-2017
 * @Author: SmartChartsNXT
 * @Version: 1.1.0
 * @Description:This class will be the parent class of all charts
 */

"use strict";

//let EventCore = require("./../core/event.core");
//let Event = require("./../core/event");

import Geom from './../core/geom.core'; 
import Point from "./../core/point";
import UtilCore from './../core/util.core';
import { Component } from "./../viewEngin/pview";

//import Timer from "./../viewEngin/timer"; 
//import Mytitle from "./../viewEngin/mytitle"; 
/** ------- Requireing all chart types ------- */
const CHART_MODULES = {
    //AreaChart: require("./../charts/areaChart/areaChart")
    // LineChart: require("./../charts/lineChart/lineChart"),
    // StepChart: require("./../charts/stepChart/stepChart"),
    PieChart: {
      config: require("./../charts/pieChart/config").default,
      chart: require("./../charts/pieChart/pieChart").default
    }
    // DonutChart: require("./../charts/donutChart/donutChart"),
    // ColumnChart: require("./../charts/columnChart/columnChart")
};

/* ------------- Require pulgIns --------------*/
let animator = require("./../plugIns/animator");

class BaseChart extends Component {
  constructor(props) {
    try {
      super(props); 
      let opts = this.props.opts; 
      // this.event = new EventCore();
      this.plugins = {
        animator: animator
      };
      this.chartType = this.props.opts.type;
      this.CHART_OPTIONS = UtilCore.extends(opts, { width: 1, height: 1});
      this.CHART_DATA = {scaleX: 0, scaleY: 0};
      this.CHART_CONST = {
        FIX_WIDTH: 800,
        FIX_HEIGHT: 600
      };
      this.runId = this.props.runid; 
      this.timeOut = null;
      this.loadConfig(CHART_MODULES[this.chartType].config.call(this)); 
      this.initCanvasSize(this.props.width || this.CHART_CONST.FIX_WIDTH, this.props.height || this.CHART_CONST.FIX_HEIGHT); 
      this.initBase(); 
    } catch (ex) {
      ex.errorIn = `Error in ${props.opts.type} base constructor : ${ex.message}`;
      throw ex;
    }
  }

  loadConfig(config) {
    for (let key in config) {
      try {
        this.CHART_DATA[key] = eval(config[key]);
      } catch (ex) { throw ex; }
    }
  }

  initBase() {

    // if (this.CHART_OPTIONS.events && typeof this.CHART_OPTIONS.events === "object") {
    //   for (let e in this.CHART_OPTIONS.events) {
    //     this.event.off(e, this.CHART_OPTIONS.events[e]);
    //     this.event.on(e, this.CHART_OPTIONS.events[e]);
    //   }
    // }

    //fire Event onInit
    // let onInitEvent = new Event("onInit", {
    //   srcElement: this
    // });
    // this.event.dispatchEvent(onInitEvent);

    
    // setTimeout(function () {
    //   self.ui.appendMenu2(self.CHART_OPTIONS.targetElem, self.CHART_DATA.svgCenter, null, null, self);
    //   self.ui.appendWaterMark(self.CHART_OPTIONS.targetElem, self.CHART_DATA.scaleX, self.CHART_DATA.scaleY);
    // }, 100);

  } /* End of Init() */
  
  // componentDidMount() {
  //   this.initCanvasSize(this.props.width || this.CHART_CONST.FIX_WIDTH, this.props.height || this.CHART_CONST.FIX_HEIGHT); 
  //   this.ref.node.setAttribute('width', this.CHART_OPTIONS.width);
  //   this.ref.node.setAttribute('height', this.CHART_OPTIONS.height);
  // }

  render() {
    let Chart = CHART_MODULES[this.chartType].chart;
    return (
      <svg xmlns='http://www.w3.org/2000/svg'
        version={1.1}
        width={this.CHART_OPTIONS.width}
        height={this.CHART_OPTIONS.height}
        id={`${this.chartType}_${this.runId}`}
        style={{
          background: this.CHART_OPTIONS.bgColor || 'none',
          MozTapHighlightColor: 'rgba(0, 0, 0, 0)',
          WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
          WebkitUserSelect: 'none',
          HtmlUserSelect: 'none',
          MozUserSelect: 'none',
          MsUserSelect: 'none',
          OUserSelect: 'none',
          UserSelect: 'none'
        }} >
        { this.CHART_OPTIONS.canvasBorder ? 
        <g>
          <rect x='0' y='0' vector-effect='non-scaling-stroke'
            width={this.CHART_OPTIONS.width - 1}
            height={this.CHART_OPTIONS.height - 1}
            shape-rendering='optimizeSpeed'
            fill-opacity='0.001'
            style={{ fill: '#fff', strokWidth: 1, stroke: '#717171' }}
          />
        </g> : null}
        <Chart runId={this.runId}
          chartOptions={this.CHART_OPTIONS} 
          chartData={this.CHART_DATA} 
          chartConst={this.CHART_CONST} 
        /> 
      </svg>
    );
  }


  // render() {
  //   //fire event afterRender
  //   let aftrRenderEvent = new Event("afterRender", {
  //     srcElement: this
  //   });
  //   this.event.dispatchEvent(aftrRenderEvent);
  // }

  getRunId() {
    return this.runId;
  }

  initCanvasSize(width, height, minWidth = this.CHART_DATA.minWidth, minHeight = this.CHART_DATA.minHeight) {
    this.CHART_DATA.svgWidth = this.CHART_OPTIONS.width = UtilCore.clamp(minWidth, Math.max(minWidth, width), width);
    this.CHART_DATA.svgHeight = this.CHART_OPTIONS.height = UtilCore.clamp(minHeight, Math.max(minHeight, height), height);
    this.CHART_DATA.svgCenter = new Point((this.CHART_DATA.svgWidth / 2), (this.CHART_DATA.svgHeight / 2));
  }
  
}

export default BaseChart;