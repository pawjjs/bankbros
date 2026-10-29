import express from 'express';
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();
const port = 3000;

const swaggerSpec = swaggerJsdoc({
definition: {
openapi: "3.2.1",
info: {
title: "Karty przeciwko ludzkości API",
version: "1.0.0",
description: "API do gry Karty przeciwko ludzkości",
},
servers: [
{ url: "http://localhost:3000" }
]
},
apis: ["./server.js"],
});
app.use(
"/swaggerdoc",
swaggerUi.serve,
swaggerUi.setup(swaggerSpec)
);


let idg = 1;
class karta_biała{
    constructor(){
        this.treść=""
    }
}
class karta_czarna{
    constructor(){
        this.treść=""
    }
}
class gracz{
    constructor(nazwa){
        this.id = idg++;
        this.nazwa = nazwa;
        this.punkty=0;
        this.karty = [];
        this.rola="gracz";
    }   
}

class pokoj{
    constructor(id){
        this.id=id;
        this.minliczbaGraczy = 1;//zmienic na 4 po testach
        this.maxliczbaGraczy = 8;
        this.gracze = [];
        this.status = "oczekujaca";
    }
};
const pokoje = [];

let id = 1;
/**
 * @openapi
 * /:
 *   get:
 *     summary: Strona główna
 *     responses:
 *       200:
 *         description: OK
 */
app.get( '/',(req, res) => {
res.send('<h1>Witaj na naszej stronie</h1>');
});
/**
 * @openapi
 * /gra/new:
 *   get:
 *     summary: Nowa gra
 *     responses:
 *       200:
 *         description: OK
 */
app.get('/gra/new',(req, res) => {
    res.send('Tworzenie nowej gry');
    const nowyPokoj = new pokoj(id++);
    pokoje.push(nowyPokoj);
    const nazwaW= req.query.nazwa || `Gracz${nowyPokoj.gracze.length + 1}`;
    const wlasciciel =new gracz(`${nazwaW} (Właściciel)`);
    nowyPokoj.gracze.push(wlasciciel);
});

// trzeba dodac parametry do dokumentacji swaggera - id w path i ?nazwa gracza w query
/**
 * @openapi
 * /gra/:id:
 *   get:
 *     summary: Gra w serwisie
 *     responses:
 *       200:
 *         description: OK
 */
app.get('/gra/:id',(req, res) => {
    const naszpokoj = pokoje.find(p => p.id == req.params.id);
    if(!naszpokoj){
        res.send('Gra nie istnieje');
        return;
    }
    if(naszpokoj.gracze.length >= naszpokoj.maxliczbaGraczy){
        res.send('Brak miejsca');
        return;
    }
    if(naszpokoj.status != "oczekujaca"){
        res.send('Nie można dołączyć do gry');
        return;
    }

    const nazwaNowegoG= req.query.nazwa || `Gracz${naszpokoj.gracze.length + 1}`;
    const nowyGracz = new gracz(nazwaNowegoG);
    res.send(`Gra: ${req.params.id}`);
    naszpokoj.gracze.push(nowyGracz);
});
// dodac parametry
/**
 * @openapi
 * /gra/:id/start:
 *   get:
 *     summary: Rozpoczęcie gry
 *     responses:
 *       200:
 *         description: OK
 */
app.get('/gra/:id/start',(req, res) => {
    const naszpokoj = pokoje.find(p => p.id == req.params.id);
    if(!naszpokoj){
        res.send('Gra nie istnieje');
        return;
    }
    if(naszpokoj.gracze.length < naszpokoj.minliczbaGraczy){
        res.send('Za mało graczy');
        return;
    }
    //res.send(`Gra: ${req.params.id} rozpoczęta`);
    naszpokoj.status = "rozpoczęta";
    res.send(`gracze: ${naszpokoj.gracze.map(g => g.nazwa).join(", ")}`);
});
/**
 * @openapi
 * /instrukcja:
 *   get:
 *     summary: Instrukcja gry
 *     responses:
 *       200:
 *         description: OK
 */
app.get('/instrukcja',(req, res) => {
    res.send('<h1>Instrukcja gry</h1>');
});
app.listen(port, () => {
    console.log("dziala")
});
