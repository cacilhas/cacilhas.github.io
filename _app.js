"use strict"

const express = require("express")
let app = express()
app.use(express.static(__dirname))
app.listen(9000)
console.log("http://localhost:9000/")
