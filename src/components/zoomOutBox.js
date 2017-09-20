/*
 * zoomOutBox.js
 * @Version:1.0.0
 * @CreatedOn:14-Jul-2017
 * @Author:SmartChartsNXT
 * @Description: This components will create zoom out box area for the chart. 
 */

"use strict";

let Event = require("./../core/event");
let Geom = require("./../core/geom.core");

class ZoomOutBox {

    constructor(objChart, chartSVG, top, left, width, height) {
        this.geom = new Geom();
        this.objChart = objChart;
        this.chartSVG = chartSVG;
        this.top = top;
        this.left = left;
        this.width = width;
        this.height = height;
        this.createZoomOutBox(); 
    }

    createZoomOutBox() {
        let self = this;
        let strSVG = "<g id='zoomOutBoxCont' style='display:none;cursor:pointer;'>";
        strSVG += "  <rect id='zoomOutBox' x='" + this.left + "' y='" + this.top + "' width='" + this.width + "' height='" + this.height + "' pointer-events='all' stroke='#717171' fill='none' stroke-width='0' \/>";
        strSVG += "  <circle r='10' cx='" + (this.left + (this.width / 2)) + "' cy='" + (this.top + (this.height / 2)) + "' pointer-events='none' stroke-width='1' fill='none' stroke='#333'/>";
        strSVG += "  <line x1='" + (this.left + (this.width / 2) - 4) + "' y1='" + (this.top + (this.height / 2)) + "' x2='" + (this.left + (this.width / 2) + 4) + "' y2='" + (this.top + (this.height / 2)) + "' pointer-events='none' stroke-width='1' fill='none' stroke='#333'/>";

        let lineStart = this.geom.polarToCartesian((this.left + (this.width / 2)), (this.top + (this.height / 2)), 10, 135);
        let lineEnd = this.geom.polarToCartesian((this.left + (this.width / 2)), (this.top + (this.height / 2)), 20, 135);
        strSVG += "  <line x1='" + lineStart.x + "' y1='" + lineStart.y + "' x2='" + lineEnd.x + "' y2='" + lineEnd.y + "' pointer-events='none' stroke-width='2' fill='none' stroke='#333'/>";
        strSVG += "</g>";

        this.chartSVG.insertAdjacentHTML("beforeend", strSVG);
        this.zoomOutBoxCont = this.chartSVG.querySelector("#zoomOutBoxCont");
        let zoomOutBox = this.zoomOutBoxCont.querySelector("#zoomOutBox");

        /*Fire event on zoom out click */
        zoomOutBox.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            self.hide(); 
            let onZoomOutEvent = new Event("onZoomOut", {
                srcElement: self.chartSVG
            });
            self.objChart.event.dispatchEvent(onZoomOutEvent);
        }, false);
    }

    show() {
        if (this.zoomOutBoxCont) {
            this.zoomOutBoxCont.style.display = "block";
        }
    }

    hide() {
        if (this.zoomOutBoxCont) {
            this.zoomOutBoxCont.style.display = "none";
        }
    }
}

module.exports = ZoomOutBox;