"use strict";

// Expanded C/H/O organic compound library for ChemBuilder.
// Structures are stored as labelled bond graphs; saturated() fills normal H valencies.

// Unsaturated and oxygen-containing rings
saturated("Oxirene",["C","C","O"],[[0,1,2],[1,2,1],[2,0,1]],"Also called oxacyclopropene");
saturated("Cyclopropene",["C","C","C"],[[0,1,2],[1,2,1],[2,0,1]]);
saturated("Cyclobutene",["C","C","C","C"],[[0,1,2],[1,2,1],[2,3,1],[3,0,1]]);
saturated("Cyclopentene",["C","C","C","C","C"],[[0,1,2],[1,2,1],[2,3,1],[3,4,1],[4,0,1]]);
saturated("Cyclohexene",["C","C","C","C","C","C"],[[0,1,2],[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,0,1]]);
saturated("Oxetane",["O","C","C","C"],[[0,1,1],[1,2,1],[2,3,1],[3,0,1]]);
saturated("Tetrahydrofuran",["O","C","C","C","C"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,0,1]]);
saturated("Tetrahydropyran",["O","C","C","C","C","C"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,0,1]]);
saturated("1,3-Dioxolane",["O","C","O","C","C"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,0,1]]);
saturated("1,4-Dioxane",["O","C","C","O","C","C"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,0,1]]);
saturated("Propylene oxide",["C","C","O","C"],[[0,1,1],[1,2,1],[2,0,1],[1,3,1]]);

// Dienes, cumulenes and alkynes
saturated("Propadiene (allene)",["C","C","C"],[[0,1,2],[1,2,2]]);
saturated("Buta-1,3-diene",["C","C","C","C"],[[0,1,2],[1,2,1],[2,3,2]]);
saturated("Buta-1,2-diene",["C","C","C","C"],[[0,1,2],[1,2,2],[2,3,1]]);
saturated("Penta-1,3-diene",["C","C","C","C","C"],[[0,1,2],[1,2,1],[2,3,2],[3,4,1]]);
saturated("Penta-1,4-diene",["C","C","C","C","C"],[[0,1,2],[1,2,1],[2,3,1],[3,4,2]]);
saturated("Pent-1-yne",["C","C","C","C","C"],[[0,1,3],[1,2,1],[2,3,1],[3,4,1]]);
saturated("Pent-2-yne",["C","C","C","C","C"],[[0,1,1],[1,2,3],[2,3,1],[3,4,1]]);
saturated("Hex-1-yne",["C","C","C","C","C","C"],[[0,1,3],[1,2,1],[2,3,1],[3,4,1],[4,5,1]]);
saturated("Hex-2-yne",["C","C","C","C","C","C"],[[0,1,1],[1,2,3],[2,3,1],[3,4,1],[4,5,1]]);
saturated("Hex-3-yne",["C","C","C","C","C","C"],[[0,1,1],[1,2,1],[2,3,3],[3,4,1],[4,5,1]]);

// Branched and longer alkanes
saturated("2-Methylpentane",["C","C","C","C","C","C"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[1,5,1]]);
saturated("3-Methylpentane",["C","C","C","C","C","C"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[2,5,1]]);
saturated("2,2-Dimethylbutane",["C","C","C","C","C","C"],[[0,1,1],[1,2,1],[2,3,1],[1,4,1],[1,5,1]]);
saturated("2,3-Dimethylbutane",["C","C","C","C","C","C"],[[0,1,1],[1,2,1],[2,3,1],[1,4,1],[2,5,1]]);
saturated("n-Heptane",Array(7).fill("C"),[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1]]);
saturated("n-Octane",Array(8).fill("C"),[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1],[6,7,1]]);
saturated("n-Nonane",Array(9).fill("C"),[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1],[6,7,1],[7,8,1]]);
saturated("n-Decane",Array(10).fill("C"),[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1],[6,7,1],[7,8,1],[8,9,1]]);

// Alcohols and polyols
saturated("Butan-1-ol",["C","C","C","C","O"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1]]);
saturated("Butan-2-ol",["C","C","C","C","O"],[[0,1,1],[1,2,1],[2,3,1],[1,4,1]]);
saturated("2-Methylpropan-1-ol (isobutanol)",["C","C","C","C","O"],[[0,1,1],[1,2,1],[1,3,1],[0,4,1]]);
saturated("2-Methylpropan-2-ol (tert-butanol)",["C","C","C","C","O"],[[0,1,1],[0,2,1],[0,3,1],[0,4,1]]);
saturated("Pentan-1-ol",["C","C","C","C","C","O"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1]]);
saturated("Pentan-2-ol",["C","C","C","C","C","O"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[1,5,1]]);
saturated("Pentan-3-ol",["C","C","C","C","C","O"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[2,5,1]]);
saturated("Propane-1,2-diol",["C","C","C","O","O"],[[0,1,1],[1,2,1],[0,3,1],[1,4,1]]);
saturated("Propane-1,3-diol",["O","C","C","C","O"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1]]);
saturated("Glycerol",["C","C","C","O","O","O"],[[0,1,1],[1,2,1],[0,3,1],[1,4,1],[2,5,1]]);

// Ethers
saturated("Ethoxyethane (diethyl ether)",["C","C","O","C","C"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1]]);
saturated("1-Methoxypropane",["C","O","C","C","C"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1]]);
saturated("2-Methoxypropane",["C","O","C","C","C"],[[0,1,1],[1,2,1],[2,3,1],[2,4,1]]);
saturated("Methyl tert-butyl ether",["C","O","C","C","C","C"],[[0,1,1],[1,2,1],[2,3,1],[2,4,1],[2,5,1]]);

// Aldehydes and ketones
saturated("Butanal",["C","C","C","C","O"],[[0,1,1],[1,2,1],[2,3,1],[3,4,2]]);
saturated("2-Methylpropanal",["C","C","C","C","O"],[[0,1,1],[1,2,1],[1,3,1],[0,4,2]]);
saturated("Pentanal",["C","C","C","C","C","O"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,2]]);
saturated("Butan-2-one",["C","C","C","C","O"],[[0,1,1],[1,2,1],[2,3,1],[1,4,2]]);
saturated("Pentan-2-one",["C","C","C","C","C","O"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[1,5,2]]);
saturated("Pentan-3-one",["C","C","C","C","C","O"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[2,5,2]]);
saturated("Glyoxal (ethanedial)",["C","C","O","O"],[[0,1,1],[0,2,2],[1,3,2]]);
saturated("Glycolaldehyde",["C","C","O","O"],[[0,1,1],[0,2,1],[1,3,2]]);

// Carboxylic acids
saturated("Propionic acid (propanoic acid)",["C","C","C","O","O"],[[0,1,1],[1,2,1],[2,3,2],[2,4,1]]);
saturated("Butyric acid (butanoic acid)",["C","C","C","C","O","O"],[[0,1,1],[1,2,1],[2,3,1],[3,4,2],[3,5,1]]);
saturated("Isobutyric acid (2-methylpropanoic acid)",["C","C","C","C","O","O"],[[0,1,1],[1,2,1],[1,3,1],[0,4,2],[0,5,1]]);
saturated("Valeric acid (pentanoic acid)",["C","C","C","C","C","O","O"],[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,2],[4,6,1]]);
saturated("Oxalic acid",["C","C","O","O","O","O"],[[0,1,1],[0,2,2],[0,3,1],[1,4,2],[1,5,1]]);
saturated("Malonic acid",["C","C","C","O","O","O","O"],[[0,1,1],[1,2,1],[0,3,2],[0,4,1],[2,5,2],[2,6,1]]);
saturated("Succinic acid",["C","C","C","C","O","O","O","O"],[[0,1,1],[1,2,1],[2,3,1],[0,4,2],[0,5,1],[3,6,2],[3,7,1]]);

// Esters
saturated("Methyl formate",["C","O","O","C"],[[0,1,2],[0,2,1],[2,3,1]]);
saturated("Ethyl formate",["C","O","O","C","C"],[[0,1,2],[0,2,1],[2,3,1],[3,4,1]]);
saturated("Methyl acetate",["C","C","O","O","C"],[[0,1,1],[1,2,2],[1,3,1],[3,4,1]]);
saturated("Ethyl acetate",["C","C","O","O","C","C"],[[0,1,1],[1,2,2],[1,3,1],[3,4,1],[4,5,1]]);
saturated("Methyl propionate",["C","C","C","O","O","C"],[[0,1,1],[1,2,1],[2,3,2],[2,4,1],[4,5,1]]);
saturated("Propyl acetate",["C","C","O","O","C","C","C"],[[0,1,1],[1,2,2],[1,3,1],[3,4,1],[4,5,1],[5,6,1]]);

// Aromatic hydrocarbons and oxygen derivatives; one Kekule form is used
saturated("Toluene",["C","C","C","C","C","C","C"],[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[0,6,1]],"One Kekulé structure");
saturated("Ethylbenzene",["C","C","C","C","C","C","C","C"],[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[0,6,1],[6,7,1]],"One Kekulé structure");
saturated("Styrene",["C","C","C","C","C","C","C","C"],[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[0,6,1],[6,7,2]],"One Kekulé structure");
saturated("o-Xylene",["C","C","C","C","C","C","C","C"],[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[0,6,1],[1,7,1]],"One Kekulé structure");
saturated("m-Xylene",["C","C","C","C","C","C","C","C"],[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[0,6,1],[2,7,1]],"One Kekulé structure");
saturated("p-Xylene",["C","C","C","C","C","C","C","C"],[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[0,6,1],[3,7,1]],"One Kekulé structure");
saturated("Phenol",["C","C","C","C","C","C","O"],[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[0,6,1]],"One Kekulé structure");
saturated("Anisole (methoxybenzene)",["C","C","C","C","C","C","O","C"],[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[0,6,1],[6,7,1]],"One Kekulé structure");
saturated("Benzyl alcohol",["C","C","C","C","C","C","C","O"],[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[0,6,1],[6,7,1]],"One Kekulé structure");
saturated("Benzaldehyde",["C","C","C","C","C","C","C","O"],[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[0,6,1],[6,7,2]],"One Kekulé structure");
saturated("Benzoic acid",["C","C","C","C","C","C","C","O","O"],[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[0,6,1],[6,7,2],[6,8,1]],"One Kekulé structure");

// Conventional skeletal bond renderer loaded after ChemBuilder's main script.
function skeletalEdgeCycleInfo(edge, edges, nodes, pointForNode) {
  const adjacency = new Map(nodes.map(id => [id, []]));
  for (const e of edges) {
    if (e === edge) continue;
    if (!adjacency.has(e.a) || !adjacency.has(e.b)) continue;
    adjacency.get(e.a).push(e.b);
    adjacency.get(e.b).push(e.a);
  }
  const queue = [edge.a], parent = new Map([[edge.a, -1]]);
  while (queue.length) {
    const id = queue.shift();
    if (id === edge.b) break;
    for (const next of adjacency.get(id) || []) {
      if (!parent.has(next)) { parent.set(next, id); queue.push(next); }
    }
  }
  if (!parent.has(edge.b)) return null;
  const cycleNodes = [];
  let id = edge.b;
  while (id !== -1) {
    cycleNodes.push(id);
    if (id === edge.a) break;
    id = parent.get(id);
  }
  if (cycleNodes[cycleNodes.length - 1] !== edge.a) return null;
  let cx = 0, cy = 0;
  for (const node of cycleNodes) { const p = pointForNode(node); cx += p.x; cy += p.y; }
  return {x: cx / cycleNodes.length, y: cy / cycleNodes.length};
}

function skeletalAuxiliarySide(edge, graph, pointForNode) {
  const a = pointForNode(edge.a), b = pointForNode(edge.b);
  const dx = b.x - a.x, dy = b.y - a.y;
  const mx = (a.x + b.x) * 0.5, my = (a.y + b.y) * 0.5;
  const ringCentre = skeletalEdgeCycleInfo(edge, graph.edges, graph.nodes, pointForNode);
  if (ringCentre) {
    return dx * (ringCentre.y - my) - dy * (ringCentre.x - mx) >= 0 ? 1 : -1;
  }
  let score = 0;
  for (const other of graph.edges) {
    let neighbour = null;
    if (other.a === edge.a && other.b !== edge.b) neighbour = other.b;
    else if (other.b === edge.a && other.a !== edge.b) neighbour = other.a;
    else if (other.a === edge.b && other.b !== edge.a) neighbour = other.b;
    else if (other.b === edge.b && other.a !== edge.a) neighbour = other.a;
    if (neighbour === null) continue;
    const p = pointForNode(neighbour);
    score += dx * (p.y - my) - dy * (p.x - mx);
  }
  return score < 0 ? -1 : 1;
}

drawSkeletalBond = function(x1,y1,x2,y2,order,side=1) {
  const dx=x2-x1,dy=y2-y1,d=Math.hypot(dx,dy)||1;
  const ux=dx/d,uy=dy/d,nx=-uy,ny=ux;
  ctx.strokeStyle="#e4e7ec";ctx.lineCap="round";
  drawLine(x1,y1,x2,y2,order===1?2.5:2.2);
  if(order===1) return;
  const inset=Math.min(7,d*0.18),spread=2.55;
  const ax=x1+ux*inset,ay=y1+uy*inset,bx=x2-ux*inset,by=y2-uy*inset;
  drawLine(ax+nx*spread*side,ay+ny*spread*side,bx+nx*spread*side,by+ny*spread*side,1.75);
  if(order>=3) drawLine(ax-nx*spread*side,ay-ny*spread*side,bx-nx*spread*side,by-ny*spread*side,1.75);
};

drawSkeletalGraph = function(types,edges,panelX,panelY,panelW,panelH,title){
  ctx.save();
  ctx.fillStyle="rgba(37,40,46,.94)";ctx.strokeStyle="#555c68";ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(panelX,panelY,panelW,panelH,13);ctx.fill();ctx.stroke();
  ctx.fillStyle="#9299a5";ctx.font="700 10px -apple-system,sans-serif";ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText(title,panelX+14,panelY+13);
  const g=skeletalDisplayGraph(types,edges),pos=naturalSkeletalLayout(types,g.edges,g.nodes);
  if(!g.nodes.length){ctx.restore();return;}
  let minX=Math.min(...g.nodes.map(i=>pos.get(i).x)),maxX=Math.max(...g.nodes.map(i=>pos.get(i).x));
  let minY=Math.min(...g.nodes.map(i=>pos.get(i).y)),maxY=Math.max(...g.nodes.map(i=>pos.get(i).y));
  if(maxX-minX<.2){minX-=.65;maxX+=.65;}if(maxY-minY<.2){minY-=.55;maxY+=.55;}
  const inner={x:panelX+13,y:panelY+27,w:panelW-26,h:panelH-39};
  const scale=Math.min(inner.w/(maxX-minX),inner.h/(maxY-minY));
  const P=i=>({x:inner.x+(inner.w-(maxX-minX)*scale)/2+(pos.get(i).x-minX)*scale,y:inner.y+(inner.h-(maxY-minY)*scale)/2+(pos.get(i).y-minY)*scale});
  for(const e of g.edges){
    let a=P(e.a),b=P(e.b);
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
    const trimA=types[e.a]==="C"?0:(g.hydroxyl.has(e.a)?13:9);
    const trimB=types[e.b]==="C"?0:(g.hydroxyl.has(e.b)?13:9);
    a={x:a.x+ux*trimA,y:a.y+uy*trimA};b={x:b.x-ux*trimB,y:b.y-uy*trimB};
    drawSkeletalBond(a.x,a.y,b.x,b.y,e.order,e.order>1?skeletalAuxiliarySide(e,g,P):1);
  }
  for(const i of g.nodes){
    if(types[i]==="C")continue;
    const q=P(i),label=g.hydroxyl.has(i)?"OH":types[i];
    ctx.fillStyle=types[i]==="O"?"#ff666d":"#f2f3f5";ctx.font="800 15px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(label,q.x,q.y);
  }
  ctx.restore();
};
