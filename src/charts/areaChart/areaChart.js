"use strict";

/**
 * SVG Area Chart :: areaChart.js
 * @version:2.0.0
 * @createdOn:31-05-2016
 * @author:SmartChartsNXT
 * @description: SVG Area Chart, that support multiple series and zoom window.
 */

import Point from "./../../core/point";
import { Component } from "./../../viewEngin/pview";
import defaultConfig from "./../../settings/config";
import UtilCore from './../../core/util.core';
import UiCore from './../../core/ui.core';
import eventEmitter from './../../core/eventEmitter';
import Draggable from './../../components/draggable'; 
import LegendBox from './../../components/legendBox';
import Grid from './../../components/grid';
import AreaFill from './areaFill'; 
import VerticalLabels from './../../components/verticalLabels';
import HorizonalLabels from './../../components/horizontalLabels';
import HorizontarScroller from './../../components/horizontalScroller';
import Tooltip from './../../components/tooltip';
import InteractivePlane from './interactivePlane'; 

/** 
 * SVG Area Chart, that support multiple series and zoom window.
 * @extends Component
 */

class AreaChart extends Component {
  constructor(props) {
    super(props);
    try {
      let self = this;
      this.CHART_DATA = UtilCore.extends({
        chartCenter: 0,
        marginLeft: 0,
        marginRight: 0,
        marginTop: 0,
        marginBottom: 0,
        gridBoxWidth: 0,
        gridBoxHeight: 0,
        offsetHeight: 70, // distance of text label from top and bottom side
        hScrollBoxMarginTop: 85, 
        hScrollBoxHeight: this.props.hideHorizontalScroller ? 0 : 40,
        vLabelWidth: 70,
        paddingX: 10,
        longestSeries: 0,
        zoomOutBoxWidth: 40,
        zoomOutBoxHeight: 40
      }, this.props.chartData);

      this.CHART_OPTIONS = UtilCore.extends({
        dataSet: {
          xAxis: {label: 'x-axis'},
          yAxis: {label: 'y-axis'}
        }
      }, this.props.chartOptions);
      this.CHART_CONST = UtilCore.extends({}, this.props.chartConst);
      
      this.subComp = {
        tooltip: undefined
      };

      this.state = {
        set windowLeftIndex(index) {
          let longSeriesLen = self.CHART_OPTIONS.dataSet.series[self.CHART_DATA.longestSeries].data.length;
          this._windowLeftIndex = index;
          this.leftOffset = index * 100 / (longSeriesLen - 1); 
        },
        get windowLeftIndex() {
          return this._windowLeftIndex;
        },
        set windowRightIndex(index) {
          let longSeriesLen = self.CHART_OPTIONS.dataSet.series[self.CHART_DATA.longestSeries].data.length;
          this._windowRightIndex = index;
          this.rightOffset = index * 100 / (longSeriesLen - 1); 
        },
        get windowRightIndex() {
          return this._windowRightIndex; 
        },
        hGridCount: 6,
        gridHeight: 0,
        cs: {
          maxima: 0, 
          minima: 0, 
          valueInterval:0,
          objInterval: {},
          dataSet: []
        },
        fs: {
          maxima: 0, 
          minima: 0, 
          valueInterval:0,
          objInterval: {},
          dataSet: []
        }
      }; 

      this.pointData = [], 
      this.originPoint;
      this.prevOriginPoint;
      this.eventStream = {}; 
      this.emitter = eventEmitter.getInstance(this.context.runId); 
      this.onHScrollBind = this.onHScroll.bind(this); 
      this.onPointHighlightedBind = this.onPointHighlighted.bind(this);
      this.onMouseLeaveBind = this.onMouseLeave.bind(this);

      this.init();
      
    } catch (ex) {
      ex.errorIn = `Error in AreaChart with runId:${this.context.runId}`;
      throw ex;
    }
  }

  init() {
    this.minWidth = this.CHART_DATA.minWidth; 
    this.minHeight = this.CHART_DATA.minHeight;
    this.CHART_DATA.chartCenter = new Point(this.CHART_DATA.svgCenter.x, this.CHART_DATA.svgCenter.y + 50);
    this.CHART_DATA.marginLeft = ((-1) * this.CHART_DATA.scaleX / 2) + 100;
    this.CHART_DATA.marginRight = ((-1) * this.CHART_DATA.scaleX / 2) + 20;
    this.CHART_DATA.marginTop = ((-1) * this.CHART_DATA.scaleY / 2) + 120;
    this.CHART_DATA.marginBottom = ((-1) * this.CHART_DATA.scaleY / 2) + this.CHART_DATA.hScrollBoxHeight + 90;
    this.CHART_DATA.gridBoxWidth = (this.CHART_DATA.svgCenter.x * 2) - this.CHART_DATA.marginLeft - this.CHART_DATA.marginRight;
    this.CHART_DATA.gridBoxHeight = (this.CHART_DATA.svgCenter.y * 2) - this.CHART_DATA.marginTop - this.CHART_DATA.marginBottom;

    let longestSeries = 0;
    let longSeriesLen = 0;
    for (let index = 0; index < this.CHART_OPTIONS.dataSet.series.length; index++) {
      if (this.CHART_OPTIONS.dataSet.series[index].data.length > longSeriesLen) {
        longestSeries = index;
        longSeriesLen = this.CHART_OPTIONS.dataSet.series[index].data.length;
      }
    }
    this.CHART_DATA.longestSeries = longestSeries;
    
    /* Will set initial zoom window */
    if (this.CHART_OPTIONS.zoomWindow) {
      if (this.CHART_OPTIONS.zoomWindow.leftIndex && this.CHART_OPTIONS.zoomWindow.leftIndex >= 0 && this.CHART_OPTIONS.zoomWindow.leftIndex < longSeriesLen) {
        this.state.windowLeftIndex = typeof this.state.windowLeftIndex === 'undefined' ? this.CHART_OPTIONS.zoomWindow.leftIndex - 1 : this.state.windowLeftIndex;
      }
      if (this.CHART_OPTIONS.zoomWindow.rightIndex && this.CHART_OPTIONS.zoomWindow.rightIndex >= this.CHART_OPTIONS.zoomWindow.leftIndex && this.CHART_OPTIONS.zoomWindow.rightIndex <= longSeriesLen) {
        this.state.windowRightIndex = typeof this.state.windowRightIndex === 'undefined' ? this.CHART_OPTIONS.zoomWindow.rightIndex - 1 : this.state.windowRightIndex;
      } else {
        this.state.windowRightIndex = longSeriesLen - 1;
      }
    } 
    if(this.state.windowRightIndex === -1) {
      this.state.windowRightIndex = longSeriesLen - 1;
    }
    
    /* Prepare data set for Horizontal scroll */
    this.prepareDataSet(true); 
    /* Prepare data set for chart area. */
    this.prepareDataSet(); 
  } 

  prepareDataSet(isFS=false) {
    let maxSet = [];
    let minSet = [];
    let categories = [];
    let dataFor = isFS ? 'fs' : 'cs';  
    let dataSet = JSON.parse(JSON.stringify(this.CHART_OPTIONS.dataSet));
    if(!isFS) {
      for(let i = 0;i < this.CHART_OPTIONS.dataSet.series.length;i++) {
        dataSet.series[i].data = this.CHART_OPTIONS.dataSet.series[i].data.slice(this.state.windowLeftIndex, this.state.windowRightIndex + 1);
      }
    }
    for (let i = 0; i < dataSet.series.length; i++) {
      let arrData = [];
      for (let j = 0; j < dataSet.series[i].data.length; j++) {
        arrData.push(dataSet.series[i].data[j].value);
        if (j > categories.length - 1) {
          categories.push(dataSet.series[i].data[j].label);
        }
      }
      let maxVal = Math.max.apply(null, arrData);
      let minVal = Math.min.apply(null, arrData);
      maxSet.push(maxVal);
      minSet.push(minVal);
      dataSet.series[i].color = dataSet.series[i].color || UtilCore.getColor(i);
    }
    this.state[dataFor].dataSet = dataSet; 
    this.state[dataFor].dataSet.xAxis.categories = categories; 
    this.state[dataFor].maxima = Math.max.apply(null, maxSet);
    this.state[dataFor].minima = Math.min.apply(null, minSet);
    this.state[dataFor].objInterval = UiCore.calcIntervalbyMinMax(this.state[dataFor].minima, this.state[dataFor].maxima);
    ({iVal: this.state[dataFor].valueInterval, iCount: this.state.hGridCount} = this.state[dataFor].objInterval);
    this.state.gridHeight = (((this.CHART_DATA.svgCenter.y * 2) - this.CHART_DATA.marginTop - this.CHART_DATA.marginBottom) / (this.state.hGridCount)); 
  } 

  propsWillReceive(nextProps) {
    this.CHART_CONST = UtilCore.extends(this.CHART_CONST, nextProps.chartConst);
    this.CHART_DATA = UtilCore.extends(this.CHART_DATA, nextProps.chartData);
    this.CHART_OPTIONS = UtilCore.extends(this.CHART_OPTIONS, nextProps.chartOptions);
    this.CHART_DATA.hScrollBoxHeight = nextProps.hideHorizontalScroller ? 0 : 40;
    this.init(); 
  }

  componentDidMount() {
    this.bindEventsOfDataTooltips(); 
    this.emitter.on('hScroll', this.onHScrollBind);
  }

  componentWillUnmount() {
    this.emitter.removeListener('hScroll', this.onHScrollBind); 
    this.emitter.removeListener('pointHighlighted', this.onPointHighlightedBind); 
    this.emitter.removeListener('interactiveMouseLeave', this.onMouseLeaveBind); 
  }

  render() {
    return (
      <g>
        <style>
          {this.getStyle()}
        </style> 
        <g>
          <Draggable>
            <text class='txt-title-grp' text-rendering='geometricPrecision'>
              <tspan text-anchor='middle' class='txt-title' x={(this.CHART_DATA.svgWidth/2)} y={(this.CHART_DATA.offsetHeight - 30)}>{this.CHART_OPTIONS.title}</tspan>
              <tspan text-anchor='middle' class='txt-subtitle'x={(this.CHART_DATA.svgWidth/2)} y={(this.CHART_DATA.offsetHeight)}>{this.CHART_OPTIONS.subtitle}</tspan>
            </text>
          </Draggable>
        </g>
        
        <Grid posX={this.CHART_DATA.marginLeft} posY={this.CHART_DATA.marginTop} 
          width={this.CHART_DATA.gridBoxWidth} height={this.CHART_DATA.gridBoxHeight} 
          gridCount={this.state.hGridCount} gridHeight={this.state.gridHeight}>
        </Grid> 

        <VerticalLabels  opts={this.state.cs.dataSet.yAxis || {}}
          posX={this.CHART_DATA.marginLeft - 10} posY={this.CHART_DATA.marginTop} maxVal={this.state.cs.objInterval.iMax} minVal={this.state.cs.objInterval.iMin} valueInterval={this.state.cs.valueInterval}
          labelCount={this.state.hGridCount} intervalLen={this.state.gridHeight} maxWidth={this.CHART_DATA.vLabelWidth} 
          updateTip={this.updateLabelTip.bind(this)} hideTip={this.hideTip.bind(this)}>
        </VerticalLabels> 

        <HorizonalLabels opts={this.state.cs.dataSet.xAxis || {}}
          posX={this.CHART_DATA.marginLeft + 10} posY={this.CHART_DATA.marginTop + this.CHART_DATA.gridBoxHeight} maxWidth={this.CHART_DATA.gridBoxWidth} 
          categorySet = {this.state.cs.dataSet.xAxis.categories} paddingX={this.CHART_DATA.paddingX}
          updateTip={this.updateLabelTip.bind(this)} hideTip={this.hideTip.bind(this)}>
        </HorizonalLabels>   

        <text class='vertical-axis-title' fill={defaultConfig.theme.fontColorDark} transform={`rotate(${-90},${20},${(this.CHART_DATA.marginTop + (this.CHART_DATA.gridBoxHeight/2))})`} text-rendering='geometricPrecision' text-anchor='middle' font-weight="bold" stroke="white" stroke-width="10" stroke-linejoin="round" paint-order="stroke">
          <tspan x={20} y={(this.CHART_DATA.marginTop + (this.CHART_DATA.gridBoxHeight/2))}>{this.CHART_OPTIONS.dataSet.yAxis.title}</tspan>
        </text>

        <text class='horizontal-axis-title' fill={defaultConfig.theme.fontColorDark} text-rendering='geometricPrecision' text-anchor='middle' font-weight="bold" stroke="white" stroke-width="25" stroke-linejoin="round" paint-order="stroke">
          <tspan x={(this.CHART_DATA.marginLeft + (this.CHART_DATA.gridBoxWidth/2))} y={(this.CHART_DATA.marginTop + this.CHART_DATA.gridBoxHeight + (this.CHART_DATA.hScrollBoxMarginTop/2) + 15)}>{this.CHART_OPTIONS.dataSet.xAxis.title}</tspan>
        </text>
        
        { this.drawSeries() }
        
        { this.drawHScrollSeries() }

        <HorizontarScroller posX={this.CHART_DATA.marginLeft} posY={this.CHART_DATA.marginTop + this.CHART_DATA.gridBoxHeight + this.CHART_DATA.hScrollBoxMarginTop} 
          width={this.CHART_DATA.gridBoxWidth} height={this.CHART_DATA.hScrollBoxHeight} leftOffset={this.state.leftOffset} rightOffset={this.state.rightOffset}> 
        </HorizontarScroller>

        <Tooltip onRef={ref => this.subComp.tooltip = ref} opts={this.CHART_OPTIONS.tooltip || {}}
          svgWidth={this.CHART_DATA.svgWidth} svgHeight={this.CHART_DATA.svgHeight} >
        </Tooltip>
        
        <InteractivePlane posX={this.CHART_DATA.marginLeft} posY={this.CHART_DATA.marginTop} 
          width={this.CHART_DATA.gridBoxWidth} height={this.CHART_DATA.gridBoxHeight} >
        </InteractivePlane>
      </g>
    );
  }

  drawSeries() {
    let maxSeriesLen = this.state.cs.dataSet.series[this.CHART_DATA.longestSeries].data.length; //slice(this.state.windowLeftIndex, this.state.windowRightIndex + 1).length;
    let isBothSinglePoint = true; 
    this.state.cs.dataSet.series.map(s => {
      isBothSinglePoint = !!(isBothSinglePoint * (s.data.length == 1));
    });
    return this.state.cs.dataSet.series.filter(d => d.data.length > 0).map((series, i) => {
      return (
        <AreaFill dataSet={series} index={i} instanceId={'cs' + i} posX={this.CHART_DATA.marginLeft} posY={this.CHART_DATA.marginTop} paddingX={this.CHART_DATA.paddingX}
          width={this.CHART_DATA.gridBoxWidth} height={this.CHART_DATA.gridBoxHeight} maxSeriesLen={maxSeriesLen} fill={series.bgColor || UtilCore.getColor(i)} 
          gradient={typeof series.gradient == 'undefined' ? true : series.gradient} opacity={series.areaOpacity || 0.2} spline={typeof series.spline === 'undefined' ? true : series.spline} 
          marker={typeof series.marker == 'undefined' ? true : series.marker} markerRadius={series.markerRadius || 3} centerSinglePoint={isBothSinglePoint} strokeWidth={series.lineWidth || 1.5} 
          maxVal={this.state.cs.objInterval.iMax} minVal={this.state.cs.objInterval.iMin} dataPoints={true}>
        </AreaFill>
      );
    });
  }

  drawHScrollSeries() {
    let maxSeriesLen = this.CHART_OPTIONS.dataSet.series[this.CHART_DATA.longestSeries].data.length;

    return this.state.fs.dataSet.series.map((series, i) => {
      return (
        <AreaFill dataSet={series} index={i} instanceId={'fs'+ i} posX={this.CHART_DATA.marginLeft} posY={this.CHART_DATA.marginTop + this.CHART_DATA.gridBoxHeight + this.CHART_DATA.hScrollBoxMarginTop + 5} paddingX={0} 
          width={this.CHART_DATA.gridBoxWidth} height={this.CHART_DATA.hScrollBoxHeight - 5} maxSeriesLen={maxSeriesLen} fill="#777" 
          gradient={false} opacity="1" spline={typeof series.spline === 'undefined' ? true : series.spline} 
          marker={false} markerRadius="0" centerSinglePoint={false} strokeWidth="1"
          maxVal={this.state.fs.objInterval.iMax} minVal={this.state.fs.objInterval.iMin} dataPoints={false}>
        </AreaFill>
      );
    });
  }

  onHScroll(e) {
    let maxSeriesLen = this.CHART_OPTIONS.dataSet.series[this.CHART_DATA.longestSeries].data.length;
    let leftIndex =  Math.round(maxSeriesLen * e.leftOffset / 100); 
    let rightIndex = Math.round(maxSeriesLen * e.rightOffset / 100);
    if(this.state.windowLeftIndex != leftIndex || this.state.windowRightIndex != rightIndex) {
      this.state.windowLeftIndex = leftIndex; 
      this.state.windowRightIndex = rightIndex; 
      this.prepareDataSet();
      this.update();
    }
  }

  updateLabelTip(e, labelData) {
    let mousePos = UiCore.cursorPoint(this.context.rootContainerId, e);
    if(this.subComp.tooltip) {
      this.subComp.tooltip.updateTip(mousePos, null, labelData);
    }
  }

  bindEventsOfDataTooltips() {
    this.emitter.on('pointHighlighted', this.onPointHighlightedBind);
    this.emitter.on('interactiveMouseLeave', this.onMouseLeaveBind);
  }

  consumeEvents(e) {
    let series = this.state.cs.dataSet.series[e.highlightedPoint.seriesIndex];
    let point = series.data[e.highlightedPoint.pointIndex];
    let hPoint = {
      label: point.label,
      value: point.value,
      seriesName: series.name,
      seriesIndex: e.highlightedPoint.seriesIndex, 
      pointIndex: e.highlightedPoint.pointIndex,
      seriesColor: series.bgColor || UtilCore.getColor(e.highlightedPoint.seriesIndex),
      dist: e.highlightedPoint.dist
    };

    if(this.originPoint) {
      this.originPoint = new Point(e.highlightedPoint.x , (e.highlightedPoint.y + this.originPoint.y) / 2);
    } else {
      this.originPoint = new Point(e.highlightedPoint.x, e.highlightedPoint.y);
    }
    return hPoint; 
  }

  onPointHighlighted(e) {
    if(!this.eventStream[e.timeStamp] ) {
      this.eventStream[e.timeStamp] = [e]; 
    } else {
      this.eventStream[e.timeStamp].push(e); 
    }
    //consume events when all events are received
    if(this.eventStream[e.timeStamp].length === this.state.cs.dataSet.series.filter(s => s.data.length > 0).length) {
      for(let evt of this.eventStream[e.timeStamp]) {
        if(evt.highlightedPoint === null) {
          continue; 
        }
        this.pointData.push(this.consumeEvents(evt));
      }
      if(this.pointData.length && !this.prevOriginPoint || (this.originPoint && this.originPoint.x !== this.prevOriginPoint.x && this.originPoint.y !== this.prevOriginPoint.y)) {
        this.updateDataTooltip(this.originPoint, this.pointData);
      }
      if(!this.pointData.length) {
        this.hideTip();
      }
      this.pointData = [];
      this.prevOriginPoint = this.originPoint; 
      this.originPoint = undefined;
      delete this.eventStream[e.timeStamp]; 
    } 
  }

  onMouseLeave(e) {
    if(!this.subComp.tooltip) {
      return; 
    } 
    this.pointData = [];
    this.originPoint = undefined;
    this.prevOriginPoint = undefined; 
    this.hideTip(); 
  }

  updateDataTooltip(originPoint, pointData) {
    if(!this.subComp.tooltip) {
      return; 
    }
    if (this.CHART_OPTIONS.tooltip && this.CHART_OPTIONS.tooltip.content) {
      this.subComp.tooltip.updateTip(originPoint, pointData, undefined, undefined, 'left');
    } 
    else {
      let row1 = this.getDefaultTooltipHTML.call(pointData); 
      let row2 = 'html'; 
      this.subComp.tooltip.updateTip(originPoint, pointData, row1, row2, 'left');
    }
  }

  getDefaultTooltipHTML() {
    return '<table>' +
      '<tbody>' +
        '<tr style="background-color: #aaa; font-size: 14px; text-align: left; color: #FFF;">' +
          '<th colspan="2" style="padding: 2px 5px; ">' + this[0].label + '</th>' +
        '</tr>' +
          this.map(function(point) {
            return '<tr>' + 
                '<td style="font-size: 13px; padding: 3px 6px; background-color: #fff;">' +
                  '<span style="background-color:' + point.seriesColor +'; display:inline-block; width:10px; height:10px;margin-right:5px;"></span>' + point.seriesName + '</td>' +
                '<td style="font-size: 13px; padding: 3px 6px; background-color: #fff;">'+ point.value + '</td>' +
              '</tr>';
          }).join('') +
      '</tbody>' +
    '</table>';
  }

  hideTip() {
    this.subComp.tooltip && this.subComp.tooltip.hide(); 
  }

  getStyle() {
    return (`
      *{
        outline:none;
      }
      .txt-title-grp .txt-title {
        font-family: ${(this.CHART_OPTIONS.titleStyle && this.CHART_OPTIONS.titleStyle.fontFamily) || defaultConfig.theme.fontFamily};
        font-size: ${UiCore.getScaledFontSize(this.CHART_OPTIONS.width, 20, (this.CHART_OPTIONS.titleStyle && this.CHART_OPTIONS.titleStyle.maxFontSize) || 25)};
        fill: ${(this.CHART_OPTIONS.titleStyle && this.CHART_OPTIONS.titleStyle.fillColor) || defaultConfig.theme.fontColorDark};
        stroke: ${(this.CHART_OPTIONS.titleStyle && this.CHART_OPTIONS.titleStyle.borderColor) || 'none'};
      }
      .txt-title-grp .txt-subtitle {
        font-family: ${(this.CHART_OPTIONS.subtitleStyle && this.CHART_OPTIONS.subtitleStyle.fontFamily) || defaultConfig.theme.fontFamily};
        font-size: ${UiCore.getScaledFontSize(this.CHART_OPTIONS.width, 30, (this.CHART_OPTIONS.subtitleStyle && this.CHART_OPTIONS.subtitleStyle.maxFontSize) || 18)};
        fill: ${(this.CHART_OPTIONS.subtitleStyle && this.CHART_OPTIONS.subtitleStyle.fillColor) || defaultConfig.theme.fontColorDark};
        stroke: ${(this.CHART_OPTIONS.subtitleStyle && this.CHART_OPTIONS.subtitleStyle.borderColor) || 'none'};
      }
      .vertical-axis-title, .horizontal-axis-title {
        font-family: ${defaultConfig.theme.fontFamily};
        font-size: ${UiCore.getScaledFontSize(this.CHART_OPTIONS.width, 30, 14)};
      }
    `);
  }
}

export default AreaChart; 
