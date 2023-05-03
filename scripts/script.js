// Вспомогательные функции

/**
 * Возвращает рандомное целое число в интервале min-max.
 * @param {Number} min - Минимальное число интервала
 * @param {Number} max - Максимальное число интервала
 * @returns {Number}
 */
const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min);
};

// END Вспомогательные функции

let ns;

const containerSelector = '.graph-container';
let lastGraph = null;
let lastTrie = null;
let lastTrueNodesIndexList = null;
let nowShowFinded = false;

const drawTrie = (trie) => {
    ns = [];
    lastTrueNodesIndexList = null;
    nowShowFinded = false;
    const data = generateDataForDraw(trie);

    let graph = Viva.Graph.graph(),
    nodePositions = data.positions,
    graphics = Viva.Graph.View.svgGraphics(),
    layout = Viva.Graph.Layout.constant(graph),
    nodeSize = 24,
    renderer = Viva.Graph.View.renderer(graph, {
        graphics: graphics,
        layout : layout,
        container: document.querySelector(containerSelector)
    });
    
    let i, nodesCount = nodePositions.length;
    
    data.nodes.forEach(node => {
        graph.addNode(node.id, node.data);
    })
    
    data.links.forEach(link => {
        graph.addLink(link.from, link.to);
    })
    
    graphics.link(function(link){
        ui = Viva.Graph.svg('line')
            .attr('stroke', 'red')
            .attr('fill', 'red')
            .attr('id', `${link.fromId}-${link.toId}`);
        return ui;
    })
    
    graphics.node(function(node){
        ns.push(node);
        const ui = Viva.Graph.svg('g')
           .attr('id', `n-${node.id}`),
           svgText = Viva.Graph.svg('text')
           .attr('y', '-4px')
           .attr('x', '0px')
           .attr('fill', 'red')
           .text(node.data),
           svgRect = Viva.Graph.svg('rect')
           .attr('width', 10)
           .attr('height', 10)
           .attr('fill', '#00d635');

       ui.append(svgText)
       ui.append(svgRect)
       return ui;
    })
    .placeNode(function(nodeUI, pos) {
        nodeUI.attr('transform', `translate(${pos.x - nodeSize / 4}, ${pos.y - nodeSize / 2})`);
    });
    
    layout.placeNode(function(node) {
        return nodePositions[node.id];
    });

    renderer.run();

    // Zoom to fit hack
    const graphRect = layout.getGraphRect();
    const graphSize = Math.min(graphRect.x2 - graphRect.x1, graphRect.y2 - graphRect.y1) + 500;
    const screenSize = Math.min(document.body.clientWidth, document.body.clientHeight);

    const desiredScale = screenSize / graphSize;
    zoomOut(desiredScale, 1);

    function zoomOut(desiredScale, currentScale) {
        if (desiredScale < currentScale) {
            currentScale = renderer.zoomOut();
            setTimeout(function () {
                zoomOut(desiredScale, currentScale);
            }, 16);
        }
    }
    return graph;
}

const generateDataForDraw = (trie) => {
    let indexNode = 0;
    let dethDeviation = [0, 150, 70, 30, 15];

    const positions = [];
    const nodes = [];
    const links = [];
    
    nodes.push({id: 0, data: '*'});
    positions.push({x: 0, y: 0});

    const checkTree = (tree, deth = 0, deviation = 0, parentIndex = 0) => {
        const children = [];
        
        if (tree['0']) {
            nodes.push({id: indexNode + 1, data: '0'});
            links.push({from: parentIndex, to: indexNode + 1});
            positions.push({x: deviation - dethDeviation[deth + 1], y: (deth + 1) * 50});
            children.push({tree: tree['0'], deviation: deviation - dethDeviation[deth + 1], parentIndex: ++indexNode});
        }
        if (tree['1']) {
            nodes.push({id: indexNode + 1, data: '1'});
            links.push({from: parentIndex, to: indexNode + 1});
            positions.push({x: deviation + dethDeviation[deth + 1] , y: (deth + 1) * 50});
            children.push({tree: tree['1'], deviation: deviation + dethDeviation[deth + 1], parentIndex: ++indexNode});
        }
        if (children.length != 0) children.forEach(tree => checkTree(tree.tree, deth + 1, tree.deviation, tree.parentIndex));
    };
    
    checkTree(trie.trie);

    return {
        positions: positions,
        nodes: nodes,
        links: links
    };
}

const clearGraph = (graph = lastGraph) => {
    graph.clear();
    document.querySelector(`${containerSelector} svg`)?.remove();
}

const getRandomNodeList = (deth, countNodes) => {
    const result = []
    
    for (let j = 0; j < countNodes; j++) {
        let nodeStr = '';
        
        for (let i = 0; i < getRandomInt(2, 5); i++) {
            nodeStr += Math.floor(Math.random() * 2);
        }
        result.push(nodeStr);
    }

    return result;
};

const startPostOrder = () => {
    const arrayData = [];
    ns.forEach(a => {
        const child = [];
        a.links.forEach(link => {
            const values = link.id.split('👉 ');
            if (values[0] == a.id) {
                child.push(values[1]);
            }
        })
        arrayData.push({id: a.id, child: child, value: a.data, checked: false})
    })


    const buildTreeObj = (id, parentId = -1) => {
        const res = {id: id, parentId: parentId};
        if (arrayData[id].child) {
            arrayData[id].child.forEach((item, i) => {
                res[arrayData[item].value] = buildTreeObj(item, id);
            })
        }
        return res;
    }
    const obj = buildTreeObj(0);
    
    const setParentValue = (id) => {
        if (arrayData[id].child) {
            arrayData[id].child.forEach((item, i) => {
                arrayData[item].parentId = id;
                setParentValue(item);
            })
        }
    }
    setParentValue(0);
    let lastLeftId;
    const findLastLeftId = (obj) => {
        if (!obj[0]) lastLeftId = obj.id;
        else findLastLeftId(obj[0])
    }
    findLastLeftId(obj);

    const childChecked = (id) => {
        let result = true;
        if (arrayData[id].child.length > 0) {
            arrayData[id].child.forEach(child => {
                if (arrayData[child].checked == false) {
                    result = false;
                };
            })
        }
        return result;
    }

    const traverseTree = (id) => {
        if (childChecked(id)) {
            if (arrayData[id].value > -1) {
                arrayData[id].checked = true;
                queue.push([() => {
                    const $node = document.querySelector(`svg > g > g#n-${id}`);
                    $node.setAttribute('data-showed', '');
                    $node.querySelector('rect').setAttribute('fill', 'blue');
                }]);
                if (arrayData[id].value == '0') {
                    if (arrayData[arrayData[id].parentId].child[1]) {
                        traverseTree(arrayData[arrayData[id].parentId].child[1]);
                    } else {
                        traverseTree(arrayData[id].parentId);
                    }
                } else {
                    traverseTree(arrayData[id].parentId);
                }
            }
        } else {
            traverseTree(arrayData[id].child[0]);
        }
    }
    traverseTree(lastLeftId);

    queue.push([() => {
        const $node = document.querySelector(`svg > g > g#n-0`);
        $node.setAttribute('data-showed', '');
        $node.querySelector('rect').setAttribute('fill', 'blue');
    }]);

    queue.push([() => {
        setTimeout(() => {
            document.querySelectorAll(`svg > g > g[data-showed]`).forEach($node => {
                $node.querySelector('rect').setAttribute('fill', '#00d635');
            });
        }, 2000)
    }]);

}

lastGraph = drawTrie(lastTrie = new Trie(getRandomNodeList(4, 8)));

// algor-postorder-traversal

// - DOM - //

document.querySelector('#buttonCreateRandomTrie')?.addEventListener('click', () => {
    clearGraph();
    lastGraph = drawTrie(lastTrie = new Trie(getRandomNodeList(4, 8)));
})

document.querySelector('#buttonFindTrie')?.addEventListener('click', () => {
    startPostOrder();
})

let queue = [];
let arrayToQueue = [];

const addToQueue = (fn) => {
    queue.push(fn);
}

setInterval(() => {
    if (queue.length > 0) {
        if (queue[0].length > 0) {
            queue[0].forEach(item => item());
            queue.shift();
        }
    }
}, 700)