'use strict';

require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const methodOverride=require('method-override');

const PORT = process.env.PORT || 2000;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);

app.use(cors());
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

app.get('/', homeHandler);
function homeHandler(req, res) {
    let url = 'https://digimon-api.vercel.app/api/digimon';
    superagent.get(url)
        .then((val) => {
            let arrUrl = val.body.map((val) => {
                return new Digimon(val);
            })
            res.render('pages/index', { data: arrUrl });
        })
}
function Digimon(val) {
    this.name = val.name || 'no name';
    this.img = val.img || 'no img';
    this.level = val.level || 'no level ';
}

app.get('/addDb', addDbHandler);
function addDbHandler(req, res) {
    let { name, img, level } = req.query;
    let sql = 'INSERT INTO tabless (name,img,level)VALUES($1,$2,$3);';
    let safeVals = [name, img, level];
    client.query(sql, safeVals)
        .then(() => {
            res.redirect('/selectData');
        })
}

app.get('/selectData', selectDataHandler);
function selectDataHandler(req, res) {
    let sql = 'SELECT * FROM tabless;';
    client.query(sql)
        .then((val) => {
            res.render('pages/favorite', { data: val.rows });
        })
}

app.get('/details/:view_id', detailsHandler);
function detailsHandler(req, res) {
    let param = req.params.view_id;
    let sql = 'SELECT * FROM tabless WHERE id=$1;';
    let safeVal = [param];
    client.query(sql, safeVal)
        .then((vals) => {
            res.render('pages/details', { val: vals.rows[0] });
        })
}

app.put('/update/:update_id', updateHandler);
function updateHandler(req, res) {
    let param = req.params.update_id;
    let {name,img,level}=req.body;
    let sql = 'UPDATE tabless SET name=$1,img=$2,level=$3 WHERE id=$4;';
    let safeVals = [name, img, level, param];
    client.query(sql, safeVals)
        .then(() => {
            res.redirect(`/details/${param}`)
        })
}

app.delete('/delete/:del_id',deleteHandler);
function deleteHandler(req,res){
    let param=req.params.del_id;
    let sql='DELETE FROM tabless WHERE id=$1;';
    let safeVal=[param];
    client.query(sql,safeVal)
    .then(()=>{
        res.redirect('/selectData');
    })
}

client.connect()
    .then(() => {
        app.listen(PORT, console.log(`run on port ${PORT}`));
    });

function notFoundHandler(req, res) {
    res.status(404).send('NOT FOUND 404');
}

function errorHandler(err, req, res) {
    res.status(500).send(err);
}

app.use('*', notFoundHandler);