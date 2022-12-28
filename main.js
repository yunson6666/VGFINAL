d3.csv('data/vgsales.csv').then(
    res=>{
        console.log(res)
    }
);

function Clean(d){
    const parseNA = string => (string === "N/A" ? undefined : string);
    const parseDate = string => d3.timeParse("%Y")(string);
    const date = parseNA(d.Year);
    return{
        Rank:parseNA(d.Rank),
        Name:parseNA(d.Name),
        Platform:parseNA(d.Platform),
        Year:date,
        Genre:parseNA(d.Genre),
        Publisher:parseNA(d.Publisher),

        NA_Sales:+d.NA_Sales, //North America
        EU_Sales:+d.EU_Sales,
        JP_Sales:+d.JP_Sales,
        Other_Sales:+d.Other_Sales,
        Global_Sales:+d.Global_Sales,
    }
}

d3.csv('data/vgsales.csv',Clean).then(
    res=>{
        console.log(res)
    }
);


function filterdata(d){
    return d.filter(
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

// function prepareBarChartData(d){
//     const dataMap = d3.rollup(
//         d,
//         v => d3.sum(v, leaf => leaf.Global_Sales),
//         d => d.Platform //分類
//     );
//     const dataArray = Array.from(dataMap, d=>({Platform:d[0], Global_Sales:d[1]}));
//     return dataArray;
// }

function choosedata(metric,data){
    const thisData = data.sort((a,b)=>b[metric]-a[metric]).filter((d,i)=>i<6);
    return thisData;
}

function setupCanvas(barchartdata , lastdata ){
    let metric = 'Global_Sales';
    function click(){
        metric = this.dataset.name;
        // debugger;
        function prepareBarChartData(d){
            const dataMap = d3.rollup(
                d,
                v => d3.sum(v, leaf => leaf.metric),
                d => d.Platform //分類
            );
            const dataArray = Array.from(dataMap, d=>({Platform:d[0], Global_Sales:d[1]}));
            return dataArray;
        }
        const thisData = choosedata(metric, prepareBarChartData(lastdata));
        update(thisData);
    }
    function update(data){
        console.log(data);
        xMax=d3.max(data, d=>d[metric]);
        xScale = d3.scaleLinear([0, xMax],[0,chart_width]);
        yScale= d3.scaleBand()
            .domain(data.map(d=>d.Platform))
            .rangeRound([0, chart_height])
            .paddingInner(0.25);
        const defaultDelay = 1000
        const transitionDelay = d3.transition().duration(defaultDelay);
        xAxisDraw.transition(transitionDelay).call(xAxis.scale(xScale));
        yAxisDraw.transition(transitionDelay).call(yAxis.scale(yScale));
        header.select('tspan').text(`Top 6 VG games Platform in ${metric}`);
        bars.selectAll('.bar').data(data, d=>d.Platform).join(
            enter=>{
                enter.append('rect')
                    .attr('class','bar')
                    .attr('x',0)
                    .attr('y',d=>yScale(d.Platform))
                    .attr('height',yScale.bandwidth())
                    .style('fill','lightcyan')
                    .transition(transitionDelay)
                    .delay((d,i)=>i*20)
                    .attr('width',d=>xScale(d[metric]))
                    .style('fill', 'dodgerblue')
                },
                update=>{
                    update.transition(transitionDelay)
                        .delay((d,i)=>i*20)
                        .attr('y',d=>yScale(d.Platform))
                        .attr('width',d=>xScale(d[metric]))
                    },
                exit=>{
                    exit.transition()
                    .duration(defaultDelay/2)
                    .style('fill-opacity',0)
                    .remove()
                }
        );
        d3.selectAll('.bar')
            .on('mouseover',mouseover)
            .on('mousemove',mousemove)
            .on('mouseout',mouseout);

    }
    const svg_width = 750 ;
    const svg_height = 500;
    const chart_margin = {top:80,right:40,bottom:40,left:100};
    const chart_width = svg_width - ( chart_margin.left + chart_margin.right);
    const chart_height = svg_height - ( chart_margin.top + chart_margin.bottom);
    const  this_svg = d3.select('.bar-chart-container')
        .append('svg')
        .attr('width' , svg_width)
        .attr('height' , svg_height)
        .append('g')
        .attr('transform' , `translate(${chart_margin.left},${chart_margin.top})`);
    const xExtent = d3.extent(lastdata , d => d.Global_Sales);
    let xScale = d3.scaleLinear().domain(xExtent).range([0, chart_width]);
    let yScale = d3.scaleBand()
        .domain( lastdata.map(d => d.Platform))
        .rangeRound([ 0 , chart_height])
        .paddingInner(0.2);
    const bars = this_svg.append('g').attr('class','bars');
    let header = this_svg
        .append('g')
        .attr('class' , 'bar-header')
        .attr('transform' , `translate(0 , ${-chart_margin.top/2})`)
        .append('text');
    header.append('tspan').text('Total 6 Platform of the VG games in Global');
    header.append('tspan').text('During : 2000~2018')
        .attr('x' , 0 )
        .attr('y' , 20)
        .style('font-size' , '0.8em')
        .style('fill' , '#555');
    function formatTicks(d){
        return d3.format('~s')(d)
        .replace('M' , 'million')
        .replace("G","bil")
        .replace("T","tri")
    };
    let xAxis = d3.axisTop(xScale)
        .tickFormat(formatTicks)
        .tickSizeInner(-chart_height)
        .tickSizeOuter(0);
    let xAxisDraw = this_svg.append('g').attr('class' , 'x axis');
    let yAxis = d3.axisLeft(yScale).tickSize(0);
    let yAxisDraw = this_svg.append('g').attr('class' , 'y axis').call(yAxis);
    yAxisDraw.selectAll('text').attr('dx','-1.25em')
    update(barchartdata);
    const tip =d3.select('.tooltip');
    function mouseover(e){
        const thisBarData = d3.select(this).data()[0];
        tip.style('left',(e.clientX+15)+'px')
            .style('top',e.clientY+'px')
            .transition()
            .style('opacity',0.98)
        tip.select('h3').html(`${thisBarData.Platform}, ${thisBarData.Platform}`);
        tip.select('h4').html(`${thisBarData.Platform}, ${thisBarData.Platform}`);
        }//interactive 新增監聽
    function mousemove(e){
        tip.style('left',(e.clientX+15)+'px')
            .style('top',e.clientY+'px')
            .style('opacity',0.98)
        }
    function mouseout(e){
        tip.transition().style('opacity',0)
    }
    d3.selectAll('.bar')
        .on('mouseover',mouseover)
        .on('mousemove',mousemove)
        .on('mouseout',mouseout)
    d3.selectAll('button').on('click',click);

}


function ready(dataAfterClean){
    const data = filterdata(dataAfterClean)
    const Global_Sales_data = choosedata("Global_Sales",data);
    const NA_Sales_data = choosedata("NA_Sales",data);
    const JP_Sales_data = choosedata("JP_Sales",data);
    const EU_Sales_data = choosedata("EU_Sales",data);
    const Other_Sales_data = choosedata("Other_Sales",data);
    setupCanvas(Global_Sales_data,data)
}

d3.csv('data/vgsales.csv',Clean).then(
    res=>{
        ready(res);
    }
);
