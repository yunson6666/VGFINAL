//sales ==millions
//Year 2000~2017
const parseNA = string => (string === "N/A" ? undefined : string);
const parseDate = string => d3.timeParse("%Y")(string);
//掛+號把字串轉數字
function type(d){
    const date = parseNA(d.Year);
    return{
        Rank:parseNA(d.Rank),
        Name:parseNA(d.Name),
        Platform:parseNA(d.Platform),
        Year:date,
        Genre:parseNA(d.Genre),
        Publisher:parseNA(d.Publisher),

        NA_Sales:+(d.NA_Sales), //North America
        EU_Sales:+(d.EU_Sales),
        JP_Sales:+(d.JP_Sales),
        Other_Sales:+(d.Other_Sales),
        Global_Sales:+(d.Global_Sales),
    }
}
function formatTicks(d){
    return d3.format("~s")(d)
    .replace("M","mil")
    .replace("G","bil")
    .replace("T","tri")
}
//d3.csv('data/vgsales.csv',type).then(
//    res=>{
//        console.log(res);
//    }
//)
//挑選要使用的data, data Selection
function filterData(data){
    return data.filter(
        d => {
            return(
                d.Year > 2000 && d.Year < 2018 &&
                d.Name &&
                d.Platform &&
                d.Global_Sales > 0 &&
                d.NA_Sales  > 0 &&
                d.JP_Sales > 0 &&
                d.EU_Sales > 0 &&
                d.Other_Sales >0 
            );
        }
    );
}

function prepareBarChartData(data){
    console.log(data);
    const dataMap = d3.rollup(
        data,
        v => d3.sum(v, leaf => leaf.Global_Sales),
        d => d.Platform //分類
    );
    const dataArray = Array.from(dataMap, d=>({Platform:d[0], Global_Sales:d[1]}));
    return dataArray;
}
function setupCanvas(barChartData, vgsalesClean){

    let metric = "sales";

    function click(){
        metric = this.dataset.name;
        const thisData = chooseData(metric, vgsalesClean);
        update(thisData);
    }

    d3.selectAll("button").on("click",click);

    function update(data){
        console.log(data);

        xMax = d3.max(data, d=>d[metric]);
        xScale = d3.scaleLinear([0, xMax],[0, barchart_width]);
        
        yScale = d3.scaleBand().domain(data.map(d=>d.title))
        .rangeRound([0, barchart_height]).paddingInner(0.25);

        const defaultDelay = 1000;
        const transitionDelay = d3.transition().duration(defaultDelay);

        
        xAxisDraw.transition(transitionDelay).call(xAxis.scale(xScale));
        yAxisDraw.transition(transitionDelay).call(yAxis.scale(yScale));
        header.select('tspan').text(`Top 6 ${metric} vgsales ${metric === 'Sales' ? '' : 'in $US'}`);
        bars.selectAll('.bar').data(data, d=>d.title).join(
            enter => {
                enter.append('rect').attr("class","bar")
                .attr("x",0).attr("y",d=>yScale(d.title))
                .attr("height",yScale.bandwidth())
                .style("fill","lightcyan")
                .transition(transitionDelay)
                .delay((d,i)=>i*20)
                .attr("width",d=>xScale(d[metric]))
                .style("fill","brown");
            },
            update => {
                update.transition(transitionDelay)
                .delay((d,i)=>i*20)
                .attr("y",d=>yScale(d.title))
                .attr("width",d=>xScale(d[metric]));
            },
            exit =>{
                exit.transition().duration(defaultDelay/2)
                .style("fill-opacity",0)
                .remove();
            }
        );
    

    }
    const svg_width = 700;
    const svg_height = 500;
    const barchart_margin = {top:80, right:40, bottom:40,left:250};
    const barchart_width = svg_width - (barchart_margin.left + barchart_margin.right);
    const barchart_height = svg_height - (barchart_margin.top + barchart_margin.bottom);

    const this_svg = d3.select('.bar-chart-container').append('svg')
    .attr('width', svg_width).attr('height', svg_height).append('g')
        .attr("transform",`translate(${barchart_margin.left},${barchart_margin.top})`);//`可相容變數及字串 如要變數要加${}

    //find the max and min
    const xExtent = d3.extent(barChartData, d=>d.Global_Sales);
    //debugger 觀察最小最大;
    //v1(min,max)
    const xScale = d3.scaleLinear().domain(xExtent).range([0,barchart_width]);

    const yScale = d3.scaleBand().domain(barChartData.map(d=>d.Platform))
                .rangeRound([0, barchart_height])
                .paddingInner(0.1);

    // const bars = this_svg.selectAll('.bar')
    //                 .data(barChartData)
    //                 .enter()
    //                 .append('rect')
    //                 .attr('class','bar')
    //                 .attr('x',0)
    //                 .attr('y',d=>yScale(d.Platform))
    //                 .attr('width',d=>xScale(d.Global_Sales))
    //                 .attr('height',yScale.bandwidth())
    //                 .style('fill','brown')

    const bars = this_svg.append('g').attr('class','bars');

    let header = this_svg.append("g").attr('class','bar-header')
                    .attr('transform',`translate(0,${-barchart_margin.top/2})`)
                    .append('text');

    header.append('tspan').text('Top 6 xxx videogames');
    header.append('tspan').text('Year:2000-2017')
            .attr('x',0).attr('y',20).style('font-size','0.8em').style('fill','#555')
    let xAxis = d3.axisTop(xScale)
            .tickFormat(formatTicks)
            .tickSizeInner(-barchart_height)
            .tickSizeOuter(0);

    let xAxisDraw = this_svg.append('g')
                .attr('class', 'x axis');
                

    let yAxis = d3.axisLeft(yScale).tickSize(0);

    let yAxisDraw = this_svg.append('g')
                .attr('class','y axis');

    yAxisDraw.selectAll('text').attr('dx','-0.6em');

    update(barChartData);
}


function ready(vgsales){
    const vgsalesClean = filterData(vgsales);

    const revenueData = chooseData("revenue", vgsalesClean);
    console.log(revenueData);
    setupCanvas(revenueData, vgsalesClean);
}

d3.csv('data/vgsales.csv',type).then(
    res => {
        ready(res);
    }
);

function chooseData(metric, vgsalesClean){
    const thisData = vgsalesClean.sort((a,b)=>b[metric]-a[metric]).filter((d,i)=>i<6);
    return thisData;
}