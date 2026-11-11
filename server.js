import express from 'express';
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import {WebSocketServer} from "ws";
import Http from "http";

const app = express();
const port = 3000;
const server = Http.createServer(app);
const wss = new WebSocketServer({server});


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
        this.wlasciciel=false;
    }   
}

class pokoj{
    constructor(id){
        this.id=id;
        this.minliczbaGraczy = 1;//zmienic na 4 po testach
        this.maxliczbaGraczy = 8;
        this.gracze = [];
        this.status = "oczekujaca";
        this.maxRund = 5;//do testow na stale, pozniej ustawia wlasciciel
        this.runda = 0;
    }
};
const pokoje = [];
const AU = {};
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
    const nowyPokoj = new pokoj(id++);
    pokoje.push(nowyPokoj);
    const nazwaW= req.query.nazwa || `Gracz${nowyPokoj.gracze.length + 1}`;
    const wlasciciel =new gracz(`${nazwaW} (Właściciel)`);
    wlasciciel.wlasciciel = true;
    nowyPokoj.gracze.push(wlasciciel);
    res.send(`Tworzenie nowej gry, id=${nowyPokoj.id}`);
});

wss.on('connection', (client) => {
    client.send("Udało się połączyć z grą");
    console.log('Nowe połączenie gracza');
    client.on('message', (u) => {
        const o=String(u).split(",");
        console.log(`wiadomosc od klienta: ${o}`);
        const type=o[0];
        if(type=="dołączono"){
            const idp = o[1];
            const naszpokoj = pokoje.find(p => p.id == idp);
            if(!naszpokoj){
                client.send('Gra nie istnieje');
                return;
            }
            if(naszpokoj.gracze.length >= naszpokoj.maxliczbaGraczy){
                client.send('Brak miejsca');
                return;
            }
            if(naszpokoj.status != "oczekujaca"){
                client.send('Nie można dołączyć do gry');
                return;
            }
            const nazwaG = o[2] || `Gracz${naszpokoj.gracze.length + 1}`;
            const nGracz = new gracz(nazwaG);
            naszpokoj.gracze.push(nGracz);
            AU[nGracz.id] = client;
            client.send(`dołączono,pokoj=${naszpokoj.id},status=${naszpokoj.status},liczbagraczy=${naszpokoj.gracze.length},nazwa=${nazwaG}`);
            for(const g of naszpokoj.gracze){
                if(AU[g.id]){
                    AU[g.id].send(`Dołączył,nowygracz=${nGracz.nazwa}`);
                }
            }
        }

        if(type=="start"){
            const idp = o[1];
            const naszpokoj = pokoje.find(p => p.id == idp);
            if(!naszpokoj){
                client.send('Gra nie istnieje');
                return;
            }
            if(naszpokoj.gracze.length < naszpokoj.minliczbaGraczy){
                client.send('Za mało graczy');
                return;
            }
            if(naszpokoj.status != "oczekujaca"){
                client.send('Nie można rozpocząć gry');
                return;
            }
            const wlasciciel = naszpokoj.gracze.find(g => g.wlasciciel==true);
            if(client !== AU[wlasciciel.id]){
                client.send('Nie można rozpocząć gry, nie jesteś właścicielem');
                return;
            }
            naszpokoj.status = "rozpoczęta";
            for(const g of naszpokoj.gracze){
                if(AU[g.id]){
                    AU[g.id].send(`Start,gracze=${naszpokoj.gracze.map(n => n.nazwa).join(", ")}`);
                }
            }
            
            
        }   
        if(type=="runda"){
            const idp = o[1];
            const naszpokoj = pokoje.find(p => p.id == idp);
            if(!naszpokoj){
                client.send('Gra nie istnieje');
                return;
            }
            if(naszpokoj.status != "rozpoczęta"){
                client.send('Nie możesz uczestniczyć w tej rozgrywce');
                return;
            }
            naszpokoj.runda += 1;
            for(const g of naszpokoj.gracze){
                if(AU[g.id]){
                    if(naszpokoj.runda > naszpokoj.maxRund){
                        AU[g.id].send(`Koniec,aktualnarunda=${naszpokoj.runda}`);
                        naszpokoj.status = "zakończona";
                        return;
                    }
                    else{
                        AU[g.id].send(`Runda,aktualnarunda=${naszpokoj.runda}`);
                    }
                }
            }   
        } 
    })

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
server.listen(port, () => {
    console.log("dziala")
});