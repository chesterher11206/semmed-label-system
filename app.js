const express = require("express");
const history = require('connect-history-api-fallback');
const proxyMiddleware = require('http-proxy-middleware');

let app = express();
app.use(history());
app.use(express.static(__dirname + "/dist"));

// Proxy
let serverProxy = proxyMiddleware('/server', {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    pathRewrite: {
        '^/server': ''
    }
});
app.use(serverProxy);

app.get("/", function(req, res){
    res.sendFile(__dirname + '/dist/index.html');
});

app.listen(9999, function(){
    console.log("Start")
});