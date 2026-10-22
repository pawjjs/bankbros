const express = require("express");
const app = express();
const port = 3000;
class pokoj{
    constructor(id){
        this.id=id;
        this.maxliczbaGraczy = 5;
        this.gracze = [];
        this.status = "oczekujaca";
    }
};
const pokoje = [];
let id = 1;
app.get( '/',(req, res) => {
res.send('<h1>Witaj na naszej stronie</h1>');
});
app.get('/gra/new',(req, res) => {
    res.send('Tworzenie nowej gry');
    const nowyPokoj = new pokoj(id++);
    pokoje.push(nowyPokoj);
    nowyPokoj.gracze.push("Gracz1A");
});
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
    res.send(`Gra: ${req.params.id}`);
    naszpokoj.gracze.push(`Gracz${naszpokoj.gracze.length + 1}`);
});
app.get('/gra/:id/start',(req, res) => {
    const naszpokoj = pokoje.find(p => p.id == req.params.id);
    if(!naszpokoj){
        res.send('Gra nie istnieje');
        return;
    }
    if(naszpokoj.gracze.length < 2){
        res.send('Za mało graczy');
        return;
    }
    //res.send(`Gra: ${req.params.id} rozpoczęta`);
    naszpokoj.status = "rozpoczęta";
    res.send(`gracze: ${naszpokoj.gracze.join(", ")}`);
});

app.get('/instrukcja',(req, res) => {
    res.send('<h1>Instrukcja gry</h1>');
});
app.listen(port, () => {
    console.log("dziala")
});