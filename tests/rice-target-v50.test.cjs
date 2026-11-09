const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('../docs/gestures');
test('rice can be deposited throughout the visible receiving bowl, including its left and lower areas',()=>{
 for(const[x,y]of [[.30,.95],[.89,.95],[.595,.68],[.595,1.23],[.595,.95]]){let g=G.begin('portion',.28,.32);G.move(g,x,y);assert.equal(G.valid(g),true,`bowl point ${x},${y}`)}
 for(const[x,y]of [[.15,.95],[.98,1.4],[.595,1.5],[.3,.32]]){let g=G.begin('portion',.28,.32);G.move(g,x,y);assert.equal(G.valid(g),false,`outside point ${x},${y}`)}
});
